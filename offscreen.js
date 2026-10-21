const AUDIO = {
  engine: "sound_effect/scottishperson-sound-effect-ww2-fighter-plane-takeoff-333260.mp3",
  explosions: [
    "sound_effect/dragon-studio-explosion-sound-effect-425455.mp3",
    "sound_effect/dragon-studio-loud-explosion-425457.mp3",
    "sound_effect/soundreality-explosion-fx-343683.mp3"
  ]
};

const sessions = new Map();
const pools = new Map();
let explosionIndex = 0;

function stopAudio(audio) {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}

function stopSession(tabId) {
  const session = sessions.get(tabId);
  if (!session) return;
  stopAudio(session.engine);
  sessions.delete(tabId);
}

function startEngine(tabId) {
  stopSession(tabId);
  const engine = new Audio(chrome.runtime.getURL(AUDIO.engine));
  engine.loop = true;
  engine.volume = .90;
  engine.play().catch(() => {});
  sessions.set(tabId, { engine, lastImpact: 0 });
}

function pooledAudio(path) {
  if (!pools.has(path)) pools.set(path, Array.from({ length: 5 }, () => new Audio(chrome.runtime.getURL(path))));
  const pool = pools.get(path);
  const audio = pool.find((candidate) => candidate.paused || candidate.ended) || pool.shift();
  if (!pool.includes(audio)) pool.push(audio);
  stopAudio(audio);
  return audio;
}

function playExplosion(tabId, final = false) {
  const now = performance.now();
  const session = sessions.get(tabId) || { engine: null, lastImpact: 0 };
  if (!final && now - session.lastImpact < 115) return;
  session.lastImpact = now;
  sessions.set(tabId, session);
  const path = final ? AUDIO.explosions[2] : AUDIO.explosions[explosionIndex++ % 2];
  const audio = pooledAudio(path);
  audio.volume = final ? 1 : .22 + Math.random() * .13;
  audio.playbackRate = final ? .84 : .93 + Math.random() * .16;
  audio.play().catch(() => {});
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type !== "focus-bomber-offscreen-audio") return;
  if (message.action === "start") startEngine(message.tabId);
  else if (message.action === "impact") playExplosion(message.tabId);
  else if (message.action === "complete") {
    stopSession(message.tabId);
    playExplosion(message.tabId, true);
  } else if (message.action === "stop") stopSession(message.tabId);
});
