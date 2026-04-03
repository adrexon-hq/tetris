import { PIECE_CELLS } from "./constants.js?v=0.3.58";
import { Board } from "./board.js?v=0.3.58";
import { BagRandomizer } from "./randomizer.js?v=0.3.58";

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

function cloneGrid(grid) {
  return grid.map((r) => r.slice());
}

function clearLinesInGrid(grid) {
  let cleared = 0;
  for (let y = grid.length - 1; y >= 0; y--) {
    if (grid[y].every(Boolean)) {
      grid.splice(y, 1);
      grid.unshift(Array(grid[0].length).fill(null));
      cleared++;
      y++;
    }
  }
  return cleared;
}

function evalGrid(grid) {
  const h = grid.length;
  const w = grid[0].length;

  const heights = new Array(w).fill(0);
  for (let x = 0; x < w; x++) {
    let y = 0;
    while (y < h && grid[y][x] === null) y++;
    heights[x] = h - y;
  }

  const maxH = Math.max(...heights);

  let holes = 0;
  for (let x = 0; x < w; x++) {
    let seen = false;
    for (let y = 0; y < h; y++) {
      if (grid[y][x] !== null) seen = true;
      else if (seen) holes++;
    }
  }

  let bump = 0;
  for (let x = 0; x < w - 1; x++) bump += Math.abs(heights[x] - heights[x + 1]);

  // 4Wide 전용 지표
  // col0 = well(우물), col1~3 = 스택 영역
  let readyRows = 0;
  let nearReadyRows = 0;
  let wellBlocks = 0;
  for (let y = 0; y < h; y++) {
    const c0 = grid[y][0] !== null;
    const c1 = grid[y][1] !== null;
    const c2 = grid[y][2] !== null;
    const c3 = grid[y][3] !== null;
    const filled3 = Number(c1) + Number(c2) + Number(c3);

    if (!c0 && filled3 === 3) readyRows++;
    else if (!c0 && filled3 === 2) nearReadyRows++;

    if (c0) wellBlocks++;
  }

  const stackVariance = Math.abs(heights[1] - heights[2]) + Math.abs(heights[2] - heights[3]);

  return { heights, maxH, holes, bump, readyRows, nearReadyRows, wellBlocks, stackVariance };
}

// 플레이어 쪽과 맞춘 간단 공격식
function computeAttackLines({ cleared, tspin, b2bActive, combo, allClear, attackScale = 1 }) {
  let base = 0;

  if (tspin) {
    if (cleared === 1) base = 2;
    else if (cleared === 2) base = 4;
    else if (cleared >= 3) base = 6;
  } else {
    if (cleared === 2) base = 1;
    else if (cleared === 3) base = 2;
    else if (cleared === 4) base = 4;
  }

  if (b2bActive && base > 0) base += 1;

  const c = Math.max(0, combo);
  let raw = 0;
  if (base > 0) raw = base * (1 + 0.35 * c);
  else raw = c >= 2 ? Math.log(1 + 1.60 * c) : 0;

  let out = Math.floor(raw);
  if (allClear) out += 4;
  out = Math.max(0, Math.floor(out * (attackScale ?? 1)));

  return Math.max(0, out);
}

function makeCollisionChecker(grid, w, h, cells) {
  return (tx, ty) => {
    for (const [cx, cy] of cells) {
      const bx = tx + cx;
      const by = ty + cy;
      if (bx < 0 || bx >= w) return true;
      if (by >= h) return true;
      if (by >= 0 && grid[by][bx] !== null) return true;
    }
    return false;
  };
}

export class BotPlayer {
  constructor(difficulty = "easy") {
    this.board = new Board(4, 26, 40);
    this.seed = 0;
    this.randomizer = new BagRandomizer(6, this.seed);

    this.state = "ALIVE";
    this.currentPiece = null;
    this.holdType = null;

    this.dropAcc = 0;
    this.thinkMsLeft = 0;
    this.placeAccMs = 0;

    this.combo = -1;
    this.b2b = 0;
    this.lastClearWasB2BType = false;

    this.incoming = [];
    this.incomingTotal = 0;
    this.outgoing = [];
    this.sendTimerMs = 0;
    this.holeX = 0;

    // 초반 오프너 상태 관리
    this.openingPieces = 0;
    this.openerBroken = false;
    this.openerLimit = 8;

    this.setDifficulty(difficulty);
    this.reset();
  }

