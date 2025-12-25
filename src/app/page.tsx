"use client";

import { useState, useCallback } from "react";
import { KnowledgeSidebar } from "@/components/chat/KnowledgeSidebar";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ProjectSelector } from "@/components/chat/ProjectSelector";
import { SnippetManager } from "@/components/chat/SnippetManager";
import { ConversationList } from "@/components/chat/ConversationList";
import { Vault, Settings, ChevronDown, ChevronUp } from "lucide-react";

/**
 * ComfyClaude OS - Main Page
 * 
 * The Business Cockpit layout mejorado:
 * - Sidebar más organizado con secciones colapsables
 * - Knowledge Base compacto
 * - Chat principal
 */
export default function Home() {
  const [knowledgeContext, setKnowledgeContext] = useState<string>("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showKnowledge, setShowKnowledge] = useState(false);

  const handleNewConversation = useCallback(async () => {
    // Reset para nueva conversación (no crear en DB hasta primer mensaje)
    setConversationId(null);
  }, []);

  const handleSelectConversation = useCallback((id: string | null) => {
    setConversationId(id);
  }, []);

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      {/* Left Sidebar - Fixed width */}
      <div className="w-64 border-r border-zinc-800 flex flex-col bg-zinc-900/30">
        {/* Conversations List - Scrollable */}
        <div className="flex-1 overflow-hidden">
          <ConversationList
            key={refreshKey}
            projectId={projectId}
            selectedConversationId={conversationId}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
          />
        </div>

        {/* Knowledge Base - Collapsible */}
        <div className="border-t border-zinc-800">
          <button
            onClick={() => setShowKnowledge(!showKnowledge)}
            className="w-full px-3 py-2 flex items-center justify-between text-xs font-medium text-zinc-500 uppercase tracking-wider hover:bg-zinc-800/50 transition-colors"
          >
            <span>Base de Conocimiento</span>
            {showKnowledge ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
          {showKnowledge && (
            <div className="max-h-40 overflow-y-auto border-t border-zinc-800/50">
              <KnowledgeSidebar
                contextString={knowledgeContext}
                onContextChange={setKnowledgeContext}
              />
            </div>
          )}
        </div>

        {/* Bottom Controls - Compact */}
        <div className="p-3 border-t border-zinc-800 space-y-2">
          <ProjectSelector
            selectedProjectId={projectId}
            onProjectChange={(id) => {
              setProjectId(id);
              setConversationId(null);
            }}
          />

          <button
            onClick={() => setIsVaultOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 hover:bg-zinc-800 transition-colors text-sm"
          >
            <Vault className="h-4 w-4 text-purple-400" />
            <span>La Bóveda</span>
            <Settings className="h-3 w-3 ml-auto text-zinc-500" />
          </button>
        </div>
      </div>

      {/* Main Chat Interface */}
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
