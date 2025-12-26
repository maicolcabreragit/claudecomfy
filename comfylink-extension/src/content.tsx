import type { PlasmoCSConfig } from "plasmo";
import { useState, useEffect, useCallback } from "react";
import { startZoneCapture, type ZoneCaptureResult } from "~lib/zone-capture";
import { AnnotationEditorUI } from "~components/AnnotationEditorUI";

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: false,
};

/**
 * Floating overlay button for quick screenshot capture
 * Shows on all pages when extension is active
 */
function ComfyLinkOverlay() {
  const [visible, setVisible] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mode, setMode] = useState<"full" | "zone">("full");
  
  // Editor state
  const [editorImage, setEditorImage] = useState<string | null>(null);

  useEffect(() => {
    // Listen for messages from background
    const listener = (message: { action: string; image?: string; url?: string }) => {
      if (message.action === "screenshotReady") {
        setCapturing(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }
      if (message.action === "startZoneCapture") {
        handleZoneCapture();
      }
    };
    
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const handleCapture = async () => {
    setCapturing(true);
    chrome.runtime.sendMessage({ action: "capture" });
  };

  const handleZoneCapture = async () => {
    setVisible(false); // Hide overlay during zone capture
    const result = await startZoneCapture({ openEditor: true });
    
    if (result && result.openEditor) {
      // Open annotation editor
      setEditorImage(result.image);
    } else if (result) {
      // Direct send without editor
      sendImageToChat(result.image);
      setVisible(true);
    } else {
      setVisible(true);
    }
  };

  const sendImageToChat = useCallback((image: string) => {
    chrome.runtime.sendMessage({
      action: "sendZoneCapture",
      image,
      url: window.location.href,
    });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  }, []);

  const handleEditorSave = useCallback((annotatedImage: string) => {
    setEditorImage(null);
    setVisible(true);
    sendImageToChat(annotatedImage);
  }, [sendImageToChat]);

  const handleEditorCancel = useCallback(() => {
    setEditorImage(null);
    setVisible(true);
  }, []);

  // Show annotation editor if image is set
  if (editorImage) {
    return (
      <AnnotationEditorUI
        image={editorImage}
        onSave={handleEditorSave}
        onCancel={handleEditorCancel}
      />
    );
  }


  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          background: "#7c3aed",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999999,
          boxShadow: "0 4px 12px rgba(124, 58, 237, 0.4)",
        }}
      >
        <span style={{ fontSize: "20px" }}>📸</span>
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 999999,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #1e1e2e 0%, #2d1b4e 100%)",
          borderRadius: "16px",
          padding: "16px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
          border: "1px solid rgba(124, 58, 237, 0.3)",
          minWidth: "220px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <span style={{ color: "#a855f7", fontWeight: "bold", fontSize: "14px" }}>
            📸 ComfyLink
          </span>
          <button
            onClick={() => setVisible(false)}
            style={{
              background: "transparent",
              border: "none",
              color: "#71717a",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Mode selector */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <button
            onClick={() => setMode("full")}
            style={{
              flex: 1,
              padding: "6px",
              background: mode === "full" ? "#7c3aed" : "#27272a",
              border: "none",
              borderRadius: "6px",
              color: "white",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            🖥️ Completa
          </button>
          <button
            onClick={() => setMode("zone")}
            style={{
              flex: 1,
              padding: "6px",
              background: mode === "zone" ? "#7c3aed" : "#27272a",
              border: "none",
              borderRadius: "6px",
              color: "white",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            ✂️ Zona
          </button>
        </div>

        <button
          onClick={mode === "full" ? handleCapture : handleZoneCapture}
          disabled={capturing}
          style={{
            width: "100%",
            padding: "10px 16px",
            background: success ? "#22c55e" : capturing ? "#52525b" : "#7c3aed",
            border: "none",
            borderRadius: "8px",
            color: "white",
            fontWeight: "600",
            cursor: capturing ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "all 0.2s",
          }}
        >
          {success ? (
            <>✓ Enviado</>
          ) : capturing ? (
            <>⏳ Capturando...</>
          ) : mode === "full" ? (
            <>📸 Capturar</>
          ) : (
            <>✂️ Seleccionar zona</>
          )}
        </button>

        <p style={{ color: "#71717a", fontSize: "10px", marginTop: "8px", textAlign: "center" }}>
          Ctrl+Shift+S: Completa | Ctrl+Shift+Z: Zona
        </p>
      </div>
    </div>
  );
}

export default ComfyLinkOverlay;