  setDifficulty(difficulty) {
    this.difficulty = difficulty;

    const table = {
      // 난이도 기준(사용자 확정)
      // easy    : 낮은 PPS + 줄 삭제 최우선
      // mid     : easy보다 조금 빠름 + 줄 삭제 우선 + 약한 콤보 의식
      // hard    : hold 적극 사용 + 줄 삭제/콤보 균형
      // extreme : hard의 기본 판단 그대로 + PPS 3.0
      easy: {
        pps: 0.45, thinkMs: 120, mistake: 0.22, messiness: 0.28,
        lookahead: 0, beam: 3, holdUse: false,
        attackScale: 0.72, sendMs: 520, sendCap: 1,
        w: { maxH: 1.8, holes: 8.0, bump: 1.0, cleared: 9.5, allClear: 16, well: 0.15, attack: 0.9, flat: 0.15, danger: 0.35, ready: 0.4, nearReady: 0.15, wellBlock: 0.9 }
      },

      mid: {
        pps: 0.80, thinkMs: 95, mistake: 0.10, messiness: 0.18,
        lookahead: 1, beam: 4, holdUse: false,
        attackScale: 0.96, sendMs: 430, sendCap: 2,
        w: { maxH: 2.8, holes: 11.5, bump: 0.76, cleared: 11.0, allClear: 20, well: 0.55, attack: 1.8, flat: 0.45, danger: 0.75, ready: 1.4, nearReady: 0.55, wellBlock: 1.8 }
      },

      hard: {
        pps: 1.20, thinkMs: 70, mistake: 0.02, messiness: 0.08,
        lookahead: 1, beam: 5, holdUse: true,
        attackScale: 1.28, sendMs: 300, sendCap: 2,
        w: { maxH: 4.6, holes: 18.0, bump: 0.42, cleared: 14.5, allClear: 24, well: 1.35, attack: 3.4, flat: 1.0, danger: 1.25, ready: 3.2, nearReady: 1.0, wellBlock: 3.2 }
      },

      // 상과 같은 기본 판단 + 속도만 3 PPS
      extreme: {
        pps: 3.00, thinkMs: 18, mistake: 0.00, messiness: 0.08,
        lookahead: 1, beam: 5, holdUse: true,
        attackScale: 1.28, sendMs: 220, sendCap: 2,
        w: { maxH: 4.6, holes: 18.0, bump: 0.42, cleared: 14.5, allClear: 24, well: 1.35, attack: 3.4, flat: 1.0, danger: 1.25, ready: 3.2, nearReady: 1.0, wellBlock: 3.2 }
      },
    };

    this.cfg = table[difficulty] || table.easy;
  }

  setSeed(seed) {
    this.seed = (seed >>> 0);
    if (this.randomizer && this.randomizer.setSeed) this.randomizer.setSeed(this.seed);
    else this.randomizer = new BagRandomizer(6, this.seed);
  }

  reset() {
    this.state = "ALIVE";
    this.board.reset();
    this.randomizer.reset(6);

    this.currentPiece = null;
    this.holdType = null;
    this.dropAcc = 0;
    this.thinkMsLeft = 0;

    this.combo = -1;
    this.b2b = 0;
    this.lastClearWasB2BType = false;

    this.incoming = [];
    this.incomingTotal = 0;
    this.outgoing = [];
    this.sendTimerMs = 0;

    this.openingPieces = 0;
    this.openerBroken = false;
    this.holeX = Math.floor(Math.random() * 4);

    this.spawnNext();
  }

  _nextHole() {
    if (Math.random() < this.cfg.messiness) {
      let nx = Math.floor(Math.random() * 4);
      if (nx === this.holeX) nx = (nx + 1) % 4;
      this.holeX = nx;
    }
    return this.holeX;
  }

