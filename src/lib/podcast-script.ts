/**
 * Podcast Script Generator
 * 
 * Generates professional podcast scripts optimized for:
 * - Audience retention (hooks, open loops, cliffhangers)
 * - Subtle conversion (value-first CTAs)
 * - Natural speech patterns (pauses, emphasis, transitions)
 * 
 * Target: Hispanic audience learning to monetize AI
 */

import Anthropic from "@anthropic-ai/sdk";

// =============================================================================
// Types
// =============================================================================

export interface TrendForScript {
  id: string;
  title: string;
  description: string;
  category: string;
  url?: string;
  heatScore?: number;
}

export interface PodcastConfigForScript {
  podcastName: string;
  introScript?: string;
  outroScript?: string;
  characterPhrases?: string[];
  targetDuration?: number; // seconds
}

export interface GenerateScriptOptions {
  trends: TrendForScript[];
  config: PodcastConfigForScript;
  episodeNumber: number;
  customInstructions?: string;
}

export interface GeneratedScript {
  title: string;
  script: string;
  sections: ScriptSection[];
  estimatedDuration: number; // seconds
  wordCount: number;
}

export interface ScriptSection {
  type: "intro" | "hook" | "content" | "value" | "outro";
  content: string;
  estimatedDuration: number;
}

// =============================================================================
// Constants
// =============================================================================

const WORDS_PER_MINUTE = 150; // Average speaking rate
const DEFAULT_PODCAST_NAME = "IA Sin Filtros";

// SSML-like markers for TTS
export const PAUSE_MARKERS = {
  short: '<break time="0.5s"/>',
  medium: '<break time="1s"/>',
  long: '<break time="1.5s"/>',
  section: '<break time="2s"/>',
};

// =============================================================================
// Prompt Templates
// =============================================================================

const SCRIPT_SYSTEM_PROMPT = `Eres un guionista experto en podcasts de tecnología para audiencias hispanas.
Tu especialidad es crear contenido que:
- Engancha desde el primer segundo
- Explica conceptos complejos de forma simple
- Mantiene la atención con open loops y mini-cliffhangers
- Genera curiosidad sin parecer sensacionalista
- Incluye CTAs sutiles sin parecer ventas

REGLAS DE FORMATO:
1. Usa <break time="Xs"/> para pausas naturales (0.5s, 1s, 1.5s, 2s)
2. Escribe en MAYÚSCULAS las palabras que deben enfatizarse
3. Usa "..." para pausas dramáticas cortas
4. No uses asteriscos, solo mayúsculas para énfasis
5. Escribe como si hablaras, no como si leyeras

TONO:
- Conversacional, como hablar con un amigo
- Entusiasta pero no exagerado
- Cercano, usa "tú" no "usted"
- Curioso, haz preguntas retóricas
- Práctico, siempre conecta con el beneficio real`;

