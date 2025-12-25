"use client";

import { useState, useCallback } from "react";
import { KnowledgeSidebar } from "@/components/chat/KnowledgeSidebar";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ProjectSelector } from "@/components/chat/ProjectSelector";
import { SnippetManager } from "@/components/chat/SnippetManager";
import { ConversationList } from "@/components/chat/ConversationList";
import { Archive, ChevronDown, ChevronUp, Sparkles } from "lucide-react";

/**
 * ComfyClaude OS - Chat Page
 * 
 * Layout interno del chat con panel de contexto:
 * - Panel izquierdo: Conversaciones + Knowledge Base + Proyecto
 * - Panel derecho: Chat principal
 */
export default function Home() {
  const [knowledgeContext, setKnowledgeContext] = useState<string>("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showKnowledge, setShowKnowledge] = useState(false);

  const handleNewConversation = useCallback(() => {
    setConversationId(null);
  }, []);

  const handleSelectConversation = useCallback((id: string | null) => {
    setConversationId(id);
  }, []);

  return (
    <div className="flex h-full">
      {/* Chat Context Panel */}
      <div className="w-64 border-r border-surface-border flex flex-col bg-surface-base">
        {/* Conversations */}
        <div className="flex-1 overflow-hidden">
          <ConversationList
            key={refreshKey}
            projectId={projectId}
            selectedConversationId={conversationId}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
          />
        </div>

        {/* Knowledge Base Toggle */}
        <div className="border-t border-surface-border">
          <button
            onClick={() => setShowKnowledge(!showKnowledge)}
            className="w-full px-3 py-2 flex items-center justify-between text-xs font-medium text-zinc-500 uppercase tracking-wider hover:bg-surface-elevated transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              Conocimiento
            </span>
            {showKnowledge ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
          {showKnowledge && (
            <div className="max-h-40 overflow-y-auto border-t border-surface-border-subtle">
              <KnowledgeSidebar
                contextString={knowledgeContext}
                onContextChange={setKnowledgeContext}
              />
            </div>
          )}
        </div>

        {/* Bottom: Project + Vault */}
        <div className="p-3 border-t border-surface-border space-y-2">
          <ProjectSelector
            selectedProjectId={projectId}
            onProjectChange={(id) => {
              setProjectId(id);
              setConversationId(null);
            }}
          />

          <button
            onClick={() => setIsVaultOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-elevated border border-surface-border hover:border-accent-purple/30 transition-colors text-sm"
          >
            <Archive className="h-4 w-4 text-accent-purple" />
            <span>La Bóveda</span>
          </button>
        </div>
      </div>

      {/* Main Chat */}
      <ChatInterface
        key={conversationId || "new"}
        knowledgeContext={knowledgeContext}
        projectId={projectId}
        conversationId={conversationId}
        onConversationCreated={(id) => {
          setConversationId(id);
          setRefreshKey((k) => k + 1);
        }}
        className="flex-1"
      />

      {/* Vault Modal */}
      <SnippetManager isOpen={isVaultOpen} onClose={() => setIsVaultOpen(false)} />
    </div>
  );
}

