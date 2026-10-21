const OFFSCREEN_DOCUMENT = "offscreen.html";
let creatingOffscreen = null;

async function ensureOffscreenDocument() {
  if (await chrome.offscreen.hasDocument()) return;
  if (!creatingOffscreen) {
    creatingOffscreen = chrome.offscreen.createDocument({
      url: OFFSCREEN_DOCUMENT,
      reasons: ["AUDIO_PLAYBACK"],
      justification: "Play aircraft and explosion effects during a Focus Bomber raid."
    }).finally(() => { creatingOffscreen = null; });
  }
  await creatingOffscreen;
}

async function sendAudio(action, tabId) {
  await ensureOffscreenDocument();
  await chrome.runtime.sendMessage({ type: "focus-bomber-offscreen-audio", action, tabId });
}

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.type === "focus-bomber-audio" && sender.tab?.id) {
    sendAudio(message.action, sender.tab.id).catch(() => {});
    return;
  }
  if (message?.type === "focus-bomber-close-tab" && sender.tab?.id) {
    sendAudio("stop", sender.tab.id).catch(() => {});
    chrome.tabs.remove(sender.tab.id).catch(() => {});
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  sendAudio("stop", tabId).catch(() => {});
});
