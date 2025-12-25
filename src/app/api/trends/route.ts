/**
 * Trend Radar API v2 - Google Custom Search + Tavily
 * GET /api/trends - Get recent trends
 * POST /api/trends - Fetch new trends from Google CSE
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, TrendCategory } from "@prisma/client";

let _prisma: PrismaClient | null = null;
function getPrisma(): PrismaClient {
  if (!_prisma) {
    _prisma = new PrismaClient();
  }
  return _prisma;
}

// Optimized search queries per category
const CATEGORY_SEARCHES: Record<TrendCategory, { query: string; dateRestrict?: string }[]> = {
  FLUX_TECHNIQUES: [
    { query: "flux ai tutorial workflow", dateRestrict: "w1" },
    { query: "flux lora training guide 2025", dateRestrict: "m1" },
  ],
  LORA_MODELS: [
    { query: "realistic lora model download", dateRestrict: "w1" },
    { query: "photorealistic face lora civitai", dateRestrict: "m1" },
  ],
  MONETIZATION: [
    { query: "AI model onlyfans earnings", dateRestrict: "m1" },
    { query: "virtual influencer income strategy", dateRestrict: "m1" },
  ],
  ANTI_DETECTION: [
    { query: "AI image undetectable realistic", dateRestrict: "m1" },
    { query: "photorealistic ai bypass detection", dateRestrict: "m1" },
  ],
  TOOLS: [
    { query: "comfyui workflow nodes 2025", dateRestrict: "w1" },
    { query: "runcomfy cloud features", dateRestrict: "m1" },
  ],
  NEWS: [
    { query: "AI influencer news", dateRestrict: "d7" },
    { query: "onlyfans ai content policy", dateRestrict: "m1" },
  ],
};

// Google Custom Search API call
async function googleSearch(query: string, dateRestrict?: string): Promise<Array<{
  title: string;
  snippet: string;
  link: string;
}>> {
  const cseId = process.env.GOOGLE_CSE_ID;
  const apiKey = process.env.GOOGLE_CSE_API_KEY;
  
  if (!cseId || !apiKey) {
    console.log("[Trends] Google CSE not configured");
    return [];
  }

  const params = new URLSearchParams({
    key: apiKey,
    cx: cseId,
    q: query,
    num: "5",
    ...(dateRestrict && { dateRestrict }),
  });

  try {
    const res = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`);
    const data = await res.json();
    
    if (data.error) {
      console.error("[Trends] Google CSE error:", data.error.message);
      return [];
    }
    
    return (data.items || []).map((item: { title: string; snippet: string; link: string }) => ({
      title: item.title,
      snippet: item.snippet,
      link: item.link,
    }));
  } catch (error) {
    console.error("[Trends] Fetch error:", error);
    return [];
  }
}

// GET - Retrieve stored trends
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") as TrendCategory | null;
    const limit = parseInt(searchParams.get("limit") || "20");

    const prisma = getPrisma();
    
    const trends = await prisma.trend.findMany({
      where: category ? { category } : undefined,
      orderBy: [{ heatScore: "desc" }, { fetchedAt: "desc" }],
      take: limit,
    });

    return NextResponse.json({ trends, count: trends.length });
  } catch (error) {
    console.error("[Trends] Error fetching:", error);
    return NextResponse.json({ error: "Failed to fetch trends" }, { status: 500 });
  }
}

// POST - Fetch new trends from Google Custom Search
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const categories = body.categories || Object.keys(CATEGORY_SEARCHES);
    
    const prisma = getPrisma();
    const results: Array<{ category: string; found: number }> = [];
    
    for (const category of categories) {
      const searches = CATEGORY_SEARCHES[category as TrendCategory];
      if (!searches) continue;
      
      let foundCount = 0;
      
      for (const { query, dateRestrict } of searches) {
        const searchResults = await googleSearch(query, dateRestrict);
        
        for (const result of searchResults) {
          // Check if already exists
          const existing = await prisma.trend.findFirst({
            where: { url: result.link },
          });
          
          if (!existing) {
            // Calculate heat score based on date restriction (newer = hotter)
            const heatScore = dateRestrict === "d7" ? 90 : 
                             dateRestrict === "w1" ? 75 : 
                             dateRestrict === "m1" ? 50 : 30;
            
            await prisma.trend.create({
              data: {
                title: result.title,
                description: result.snippet || "",
                url: result.link,
                source: new URL(result.link).hostname.replace("www.", ""),
                category: category as TrendCategory,
                heatScore,
                keywords: query.split(" ").filter(w => w.length > 3),
              },
            });
            foundCount++;
          }
        }
      }
      
      results.push({ category, found: foundCount });
    }
    
    const totalFound = results.reduce((acc, r) => acc + r.found, 0);
    console.log(`[Trends] Fetched ${totalFound} new trends via Google CSE`);
    
    return NextResponse.json({
      success: true,
      message: `Found ${totalFound} new trends`,
      results,
    });
  } catch (error) {
    console.error("[Trends] Fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch trends" }, { status: 500 });
  }
}
