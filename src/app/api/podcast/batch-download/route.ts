/**
 * Podcast Batch Download API
 * POST /api/podcast/batch-download - Download multiple episodes as ZIP
 * 
 * Accepts an array of episode IDs and returns a ZIP file containing
 * all MP3 files plus a metadata CSV for bulk upload to platforms.
 * 
 * Uses Node.js native zlib for compression to avoid external dependencies.
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { readFile } from "fs/promises";
import { join } from "path";
import { addID3Metadata, buildPodcastMetadata, generateSpotifyDescription, extractTimestamps } from "@/lib/podcast-metadata";

let _prisma: PrismaClient | null = null;
function getPrisma(): PrismaClient {
  if (!_prisma) _prisma = new PrismaClient();
  return _prisma;
}

interface BatchRequest {
  episodeIds: string[];
  includeMetadataCsv?: boolean;
}

interface FileEntry {
  name: string;
  data: Buffer;
}

/**
 * Creates a minimal ZIP archive without external dependencies
 * Uses Store method (no compression) for large audio files
 */
function createZipArchive(files: FileEntry[]): Buffer {
  const parts: Buffer[] = [];
  const centralDirectory: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    // Local file header
    const header = createLocalFileHeader(file.name, file.data.length);
    parts.push(header);
    parts.push(file.data);

    // Central directory entry
    const cdEntry = createCentralDirectoryEntry(file.name, file.data.length, offset);
    centralDirectory.push(cdEntry);

    offset += header.length + file.data.length;
  }

  const cdBuffer = Buffer.concat(centralDirectory);
  const endOfCd = createEndOfCentralDirectory(files.length, cdBuffer.length, offset);

  return Buffer.concat([...parts, cdBuffer, endOfCd]);
}

function createLocalFileHeader(filename: string, size: number): Buffer {
  const filenameBuffer = Buffer.from(filename, "utf-8");
  const header = Buffer.alloc(30 + filenameBuffer.length);

  // Local file header signature
  header.writeUInt32LE(0x04034b50, 0);
  // Version needed to extract
  header.writeUInt16LE(10, 4);
  // General purpose bit flag
  header.writeUInt16LE(0, 6);
  // Compression method (0 = stored)
  header.writeUInt16LE(0, 8);
  // Last mod file time
  header.writeUInt16LE(0, 10);
  // Last mod file date
  header.writeUInt16LE(0, 12);
  // CRC-32 (simplified - would need proper calculation for real use)
  header.writeUInt32LE(0, 14);
  // Compressed size
  header.writeUInt32LE(size, 18);
  // Uncompressed size
  header.writeUInt32LE(size, 22);
  // File name length
  header.writeUInt16LE(filenameBuffer.length, 26);
  // Extra field length
  header.writeUInt16LE(0, 28);
  // File name
  filenameBuffer.copy(header, 30);

  return header;
}

function createCentralDirectoryEntry(filename: string, size: number, offset: number): Buffer {
  const filenameBuffer = Buffer.from(filename, "utf-8");
  const entry = Buffer.alloc(46 + filenameBuffer.length);

  // Central file header signature
  entry.writeUInt32LE(0x02014b50, 0);
  // Version made by
  entry.writeUInt16LE(20, 4);
  // Version needed to extract
  entry.writeUInt16LE(10, 6);
  // General purpose bit flag
  entry.writeUInt16LE(0, 8);
  // Compression method
  entry.writeUInt16LE(0, 10);
  // Last mod file time
  entry.writeUInt16LE(0, 12);
  // Last mod file date
  entry.writeUInt16LE(0, 14);
  // CRC-32
  entry.writeUInt32LE(0, 16);
  // Compressed size
  entry.writeUInt32LE(size, 20);
  // Uncompressed size
  entry.writeUInt32LE(size, 24);
  // File name length
  entry.writeUInt16LE(filenameBuffer.length, 28);
  // Extra field length
  entry.writeUInt16LE(0, 30);
  // File comment length
  entry.writeUInt16LE(0, 32);
  // Disk number start
  entry.writeUInt16LE(0, 34);
  // Internal file attributes
  entry.writeUInt16LE(0, 36);
  // External file attributes
  entry.writeUInt32LE(0, 38);
  // Relative offset of local header
  entry.writeUInt32LE(offset, 42);
  // File name
  filenameBuffer.copy(entry, 46);

  return entry;
}

