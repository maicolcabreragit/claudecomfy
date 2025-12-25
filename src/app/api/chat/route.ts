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
    
    // AI Models / Influencers - AMPLIADO
    { pattern: /model(o|a) (con |de )?(ia|ai|inteligencia artificial)/i, topic: "AI models e influencers virtuales" },
    { pattern: /influencer virtual|avatar ia|personaje ia/i, topic: "creación de influencers IA" },
    { pattern: /onlyfans|fansly|patreon|contenido adult/i, topic: "plataformas de contenido premium" },
    { pattern: /nsfw|sfw|contenido exclusivo/i, topic: "estrategias de contenido premium" },
    
    // Generación de imágenes - AMPLIADO
    { pattern: /realista|hiperrealista|foto real|photorealistic/i, topic: "generación de imágenes hiperrealistas" },
    { pattern: /sin defectos|sin artefactos|natural|consistencia/i, topic: "eliminación de artefactos IA" },
    { pattern: /no (parecer|parezca) (ia|artificial)|indetectable/i, topic: "anti-detección de IA" },
    { pattern: /flux|midjourney|stable diffusion|sdxl|comfyui|runcomfy/i, topic: "modelos de generación de imágenes" },
    { pattern: /lora|embedding|checkpoint|modelo entrenado/i, topic: "modelos y fine-tuning" },
    { pattern: /workflow|nodo|node|flujo/i, topic: "workflows de ComfyUI" },
    
    // Aprendizaje y cursos - NUEVO
    { pattern: /aprender|enseñ|curso|tutorial|lección|módulo/i, topic: "recursos de aprendizaje actuales" },
    { pattern: /paso a paso|guía|cómo (empezar|comenzar)/i, topic: "guías prácticas actuales" },
    { pattern: /principiante|desde cero|básico/i, topic: "recursos para principiantes" },
    
    // Marketing y ventas
    { pattern: /marketing|promocion|captacion|cliente/i, topic: "marketing digital" },
    { pattern: /redes sociales|instagram|twitter|tiktok|reddit/i, topic: "estrategias en redes sociales" },
    { pattern: /precio|tarifa|cobrar|cuánto vale/i, topic: "precios y tarifas del mercado" },
  ];

  for (const { pattern, topic } of researchPatterns) {
    if (pattern.test(lowerMsg)) {
      topics.push(topic);
    }
  }

  return { required: topics.length > 0, topics };
}

// =============================================================================
// SYSTEM PROMPT - MENTOR AI MODELS → 5000€/MES
// =============================================================================
const BASE_SYSTEM_PROMPT = `Eres mi mentor personal para convertirme en experto creador de modelos AI realistas.
FECHA: ${new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}

🎯 MI OBJETIVO:
- Crear UNA modelo AI hiperrealista con identidad consistente
- Generar contenido profesional indistinguible de fotos reales
- Monetizar en OnlyFans/Fansly llegando a 5.000€/mes

⚡ REGLAS CRÍTICAS:
1. SIEMPRE busca info actual (web_search) sobre precios, estrategias, herramientas 2025
2. Enfoca TODO hacia el objetivo de 5K/mes - cada lección debe acercarme a eso
3. Prioriza técnicas probadas que generan ingresos reales

📚 MODO APRENDIZAJE:
- Lecciones de 100 palabras máximo
- 1 concepto = 1 mensaje
- Termina con acción práctica o "¿Siguiente paso?"
- Si hay práctica → dime qué capturar para verificar

🔥 ESTRUCTURA DEL CAMINO (guíame paso a paso):
1. FUNDAMENTOS: Flux/SDXL, ComfyUI, calidad fotorrealista
2. PERSONAJE: LoRA training, consistencia facial, identidad única
3. CONTENIDO: Poses, escenarios, variedad, calendario de publicación
4. PLATAFORMA: Setup OnlyFans/Fansly, precios, tiers
5. MARKETING: Reddit, Twitter, captación de suscriptores
6. ESCALA: Automatización, 5K/mes y más allá

💡 Cuando pregunte algo:
- Si es sobre técnica → busca métodos actuales que funcionan
- Si es sobre dinero → busca casos reales con números
- Si es sobre herramientas → recomienda solo las mejores 2025

Español. Sin rodeos. Cada mensaje me acerca a los 5K/mes.`;

