/**
 * Zone capture utility - allows selecting a region of the screen
 */

interface CaptureRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ZoneCaptureOptions {
  /** If true, caller should open annotation editor after capture. Default: true */
  openEditor?: boolean;
}

export interface ZoneCaptureResult {
  image: string;
  openEditor: boolean;
}

let overlay: HTMLDivElement | null = null;
let selection: HTMLDivElement | null = null;
let startX = 0;
let startY = 0;
let isSelecting = false;

export function startZoneCapture(options: ZoneCaptureOptions = {}): Promise<ZoneCaptureResult | null> {
  const { openEditor = true } = options;
  
  return new Promise((resolve) => {

    // Create overlay
    overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.3);
      cursor: crosshair;
      z-index: 999999;
    `;

    // Create selection box
    selection = document.createElement("div");
    selection.style.cssText = `
      position: fixed;
      border: 2px dashed #a855f7;
      background: rgba(168, 85, 247, 0.1);
      pointer-events: none;
      z-index: 1000000;
      display: none;
    `;

    // Instructions
    const instructions = document.createElement("div");
    instructions.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #1e1e2e;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-family: system-ui;
      font-size: 14px;
      z-index: 1000001;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    instructions.textContent = "📸 Arrastra para seleccionar zona | ESC para cancelar";

    document.body.appendChild(overlay);
    document.body.appendChild(selection);
    document.body.appendChild(instructions);

    const cleanup = () => {
      overlay?.remove();
      selection?.remove();
      instructions.remove();
      overlay = null;
      selection = null;
    };

    const handleMouseDown = (e: MouseEvent) => {
      isSelecting = true;
      startX = e.clientX;
      startY = e.clientY;
      if (selection) {
        selection.style.display = "block";
        selection.style.left = `${startX}px`;
        selection.style.top = `${startY}px`;
        selection.style.width = "0";
        selection.style.height = "0";
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isSelecting || !selection) return;
      
      const currentX = e.clientX;
      const currentY = e.clientY;
      
      const left = Math.min(startX, currentX);
      const top = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);
      
      selection.style.left = `${left}px`;
      selection.style.top = `${top}px`;
      selection.style.width = `${width}px`;
      selection.style.height = `${height}px`;
    };

    const handleMouseUp = async (e: MouseEvent) => {
      if (!isSelecting) return;
      isSelecting = false;

      const region: CaptureRegion = {
        x: Math.min(startX, e.clientX),
        y: Math.min(startY, e.clientY),
        width: Math.abs(e.clientX - startX),
        height: Math.abs(e.clientY - startY),
      };

      cleanup();

      // Minimum size check
      if (region.width < 10 || region.height < 10) {
        resolve(null);
        return;
      }

      // Capture the region
      const imageResult = await captureRegion(region);
      if (imageResult) {
        resolve({ image: imageResult, openEditor });
      } else {
        resolve(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        cleanup();
        resolve(null);
      }
    };

    overlay.addEventListener("mousedown", handleMouseDown);
    overlay.addEventListener("mousemove", handleMouseMove);
    overlay.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("keydown", handleKeyDown);
  });
}

async function captureRegion(region: CaptureRegion): Promise<string | null> {
  try {
    // First capture the full visible tab
    const response = await chrome.runtime.sendMessage({ action: "captureForZone" });
    if (!response?.image) return null;

    // Crop to the selected region
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = img.width / window.innerWidth; // Account for device pixel ratio
        
        canvas.width = region.width * scale;
        canvas.height = region.height * scale;
        
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(
          img,
          region.x * scale,
          region.y * scale,
          region.width * scale,
          region.height * scale,
          0,
          0,
          canvas.width,
          canvas.height
        );
        
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => resolve(null);
      img.src = response.image;
    });
  } catch (error) {
    console.error("[ComfyLink] Zone capture error:", error);
    return null;
  }
}
