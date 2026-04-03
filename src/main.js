console.log("WebTetris VERSION 0.3.51");
import { DEFAULT_SETTINGS } from "./constants.js?v=0.3.51";
import { InputManager } from "./input.js?v=0.3.51";
import { TetrisGame } from "./game.js?v=0.3.51";
import { Renderer } from "./renderer.js?v=0.3.51";
import { AudioManager } from "./audio.js?v=0.3.51";

const STORAGE_KEY = "web_tetris_settings_0.3.54";
const FRAME_MS = 16.666666666666668;

function mergeSettings(raw) {
  const s = raw ?? {};
  // sdf 복원(Infinity 문자열 -> Infinity)
  const out = {
    ...DEFAULT_SETTINGS,
    ...s,
    keybind: {
      ...DEFAULT_SETTINGS.keybind,
      ...(s.keybind || {}),
    },
  };
  if (out.sdf === "Infinity") out.sdf = Infinity;
  return out;
}

// (아래의 mergeSettings 정의는 위에서 완성된 out을 반환하도록 교체됨)
function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return mergeSettings(null);
    return mergeSettings(JSON.parse(raw));
  } catch {
    return mergeSettings(null);
  }
}

function saveSettings(settings) {
  // Infinity는 JSON에서 null로 바뀌므로 문자열로 치환해서 저장
  const json = JSON.stringify(settings, (k, v) => (v === Infinity ? "Infinity" : v));
  localStorage.setItem(STORAGE_KEY, json);
}

// UI에서 고정/강제할 옵션들
function enforceFixedSettings(next) {
  // Lock Delay / Preview는 기본값 고정
  next.lockDelayMs = DEFAULT_SETTINGS.lockDelayMs;
  next.previewCount = DEFAULT_SETTINGS.previewCount;

  next.mode = next.mode || "4wide";

  // 봇전은 일단 제거
  next.playMode = "solo";
  next.botDifficulty = "easy";

  // 중력 모드 정규화
  if (next.subMode === "infinite") next.subMode = "off";
  if (!["off", "fixed", "accel"].includes(next.subMode)) next.subMode = "off";

  // 중력 값 보정
  next.gravityBaseG = 0.02;
  next.gravityAccelPerSec = DEFAULT_SETTINGS.gravityAccelPerSec;
  next.gravityFixedG = Math.max(0.01, Math.min(100, Number(next.gravityFixedG ?? 0.02)));

  // Ghost / 사운드는 항상 ON
  next.ghost = true;
  next.soundEnabled = true;

  // 볼륨 범위 보정
  next.volume = Math.max(0, Math.min(100, Number(next.volume ?? 35)));

  return next;
}

const els = {

  playMode: document.getElementById("playModeSelect"),
  mode: document.getElementById("modeSelect"),

  subMode: document.getElementById("subModeSelect"),
  gravityFixedInput: document.getElementById("gravityFixedInput"),
  botDiff: document.getElementById("botDiffSelect"),

  // HANDLING sliders
  arrSlider: document.getElementById("arrSlider"),
  dasSlider: document.getElementById("dasSlider"),
  sdfSlider: document.getElementById("sdfSlider"),
  arrMsText: document.getElementById("arrMsText"),
  arrFText: document.getElementById("arrFText"),
  dasMsText: document.getElementById("dasMsText"),
  dasFText: document.getElementById("dasFText"),
  sdfText: document.getElementById("sdfText"),

  volume: document.getElementById("volumeInput"),
  startBtn: document.getElementById("startBtn"),
  restartBtn: document.getElementById("restartBtn"),

  botCanvas: document.getElementById("botCanvas"),

  keybindEditor: document.getElementById("keybindEditor"),
  overlay: document.getElementById("overlay"),
  touchControls: document.getElementById("touchControls"),
  settingsCard: document.querySelector(".settings-card"),
  settingsToggleBtn: document.getElementById("settingsToggleBtn"),

  // HUD
  stateText: document.getElementById("stateText"),
  scoreText: document.getElementById("scoreText"),
  linesText: document.getElementById("linesText"),
  levelText: document.getElementById("levelText"),
  gravityText: document.getElementById("gravityText"),
  b2bText: document.getElementById("b2bText"),
  incomingText: document.getElementById("incomingText"),
  botStateText: document.getElementById("botStateText"),
  attackText: document.getElementById("attackText"),
  attackTotalText: document.getElementById("attackTotalText"),
};


