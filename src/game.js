import { DEFAULT_SETTINGS, getKickData, getKickData180 } from "./constants.js?v=0.3.71";
import { Board } from "./board.js?v=0.3.71";
import { BagRandomizer } from "./randomizer.js?v=0.3.71";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// 공격(딜) 계산: '간단 Multiplier 방식'
function calcAttack(base, combo) {
  // 콤보가 쌓일수록 더 크게 들어가도록(4W 봇전 밸런스)
  const c = Math.max(0, combo);
  if (base > 0) return Math.floor(base * (1 + 0.35 * c));
  if (c >= 2) return Math.floor(Math.log(1 + 1.60 * c));
  return 0;
}

function baseAttackFromClear(cleared, tspin, b2bBonus) {
  let base = 0;

  if (tspin) {
    // 간단화: T-Spin은 라인수 * 2 (TSS=2, TSD=4, TST=6 느낌)
    base = Math.max(0, cleared) * 2;
  } else {
    // Single=0, Double=1, Triple=2, Quad=4
    if (cleared === 2) base = 1;
    if (cleared === 3) base = 2;
    if (cleared === 4) base = 4;
  }

  return base + (b2bBonus ? 1 : 0);
}

export class TetrisGame {
  constructor(input, audio = null) {
    this.input = input;
    this.audio = audio;

    this.state = "TITLE";
    this.settings = deepCopy(DEFAULT_SETTINGS);

    this.board = null;
    this.matchSeed = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
    this.randomizer = new BagRandomizer(this.settings.previewCount, this.matchSeed);
    this.currentPiece = null;
    this.holdType = null;
    this.holdUsed = false;

    this.dropAccumulator = 0;
    this.lockTimerMs = 0;
    this.lineCount = 0;
    this.score = 0;
    this.level = 1;
    this.combo = -1;
    this.b2b = 0;
    this.lastClearWasB2BType = false;

    // ✅ Accel 시간은 '게임 시작 후'에만 증가해야 함
    this.playTimeSec = 0;

    // 입력 그레이스(회전 중/직후 이동 끊김 완화)
    this._recentRotateMs = 0;
    this._recentMoveSeenMs = 0;

    // 공격(딜) HUD
    this.attackLast = 0;
    this.attackTotal = 0;

    // 팝업(공격/올클리어)
    this.popup = null;

    // VS: incoming garbage queue
    this.incoming = []; // [{holes:number[]}]
    this.incomingTotal = 0;

    // Bot opponent (실제 보드/미노를 가진 봇)
    this.bot = null;

    this._lastMoveSeenMs = 0;

    this.moveRepeat = {
      active: false,
      dir: null,
      startedAt: 0,
      lastStepAt: 0
    };

    this.initBoard();
  }

  initBoard() {
    const mode = this.settings.mode || "4wide";
    if (mode === "classic") {
      this.board = new Board(10, 20, 24);
      return;
    }
    this.board = new Board(4, 26, 40);
  }

  applySettings(nextSettings) {
    this.settings = {
      ...deepCopy(DEFAULT_SETTINGS),
      ...nextSettings,
      keybind: {
        ...deepCopy(DEFAULT_SETTINGS.keybind),
        ...(nextSettings.keybind ?? {})
      }
    };

    this.settings.previewCount = clamp(Number(this.settings.previewCount) || 6, 1, 6);
    this.settings.dasMs = Math.max(0, Number(this.settings.dasMs) || 0);
    this.settings.arrMs = Math.max(0, Number(this.settings.arrMs) || 0);
    this.settings.lockDelayMs = Math.max(0, Number(this.settings.lockDelayMs) || 0);

    // SDF 정규화
    if (this.settings.sdf === Infinity) {
      // keep
    } else if (typeof this.settings.sdf === "string" && this.settings.sdf.toLowerCase() === "infinity") {
      this.settings.sdf = Infinity;
    } else {
      const n = Number(this.settings.sdf);
      if (n === Infinity) this.settings.sdf = Infinity;
      else this.settings.sdf = Number.isFinite(n) ? Math.max(0, n) : 20;
    }

    // normalize audio fields
    this.settings.soundEnabled = this.settings.soundEnabled !== false;
    this.settings.volume = Math.max(0, Math.min(100, Number(this.settings.volume ?? 35)));
    // 봇전은 일단 제거
    this.bot = null;
    this.incoming = [];
    this.incomingTotal = 0;

    this.initBoard();
    this.randomizer.reset(this.settings.previewCount);
    this.resetRoundStats();
    this.state = "TITLE";
  }

