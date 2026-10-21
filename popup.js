const RULES_KEY = "focusBomberRules";
const USAGE_KEY = "focusBomberUsage";
const BLOCKED_KEY = "focusBomberBlocked";

const $ = (selector) => document.querySelector(selector);
const today = () => {
  const date = new Date();
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
};
const usageKey = (ruleId) => `${today()}:${ruleId}`;

function normalizeSite(value) {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return "";
  try {
    return new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`).hostname.replace(/^www\./, "");
  } catch {
    return trimmed.replace(/^https?:\/\//, "").split("/")[0].replace(/^www\./, "");
  }
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}분 ${String(rest).padStart(2, "0")}초`;
}

async function loadState() {
  return chrome.storage.local.get({ [RULES_KEY]: [], [USAGE_KEY]: {}, [BLOCKED_KEY]: {} });
}

async function ensureCurrentTabIsRunning() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url?.startsWith("http")) return;
  try {
    const [{ result: alreadyRunning }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => Boolean(window.__focusBomberLoaded)
    });
    if (alreadyRunning) return;
    await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ["content.css"] });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
  } catch {
    // Restricted browser pages cannot receive content scripts.
  }
}

async function render() {
  const state = await loadState();
  const root = $("#rules");
  root.replaceChildren();
  if (!state[RULES_KEY].length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "아직 설정한 사이트가 없습니다.";
    root.append(empty);
    return;
  }

  for (const rule of state[RULES_KEY]) {
    const item = $("#rule-template").content.firstElementChild.cloneNode(true);
    const used = state[USAGE_KEY][usageKey(rule.id)] || 0;
    item.querySelector(".hostname").textContent = rule.pattern;
    item.querySelector(".usage").textContent = `${formatTime(used)} / ${formatTime(rule.limitSeconds)}`;
    const enabled = item.querySelector(".enabled");
    enabled.checked = rule.enabled;
    enabled.addEventListener("change", async () => {
      rule.enabled = enabled.checked;
      await chrome.storage.local.set({ [RULES_KEY]: state[RULES_KEY] });
    });
    item.querySelector(".test").addEventListener("click", async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: "focus-bomber-test", rule }).catch(() => {});
      window.close();
    });
    item.querySelector(".delete").addEventListener("click", async () => {
      await chrome.storage.local.set({ [RULES_KEY]: state[RULES_KEY].filter((candidate) => candidate.id !== rule.id) });
      render();
    });
    root.append(item);
  }
}

$("#rule-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const pattern = normalizeSite($("#site").value);
  const minutes = Number($("#minutes").value);
  if (!pattern || !Number.isFinite(minutes) || minutes < 1) return;

  const state = await loadState();
  const existing = state[RULES_KEY].find((rule) => rule.pattern === pattern);
  if (existing) {
    existing.limitSeconds = Math.round(minutes * 60);
    existing.enabled = true;
    delete state[BLOCKED_KEY][usageKey(existing.id)];
  } else {
    state[RULES_KEY].push({ id: crypto.randomUUID(), pattern, limitSeconds: Math.round(minutes * 60), enabled: true });
  }
  await chrome.storage.local.set({ [RULES_KEY]: state[RULES_KEY], [BLOCKED_KEY]: state[BLOCKED_KEY] });
  await ensureCurrentTabIsRunning();
  $("#site").value = pattern;
  render();
});

$("#reset-all").addEventListener("click", async () => {
  const state = await loadState();
  const prefix = `${today()}:`;
  const retained = Object.fromEntries(Object.entries(state[USAGE_KEY]).filter(([key]) => !key.startsWith(prefix)));
  const retainedBlocked = Object.fromEntries(Object.entries(state[BLOCKED_KEY]).filter(([key]) => !key.startsWith(prefix)));
  await chrome.storage.local.set({ [USAGE_KEY]: retained, [BLOCKED_KEY]: retainedBlocked });
  render();
});

chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
  if (!tab?.url?.startsWith("http")) return;
  $("#site").value = normalizeSite(tab.url);
});

render();
