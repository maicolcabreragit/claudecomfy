"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Mic } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { VoiceCatalog } from "../components/VoiceCatalog";
import { VoiceCompare } from "../components/VoiceCompare";
import { DEFAULT_VOICE_SETTINGS, type Voice, type VoiceSettings } from "../components/types";

export default function VoiceCatalogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [compareVoiceIds, setCompareVoiceIds] = useState<string[] | null>(null);
  const [voiceSettings] = useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS);

  // Load voices
  useEffect(() => {
    const loadVoices = async () => {
      try {
        const res = await fetch("/api/elevenlabs/voices");
        const data = await res.json();
        
        if (data.success) {
          setVoices(data.voices);
        }
      } catch (error) {
        console.error("Failed to load voices:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadVoices();
  }, []);

  // Handle voice selection
  const handleSelectVoice = (voiceId: string) => {
    setSelectedVoiceId(voiceId);
    
    // If we have a return URL, navigate back with selected voice
    if (returnTo) {
      const url = new URL(returnTo, window.location.origin);
      url.searchParams.set("voiceId", voiceId);
      router.push(url.pathname + url.search);
    }
  };

  // Handle comparison
  const handleCompare = (voiceIds: string[]) => {
    setCompareVoiceIds(voiceIds);
  };

  // Close comparison modal
  const closeCompare = () => {
    setCompareVoiceIds(null);
  };

  // Select from comparison
  const handleSelectFromCompare = (voiceId: string) => {
    handleSelectVoice(voiceId);
    closeCompare();
  };

  return (
    <div className="flex flex-col h-screen bg-surface-base">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-4 border-b border-surface-border bg-surface-elevated">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent-purple/20">
              <Mic className="h-5 w-5 text-accent-purple" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Catálogo de Voces
              </h1>
              <p className="text-sm text-zinc-500">
                Explora y compara voces en español para tu podcast
              </p>
            </div>
          </div>
        </div>

        {selectedVoiceId && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-400">
              Seleccionada: <strong className="text-foreground">
                {voices.find(v => v.voice_id === selectedVoiceId)?.name}
              </strong>
            </span>
            <Button
              variant="primary"
              onClick={() => router.back()}
            >
              Confirmar selección
            </Button>
          </div>
        )}
      </div>

      {/* Main content */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-accent-purple animate-spin" />
        </div>
      ) : (
        <VoiceCatalog
          voices={voices}
          selectedVoiceId={selectedVoiceId || undefined}
          onSelect={handleSelectVoice}
          onCompare={handleCompare}
          isLoading={isLoading}
          className="flex-1"
        />
      )}

      {/* Comparison modal */}
      {compareVoiceIds && (
        <VoiceCompare
          voices={voices}
          voiceIds={compareVoiceIds}
          settings={voiceSettings}
          onClose={closeCompare}
          onSelectVoice={handleSelectFromCompare}
        />
      )}
    </div>
  );
}
