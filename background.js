const OFFSCREEN_DOCUMENT = "offscreen.html";
const RULES_KEY = "focusBomberRules";
const CONTENT_SCRIPT_ID = "focus-bomber-authorized-sites";
let creatingOffscreen = null;
let syncingContentScripts = Promise.resolve();

function permissionOrigins(pattern) {
  const isLocalAddress = pattern === "localhost"
    || /^\d+(?:\.\d+){3}$/.test(pattern)
    || /^\[[0-9a-f:]+\]$/i.test(pattern);
  const wildcard = isLocalAddress ? pattern : `*.${pattern}`;
  return [`http://${wildcard}/*`, `https://${wildcard}/*`];
}

async function syncAuthorizedContentScripts() {
  const { [RULES_KEY]: rules = [] } = await chrome.storage.local.get({ [RULES_KEY]: [] });
  const matches = [];
  for (const rule of rules) {
    if (!rule.enabled) continue;
    const origins = permissionOrigins(rule.pattern);
    if (await chrome.permissions.contains({ origins })) matches.push(...origins);
  }

  const registered = await chrome.scripting.getRegisteredContentScripts({ ids: [CONTENT_SCRIPT_ID] });
  if (registered.length) await chrome.scripting.unregisterContentScripts({ ids: [CONTENT_SCRIPT_ID] });
  if (!matches.length) return;
  await chrome.scripting.registerContentScripts([{
    id: CONTENT_SCRIPT_ID,
    matches: [...new Set(matches)],
    js: ["content.js"],
    css: ["content.css"],
    runAt: "document_idle",
    persistAcrossSessions: true
  }]);
}

function queueContentScriptSync() {
  syncingContentScripts = syncingContentScripts.then(syncAuthorizedContentScripts, syncAuthorizedContentScripts);
  return syncingContentScripts;
}

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
  if (message?.type === "focus-bomber-sync-sites") {
    return queueContentScriptSync().then(() => ({ ok: true }));
  }
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

chrome.runtime.onInstalled.addListener(() => queueContentScriptSync().catch(() => {}));
chrome.runtime.onStartup.addListener(() => queueContentScriptSync().catch(() => {}));
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes[RULES_KEY]) queueContentScriptSync().catch(() => {});
});
