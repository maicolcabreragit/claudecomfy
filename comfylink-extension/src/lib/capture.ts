/**
 * Screen capture utility for ComfyLink extension
 * Uses chrome.tabs.captureVisibleTab for Manifest V3
 */

export async function captureCurrentTab(): Promise<string | null> {
  console.log("[ComfyLink] Starting capture...");
  
  try {
    // Check if chrome.tabs is available
    if (!chrome?.tabs?.captureVisibleTab) {
      console.error("[ComfyLink] chrome.tabs.captureVisibleTab not available");
      return null;
    }

    console.log("[ComfyLink] Calling captureVisibleTab...");
    
    // Capture the visible area of the current window
    const dataUrl = await chrome.tabs.captureVisibleTab(undefined, {
      format: "jpeg",
      quality: 70,
    });

    if (!dataUrl) {
      console.error("[ComfyLink] captureVisibleTab returned empty");
      return null;
    }

    console.log("[ComfyLink] Screenshot captured successfully, size:", dataUrl.length);
    return dataUrl;
  } catch (error) {
    console.error("[ComfyLink] Capture failed with error:", error);
    // Return more specific error info
    if (error instanceof Error) {
      console.error("[ComfyLink] Error message:", error.message);
      console.error("[ComfyLink] Error stack:", error.stack);
    }
    return null;
  }
}

export async function getCurrentTabUrl(): Promise<string> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab?.url || "";
  } catch {
    return "";
  }
}

