import { anthropic } from "@ai-sdk/anthropic";
import { streamText, tool } from "ai";
import { z } from "zod";
import { tavily, TavilyClient } from "@tavily/core";
import { PrismaClient } from "@prisma/client";

// Lazy initialization of Prisma to avoid connection issues
let _prisma: PrismaClient | null = null;
function getPrisma(): PrismaClient {
  if (!_prisma) {
    _prisma = new PrismaClient();
  }
  return _prisma;
}

// Lazy initialization of Tavily to avoid build-time errors
let _tavilyClient: TavilyClient | null = null;
function getTavilyClient(): TavilyClient {
  if (!_tavilyClient) {
    _tavilyClient = tavily({
      apiKey: process.env.TAVILY_API_KEY || "",
    });
  }
  return _tavilyClient;
}

// =============================================================================
// SNIPPET EXPANSION LOGIC (THE VAULT)
// =============================================================================
async function expandSnippets(
  content: string,
  userId: string
): Promise<{ expandedContent: string; usedSnippets: string[] }> {
  const usedSnippets: string[] = [];
  const triggerPattern = /\/[\w-]+/g;
  const potentialTriggers = content.match(triggerPattern);

  if (!potentialTriggers || potentialTriggers.length === 0) {
    return { expandedContent: content, usedSnippets };
  }

  const prisma = getPrisma();
  const snippets = await prisma.snippet.findMany({
    where: {
      userId,
      trigger: { in: potentialTriggers },
    },
  });

  const snippetMap = new Map(snippets.map((s) => [s.trigger, s.content]));
  let expandedContent = content;
  for (const [trigger, snippetContent] of snippetMap) {
    const regex = new RegExp(trigger.replace("/", "\\/"), "g");
    expandedContent = expandedContent.replace(regex, snippetContent);
    usedSnippets.push(trigger);
  }

  return { expandedContent, usedSnippets };
}

// =============================================================================
// PROJECT CONTEXT LOADER
// =============================================================================
async function getProjectContext(projectId: string | null): Promise<string> {
  if (!projectId) return "";

  const prisma = getPrisma();
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true, description: true, status: true },
  });

  if (!project) return "";

  return `\n\n## Proyecto Activo
**Proyecto:** ${project.name}
**Estado:** ${project.status}
${project.description ? `**Descripción:** ${project.description}` : ""}`;
}

// =============================================================================
// SMART QUERY DETECTION
// Detecta si la pregunta necesita búsqueda web obligatoria
// =============================================================================
function needsResearch(message: string): { required: boolean; topics: string[] } {
  const lowerMsg = message.toLowerCase();
  const topics: string[] = [];
  
  // Patrones que REQUIEREN búsqueda web
  const researchPatterns = [
    // Negocios y monetización
    { pattern: /ganar dinero|monetiz|vender|€|\$|ingresos|facturar/i, topic: "monetización y negocios online" },
    { pattern: /mejor (método|estrategia|forma|manera)/i, topic: "mejores prácticas actuales" },
    { pattern: /qué funciona|funciona (hoy|ahora|actualmente)/i, topic: "estrategias efectivas actuales" },
    { pattern: /casos? de (éxito|estudio)|ejemplo real/i, topic: "casos de éxito reales" },
    
    // AI Models / Influencers
    { pattern: /model(o|a) (con |de )?(ia|ai|inteligencia artificial)/i, topic: "AI models e influencers virtuales" },
    { pattern: /influencer virtual|avatar ia/i, topic: "creación de influencers IA" },
    { pattern: /onlyfans|fansly|contenido adult/i, topic: "plataformas de contenido premium" },
    
    // Calidad de imagen / Anti-detección IA
    { pattern: /realista|hiperrealista|foto real/i, topic: "generación de imágenes hiperrealistas" },
    { pattern: /sin defectos|sin artefactos|natural/i, topic: "eliminación de artefactos IA" },
    { pattern: /no (parecer|parezca) (ia|artificial)/i, topic: "anti-detección de IA" },
    { pattern: /flux|midjourney|stable diffusion/i, topic: "modelos de generación de imágenes" },
    
    // Marketing y ventas
    { pattern: /marketing|promocion|captacion|cliente/i, topic: "marketing digital" },
    { pattern: /redes sociales|instagram|twitter|tiktok/i, topic: "estrategias en redes sociales" },
  ];

  for (const { pattern, topic } of researchPatterns) {
    if (pattern.test(lowerMsg)) {
      topics.push(topic);
    }
  }

  return { required: topics.length > 0, topics };
}

// =============================================================================
// SYSTEM PROMPT - MODO EXPERTO EN AI MODELS & BUSINESS
// =============================================================================
const BASE_SYSTEM_PROMPT = `Mentor experto en AI Models, Flux/SDXL, monetización digital.

REGLA ÚNICA: Respuestas ULTRA-CORTAS. Máximo 150 palabras por mensaje.

FORMATO:
[Concepto en 1-2 oraciones]

**Acción:** [Qué hacer ahora - 1 línea]

¿Continúo? / ¿Más detalle? / ¿Ejemplo?

---

Si piden curso/aprender: Lista de 3-5 pasos. Una lección = un paso. Espera "ok" antes de seguir.

Si piden código: Solo el bloque esencial, sin explicaciones largas.

Si busco en web: 3 bullets máximo con lo relevante.

Español. Sin rodeos. Acción > teoría.`;

