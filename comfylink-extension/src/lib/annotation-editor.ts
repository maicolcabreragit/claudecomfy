/**
 * Annotation Editor - Core logic using Fabric.js
 * Provides canvas-based image annotation with drawing tools
 */

import { fabric } from "fabric";

export type Tool = "select" | "arrow" | "rect" | "circle" | "text" | "draw";

export const COLORS = {
  red: "#ef4444",
  yellow: "#eab308",
  green: "#22c55e",
  blue: "#3b82f6",
  white: "#ffffff",
} as const;

export const STROKE_WIDTHS = {
  thin: 2,
  medium: 4,
  thick: 8,
} as const;

export type ColorKey = keyof typeof COLORS;
export type StrokeKey = keyof typeof STROKE_WIDTHS;

interface AnnotationEditorOptions {
  image: string;
  containerId: string;
  onSave: (image: string) => void;
  onCancel: () => void;
}

interface HistoryState {
  json: string;
}

export class AnnotationEditor {
  private canvas: fabric.Canvas;
  private options: AnnotationEditorOptions;
  private currentTool: Tool = "select";
  private currentColor: string = COLORS.red;
  private currentStrokeWidth: number = STROKE_WIDTHS.medium;
  
  // History for undo/redo
  private history: HistoryState[] = [];
  private historyIndex: number = -1;
  private isRestoring: boolean = false;

  // Arrow drawing state
  private isDrawingArrow: boolean = false;
  private arrowStartPoint: { x: number; y: number } | null = null;
  private tempLine: fabric.Line | null = null;

  // Shape drawing state
  private isDrawingShape: boolean = false;
  private shapeStartPoint: { x: number; y: number } | null = null;
  private tempShape: fabric.Object | null = null;

  constructor(options: AnnotationEditorOptions) {
    this.options = options;
    
    // Initialize canvas
    this.canvas = new fabric.Canvas(options.containerId, {
      isDrawingMode: false,
      selection: true,
      backgroundColor: "#1e1e2e",
    });

    // Load background image
    this.loadBackgroundImage(options.image);
    
    // Setup event listeners
    this.setupEventListeners();
  }

  private loadBackgroundImage(imageUrl: string): void {
    fabric.Image.fromURL(imageUrl, (img) => {
      if (!img.width || !img.height) return;

      // Scale image to fit within reasonable bounds
      const maxWidth = window.innerWidth * 0.8;
      const maxHeight = window.innerHeight * 0.7;
      
      let scale = 1;
      if (img.width > maxWidth) {
        scale = maxWidth / img.width;
      }
      if (img.height * scale > maxHeight) {
        scale = maxHeight / img.height;
      }

      const newWidth = img.width * scale;
      const newHeight = img.height * scale;

      this.canvas.setDimensions({ width: newWidth, height: newHeight });
      this.canvas.setBackgroundImage(img, this.canvas.renderAll.bind(this.canvas), {
        scaleX: scale,
        scaleY: scale,
      });

      // Save initial state
      this.saveState();
    }, { crossOrigin: "anonymous" });
  }

  private setupEventListeners(): void {
    // Object modified
    this.canvas.on("object:modified", () => {
      if (!this.isRestoring) this.saveState();
    });

    // Object added
    this.canvas.on("object:added", () => {
      if (!this.isRestoring) this.saveState();
    });

    // Mouse down for drawing shapes
    this.canvas.on("mouse:down", (opt) => this.handleMouseDown(opt));
    this.canvas.on("mouse:move", (opt) => this.handleMouseMove(opt));
    this.canvas.on("mouse:up", () => this.handleMouseUp());

    // Free drawing events
    this.canvas.on("path:created", () => {
      if (!this.isRestoring) this.saveState();
    });
  }