  receiveGarbage(holes) {
    if (!holes || holes.length === 0) return;

    const nextIncoming = this.incomingTotal + holes.length;
    const st = evalGrid(this.board.grid);

    // 시작 직후 가비지를 받더라도 무조건 오프너를 버리면 well까지 메워버리는 문제가 생김.
    // 그래서 아래 조건일 때만 복구 모드로 전환:
    // - 정말 초반(6피스 이내)
    // - 인커밍이 2줄 이상이거나
    // - 이미 필드가 지저분함(holes / 높은 스택)
    if (this.openingPieces < 6 && (nextIncoming >= 2 || st.holes > 0 || st.maxH >= 10)) {
      this.openerBroken = true;
    }

    this.incoming.push({ holes: holes.slice() });
    this.incomingTotal += holes.length;
  }

  _cancelIncoming(n) {
    let remaining = n;
    while (remaining > 0 && this.incoming.length > 0) {
      const seg = this.incoming[0];
      const take = Math.min(remaining, seg.holes.length);
      seg.holes.splice(0, take);
      remaining -= take;
      this.incomingTotal -= take;
      if (seg.holes.length === 0) this.incoming.shift();
    }
  }

  _applyIncomingStep() {
    if (this.incoming.length === 0) return false;
    const seg = this.incoming.shift();
    this.incomingTotal -= seg.holes.length;
    return this.board.addGarbageHoles(seg.holes);
  }

  _applyIncomingAll() {
    let overflow = false;
    while (this.incoming.length > 0) {
      const seg = this.incoming.shift();
      this.incomingTotal -= seg.holes.length;
      overflow = this.board.addGarbageHoles(seg.holes) || overflow;
    }
    this.incomingTotal = 0;
    return overflow;
  }

  _spawnPiece(type, rot, x) {
    const piece = { type, rot, x, y: -4, lastAction: null };
    if (this.board.collides(piece)) return null;
    return piece;
  }


  _shouldRecoveryMode(after = null) {
    const st = after || evalGrid(this.board.grid);
    const danger = Math.max(0, this.incomingTotal || 0);

    // 복구 모드는 '정말 정리가 필요할 때만' 켠다.
    if (danger >= 2) return true;
    if (st.holes > 0) return true;
    if (st.maxH >= 14) return true;
    if (this.openerBroken && this.openingPieces < this.openerLimit + 4) return true;
    return false;
  }

  _canReturnToCombo(after = null) {
    const st = after || evalGrid(this.board.grid);
    return this.incomingTotal === 0 && st.holes === 0 && st.maxH <= 9 && st.wellBlocks <= 1;
  }