function buildScriptPrompt(options: GenerateScriptOptions): string {
  const { trends, config, episodeNumber, customInstructions } = options;
  const podcastName = config.podcastName || DEFAULT_PODCAST_NAME;
  const targetMinutes = Math.round((config.targetDuration || 300) / 60);
  
  // Build trend list
  const trendList = trends.map((t, i) => `
${i + 1}. "${t.title}"
   Categoría: ${t.category}
   Descripción: ${t.description}
   ${t.url ? `URL: ${t.url}` : ""}
`).join("\n");

  // Character phrases for consistency
  const phrasesSection = config.characterPhrases?.length 
    ? `\nFRASES CARACTERÍSTICAS DEL SHOW (usa 1-2 de estas):
${config.characterPhrases.map(p => `- "${p}"`).join("\n")}`
    : "";

  return `Genera un script de podcast de ${targetMinutes} minutos para el episodio #${episodeNumber} de "${podcastName}".

TENDENCIAS/NOTICIAS A CUBRIR:
${trendList}

ESTRUCTURA OBLIGATORIA:

[INTRO] (30 segundos)
${config.introScript 
  ? `Usa esta intro personalizada:\n"${config.introScript}"\n\nY añade una transición natural.`
  : `- Saludo: "Hola, bienvenidos de vuelta a ${podcastName}"
- Identificador del show (qué es y para quién)
- Frase característica`}
<break time="1s"/>

[HOOK] (1 minuto)
- Open loop: pregunta intrigante o dato sorprendente sobre la noticia más impactante
- Roadmap: "Hoy vamos a hablar de [X], [Y], y al final te cuento [Z]"
- Crea expectativa sobre algo que revelarás al final
<break time="1.5s"/>

[CONTENIDO] (${targetMinutes - 3} minutos)
Para CADA noticia:
- CONTEXTO: ¿Qué pasó exactamente? (1-2 oraciones)
- EXPLICACIÓN: ¿Por qué importa? Explicado para principiantes
- ANÁLISIS: ¿Qué significa para alguien que quiere ganar dinero con IA?
- TRANSICIÓN: Mini open loop hacia la siguiente noticia
<break time="1s"/> entre noticias

[VALOR] (1-2 minutos)
- "Tip de la semana" o "Herramienta destacada" relacionada con las noticias
- Valor práctico y accionable
- CTA SUTIL: "Si quieres profundizar en esto, en la academia tenemos..." 
  (NO suenes como vendedor, solo menciona que existe más contenido)
<break time="1s"/>

[CIERRE] (30 segundos)
- Resumen en UNA frase de lo más importante
- Teaser del próximo episodio (crea curiosidad)
- Despedida característica
${config.outroScript ? `- Usa este outro: "${config.outroScript}"` : "- Despedida amigable y call to action para seguir el podcast"}
${phrasesSection}
${customInstructions ? `\nINSTRUCCIONES ADICIONALES:\n${customInstructions}` : ""}

IMPORTANTE:
- El script debe durar aproximadamente ${targetMinutes} minutos (~${targetMinutes * WORDS_PER_MINUTE} palabras)
- Incluye marcadores de pausa <break time="Xs"/>
- Usa MAYÚSCULAS para palabras que deben enfatizarse
- No uses asteriscos ni formato markdown
- Escribe SOLO el script, sin notas ni comentarios adicionales`;
}

// =============================================================================
// Script Generation
// =============================================================================

export async function generatePodcastScript(
  options: GenerateScriptOptions
): Promise<GeneratedScript> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = buildScriptPrompt(options);

  console.log(`[ScriptGen] Generating script for ${options.trends.length} trends...`);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    system: SCRIPT_SYSTEM_PROMPT,
  });

  // Extract text from response
  const scriptContent = response.content
    .filter(block => block.type === "text")
    .map(block => (block as { type: "text"; text: string }).text)
    .join("\n");

  // Parse sections from script
  const sections = parseScriptSections(scriptContent);
  
  // Calculate metrics
  const wordCount = countWords(scriptContent);
  const estimatedDuration = Math.round((wordCount / WORDS_PER_MINUTE) * 60);

  // Generate title from first trend
  const mainTrend = options.trends[0];
  const title = `EP${options.episodeNumber}: ${mainTrend.title.slice(0, 50)}${mainTrend.title.length > 50 ? "..." : ""}`;

  console.log(`[ScriptGen] Generated ${wordCount} words, ~${Math.round(estimatedDuration / 60)} min`);

  return {
    title,
    script: scriptContent,
    sections,
    estimatedDuration,
    wordCount,
  };
}

// =============================================================================
// Script Formatting & Parsing
// =============================================================================

/**
 * Parse script into sections based on [SECTION] markers
 */
function parseScriptSections(script: string): ScriptSection[] {
  const sections: ScriptSection[] = [];
  const sectionRegex = /\[(INTRO|HOOK|CONTENIDO|CONTENT|VALOR|VALUE|CIERRE|OUTRO)\]/gi;
  
  const matches = [...script.matchAll(sectionRegex)];
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const nextMatch = matches[i + 1];
    
    const startIndex = match.index! + match[0].length;
    const endIndex = nextMatch?.index || script.length;
    
    const content = script.slice(startIndex, endIndex).trim();
    const type = normalizeeSectionType(match[1]);
    const wordCount = countWords(content);
    
    sections.push({
      type,
      content,
      estimatedDuration: Math.round((wordCount / WORDS_PER_MINUTE) * 60),
    });
  }
  
  return sections;
}

function normalizeeSectionType(type: string): ScriptSection["type"] {
  const normalized = type.toUpperCase();
  switch (normalized) {
    case "INTRO": return "intro";
    case "HOOK": return "hook";
    case "CONTENIDO":
    case "CONTENT": return "content";
    case "VALOR":
    case "VALUE": return "value";
    case "CIERRE":
    case "OUTRO": return "outro";
    default: return "content";
  }
}