export async function POST(req: Request) {
  const { messages, knowledgeContext, projectId, userId } = await req.json();
  const currentUserId = userId || "default-user";

  // Process snippets - handle both simple string content and content with parts
  interface ContentPart {
    type: "text" | "image";
    text?: string;
    image?: string;
  }

  interface IncomingMessage {
    role: "user" | "assistant";
    content: string | ContentPart[];
    experimental_attachments?: Array<{ url: string; contentType: string; name: string }>;
  }

  let expandedMessages = [...(messages as IncomingMessage[])];
  const usedSnippetsList: string[] = [];

  if (expandedMessages.length > 0) {
    const lastMessage = expandedMessages[expandedMessages.length - 1];
    // Get text content for snippet expansion
    const textContent = typeof lastMessage.content === "string" 
      ? lastMessage.content 
      : (lastMessage.content as ContentPart[]).find(p => p.type === "text")?.text || "";
    
    if (lastMessage.role === "user" && textContent) {
      const { expandedContent, usedSnippets } = await expandSnippets(
        textContent,
        currentUserId
      );
      
      if (usedSnippets.length > 0) {
        console.log(`[ComfyClaude] Expanded snippets: ${usedSnippets.join(", ")}`);
        usedSnippetsList.push(...usedSnippets);
        // Update content with expanded text
        if (typeof lastMessage.content === "string") {
          expandedMessages = [
            ...expandedMessages.slice(0, -1),
            { ...lastMessage, content: expandedContent },
          ];
        }
      }
    }
  }

  // Detect if research is needed
  const lastUserMessage = expandedMessages.find((m) => m.role === "user");
  const lastUserText = lastUserMessage 
    ? (typeof lastUserMessage.content === "string" 
        ? lastUserMessage.content 
        : (lastUserMessage.content as ContentPart[]).find(p => p.type === "text")?.text || "")
    : "";
  const { required: researchRequired, topics } = needsResearch(lastUserText);

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

  // Helper: Extract text from image using Vision OCR
  async function extractTextFromImage(imageUrl: string): Promise<string> {
    try {
      const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
      
      // Check if Vision API is configured
      if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.log("[ComfyClaude] No Vision credentials - skipping OCR");
        return "[Imagen adjunta - OCR no disponible]";
      }

      const { ImageAnnotatorClient } = await import("@google-cloud/vision");
      const client = new ImageAnnotatorClient();
      
      const [result] = await client.documentTextDetection({
        image: { content: base64Data },
      });

      const text = result.fullTextAnnotation?.text || "";
      console.log(`[ComfyClaude OCR] Extracted ${text.length} characters from image`);
      
      if (text.trim()) {
        return `[CAPTURA DE PANTALLA - Texto detectado:]
${text.slice(0, 2000)}${text.length > 2000 ? "... (truncado)" : ""}`;
      }
      
      return "[Imagen sin texto detectable]";
    } catch (error) {
      console.error("[ComfyClaude OCR] Error:", error);
      return "[Error procesando imagen]";
    }
  }

  // Process messages - convert images to OCR text (saves Claude tokens!)
  const processedMessages = await Promise.all(expandedMessages.map(async (msg) => {
    // Check for experimental_attachments (from Vercel AI SDK)
    if (msg.role === "user" && msg.experimental_attachments && msg.experimental_attachments.length > 0) {
      const textContent = typeof msg.content === "string" 
        ? msg.content 
        : (msg.content as ContentPart[]).find(p => p.type === "text")?.text || "";
      
      console.log(`[ComfyClaude] Processing ${msg.experimental_attachments.length} image(s) with OCR...`);
      
      // Extract text from each image using OCR
      const ocrTexts = await Promise.all(
        msg.experimental_attachments.map(attachment => extractTextFromImage(attachment.url))
      );
      
      // Combine user message with OCR results
      const combinedContent = [
        textContent,
        ...ocrTexts
      ].filter(Boolean).join("\n\n");
      
      return {
        role: "user" as const,
        content: combinedContent,
      };
    }
    
    // Handle already-formatted content (with parts)
    if (Array.isArray(msg.content)) {
      // Convert any image parts to text
      const parts = await Promise.all((msg.content as ContentPart[]).map(async (part) => {
        if (part.type === "image" && part.image) {
          const ocrText = await extractTextFromImage(part.image);
          return ocrText;
        }
        return part.text || "";
      }));
      return { role: msg.role as "user" | "assistant", content: parts.join("\n") };
    }
    
    // Simple text content
    return { role: msg.role as "user" | "assistant", content: msg.content as string };
  }));

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