  _scoreGrid(grid, cleared, combo, b2bActive, allClear) {
    const after = evalGrid(grid);
    const wv = this.cfg.w;

    const wellX = 0;
    const avgH = (after.heights[0] + after.heights[1] + after.heights[2] + after.heights[3]) / 4;
    const wellDepth = Math.max(0, avgH - after.heights[wellX]);

    const attack = computeAttackLines({
      cleared,
      tspin: false,
      b2bActive,
      combo,
      allClear,
      attackScale: this.cfg.attackScale
    });

    const danger = Math.min(12, Math.max(0, this.incomingTotal || 0));
    const clearValue = cleared * (wv.cleared + danger * (wv.danger ?? 0));
    const attackValue = attack * (wv.attack + danger * 0.35);

    const openingMode = !this.openerBroken && this.openingPieces < this.openerLimit && danger === 0;
    const recoveryMode = this._shouldRecoveryMode(after);

    let score =
      after.maxH * wv.maxH +
      after.holes * wv.holes +
      after.bump * wv.bump +
      after.stackVariance * (wv.flat ?? 0.5) +
      after.wellBlocks * (wv.wellBlock ?? 1.0) -
      clearValue -
      wellDepth * wv.well -
      attackValue -
      after.readyRows * (wv.ready ?? 1.0) -
      after.nearReadyRows * (wv.nearReady ?? 0.3);

    if (openingMode) {
      // 깨끗한 시작에선 4W 형태를 만드는 쪽으로 약간 더 기울임
      score -= after.readyRows * (wv.ready ?? 1.0) * 0.8;
      score -= after.nearReadyRows * (wv.nearReady ?? 0.3) * 0.5;
      score -= wellDepth * (wv.well ?? 1.0) * 0.4;
    }

    if (recoveryMode) {
      // 복구 모드에서도 well은 최대한 비워 둔다.
      // 이전처럼 정리만 우선하면 well까지 메워서 오히려 죽는 문제가 있었음.
      score += after.maxH * wv.maxH * 0.55;
      score += after.holes * wv.holes * 0.90;
      score += after.bump * wv.bump * 0.45;
      score += after.stackVariance * (wv.flat ?? 0.5) * 0.35;

      // well을 메우는 배치는 강하게 벌점
      score += after.wellBlocks * (wv.wellBlock ?? 1.0) * 1.15;

      // 정리/생존은 우선하되, ready row와 shallow well은 약하게라도 유지
      score -= clearValue * 1.30;
      score -= attackValue * 0.15;
      score -= cleared * 10;
      score -= after.readyRows * (wv.ready ?? 1.0) * 0.25;
      score -= after.nearReadyRows * (wv.nearReady ?? 0.3) * 0.15;
      score -= wellDepth * (wv.well ?? 1.0) * 0.20;

      if (cleared === 0) score += 22 + danger * 3.5;
      if (after.heights[wellX] > Math.min(after.heights[1], after.heights[2], after.heights[3])) {
        score += 70;
      }
    } else {
      // 정상 4W 운용 중에는 우물/ready row 보상 유지
      if (after.heights[wellX] > Math.min(after.heights[1], after.heights[2], after.heights[3])) {
        score += 80;
      }
      const avgStack = (after.heights[1] + after.heights[2] + after.heights[3]) / 3;
      if (avgStack < 5 && cleared === 0) score += 18;
    }

    if (after.maxH >= 18) score += 25;
    if (after.maxH >= 22) score += 140;
    if (after.maxH >= 25) score += 420;
    if (danger >= 4 && cleared === 0) score += 18 + danger * 5;

    if (allClear) score -= wv.allClear;
    return score;
  }

  _bestScoreOnGrid(gridIn, combo, b2bActive, nextTypes, depth) {
    if (!nextTypes || nextTypes.length === 0 || depth <= 0) {
      const st = evalGrid(gridIn);
      const wellX = 0;
      const avgH = (st.heights[0] + st.heights[1] + st.heights[2] + st.heights[3]) / 4;
      const wellDepth = Math.max(0, avgH - st.heights[wellX]);
      const wv = this.cfg.w;
      return st.maxH * wv.maxH + st.holes * wv.holes + st.bump * wv.bump - wellDepth * wv.well;
    }

    const type = nextTypes[0];
    const rest = nextTypes.slice(1);
    const w = this.board.w;
    const h = this.board.h;
    const candidates = [];

    for (let rot = 0; rot < 4; rot++) {
      const cells = PIECE_CELLS[type][rot];
      const minCx = Math.min(...cells.map((c) => c[0]));
      const maxCx = Math.max(...cells.map((c) => c[0]));
      const minX = -minCx;
      const maxX = (w - 1) - maxCx;

      for (let x = minX; x <= maxX; x++) {
        let y = -4;
        const collides = makeCollisionChecker(gridIn, w, h, cells);
        if (collides(x, y)) continue;
        while (!collides(x, y + 1)) y++;

        const grid = cloneGrid(gridIn);
        for (const [cx, cy] of cells) {
          const bx = x + cx;
          const by = y + cy;
          if (by >= 0 && by < h && bx >= 0 && bx < w) grid[by][bx] = type;
        }

        const cleared = clearLinesInGrid(grid);
        const allClear = cleared > 0 && grid.every((row) => row.every((c) => c === null));
        const nextCombo = cleared > 0 ? combo + 1 : -1;
        const nextB2BType = (cleared === 4);
        const nextB2BActive = nextB2BType ? b2bActive : false;

        let score = this._scoreGrid(grid, cleared, nextCombo, nextB2BActive, allClear);
        candidates.push({ score, grid, nextCombo, nextB2BActive });
      }
    }

    if (candidates.length === 0) return Infinity;

    candidates.sort((a, b) => a.score - b.score);
    const beam = Math.max(1, this.cfg.beam ?? 4);
    let best = Infinity;

    for (const cand of candidates.slice(0, beam)) {
      let score = cand.score;
      if (rest.length > 0 && depth > 1) {
        score = score * 0.72 + this._bestScoreOnGrid(cand.grid, cand.nextCombo, cand.nextB2BActive, rest, depth - 1) * 0.28;
      }
      if (score < best) best = score;
    }

    return best;
  }