/**
 * Count words in text, ignoring SSML tags
 */
function countWords(text: string): number {
  // Remove SSML tags
  const cleanText = text.replace(/<[^>]+>/g, "");
  // Count words
  return cleanText.split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Estimate duration from word count
 */
export function estimateDuration(text: string): number {
  const words = countWords(text);
  return Math.round((words / WORDS_PER_MINUTE) * 60);
}

/**
 * Format duration as MM:SS
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Add intro/outro from config to script
 */
export function injectIntroOutro(
  script: string,
  config: PodcastConfigForScript
): string {
  let result = script;
  
  // If script doesn't start with intro marker, add config intro
  if (config.introScript && !result.includes("[INTRO]")) {
    result = `[INTRO]\n${PAUSE_MARKERS.short}\n${config.introScript}\n${PAUSE_MARKERS.medium}\n\n${result}`;
  }
  
  // If script doesn't end with outro marker, add config outro
  if (config.outroScript && !result.includes("[CIERRE]") && !result.includes("[OUTRO]")) {
    result = `${result}\n\n[CIERRE]\n${PAUSE_MARKERS.medium}\n${config.outroScript}`;
  }
  
  return result;
}

/**
 * Convert markdown emphasis to uppercase for TTS
 * **text** → TEXT
 * *text* → TEXT
 */
export function convertEmphasisToUppercase(script: string): string {
  // Bold: **text** → TEXT
  let result = script.replace(/\*\*([^*]+)\*\*/g, (_, text) => text.toUpperCase());
  // Italic: *text* → TEXT (single asterisks)
  result = result.replace(/\*([^*]+)\*/g, (_, text) => text.toUpperCase());
  return result;
}

/**
 * Clean script for TTS processing
 * - Remove section markers
 * - Normalize whitespace
 * - Ensure proper pause tags
 */
export function cleanScriptForTTS(script: string): string {
  let result = script;
  
  // Remove section markers like [INTRO], [HOOK], etc.
  result = result.replace(/\[(INTRO|HOOK|CONTENIDO|CONTENT|VALOR|VALUE|CIERRE|OUTRO)\]/gi, "");
  
  // Convert markdown emphasis
  result = convertEmphasisToUppercase(result);
  
  // Normalize break tags
  result = result.replace(/\s*<break\s+time="([^"]+)"\s*\/?>\s*/gi, 
    (_, time) => ` <break time="${time}"/> `);
  
  // Normalize whitespace
  result = result.replace(/\n{3,}/g, "\n\n");
  result = result.replace(/  +/g, " ");
  
  return result.trim();
}

// =============================================================================
// Validation
// =============================================================================

export interface ScriptValidation {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  metrics: {
    wordCount: number;
    estimatedDuration: number;
    sectionCount: number;
    hasPauses: boolean;
    hasEmphasis: boolean;
  };
}

export function validateScript(script: string): ScriptValidation {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  const wordCount = countWords(script);
  const estimatedDuration = Math.round((wordCount / WORDS_PER_MINUTE) * 60);
  const sections = parseScriptSections(script);
  const hasPauses = script.includes("<break");
  const hasEmphasis = /[A-ZÁÉÍÓÚÑ]{3,}/.test(script);
  
  // Check duration
  if (estimatedDuration < 180) { // Less than 3 minutes
    warnings.push("El script es muy corto (menos de 3 minutos)");
  }
  if (estimatedDuration > 900) { // More than 15 minutes
    warnings.push("El script es muy largo (más de 15 minutos)");
  }
  
  // Check sections
  if (sections.length < 3) {
    warnings.push("El script tiene pocas secciones definidas");
  }
  
  // Check for required elements
  if (!hasPauses) {
    warnings.push("El script no tiene marcadores de pausa");
  }
  
  if (!hasEmphasis) {
    warnings.push("El script no tiene palabras enfatizadas (MAYÚSCULAS)");
  }
  
  // Check for content
  if (wordCount < 100) {
    errors.push("El script es demasiado corto");
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    metrics: {
      wordCount,
      estimatedDuration,
      sectionCount: sections.length,
      hasPauses,
      hasEmphasis,
    },
  };
}
