"use client";

import { X, Download, Radio } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AudioPlayerProps {
  audioUrl: string;
  onClose: () => void;
  onDownload: () => void;
}

/**
 * AudioPlayer - Sticky audio player for podcasts
 */
export function AudioPlayer({ audioUrl, onClose, onDownload }: AudioPlayerProps) {
  return (
    <div className="sticky top-14 z-10 bg-gradient-to-r from-orange-900/90 to-red-900/90 backdrop-blur border-b border-orange-500/50 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center gap-4">
        <Radio className="h-5 w-5 text-orange-400" />
        <audio controls className="flex-1 h-8" src={audioUrl} />
        <Button variant="ghost" size="sm" leftIcon={Download} onClick={onDownload}>
          Descargar
        </Button>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white p-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
