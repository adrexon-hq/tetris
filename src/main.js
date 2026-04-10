import { DEFAULT_SETTINGS } from "./constants.js?v=0.3.0";
import { InputManager } from "./input.js?v=0.3.0";
import { TetrisGame } from "./game.js?v=0.3.0";
import { Renderer } from "./renderer.js?v=0.3.0";
import { AudioManager } from "./audio.js?v=0.3.0";

const STORAGE_KEY = "web_tetris_settings_0.3.60";
const LANG_STORAGE_KEY = "bailis_ui_lang_0.3.92";
const FRAME_MS = 16.666666666666668;

const I18N = {
  ko: {
    htmlLang: "ko",
    languageLabel: "언어",
    languageOptions: { ko: "🇰🇷 한국어", en: "🇺🇸 English", ja: "🇯🇵 日本語", zh: "🇨🇳 简体中文" },
    modeMenuAria: "모드 메뉴 열기",
    handlingMenuAria: "핸들링 메뉴 열기",
    modeSwitchAria: "플레이 모드 선택",
    modeSheetAria: "모바일 모드 설정",
    handlingSheetAria: "모바일 핸들링 설정",
    mobileSystemAria: "모바일 시스템 버튼",
    touchControlsAria: "모바일 조작 버튼",
    contactAria: "문의 메일",
    boardAria: "테트리스 보드",
    botAria: "봇 보드",
    modeSheetTitle: "모드",
    playModeLabel: "플레이 모드",
    gravityModeLabel: "모드",
    fixedGravityLabel: "고정 중력 (0.01 ~ 100)",
    handlingTitle: "HANDLING",
    volumeLabel: "볼륨",
    keySettingsTitle: "키 설정",
    keySettingsTitleFull: "키 설정(변경 가능)",
    keySettingsGuide: "변경 버튼을 누른 뒤 원하는 키를 입력하세요. ESC는 취소되고, 중복 키는 자동으로 교환됩니다.",
    settingsTitle: "게임 설정",
    settingsGuide: "게임 시작 전에 모드와 핸들링을 먼저 맞춰주세요.",
    settingsMuted: "Lock Delay, Preview는 기본값으로 고정되어 있습니다.",
    open: "열기",
    change: "변경",
    startGame: "게임 시작",
    restartGame: "재시작",
    restartWithKey: "재시작 (R)",
    exit: "EXIT",
    restartShort: "RESTART",
    modeClassic: "Classic",
    modeClassicOption: "Classic (10x20)",
    mode4Wide: "4Wide",
    subModeOff: "프리 모드",
    subModeFixed: "고정 중력",
    subModeAccel: "가속 중력",
    garbageSprintLabel: "가비지 스프린트",
    garbageSprintOff: "끔",
    garbageSprintLow: "하 (5초)",
    garbageSprintMid: "중 (2~3초)",
    garbageSprintHigh: "상 (2초 / 3줄)",
    contactTitle: "문의하기",
    contactDesc: "버그 제보 / 오류 문의",
    session: "SESSION",
    pps: "PPS",
    maxCombo: "MAX COMBO",
    time: "TIME",
    pieces: "PIECES",
    attack: "ATTACK",
    hold: "HOLD",
    next: "NEXT",
    combo: "COMBO",
    total: "TOTAL",
    allClearShort: "올클리어",
    allClear: "ALL CLEAR",
    victory: "VICTORY",
    victoryHint: "R 키로 재시작",
    clickBoardOrEnter: "보드를 클릭하거나 Enter로 시작",
    pressStartButton: "게임 시작 버튼을 누르세요",
    gameOver: "GAME OVER",
    gameOverHint: "R: 재시작 / Esc: 타이틀",
    action_moveLeft: "왼쪽 이동",
    action_moveRight: "오른쪽 이동",
    action_softDrop: "소프트 드랍",
    action_hardDrop: "하드 드랍",
    action_rotateCW: "회전(CW)",
    action_rotateCCW: "회전(CCW)",
    action_rotate180: "회전(180)",
    action_hold: "홀드",
    action_restart: "재시작",
    action_exit: "타이틀/종료(ESC)",
    overlayChangeKey: "키 변경: {label}",
    overlayPressKey: "원하는 키를 누르세요.",
    overlayCancel: "(ESC: 취소)",
    touchLeft: "LEFT",
    touchRight: "RIGHT",
    touchSoft: "SOFT",
    touchHard: "HARD",
    touchHold: "HOLD",
    touchCCW: "CCW",
    touchCW: "CW",
    touchTurn: "TURN",
  },
  en: {
    htmlLang: "en",
    languageLabel: "Language",
    languageOptions: { ko: "🇰🇷 Korean", en: "🇺🇸 English", ja: "🇯🇵 Japanese", zh: "🇨🇳 Chinese" },
    modeMenuAria: "Open mode menu",
    handlingMenuAria: "Open handling menu",
    modeSwitchAria: "Select play mode",
    modeSheetAria: "Mode settings",
    handlingSheetAria: "Handling settings",
    mobileSystemAria: "Mobile system buttons",
    touchControlsAria: "Mobile controls",
    contactAria: "Contact email",
    boardAria: "Tetris board",
    botAria: "Bot board",
    modeSheetTitle: "Mode",
    playModeLabel: "Play Mode",
    gravityModeLabel: "Gravity Mode",
    fixedGravityLabel: "Fixed Gravity (0.01 ~ 100)",
    handlingTitle: "HANDLING",
    volumeLabel: "Volume",
    keySettingsTitle: "Key Settings",
    keySettingsTitleFull: "Key Settings",
    keySettingsGuide: "Press change, then press the key you want. ESC cancels, and duplicate keys are swapped automatically.",
    settingsTitle: "Game Settings",
    settingsGuide: "Set your mode and handling before starting.",
    settingsMuted: "Lock Delay and Preview stay at the default values.",
    open: "Open",
    change: "Change",
    startGame: "Start",
    restartGame: "Restart",
    restartWithKey: "Restart (R)",
    exit: "EXIT",
    restartShort: "RESTART",
    modeClassic: "Classic",
    modeClassicOption: "Classic (10x20)",
    mode4Wide: "4Wide",
    subModeOff: "Free Mode",
    subModeFixed: "Fixed Gravity",
    subModeAccel: "Accel Gravity",
    garbageSprintLabel: "Garbage Sprint",
    garbageSprintOff: "Off",
    garbageSprintLow: "Low (5s)",
    garbageSprintMid: "Mid (2–3s)",
    garbageSprintHigh: "High (2s / 3 lines)",
    contactTitle: "Contact",
    contactDesc: "Bug reports / error support",
    session: "SESSION",
    pps: "PPS",
    maxCombo: "MAX COMBO",
    time: "TIME",
    pieces: "PIECES",
    attack: "ATTACK",
    hold: "HOLD",
    next: "NEXT",
    combo: "COMBO",
    total: "TOTAL",
    allClearShort: "ALL CLEAR",
    allClear: "ALL CLEAR",
    victory: "VICTORY",
    victoryHint: "Press R to restart",
    clickBoardOrEnter: "Click the board or press Enter",
    pressStartButton: "Press Start",
    gameOver: "GAME OVER",
    gameOverHint: "R: Restart / Esc: Title",
    action_moveLeft: "Move Left",
    action_moveRight: "Move Right",
    action_softDrop: "Soft Drop",
    action_hardDrop: "Hard Drop",
    action_rotateCW: "Rotate (CW)",
    action_rotateCCW: "Rotate (CCW)",
    action_rotate180: "Rotate (180)",
    action_hold: "Hold",
    action_restart: "Restart",
    action_exit: "Title / Exit (ESC)",
    overlayChangeKey: "Change key: {label}",
    overlayPressKey: "Press the key you want.",
    overlayCancel: "(ESC: cancel)",
    touchLeft: "LEFT",
    touchRight: "RIGHT",
    touchSoft: "SOFT",
    touchHard: "HARD",
    touchHold: "HOLD",
    touchCCW: "CCW",
    touchCW: "CW",
    touchTurn: "TURN",
  },
  ja: {
    htmlLang: "ja",
    languageLabel: "言語",
    languageOptions: { ko: "🇰🇷 韓国語", en: "🇺🇸 English", ja: "🇯🇵 日本語", zh: "🇨🇳 中文" },
    modeMenuAria: "モードメニューを開く",
    handlingMenuAria: "ハンドリングメニューを開く",
    modeSwitchAria: "プレイモードを選択",
    modeSheetAria: "モード設定",
    handlingSheetAria: "ハンドリング設定",
    mobileSystemAria: "モバイルシステムボタン",
    touchControlsAria: "モバイル操作ボタン",
    contactAria: "お問い合わせメール",
    boardAria: "テトリスボード",
    botAria: "ボットボード",
    modeSheetTitle: "モード",
    playModeLabel: "プレイモード",
    gravityModeLabel: "重力モード",
    fixedGravityLabel: "固定重力 (0.01 ~ 100)",
    handlingTitle: "HANDLING",
    volumeLabel: "音量",
    keySettingsTitle: "キー設定",
    keySettingsTitleFull: "キー設定",
    keySettingsGuide: "変更を押してから割り当てたいキーを入力してください。ESCでキャンセル、重複キーは自動で入れ替わります。",
    settingsTitle: "ゲーム設定",
    settingsGuide: "開始前にモードとハンドリングを調整してください。",
    settingsMuted: "Lock Delay と Preview は既定値に固定されています。",
    open: "開く",
    change: "変更",
    startGame: "開始",
    restartGame: "再開",
    restartWithKey: "再開 (R)",
    exit: "EXIT",
    restartShort: "RESTART",
    modeClassic: "Classic",
    modeClassicOption: "Classic (10x20)",
    mode4Wide: "4Wide",
    subModeOff: "フリーモード",
    subModeFixed: "固定重力",
    subModeAccel: "加速重力",
    garbageSprintLabel: "ガベージスプリント",
    garbageSprintOff: "オフ",
    garbageSprintLow: "低 (5秒)",
    garbageSprintMid: "中 (2~3秒)",
    garbageSprintHigh: "高 (2秒 / 3ライン)",
    contactTitle: "お問い合わせ",
    contactDesc: "バグ報告 / エラー対応",
    session: "SESSION",
    pps: "PPS",
    maxCombo: "MAX COMBO",
    time: "TIME",
    pieces: "PIECES",
    attack: "ATTACK",
    hold: "HOLD",
    next: "NEXT",
    combo: "COMBO",
    total: "TOTAL",
    allClearShort: "オールクリア",
    allClear: "ALL CLEAR",
    victory: "VICTORY",
    victoryHint: "Rキーで再開",
    clickBoardOrEnter: "ボードをクリック、または Enter で開始",
    pressStartButton: "開始ボタンを押してください",
    gameOver: "GAME OVER",
    gameOverHint: "R: 再開 / Esc: タイトル",
    action_moveLeft: "左移動",
    action_moveRight: "右移動",
    action_softDrop: "ソフトドロップ",
    action_hardDrop: "ハードドロップ",
    action_rotateCW: "回転(CW)",
    action_rotateCCW: "回転(CCW)",
    action_rotate180: "回転(180)",
    action_hold: "ホールド",
    action_restart: "再開",
    action_exit: "タイトル / 終了(ESC)",
    overlayChangeKey: "キー変更: {label}",
    overlayPressKey: "設定したいキーを押してください。",
    overlayCancel: "(ESC: キャンセル)",
    touchLeft: "LEFT",
    touchRight: "RIGHT",
    touchSoft: "SOFT",
    touchHard: "HARD",
    touchHold: "HOLD",
    touchCCW: "CCW",
    touchCW: "CW",
    touchTurn: "TURN",
  },
  zh: {
    htmlLang: "zh-CN",
    languageLabel: "语言",
    languageOptions: { ko: "🇰🇷 韩语", en: "🇺🇸 English", ja: "🇯🇵 日本語", zh: "🇨🇳 简体中文" },
    modeMenuAria: "打开模式菜单",
    handlingMenuAria: "打开操作设置",
    modeSwitchAria: "选择游玩模式",
    modeSheetAria: "模式设置",
    handlingSheetAria: "操作设置",
    mobileSystemAria: "移动端系统按钮",
    touchControlsAria: "移动端操作按钮",
    contactAria: "联系邮箱",
    boardAria: "俄罗斯方块棋盘",
    botAria: "机器人棋盘",
    modeSheetTitle: "模式",
    playModeLabel: "游玩模式",
    gravityModeLabel: "重力模式",
    fixedGravityLabel: "固定重力 (0.01 ~ 100)",
    handlingTitle: "HANDLING",
    volumeLabel: "音量",
    keySettingsTitle: "按键设置",
    keySettingsTitleFull: "按键设置",
    keySettingsGuide: "点击更改后按下想要的按键。ESC 取消，重复按键会自动互换。",
    settingsTitle: "游戏设置",
    settingsGuide: "开始前先调整模式和操作手感。",
    settingsMuted: "Lock Delay 和 Preview 保持默认值。",
    open: "打开",
    change: "更改",
    startGame: "开始",
    restartGame: "重开",
    restartWithKey: "重开 (R)",
    exit: "EXIT",
    restartShort: "RESTART",
    modeClassic: "Classic",
    modeClassicOption: "Classic (10x20)",
    mode4Wide: "4Wide",
    subModeOff: "自由模式",
    subModeFixed: "固定重力",
    subModeAccel: "加速重力",
    garbageSprintLabel: "垃圾冲刺",
    garbageSprintOff: "关闭",
    garbageSprintLow: "低 (5秒)",
    garbageSprintMid: "中 (2~3秒)",
    garbageSprintHigh: "高 (2秒 / 3行)",
    contactTitle: "联系",
    contactDesc: "错误反馈 / 问题咨询",
    session: "SESSION",
    pps: "PPS",
    maxCombo: "MAX COMBO",
    time: "TIME",
    pieces: "PIECES",
    attack: "ATTACK",
    hold: "HOLD",
    next: "NEXT",
    combo: "COMBO",
    total: "TOTAL",
    allClearShort: "全清",
    allClear: "ALL CLEAR",
    victory: "VICTORY",
    victoryHint: "按 R 重开",
    clickBoardOrEnter: "点击棋盘或按 Enter 开始",
    pressStartButton: "请按开始按钮",
    gameOver: "GAME OVER",
    gameOverHint: "R: 重开 / Esc: 标题",
    action_moveLeft: "向左移动",
    action_moveRight: "向右移动",
    action_softDrop: "软降",
    action_hardDrop: "硬降",
    action_rotateCW: "旋转(CW)",
    action_rotateCCW: "旋转(CCW)",
    action_rotate180: "旋转(180)",
    action_hold: "暂存",
    action_restart: "重开",
    action_exit: "标题 / 退出(ESC)",
    overlayChangeKey: "按键更改: {label}",
    overlayPressKey: "请按下想设置的按键。",
    overlayCancel: "(ESC: 取消)",
    touchLeft: "LEFT",
    touchRight: "RIGHT",
    touchSoft: "SOFT",
    touchHard: "HARD",
    touchHold: "HOLD",
    touchCCW: "CCW",
    touchCW: "CW",
    touchTurn: "TURN",
  },
};
const ACTIONS = [
  "moveLeft",
  "moveRight",
  "softDrop",
  "hardDrop",
  "rotateCW",
  "rotateCCW",
  "rotate180",
  "hold",
  "restart",
  "exit",
];
let currentLocale = loadLocale();