  start() {
    this.input.resetTransient();

    // ✅ 게임마다 새 시드 생성
    // 같은 게임 안에서는 플레이어/봇이 같은 시퀀스를 쓰되,
    // 다음 게임에서는 다른 시퀀스가 나오도록 합니다.
    this.matchSeed = ((Date.now() + Math.floor(Math.random() * 0xffffffff)) >>> 0);

    if (this.randomizer && this.randomizer.setSeed) this.randomizer.setSeed(this.matchSeed);
    this.resetRoundStats();
    this.board.reset();
    this.randomizer.reset(this.settings.previewCount);
    this.holdType = null;
    this.holdUsed = false;

    this.state = "PLAYING";

    if (this.bot) {
      if (this.bot.setSeed) this.bot.setSeed(this.matchSeed);
      this.bot.reset();
    }

    this.spawnNext();
  }

  restart() {
    this.start();
  }

  toTitle() {
    this.input.resetTransient();

    this.state = "TITLE";
    this.currentPiece = null;
    this.board.reset();
  }

  resetRoundStats() {
    this.dropAccumulator = 0;
    this.lockTimerMs = 0;
    this.lineCount = 0;
    this.score = 0;
    this.level = 1;
    this.combo = -1;
    this.b2b = 0;
    this.lastClearWasB2BType = false;

    this.playTimeSec = 0;
    this.attackLast = 0;
    this.attackTotal = 0;

    this.popup = null;

    this.incoming = [];
    this.incomingTotal = 0;

    if (this.bot) {
      this.bot.reset();
    }
  }

  spawnNext(typeOverride = null) {
    const type = typeOverride ?? this.randomizer.next();

    const spawnX = Math.floor((this.board.w - 4) / 2);
    const spawnY = this.board.hiddenH - 2;

    const piece = {
      type,
      x: spawnX,
      y: spawnY,
      rot: 0,
      lastAction: "spawn"
    };

    if (this.board.collides(piece)) {
      this.state = "GAME_OVER"; // Block Out
      this.currentPiece = piece;
      return;
    }

    this.currentPiece = piece;
    this.lockTimerMs = 0;
    this.holdUsed = false;
  }

  tryMove(dx, dy, actionLabel = "move") {
    if (!this.currentPiece) return false;
    const next = { ...this.currentPiece, x: this.currentPiece.x + dx, y: this.currentPiece.y + dy, lastAction: actionLabel };
    if (this.board.collides(next)) return false;
    this.currentPiece = next;
    if (dy === 0) this.lockTimerMs = 0;
    return true;
  }

  tryRotate(dir /* 1 cw, -1 ccw */) {
    if (!this.currentPiece) return false;
    const from = this.currentPiece.rot;
    const to = (from + (dir === 1 ? 1 : 3)) % 4;
    const kicks = getKickData(this.currentPiece.type, from, to);

    for (const [kx, ky] of kicks) {
      const rotated = {
        ...this.currentPiece,
        rot: to,
        x: this.currentPiece.x + kx,
        y: this.currentPiece.y - ky,
        lastAction: "rotate"
      };
      if (!this.board.collides(rotated)) {
        this.currentPiece = rotated;
        this.lockTimerMs = 0;
        return true;
      }
    }
    return false;
  }

  tryRotate180() {
    if (!this.currentPiece) return false;
    if (this.currentPiece.type === "O") return false;

    const from = this.currentPiece.rot;
    const to = (from + 2) % 4;

    // ✅ TETR.IO 스타일: 중간 상태(90도)를 거치지 않고 180 킥 테이블로 직접 시도
    const kicks = getKickData180(this.currentPiece.type, from, to);

    for (const [kx, ky] of kicks) {
      const rotated = {
        ...this.currentPiece,
        rot: to,
        x: this.currentPiece.x + kx,
        y: this.currentPiece.y - ky,
        lastAction: "rotate"
      };
      if (!this.board.collides(rotated)) {
        this.currentPiece = rotated;
        this.lockTimerMs = 0;
        return true;
      }
    }
    return false;
  }