export async function POST(req: Request) {
  const { messages, knowledgeContext, projectId, userId } = await req.json();
  const currentUserId = userId || "default-user";

  // Process snippets
  interface IncomingMessage {
    role: "user" | "assistant";
    content: string;
    images?: string[];
  }

  let expandedMessages = [...(messages as IncomingMessage[])];
  const usedSnippetsList: string[] = [];

  if (expandedMessages.length > 0) {
    const lastMessage = expandedMessages[expandedMessages.length - 1];
    if (lastMessage.role === "user" && typeof lastMessage.content === "string") {
      const { expandedContent, usedSnippets } = await expandSnippets(
        lastMessage.content,
        currentUserId
      );
      
      if (usedSnippets.length > 0) {
        console.log(`[ComfyClaude] Expanded snippets: ${usedSnippets.join(", ")}`);
        usedSnippetsList.push(...usedSnippets);
        expandedMessages = [
          ...expandedMessages.slice(0, -1),
          { ...lastMessage, content: expandedContent },
        ];
      }
    }
  }

  // Detect if research is needed
  const lastUserMessage = expandedMessages.find((m) => m.role === "user")?.content || "";
  const { required: researchRequired, topics } = needsResearch(lastUserMessage);

  // Load project context
  const projectContext = await getProjectContext(projectId);

  // Build system messages with cache control
  const systemMessages = [
    {
      role: "system" as const,
      content: BASE_SYSTEM_PROMPT + projectContext,
      experimental_providerMetadata: {
        anthropic: { cacheControl: { type: "ephemeral" } },
      },
    },
  ];

  // Inject knowledge context
  if (knowledgeContext && knowledgeContext.length > 0) {
    systemMessages.push({
      role: "system" as const,
      content: `## Base de Conocimiento Inyectada\n\n${knowledgeContext}`,
      experimental_providerMetadata: {
        anthropic: { cacheControl: { type: "ephemeral" } },
      },
    });
  }

  // Add research instruction if needed
  if (researchRequired) {
    systemMessages.push({
      role: "system" as const,
      content: `⚠️ INSTRUCCIÓN ESPECIAL: La pregunta del usuario requiere información actualizada sobre: ${topics.join(", ")}.

DEBES usar web_search para buscar:
1. Datos actuales y casos de éxito recientes (2024-2025)
2. Números concretos (ingresos, conversiones, métricas)
3. Herramientas y plataformas que funcionan HOY

NO respondas solo con tu conocimiento base. BUSCA PRIMERO.`,
      experimental_providerMetadata: {
        anthropic: { cacheControl: { type: "ephemeral" } },
      },
    });
    console.log(`[ComfyClaude] Research mode activated for topics: ${topics.join(", ")}`);
  }

  // Add snippet usage info
  if (usedSnippetsList.length > 0) {
    systemMessages.push({
      role: "system" as const,
      content: `[System Note: Se expandieron snippets de La Bóveda: ${usedSnippetsList.join(", ")}]`,
      experimental_providerMetadata: {
        anthropic: { cacheControl: { type: "ephemeral" } },
      },
    });
  }

  // Process messages with vision support
  const processedMessages = expandedMessages.map((msg) => {
    if (msg.role === "user" && msg.images && msg.images.length > 0) {
      return {
        role: "user" as const,
        content: [
          { type: "text" as const, text: msg.content },
          ...msg.images.map((imageUrl: string) => ({
            type: "image" as const,
            image: imageUrl,
          })),
        ],
      };
    }
    return { role: msg.role as "user" | "assistant", content: msg.content };
  });

  const result = await streamText({
    model: anthropic("claude-opus-4-5-20251101"),
    messages: [...systemMessages, ...processedMessages],
    experimental_providerMetadata: {
      anthropic: {
        thinking: { type: "enabled", budgetTokens: 4096 }, // Token-efficient thinking
      },
    },
    tools: {
      // Enhanced Web Search Tool
      web_search: tool({
        description: `Búsqueda web. Usa para datos actuales, precios, casos de éxito.`,
        parameters: z.object({
          query: z
            .string()
            .describe("Query específica - incluye año (2024/2025) para resultados recientes"),
          searchDepth: z
            .enum(["basic", "advanced"])
            .optional()
            .describe("Usa 'advanced' para negocios y estrategias"),
        }),
        execute: async ({ query, searchDepth = "advanced" }) => {
          try {
            console.log(`[ComfyClaude] Web search: "${query}" (${searchDepth})`);
            const response = await getTavilyClient().search(query, {
              searchDepth: searchDepth as "basic" | "advanced",
              maxResults: 4, // Máximo 4 resultados para ser conciso
              includeAnswer: true,
            });
            return {
              answer: response.answer ?? "",
              results: response.results.map((r) => ({
                title: r.title,
                url: r.url,
                content: r.content?.slice(0, 400) ?? "", // Contenido reducido
              })),
            };
          } catch (error) {
            return {
              answer: "",
              results: [],
              error: "Web search failed",
              message: error instanceof Error ? error.message : "Unknown error",
            };
          }
        },
      }),
    },
    maxSteps: 8, // Más pasos para investigación completa
    onFinish: async (event) => {
      const metadata = event.experimental_providerMetadata?.anthropic as
        | {
            cacheCreationInputTokens?: number;
            cacheReadInputTokens?: number;
          }
        | undefined;
      if (metadata) {
        console.log("[ComfyClaude] Session Metrics:", {
          cacheCreationInputTokens: metadata.cacheCreationInputTokens ?? 0,
          cacheReadInputTokens: metadata.cacheReadInputTokens ?? 0,
          researchMode: researchRequired,
          topics: topics,
          snippetsUsed: usedSnippetsList,
        });
      }
    },
  });

  return result.toDataStreamResponse();
}
