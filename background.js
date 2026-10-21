chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.type !== "focus-bomber-close-tab" || !sender.tab?.id) return;
  chrome.tabs.remove(sender.tab.id).catch(() => {});
});