  hardDrop() {
    if (!this.currentPiece) return;
    let dropped = 0;
    while (this.tryMove(0, 1, "hardDrop")) dropped++;
    this.score += dropped * 2;
    this.lockNow(performance.now());
  }

  hold() {
    if (!this.currentPiece || this.holdUsed) return;

    const currentType = this.currentPiece.type;
    if (!this.holdType) {
      this.holdType = currentType;
      this.spawnNext();
    } else {
      const temp = this.holdType;
      this.holdType = currentType;
      this.spawnNext(temp);
    }
    this.holdUsed = true;
  }

  getGhostPiece() {
    if (!this.currentPiece) return null;
    const ghost = { ...this.currentPiece };
    while (!this.board.collides({ ...ghost, y: ghost.y + 1 })) {
      ghost.y += 1;
    }
    return ghost;
  }

  lockNow(now = performance.now()) {
    if (!this.currentPiece) return;

    const piece = { ...this.currentPiece };
    this.board.lock(piece);

    if (this.audio && this.settings.soundEnabled) {
      this.audio.play("lock");
    }

    const lockOut = this.board.isLockOut(piece);
    const cleared = this.board.clearLines();

    // 올클리어(All Clear): 라인 삭제 후 보드가 완전히 비었는지 체크
    const allClear = cleared > 0 && this.board.grid.every((row) => row.every((c) => c === null));

    const attackRaw = this.updateScore(cleared, piece, allClear);

    // ===== VS: 공격 → incoming cancel → bot damage =====
    // 규칙:
    // - 빨간 인커밍 바가 남아 있는 동안에는 "공격 전송"을 하지 않음
    // - 그 대신 이번 라인 클리어는 인커밍 상쇄에만 사용
    let attackToBot = attackRaw;
    const hadIncomingBeforeAttack = this.incomingTotal > 0;

    if (hadIncomingBeforeAttack && attackToBot > 0) {
      this.cancelIncoming(Math.min(this.incomingTotal, attackToBot));
      attackToBot = 0;
    }

    if (this.bot && attackToBot > 0) {
      // ✅ 플레이어가 만든 공격(딜)을 봇에게 '가비지 라인'으로 보냅니다.
      // 홀 위치는 4W 기준(0~3)에서 랜덤(약간의 반복)으로 생성합니다.
      const holes = [];
      let hole = Math.floor(Math.random() * 4);
      for (let i = 0; i < attackToBot; i++) {
        if (Math.random() < 0.35) hole = Math.floor(Math.random() * 4);
        holes.push(hole);
      }
      this.bot.receiveGarbage(holes);
    }

    this.attackLast = attackToBot;
    this.attackTotal += attackToBot;

    // 팝업: 올클리어 우선
    if (cleared > 0) {
      if (allClear) {
        this.popup = { kind: "allclear", text: "올클리어", startedAt: now, durationMs: 900 };
      } else if (this.bot) {
        // ✅ 봇전: 콤보 대신 '딜 합계(누적)'를 크게 표시(테트리오 느낌)
        if (attackToBot > 0) {
          this.popup = { kind: "attackTotal", value: this.attackTotal, startedAt: now, durationMs: 650 };
        }
      } else {
        // ✅ 솔로: 콤보 숫자 표시
        const comboShown = Math.max(0, this.combo) + 1;
        this.popup = { kind: "combo", value: comboShown, startedAt: now, durationMs: 650 };
      }
    }

    // 쓰레기 적용: 라인을 못 지운 설치 때 '한 패킷씩' 올라오게
    // (테트리오 빨간 바의 검은 간격처럼, 딜이 나뉘어 들어오는 느낌)
    if (cleared === 0 && this.incomingTotal > 0) {
      const overflow = this.applyIncomingStep();
      if (overflow) {
        this.state = "GAME_OVER";
        return;
      }
    }

    if (lockOut) {
      this.state = "GAME_OVER"; // Lock Out
      return;
    }

    this.spawnNext();
  }

