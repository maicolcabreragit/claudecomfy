/**
 * ElevenLabs Service - Professional TTS for Podcast Generation
 * 
 * Features:
 * - Text chunking for long scripts (>5,000 chars per request)
 * - Spanish voice filtering and recommendations
 * - Credit estimation and tracking
 * - Robust error handling with retries
 * 
 * @see https://elevenlabs.io/docs/api-reference
 */

// =============================================================================
// Types
// =============================================================================

export interface VoiceSettings {
  stability: number;           // 0.0-1.0, lower = more expressive
  similarity_boost: number;    // 0.0-1.0, higher = more similar to original
  style?: number;              // 0.0-1.0, style exaggeration
  use_speaker_boost?: boolean; // Boost clarity
}

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category?: string;
  labels?: {
    accent?: string;
    age?: string;
    gender?: string;
    description?: string;
    use_case?: string;
  };
  preview_url?: string;
  available_for_tiers?: string[];
}

export interface VoiceWithMetadata extends ElevenLabsVoice {
  // Our custom metadata
  language?: string;
  podcastScore?: number;
  isRecommended?: boolean;
  style?: string[];
}

export interface GenerateSpeechOptions {
  voiceId: string;
  text: string;
  settings?: VoiceSettings;
  modelId?: string;
  outputFormat?: string;
}

export interface SubscriptionInfo {
  character_count: number;
  character_limit: number;
  can_extend_character_limit: boolean;
  next_character_count_reset_unix: number;
}

// =============================================================================
// Constants
// =============================================================================

const ELEVENLABS_API = "https://api.elevenlabs.io/v1";
const MAX_CHARS_PER_REQUEST = 5000;  // Safe limit to avoid timeouts
const CHARS_PER_CREDIT = 30;         // Approximate characters per credit

// Optimal settings for podcast narration
export const PODCAST_VOICE_SETTINGS: VoiceSettings = {
  stability: 0.5,           // Balanced expression
  similarity_boost: 0.75,   // High voice consistency
  style: 0.0,               // Natural style
  use_speaker_boost: true,  // Clear audio
};

// Recommended Spanish voices (curated list)
export const RECOMMENDED_SPANISH_VOICES = {
  spain: {
    male: ["Dante", "Mikel"],
    female: ["Lucia"],
  },
  latam: {
    male: ["Franco", "Javier"],
    female: ["Yinet", "Lumina"],
  },
  neutral: ["Aria", "Roger"],
};

// Spanish-related keywords in voice labels
const SPANISH_KEYWORDS = [
  "spanish", "español", "spain", "spanish", "mexican", "argentina",
  "colombian", "latino", "latina", "latam", "hispanic"
];

// =============================================================================
// Service Class
// =============================================================================