function loadLocale() {
  try {
    const raw = localStorage.getItem(LANG_STORAGE_KEY);
    return I18N[raw] ? raw : "ko";
  } catch {
    return "ko";
  }
}

function saveLocale(locale) {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, locale);
  } catch {}
}

function applyLocaleChange(nextLocale) {
  if (!I18N[nextLocale] || nextLocale === currentLocale) return;
  currentLocale = nextLocale;
  saveLocale(currentLocale);
  applyTranslations();
}

const LOCALE_META = {
  ko: { flag: "🇰🇷", label: "한국어" },
  en: { flag: "🇺🇸", label: "English" },
  ja: { flag: "🇯🇵", label: "日本語" },
  zh: { flag: "🇨🇳", label: "简体中文" },
};

function syncLocaleQuickButtons() {
  (els.localeQuickButtons || []).forEach((btn) => {
    const active = btn.dataset.locale === currentLocale;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function syncLocalePicker() {
  const meta = LOCALE_META[currentLocale] || LOCALE_META.ko;
  if (els.localePickerFlag) els.localePickerFlag.textContent = meta.flag;
  if (els.localePickerText) els.localePickerText.textContent = meta.label;

  (els.localeMenuButtons || []).forEach((btn) => {
    const active = btn.dataset.locale === currentLocale;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function setLocalePickerOpen(open) {
  if (!els.localePicker || !els.localePickerBtn || !els.localePickerMenu) return;
  els.localePicker.classList.toggle("is-open", open);
  els.localePickerBtn.setAttribute("aria-expanded", open ? "true" : "false");
  els.localePickerMenu.classList.toggle("hidden", !open);
}

function t(key, vars = null) {
  const dict = I18N[currentLocale] || I18N.ko;
  let out = dict[key] ?? I18N.ko[key] ?? key;
  if (vars && typeof out === "string") {
    for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v));
  }
  return out;
}

function getActionLabel(action) {
  return t(`action_${action}`);
}

function setLeadingLabelText(el, value) {
  if (!el) return;
  const node = [...el.childNodes].find((x) => x.nodeType === Node.TEXT_NODE);
  if (node) node.textContent = value;
  else el.prepend(document.createTextNode(value));
}


function formatSessionTime(sec) {
  const total = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

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
  if (!["off", "low", "mid", "high"].includes(next.garbageSprint)) next.garbageSprint = "off";

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
  garbageSprint: document.getElementById("garbageSprintSelect"),
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

  mobileModeMenuBtn: document.getElementById("mobileModeMenuBtn"),
  mobileHandlingMenuBtn: document.getElementById("mobileHandlingMenuBtn"),
  mobileStartBtn: document.getElementById("mobileStartBtn"),
  mobileExitBtn: document.getElementById("mobileExitBtn"),
  mobileRestartBtn: document.getElementById("mobileRestartBtn"),
  mobileModeSwitch: document.getElementById("mobileModeSwitch"),
  mobileModeClassicBtn: document.getElementById("mobileModeClassicBtn"),
  mobileMode4WideBtn: document.getElementById("mobileMode4WideBtn"),
  mobileModeSheet: document.getElementById("mobileModeSheet"),
  mobileHandlingSheet: document.getElementById("mobileHandlingSheet"),
  languageSelect: document.getElementById("languageSelect"),
  localeQuickButtons: Array.from(document.querySelectorAll(".locale-chip")),
  localePicker: document.getElementById("localePicker"),
  localePickerBtn: document.getElementById("localePickerBtn"),
  localePickerMenu: document.getElementById("localePickerMenu"),
  localePickerFlag: document.getElementById("localePickerFlag"),
  localePickerText: document.getElementById("localePickerText"),
  localeMenuButtons: Array.from(document.querySelectorAll(".locale-menu-option")),
  mobileMode: document.getElementById("mobileModeSelect"),
  mobileSubMode: document.getElementById("mobileSubModeSelect"),
  mobileGarbageSprint: document.getElementById("mobileGarbageSprintSelect"),
  mobileGravityFixedInput: document.getElementById("mobileGravityFixedInput"),
  mobileArrSlider: document.getElementById("mobileArrSlider"),
  mobileDasSlider: document.getElementById("mobileDasSlider"),
  mobileSdfSlider: document.getElementById("mobileSdfSlider"),
  mobileArrMsText: document.getElementById("mobileArrMsText"),
  mobileArrFText: document.getElementById("mobileArrFText"),
  mobileDasMsText: document.getElementById("mobileDasMsText"),
  mobileDasFText: document.getElementById("mobileDasFText"),
  mobileSdfText: document.getElementById("mobileSdfText"),
  mobileVolume: document.getElementById("mobileVolumeInput"),

  botCanvas: document.getElementById("botCanvas"),

  keybindEditor: document.getElementById("keybindEditor"),
  keybindCard: document.querySelector(".keybind-card"),
  desktopKeybindSheetHost: document.getElementById("desktopKeybindSheetHost"),
  panelRight: document.querySelector(".panel.right"),
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
  ppsText: document.getElementById("ppsText"),
  maxComboText: document.getElementById("maxComboText"),
  timeText: document.getElementById("timeText"),
  piecesText: document.getElementById("piecesText"),
  attackTotalStatText: document.getElementById("attackTotalStatText"),
};

const desktopControls = {
  mode: els.mode,
  subMode: els.subMode,
  garbageSprint: els.garbageSprint,
  gravityFixedInput: els.gravityFixedInput,
  arrSlider: els.arrSlider,
  dasSlider: els.dasSlider,
  sdfSlider: els.sdfSlider,
  arrMsText: els.arrMsText,
  arrFText: els.arrFText,
  dasMsText: els.dasMsText,
  dasFText: els.dasFText,
  sdfText: els.sdfText,
  volume: els.volume,
};

let game = null;
let renderer = null;

const mobileControls = {
  mode: els.mobileMode,
  subMode: els.mobileSubMode,
  garbageSprint: els.mobileGarbageSprint,
  gravityFixedInput: els.mobileGravityFixedInput,
  arrSlider: els.mobileArrSlider,
  dasSlider: els.mobileDasSlider,
  sdfSlider: els.mobileSdfSlider,
  arrMsText: els.mobileArrMsText,
  arrFText: els.mobileArrFText,
  dasMsText: els.mobileDasMsText,
  dasFText: els.mobileDasFText,
  sdfText: els.mobileSdfText,
  volume: els.mobileVolume,
};

let mobileModeSheetOpen = false;
let mobileHandlingSheetOpen = false;

function relocateKeybindCard() {
  const card = els.keybindCard;
  if (!card) return;

  const desktopQuick = document.body.classList.contains("desktop-quick-ui");
  const sheetHost = els.desktopKeybindSheetHost;
  const panelRight = els.panelRight;
  const botField = panelRight?.querySelector(".bot-field") ?? null;

  if (desktopQuick && sheetHost) {
    if (card.parentElement !== sheetHost) sheetHost.appendChild(card);
    return;
  }

  if (panelRight && card.parentElement !== panelRight) {
    panelRight.insertBefore(card, botField);
  }
}

function isMobileUi() {
  return document.body.classList.contains("mobile-ui");
}

function hasQuickTopbarUi() {
  return document.body.classList.contains("mobile-ui") || document.body.classList.contains("desktop-quick-ui");
}

function closeMobileSheets() {
  mobileModeSheetOpen = false;
  mobileHandlingSheetOpen = false;
  applyMobileSettingsUi();
  updateMobileModeSwitcher();
}


function getModeLabel(mode) {
  return mode === "classic" ? t("modeClassic") : t("mode4Wide");
}

function updateMobileModeSwitcher() {
  if (!els.mobileModeSwitch) return;
  const showQuickSwitcher = hasQuickTopbarUi();
  els.mobileModeSwitch.classList.toggle("is-hidden", !showQuickSwitcher);

  const mode = settings.mode || "4wide";
  els.mobileModeClassicBtn?.classList.toggle("is-active", mode === "classic");
  els.mobileMode4WideBtn?.classList.toggle("is-active", mode === "4wide");
}

function updateMobileStartButton() {
  if (!els.mobileStartBtn) return;
  const icon = game?.state === "PLAYING" ? "↻" : "▶";
  const label = game?.state === "PLAYING" ? t("restartGame") : t("startGame");
  els.mobileStartBtn.innerHTML = `<span class="icon">${icon}</span><span class="text">${label}</span>`;
}

function applyMobileSettingsUi() {
  const hasQuickUi = hasQuickTopbarUi();
  if (!hasQuickUi) {
    mobileModeSheetOpen = false;
    mobileHandlingSheetOpen = false;
  }

  document.body.classList.toggle("mobile-mode-sheet-open", hasQuickUi && mobileModeSheetOpen);
  document.body.classList.toggle("mobile-handling-sheet-open", hasQuickUi && mobileHandlingSheetOpen);

  if (els.settingsToggleBtn) {
    els.settingsToggleBtn.hidden = true;
    els.settingsToggleBtn.setAttribute("aria-expanded", "false");
  }

  updateMobileModeSwitcher();
  updateMobileStartButton();
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
function updateHandlingTextsFor(controls) {
  if (!controls?.arrSlider) return;

  const arrF = Number(controls.arrSlider.value);
  const dasF = Number(controls.dasSlider.value);
  const sdfRaw = Number(controls.sdfSlider.value);

  const arrMs = Math.round(arrF * FRAME_MS);
  const dasMs = Math.round(dasF * FRAME_MS);
  const fmtF = (v) => (Math.round(v * 100) / 100).toString();

  if (controls.arrFText) controls.arrFText.textContent = fmtF(arrF);
  if (controls.arrMsText) controls.arrMsText.textContent = String(arrMs);
  if (controls.dasFText) controls.dasFText.textContent = fmtF(dasF);
  if (controls.dasMsText) controls.dasMsText.textContent = String(dasMs);

  if (controls.sdfText) {
    if (sdfRaw >= 41) controls.sdfText.textContent = "∞";
    else {
      const v = Math.round(sdfRaw * 2) / 2;
      controls.sdfText.textContent = (v % 1 === 0) ? String(v.toFixed(0)) : String(v.toFixed(1));
    }
  }
}

function updateHandlingTexts() {
  updateHandlingTextsFor(desktopControls);
  updateHandlingTextsFor(mobileControls);
}


function updateModeUi(mode, subMode) {
  document.body.classList.toggle("mode-classic", mode === "classic");
  document.body.classList.toggle("mode-4wide", mode === "4wide");
  document.body.classList.toggle("gravity-fixed", subMode === "fixed");
  document.body.classList.add("solo");

  if (els.playMode) els.playMode.value = "solo";
  if (els.startBtn) els.startBtn.textContent = t("startGame");
  updateMobileModeSwitcher();
}

function applySettingsToControls(nextSettings, controls) {
  if (!controls?.mode) return;

  const mode = nextSettings.mode || "4wide";
  const subMode = nextSettings.subMode || "off";
  const garbageSprint = nextSettings.garbageSprint || "off";
  const arrF = nextSettings.arrF ?? (nextSettings.arrMs / FRAME_MS);
  const dasF = nextSettings.dasF ?? (nextSettings.dasMs / FRAME_MS);
  const sdfIsInf = (nextSettings.sdf === Infinity) || (nextSettings.sdf === "Infinity");
  const sdfValue = sdfIsInf ? 41 : (nextSettings.sdfValue ?? Number(nextSettings.sdf));

  controls.mode.value = mode;
  if (controls.subMode) controls.subMode.value = subMode;
  if (controls.garbageSprint) controls.garbageSprint.value = garbageSprint;
  if (controls.gravityFixedInput) controls.gravityFixedInput.value = String(nextSettings.gravityFixedG ?? 0.02);
  if (controls.arrSlider) controls.arrSlider.value = String(arrF);
  if (controls.dasSlider) controls.dasSlider.value = String(dasF);
  if (controls.sdfSlider) controls.sdfSlider.value = String(sdfValue);
  if (controls.volume) controls.volume.value = String(nextSettings.volume ?? 35);
}

function applySettingsToForm(nextSettings) {
  if (els.botDiff) els.botDiff.value = "easy";
  applySettingsToControls(nextSettings, desktopControls);
  applySettingsToControls(nextSettings, mobileControls);
  updateModeUi(nextSettings.mode || "4wide", nextSettings.subMode || "off");
  updateHandlingTexts();
}

function readSettingsFromForm(base, controls = (isMobileUi() ? mobileControls : desktopControls)) {
  const arrF = Number(controls.arrSlider?.value ?? desktopControls.arrSlider.value);
  const dasF = Number(controls.dasSlider?.value ?? desktopControls.dasSlider.value);
  const sdfRaw = Number(controls.sdfSlider?.value ?? desktopControls.sdfSlider.value);
  const sdfRounded = Math.round(sdfRaw * 2) / 2;

  const arrMs = arrF * FRAME_MS;
  const dasMs = dasF * FRAME_MS;
  const sdf = sdfRounded >= 41 ? Infinity : Math.max(1, sdfRounded);

  const mode = controls.mode?.value ?? desktopControls.mode.value;
  const subMode = controls.subMode?.value ?? desktopControls.subMode.value;
  const garbageSprint = controls.garbageSprint?.value ?? desktopControls.garbageSprint?.value ?? "off";
  const gravityFixedG = Math.max(0.01, Math.min(100, Number(controls.gravityFixedInput?.value ?? desktopControls.gravityFixedInput?.value ?? 0.02)));

  return {
    ...base,
    mode,
    playMode: "solo",
    subMode,
    garbageSprint,
    gravityFixedG,
    botDifficulty: "easy",
    arrF,
    dasF,
    sdfValue: sdfRounded,
    arrMs,
    dasMs,
    sdf,
    volume: Number(controls.volume?.value ?? desktopControls.volume.value),
    keybind: { ...(base.keybind || {}) },
  };
}

function applyTranslations() {
  const lang = I18N[currentLocale] || I18N.ko;
  document.documentElement.lang = lang.htmlLang || currentLocale;

  if (els.languageSelect) {
    els.languageSelect.value = currentLocale;
    for (const option of els.languageSelect.options) {
      option.textContent = lang.languageOptions?.[option.value] || option.textContent;
    }
  }
  syncLocaleQuickButtons();
  syncLocalePicker();

  const modeOptClassic = [els.mode, els.mobileMode].map((sel) => sel?.querySelector('option[value="classic"]'));
  const modeOpt4Wide = [els.mode, els.mobileMode].map((sel) => sel?.querySelector('option[value="4wide"]'));
  const subOff = [els.subMode, els.mobileSubMode].map((sel) => sel?.querySelector('option[value="off"]'));
  const subFixed = [els.subMode, els.mobileSubMode].map((sel) => sel?.querySelector('option[value="fixed"]'));
  const subAccel = [els.subMode, els.mobileSubMode].map((sel) => sel?.querySelector('option[value="accel"]'));
  const garbageOff = [els.garbageSprint, els.mobileGarbageSprint].map((sel) => sel?.querySelector('option[value="off"]'));
  const garbageLow = [els.garbageSprint, els.mobileGarbageSprint].map((sel) => sel?.querySelector('option[value="low"]'));
  const garbageMid = [els.garbageSprint, els.mobileGarbageSprint].map((sel) => sel?.querySelector('option[value="mid"]'));
  const garbageHigh = [els.garbageSprint, els.mobileGarbageSprint].map((sel) => sel?.querySelector('option[value="high"]'));
  modeOptClassic.forEach((el) => { if (el) el.textContent = lang.modeClassicOption; });
  modeOpt4Wide.forEach((el) => { if (el) el.textContent = lang.mode4Wide; });
  subOff.forEach((el) => { if (el) el.textContent = lang.subModeOff; });
  subFixed.forEach((el) => { if (el) el.textContent = lang.subModeFixed; });
  subAccel.forEach((el) => { if (el) el.textContent = lang.subModeAccel; });
  garbageOff.forEach((el) => { if (el) el.textContent = lang.garbageSprintOff; });
  garbageLow.forEach((el) => { if (el) el.textContent = lang.garbageSprintLow; });
  garbageMid.forEach((el) => { if (el) el.textContent = lang.garbageSprintMid; });
  garbageHigh.forEach((el) => { if (el) el.textContent = lang.garbageSprintHigh; });

  const byIdText = {
    mobileModeSheetTitle: lang.modeSheetTitle,
    mobileHandlingSheetTitle: lang.handlingTitle,
    desktopKeybindSheetTitle: lang.keySettingsTitle,
    desktopKeybindGuide: lang.keySettingsGuide,
    settingsTitle: lang.settingsTitle,
    settingsGuide: lang.settingsGuide,
    settingsMuted: lang.settingsMuted,
    playStatsHead: lang.session,
    ppsLabel: lang.pps,
    maxComboLabel: lang.maxCombo,
    timeLabel: lang.time,
    piecesLabel: lang.pieces,
    attackStatLabel: lang.attack,
    mobileExitText: lang.exit,
    mobileRestartText: lang.restartShort,
    keysTitle: lang.keySettingsTitleFull,
    keysGuide: lang.keySettingsGuide,
    contactTitle: lang.contactTitle,
    contactDesc: lang.contactDesc,
  };
  Object.entries(byIdText).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });

  setLeadingLabelText(document.getElementById('languageLabel'), lang.languageLabel);
  setLeadingLabelText(document.getElementById('mobileModeLabel'), lang.playModeLabel);
  setLeadingLabelText(document.getElementById('mobileSubModeLabel'), lang.gravityModeLabel);
  setLeadingLabelText(document.getElementById('mobileGarbageSprintLabel'), lang.garbageSprintLabel);
  setLeadingLabelText(document.getElementById('mobileGravityLabel'), lang.fixedGravityLabel);
  setLeadingLabelText(document.getElementById('mobileVolumeLabel'), lang.volumeLabel);
  setLeadingLabelText(document.getElementById('desktopModeLabel'), lang.playModeLabel);
  setLeadingLabelText(document.getElementById('desktopSubModeLabel'), lang.gravityModeLabel);
  setLeadingLabelText(document.getElementById('desktopGarbageSprintLabel'), lang.garbageSprintLabel);
  setLeadingLabelText(document.getElementById('desktopGravityLabel'), lang.fixedGravityLabel);
  setLeadingLabelText(document.getElementById('desktopVolumeLabel'), lang.volumeLabel);

  if (els.mobileModeClassicBtn) els.mobileModeClassicBtn.textContent = lang.modeClassic;
  if (els.mobileMode4WideBtn) els.mobileMode4WideBtn.textContent = lang.mode4Wide;
  if (els.restartBtn) els.restartBtn.textContent = lang.restartWithKey;
  if (els.settingsToggleBtn) els.settingsToggleBtn.textContent = lang.open;

  const touchLabels = {
    moveLeft: lang.touchLeft,
    moveRight: lang.touchRight,
    rotateCCW: lang.touchCCW,
    rotateCW: lang.touchCW,
    rotate180: lang.touchTurn,
    softDrop: lang.touchSoft,
    hardDrop: lang.touchHard,
    hold: lang.touchHold,
  };
  Object.entries(touchLabels).forEach(([action, value]) => {
    const el = document.querySelector(`.touch-btn[data-action="${action}"] .label`);
    if (el) el.textContent = value;
  });

  if (els.mobileModeMenuBtn) els.mobileModeMenuBtn.setAttribute('aria-label', lang.modeMenuAria);
  if (els.mobileHandlingMenuBtn) els.mobileHandlingMenuBtn.setAttribute('aria-label', lang.handlingMenuAria);
  if (els.mobileModeSwitch) els.mobileModeSwitch.setAttribute('aria-label', lang.modeSwitchAria);
  if (els.mobileModeSheet) els.mobileModeSheet.setAttribute('aria-label', lang.modeSheetAria);
  if (els.mobileHandlingSheet) els.mobileHandlingSheet.setAttribute('aria-label', lang.handlingSheetAria);
  const systemRow = document.querySelector('.mobile-system-row');
  if (systemRow) systemRow.setAttribute('aria-label', lang.mobileSystemAria);
  if (els.touchControls) els.touchControls.setAttribute('aria-label', lang.touchControlsAria);
  const contact = document.querySelector('.site-contact');
  if (contact) contact.setAttribute('aria-label', lang.contactAria);
  const canvasEl = document.getElementById('gameCanvas');
  if (canvasEl) canvasEl.setAttribute('aria-label', lang.boardAria);
  const botCanvasEl = document.getElementById('botCanvas');
  if (botCanvasEl) botCanvasEl.setAttribute('aria-label', lang.botAria);

  if (game) {
    game.locale = currentLocale;
    game.uiText = lang;
  }
  renderKeybindEditor();
  updateMobileStartButton();
  updateModeUi(settings.mode || '4wide', settings.subMode || 'off');
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
game = new TetrisGame(input, audio);
const canvas = document.getElementById("gameCanvas");
renderer = new Renderer(canvas);

const botRenderer = null;
game.applySettings(settings);
game.locale = currentLocale;
game.uiText = I18N[currentLocale] || I18N.ko;
applyTranslations();

// ===== viewport scale =====
const viewport = document.getElementById("viewport");
function applyViewportScale() {
  if (!viewport) return;

  const vv = window.visualViewport;
  const ww = Math.round(vv?.width || window.innerWidth || document.documentElement.clientWidth || 0);
  const wh = Math.round(vv?.height || window.innerHeight || document.documentElement.clientHeight || 0);
  const isMobileUi = window.matchMedia("(max-width: 1100px), (pointer: coarse)").matches;

  document.body.classList.toggle("mobile-ui", isMobileUi);
  document.body.classList.toggle("desktop-quick-ui", !isMobileUi);
  relocateKeybindCard();

  const MOBILE_DESIGN_W = 390;
  const MOBILE_DESIGN_H = 736;
  let designW = isMobileUi
    ? MOBILE_DESIGN_W
    : Number(viewport.dataset.designW || 1480);
  let designH = isMobileUi
    ? MOBILE_DESIGN_H
    : Number(viewport.dataset.designH || 920);

  if (isMobileUi) {
    viewport.style.width = `${MOBILE_DESIGN_W}px`;
    document.documentElement.style.setProperty('--mobile-design-h', `${MOBILE_DESIGN_H}px`);
    const appEl = viewport.querySelector('.app');
    if (appEl) appEl.style.height = `${MOBILE_DESIGN_H}px`;
    viewport.style.height = `${MOBILE_DESIGN_H}px`;
  } else {
    document.documentElement.style.removeProperty('--mobile-design-h');
    viewport.style.width = `${Number(viewport.dataset.designW || 1480)}px`;
    viewport.style.height = `${Number(viewport.dataset.designH || 920)}px`;
  }

  const scale = Math.min(ww / designW, wh / designH);

  const dpr = window.devicePixelRatio || 1;
  // scale을 약간 스냅하면 초기 렌더에서 뿌옇게 보이는 현상이 줄어듭니다.
  const snappedScale = Math.round(scale * dpr * 1000) / (dpr * 1000);

  viewport.style.zoom = "";
  if (isMobileUi) {
    viewport.style.top = "0";
    viewport.style.left = "50%";
    viewport.style.transform = `translate3d(-50%, 0, 0) scale3d(${snappedScale}, ${snappedScale}, 1)`;
    viewport.style.transformOrigin = "top center";
  } else {
    viewport.style.top = "50%";
    viewport.style.left = "50%";
    viewport.style.transform = `translate3d(-50%, -50%, 0) scale3d(${snappedScale}, ${snappedScale}, 1)`;
    viewport.style.transformOrigin = "center center";
  }

  // 강제 리플로우(초기 뿌연 렌더링 완화)
  void viewport.offsetHeight;
  if (game) game.isMobileUi = isMobileUi;
  applyMobileSettingsUi();
  updateMobileModeSwitcher();
}


function scheduleViewportScale() {
  // 폰트/레이아웃 초기 계산이 늦으면 깨져 보일 수 있어 2번 rAF로 재계산
  requestAnimationFrame(() => requestAnimationFrame(applyViewportScale));
}

window.addEventListener("resize", applyViewportScale);
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", scheduleViewportScale);
  window.visualViewport.addEventListener("scroll", scheduleViewportScale);
}
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

  for (const action of ACTIONS) {
    const label = getActionLabel(action);
    const row = document.createElement("div");
    row.className = "keybind-row";

    const left = document.createElement("div");
    left.className = "label";
    const code = game.settings.keybind[action];
    left.innerHTML = `
      <div class="keybind-top">
        <div class="keybind-name">${label}</div>
        <div class="keybind-current">
          <span class="key">${prettyKey(code)}</span>
          <span class="key-code">${code}</span>
        </div>
      </div>`;

    const btn = document.createElement("button");
    btn.className = "keybind-change-btn";
    btn.textContent = t("change");
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

function toggleMobileSheet(kind) {
  if (!hasQuickTopbarUi()) return;
  if (kind === "mode") {
    mobileModeSheetOpen = !mobileModeSheetOpen;
    if (mobileModeSheetOpen) mobileHandlingSheetOpen = false;
  } else {
    mobileHandlingSheetOpen = !mobileHandlingSheetOpen;
    if (mobileHandlingSheetOpen) mobileModeSheetOpen = false;
  }
  applyMobileSettingsUi();
}

if (els.mobileModeMenuBtn) {
  els.mobileModeMenuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMobileSheet("mode");
  });
}

if (els.mobileHandlingMenuBtn) {
  els.mobileHandlingMenuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMobileSheet("handling");
  });
}