  _findBestPlacement(type) {
    const w = this.board.w;
    const h = this.board.h;
    const candidates = [];

    for (let rot = 0; rot < 4; rot++) {
      const cells = PIECE_CELLS[type][rot];
      const minCx = Math.min(...cells.map((c) => c[0]));
      const maxCx = Math.max(...cells.map((c) => c[0]));
      const minX = -minCx;
      const maxX = (w - 1) - maxCx;

      for (let x = minX; x <= maxX; x++) {
        const testPiece = { type, rot, x, y: -4 };
        if (this.board.collides(testPiece)) continue;

        let y = -4;
        while (!this.board.collides({ ...testPiece, y: y + 1 })) y++;
        testPiece.y = y;

        const grid = cloneGrid(this.board.grid);
        for (const [cx, cy] of PIECE_CELLS[type][rot]) {
          const bx = x + cx;
          const by = y + cy;
          if (by >= 0 && by < h && bx >= 0 && bx < w) grid[by][bx] = type;
        }

        const cleared = clearLinesInGrid(grid);
        const allClear = cleared > 0 && grid.every((row) => row.every((c) => c === null));
        const nextCombo = cleared > 0 ? this.combo + 1 : -1;
        const b2bType = (cleared === 4);
        const nextB2BActive = b2bType ? this.lastClearWasB2BType : false;

        let score = this._scoreGrid(grid, cleared, nextCombo, nextB2BActive, allClear);

        // lookahead: 난이도가 높을수록 다음/다다음 미노까지 본다
        const depth = this.cfg.lookahead ?? 0;
        if (depth > 0) {
          const nextTypes = this.randomizer.peek(depth);
          if (nextTypes.length > 0) {
            score = score * 0.68 + this._bestScoreOnGrid(grid, nextCombo, nextB2BActive, nextTypes, depth) * 0.32;
          }
        }

        candidates.push({ score, rot, x });
      }
    }

    if (candidates.length === 0) return { rot: 0, x: 0 };

    candidates.sort((a, b) => a.score - b.score);

    if (Math.random() < this.cfg.mistake) {
      const idx = clamp(1 + Math.floor(Math.random() * 3), 1, candidates.length - 1);
      return candidates[idx];
    }
    return candidates[0];
  }

  spawnNext() {
    if (this.state !== "ALIVE") return;

    const currentType = this.randomizer.next();

    // 기본 후보: 지금 받은 미노 사용
    let chosenType = currentType;
    let pick = this._findBestPlacement(currentType);

    if (this.cfg.holdUse) {
      if (this.holdType) {
        const holdPick = this._findBestPlacement(this.holdType);
        const holdThreshold = this._shouldRecoveryMode()
          ? (this.difficulty === "extreme" ? 0.30 : 0.45)
          : (this.difficulty === "extreme" ? 0.02 : (this.difficulty === "hard" ? 0.12 : 0.35));
        if (holdPick.score + holdThreshold < pick.score) {
          const tmp = this.holdType;
          this.holdType = currentType;
          chosenType = tmp;
          pick = holdPick;
        }
      } else {
        const nextType = this.randomizer.peek(1)[0];
        if (nextType) {
          const nextPick = this._findBestPlacement(nextType);
          const emptyHoldThreshold = this._shouldRecoveryMode()
            ? (this.difficulty === "extreme" ? 0.45 : 0.70)
            : (this.difficulty === "extreme" ? 0.08 : (this.difficulty === "hard" ? 0.20 : 0.75));
          if (nextPick.score + emptyHoldThreshold < pick.score) {
            this.holdType = currentType;
            chosenType = this.randomizer.next(); // 실제 다음 미노 소비
            pick = nextPick;
          }
        }
      }
    }

    const piece = this._spawnPiece(chosenType, pick.rot, pick.x);
    if (!piece) {
      this.state = "DEAD";
      this.currentPiece = null;
      return;
    }

    this.currentPiece = piece;
    this.dropAcc = 0;
    this.placeAccMs = 0;
    this.thinkMsLeft = this.cfg.thinkMs;
  }