let mobileSettingsCollapsed = true;

function applyMobileSettingsUi() {
  const isMobile = document.body.classList.contains("mobile-ui");
  if (!els.settingsCard || !els.settingsToggleBtn) return;

  els.settingsCard.classList.toggle("is-collapsed", isMobile && mobileSettingsCollapsed);
  els.settingsToggleBtn.hidden = !isMobile;
  els.settingsToggleBtn.textContent = (isMobile && mobileSettingsCollapsed) ? "열기" : "닫기";
  els.settingsToggleBtn.setAttribute("aria-expanded", String(!(isMobile && mobileSettingsCollapsed)));
}

function prettyKey(code) {
  if (code === "ArrowLeft") return "←";
  if (code === "ArrowRight") return "→";
  if (code === "ArrowUp") return "↑";
  if (code === "ArrowDown") return "↓";
  if (code === "Space") return "Space";
  if (code && code.startsWith("Key")) return code.replace("Key", "");
  return code || "";
}

// ===== HANDLING UI =====
function updateHandlingTexts() {
  const arrF = Number(els.arrSlider.value);
  const dasF = Number(els.dasSlider.value);
  const sdfRaw = Number(els.sdfSlider.value);

  const arrMs = Math.round(arrF * FRAME_MS);
  const dasMs = Math.round(dasF * FRAME_MS);

  // 소수점이 길게 늘어지지 않도록 표시 포맷 조정
  const fmtF = (v) => (Math.round(v * 100) / 100).toString();

  els.arrFText.textContent = fmtF(arrF);
  els.arrMsText.textContent = String(arrMs);
  els.dasFText.textContent = fmtF(dasF);
  els.dasMsText.textContent = String(dasMs);

  if (sdfRaw >= 41) {
    els.sdfText.textContent = "∞";
  } else {
    // 0.5 단위는 한 자리까지 보이게
    const v = Math.round(sdfRaw * 2) / 2;
    els.sdfText.textContent = (v % 1 === 0) ? String(v.toFixed(0)) : String(v.toFixed(1));
  }
}


function updateModeUi(mode, subMode) {
  document.body.classList.toggle("mode-classic", mode === "classic");
  document.body.classList.toggle("mode-4wide", mode === "4wide");
  document.body.classList.toggle("gravity-fixed", subMode === "fixed");
  document.body.classList.add("solo");

  if (els.playMode) els.playMode.value = "solo";
  if (els.startBtn) els.startBtn.textContent = "게임 시작";
}

function applySettingsToForm(settings) {
  const mode = settings.mode || "4wide";
  const subMode = settings.subMode || "off";

  els.mode.value = mode;
  if (els.playMode) els.playMode.value = "solo";
  els.subMode.value = subMode;
  if (els.gravityFixedInput) els.gravityFixedInput.value = String(settings.gravityFixedG ?? 0.02);
  if (els.botDiff) els.botDiff.value = "easy";

  const arrF = settings.arrF ?? (settings.arrMs / FRAME_MS);
  const dasF = settings.dasF ?? (settings.dasMs / FRAME_MS);
  const sdfIsInf = (settings.sdf === Infinity) || (settings.sdf === "Infinity");
  const sdfValue = sdfIsInf ? 41 : (settings.sdfValue ?? Number(settings.sdf));

  els.arrSlider.value = String(arrF);
  els.dasSlider.value = String(dasF);
  els.sdfSlider.value = String(sdfValue);
  els.volume.value = String(settings.volume ?? 35);

  updateModeUi(mode, subMode);
  updateHandlingTexts();
}