if (els.mobileModeClassicBtn) {
  els.mobileModeClassicBtn.addEventListener("click", () => {
    if ((settings.mode || "4wide") === "classic") return;
    desktopControls.mode.value = "classic";
    if (mobileControls.mode) mobileControls.mode.value = "classic";
    onModeChanged("mobile");
  });
}

if (els.mobileMode4WideBtn) {
  els.mobileMode4WideBtn.addEventListener("click", () => {
    if ((settings.mode || "4wide") === "4wide") return;
    desktopControls.mode.value = "4wide";
    if (mobileControls.mode) mobileControls.mode.value = "4wide";
    onModeChanged("mobile");
  });
}

if (els.languageSelect) {
  els.languageSelect.addEventListener("change", () => {
    applyLocaleChange(els.languageSelect.value);
  });
}

for (const btn of (els.localeQuickButtons || [])) {
  btn.addEventListener("click", () => {
    applyLocaleChange(btn.dataset.locale);
  });
}

if (els.localePickerBtn) {
  els.localePickerBtn.addEventListener("click", () => {
    const willOpen = !els.localePicker?.classList.contains("is-open");
    setLocalePickerOpen(willOpen);
  });
}

for (const btn of (els.localeMenuButtons || [])) {
  btn.addEventListener("click", () => {
    applyLocaleChange(btn.dataset.locale);
    setLocalePickerOpen(false);
  });
}