  updateScore(cleared, piece, allClear = false) {
    const isT = piece.type === "T";
    const tspin = isT && this.isTSpin(piece);

    // ===== score (기존 점수 시스템 유지) =====
    let add = 0;
    let b2bType = false;

    if (tspin) {
      if (cleared === 0) add = 100;
      if (cleared === 1) { add = 800; b2bType = true; }
      if (cleared === 2) { add = 1200; b2bType = true; }
      if (cleared >= 3) { add = 1600; b2bType = true; }
    } else {
      if (cleared === 1) add = 100;
      if (cleared === 2) add = 300;
      if (cleared === 3) add = 500;
      if (cleared === 4) { add = 800; b2bType = true; }
    }

    // combo
    if (cleared > 0) {
      this.combo += 1;
      if (this.combo > 0) add += this.combo * 50;
    } else {
      this.combo = -1;
    }

    // b2b
    if (cleared > 0) {
      if (b2bType) {
        if (this.lastClearWasB2BType) this.b2b += 1;
        else this.b2b = 1;
        this.lastClearWasB2BType = true;
      } else {
        this.b2b = 0;
        this.lastClearWasB2BType = false;
      }
    }

    this.score += add;
    this.lineCount += cleared;
    this.level = 1 + Math.floor(this.lineCount / 10);

    // ===== attack (딜) =====
    const b2bActive = this.b2b >= 2;
    const attack = this.computeAttackLines({
      cleared,
      tspin,
      b2bActive,
      combo: this.combo,
      allClear
    });

    return attack;
  }

  // ===== VS (garbage) helpers =====
  enqueueGarbage(holes) {
    if (!holes || holes.length === 0) return;
    this.incoming.push({ holes });
    this.incomingTotal += holes.length;
  }

  cancelIncoming(n) {
    let remaining = n;
    while (remaining > 0 && this.incoming.length > 0) {
      const seg = this.incoming[0];
      const take = Math.min(remaining, seg.holes.length);
      seg.holes.splice(0, take);
      remaining -= take;
      this.incomingTotal -= take;
      if (seg.holes.length === 0) this.incoming.shift();
    }
    return n - remaining;
  }


  applyIncomingStep() {
    if (this.incoming.length === 0) return false;

    const seg = this.incoming.shift();
    this.incomingTotal -= seg.holes.length;
    return this.board.addGarbageHoles(seg.holes);
  }

  applyIncomingAll() {
    let overflow = false;
    while (this.incoming.length > 0) {
      const seg = this.incoming.shift();
      this.incomingTotal -= seg.holes.length;
      overflow = this.board.addGarbageHoles(seg.holes) || overflow;
    }
    this.incomingTotal = 0;
    return overflow;
  }

  // ===== Attack 계산 (TETR.IO 'Multiplier' 모델 기반, 간단 구현) =====
  // - base*(1+0.25x), base=0이면 ln(1+1.25x) (2-combo+)
  // - B2B active면 +1
  computeAttackLines({ cleared, tspin, b2bActive, combo, allClear }) {
    let base = 0;

    if (tspin) {
      if (cleared === 1) base = 2;
      else if (cleared === 2) base = 4;
      else if (cleared >= 3) base = 6;
      else base = 0;
    } else {
      if (cleared === 1) base = 0;
      else if (cleared === 2) base = 1;
      else if (cleared === 3) base = 2;
      else if (cleared === 4) base = 4;
    }

    if (b2bActive && base > 0) base += 1;

    const x = Math.max(0, combo);
    let raw = 0;
    if (base > 0) raw = base * (1 + 0.25 * x);
    else raw = x >= 2 ? Math.log(1 + 1.25 * x) : 0;

    let out = Math.floor(raw);

    // all clear bonus: +4 (4W 봇전 밸런스)
    if (allClear) out += 4;

    return Math.max(0, out);
  }


  isTSpin(piece) {
    if (piece.type !== "T") return false;
    if (piece.lastAction !== "rotate") return false;

    // 3-corner rule around T center (x+1, y+2 in our T rot definitions)
    const cx = piece.x + 1;
    const cy = piece.y + 2;

    const corners = [
      [cx - 1, cy - 1],
      [cx + 1, cy - 1],
      [cx - 1, cy + 1],
      [cx + 1, cy + 1]
    ];

    let blocked = 0;
    for (const [x, y] of corners) {
      if (x < 0 || x >= this.board.w || y >= this.board.h || y < 0 || this.board.grid[y]?.[x]) {
        blocked++;
      }
    }
    return blocked >= 3;
  }