function readSettingsFromForm(base) {
  const arrF = Number(els.arrSlider.value);
  const dasF = Number(els.dasSlider.value);
  const sdfRaw = Number(els.sdfSlider.value);
  const sdfRounded = Math.round(sdfRaw * 2) / 2; // 0.5 단위 고정

  const arrMs = arrF * FRAME_MS;
  const dasMs = dasF * FRAME_MS;
  const sdf = sdfRounded >= 41 ? Infinity : Math.max(1, sdfRounded);

  const mode = els.mode.value;
  const subMode = els.subMode.value;
  const gravityFixedG = Math.max(0.01, Math.min(100, Number(els.gravityFixedInput?.value ?? 0.02)));

  return {
    ...base,
    mode,
    playMode: "solo",
    subMode,
    gravityFixedG,
    botDifficulty: "easy",

    // handling
    arrF,
    dasF,
    sdfValue: sdfRounded,
    arrMs,
    dasMs,
    sdf,

    // volume only (ghost/sound은 강제 ON)
    volume: Number(els.volume.value),

    keybind: { ...(base.keybind || {}) },
  };
}

// ===== init =====
let settings = enforceFixedSettings(loadSettings());
applySettingsToForm(settings);

// audio (항상 ON, 볼륨만 조절)
const audio = new AudioManager();
audio.setEnabled(true);
audio.setVolume01((settings.volume ?? 35) / 100);

// game modules
const input = new InputManager(settings.keybind);
const game = new TetrisGame(input, audio);
const canvas = document.getElementById("gameCanvas");
const renderer = new Renderer(canvas);

const botRenderer = null;
game.applySettings(settings);

// ===== viewport scale =====
const viewport = document.getElementById("viewport");
function applyViewportScale() {
  if (!viewport) return;

  const ww = window.innerWidth;
  const wh = window.innerHeight;
  const isMobileUi = window.matchMedia("(max-width: 1100px), (pointer: coarse)").matches;

  document.body.classList.toggle("mobile-ui", isMobileUi);

  const designW = isMobileUi ? 430 : Number(viewport.dataset.designW || 1480);
  const designH = isMobileUi ? 900 : Number(viewport.dataset.designH || 920);

  const scale = Math.min(ww / designW, wh / designH);
  const offsetX = Math.max(0, (ww - designW * scale) / 2);
  const offsetY = Math.max(0, (wh - designH * scale) / 2);

  const dpr = window.devicePixelRatio || 1;
  // scale/offset을 약간 스냅하면 초기 렌더에서 뿌옇게 보이는 현상이 줄어듭니다.
  const snappedScale = Math.round(scale * dpr * 1000) / (dpr * 1000);
  const snappedX = Math.round(offsetX);
  const snappedY = Math.round(offsetY);

  if ("zoom" in viewport.style) {
    viewport.style.zoom = String(snappedScale);
    viewport.style.transform = `translate3d(${snappedX}px, ${snappedY}px, 0)`;
  } else {
    viewport.style.transform = `translate3d(${snappedX}px, ${snappedY}px, 0) scale3d(${snappedScale}, ${snappedScale}, 1)`;
  }
  viewport.style.transformOrigin = "top left";

  // 강제 리플로우(초기 뿌연 렌더링 완화)
  void viewport.offsetHeight;
  applyMobileSettingsUi();
}

function scheduleViewportScale() {
  // 폰트/레이아웃 초기 계산이 늦으면 깨져 보일 수 있어 2번 rAF로 재계산
  requestAnimationFrame(() => requestAnimationFrame(applyViewportScale));
}

window.addEventListener("resize", applyViewportScale);
applyViewportScale();
scheduleViewportScale();
window.addEventListener("load", scheduleViewportScale);
setTimeout(scheduleViewportScale, 60);
setTimeout(scheduleViewportScale, 200);
setTimeout(scheduleViewportScale, 600);

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(scheduleViewportScale).catch(() => {});
}

// ===== keybind editor =====
const ACTIONS = [
  ["moveLeft", "왼쪽 이동"],
  ["moveRight", "오른쪽 이동"],
  ["softDrop", "소프트 드랍"],
  ["hardDrop", "하드 드랍"],
  ["rotateCW", "회전(CW)"],
  ["rotateCCW", "회전(CCW)"],
  ["rotate180", "회전(180)"],
  ["hold", "홀드"],
  ["restart", "재시작"],
  ["exit", "타이틀/종료(ESC)"],
];


