/**
 * WebSocket client for ComfyLink extension
 * Connects to the Next.js app to send screenshots and receive context
 */

const WS_URL = "ws://localhost:3001/api/extension";
let socket: WebSocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

export interface ExtensionMessage {
  type: "screenshot" | "status" | "action";
  payload: {
    image?: string; // base64
    url?: string;
    action?: string;
    timestamp?: number;
  };
}

export function connect(onMessage?: (data: unknown) => void): void {
  if (socket?.readyState === WebSocket.OPEN) {
    console.log("[ComfyLink] Already connected");
    return;
  }

  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    console.log("[ComfyLink] Connected to chat app");
    reconnectAttempts = 0;
    sendStatus("connected");
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("[ComfyLink] Received:", data);
      onMessage?.(data);
    } catch (e) {
      console.error("[ComfyLink] Parse error:", e);
    }
  };

  socket.onclose = () => {
    console.log("[ComfyLink] Disconnected");
    socket = null;
    attemptReconnect(onMessage);
  };

  socket.onerror = (error) => {
    console.error("[ComfyLink] WebSocket error:", error);
  };
}

function attemptReconnect(onMessage?: (data: unknown) => void): void {
  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts++;
    console.log(`[ComfyLink] Reconnecting... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
    setTimeout(() => connect(onMessage), 2000 * reconnectAttempts);
  }
}

export function disconnect(): void {
  if (socket) {
    socket.close();
    socket = null;
  }
}

export function sendScreenshot(imageBase64: string, url: string): void {
  if (socket?.readyState !== WebSocket.OPEN) {
    console.error("[ComfyLink] Not connected");
    return;
  }

  const message: ExtensionMessage = {
    type: "screenshot",
    payload: {
      image: imageBase64,
      url,
      timestamp: Date.now(),
    },
  };

  socket.send(JSON.stringify(message));
  console.log("[ComfyLink] Screenshot sent");
}

export function sendStatus(status: string): void {
  if (socket?.readyState !== WebSocket.OPEN) return;

  socket.send(JSON.stringify({
    type: "status",
    payload: { action: status, timestamp: Date.now() },
  }));
}

export function isConnected(): boolean {
  return socket?.readyState === WebSocket.OPEN;
}
