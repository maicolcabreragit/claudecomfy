"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Info, Lightbulb, AlertTriangle, AlertCircle, Flame } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * MarkdownRenderer - Renderiza Markdown con soporte para:
 * - GitHub Flavored Markdown
 * - Alert blocks: [!NOTE], [!TIP], [!IMPORTANT], [!WARNING], [!CAUTION]
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  // Pre-process content to convert GitHub alert syntax
  const processedContent = processAlertBlocks(content);
  
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom blockquote to handle alerts
          blockquote: ({ children }) => {
            const childText = extractText(children);
            const alertMatch = childText.match(/^\[(![A-Z]+)\]/);
            
            if (alertMatch) {
              const alertType = alertMatch[1].toLowerCase().replace("!", "");
              const cleanContent = childText.replace(/^\[![A-Z]+\]\s*/, "");
              return <AlertBlock type={alertType} content={cleanContent} />;
            }
            
            return (
              <blockquote className="border-l-4 border-zinc-600 pl-4 italic text-zinc-400">
                {children}
              </blockquote>
            );
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}

// Process alert blocks before rendering
function processAlertBlocks(content: string): string {
  // Convert > [!NOTE] style blocks
  return content.replace(
    /^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n((?:>.*\n?)*)/gm,
    (_, type, body) => {
      const cleanBody = body.replace(/^>\s?/gm, "").trim();
      return `> [!${type}]\n> ${cleanBody}`;
    }
  );
}

// Extract text from React children
function extractText(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) {
    return children.map(extractText).join("");
  }
  if (children && typeof children === "object" && "props" in children) {
    return extractText((children as { props: { children: React.ReactNode } }).props.children);
  }
  return "";
}

// Alert Block Component
interface AlertBlockProps {
  type: string;
  content: string;
}

function AlertBlock({ type, content }: AlertBlockProps) {
  const config: Record<string, { icon: React.ReactNode; className: string; title: string }> = {
    note: {
      icon: <Info className="h-5 w-5" />,
      className: "alert-block alert-note",
      title: "Nota",
    },
    tip: {
      icon: <Lightbulb className="h-5 w-5" />,
      className: "alert-block alert-tip",
      title: "Consejo",
    },
    important: {
      icon: <AlertCircle className="h-5 w-5" />,
      className: "alert-block alert-important",
      title: "Importante",
    },
    warning: {
      icon: <AlertTriangle className="h-5 w-5" />,
      className: "alert-block alert-warning",
      title: "Advertencia",
    },
    caution: {
      icon: <Flame className="h-5 w-5" />,
      className: "alert-block alert-caution",
      title: "Precaución",
    },
  };

  const alertConfig = config[type] || config.note;

  return (
    <div className={alertConfig.className}>
      <div className="alert-icon">{alertConfig.icon}</div>
      <div className="alert-content">
        <div className="alert-title">{alertConfig.title}</div>
        <div className="text-sm text-zinc-300">{content}</div>
      </div>
    </div>
  );
}