function initTouchControls() {
  const root = els.touchControls;
  if (!root) return;

  const activePointers = new Map();

  const releaseButton = (pointerId, btn) => {
    if (!btn) return;
    const action = btn.dataset.action;
    const mode = btn.dataset.mode || "tap";
    btn.classList.remove("is-active");
    if (mode === "hold") {
      input.setActionDown(action, false);
    }
    if (pointerId != null) activePointers.delete(pointerId);
  };

  root.querySelectorAll(".touch-btn").forEach((btn) => {
    btn.addEventListener("contextmenu", (e) => e.preventDefault());

    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      const action = btn.dataset.action;
      const mode = btn.dataset.mode || "tap";

      btn.classList.add("is-active");
      activePointers.set(e.pointerId, btn);

      if (mode === "hold") input.setActionDown(action, true);
      else input.tapAction(action);

      if (btn.setPointerCapture) {
        try { btn.setPointerCapture(e.pointerId); } catch {}
      }
    }, { passive: false });

    const finish = (e) => {
      e.preventDefault();
      releaseButton(e.pointerId, activePointers.get(e.pointerId) || btn);
    };

    btn.addEventListener("pointerup", finish, { passive: false });
    btn.addEventListener("pointercancel", finish, { passive: false });
    btn.addEventListener("lostpointercapture", finish, { passive: false });
    btn.addEventListener("pointerleave", (e) => {
      const mode = btn.dataset.mode || "tap";
      if (mode === "hold" && activePointers.get(e.pointerId) === btn) {
        finish(e);
      }
    }, { passive: false });
  });

  window.addEventListener("blur", () => {
    root.querySelectorAll(".touch-btn.is-active").forEach((btn) => {
      btn.classList.remove("is-active");
      if ((btn.dataset.mode || "tap") === "hold") input.setActionDown(btn.dataset.action, false);
    });
    activePointers.clear();
  });
}

function renderKeybindEditor() {
  const box = els.keybindEditor;
  if (!box) return;
  box.innerHTML = "";

  for (const [action, label] of ACTIONS) {
    const row = document.createElement("div");
    row.className = "keybind-row";

    const left = document.createElement("div");
    left.className = "label";
    const code = game.settings.keybind[action];
    left.innerHTML = `<div>${label}</div><div class="key">현재: ${prettyKey(code)} (${code})</div>`;

    const btn = document.createElement("button");
    btn.textContent = "변경";
    btn.addEventListener("click", () => beginRebind(action, label));

    row.appendChild(left);
    row.appendChild(btn);
    box.appendChild(row);
  }
}

let rebinding = null;

function beginRebind(action, label) {
  if (rebinding) return;
  rebinding = action;

  els.overlay.classList.remove("hidden");
  els.overlay.textContent = `키 변경: ${label}\n원하는 키를 누르세요.\n(ESC: 취소)`;

  const handler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();

    if (e.code === "Escape") {
      cleanup();
      return;
    }

    const kb = { ...game.settings.keybind };
    const existing = Object.entries(kb).find(([a, code]) => code === e.code);

    // 중복 키면 swap
    if (existing && existing[0] !== action) {
      const other = existing[0];
      const tmp = kb[other];
      kb[other] = kb[action];
      kb[action] = tmp;
    } else {
      kb[action] = e.code;
    }

    settings = enforceFixedSettings({ ...game.settings, keybind: kb });
    saveSettings(settings);

    game.settings.keybind = kb;
    input.keybind = kb;

    renderKeybindEditor();

    cleanup();
  };

  function cleanup() {
    window.removeEventListener("keydown", handler, true);
    els.overlay.classList.add("hidden");
    els.overlay.textContent = "";
    rebinding = null;
  }

  window.addEventListener("keydown", handler, true);
}

renderKeybindEditor();
initTouchControls();
if (els.settingsToggleBtn) {
  els.settingsToggleBtn.addEventListener("click", () => {
    if (!document.body.classList.contains("mobile-ui")) return;
    mobileSettingsCollapsed = !mobileSettingsCollapsed;
    applyMobileSettingsUi();
    scheduleViewportScale();
  });
}
applyMobileSettingsUi();