window.addEventListener("pointerdown", (e) => {
  const target = e.target;
  if (!(target instanceof Element)) return;

  if (els.localePicker && !target.closest("#localePicker")) {
    setLocalePickerOpen(false);
  }

  if (!hasQuickTopbarUi()) return;
  if (target.closest(".mobile-sheet") || target.closest(".mobile-topbar") || target.closest(".mobile-mode-switch") || target.closest(".mobile-system-row")) return;
  closeMobileSheets();
});

applyMobileSettingsUi();

// ===== settings changes =====
function applySettingsLive(next) {
  // PLAYING 중 안전하게 즉시 반영 가능한 항목만
  game.settings.subMode = next.subMode;
  game.settings.garbageSprint = next.garbageSprint;
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

function onSettingsChanged(source = (isMobileUi() ? "mobile" : "desktop")) {
  const controls = source === "mobile" ? mobileControls : desktopControls;
  let next = readSettingsFromForm(game.settings, controls);
  next = enforceFixedSettings(next);
  saveSettings(next);
  settings = next;

  applySettingsToForm(next);

  if (game.state === "PLAYING") {
    applySettingsLive(next);
    updateMobileStartButton();
    return;
  }

  game.applySettings(next);
  input.keybind = game.settings.keybind;
  audio.setVolume01((game.settings.volume ?? 35) / 100);

  renderKeybindEditor();
  scheduleViewportScale();
  updateMobileStartButton();
}

function onModeChanged(source = (isMobileUi() ? "mobile" : "desktop")) {
  const controls = source === "mobile" ? mobileControls : desktopControls;
  let next = readSettingsFromForm(game.settings, controls);
  next = enforceFixedSettings(next);
  saveSettings(next);
  settings = next;

  applySettingsToForm(next);

  game.applySettings(next);
  input.keybind = game.settings.keybind;
  audio.setVolume01((game.settings.volume ?? 35) / 100);

  renderKeybindEditor();
  scheduleViewportScale();
  game.toTitle();
  closeMobileSheets();
  updateMobileStartButton();
}

// 모드 관련 change
[els.mode, els.subMode, els.garbageSprint, els.gravityFixedInput].forEach((x) =>
  x?.addEventListener("change", () => onModeChanged("desktop"))
);
[els.mobileMode, els.mobileSubMode, els.mobileGarbageSprint, els.mobileGravityFixedInput].forEach((x) =>
  x?.addEventListener("change", () => onModeChanged("mobile"))
);

// 볼륨은 바로 반영
els.volume.addEventListener("change", () => onSettingsChanged("desktop"));
els.mobileVolume?.addEventListener("change", () => onSettingsChanged("mobile"));

// handling sliders: input(즉시 반영)
els.arrSlider.addEventListener("input", () => onSettingsChanged("desktop"));
els.dasSlider.addEventListener("input", () => onSettingsChanged("desktop"));
els.sdfSlider.addEventListener("input", () => onSettingsChanged("desktop"));
els.mobileArrSlider?.addEventListener("input", () => onSettingsChanged("mobile"));
els.mobileDasSlider?.addEventListener("input", () => onSettingsChanged("mobile"));
els.mobileSdfSlider?.addEventListener("input", () => onSettingsChanged("mobile"));

function startFromControls(source = (isMobileUi() ? "mobile" : "desktop")) {
  const controls = source === "mobile" ? mobileControls : desktopControls;
  let next = readSettingsFromForm(game.settings, controls);
  next = enforceFixedSettings(next);
  saveSettings(next);
  settings = next;

  applySettingsToForm(next);
  game.applySettings(next);
  input.keybind = game.settings.keybind;

  audio.setVolume01((game.settings.volume ?? 35) / 100);
  audio.unlock();

  renderKeybindEditor();
  scheduleViewportScale();
  game.start();
  closeMobileSheets();
  updateMobileStartButton();
}

els.startBtn.addEventListener("click", () => startFromControls("desktop"));

els.mobileStartBtn?.addEventListener("click", () => startFromControls(isMobileUi() ? "mobile" : "desktop"));

els.mobileExitBtn?.addEventListener("click", () => {
  closeMobileSheets();
  game.toTitle();
  updateMobileStartButton();
});

els.mobileRestartBtn?.addEventListener("click", () => {
  audio.setVolume01((game.settings.volume ?? 35) / 100);
  audio.unlock();

  if (game.state === "PLAYING" || game.state === "GAME_OVER") {
    game.restart();
  } else {
    let next = readSettingsFromForm(game.settings, isMobileUi() ? mobileControls : desktopControls);
    next = enforceFixedSettings(next);
    saveSettings(next);
    settings = next;

    applySettingsToForm(next);
    game.applySettings(next);
    input.keybind = game.settings.keybind;
    game.start();
  }
  closeMobileSheets();
  updateMobileStartButton();
});

canvas?.addEventListener("click", () => {
  if (isMobileUi()) return;
  if (game.state !== "TITLE") return;
  startFromControls("desktop");
});

window.addEventListener("keydown", (e) => {
  if (isMobileUi()) return;
  if (e.code !== "Enter") return;
  if (rebinding || game.state !== "TITLE") return;
  e.preventDefault();
  startFromControls("desktop");
});

els.restartBtn.addEventListener("click", () => {
  audio.setVolume01((game.settings.volume ?? 35) / 100);
  audio.unlock();

  if (game.state === "PLAYING" || game.state === "GAME_OVER") {
    game.restart();
  } else {
    let next = readSettingsFromForm(game.settings, desktopControls);
    next = enforceFixedSettings(next);
    saveSettings(next);
    settings = next;

    applySettingsToForm(next);
    game.applySettings(next);
    input.keybind = game.settings.keybind;
    game.start();
  }
  updateMobileStartButton();
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

  const pps = (game.playTimeSec > 0) ? (game.piecesPlaced / game.playTimeSec) : 0;
  if (els.ppsText) els.ppsText.textContent = pps.toFixed(2);
  if (els.maxComboText) els.maxComboText.textContent = String(game.maxCombo ?? 0);
  if (els.timeText) els.timeText.textContent = formatSessionTime(game.playTimeSec ?? 0);
  if (els.piecesText) els.piecesText.textContent = String(game.piecesPlaced ?? 0);
  if (els.attackTotalStatText) els.attackTotalStatText.textContent = String(game.attackTotal ?? 0);

  updateMobileModeSwitcher();
  updateMobileStartButton();
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
