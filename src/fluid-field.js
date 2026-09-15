/* Coarse CPU stable-fluids solver, ported from haoqi-revamp's fluid.js.
   The original is a GPU post-process that displaces rendered pixels; DOM
   stickers cannot be post-processed, so we keep the solver's velocity field
   (splat -> advect -> dissipate) and use it to push the sticker elements. */

export function createFluidField({ resolution = 64, dissipation = 2.4, splatForce = 5 } = {}) {
  let cols = 1
  let rows = 1
  let vx = new Float32Array(1)
  let vy = new Float32Array(1)
  let tx = new Float32Array(1)
  let ty = new Float32Array(1)

  const idx = (x, y) => y * cols + x

  function setSize(w, h) {
    const a = w / Math.max(1, h)
    if (a >= 1) {
      cols = resolution
      rows = Math.max(2, Math.round(resolution / a))
    } else {
      rows = resolution
      cols = Math.max(2, Math.round(resolution * a))
    }
    const n = cols * rows
    vx = new Float32Array(n)
    vy = new Float32Array(n)
    tx = new Float32Array(n)
    ty = new Float32Array(n)
  }

  function read(f, x, y) {
    return f[idx(Math.min(Math.max(x, 0), cols - 1), Math.min(Math.max(y, 0), rows - 1))]
  }

  function bilinear(f, x, y) {
    const cx = Math.min(Math.max(x, 0), cols - 1.001)
    const cy = Math.min(Math.max(y, 0), rows - 1.001)
    const x0 = Math.floor(cx)
    const y0 = Math.floor(cy)
    const x1 = Math.min(x0 + 1, cols - 1)
    const y1 = Math.min(y0 + 1, rows - 1)
    const fx = cx - x0
    const fy = cy - y0
    const a = read(f, x0, y0)
    const b = read(f, x1, y0)
    const c = read(f, x0, y1)
    const d = read(f, x1, y1)
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy
  }

  /* pointer impulse, coordinates + delta in normalized [0,1] space */
  function splat(nx, ny, dx, dy) {
    const cx = nx * cols
    const cy = ny * rows
    const radius = Math.max(cols, rows) * 0.1
    const r2 = radius * radius
    const x0 = Math.max(0, Math.floor(cx - radius))
    const x1 = Math.min(cols - 1, Math.ceil(cx + radius))
    const y0 = Math.max(0, Math.floor(cy - radius))
    const y1 = Math.min(rows - 1, Math.ceil(cy + radius))
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const ddx = x - cx
        const ddy = y - cy
        const w = Math.exp(-(ddx * ddx + ddy * ddy) / r2)
        if (w < 0.002) continue
        const i = idx(x, y)
        vx[i] += dx * w * splatForce
        vy[i] += dy * w * splatForce
      }
    }
  }

  function step(dt) {
    const damp = 1 / (1 + dissipation * dt)
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = idx(x, y)
        const px = x - vx[i] * dt * cols
        const py = y - vy[i] * dt * rows
        tx[i] = bilinear(vx, px, py) * damp
        ty[i] = bilinear(vy, px, py) * damp
      }
    }
    let swap = vx
    vx = tx
    tx = swap
    swap = vy
    vy = ty
    ty = swap
  }

  /* sample velocity at normalized position; returns normalized units / s */
  function sample(nx, ny) {
    const x = nx * (cols - 1)
    const y = ny * (rows - 1)
    return { vx: bilinear(vx, x, y), vy: bilinear(vy, x, y) }
  }

  return { setSize, splat, step, sample }
}