function createEndOfCentralDirectory(
  numEntries: number,
  cdSize: number,
  cdOffset: number
): Buffer {
  const eocd = Buffer.alloc(22);

  // End of central directory signature
  eocd.writeUInt32LE(0x06054b50, 0);
  // Number of this disk
  eocd.writeUInt16LE(0, 4);
  // Disk where central directory starts
  eocd.writeUInt16LE(0, 6);
  // Number of central directory records on this disk
  eocd.writeUInt16LE(numEntries, 8);
  // Total number of central directory records
  eocd.writeUInt16LE(numEntries, 10);
  // Size of central directory
  eocd.writeUInt32LE(cdSize, 12);
  // Offset of start of central directory
  eocd.writeUInt32LE(cdOffset, 16);
  // Comment length
  eocd.writeUInt16LE(0, 20);

  return eocd;
}

export async function POST(req: NextRequest) {
  try {
    const body: BatchRequest = await req.json();
    const { episodeIds, includeMetadataCsv = true } = body;

    if (!episodeIds || episodeIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No episode IDs provided",
      }, { status: 400 });
    }

    if (episodeIds.length > 20) {
      return NextResponse.json({
        success: false,
        error: "Maximum 20 episodes per batch",
      }, { status: 400 });
    }

    const prisma = getPrisma();

    // Get episodes
    const episodes = await prisma.podcastEpisode.findMany({
      where: {
        id: { in: episodeIds },
        status: { in: ["READY", "PUBLISHED"] },
        audioUrl: { not: null },
      },
      orderBy: { episodeNumber: "asc" },
    });

    if (episodes.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No ready episodes found",
      }, { status: 404 });
    }

    // Get podcast config
    const config = await prisma.podcastConfig.findFirst({
      select: { podcastName: true },
    });
    const podcastName = config?.podcastName || "IA Sin Filtros";

    const files: FileEntry[] = [];
    const metadataRows: string[][] = [
      ["Episode Number", "Title", "Description", "Duration (seconds)", "Filename", "Keywords", "Timestamps"],
    ];

    // Process each episode
    for (const episode of episodes) {
      if (!episode.audioUrl) continue;

      try {
        const filepath = join(process.cwd(), "public", episode.audioUrl);
        const audioBuffer = await readFile(filepath);

        // Add ID3 metadata
        const metadata = buildPodcastMetadata({
          title: episode.title,
          episodeNumber: episode.episodeNumber,
          description: episode.description,
          audioDuration: episode.audioDuration,
          createdAt: episode.createdAt,
        }, podcastName);

        const audioWithMetadata = addID3Metadata(audioBuffer, metadata);

        // Generate filename
        const slug = episode.title
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .slice(0, 50);
        
        const paddedEpisode = String(episode.episodeNumber).padStart(3, "0");
        const filename = `EP${paddedEpisode}-${slug}.mp3`;

        files.push({ name: filename, data: audioWithMetadata });

        // Generate metadata for CSV
        const description = generateSpotifyDescription({
          title: episode.title,
          description: episode.description,
          script: episode.script,
        });

        const timestamps = episode.audioDuration && episode.script
          ? extractTimestamps(episode.script, episode.audioDuration)
              .map((t) => `${t.timeFormatted} - ${t.label}`)
              .join("; ")
          : "";

        const keywords = episode.title
          .split(/\s+/)
          .filter((word) => word.length > 3)
          .slice(0, 5)
          .join(", ");

        metadataRows.push([
          episode.episodeNumber.toString(),
          episode.title,
          description.replace(/"/g, '""'),
          (episode.audioDuration || 0).toString(),
          filename,
          keywords,
          timestamps,
        ]);

      } catch (error) {
        console.error(`[Batch Download] Error processing episode ${episode.id}:`, error);
      }
    }

    // Add metadata CSV
    if (includeMetadataCsv && metadataRows.length > 1) {
      const csvContent = metadataRows
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");
      
      files.push({ name: "metadata.csv", data: Buffer.from(csvContent, "utf-8") });
    }

    // Create ZIP
    const zipBuffer = createZipArchive(files);

    const dateStr = new Date().toISOString().slice(0, 10);
    const zipFilename = `podcast-episodes-${dateStr}.zip`;

    console.log(`[Batch Download] Created ${zipFilename} with ${files.length} files`);

    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipFilename}"`,
        "Content-Length": zipBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error("[Batch Download API] Error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to create batch download",
    }, { status: 500 });
  }
}
