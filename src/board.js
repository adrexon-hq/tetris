import { PIECE_CELLS } from "./constants.js?v=0.3.92";

export class Board {
  constructor(width, visibleHeight, internalHeight) {
    this.w = width;
    this.visibleH = visibleHeight;
    this.h = internalHeight;
    this.hiddenH = this.h - this.visibleH;
    this.grid = this.createEmptyGrid();
  }

  createEmptyGrid() {
    return Array.from({ length: this.h }, () => Array(this.w).fill(null));
  }

  reset() {
    this.grid = this.createEmptyGrid();
  }

  // y can be < 0 during spawn checks; those are treated as empty
  isOccupied(x, y) {
    if (x < 0 || x >= this.w || y >= this.h) return true;
    if (y < 0) return false;
    return this.grid[y][x] !== null;
  }

  getCells(piece) {
    return PIECE_CELLS[piece.type][piece.rot].map(([cx, cy]) => [piece.x + cx, piece.y + cy]);
  }

  collides(piece) {
    return this.getCells(piece).some(([x, y]) => this.isOccupied(x, y));
  }

  lock(piece) {
    for (const [x, y] of this.getCells(piece)) {
      if (y >= 0 && y < this.h && x >= 0 && x < this.w) {
        this.grid[y][x] = piece.type;
      }
    }
  }

  clearLines() {
    let cleared = 0;
    for (let y = this.h - 1; y >= 0; y--) {
      if (this.grid[y].every(Boolean)) {
        this.grid.splice(y, 1);
        this.grid.unshift(Array(this.w).fill(null));
        cleared++;
        y++; // check same y again after unshift
      }
    }
    return cleared;
  }

  isLockOut(piece) {
    // if any locked cell is above visible area top
    const topVisibleY = this.hiddenH;
    return this.getCells(piece).some(([, y]) => y < topVisibleY);
  }

  // ✅ Garbage(쓰레기) 라인 추가: holes 배열(각 라인의 구멍 x좌표)
  // 반환: overflow(기존 블록이 위로 밀려 나가면 true)
  addGarbageHoles(holes, cellType = "G") {
    let overflow = false;
    for (const holeX of holes) {
      const removed = this.grid.shift();
      if (removed && removed.some((c) => c !== null)) overflow = true;
      const row = Array(this.w).fill(cellType);
      const hx = Math.max(0, Math.min(this.w - 1, holeX));
      row[hx] = null;
      this.grid.push(row);
    }
    return overflow;
  }

  forEachVisibleCell(fn) {
    for (let y = this.hiddenH; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        fn(x, y - this.hiddenH, this.grid[y][x]);
      }
    }
  }
}
