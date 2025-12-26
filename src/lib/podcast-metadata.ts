/**
 * ID3 Metadata Utilities for Podcast Episodes
 * 
 * Adds ID3v2 tags to MP3 files for podcast distribution.
 * Uses a simple approach that writes basic text frames.
 * 
 * Compatible with Spotify, Apple Podcasts, and other platforms.
 */

// ID3v2.3 Header and Frame structures

interface ID3Metadata {
  title: string;           // TIT2
  artist: string;          // TPE1 (podcast name)
  album: string;           // TALB (podcast name)
  year: string;            // TYER
  trackNumber: string;     // TRCK (episode number)
  genre: string;           // TCON (usually "Podcast")
  comment?: string;        // COMM (episode description)
  duration?: number;       // TLEN (milliseconds)
}

/**
 * Creates an ID3v2.3 header
 */
function createID3Header(size: number): Buffer {
  const header = Buffer.alloc(10);
  
  // ID3 identifier
  header.write("ID3", 0);
  
  // Version: ID3v2.3.0
  header.writeUInt8(3, 3); // Major version
  header.writeUInt8(0, 4); // Revision
  
  // Flags
  header.writeUInt8(0, 5);
  
  // Size (syncsafe integer - 4 bytes, 7 bits each)
  header.writeUInt8((size >> 21) & 0x7F, 6);
  header.writeUInt8((size >> 14) & 0x7F, 7);
  header.writeUInt8((size >> 7) & 0x7F, 8);
  header.writeUInt8(size & 0x7F, 9);
  
  return header;
}

/**
 * Creates an ID3v2.3 text frame
 */
function createTextFrame(frameId: string, text: string): Buffer {
  const textBuffer = Buffer.from(text, "utf-8");
  const frameSize = 1 + textBuffer.length; // 1 byte for encoding + text
  
  const frame = Buffer.alloc(10 + frameSize);
  
  // Frame ID (4 chars)
  frame.write(frameId, 0);
  
  // Frame size (4 bytes, big endian)
  frame.writeUInt32BE(frameSize, 4);
  
  // Flags (2 bytes)
  frame.writeUInt16BE(0, 8);
  
  // Text encoding (0 = ISO-8859-1, 3 = UTF-8)
  frame.writeUInt8(3, 10);
  
  // Text content
  textBuffer.copy(frame, 11);
  
  return frame;
}

/**
 * Creates a comment frame (COMM)
 */
function createCommentFrame(text: string, language = "spa"): Buffer {
  const textBuffer = Buffer.from(text, "utf-8");
  const frameSize = 1 + 3 + 1 + textBuffer.length; // encoding + lang + null + text
  
  const frame = Buffer.alloc(10 + frameSize);
  
  // Frame ID
  frame.write("COMM", 0);
  
  // Frame size
  frame.writeUInt32BE(frameSize, 4);
  
  // Flags
  frame.writeUInt16BE(0, 8);
  
  // Text encoding (UTF-8)
  frame.writeUInt8(3, 10);
  
  // Language (3 chars)
  frame.write(language.slice(0, 3), 11);
  
  // Short description (empty, null terminated)
  frame.writeUInt8(0, 14);
  
  // Comment text
  textBuffer.copy(frame, 15);
  
  return frame;
}

/**
 * Adds ID3v2 metadata to an MP3 buffer
 */