  handleOneShotInputs(now) {
    if (!this.currentPiece) return;

    let rotated = false;
    if (this.input.consumeJustPressed("rotateCW")) rotated = this.tryRotate(1) || rotated;
    if (this.input.consumeJustPressed("rotateCCW")) rotated = this.tryRotate(-1) || rotated;
    if (this.input.consumeJustPressed("rotate180")) rotated = this.tryRotate180() || rotated;
    if (this.input.consumeJustPressed("hardDrop")) this.hardDrop();
    if (this.input.consumeJustPressed("hold")) this.hold();

    // DAS immediate step on fresh press
    if (this.input.consumeJustPressed("moveLeft")) {
      this.tryMove(-1, 0, "move");
      this.startMoveRepeat("moveLeft", now);
    }
    if (this.input.consumeJustPressed("moveRight")) {
      this.tryMove(1, 0, "move");
      this.startMoveRepeat("moveRight", now);
    }

    // ✅ 이동을 누른 채 회전하면 'DAS/ARR 타이밍' 때문에 다음 이동이 늦어져
    //    부드럽지 않게 느껴질 수 있습니다.
    //    회전이 성공했고, 한쪽 방향키를 계속 누르고 있는 상태라면
    //    같은 프레임에 1칸 이동을 한 번 더 시도해서 끊김을 줄입니다.
    if (rotated) {
      const left = this.input.isDown("moveLeft");
      const right = this.input.isDown("moveRight");
      if ((left && !right) || (!left && right)) {
        const dir = left ? -1 : 1;
        this.tryMove(dir, 0, "move");
        // 같은 프레임에서 DAS/ARR가 또 이동시키지 않게 타이밍을 갱신
        if (this.moveRepeat.active) this.moveRepeat.lastStepAt = now;
      }
    }
  }

  startMoveRepeat(dir, now) {
    this.moveRepeat.active = true;
    this.moveRepeat.dir = dir;
    this.moveRepeat.startedAt = now;
    this.moveRepeat.lastStepAt = now;
  }

  handleDasArr(now) {
    let leftDown = this.input.isDown("moveLeft");
    let rightDown = this.input.isDown("moveRight");

    // ✅ '이동 누른 채 회전'에서 일부 환경(키보드 롤오버/OS 이벤트 타이밍) 때문에
    //    이동 입력이 1~2프레임 끊기며 DAS가 재시작(뚝 끊김)되는 현상이 있습니다.
    //
    // 해결 전략(키 조합에 의존하지 않음):
    // 1) 이동이 감지된 시각(_recentMoveSeenMs)을 기록
    // 2) 회전이 발생한 시각(_recentRotateMs)을 기록
    // 3) 이동이 잠깐 끊겨도 "회전 직후"라면 lastDir을 120ms 정도 유지
    // 4) 끊긴 순간에 moveRepeat를 꺼버리지 않고(=DAS 리셋 방지) 그레이스 동안 유지
    const rotatingHeld =
      this.input.isDown("rotateCW") ||
      this.input.isDown("rotateCCW") ||
      this.input.isDown("rotate180");

    // 이동 감지 시각 갱신
    if (leftDown || rightDown) {
      this._recentMoveSeenMs = now;
    }

    const moveGraceMs = 90;     // 이동 입력 끊김 허용 (짧게)
    const rotateGraceMs = 140;  // 회전 직후(또는 회전 누르는 동안) 유예

    const rotateRecent = (now - this._recentRotateMs) < rotateGraceMs || rotatingHeld;
    const moveRecent = (now - this._recentMoveSeenMs) < moveGraceMs;

    // 이동이 안 잡히는데(둘 다 false) 회전 직후/중이고 직전 이동이 있었다면 lastDir 유지
    if (!leftDown && !rightDown && rotateRecent && moveRecent && this.input.lastDir) {
      leftDown = this.input.lastDir === "moveLeft";
      rightDown = this.input.lastDir === "moveRight";
    }

    // 완전히 입력이 없으면(그레이스도 없음) 반복 이동 상태를 해제
    if (!leftDown && !rightDown) {
      this.moveRepeat.active = false;
      this.moveRepeat.dir = null;
      return;
    }

    const dir = this.input.lastDir || (leftDown ? "moveLeft" : "moveRight");
    if (!this.moveRepeat.active || this.moveRepeat.dir !== dir) {
      this.startMoveRepeat(dir, now);
      return;
    }

    const elapsed = now - this.moveRepeat.startedAt;
    if (elapsed < this.settings.dasMs) return;

    const stepMs = this.settings.arrMs;
    if (stepMs === 0) {
      // instant shift
      if (dir === "moveLeft") {
        while (this.tryMove(-1, 0, "move")) {}
      } else {
        while (this.tryMove(1, 0, "move")) {}
      }
      this.moveRepeat.active = false;
      return;
    }

    if (now - this.moveRepeat.lastStepAt >= stepMs) {
      const moved = dir === "moveLeft" ? this.tryMove(-1, 0, "move") : this.tryMove(1, 0, "move");
      // blocked -> do nothing
      this.moveRepeat.lastStepAt = now;
    }
  }

