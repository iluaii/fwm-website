// 1:1 C-to-TS Port of src/wobble.c (9x9 Spring Lattice Mesh)
export const WOBBLE_GRID = 9;
export const WOBBLE_POINTS = WOBBLE_GRID * WOBBLE_GRID;
export const WOBBLE_K_HOME = 200.0;
export const WOBBLE_C = 16.0;
export const WOBBLE_BEND = 0.3;
export const WOBBLE_K_EDGE = WOBBLE_K_HOME * (WOBBLE_BEND * (WOBBLE_GRID - 1)) * (WOBBLE_BEND * (WOBBLE_GRID - 1)); // 1152.0
export const WOBBLE_C_EDGE = 0.6 * Math.sqrt(WOBBLE_K_EDGE); // ~20.36
export const WOBBLE_GRIP = 8.0;
export const WOBBLE_GRIP_SPAN = 0.25;
export const WOBBLE_STEP_S = 1.0 / 480.0;
export const WOBBLE_MAX_STEPS = 128;

export class FwmWobble {
  w = 280;
  h = 180;
  px = new Float64Array(WOBBLE_POINTS);
  py = new Float64Array(WOBBLE_POINTS);
  vx = new Float64Array(WOBBLE_POINTS);
  vy = new Float64Array(WOBBLE_POINTS);
  grip = new Float64Array(WOBBLE_POINTS);
  anchor = -1;
  limit = 38.0;
  accumulator = 0;

  idx(i: number, j: number) { return j * WOBBLE_GRID + i; }
  homeX(i: number) { return (this.w * i) / (WOBBLE_GRID - 1); }
  homeY(j: number) { return (this.h * j) / (WOBBLE_GRID - 1); }

  reset(w: number, h: number) {
    this.w = Math.max(1, w);
    this.h = Math.max(1, h);
    this.anchor = -1;
    this.accumulator = 0;
    for (let j = 0; j < WOBBLE_GRID; j++) {
      for (let i = 0; i < WOBBLE_GRID; i++) {
        const k = this.idx(i, j);
        this.px[k] = this.homeX(i);
        this.py[k] = this.homeY(j);
        this.vx[k] = 0;
        this.vy[k] = 0;
        this.grip[k] = 1.0;
      }
    }
  }

  grab(lx: number, ly: number) {
    const i = Math.min(WOBBLE_GRID - 1, Math.max(0, Math.round((lx * (WOBBLE_GRID - 1)) / this.w)));
    const j = Math.min(WOBBLE_GRID - 1, Math.max(0, Math.round((ly * (WOBBLE_GRID - 1)) / this.h)));
    this.anchor = this.idx(i, j);

    const gx = this.homeX(i);
    const gy = this.homeY(j);
    const span = WOBBLE_GRIP_SPAN * Math.max(this.w, this.h);
    const denom = 2.0 * span * span;

    for (let cj = 0; cj < WOBBLE_GRID; cj++) {
      for (let ci = 0; ci < WOBBLE_GRID; ci++) {
        const dx = this.homeX(ci) - gx;
        const dy = this.homeY(cj) - gy;
        this.grip[this.idx(ci, cj)] = 1.0 + WOBBLE_GRIP * Math.exp(-(dx * dx + dy * dy) / denom);
      }
    }
  }

  release() {
    this.anchor = -1;
    for (let k = 0; k < WOBBLE_POINTS; k++) this.grip[k] = 1.0;
  }

  translate(dx: number, dy: number) {
    if (dx === 0 && dy === 0) return;
    for (let k = 0; k < WOBBLE_POINTS; k++) {
      this.px[k] -= dx;
      this.py[k] -= dy;
    }
    this.clamp();
  }

  clamp() {
    if (this.limit <= 0) return;
    for (let k = 0; k < WOBBLE_POINTS; k++) {
      const i = k % WOBBLE_GRID;
      const j = Math.floor(k / WOBBLE_GRID);
      const hx = this.homeX(i);
      const hy = this.homeY(j);
      const dx = this.px[k] - hx;
      const dy = this.py[k] - hy;
      const d = Math.hypot(dx, dy);

      if (d > this.limit && d > 0) {
        const s = this.limit / d;
        this.px[k] = hx + dx * s;
        this.py[k] = hy + dy * s;

        const nx = dx / d;
        const ny = dy / d;
        const vn = this.vx[k] * nx + this.vy[k] * ny;
        if (vn > 0) {
          this.vx[k] -= vn * nx;
          this.vy[k] -= vn * ny;
        }
      }
    }
  }

  step(dt: number) {
    if (dt <= 0) return;

    // Clamp frame delta to 0.25s stall limit (src/server_tick.c)
    const frameDt = Math.min(0.25, dt);
    this.accumulator += frameDt;

    let stepsDone = 0;

    // Consume time in exact 2.083ms slices (1/480s)
    while (this.accumulator >= WOBBLE_STEP_S && stepsDone < WOBBLE_MAX_STEPS) {
      this.substep(WOBBLE_STEP_S);
      this.accumulator -= WOBBLE_STEP_S;
      stepsDone++;
    }

    // Drop remaining accumulator if stalled beyond max steps
    if (this.accumulator > WOBBLE_STEP_S * 2) {
      this.accumulator = 0;
    }
  }

  private substep(sdt: number) {
    const fx = new Float64Array(WOBBLE_POINTS);
    const fy = new Float64Array(WOBBLE_POINTS);

    for (let j = 0; j < WOBBLE_GRID; j++) {
      for (let i = 0; i < WOBBLE_GRID; i++) {
        const k = this.idx(i, j);
        const hx = this.homeX(i);
        const hy = this.homeY(j);
        const kh = WOBBLE_K_HOME * this.grip[k];

        let ax = kh * (hx - this.px[k]) - WOBBLE_C * this.vx[k];
        let ay = kh * (hy - this.py[k]) - WOBBLE_C * this.vy[k];

        const di = [-1, 1, 0, 0];
        const dj = [0, 0, -1, 1];
        for (let n = 0; n < 4; n++) {
          const ni = i + di[n];
          const nj = j + dj[n];
          if (ni < 0 || nj < 0 || ni >= WOBBLE_GRID || nj >= WOBBLE_GRID) continue;
          const nk = this.idx(ni, nj);
          const restDx = this.homeX(ni) - hx;
          const restDy = this.homeY(nj) - hy;

          ax += WOBBLE_K_EDGE * ((this.px[nk] - this.px[k]) - restDx) + WOBBLE_C_EDGE * (this.vx[nk] - this.vx[k]);
          ay += WOBBLE_K_EDGE * ((this.py[nk] - this.py[k]) - restDy) + WOBBLE_C_EDGE * (this.vy[nk] - this.vy[k]);
        }

        fx[k] = ax;
        fy[k] = ay;
      }
    }

    for (let k = 0; k < WOBBLE_POINTS; k++) {
      this.vx[k] += fx[k] * sdt;
      this.vy[k] += fy[k] * sdt;
      this.px[k] += this.vx[k] * sdt;
      this.py[k] += this.vy[k] * sdt;
    }

    if (this.anchor >= 0) {
      const ai = this.anchor % WOBBLE_GRID;
      const aj = Math.floor(this.anchor / WOBBLE_GRID);
      this.px[this.anchor] = this.homeX(ai);
      this.py[this.anchor] = this.homeY(aj);
      this.vx[this.anchor] = 0;
      this.vy[this.anchor] = 0;
    }

    this.clamp();
  }
}