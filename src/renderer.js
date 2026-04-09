import { COLORS, PIECE_CELLS } from "./constants.js?v=0.3.92";

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    // transform 스케일 시 캔버스가 뿌옇게 보이는 것을 완화
    this.ctx.imageSmoothingEnabled = false;
  }

  clear() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = COLORS.HIDDEN;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  draw(game, now = performance.now()) {
    this.clear();
    const ctx = this.ctx;
    const { board } = game;
    const ui = (key, fallback) => (game?.uiText?.[key] ?? fallback);

    const margin = 20;
    const sideW = 120;
    const boardW = game.board.w;
    const boardH = game.board.visibleH;

    const cell = Math.floor(Math.min(
      (this.canvas.width - sideW * 2 - margin * 2) / boardW,
      (this.canvas.height - margin * 2) / boardH
    ));

    const boardPxW = boardW * cell;
    const boardPxH = boardH * cell;
    const boardX = Math.floor((this.canvas.width - boardPxW) / 2);
    const boardY = Math.floor((this.canvas.height - boardPxH) / 2);

    // board background
    ctx.fillStyle = "#0d1420";
    ctx.fillRect(boardX, boardY, boardPxW, boardPxH);

    // grid
    ctx.strokeStyle = COLORS.GRID;
    ctx.lineWidth = 1;
    for (let x = 0; x <= boardW; x++) {
      ctx.beginPath();
      ctx.moveTo(boardX + x * cell + 0.5, boardY);
      ctx.lineTo(boardX + x * cell + 0.5, boardY + boardPxH);
      ctx.stroke();
    }
    for (let y = 0; y <= boardH; y++) {
      ctx.beginPath();
      ctx.moveTo(boardX, boardY + y * cell + 0.5);
      ctx.lineTo(boardX + boardPxW, boardY + y * cell + 0.5);
      ctx.stroke();
    }

    // locked blocks
    board.forEachVisibleCell((x, y, t) => {
      if (!t) return;
      this.drawCell(boardX, boardY, cell, x, y, COLORS[t]);
    });

    // ghost
    if (game.state === "PLAYING" && game.settings.ghost && game.currentPiece) {
      const ghost = game.getGhostPiece();
      for (const [gx, gy] of game.board.getCells(ghost)) {
        const vy = gy - board.hiddenH;
        if (vy >= 0 && vy < board.visibleH) {
          this.drawCell(boardX, boardY, cell, gx, vy, COLORS.GHOST, true);
        }
      }
    }

    // active piece
    if (game.currentPiece) {
      for (const [px, py] of game.board.getCells(game.currentPiece)) {
        const vy = py - board.hiddenH;
        if (vy >= 0 && vy < board.visibleH) {
          this.drawCell(boardX, boardY, cell, px, vy, COLORS[game.currentPiece.type]);
        }
      }
    }

    // border
    ctx.strokeStyle = COLORS.BORDER;
    ctx.lineWidth = 2;
    ctx.strokeRect(boardX, boardY, boardPxW, boardPxH);


    // Incoming bar (TETR.IO 느낌의 빨간 공격 표시) - 플레이어 보드 왼쪽
    // 핵심: incoming 큐를 '패킷 단위'로 나눠서 그리고, 패킷 사이에 검은 간격을 둡니다.
    // 그래서 테트리오처럼 빨간 바 중간중간 검은 선/간격이 보여서
    // '딜이 나눠서 들어온다'는 걸 바로 알 수 있게 됩니다.
    const incomingTotal = Math.max(0, Number(game.incomingTotal ?? 0));
    if (incomingTotal > 0) {
      const barW = Math.max(18, Math.floor(cell * 0.95));
      const gap = 2;
      const barX = boardX - gap - barW;
      const barBottomY = boardY + boardPxH;

      ctx.save();

      // 배경/테두리
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.fillRect(barX, boardY, barW, boardPxH);
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.lineWidth = 2;
      ctx.strokeRect(barX, boardY, barW, boardPxH);

      // 패킷 세그먼트 그리기
      const packets = (game.incoming ?? []).map((seg) => Math.max(0, seg.holes.length)).filter((n) => n > 0);
      let usedLines = 0;

      for (let p = 0; p < packets.length && usedLines < boardH; p++) {
        const linesInPacket = packets[p];
        const segLines = Math.min(linesInPacket, boardH - usedLines);

        const segBottom = barBottomY - usedLines * cell;
        const segTop = segBottom - segLines * cell;

        // 빨간 패킷 본체
        ctx.fillStyle = "rgba(225, 40, 55, 0.95)";
        ctx.fillRect(barX + 2, segTop + 2, barW - 4, segLines * cell - 4);

        usedLines += segLines;

        // 다음 패킷이 남아 있으면 검은 간격 1칸 느낌으로 살짝 분리선
        if (p < packets.length - 1 && usedLines < boardH) {
          const sepY = barBottomY - usedLines * cell;
          ctx.fillStyle = "rgba(8, 12, 20, 0.95)";
          ctx.fillRect(barX + 2, sepY - 2, barW - 4, 4);
        }
      }

      // 총합 숫자
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.font = "800 12px Pretendard, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(String(incomingTotal), barX + barW / 2, boardY - 4);

      ctx.restore();
    }

    // side boxes
    this.drawMiniPanel(game, boardX - sideW - 12, boardY, sideW, cell, ui("hold", "HOLD"), game.holdType ? [game.holdType] : [], false, "hold");
    this.drawMiniPanel(game, boardX + boardPxW + 12, boardY, sideW, cell, ui("next", "NEXT"), game.randomizer.peek(game.settings.previewCount), false, "next");


    
    // ===== Popup (Combo / All Clear) =====
    if (game.popup) {
      const t = (now - game.popup.startedAt) / game.popup.durationMs;
      if (t >= 1) {
        game.popup = null;
      } else {
        const clamp01 = (x) => Math.max(0, Math.min(1, x));
        const easeOut = (x) => 1 - Math.pow(1 - x, 3);
        const p = easeOut(clamp01(t));

        const pop = 1.0 + 0.55 * Math.exp(-4 * p) * Math.sin(10 * p);
        const alpha = 1.0 - p;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // ✅ 보기 쉬운 위치: 중간 상단
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height * 0.32;

        ctx.translate(cx, cy);
        ctx.scale(pop, pop);


        if (game.popup.kind === "combo") {
          const text = String(game.popup.value);

          ctx.font = "900 66px Pretendard, sans-serif";
          ctx.lineWidth = 10;
          ctx.strokeStyle = "rgba(0,0,0,0.60)";
          ctx.strokeText(text, 0, 0);
          ctx.fillStyle = "#e6ecff";
          ctx.fillText(text, 0, 0);

          ctx.font = "800 18px Pretendard, sans-serif";
          ctx.lineWidth = 6;
          const comboLabel = ui("combo", "COMBO");
          ctx.strokeText(comboLabel, 0, 52);
          ctx.fillStyle = "rgba(160, 190, 255, 0.95)";
          ctx.fillText(comboLabel, 0, 52);
        }



        if (game.popup.kind === "attack" || game.popup.kind === "attackTotal") {
          const text = String(game.popup.value);

          const label = (game.popup.kind === "attackTotal") ? ui("total", "TOTAL") : ui("attack", "ATTACK");

          ctx.font = "900 66px Pretendard, sans-serif";
          ctx.lineWidth = 10;
          ctx.strokeStyle = "rgba(0,0,0,0.60)";
          ctx.strokeText(text, 0, 0);
          ctx.fillStyle = "#e6ecff";
          ctx.fillText(text, 0, 0);

          ctx.font = "800 18px Pretendard, sans-serif";
          ctx.lineWidth = 6;
          ctx.strokeText(label, 0, 52);
          ctx.fillStyle = "rgba(160, 190, 255, 0.95)";
          ctx.fillText(label, 0, 52);
        }

        if (game.popup.kind === "allclear") {
          const text = ui("allClearShort", game.popup.text || "올클리어");

          ctx.font = "900 54px Pretendard, sans-serif";
          ctx.lineWidth = 10;
          ctx.strokeStyle = "rgba(0,0,0,0.70)";
          ctx.strokeText(text, 0, 0);
          ctx.fillStyle = "#ffe38a";
          ctx.fillText(text, 0, 0);

          ctx.font = "800 18px Pretendard, sans-serif";
          ctx.lineWidth = 6;
          const allClearLabel = ui("allClear", "ALL CLEAR");
          ctx.strokeText(allClearLabel, 0, 54);
          ctx.fillStyle = "rgba(255, 230, 150, 0.95)";
          ctx.fillText(allClearLabel, 0, 54);
        }

        ctx.restore();
      }
    }


    if (game.state === "WIN") {
      ctx.save();
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#e6ecff";
      ctx.font = "900 64px Pretendard, sans-serif";
      ctx.fillText(ui("victory", "VICTORY"), this.canvas.width / 2, this.canvas.height / 2 - 10);

      ctx.font = "700 18px Pretendard, sans-serif";
      ctx.fillStyle = "rgba(160, 190, 255, 0.95)";
      ctx.fillText(ui("victoryHint", "R 키로 재시작"), this.canvas.width / 2, this.canvas.height / 2 + 52);
      ctx.restore();
    }

// status text inside canvas
    if (game.state === "TITLE") {
      const desktopQuickUi = document.body.classList.contains("desktop-quick-ui");
      this.drawCenterText(desktopQuickUi ? ui("clickBoardOrEnter", "보드를 클릭하거나 Enter로 시작") : ui("pressStartButton", "게임 시작 버튼을 누르세요"), 22);
    }

    if (game.state === "GAME_OVER") {
      this.drawCenterText(ui("gameOver", "GAME OVER"), 30);
      this.drawCenterText(ui("gameOverHint", "R: 재시작 / Esc: 타이틀"), 18, 38);
    }
  }


  drawBotBoard(bot, label = "BOT") {
    this.clear();
    const ctx = this.ctx;
    const board = bot.board;

    const margin = 10;
    const sideW = 64;
    const sideGap = 10;
    const boardW = board.w;
    const boardH = board.visibleH;

    const cell = Math.floor(Math.min(
      (this.canvas.width - margin * 2 - sideW * 2 - sideGap * 2) / boardW,
      (this.canvas.height - margin * 2) / boardH
    ));

    const boardPxW = boardW * cell;
    const boardPxH = boardH * cell;
    const totalW = sideW * 2 + sideGap * 2 + boardPxW;
    const boardX = Math.floor((this.canvas.width - totalW) / 2) + sideW + sideGap;
    const boardY = Math.floor((this.canvas.height - boardPxH) / 2);

    // side mini panels
    const fakeGame = { board };
    this.drawMiniPanel(fakeGame, boardX - sideGap - sideW, boardY, sideW, cell, "HOLD", bot.holdType ? [bot.holdType] : [], true, "hold");
    this.drawMiniPanel(fakeGame, boardX + boardPxW + sideGap, boardY, sideW, cell, "NEXT", bot.randomizer.peek(5), true, "next");

    // border / background
    ctx.fillStyle = "#0d1420";
    ctx.fillRect(boardX, boardY, boardPxW, boardPxH);
    ctx.strokeStyle = COLORS.BORDER;
    ctx.lineWidth = 2;
    ctx.strokeRect(boardX - 2, boardY - 2, boardPxW + 4, boardPxH + 4);

    // incoming bar to bot (what player is sending)
    const incoming = Math.max(0, Number(bot.incomingTotal ?? 0));
    if (incoming > 0) {
      const maxSeg = Math.min(boardH, incoming);
      const barW = Math.max(6, Math.floor(cell * 0.35));
      const barX = Math.max(2, boardX - barW - 6);
      ctx.fillStyle = "rgba(255, 70, 70, 0.92)";
      for (let i = 0; i < maxSeg; i++) {
        const yy = boardY + boardPxH - (i + 1) * cell;
        ctx.fillRect(barX, yy + 1, barW, cell - 2);
      }
      ctx.fillStyle = "rgba(255, 180, 180, 0.95)";
      ctx.font = "700 12px Pretendard, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(String(incoming), barX + barW / 2, boardY - 6);
    }

    // grid
    ctx.strokeStyle = COLORS.GRID;
    ctx.lineWidth = 1;
    for (let x = 0; x <= boardW; x++) {
      ctx.beginPath();
      ctx.moveTo(boardX + x * cell + 0.5, boardY);
      ctx.lineTo(boardX + x * cell + 0.5, boardY + boardPxH);
      ctx.stroke();
    }
    for (let y = 0; y <= boardH; y++) {
      ctx.beginPath();
      ctx.moveTo(boardX, boardY + y * cell + 0.5);
      ctx.lineTo(boardX + boardPxW, boardY + y * cell + 0.5);
      ctx.stroke();
    }

    // stacked cells
    board.forEachVisibleCell((x, y, t) => {
      if (!t) return;
      this.drawCell(boardX, boardY, cell, x, y, COLORS[t] || COLORS.G);
    });

    // active piece
    if (bot.currentPiece) {
      for (const [px, py] of board.getCells(bot.currentPiece)) {
        const vy = py - board.hiddenH;
        if (vy >= 0 && vy < board.visibleH) {
          this.drawCell(boardX, boardY, cell, px, vy, COLORS[bot.currentPiece.type] || COLORS.T);
        }
      }
    }

    // label
    ctx.fillStyle = "rgba(230,236,255,0.85)";
    ctx.font = "700 14px Pretendard, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(label, this.canvas.width / 2, 6);
  }

  drawCell(boardX, boardY, cell, x, y, fillStyle, isGhost = false) {
    const ctx = this.ctx;
    const px = boardX + x * cell;
    const py = boardY + y * cell;

    ctx.fillStyle = fillStyle;
    ctx.fillRect(px + 1, py + 1, cell - 2, cell - 2);

    if (!isGhost) {
      ctx.strokeStyle = "rgba(255,255,255,0.16)";
      ctx.strokeRect(px + 1.5, py + 1.5, cell - 3, cell - 3);
    }
  }

  drawMiniPanel(game, x, y, w, cell, title, types, compact = false, panelKind = "next") {
    const ctx = this.ctx;
    const panelH = game.board.visibleH * cell;

    ctx.save();

    ctx.fillStyle = "#121a29";
    ctx.fillRect(x, y, w, panelH);
    ctx.strokeStyle = COLORS.BORDER;
    ctx.strokeRect(x, y, w, panelH);

    // ✅ 이전 그리기의 textAlign 영향을 받지 않도록 매번 명시
    ctx.textAlign = compact ? "center" : "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#9bb3f2";
    ctx.font = compact ? "bold 12px Pretendard, sans-serif" : "bold 14px Pretendard, sans-serif";
    ctx.fillText(title, compact ? (x + w / 2) : (x + 8), y + 8);

    // 봇 패널에서는 패널 폭에 맞게 preview 크기를 더 안정적으로 제한
    const previewCellBase = compact ? Math.floor(cell * 0.42) : Math.floor(cell * 0.45);
    const previewCell = Math.max(8, Math.min(previewCellBase, Math.floor((w - 20) / 4)));
    let offsetY = y + (compact ? 26 : 30);

    const renderCount = panelKind === "hold" ? Math.min(1, types.length) : types.length;
    for (let i = 0; i < renderCount; i++) {
      const t = types[i];
      if (!t) continue;
      const cells = PIECE_CELLS[t][0];
      const maxX = Math.max(...cells.map(([cx]) => cx));
      const pieceW = (maxX + 1) * previewCell;

      const ox = compact ? Math.floor(x + (w - pieceW) / 2) : (x + 10);
      this.drawMiniPiece(t, ox, offsetY + i * previewCell * (compact ? 3.0 : 3.2), previewCell);
    }

    ctx.restore();
  }

  drawMiniPiece(type, ox, oy, cell) {
    const ctx = this.ctx;
    const cells = PIECE_CELLS[type][0];
    for (const [x, y] of cells) {
      ctx.fillStyle = COLORS[type];
      ctx.fillRect(ox + x * cell, oy + y * cell, cell - 1, cell - 1);
    }
  }

  drawCenterText(text, size = 20, offsetY = 0) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, this.canvas.height / 2 - 60 + offsetY, this.canvas.width, 50);
    ctx.fillStyle = "#f0f4ff";
    ctx.font = `bold ${size}px Pretendard, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2 - 28 + offsetY);
    ctx.restore();
  }
}
