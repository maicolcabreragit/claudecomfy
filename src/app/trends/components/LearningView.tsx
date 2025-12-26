"use client";

import { useState, useEffect, useRef } from "react";
import { type LearningData, CATEGORY_CONFIG } from "./types";
import { 
  ChevronDown, 
  ChevronRight, 
  Lightbulb, 
  Target,
  DollarSign,
  HelpCircle,
  FileText
} from "lucide-react";

interface LearningViewProps {
  data: LearningData;
  digestId?: string;
}

interface TocItem {
  id: string;
  title: string;
  level: number;
}

/**
 * LearningView - Enhanced reading experience with navigation
 * Uses prose-academy styling for long reading sessions
 */
export function LearningView({ data, digestId }: LearningViewProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeSection, setActiveSection] = useState<string>("");
  const contentRef = useRef<HTMLDivElement>(null);

  // Build TOC from content
  useEffect(() => {
    const items: TocItem[] = [
      { id: "summary", title: "Resumen", level: 0 }
    ];
    
    data.content.forEach((cat, i) => {
      const catId = `category-${i}`;
      items.push({
        id: catId,
        title: CATEGORY_CONFIG[cat.category]?.label || cat.category,
        level: 0
      });
      
      cat.trends.forEach((trend, j) => {
        items.push({
          id: `${catId}-trend-${j}`,
          title: trend.title.slice(0, 40) + (trend.title.length > 40 ? "..." : ""),
          level: 1
        });
      });
    });
    
    setTocItems(items);
    
    // Auto-expand all sections by default
    const allIds = new Set(items.map(item => item.id));
    setExpandedSections(allIds);
  }, [data]);

  // Track active section on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -80% 0px" }
    );

    const headings = contentRef.current?.querySelectorAll("[id^='category-'], [id='summary']");
    headings?.forEach((h) => observer.observe(h));

    return () => observer.disconnect();
  }, [data]);

  const toggleSection = (id: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSections(newExpanded);
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  // Highlight technical terms
  const highlightTerms = (text: string) => {
    const terms = ["LoRA", "SDXL", "Flux", "ComfyUI", "Stable Diffusion", "checkpoint", "workflow", "node", "API"];
    let result = text;
    terms.forEach(term => {
      const regex = new RegExp(`\\b(${term})\\b`, "gi");
      result = result.replace(regex, `<mark class="bg-accent-purple/20 text-accent-purple px-1 rounded">$1</mark>`);
    });
    return result;
  };

  return (
    <div className="flex gap-6">
      {/* Table of Contents - Sticky Sidebar */}
      <aside className="hidden lg:block w-56 shrink-0">
        <nav className="sticky top-4 p-3 bg-surface-elevated rounded-lg border border-surface-border max-h-[calc(100vh-6rem)] overflow-y-auto">
          <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-3">Contenido</h4>
          <ul className="space-y-1">
            {tocItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full text-left text-sm py-1 px-2 rounded transition-colors ${
                    item.level === 1 ? "pl-4 text-xs" : ""
                  } ${
                    activeSection === item.id
                      ? "bg-accent-purple/10 text-accent-purple"
                      : "text-zinc-400 hover:text-foreground hover:bg-surface-hover"
                  }`}
                >
                  {item.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div ref={contentRef} className="flex-1 prose-academy">
        {/* Summary Section */}
        <section id="summary" className="mb-8">
          <div className="p-5 bg-semantic-success/10 border border-semantic-success/30 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5 text-semantic-success" />
              <h2 className="text-lg font-bold text-semantic-success m-0">Resumen Ejecutivo</h2>
            </div>
            <div 
              className="text-zinc-300 whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: highlightTerms(data.summary) }}
            />
          </div>
        </section>

        {/* Categories */}
        {data.content.map((cat, i) => {
          const catId = `category-${i}`;
          const isExpanded = expandedSections.has(catId);
          
          return (
            <section key={catId} id={catId} className="mb-8">
              {/* Category Header */}
              <button
                onClick={() => toggleSection(catId)}
                className="w-full flex items-center gap-2 text-left group"
              >
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-zinc-500 group-hover:text-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-zinc-500 group-hover:text-foreground" />
                )}
                <h2 className="text-xl font-bold m-0">
                  {CATEGORY_CONFIG[cat.category]?.emoji}{" "}
                  {CATEGORY_CONFIG[cat.category]?.label || cat.category}
                </h2>
                <span className="ml-auto text-xs text-zinc-500">
                  {cat.trends.length} trends
                </span>
              </button>

              {/* Trends */}
              {isExpanded && (
                <div className="mt-4 space-y-4 pl-7">
                  {cat.trends.map((trend, j) => {
                    const trendId = `${catId}-trend-${j}`;
                    const isTrendExpanded = expandedSections.has(trendId);
                    
                    return (
                      <article
                        key={trendId}
                        id={trendId}
                        className="bg-surface-base border border-surface-border rounded-lg overflow-hidden hover:border-accent-purple/30 transition-colors"
                      >
                        {/* Trend Header */}
                        <button
                          onClick={() => toggleSection(trendId)}
                          className="w-full p-4 flex items-center gap-3 text-left hover:bg-surface-hover transition-colors"
                        >
                          {isTrendExpanded ? (
                            <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-zinc-500 shrink-0" />
                          )}
                          <h3 className="font-semibold text-foreground m-0">{trend.title}</h3>
                          {trend.url && (
                            <a
                              href={trend.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="ml-auto text-xs text-accent-purple hover:underline"
                            >
                              Fuente →
                            </a>
                          )}
                        </button>

                        {/* Trend Content */}
                        {isTrendExpanded && (
                          <div className="px-4 pb-4 space-y-4 border-t border-surface-border pt-4">
                            {/* Summary */}
                            <p 
                              className="text-zinc-300"
                              dangerouslySetInnerHTML={{ __html: highlightTerms(trend.summary) }}
                            />

                            {/* Key Takeaways */}
                            {trend.keyTakeaways?.length > 0 && (
                              <div className="p-3 bg-semantic-warning/10 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <Lightbulb className="h-4 w-4 text-semantic-warning" />
                                  <span className="text-sm font-semibold text-semantic-warning">Puntos Clave</span>
                                </div>
                                <ul className="list-disc list-inside text-sm text-zinc-300 space-y-1">
                                  {trend.keyTakeaways.map((point, k) => (
                                    <li key={k}>{point}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Practical Steps */}
                            {trend.practicalSteps?.length > 0 && (
                              <div className="p-3 bg-semantic-info/10 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <Target className="h-4 w-4 text-semantic-info" />
                                  <span className="text-sm font-semibold text-semantic-info">Pasos Prácticos</span>
                                </div>
                                <ol className="list-decimal list-inside text-sm text-zinc-300 space-y-1">
                                  {trend.practicalSteps.map((step, k) => (
                                    <li key={k}>{step}</li>
                                  ))}
                                </ol>
                              </div>
                            )}

                            {/* Monetization */}
                            {trend.monetizationAngle && (
                              <div className="p-3 bg-pink-500/10 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <DollarSign className="h-4 w-4 text-pink-400" />
                                  <span className="text-sm font-semibold text-pink-400">Monetización</span>
                                </div>
                                <p className="text-sm text-zinc-300">{trend.monetizationAngle}</p>
                              </div>
                            )}

                            {/* Questions */}
                            {trend.questionsToExplore?.length > 0 && (
                              <div className="p-3 bg-accent-purple/10 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <HelpCircle className="h-4 w-4 text-accent-purple" />
                                  <span className="text-sm font-semibold text-accent-purple">Para Investigar</span>
                                </div>
                                <ul className="list-disc list-inside text-sm text-zinc-300 space-y-1">
                                  {trend.questionsToExplore.map((q, k) => (
                                    <li key={k}>{q}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