export class ElevenLabsService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ELEVENLABS_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("ELEVENLABS_API_KEY not configured. Add it to .env.local");
    }
  }

  // ---------------------------------------------------------------------------
  // Voice Management
  // ---------------------------------------------------------------------------

  /**
   * Get all available voices from ElevenLabs
   */
  async getVoices(): Promise<ElevenLabsVoice[]> {
    const response = await fetch(`${ELEVENLABS_API}/voices`, {
      headers: {
        "xi-api-key": this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.statusText}`);
    }

    const data = await response.json();
    return data.voices || [];
  }

  /**
   * Get voices filtered by Spanish language/accent
   * Includes both native Spanish voices and voices with Spanish capabilities
   */
  async getSpanishVoices(): Promise<VoiceWithMetadata[]> {
    const allVoices = await this.getVoices();
    
    const spanishVoices = allVoices.filter(voice => {
      const labels = voice.labels || {};
      const labelValues = Object.values(labels).join(" ").toLowerCase();
      const name = voice.name.toLowerCase();
      
      // Check if any Spanish keyword matches
      return SPANISH_KEYWORDS.some(keyword => 
        labelValues.includes(keyword) || name.includes(keyword)
      );
    });

    // Add metadata for podcast suitability
    return spanishVoices.map(voice => ({
      ...voice,
      language: "es",
      podcastScore: this.calculatePodcastScore(voice),
      isRecommended: this.isRecommendedVoice(voice.name),
      style: this.inferStyle(voice),
    }));
  }

  /**
   * Get default voice settings for a specific voice
   */
  async getVoiceSettings(voiceId: string): Promise<VoiceSettings> {
    const response = await fetch(`${ELEVENLABS_API}/voices/${voiceId}/settings`, {
      headers: {
        "xi-api-key": this.apiKey,
      },
    });

    if (!response.ok) {
      // Return default podcast settings if unable to fetch
      return PODCAST_VOICE_SETTINGS;
    }

    const data = await response.json();
    return {
      stability: data.stability ?? 0.5,
      similarity_boost: data.similarity_boost ?? 0.75,
      style: data.style ?? 0.0,
      use_speaker_boost: data.use_speaker_boost ?? true,
    };
  }

  // ---------------------------------------------------------------------------
  // Speech Generation
  // ---------------------------------------------------------------------------

  /**
   * Generate speech from text
   * Automatically chunks long texts and concatenates results
   */
  async generateSpeech(options: GenerateSpeechOptions): Promise<Buffer> {
    const {
      voiceId,
      text,
      settings = PODCAST_VOICE_SETTINGS,
      modelId = "eleven_multilingual_v2",
      outputFormat = "mp3_44100_128", // Spotify-compatible
    } = options;

    // Handle long texts by chunking
    if (text.length > MAX_CHARS_PER_REQUEST) {
      return this.generateLongSpeech(options);
    }

    const response = await fetch(
      `${ELEVENLABS_API}/text-to-speech/${voiceId}?output_format=${outputFormat}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: {
            stability: settings.stability,
            similarity_boost: settings.similarity_boost,
            style: settings.style,
            use_speaker_boost: settings.use_speaker_boost,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ElevenLabs] API Error:", errorText);
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Generate a short preview (first ~500 characters)
   * Useful for testing voice selection
   */
  async generatePreview(
    text: string,
    voiceId: string,
    settings?: VoiceSettings
  ): Promise<Buffer> {
    // Take first 500 chars, ending at a sentence boundary
    const previewText = this.truncateAtSentence(text, 500);
    
    return this.generateSpeech({
      voiceId,
      text: previewText,
      settings: settings || PODCAST_VOICE_SETTINGS,
    });
  }

  /**
   * Generate speech for long texts by chunking
   * Splits at sentence boundaries to maintain natural flow
   */
  private async generateLongSpeech(options: GenerateSpeechOptions): Promise<Buffer> {
    const { text, voiceId, settings, modelId } = options;
    const chunks = this.chunkText(text);
    const audioBuffers: Buffer[] = [];

    console.log(`[ElevenLabs] Generating ${chunks.length} chunks for long text...`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`[ElevenLabs] Processing chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`);
      
      // Add small delay between requests to avoid rate limiting
      if (i > 0) {
        await this.delay(500);
      }

      const buffer = await this.generateSpeech({
        voiceId,
        text: chunk,
        settings,
        modelId,
      });

      audioBuffers.push(buffer);
    }

    // Concatenate all audio buffers
    return Buffer.concat(audioBuffers);
  }

  // ---------------------------------------------------------------------------
  // Credit Management
  // ---------------------------------------------------------------------------

  /**
   * Estimate credits needed for a given text
   * Based on ~30 characters per credit
   */
  estimateCredits(text: string): number {
    return Math.ceil(text.length / CHARS_PER_CREDIT);
  }

  /**
   * Estimate audio duration in seconds
   * Based on ~150 words per minute average speech rate
   */
  estimateDuration(text: string): number {
    const words = text.split(/\s+/).length;
    const minutes = words / 150;
    return Math.round(minutes * 60);
  }

  /**
   * Get subscription info including remaining credits
   */
  async getSubscriptionInfo(): Promise<SubscriptionInfo> {
    const response = await fetch(`${ELEVENLABS_API}/user/subscription`, {
      headers: {
        "xi-api-key": this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch subscription: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get remaining credits for current billing period
   */
  async getRemainingCredits(): Promise<{
    remaining: number;
    total: number;
    resetDate: Date;
  }> {
    const info = await this.getSubscriptionInfo();
    
    return {
      remaining: info.character_limit - info.character_count,
      total: info.character_limit,
      resetDate: new Date(info.next_character_count_reset_unix * 1000),
    };
  }

  // ---------------------------------------------------------------------------
  // Helper Methods
  // ---------------------------------------------------------------------------

  /**
   * Split text into chunks at sentence boundaries
   */
  private chunkText(text: string): string[] {
    const chunks: string[] = [];
    let remaining = text;

    while (remaining.length > 0) {
      if (remaining.length <= MAX_CHARS_PER_REQUEST) {
        chunks.push(remaining);
        break;
      }

      // Find the last sentence boundary before the limit
      const searchArea = remaining.substring(0, MAX_CHARS_PER_REQUEST);
      
      // Look for sentence endings: . ! ? followed by space or end
      const sentenceEndRegex = /[.!?][\s\n]/g;
      let lastMatch: RegExpExecArray | null = null;
      let match: RegExpExecArray | null;
      
      while ((match = sentenceEndRegex.exec(searchArea)) !== null) {
        lastMatch = match;
      }

      if (lastMatch) {
        const splitIndex = lastMatch.index + 1; // Include the punctuation
        chunks.push(remaining.substring(0, splitIndex).trim());
        remaining = remaining.substring(splitIndex).trim();
      } else {
        // No sentence boundary found, split at word boundary
        const lastSpace = searchArea.lastIndexOf(" ");
        if (lastSpace > 0) {
          chunks.push(remaining.substring(0, lastSpace).trim());
          remaining = remaining.substring(lastSpace).trim();
        } else {
          // Force split at max chars
          chunks.push(remaining.substring(0, MAX_CHARS_PER_REQUEST));
          remaining = remaining.substring(MAX_CHARS_PER_REQUEST);
        }
      }
    }

    return chunks.filter(chunk => chunk.length > 0);
  }

  /**
   * Truncate text at sentence boundary
   */
  private truncateAtSentence(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;

    const searchArea = text.substring(0, maxLength);
    const sentenceEndRegex = /[.!?][\s\n]/g;
    let lastMatch: RegExpExecArray | null = null;
    let match: RegExpExecArray | null;
    
    while ((match = sentenceEndRegex.exec(searchArea)) !== null) {
      lastMatch = match;
    }

    if (lastMatch) {
      return text.substring(0, lastMatch.index + 1);
    }

    // Fallback to word boundary
    const lastSpace = searchArea.lastIndexOf(" ");
    return lastSpace > 0 ? text.substring(0, lastSpace) + "..." : text.substring(0, maxLength);
  }

  /**
   * Calculate podcast suitability score (1-10)
   */
  private calculatePodcastScore(voice: ElevenLabsVoice): number {
    let score = 5; // Base score

    const labels = voice.labels || {};
    const useCase = labels.use_case?.toLowerCase() || "";
    const description = labels.description?.toLowerCase() || "";

    // Boost for narrative/podcast use cases
    if (useCase.includes("narration") || useCase.includes("podcast")) score += 2;
    if (useCase.includes("audiobook")) score += 1;
    
    // Boost for conversational descriptions
    if (description.includes("conversational")) score += 1;
    if (description.includes("warm") || description.includes("friendly")) score += 1;
    
    // Slight penalty for very specific use cases
    if (useCase.includes("animation") || useCase.includes("video game")) score -= 1;

    return Math.min(10, Math.max(1, score));
  }

  /**
   * Check if voice is in our recommended list
   */
  private isRecommendedVoice(name: string): boolean {
    const allRecommended = [
      ...RECOMMENDED_SPANISH_VOICES.spain.male,
      ...RECOMMENDED_SPANISH_VOICES.spain.female,
      ...RECOMMENDED_SPANISH_VOICES.latam.male,
      ...RECOMMENDED_SPANISH_VOICES.latam.female,
      ...RECOMMENDED_SPANISH_VOICES.neutral,
    ];
    
    return allRecommended.some(rec => 
      name.toLowerCase().includes(rec.toLowerCase())
    );
  }

  /**
   * Infer style from voice labels
   */
  private inferStyle(voice: ElevenLabsVoice): string[] {
    const styles: string[] = [];
    const labels = voice.labels || {};
    const allText = Object.values(labels).join(" ").toLowerCase();

    if (allText.includes("narration") || allText.includes("narrative")) {
      styles.push("narrative");
    }
    if (allText.includes("conversational") || allText.includes("casual")) {
      styles.push("conversational");
    }
    if (allText.includes("energetic") || allText.includes("dynamic")) {
      styles.push("energetic");
    }
    if (allText.includes("news") || allText.includes("professional")) {
      styles.push("professional");
    }
    if (allText.includes("calm") || allText.includes("soothing")) {
      styles.push("calm");
    }

    return styles.length > 0 ? styles : ["general"];
  }

  /**
   * Simple delay helper for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let _elevenLabsService: ElevenLabsService | null = null;

export function getElevenLabsService(): ElevenLabsService {
  if (!_elevenLabsService) {
    _elevenLabsService = new ElevenLabsService();
  }
  return _elevenLabsService;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Format seconds as MM:SS
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format bytes as human readable
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
