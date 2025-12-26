/**
 * Learning Intent Detector
 * 
 * 3-layer detection system:
 * 1. Regex patterns (fast, ~1ms)
 * 2. Context filters (validation)
 * 3. Topic extraction (NLP-lite)
 * 
 * No API calls, runs entirely in frontend
 */

export interface LearningIntent {
  isLearning: boolean;
  confidence: number; // 0-1
  topic: string | null;
  rawMatch: string | null;
}

// LAYER 1: Strong regex patterns
// These must match the START of the message for high confidence

const STRONG_PATTERNS_ES: RegExp[] = [
  // "cómo puedo/debo/hago para..."
  /^(cómo|como)\s+(puedo|debo|hago para|se hace|hacer)\s+(.+)/i,
  // "enséñame/explícame..."
  /^(enséñame|enseñame|explícame|explicame|muéstrame|muestrame)\s+(a\s+)?(.+)/i,
  // "quiero aprender..."
  /^quiero\s+(aprender|entender|saber)\s+(a\s+|sobre\s+|de\s+)?(.+)/i,
  // "tutorial de/para..."
  /^tutorial\s+(de|para|sobre)\s+(.+)/i,
  // "cómo funciona..."
  /^(cómo|como)\s+funciona(n)?\s+(.+)/i,
  // "qué es y cómo..."
  /^(qué|que)\s+es\s+(.+)\s+y\s+(cómo|como)/i,
  // "necesito aprender..."
  /^necesito\s+(aprender|entender|saber)\s+(.+)/i,
];

const STRONG_PATTERNS_EN: RegExp[] = [
  // "how do/can/should I..."
  /^how\s+(do|can|should|would)\s+I\s+(.+)/i,
  // "teach me..."
  /^teach\s+me\s+(about\s+|how\s+to\s+)?(.+)/i,
  // "I want to learn..."
  /^I\s+want\s+to\s+(learn|understand|know)\s+(about\s+|how\s+to\s+)?(.+)/i,
  // "tutorial on/for..."
  /^tutorial\s+(on|for|about)\s+(.+)/i,
  // "explain..."
  /^(explain|show\s+me)\s+(how\s+to\s+)?(.+)/i,
  // "what is...and how..."
  /^what\s+is\s+(.+)\s+and\s+how/i,
  // "I need to learn..."
  /^I\s+need\s+to\s+(learn|understand)\s+(.+)/i,
];

// LAYER 2: Context filters (things that should NOT be learning)

const CLOSED_QUESTION_STARTS_ES = [
  /^(está|es|tiene|hay|existe|puedes|podrías)\s/i,
  /^(dame|dime|pásame)\s/i,
];

const CLOSED_QUESTION_STARTS_EN = [
  /^(is|are|do|does|did|have|has|can|could|would)\s+(it|this|that|there)\s/i,
  /^(give|send|tell)\s+me\s/i,
];

const COMMAND_PATTERNS = [
  /^\/\w+/,  // Slash commands
  /^(arregla|fix|debug|corrige)/i,
  /^(ejecuta|run|deploy)/i,
];

const MIN_MESSAGE_LENGTH = 15;
const MIN_TOPIC_WORDS = 2;

// Stopwords to remove when extracting topic
const STOPWORDS = new Set([
  // Spanish
  "a", "de", "en", "el", "la", "los", "las", "un", "una", "unos", "unas",
  "y", "o", "que", "para", "por", "con", "sin", "sobre", "como", "cómo",
  "hacer", "puedo", "debo", "quiero", "necesito", "aprender", "entender",
  // English
  "the", "a", "an", "to", "of", "in", "on", "for", "with", "and", "or",
  "how", "do", "can", "should", "would", "i", "me", "my", "about", "learn",
]);

/**
 * Main detection function
 */
export function detectLearningIntent(message: string): LearningIntent {
  const trimmed = message.trim();
  
  // Default result
  const noMatch: LearningIntent = {
    isLearning: false,
    confidence: 0,
    topic: null,
    rawMatch: null,
  };

  // LAYER 2a: Quick rejects
  if (trimmed.length < MIN_MESSAGE_LENGTH) {
    return noMatch;
  }

  // Check command patterns
  for (const pattern of COMMAND_PATTERNS) {
    if (pattern.test(trimmed)) {
      return noMatch;
    }
  }

  // Check closed questions (Spanish)
  for (const pattern of CLOSED_QUESTION_STARTS_ES) {
    if (pattern.test(trimmed)) {
      return noMatch;
    }
  }

  // Check closed questions (English)
  for (const pattern of CLOSED_QUESTION_STARTS_EN) {
    if (pattern.test(trimmed)) {
      return noMatch;
    }
  }

  // LAYER 1: Pattern matching
  let match: RegExpMatchArray | null = null;
  let confidence = 0;

  // Try Spanish patterns
  for (const pattern of STRONG_PATTERNS_ES) {
    match = trimmed.match(pattern);
    if (match) {
      confidence = 0.85;
      break;
    }
  }

  // Try English patterns if no Spanish match
  if (!match) {
    for (const pattern of STRONG_PATTERNS_EN) {
      match = trimmed.match(pattern);
      if (match) {
        confidence = 0.85;
        break;
      }
    }
  }

  if (!match) {
    return noMatch;
  }

  // LAYER 3: Extract topic from captured groups
  const rawMatch = match[0];
  const capturedGroups = match.slice(1).filter(g => g && g.length > 3);
  const lastGroup = capturedGroups[capturedGroups.length - 1] || "";
  
  const topic = extractTopic(lastGroup);
  
  // LAYER 2b: Validate topic quality
  if (!topic || topic.split(" ").length < MIN_TOPIC_WORDS) {
    // Lower confidence if topic is too short/unclear
    confidence = 0.5;
  }

  return {
    isLearning: confidence >= 0.7,
    confidence,
    topic: topic || lastGroup.trim(),
    rawMatch,
  };
}

/**
 * Extract clean topic from raw text
 */
function extractTopic(text: string): string {
  // Remove punctuation at end
  let cleaned = text.replace(/[?.!,;:]+$/, "").trim();
  
  // Split into words and filter
  const words = cleaned.split(/\s+/).filter(word => {
    const lower = word.toLowerCase();
    return (
      word.length > 2 &&
      !STOPWORDS.has(lower) &&
      !/^\d+$/.test(word)
    );
  });

  // Reconstruct topic
  return words.join(" ");
}

/**
 * Check if a topic is similar to an existing module
 * Simple word overlap check
 */
export function isSimilarTopic(topic1: string, topic2: string): boolean {
  const words1 = new Set(topic1.toLowerCase().split(/\s+/));
  const words2 = new Set(topic2.toLowerCase().split(/\s+/));
  
  let overlap = 0;
  for (const word of words1) {
    if (words2.has(word) && word.length > 3) {
      overlap++;
    }
  }
  
  // At least 2 significant words in common
  return overlap >= 2;
}
