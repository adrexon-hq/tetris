export class InputManager {
  constructor(keybind) {
    this.keybind = keybind;

    // 현재 눌려있는 액션들
    this.down = new Set();

    // "이번에 눌린" 이벤트 큐 (프레임 경계에서 안 씹히게 하기 위함)
    // - keydown 순간에 push
    // - 게임 로직이 consumeJustPressed로 하나씩 drain
    this.pressQueue = [];

    // 좌/우 우선 방향 (동시 입력 처리)
    this.lastDir = null; // moveLeft | moveRight

    window.addEventListener("keydown", (e) => {
      const action = this.mapCodeToAction(e.code);
      if (!action) return;

      // 브라우저 기본 동작(스크롤 등) 방지
      e.preventDefault();

      // 최초 keydown만 큐에 넣는다 (자동반복(e.repeat)은 무시)
      if (!e.repeat && !this.down.has(action)) {
        this.pressQueue.push(action);
      }

      this.down.add(action);

      if (action === "moveLeft" || action === "moveRight") {
        this.lastDir = action;
      }
    });

    window.addEventListener("keyup", (e) => {
      const action = this.mapCodeToAction(e.code);
      if (!action) return;

      e.preventDefault();
      this.down.delete(action);

      // 마지막 방향이 떼어진 경우, 반대가 눌려있으면 반대로 전환
      if (action === this.lastDir) {
        if (action === "moveLeft" && this.down.has("moveRight")) this.lastDir = "moveRight";
        else if (action === "moveRight" && this.down.has("moveLeft")) this.lastDir = "moveLeft";
        else this.lastDir = null;
      }
    });
  }



  setActionDown(action, isDown) {
    if (!action) return;

    if (isDown) {
      if (!this.down.has(action)) {
        this.pressQueue.push(action);
      }
      this.down.add(action);

      if (action === "moveLeft" || action === "moveRight") {
        this.lastDir = action;
      }
      return;
    }

    this.down.delete(action);

    if (action === this.lastDir) {
      if (action === "moveLeft" && this.down.has("moveRight")) this.lastDir = "moveRight";
      else if (action === "moveRight" && this.down.has("moveLeft")) this.lastDir = "moveLeft";
      else this.lastDir = null;
    }
  }

  tapAction(action) {
    if (!action) return;
    this.pressQueue.push(action);
  }

  mapCodeToAction(code) {
    for (const [action, keyCode] of Object.entries(this.keybind)) {
      if (keyCode === code) return action;
    }
    return null;
  }

  // ✅ 프레임 경계에서 키가 씹히지 않도록 "큐"에서 소비한다
  consumeJustPressed(action) {
    const idx = this.pressQueue.indexOf(action);
    if (idx === -1) return false;
    this.pressQueue.splice(idx, 1);
    return true;
  }

  isDown(action) {
    return this.down.has(action);
  }

  // main loop에서 호출되지만, pressQueue를 비우면 다시 씹히기 때문에 no-op
  endFrame() {}

  // 게임 시작/타이틀 전환 등에서만 잔여 입력을 초기화
  resetTransient() {
    this.pressQueue.length = 0;
  }
}