  private handleMouseDown(opt: fabric.IEvent<MouseEvent>): void {
    if (this.currentTool === "select" || this.currentTool === "draw") return;
    
    const pointer = this.canvas.getPointer(opt.e);
    
    if (this.currentTool === "arrow") {
      this.isDrawingArrow = true;
      this.arrowStartPoint = { x: pointer.x, y: pointer.y };
      
      // Create temporary line
      this.tempLine = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
        stroke: this.currentColor,
        strokeWidth: this.currentStrokeWidth,
        selectable: false,
        evented: false,
      });
      this.canvas.add(this.tempLine);
    }

    if (this.currentTool === "rect" || this.currentTool === "circle") {
      this.isDrawingShape = true;
      this.shapeStartPoint = { x: pointer.x, y: pointer.y };
      this.canvas.selection = false;

      if (this.currentTool === "rect") {
        this.tempShape = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: "transparent",
          stroke: this.currentColor,
          strokeWidth: this.currentStrokeWidth,
          selectable: false,
          evented: false,
        });
      } else {
        this.tempShape = new fabric.Ellipse({
          left: pointer.x,
          top: pointer.y,
          rx: 0,
          ry: 0,
          fill: "transparent",
          stroke: this.currentColor,
          strokeWidth: this.currentStrokeWidth,
          selectable: false,
          evented: false,
        });
      }
      this.canvas.add(this.tempShape);
    }

    if (this.currentTool === "text") {
      const text = new fabric.IText("Texto", {
        left: pointer.x,
        top: pointer.y,
        fill: this.currentColor,
        fontSize: 24,
        fontFamily: "system-ui, sans-serif",
        fontWeight: "bold",
      });
      this.canvas.add(text);
      this.canvas.setActiveObject(text);
      text.enterEditing();
      text.selectAll();
    }
  }

  private handleMouseMove(opt: fabric.IEvent<MouseEvent>): void {
    const pointer = this.canvas.getPointer(opt.e);

    // Arrow drawing
    if (this.isDrawingArrow && this.tempLine && this.arrowStartPoint) {
      this.tempLine.set({ x2: pointer.x, y2: pointer.y });
      this.canvas.renderAll();
    }

    // Shape drawing
    if (this.isDrawingShape && this.tempShape && this.shapeStartPoint) {
      const width = pointer.x - this.shapeStartPoint.x;
      const height = pointer.y - this.shapeStartPoint.y;

      if (this.currentTool === "rect") {
        const rect = this.tempShape as fabric.Rect;
        rect.set({
          left: width > 0 ? this.shapeStartPoint.x : pointer.x,
          top: height > 0 ? this.shapeStartPoint.y : pointer.y,
          width: Math.abs(width),
          height: Math.abs(height),
        });
      } else if (this.currentTool === "circle") {
        const ellipse = this.tempShape as fabric.Ellipse;
        ellipse.set({
          left: width > 0 ? this.shapeStartPoint.x : pointer.x,
          top: height > 0 ? this.shapeStartPoint.y : pointer.y,
          rx: Math.abs(width) / 2,
          ry: Math.abs(height) / 2,
        });
      }
      this.canvas.renderAll();
    }
  }

  private handleMouseUp(): void {
    // Finalize arrow
    if (this.isDrawingArrow && this.tempLine && this.arrowStartPoint) {
      this.canvas.remove(this.tempLine);
      
      const x1 = this.arrowStartPoint.x;
      const y1 = this.arrowStartPoint.y;
      const x2 = this.tempLine.x2!;
      const y2 = this.tempLine.y2!;

      // Only create if has some length
      if (Math.hypot(x2 - x1, y2 - y1) > 10) {
        this.addArrow(x1, y1, x2, y2);
      }

      this.isDrawingArrow = false;
      this.arrowStartPoint = null;
      this.tempLine = null;
    }

    // Finalize shape
    if (this.isDrawingShape && this.tempShape) {
      this.tempShape.set({ selectable: true, evented: true });
      this.canvas.setActiveObject(this.tempShape);
      
      this.isDrawingShape = false;
      this.shapeStartPoint = null;
      this.tempShape = null;
      this.canvas.selection = true;
    }
  }

  private addArrow(x1: number, y1: number, x2: number, y2: number): void {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLength = 15;

    // Main line
    const line = new fabric.Line([x1, y1, x2, y2], {
      stroke: this.currentColor,
      strokeWidth: this.currentStrokeWidth,
      selectable: false,
    });

    // Arrow head
    const head = new fabric.Triangle({
      left: x2,
      top: y2,
      width: headLength,
      height: headLength,
      fill: this.currentColor,
      angle: (angle * 180 / Math.PI) + 90,
      originX: "center",
      originY: "center",
      selectable: false,
    });

    // Group them
    const group = new fabric.Group([line, head], {
      selectable: true,
      evented: true,
    });

    this.canvas.add(group);
    this.canvas.setActiveObject(group);
  }

  // Public methods
  setTool(tool: Tool): void {
    this.currentTool = tool;
    
    if (tool === "draw") {
      this.canvas.isDrawingMode = true;
      this.canvas.freeDrawingBrush.color = this.currentColor;
      this.canvas.freeDrawingBrush.width = this.currentStrokeWidth;
    } else {
      this.canvas.isDrawingMode = false;
    }

    if (tool === "select") {
      this.canvas.selection = true;
    }
  }

  setColor(color: string): void {
    this.currentColor = color;
    
    if (this.canvas.isDrawingMode) {
      this.canvas.freeDrawingBrush.color = color;
    }

    // Update selected object if any
    const activeObject = this.canvas.getActiveObject();
    if (activeObject) {
      if (activeObject.type === "i-text") {
        (activeObject as fabric.IText).set("fill", color);
      } else {
        activeObject.set("stroke", color);
      }
      this.canvas.renderAll();
    }
  }

  setStrokeWidth(width: number): void {
    this.currentStrokeWidth = width;
    
    if (this.canvas.isDrawingMode) {
      this.canvas.freeDrawingBrush.width = width;
    }
  }

  // History management
  private saveState(): void {
    if (this.isRestoring) return;

    const json = JSON.stringify(this.canvas.toJSON());
    
    // Remove any redo states
    this.history = this.history.slice(0, this.historyIndex + 1);
    
    this.history.push({ json });
    this.historyIndex = this.history.length - 1;
  }

  undo(): void {
    if (this.historyIndex <= 0) return;
    
    this.historyIndex--;
    this.restoreState(this.history[this.historyIndex]);
  }

  redo(): void {
    if (this.historyIndex >= this.history.length - 1) return;
    
    this.historyIndex++;
    this.restoreState(this.history[this.historyIndex]);
  }

  private restoreState(state: HistoryState): void {
    this.isRestoring = true;
    
    this.canvas.loadFromJSON(state.json, () => {
      this.canvas.renderAll();
      this.isRestoring = false;
    });
  }

  canUndo(): boolean {
    return this.historyIndex > 0;
  }

  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  // Delete selected
  deleteSelected(): void {
    const activeObject = this.canvas.getActiveObject();
    if (activeObject) {
      this.canvas.remove(activeObject);
      this.saveState();
    }
  }

  // Export
  save(): void {
    const dataUrl = this.canvas.toDataURL({
      format: "jpeg",
      quality: 0.85,
      multiplier: 1,
    });
    this.options.onSave(dataUrl);
  }

  cancel(): void {
    this.options.onCancel();
  }

  destroy(): void {
    this.canvas.dispose();
  }

  getCanvas(): fabric.Canvas {
    return this.canvas;
  }
}