  _tryMove(dy) {
    const cand = { ...this.currentPiece, y: this.currentPiece.y + dy };
    if (this.board.collides(cand)) return false;
    this.currentPiece = cand;
    return true;
  }

  _lockNow(nowMs) {
    const piece = this.currentPiece;
    if (!piece) return [];

    this.board.lock(piece);
    const cleared = this.board.clearLines();
    const allClear = cleared > 0 && this.board.grid.every((row) => row.every((c) => c === null));

    // 보이는 맨 위 줄에 닿으면 즉시 DEAD
    const topVisibleY = this.board.hiddenH;
    const touchCeiling = this.board.grid[topVisibleY].some((c) => c !== null);
    if (touchCeiling) {
      this.state = "DEAD";
      this.currentPiece = null;
      this.outgoing = [];
      this.incoming = [];
      this.incomingTotal = 0;
      return [];
    }

    this.openingPieces += 1;

    if (cleared > 0) this.combo += 1;
    else this.combo = -1;

    const b2bType = (cleared === 4);
    let b2bActive = false;
    if (cleared > 0) {
      if (b2bType) {
        b2bActive = this.lastClearWasB2BType;
        this.lastClearWasB2BType = true;
      } else {
        this.lastClearWasB2BType = false;
      }
    }

    let out = computeAttackLines({
      cleared,
      tspin: false,
      b2bActive,
      combo: this.combo,
      allClear,
      attackScale: (this.cfg.attackScale ?? 1)
    });

    // 규칙:
    // - 빨간 인커밍이 남아 있는 동안에는 공격을 보내지 않음
    // - 이번 클리어는 인커밍 상쇄 전용
    const hadIncomingBeforeAttack = this.incomingTotal > 0;
    if (cleared > 0 && hadIncomingBeforeAttack && out > 0) {
      this._cancelIncoming(Math.min(this.incomingTotal, out));
      out = 0;
    }

    // 라인 클리어가 없을 때 인커밍 적용
    // 플레이어처럼 패킷 단위로만 올라오게 해서 한 번에 전부 맞고 바보같이 죽지 않게 함
    if (cleared === 0 && this.incomingTotal > 0) {
      const overflow = this._applyIncomingStep();
      if (overflow) {
        this.state = "DEAD";
        this.currentPiece = null;
        return [];
      }
    }

    for (let i = 0; i < out; i++) this.outgoing.push(this._nextHole());

    // 인커밍을 정리했고 필드가 다시 깨끗해지면 4W 콤보 모드로 복귀
    if (this.openerBroken && this._canReturnToCombo()) {
      this.openerBroken = false;
    }

    this.spawnNext();
    return [];
  }

  update(dtMs, nowMs) {
    if (this.state !== "ALIVE") return [];
    if (!this.currentPiece) return [];

    if (this.thinkMsLeft > 0) {
      this.thinkMsLeft -= dtMs;
    } else {
      // ✅ PPS 기반 배치 속도
      // pps = 초당 몇 개의 미노를 설치하는지
      // thinkMs를 뺀 나머지 시간 안에 1개를 두도록 맞춘다.
      const pps = Math.max(0.1, this.cfg.pps ?? 1.0);
      const pieceIntervalMs = 1000 / pps;
      const placeWindowMs = Math.max(16, pieceIntervalMs - this.cfg.thinkMs);

      this.placeAccMs += dtMs;

      if (this.placeAccMs >= placeWindowMs) {
        // 이미 x/rot은 결정된 상태이므로 최종 위치로 즉시 설치
        while (!this.board.collides({ ...this.currentPiece, y: this.currentPiece.y + 1 })) {
          this.currentPiece.y += 1;
        }
        this.placeAccMs = 0;
        this._lockNow(nowMs);
      }
    }

    this.sendTimerMs += dtMs;
    if (this.sendTimerMs < this.cfg.sendMs) return [];
    this.sendTimerMs -= this.cfg.sendMs;

    const send = Math.min((this.cfg.sendCap ?? 2), this.outgoing.length);
    if (send <= 0) return [];
    return this.outgoing.splice(0, send);
  }
}
