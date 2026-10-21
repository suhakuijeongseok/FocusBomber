(() => {
  if (window.__focusBomberLoaded) return;
  window.__focusBomberLoaded = true;

  const RULES_KEY = "focusBomberRules";
  const USAGE_KEY = "focusBomberUsage";
  const BLOCKED_KEY = "focusBomberBlocked";
  const today = () => {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
  };
  const hostnameMatches = (host, pattern) => host === pattern || host.endsWith(`.${pattern}`);
  const keyFor = (id) => `${today()}:${id}`;
  const isActive = () => document.visibilityState === "visible" && document.hasFocus();
  const sendAudio = (action) => chrome.runtime.sendMessage({ type: "focus-bomber-audio", action }).catch(() => {});
  const INTERACTIVE_SELECTOR = 'a[href],button,input,select,textarea,summary,details,[role="button"],[role="link"],[role="menuitem"],[role="checkbox"],[role="radio"],[role="switch"],[role="tab"],[contenteditable="true"],[tabindex]:not([tabindex="-1"]),audio[controls],video[controls]';
  let rule = null;
  let usedSeconds = 0;
  let tickCount = 0;
  let attacked = false;
  let attackQueued = false;
  let hud = null;
  const FORMATION = [
    { x: "0px", bottom: "0px", size: "190px", lane: 0 },
    { x: "-250px", bottom: "250px", size: "145px", lane: -.27 },
    { x: "250px", bottom: "-250px", size: "145px", lane: .27 },
    { x: "-500px", bottom: "500px", size: "125px", lane: -.54 },
    { x: "500px", bottom: "-500px", size: "125px", lane: .54 }
  ];

  async function initialize() {
    const state = await chrome.storage.local.get({ [RULES_KEY]: [], [USAGE_KEY]: {}, [BLOCKED_KEY]: {} });
    const host = location.hostname.replace(/^www\./, "");
    rule = state[RULES_KEY].find((item) => item.enabled && hostnameMatches(host, item.pattern)) || null;
    if (!rule) {
      hud?.remove();
      hud = null;
      return;
    }
    usedSeconds = state[USAGE_KEY][keyFor(rule.id)] || 0;
    showHud();
    if (state[BLOCKED_KEY][keyFor(rule.id)] || usedSeconds >= rule.limitSeconds) queueAttack(1400);
  }

  function showHud() {
    if (!hud) {
      hud = document.createElement("div");
      hud.id = "focus-bomber-hud";
      hud.innerHTML = '<span class="fb-dot"></span><span class="fb-time"></span>';
      document.documentElement.append(hud);
    }
    const remaining = Math.max(0, rule.limitSeconds - usedSeconds);
    hud.querySelector(".fb-time").textContent = `폭격까지 ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;
  }

  async function persistUsage() {
    if (!rule) return;
    const state = await chrome.storage.local.get({ [USAGE_KEY]: {} });
    state[USAGE_KEY][keyFor(rule.id)] = usedSeconds;
    await chrome.storage.local.set({ [USAGE_KEY]: state[USAGE_KEY] });
  }

  async function markBlocked() {
    if (!rule) return;
    const state = await chrome.storage.local.get({ [USAGE_KEY]: {}, [BLOCKED_KEY]: {} });
    usedSeconds = Math.max(usedSeconds, rule.limitSeconds);
    state[USAGE_KEY][keyFor(rule.id)] = usedSeconds;
    state[BLOCKED_KEY][keyFor(rule.id)] = true;
    await chrome.storage.local.set({ [USAGE_KEY]: state[USAGE_KEY], [BLOCKED_KEY]: state[BLOCKED_KEY] });
  }

  setInterval(() => {
    if (!rule || attacked || !isActive()) return;
    usedSeconds += 1;
    showHud();
    if (++tickCount % 5 === 0) persistUsage();
    if (usedSeconds >= rule.limitSeconds) {
      persistUsage();
      launchAttack();
    }
  }, 1000);

  addEventListener("pagehide", () => {
    persistUsage();
    if (attacked) sendAudio("stop");
  });
  addEventListener("blur", persistUsage);
  addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    attacked = false;
    attackQueued = false;
    initialize();
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && (changes[RULES_KEY] || changes[USAGE_KEY])) initialize();
  });
  chrome.runtime.onMessage.addListener((message) => {
    const host = location.hostname.replace(/^www\./, "");
    if (message?.type === "focus-bomber-test" && message.rule && hostnameMatches(host, message.rule.pattern)) {
      rule = message.rule;
      launchAttack();
    }
  });

  function wrapText() {
    const blocked = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "OPTION", "SVG", "CANVAS"]);
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || blocked.has(parent.tagName) || parent.closest("#focus-bomber-stage,#focus-bomber-hud,.fb-fragment") || !node.data.trim()) return NodeFilter.FILTER_REJECT;
        const style = getComputedStyle(parent);
        return style.display === "none" || style.visibility === "hidden" ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (walker.nextNode() && nodes.length < 6000) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const fragment = document.createDocumentFragment();
      for (const token of node.data.split(/(\s+)/)) {
        if (/^\s+$/.test(token)) fragment.append(document.createTextNode(token));
        else if (token) {
          const span = document.createElement("span");
          span.className = "fb-fragment";
          span.textContent = token;
          fragment.append(span);
        }
      }
      node.replaceWith(fragment);
    }
  }

  function restoreStaleAttackState() {
    document.documentElement.classList.remove("fb-page-cleared");
    document.querySelectorAll("#focus-bomber-stage,.fb-pixel-bomb,.fb-pixel-burst,.fb-particle,.fb-smoke").forEach((element) => element.remove());
    const possibleTargets = document.querySelectorAll(`.fb-fragment,${INTERACTIVE_SELECTOR},img,picture,video,canvas,iframe`);
    possibleTargets.forEach((element) => {
      const hiddenByBomber = element.dataset.focusBomberHit === "1" || element.dataset.focusBomberCleanup === "1" ||
        (element.style.getPropertyValue("visibility") === "hidden" && element.style.getPropertyPriority("visibility") === "important");
      if (!hiddenByBomber) return;
      element.getAnimations().forEach((animation) => animation.cancel());
      element.style.removeProperty("visibility");
      element.style.removeProperty("pointer-events");
      element.style.removeProperty("--fb-x");
      element.style.removeProperty("--fb-y");
      element.style.removeProperty("--fb-r");
      delete element.dataset.focusBomberHit;
      delete element.dataset.focusBomberCleanup;
    });
  }

  function queueAttack(delay = 0) {
    if (attacked || attackQueued) return;
    attackQueued = true;
    setTimeout(() => {
      attackQueued = false;
      launchAttack();
    }, delay);
  }

  function collectTargets() {
    const selector = '.fb-fragment,a,button,input,select,textarea,[role="button"],img,picture,video,canvas,iframe';
    const candidates = [...new Set(document.querySelectorAll(selector))];
    const visible = candidates.map((el) => {
      if (el.closest("#focus-bomber-stage,#focus-bomber-hud")) return false;
      const rect = el.getBoundingClientRect();
      if (!(rect.width > 2 && rect.height > 2 && rect.bottom > 0 && rect.right > 0 && rect.top < innerHeight && rect.left < innerWidth)) return false;
      const x = Math.min(innerWidth, Math.max(0, rect.left + rect.width / 2));
      const y = Math.min(innerHeight, Math.max(0, rect.top + rect.height / 2));
      const progress = Math.max(0, Math.min(1, ((x / innerWidth) + (1 - y / innerHeight)) / 2));
      const lanePosition = x / innerWidth + y / innerHeight - 1;
      let planeIndex = 0;
      let laneDistance = Infinity;
      FORMATION.forEach((plane, index) => {
        const distance = Math.abs(lanePosition - plane.lane);
        if (distance < laneDistance) {
          laneDistance = distance;
          planeIndex = index;
        }
      });
      return { target: el, progress, planeIndex, laneDistance };
    }).filter(Boolean);
    const lanes = FORMATION.map((_, planeIndex) => {
      const sorted = visible
        .filter((item) => item.planeIndex === planeIndex && item.laneDistance <= .18)
        .sort((a, b) => a.progress - b.progress || a.laneDistance - b.laneDistance);
      if (sorted.length <= 40) return sorted;
      return Array.from({ length: 40 }, (__, index) => sorted[Math.floor(index * (sorted.length - 1) / 39)]);
    });
    return lanes.flat().sort((a, b) => a.progress - b.progress);
  }

  function pixelFighter() {
    const source = chrome.runtime.getURL("assets/aircraft-fighter.png");
    return `<img src="${source}" alt="" draggable="false">`;
  }

  function pixelExplosion(x, y) {
    sendAudio("impact");
    const burst = document.createElement("i");
    burst.className = "fb-pixel-burst";
    burst.style.left = `${x}px`;
    burst.style.top = `${y}px`;
    document.documentElement.append(burst);
    setTimeout(() => burst.remove(), 560);
    for (let i = 0; i < 16; i += 1) {
      const particle = document.createElement("i");
      particle.className = "fb-particle";
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.background = i % 3 ? "#ffad25" : "#f14524";
      document.documentElement.append(particle);
      const angle = (Math.PI * 2 * i) / 16 + Math.random() * .25;
      const distance = 28 + Math.random() * 58;
      particle.animate([
        { transform: "translate(0,0) scale(1)", opacity: 1 },
        { transform: `translate(${Math.cos(angle) * distance}px,${Math.sin(angle) * distance}px) scale(.7)`, opacity: 1, offset: .65 },
        { transform: `translate(${Math.cos(angle) * distance * 1.25}px,${Math.sin(angle) * distance * 1.25 + 20}px) scale(.2)`, opacity: 0 }
      ], { duration: 620 + Math.random() * 240, easing: "steps(7,end)" }).onfinish = () => particle.remove();
    }
    const smoke = document.createElement("i");
    smoke.className = "fb-smoke";
    smoke.style.left = `${x}px`;
    smoke.style.top = `${y}px`;
    document.documentElement.append(smoke);
    setTimeout(() => smoke.remove(), 1250);
  }

  function destroyTarget(target) {
    if (!target.isConnected) return;
    const rect = target.getBoundingClientRect();
    const x = Math.min(innerWidth - 12, Math.max(12, rect.left + rect.width / 2));
    const y = Math.min(innerHeight - 12, Math.max(12, rect.top + rect.height / 2));
    pixelExplosion(x, y);
    const dx = (Math.random() - .5) * 360;
    const dy = -80 - Math.random() * 240;
    target.dataset.focusBomberHit = "1";
    target.animate([
      { transform: "translate(0,0) rotate(0) scale(1)", opacity: 1, filter: "none" },
      { transform: "translate(0,0) rotate(0) scale(1.08)", opacity: 1, filter: "brightness(2) saturate(2)", offset: .16 },
      { transform: `translate(${dx}px,${dy}px) rotate(${(Math.random() - .5) * 240}deg) scale(.15)`, opacity: 0, filter: "contrast(2)" }
    ], { duration: 760, easing: "steps(9,end)", fill: "forwards" }).onfinish = () => target.style.setProperty("visibility", "hidden", "important");
  }

  function dropBomb(target, delay, planeIndex) {
    setTimeout(() => {
      if (!target.isConnected) return;
      const rect = target.getBoundingClientRect();
      const x = Math.min(innerWidth - 12, Math.max(12, rect.left + rect.width / 2));
      const y = Math.min(innerHeight - 12, Math.max(12, rect.top + rect.height / 2));
      const planes = [...document.querySelectorAll(".fb-plane")];
      const plane = planes[planeIndex % planes.length];
      const planeRect = plane?.getBoundingClientRect();
      const startX = planeRect ? planeRect.left + planeRect.width * .52 : x;
      const startY = planeRect ? planeRect.top + planeRect.height * .54 : -28;
      const bomb = document.createElement("i");
      bomb.className = "fb-pixel-bomb";
      bomb.style.left = `${startX - 8}px`;
      bomb.style.top = `${startY - 12}px`;
      document.documentElement.append(bomb);
      const dx = x - startX;
      const dy = y - startY;
      const travel = Math.max(320, Math.min(880, Math.hypot(dx, dy) * .72));
      bomb.animate([
        { transform: "translate(0,0) rotate(-32deg) scale(.65)", filter: "brightness(1.4)" },
        { transform: `translate(${dx * .55}px,${dy * .55}px) rotate(140deg) scale(.9)`, offset: .55 },
        { transform: `translate(${dx}px,${dy}px) rotate(300deg) scale(1.15)`, filter: "brightness(.7)" }
      ], { duration: travel, easing: "steps(16,end)" }).onfinish = () => {
        bomb.remove();
        destroyTarget(target);
      };
    }, delay);
  }

  function clearAllInteractiveElements() {
    const elements = [...new Set(document.querySelectorAll(INTERACTIVE_SELECTOR))]
      .filter((element) => !element.closest("#focus-bomber-stage,#focus-bomber-hud"));
    let animatedIndex = 0;
    elements.forEach((element) => {
      element.dataset.focusBomberCleanup = "1";
      element.style.setProperty("pointer-events", "none", "important");
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const visible = rect.width > 1 && rect.height > 1 && rect.bottom > 0 && rect.right > 0 && rect.top < innerHeight && rect.left < innerWidth && style.visibility !== "hidden" && style.display !== "none";
      if (!visible) {
        element.style.setProperty("visibility", "hidden", "important");
        return;
      }
      const direction = animatedIndex % 2 === 0 ? -1 : 1;
      const delay = (animatedIndex % 32) * 12;
      animatedIndex += 1;
      const animation = element.animate([
        { transform: "translate(0,0) rotate(0) scale(1)", opacity: 1, filter: "none" },
        { transform: `translate(${direction * 18}px,-10px) rotate(${direction * 4}deg) scale(1.04)`, opacity: 1, filter: "brightness(1.8) saturate(1.7)", offset: .18 },
        { transform: `translate(${direction * (140 + Math.random() * 220)}px,${-90 - Math.random() * 230}px) rotate(${direction * (45 + Math.random() * 100)}deg) scale(.12)`, opacity: 0, filter: "contrast(2) blur(2px)" }
      ], { duration: 720, delay, easing: "steps(10,end)", fill: "forwards" });
      animation.onfinish = () => element.style.setProperty("visibility", "hidden", "important");
    });
    return 2600;
  }

  function clearAndClose(stage) {
    sendAudio("complete");
    const flash = document.createElement("div");
    flash.className = "fb-screen-flash";
    const nukeFlash = document.createElement("div");
    nukeFlash.className = "fb-nuke-flash";
    const nuke = document.createElement("div");
    nuke.className = "fb-nuke";
    nuke.innerHTML = '<i class="fb-nuke-ring"></i><i class="fb-nuke-core"></i><i class="fb-nuke-column"></i><i class="fb-nuke-cap"></i><i class="fb-nuke-debris"></i>';
    stage.append(flash, nukeFlash, nuke);
    const cleanupDuration = clearAllInteractiveElements();
    setTimeout(() => {
      document.documentElement.classList.add("fb-page-cleared");
      const curtain = document.createElement("div");
      curtain.className = "fb-curtain";
      const complete = document.createElement("div");
      complete.className = "fb-complete";
      complete.textContent = "MISSION COMPLETE · TAB CLOSING IN 5";
      stage.append(curtain, complete);
      let remaining = 5;
      const countdown = setInterval(() => {
        remaining -= 1;
        if (remaining > 0) complete.textContent = `MISSION COMPLETE · TAB CLOSING IN ${remaining}`;
        else clearInterval(countdown);
      }, 1000);
      setTimeout(() => chrome.runtime.sendMessage({ type: "focus-bomber-close-tab" }), 5200);
    }, cleanupDuration);
  }

  function launchAttack() {
    if (attacked) return;
    attacked = true;
    restoreStaleAttackState();
    markBlocked();
    sendAudio("start");
    hud?.remove();
    wrapText();
    const stage = document.createElement("div");
    stage.id = "focus-bomber-stage";
    const planes = FORMATION.map((slot, index) => `<div class="fb-plane" data-plane="${index}" style="--fb-x:${slot.x};--fb-bottom:${slot.bottom};--fb-size:${slot.size}">${pixelFighter()}</div>`).join("");
    stage.innerHTML = `<div id="focus-bomber-warning">TIME OVER · FORMATION AIR RAID</div><div id="focus-bomber-formation">${planes}</div>`;
    document.documentElement.append(stage);
    const targets = collectTargets();
    targets.forEach(({ target, progress, planeIndex }, index) => {
      const pathDelay = 700 + progress * 7350;
      dropBomb(target, pathDelay + (index % 3) * 45, planeIndex);
    });
    setTimeout(() => clearAndClose(stage), 9300);
  }

  initialize();
})();
