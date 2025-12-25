import { useState, useEffect } from "react";
import "./style.css";

function IndexPopup() {
  const [status, setStatus] = useState<"connected" | "disconnected" | "capturing">("disconnected");
  const [lastCapture, setLastCapture] = useState<string | null>(null);

  useEffect(() => {
    // Check connection status on mount
    chrome.runtime.sendMessage({ action: "getStatus" }, (response) => {
      if (response?.connected) {
        setStatus("connected");
      }
    });
  }, []);

  const handleCapture = async () => {
    setStatus("capturing");
    
    chrome.runtime.sendMessage({ action: "capture" }, (response) => {
      if (response?.success) {
        setLastCapture(response.image);
        setStatus("connected");
      } else {
        setStatus("disconnected");
      }
    });
  };

  return (
    <div className="w-80 p-4 bg-zinc-900 text-white">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-2 h-2 rounded-full ${status === "connected" ? "bg-green-500" : status === "capturing" ? "bg-yellow-500 animate-pulse" : "bg-red-500"}`} />
        <h1 className="text-lg font-bold text-purple-400">ComfyLink</h1>
      </div>

      <p className="text-sm text-zinc-400 mb-4">
        Captura tu pantalla y envíala al chat de ComfyClaude Academy.
      </p>

      <button
        onClick={handleCapture}
        disabled={status === "capturing"}
        className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
      >
        {status === "capturing" ? (
          <>
            <span className="animate-spin">⏳</span>
            Capturando...
          </>
        ) : (
          <>
            📸 Capturar Pantalla
          </>
        )}
      </button>

      {lastCapture && (
        <div className="mt-4">
          <p className="text-xs text-zinc-500 mb-1">Última captura:</p>
          <img 
            src={lastCapture} 
            alt="Last capture" 
            className="w-full rounded-lg border border-zinc-700"
          />
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-zinc-800">
        <p className="text-xs text-zinc-500">
          💡 Atajo: <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-400">Ctrl+Shift+S</kbd>
        </p>
      </div>
    </div>
  );
}

export default IndexPopup;
