/**
 * AnnotationEditorUI - React component for the annotation editor overlay
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  AnnotationEditor,
  Tool,
  COLORS,
  STROKE_WIDTHS,
  ColorKey,
  StrokeKey,
} from "~lib/annotation-editor";

interface AnnotationEditorUIProps {
  image: string;
  onSave: (annotatedImage: string) => void;
  onCancel: () => void;
}

const TOOL_ICONS: Record<Tool, string> = {
  select: "↖",
  arrow: "→",
  rect: "□",
  circle: "○",
  text: "T",
  draw: "✏️",
};

const COLOR_LABELS: Record<ColorKey, string> = {
  red: "🔴",
  yellow: "🟡",
  green: "🟢",
  blue: "🔵",
  white: "⚪",
};

const STROKE_LABELS: Record<StrokeKey, string> = {
  thin: "─",
  medium: "▬",
  thick: "█",
};

export function AnnotationEditorUI({ image, onSave, onCancel }: AnnotationEditorUIProps) {
  const [editor, setEditor] = useState<AnnotationEditor | null>(null);
  const [currentTool, setCurrentTool] = useState<Tool>("arrow");
  const [currentColor, setCurrentColor] = useState<ColorKey>("red");
  const [currentStroke, setCurrentStroke] = useState<StrokeKey>("medium");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize editor
  useEffect(() => {
    if (!canvasRef.current) return;

    const newEditor = new AnnotationEditor({
      image,
      containerId: canvasRef.current.id,
      onSave: (annotatedImage) => {
        onSave(annotatedImage);
      },
      onCancel: () => {
        onCancel();
      },
    });

    setEditor(newEditor);
    newEditor.setTool("arrow");
    newEditor.setColor(COLORS.red);

    return () => {
      newEditor.destroy();
    };
  }, [image, onSave, onCancel]);

  // Update undo/redo status periodically
  useEffect(() => {
    if (!editor) return;
    
    const interval = setInterval(() => {
      setCanUndo(editor.canUndo());
      setCanRedo(editor.canRedo());
    }, 200);

    return () => clearInterval(interval);
  }, [editor]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editor) return;

      // ESC to cancel
      if (e.key === "Escape") {
        onCancel();
        return;
      }

      // Ctrl+Z to undo
      if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        editor.undo();
        return;
      }

      // Ctrl+Shift+Z or Ctrl+Y to redo
      if ((e.ctrlKey && e.shiftKey && e.key === "z") || (e.ctrlKey && e.key === "y")) {
        e.preventDefault();
        editor.redo();
        return;
      }

      // Delete or Backspace to delete selected
      if (e.key === "Delete" || e.key === "Backspace") {
        // Don't delete if typing in text
        const activeElement = document.activeElement;
        if (activeElement?.tagName === "TEXTAREA" || activeElement?.tagName === "INPUT") return;
        editor.deleteSelected();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editor, onCancel]);

  const handleToolChange = useCallback((tool: Tool) => {
    setCurrentTool(tool);
    editor?.setTool(tool);
  }, [editor]);

  const handleColorChange = useCallback((colorKey: ColorKey) => {
    setCurrentColor(colorKey);
    editor?.setColor(COLORS[colorKey]);
  }, [editor]);

  const handleStrokeChange = useCallback((strokeKey: StrokeKey) => {
    setCurrentStroke(strokeKey);
    editor?.setStrokeWidth(STROKE_WIDTHS[strokeKey]);
  }, [editor]);

  const handleUndo = useCallback(() => {
    editor?.undo();
  }, [editor]);

  const handleRedo = useCallback(() => {
    editor?.redo();
  }, [editor]);

  const handleSave = useCallback(() => {
    editor?.save();
  }, [editor]);

  // Styles
  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999999,
    fontFamily: "system-ui, -apple-system, sans-serif",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: "900px",
    padding: "12px 16px",
    backgroundColor: "#1e1e2e",
    borderRadius: "12px 12px 0 0",
    borderBottom: "1px solid rgba(168, 85, 247, 0.3)",
  };

  const canvasContainerStyle: React.CSSProperties = {
    backgroundColor: "#1e1e2e",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    maxWidth: "900px",
    maxHeight: "60vh",
    overflow: "auto",
  };

  const toolbarStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    width: "100%",
    maxWidth: "900px",
    padding: "12px 16px",
    backgroundColor: "#1e1e2e",
    borderTop: "1px solid rgba(168, 85, 247, 0.3)",
  };

  const footerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "12px",
    width: "100%",
    maxWidth: "900px",
    padding: "12px 16px",
    backgroundColor: "#1e1e2e",
    borderRadius: "0 0 12px 12px",
  };

  const buttonGroupStyle: React.CSSProperties = {
    display: "flex",
    gap: "4px",
  };

  const toolButtonStyle = (isActive: boolean): React.CSSProperties => ({
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: isActive ? "#7c3aed" : "#27272a",
    border: isActive ? "2px solid #a855f7" : "2px solid transparent",
    borderRadius: "8px",
    color: "white",
    fontSize: "16px",
    cursor: "pointer",
    transition: "all 0.15s",
  });

  const colorButtonStyle = (colorKey: ColorKey): React.CSSProperties => ({
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: currentColor === colorKey ? "#3f3f46" : "transparent",
    border: currentColor === colorKey ? "2px solid white" : "2px solid transparent",
    borderRadius: "50%",
    fontSize: "16px",
    cursor: "pointer",
    transition: "all 0.15s",
  });

  const actionButtonStyle = (primary: boolean): React.CSSProperties => ({
    padding: "10px 20px",
    background: primary ? "#7c3aed" : "#27272a",
    border: "none",
    borderRadius: "8px",
    color: "white",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.15s",
  });

  const historyButtonStyle = (enabled: boolean): React.CSSProperties => ({
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: enabled ? "#27272a" : "#1a1a1a",
    border: "none",
    borderRadius: "6px",
    color: enabled ? "white" : "#52525b",
    fontSize: "16px",
    cursor: enabled ? "pointer" : "not-allowed",
    opacity: enabled ? 1 : 0.5,
  });

  return (
    <div style={overlayStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span style={{ color: "#a855f7", fontWeight: "bold", fontSize: "16px" }}>
          🎨 Anotar Captura
        </span>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            style={historyButtonStyle(canUndo)}
            onClick={handleUndo}
            disabled={!canUndo}
            title="Deshacer (Ctrl+Z)"
          >
            ↶
          </button>
          <button
            style={historyButtonStyle(canRedo)}
            onClick={handleRedo}
            disabled={!canRedo}
            title="Rehacer (Ctrl+Shift+Z)"
          >
            ↷
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} style={canvasContainerStyle}>
        <canvas id="annotation-canvas" ref={canvasRef} />
      </div>

      {/* Toolbar */}
      <div style={toolbarStyle}>
        {/* Tools */}
        <div style={buttonGroupStyle}>
          {(Object.keys(TOOL_ICONS) as Tool[]).map((tool) => (
            <button
              key={tool}
              style={toolButtonStyle(currentTool === tool)}
              onClick={() => handleToolChange(tool)}
              title={tool.charAt(0).toUpperCase() + tool.slice(1)}
            >
              {TOOL_ICONS[tool]}
            </button>
          ))}
        </div>

        {/* Separator */}
        <div style={{ width: "1px", height: "24px", background: "#3f3f46" }} />

        {/* Colors */}
        <div style={buttonGroupStyle}>
          {(Object.keys(COLORS) as ColorKey[]).map((colorKey) => (
            <button
              key={colorKey}
              style={colorButtonStyle(colorKey)}
              onClick={() => handleColorChange(colorKey)}
              title={colorKey}
            >
              {COLOR_LABELS[colorKey]}
            </button>
          ))}
        </div>

        {/* Separator */}
        <div style={{ width: "1px", height: "24px", background: "#3f3f46" }} />

        {/* Stroke Width */}
        <div style={buttonGroupStyle}>
          {(Object.keys(STROKE_WIDTHS) as StrokeKey[]).map((strokeKey) => (
            <button
              key={strokeKey}
              style={toolButtonStyle(currentStroke === strokeKey)}
              onClick={() => handleStrokeChange(strokeKey)}
              title={strokeKey}
            >
              {STROKE_LABELS[strokeKey]}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={footerStyle}>
        <button
          style={actionButtonStyle(false)}
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button
          style={actionButtonStyle(true)}
          onClick={handleSave}
        >
          ✓ Guardar y Enviar
        </button>
      </div>

      {/* Help text */}
      <p style={{ color: "#71717a", fontSize: "11px", marginTop: "8px" }}>
        ESC: Cancelar | Ctrl+Z: Deshacer | Delete: Eliminar seleccionado
      </p>
    </div>
  );
}

export default AnnotationEditorUI;
