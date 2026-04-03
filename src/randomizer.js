import { PIECE_TYPES } from "./constants.js?v=0.3.54";

export function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 7-bag randomizer (seeded)
export class BagRandomizer {
  constructor(previewCount = 6, seed = null) {
    this.previewCount = previewCount;
    this.seed = null;
    this.rng = Math.random;
    this.queue = [];
    this.setSeed(seed);
    this.reset(previewCount);
  }

  setSeed(seed) {
    if (seed === null || seed === undefined) {
      this.seed = null;
      this.rng = Math.random;
    } else {
      this.seed = (seed >>> 0);
      this.rng = mulberry32(this.seed);
    }
  
    this.reset(this.previewCount);
  }

  reset(previewCount = this.previewCount) {
    this.previewCount = previewCount;

    // reset always rewinds rng to the start of the current seed
    if (this.seed === null) this.rng = Math.random;
    else this.rng = mulberry32(this.seed);

    this.queue = [];
    this.fill();
  }

  fill() {
    while (this.queue.length < this.previewCount + 1) {
      this.queue.push(...shuffle(PIECE_TYPES, this.rng));
    }
  }

  next() {
    this.fill();
    return this.queue.shift();
  }

  peek(n = 6) {
    // peek은 RNG를 추가로 소비하지 않도록 fill()을 호출하지 않습니다.
    return this.queue.slice(0, n);
  }
}