  update(dtMs, now) {
    // global shortcuts
    if (this.input.consumeJustPressed("restart")) {
      this.restart();
      return;
    }
    if (this.input.consumeJustPressed("exit")) {
      this.toTitle();
      return;
    }

    if (this.state !== "PLAYING") return;
    if (!this.currentPiece) return;

    // ✅ PLAYING에서만 시간이 흐른다
    this.playTimeSec += dtMs / 1000;

    this.handleOneShotInputs(now);
    this.handleDasArr(now);

    // gravity in cells/sec. Treat 1G as 60 cells/sec.
    let g = 0;
    if (this.settings.subMode === "accel") {
      g = Math.min(100, this.settings.gravityBaseG + this.settings.gravityAccelPerSec * this.playTimeSec);
    } else if (this.settings.subMode === "fixed") {
      g = Math.max(0.01, Math.min(100, Number(this.settings.gravityFixedG ?? this.settings.gravityBaseG ?? 0.02)));
    } else {
      g = 0;
    }

    const gravityCps = g * 60;

        const soft = this.input.isDown("softDrop");

        // SDF(Soft Drop Factor): 숫자 또는 Infinity
        const sdfIsInf = this.settings.sdf === Infinity;
        const sdfFactor = soft ? (sdfIsInf ? 9999 : Math.max(1, this.settings.sdf)) : 1;

        // ✅ SDF=Infinity는 '바닥까지 즉시' 내려가야 하는데, 누적 루프(수천 번)는 느릴 수 있음
        // 그래서 Infinity일 때는 accumulator 대신 "바닥까지 한 번에 이동" 방식으로 처리합니다.
        if (soft && sdfIsInf) {
          let movedCount = 0;
          while (this.tryMove(0, 1, "softDrop")) movedCount++;
          if (movedCount > 0) this.score += movedCount; // soft drop 점수
          this.dropAccumulator = 0;
        } else {
          // ✅ 중력 OFF(infinite)라도 소프트드랍은 동작해야 함
          const cps = (this.settings.subMode !== "off")
            ? gravityCps * sdfFactor
            : (soft ? 60 * sdfFactor : 0);

          this.dropAccumulator += (dtMs / 1000) * cps;

          while (this.dropAccumulator >= 1) {
            const moved = this.tryMove(0, 1, soft ? "softDrop" : "fall");
            if (!moved) {
              this.dropAccumulator = 0;
              break;
            }
            if (soft) this.score += 1;
            this.dropAccumulator -= 1;
          }
        }



// ✅ 중력 OFF 모드에서는 자동 락(설치) 금지
    // - 바닥에 닿아도 lockDelay로 자동 고정하지 않습니다.
    // - 설치는 hardDrop(스페이스)로만 가능하게 됩니다.
    if (this.settings.subMode === "off") {
      this.lockTimerMs = 0;
      return;
    }

    const touchingGround = this.board.collides({ ...this.currentPiece, y: this.currentPiece.y + 1 });
    if (touchingGround) {
      this.lockTimerMs += dtMs;
      if (this.lockTimerMs >= this.settings.lockDelayMs) {
        this.lockNow(performance.now());
        this.lockTimerMs = 0;
      }
    } else {
      this.lockTimerMs = 0;
    }
  }

  getGravityText(_now) {
    if (this.settings.subMode === "off") return "OFF";
    const t = this.state === "PLAYING" ? this.playTimeSec : 0;
    const g = this.settings.subMode === "accel"
      ? Math.min(100, this.settings.gravityBaseG + this.settings.gravityAccelPerSec * t)
      : Math.max(0.01, Math.min(100, Number(this.settings.gravityFixedG ?? this.settings.gravityBaseG ?? 0.02)));
    return `${g.toFixed(4)} G`;
  }
}
