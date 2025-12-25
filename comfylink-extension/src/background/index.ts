/**
 * Background service worker for ComfyLink extension
 * Handles screenshot requests and WebSocket connection
 */

import { captureCurrentTab, getCurrentTabUrl } from "~lib/capture";

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "capture") {
    handleCapture().then(sendResponse);
    return true; // Keep channel open for async response
  }
  
  // For zone capture - returns raw image without compression for cropping
  if (message.action === "captureForZone") {
    captureCurrentTab().then((image) => {
      sendResponse({ image });
    });
    return true;
  }
  
  if (message.action === "getStatus") {
    sendResponse({ connected: true });
    return true;
  }
  
  // Send captured zone to chat app
  if (message.action === "sendZoneCapture") {
    sendToChatApp(message.image, message.url);
    sendResponse({ success: true });
    return true;
  }
});

async function handleCapture(): Promise<{ success: boolean; image?: string; url?: string }> {
  try {
    const image = await captureCurrentTab();
    if (!image) {
      return { success: false };
    }

    const url = await getCurrentTabUrl();

    // Send to content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, {
        action: "screenshotReady",
        image,
        url,
      });
    }

    // Also send to chat app directly
    sendToChatApp(image, url);

    return { success: true, image, url };
  } catch (error) {
    console.error("[ComfyLink] Capture error:", error);
    return { success: false };
  }
}

// Send screenshot to Next.js app
async function sendToChatApp(image: string, url: string) {
  try {
    await fetch("http://localhost:3001/api/extension/screenshot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, url }),
    });
    console.log("[ComfyLink] Screenshot sent to chat app");
  } catch (error) {
    console.error("[ComfyLink] Failed to send to chat app:", error);
  }
}

// Handle keyboard shortcuts
chrome.commands?.onCommand?.addListener((command) => {
  if (command === "capture-screenshot") {
    handleCapture();
  }
  if (command === "zone-capture") {
    // Trigger zone capture in content script
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { action: "startZoneCapture" });
      }
    });
  }
});

console.log("[ComfyLink] Background service worker started");