export function addID3Metadata(mp3Buffer: Buffer, metadata: ID3Metadata): Buffer {
  const frames: Buffer[] = [];
  
  // Title (TIT2)
  if (metadata.title) {
    frames.push(createTextFrame("TIT2", metadata.title));
  }
  
  // Artist (TPE1)
  if (metadata.artist) {
    frames.push(createTextFrame("TPE1", metadata.artist));
  }
  
  // Album (TALB)
  if (metadata.album) {
    frames.push(createTextFrame("TALB", metadata.album));
  }
  
  // Year (TYER)
  if (metadata.year) {
    frames.push(createTextFrame("TYER", metadata.year));
  }
  
  // Track number (TRCK)
  if (metadata.trackNumber) {
    frames.push(createTextFrame("TRCK", metadata.trackNumber));
  }
  
  // Genre (TCON)
  if (metadata.genre) {
    frames.push(createTextFrame("TCON", metadata.genre));
  }
  
  // Duration in ms (TLEN)
  if (metadata.duration) {
    frames.push(createTextFrame("TLEN", metadata.duration.toString()));
  }
  
  // Comment (COMM)
  if (metadata.comment) {
    frames.push(createCommentFrame(metadata.comment));
  }
  
  // Calculate total frames size
  const framesBuffer = Buffer.concat(frames);
  
  // Create header with frames size
  const header = createID3Header(framesBuffer.length);
  
  // Check if MP3 already has ID3 tag and strip it
  let mp3Data = mp3Buffer;
  if (mp3Buffer.slice(0, 3).toString() === "ID3") {
    // Parse existing header to find size
    const existingSize = 
      ((mp3Buffer[6] & 0x7F) << 21) |
      ((mp3Buffer[7] & 0x7F) << 14) |
      ((mp3Buffer[8] & 0x7F) << 7) |
      (mp3Buffer[9] & 0x7F);
    
    // Skip existing ID3 tag
    mp3Data = mp3Buffer.slice(10 + existingSize);
  }
  
  // Combine: new header + frames + mp3 data
  return Buffer.concat([header, framesBuffer, mp3Data]);
}

/**
 * Build metadata for a podcast episode
 */
export function buildPodcastMetadata(episode: {
  title: string;
  episodeNumber: number;
  description?: string | null;
  audioDuration?: number | null;
  createdAt: Date | string;
}, podcastName: string): ID3Metadata {
  const year = new Date(episode.createdAt).getFullYear().toString();
  
  return {
    title: episode.title,
    artist: podcastName,
    album: podcastName,
    year,
    trackNumber: episode.episodeNumber.toString(),
    genre: "Podcast",
    comment: episode.description || undefined,
    duration: episode.audioDuration ? episode.audioDuration * 1000 : undefined,
  };
}

/**
 * Generate Spotify-compatible episode description
 */
export function generateSpotifyDescription(episode: {
  title: string;
  description?: string | null;
  script: string;
  trendIds?: string[];
}, trends?: Array<{ title: string }>): string {
  const parts: string[] = [];
  
  // Title and description
  if (episode.description) {
    parts.push(episode.description);
  }
  
  // Topics covered
  if (trends && trends.length > 0) {
    parts.push(`\n📰 En este episodio hablamos de:`);
    trends.forEach((trend, i) => {
      parts.push(`${i + 1}. ${trend.title}`);
    });
  }
  
  // Call to action
  parts.push(`\n🎧 Síguenos para más contenido de IA`);
  
  // Character limit for Spotify is ~4000
  return parts.join("\n").slice(0, 4000);
}

/**
 * Extract timestamps from script sections
 */
export function extractTimestamps(script: string, totalDuration: number): Array<{
  label: string;
  timeMs: number;
  timeFormatted: string;
}> {
  const sections: Array<{ label: string; position: number }> = [];
  const sectionRegex = /\[(INTRO|HOOK|CONTENIDO|CONTENT|VALOR|VALUE|CIERRE|OUTRO)\]/gi;
  
  const matches = [...script.matchAll(sectionRegex)];
  const totalLength = script.length;
  
  matches.forEach((match) => {
    const label = formatSectionLabel(match[1]);
    const position = match.index! / totalLength;
    sections.push({ label, position });
  });
  
  return sections.map((section) => {
    const timeMs = Math.round(section.position * totalDuration * 1000);
    const totalSeconds = Math.round(timeMs / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    
    return {
      label: section.label,
      timeMs,
      timeFormatted: `${mins}:${secs.toString().padStart(2, "0")}`,
    };
  });
}

function formatSectionLabel(section: string): string {
  const labels: Record<string, string> = {
    INTRO: "Introducción",
    HOOK: "Gancho",
    CONTENIDO: "Contenido Principal",
    CONTENT: "Contenido Principal",
    VALOR: "Tip de la Semana",
    VALUE: "Tip de la Semana",
    CIERRE: "Cierre",
    OUTRO: "Cierre",
  };
  return labels[section.toUpperCase()] || section;
}
