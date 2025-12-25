/**
 * Claude.ai Export Parser
 * 
 * Parses exported JSON files from Claude.ai and extracts conversation
 * content into a markdown string for context injection.
 */

export interface ClaudeMessage {
  uuid: string;
  text: string;
  content?: Array<{ type: string; text?: string }>;
  sender: "human" | "assistant";
  created_at: string;
  updated_at: string;
}

export interface ClaudeConversation {
  uuid: string;
  name: string;
  created_at: string;
  updated_at: string;
  chat_messages: ClaudeMessage[];
}

export interface ParsedConversation {
  id: string;
  title: string;
  messageCount: number;
  createdAt: string;
  content: string; // Markdown formatted content
  charCount: number;
  estimatedTokens: number;
}

export interface ParseResult {
  conversations: ParsedConversation[];
  selectedConversation: ParsedConversation | null;
  totalCharacters: number;
  totalEstimatedTokens: number;
}

// Character limit for context (~50k tokens ≈ 200k chars)
const MAX_CONTEXT_CHARS = 200_000;

/**
 * Extract text content from a Claude message
 */
function extractMessageText(message: ClaudeMessage): string {
  // Try direct text field first
  if (message.text) {
    return message.text;
  }
  
  // Fall back to content array (newer export format)
  if (message.content && Array.isArray(message.content)) {
    return message.content
      .filter((block) => block.type === "text" && block.text)
      .map((block) => block.text)
      .join("\n");
  }
  
  return "";
}

/**
 * Convert a conversation to markdown format
 */
function conversationToMarkdown(conversation: ClaudeConversation): string {
  const lines: string[] = [];
  
  lines.push(`## ${conversation.name || "Untitled Conversation"}`);
  lines.push(`*Created: ${new Date(conversation.created_at).toLocaleDateString()}*`);
  lines.push("");
  
  for (const message of conversation.chat_messages) {
    const text = extractMessageText(message);
    if (!text.trim()) continue;
    
    const role = message.sender === "human" ? "**Human**" : "**Assistant**";
    lines.push(`${role}:`);
    lines.push(text);
    lines.push("");
  }
  
  return lines.join("\n");
}

/**
 * Parse Claude.ai export JSON file
 * 
 * @param jsonContent - Raw JSON string from the export file
 * @returns ParseResult with all conversations and the longest one selected
 */
export function parseClaudeExport(jsonContent: string): ParseResult {
  let data: ClaudeConversation[];
  
  try {
    const parsed = JSON.parse(jsonContent);
    
    // Handle different export formats
    if (Array.isArray(parsed)) {
      data = parsed;
    } else if (parsed.conversations) {
      data = parsed.conversations;
    } else if (parsed.chat_messages) {
      // Single conversation export
      data = [parsed as ClaudeConversation];
    } else {
      throw new Error("Unrecognized Claude export format");
    }
  } catch (error) {
    throw new Error(
      `Failed to parse JSON: ${error instanceof Error ? error.message : "Invalid JSON"}`
    );
  }
  
  // Process all conversations
  const conversations: ParsedConversation[] = data
    .filter((conv) => conv.chat_messages && conv.chat_messages.length > 0)
    .map((conv) => {
      const content = conversationToMarkdown(conv);
      return {
        id: conv.uuid,
        title: conv.name || "Untitled",
        messageCount: conv.chat_messages.length,
        createdAt: conv.created_at,
        content,
        charCount: content.length,
        estimatedTokens: Math.ceil(content.length / 4), // ~4 chars per token
      };
    })
    .sort((a, b) => b.messageCount - a.messageCount); // Sort by message count descending
  
  // Select the conversation with the most messages by default
  const selectedConversation = conversations[0] || null;
  
  return {
    conversations,
    selectedConversation,
    totalCharacters: conversations.reduce((sum, c) => sum + c.charCount, 0),
    totalEstimatedTokens: conversations.reduce((sum, c) => sum + c.estimatedTokens, 0),
  };
}

/**
 * Get context string from selected conversations
 * Truncates to MAX_CONTEXT_CHARS to stay within token limits
 * 
 * @param conversations - Array of parsed conversations to include
 * @returns Truncated markdown string safe for context injection
 */
export function getContextString(conversations: ParsedConversation[]): string {
  let result = "";
  let currentLength = 0;
  
  result += "# Knowledge Base Context\n";
  result += "*This context is from previous Claude.ai conversations*\n\n";
  result += "---\n\n";
  
  currentLength = result.length;
  
  for (const conv of conversations) {
    const convContent = conv.content + "\n\n---\n\n";
    
    if (currentLength + convContent.length > MAX_CONTEXT_CHARS) {
      // Truncate this conversation to fit
      const remaining = MAX_CONTEXT_CHARS - currentLength - 100; // Buffer for truncation message
      if (remaining > 500) {
        result += convContent.slice(0, remaining);
        result += "\n\n*[Content truncated due to token limit]*\n";
      }
      break;
    }
    
    result += convContent;
    currentLength += convContent.length;
  }
  
  return result;
}

/**
 * Parse and immediately get context string (convenience function)
 */
export function parseAndGetContext(jsonContent: string): {
  contextString: string;
  metadata: {
    conversationCount: number;
    selectedTitle: string;
    charCount: number;
    estimatedTokens: number;
  };
} {
  const result = parseClaudeExport(jsonContent);
  
  if (!result.selectedConversation) {
    return {
      contextString: "",
      metadata: {
        conversationCount: 0,
        selectedTitle: "",
        charCount: 0,
        estimatedTokens: 0,
      },
    };
  }
  
  const contextString = getContextString([result.selectedConversation]);
  
  return {
    contextString,
    metadata: {
      conversationCount: result.conversations.length,
      selectedTitle: result.selectedConversation.title,
      charCount: contextString.length,
      estimatedTokens: Math.ceil(contextString.length / 4),
    },
  };
}