// ===== settings changes =====
function applySettingsLive(next) {
  // PLAYING 중 안전하게 즉시 반영 가능한 항목만
  game.settings.subMode = next.subMode;
  game.settings.gravityFixedG = next.gravityFixedG;

  // handling
  game.settings.arrF = next.arrF;
  game.settings.dasF = next.dasF;
  game.settings.sdfValue = next.sdfValue;
  game.settings.arrMs = next.arrMs;
  game.settings.dasMs = next.dasMs;
  game.settings.sdf = next.sdf;

  // volume
  game.settings.volume = next.volume;
  audio.setVolume01(game.settings.volume / 100);
}

function onSettingsChanged() {
  let next = readSettingsFromForm(game.settings);
  next = enforceFixedSettings(next);
  saveSettings(next);
  settings = next;

  // UI 토글
  updateModeUi(next.mode || "4wide", next.subMode || "off");
  updateHandlingTexts();

  if (game.state === "PLAYING") {
    applySettingsLive(next);
    return;
  }

  // TITLE/GAME_OVER에서는 전체 적용
  game.applySettings(next);
  input.keybind = game.settings.keybind;

  audio.setVolume01((game.settings.volume ?? 35) / 100);

  renderKeybindEditor();
  scheduleViewportScale();
}

// ✅ 모드 관련 변경은 진행 중 게임에 바로 반영하지 않고 TITLE로 보냄
function onModeChanged() {
  let next = readSettingsFromForm(game.settings);
  next = enforceFixedSettings(next);
  saveSettings(next);
  settings = next;

  updateModeUi(next.mode || "4wide", next.subMode || "off");
  updateHandlingTexts();

  game.applySettings(next);
  input.keybind = game.settings.keybind;
  audio.setVolume01((game.settings.volume ?? 35) / 100);

  renderKeybindEditor();
  scheduleViewportScale();

  // 진행 중이든 아니든 항상 새 게임 대기 화면으로 전환
  game.toTitle();
}

// 모드 관련 change
[els.mode, els.subMode, els.gravityFixedInput].forEach((x) =>
  x.addEventListener("change", onModeChanged)
);

// 볼륨은 바로 반영
els.volume.addEventListener("change", onSettingsChanged);

// handling sliders: input(즉시 반영)
els.arrSlider.addEventListener("input", onSettingsChanged);
els.dasSlider.addEventListener("input", onSettingsChanged);
els.sdfSlider.addEventListener("input", onSettingsChanged);

els.startBtn.addEventListener("click", () => {
  let next = readSettingsFromForm(game.settings);
  next = enforceFixedSettings(next);
  saveSettings(next);
  settings = next;

  game.applySettings(next);
  input.keybind = game.settings.keybind;

  audio.setVolume01((game.settings.volume ?? 35) / 100);
  audio.unlock();

  renderKeybindEditor();
  scheduleViewportScale();

  game.start();
});

els.restartBtn.addEventListener("click", () => {
  audio.setVolume01((game.settings.volume ?? 35) / 100);
  audio.unlock();

  if (game.state === "PLAYING" || game.state === "GAME_OVER") {
    game.restart();
  } else {
    let next = readSettingsFromForm(game.settings);
    next = enforceFixedSettings(next);
    saveSettings(next);
    settings = next;

    game.applySettings(next);
    input.keybind = game.settings.keybind;
    game.start();
  }
});

// ===== main loop =====
function updateHud(now) {
  if (els.stateText) els.stateText.textContent = game.state;
  if (els.scoreText) els.scoreText.textContent = String(game.score);
  if (els.linesText) els.linesText.textContent = String(game.lineCount);
  if (els.levelText) els.levelText.textContent = String(game.level);
  if (els.gravityText) els.gravityText.textContent = game.getGravityText(now);
  if (els.b2bText) els.b2bText.textContent = String(game.b2b);

  if (els.incomingText) els.incomingText.textContent = String(game.incomingTotal ?? 0);
  if (els.attackText) els.attackText.textContent = String(game.attackTotal ?? 0);
  if (els.attackTotalText) els.attackTotalText.textContent = String(game.attackLast ?? 0);
}

let prev = performance.now();
function loop(now) {
  const dt = now - prev;
  prev = now;

  game.update(dt, now);
  renderer.draw(game, now);
  updateHud(now);
  input.endFrame?.();

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
