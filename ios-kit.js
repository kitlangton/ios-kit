// ios-kit: iOS 26 (Liquid Glass) in the browser, for prototyping native app UI before building it.
// Plain ES module, light-DOM custom elements, no build step. See README.md for the API.

const NS = 'http://www.w3.org/2000/svg'
const params = new URLSearchParams(location.search)

export const config = {
  // Real refraction needs `backdrop-filter: url(#svg-filter)`, which only Chromium renders.
  refraction: params.get('glass') !== 'fallback' && /Chrome\/|Chromium\//.test(navigator.userAgent),
  aberration: params.get('aberration') !== '0',
}

// ───────────────────────── helpers ─────────────────────────
const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue
    if (k === 'class') el.className = v
    else if (k === 'html') el.innerHTML = v
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v)
    else el.setAttribute(k, v === true ? '' : v)
  }
  for (const kid of kids.flat()) if (kid != null) el.append(kid.nodeType ? kid : document.createTextNode(kid))
  return el
}
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const screenOf = (el) => el?.closest?.('.ios-screen') || el?.querySelector?.('.ios-screen') || document.querySelector('.ios-screen')
const emit = (el, name, detail) => el.dispatchEvent(new CustomEvent(name, { bubbles: true, cancelable: true, detail }))

// ───────────────────────── icons (SF Symbol approximations) ─────────────────────────
function gearPath() {
  const teeth = 8, ro = 10.2, ri = 7.9, cx = 12, cy = 12
  let d = ''
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2
    const w = Math.PI / teeth
    const pts = [[ri, a - w * 0.62], [ro, a - w * 0.36], [ro, a + w * 0.36], [ri, a + w * 0.62]]
    for (const [j, [r, t]] of pts.entries()) {
      const x = (cx + r * Math.cos(t)).toFixed(2), y = (cy + r * Math.sin(t)).toFixed(2)
      d += (i === 0 && j === 0 ? 'M' : 'L') + x + ' ' + y
    }
  }
  d += 'Z M12 8.6a3.4 3.4 0 1 0 0.001 0Z'
  return d
}
const S = (d, w = 1.7) => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`
const F = (d) => `<path d="${d}" fill="currentColor"/>`
export const ICONS = {
  plus: S('M12 4.2v15.6M4.2 12h15.6', 1.75),
  mic: S('M12 2.9a3 3 0 0 1 3 3v6.2a3 3 0 0 1-6 0V5.9a3 3 0 0 1 3-3ZM5.6 11.2a6.4 6.4 0 0 0 12.8 0M12 17.6v3.6M9.2 21.2h5.6', 1.55),
  'arrow.up': S('M12 19.5V4.8M5.6 11.2 12 4.8l6.4 6.4', 2.3),
  'arrow.down': S('M12 4.5v14.7M5.6 12.8l6.4 6.4 6.4-6.4', 2.1),
  ellipsis: '<circle cx="5.85" cy="12" r="1.72" fill="currentColor"/><circle cx="12" cy="12" r="1.72" fill="currentColor"/><circle cx="18.15" cy="12" r="1.72" fill="currentColor"/>',
  'square.and.pencil': S('M11 4.3H6.6a2.4 2.4 0 0 0-2.4 2.4v10.7a2.4 2.4 0 0 0 2.4 2.4h10.7a2.4 2.4 0 0 0 2.4-2.4V13', 1.75) + S('M18.3 3.5a1.6 1.6 0 0 1 2.3 2.3l-8.2 8.2-3.1.8.8-3.1 8.2-8.2Z', 1.6),
  'gearshape.fill': `<path d="${gearPath()}" fill="currentColor" fill-rule="evenodd"/>`,
  'doc.on.doc': S('M8.5 7.3V5.6A1.8 1.8 0 0 1 10.3 3.8h5.2l3.9 3.9v8.6a1.8 1.8 0 0 1-1.8 1.8h-1.4', 1.5) + S('M15.4 3.9v3.9h3.9', 1.4) + S('M5.7 7.4h5.6l3.6 3.6v8.4a1.8 1.8 0 0 1-1.8 1.8H5.7a1.8 1.8 0 0 1-1.8-1.8V9.2a1.8 1.8 0 0 1 1.8-1.8Z', 1.5) + S('M11.2 7.5v3.6h3.6', 1.4),
  'chevron.down': S('M5.5 9l6.5 6.5L18.5 9', 2.4),
  'chevron.up': S('M5.5 15l6.5-6.5 6.5 6.5', 2.4),
  'chevron.right': S('M9 5.5l6.5 6.5L9 18.5', 2.2),
  'chevron.left': S('M15 5.5 8.5 12l6.5 6.5', 2.3),
  'chevron.up.chevron.down': S('M7.5 9.2 12 4.7l4.5 4.5M7.5 14.8l4.5 4.5 4.5-4.5', 1.7),
  pin: S('M8.3 3.6h7.4M9.6 3.8v6.1l-2.9 3.4h10.6l-2.9-3.4V3.8M12 13.4v7.2', 1.6),
  'pin.slash': S('M8.3 3.6h7.4M9.6 3.8v6.1l-2.9 3.4h10.6l-2.9-3.4V3.8M12 13.4v7.2M4 4l16 16', 1.6),
  pencil: S('M5 19.2l1.2-4.6L16.3 4.5a1.8 1.8 0 0 1 2.6 0l.6.6a1.8 1.8 0 0 1 0 2.6L9.4 17.8 5 19.2Z', 1.6),
  'envelope.badge': S('M3.4 7.5a1.6 1.6 0 0 1 1.6-1.6h10M20.6 11v6.6a1.6 1.6 0 0 1-1.6 1.6H5a1.6 1.6 0 0 1-1.6-1.6V7.5', 1.6) + S('M3.8 6.7 12 13l3.4-2.6', 1.6) + '<circle cx="19.3" cy="5.4" r="2.6" fill="currentColor"/>',
  'envelope.open': S('M3.4 10.2 12 4.4l8.6 5.8v8.2a1.6 1.6 0 0 1-1.6 1.6H5a1.6 1.6 0 0 1-1.6-1.6v-8.2ZM3.8 10.6 12 15.6l8.2-5', 1.6),
  'rectangle.compress.vertical': S('M3.5 12h17M12 3.2v5.3M9.4 6l2.6 2.6L14.6 6M12 20.8v-5.3M9.4 18l2.6-2.6 2.6 2.6', 1.6),
  'arrow.triangle.branch': S('M12 20.5v-7.6L6.2 6.4M12 12.9l5.8-6.5M4.2 9V4.5h4.5M19.8 9V4.5h-4.5', 1.7),
  'square.and.arrow.up': S('M8.3 9.3H7a2 2 0 0 0-2 2v7.4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7.4a2 2 0 0 0-2-2h-1.3M12 14.6V3.4M8.4 6.8 12 3.2l3.6 3.6', 1.6),
  'info.circle': '<circle cx="12" cy="12" r="8.6" fill="none" stroke="currentColor" stroke-width="1.6"/>' + S('M10.4 10.9H12v5.6M10.2 16.6h3.8', 1.6) + '<circle cx="11.9" cy="7.9" r="1.15" fill="currentColor"/>',
  trash: S('M4.2 6.4h15.6M9.3 6.2V4.6c0-.6.5-1 1-1h3.4c.6 0 1 .4 1 1v1.6M6 6.6l.9 12.4a1.9 1.9 0 0 0 1.9 1.7h6.4a1.9 1.9 0 0 0 1.9-1.7L18 6.6M10 10.2v6.8M14 10.2v6.8', 1.6),
  folder: S('M3.3 7.2a2 2 0 0 1 2-2h3.9l2 2.1h7.5a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2H5.3a2 2 0 0 1-2-2V7.2ZM3.3 9.8h17.4', 1.35),
  cpu: S('M7 6.2h10a.8.8 0 0 1 .8.8v10a.8.8 0 0 1-.8.8H7a.8.8 0 0 1-.8-.8V7a.8.8 0 0 1 .8-.8ZM9.4 9.4h5.2v5.2H9.4ZM9.3 3.2v3M12 3.2v3M14.7 3.2v3M9.3 17.8v3M12 17.8v3M14.7 17.8v3M3.2 9.3h3M3.2 12h3M3.2 14.7h3M17.8 9.3h3M17.8 12h3M17.8 14.7h3', 1.3),
  'stop.fill': '<rect x="6.2" y="6.2" width="11.6" height="11.6" rx="2.2" fill="currentColor"/>',
  waveform: S('M3.5 10.5v3M7 7.5v9M10.5 4.5v15M14 8v8M17.5 6v12M21 10.5v3', 1.9),
  'waveform.badge.xmark': S('M3.5 10.5v3M7 7.5v9M10.5 4.5v15M14 8v8', 1.9) + S('M16.5 14.5l5 5M21.5 14.5l-5 5', 1.9),
  magnifyingglass: S('M10.5 4.2a6.3 6.3 0 1 1 0 12.6 6.3 6.3 0 0 1 0-12.6ZM15.2 15.2l5 5', 1.9),
  xmark: S('M6 6l12 12M18 6 6 18', 2.1),
  checkmark: S('M4.8 12.6l4.6 4.6 9.8-10.4', 2.2),
  'arrow.uturn.backward': S('M9 14.5 4.5 10 9 5.5M4.8 10h9.7a5 5 0 0 1 0 10H11', 1.9),
  'server.rack': S('M4 4.6h16a.9.9 0 0 1 .9.9v3.6a.9.9 0 0 1-.9.9H4a.9.9 0 0 1-.9-.9V5.5a.9.9 0 0 1 .9-.9ZM4 10h16a.9.9 0 0 1 .9.9v3.6a.9.9 0 0 1-.9.9H4a.9.9 0 0 1-.9-.9v-3.6A.9.9 0 0 1 4 10ZM4 15.4h16a.9.9 0 0 1 .9.9v3a.9.9 0 0 1-.9.9H4a.9.9 0 0 1-.9-.9v-3a.9.9 0 0 1 .9-.9Z', 1.3) + '<circle cx="17.6" cy="7.3" r=".9" fill="currentColor"/><circle cx="17.6" cy="12.7" r=".9" fill="currentColor"/><circle cx="17.6" cy="17.8" r=".9" fill="currentColor"/>',
  camera: S('M4.6 7.6h3l1.6-2.2h5.6l1.6 2.2h3a1.6 1.6 0 0 1 1.6 1.6v8.6a1.6 1.6 0 0 1-1.6 1.6H4.6A1.6 1.6 0 0 1 3 17.8V9.2a1.6 1.6 0 0 1 1.6-1.6Z', 1.6) + '<circle cx="12" cy="13" r="3.4" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  photo: S('M5 4.8h14a1.8 1.8 0 0 1 1.8 1.8v10.8a1.8 1.8 0 0 1-1.8 1.8H5a1.8 1.8 0 0 1-1.8-1.8V6.6A1.8 1.8 0 0 1 5 4.8ZM3.6 16.4l4.6-4.6 4 4 2.6-2.6 5.6 5.4', 1.6) + '<circle cx="15.6" cy="9" r="1.6" fill="currentColor"/>',
  doc: S('M6.8 3.4h6.6l4.8 4.8v10.6a1.8 1.8 0 0 1-1.8 1.8H6.8A1.8 1.8 0 0 1 5 18.8V5.2a1.8 1.8 0 0 1 1.8-1.8ZM13.3 3.5v4.8h4.8', 1.6),
  'doc.on.clipboard': S('M8.6 4.6H7a1.8 1.8 0 0 0-1.8 1.8v12.4A1.8 1.8 0 0 0 7 20.6h10a1.8 1.8 0 0 0 1.8-1.8V6.4A1.8 1.8 0 0 0 17 4.6h-1.6M9.6 3.2h4.8a.9.9 0 0 1 .9.9v1.4a.9.9 0 0 1-.9.9H9.6a.9.9 0 0 1-.9-.9V4.1a.9.9 0 0 1 .9-.9Z', 1.6),
  'phone.down.fill': F('M2.4 13.7c0-2.1 4.3-5 9.6-5s9.6 2.9 9.6 5l-.3 1.8c-.1.8-.9 1.3-1.6 1.1l-3.2-.7c-.7-.1-1.1-.7-1.1-1.4v-1.6c-1.1-.4-2.3-.6-3.4-.6s-2.3.2-3.4.6v1.6c0 .7-.5 1.3-1.1 1.4l-3.2.7c-.7.2-1.5-.3-1.6-1.1Z'),
  'mic.slash': S('M12 2.9a3 3 0 0 1 3 3v6.2a3 3 0 0 1-6 0V5.9a3 3 0 0 1 3-3ZM5.6 11.2a6.4 6.4 0 0 0 12.8 0M12 17.6v3.6M4 3.5l16 17', 1.55),
  'arrow.turn.down.right': S('M5 4.5v6.5a3 3 0 0 0 3 3h11M15 10l4 4-4 4', 1.8),
  'clock': '<circle cx="12" cy="12" r="8.6" fill="none" stroke="currentColor" stroke-width="1.6"/>' + S('M12 7v5.2l3.4 2', 1.6),
  'bubble.left': S('M12 4.2c4.7 0 8.4 3.1 8.4 7s-3.7 7-8.4 7c-1 0-2-.1-2.9-.4L5 19.6l1.1-3.5C4.5 14.8 3.6 13.1 3.6 11.2c0-3.9 3.7-7 8.4-7Z', 1.6),
  'delete.left': S('M9 5.5h10a1.6 1.6 0 0 1 1.6 1.6v9.8a1.6 1.6 0 0 1-1.6 1.6H9L3.4 12 9 5.5ZM11.6 9.4l5.2 5.2M16.8 9.4l-5.2 5.2', 1.6),
  'face.smiling': '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="9" cy="9.6" r="1.25" fill="currentColor"/><circle cx="15" cy="9.6" r="1.25" fill="currentColor"/><path d="M7.2 13h9.6a4.8 4.8 0 0 1-9.6 0Z" fill="currentColor"/>',
  'wifi.slash': S('M3 9a13 13 0 0 1 18 0M6 12.2a8.5 8.5 0 0 1 12 0M9 15.3a4.2 4.2 0 0 1 6 0M4 4l16 16', 1.7),
  wifi: '<circle cx="12" cy="18.6" r="1.5" fill="currentColor"/>' + S('M9 15.3a4.2 4.2 0 0 1 6 0M6 12.2a8.5 8.5 0 0 1 12 0M3 9a13 13 0 0 1 18 0', 1.9),
  'square.on.square': S('M9.2 8.8h8.4a1.9 1.9 0 0 1 1.9 1.9v8.4a1.9 1.9 0 0 1-1.9 1.9H9.2a1.9 1.9 0 0 1-1.9-1.9v-8.4a1.9 1.9 0 0 1 1.9-1.9Z', 1.5) + S('M16.4 6.2v-.4a1.9 1.9 0 0 0-1.9-1.9H6.1a1.9 1.9 0 0 0-1.9 1.9v8.4a1.9 1.9 0 0 0 1.9 1.9h.4', 1.5),
  'folder.fill': F('M3.2 7.3a2.1 2.1 0 0 1 2.1-2.1h4l2 2h7.5a2.1 2.1 0 0 1 2.1 2.1v.4H3.2Z') + F('M3.2 10.7h17.6v7.5a2.1 2.1 0 0 1-2.1 2.1H5.3a2.1 2.1 0 0 1-2.1-2.1Z'),
  'exclamationmark.circle.fill': '<circle cx="12" cy="12" r="9.2" fill="currentColor"/><path d="M12 6.9v6.2" stroke="var(--bg)" stroke-width="2.3" stroke-linecap="round"/><circle cx="12" cy="16.6" r="1.35" fill="var(--bg)"/>',
  'rectangle.stack': S('M5.2 9h13.6a1.8 1.8 0 0 1 1.8 1.8v7.6a1.8 1.8 0 0 1-1.8 1.8H5.2a1.8 1.8 0 0 1-1.8-1.8v-7.6A1.8 1.8 0 0 1 5.2 9ZM6 6.1h12M7.8 3.4h8.4', 1.6),
  'arrow.clockwise': S('M19.2 12a7.2 7.2 0 1 1-2.1-5.1', 1.8) + S('M19.4 4.2v4.6h-4.6', 1.8),
  'lock.fill': F('M7 10.6h10a1.6 1.6 0 0 1 1.6 1.6v6.4a1.6 1.6 0 0 1-1.6 1.6H7a1.6 1.6 0 0 1-1.6-1.6v-6.4A1.6 1.6 0 0 1 7 10.6Z') + S('M8.6 10.6V8a3.4 3.4 0 0 1 6.8 0v2.6', 2),
  'text.bubble': S('M6 4.6h12a2.4 2.4 0 0 1 2.4 2.4v7.4a2.4 2.4 0 0 1-2.4 2.4h-6.2L7.4 20.2v-3.4H6a2.4 2.4 0 0 1-2.4-2.4V7A2.4 2.4 0 0 1 6 4.6ZM7.8 9h8.4M7.8 12.4h5.6', 1.6),
  textformat: S('M3.5 18.5 8 6.5l4.5 12M5.2 14.2h5.6', 1.6) + S('M18 11.6a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2ZM20.6 10.6v7.9', 1.6),
  'bell.slash': S('M12 3.4a5.4 5.4 0 0 0-5.4 5.4v3.8L5 15.6h14l-1.6-3V8.8A5.4 5.4 0 0 0 12 3.4ZM9.8 18.4a2.3 2.3 0 0 0 4.4 0M4 4l16 16', 1.6),
  'waveform.path.ecg': S('M2.8 12.4h4.4l1.7-3.6 2.6 8.4 2.4-11 2 6.2h5.3', 1.6),
}
export function icon(name, cls = '') {
  const body = ICONS[name] ?? ICONS.plus
  return `<svg class="ios-icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`
}
const iconEl = (name, cls) => { const t = document.createElement('template'); t.innerHTML = icon(name, cls); return t.content.firstChild }

// ───────────────────────── Liquid Glass engine ─────────────────────────
let defs
function svgDefs() {
  if (defs) return defs
  const svg = document.createElementNS(NS, 'svg')
  svg.setAttribute('width', '0'); svg.setAttribute('height', '0')
  svg.setAttribute('aria-hidden', 'true')
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none'
  defs = document.createElementNS(NS, 'defs')
  svg.append(defs)
  document.body.prepend(svg)
  return defs
}

// A displacement map for a rounded rect with a convex lens bezel: inside the
// bezel each pixel samples the backdrop from further in along the surface
// normal (strongest at the rim), so content bends as it nears the edge.
const mapCache = new Map()
function displacementMap(w, h, r, bezel, profilePower) {
  const key = `${w}x${h}r${r}b${bezel}p${profilePower}`
  if (mapCache.has(key)) return mapCache.get(key)
  const cw = Math.max(2, Math.round(w)), ch = Math.max(2, Math.round(h))
  const canvas = document.createElement('canvas')
  canvas.width = cw; canvas.height = ch
  const ctx = canvas.getContext('2d')
  const img = ctx.createImageData(cw, ch)
  const u32 = new Uint32Array(img.data.buffer)
  u32.fill(0xff808080)
  const hw = w / 2, hh = h / 2, rr = Math.min(r, hw, hh)
  const sx = w / cw, sy = h / ch
  const bx = hw - rr, by = hh - rr
  const m = Math.max(rr, bezel)
  const xMid0 = Math.max(0, Math.ceil((m - 0.5 * sx) / sx))
  const xMid1 = Math.min(cw, Math.floor((w - m - 0.5 * sx) / sx) + 1)
  for (let y = 0; y < ch; y++) {
    const py = (y + 0.5) * sy - hh
    const apy = Math.abs(py)
    const qy = apy - by
    const rowOff = y * cw
    let midVal = 0xff808080
    if (xMid1 > xMid0 && qy <= 0) {
      const distY = hh - apy
      if (distY >= 0 && distY < bezel) {
        const t = distY / bezel
        const mag = Math.pow(1 - t, profilePower) * (1 - 0.25 * t)
        const G = Math.round(128 - Math.sign(py) * mag * 127)
        midVal = 0xff800080 | (G << 8)
      }
    }
    for (let x = 0; x < cw; x++) {
      if (x === xMid0 && xMid1 > xMid0 && qy <= 0) {
        if (midVal !== 0xff808080) u32.fill(midVal, rowOff + xMid0, rowOff + xMid1)
        x = xMid1 - 1
        continue
      }
      const px = (x + 0.5) * sx - hw
      const apx = Math.abs(px)
      const qx = apx - bx
      let nx, ny, dist
      if (qx > 0 && qy > 0) {
        const l = Math.hypot(qx, qy) || 1
        dist = rr - l
        nx = (qx / l) * Math.sign(px); ny = (qy / l) * Math.sign(py)
      } else if (qx > qy) {
        dist = hw - apx
        nx = Math.sign(px); ny = 0
      } else {
        dist = hh - apy
        nx = 0; ny = Math.sign(py)
      }
      if (dist >= 0 && dist < bezel) {
        const t = dist / bezel
        // Convex squircle surface: the slope (and so the bend) peaks at the rim
        // and eases to zero where the flat top begins.
        const mag = Math.pow(1 - t, profilePower) * (1 - 0.25 * t)
        const R = Math.round(128 - nx * mag * 127)
        const G = Math.round(128 - ny * mag * 127)
        u32[rowOff + x] = 0xff800000 | (G << 8) | R
      }
    }
  }
  ctx.putImageData(img, 0, 0)
  const url = canvas.toDataURL()
  mapCache.set(key, url)
  return url
}

const filterCache = new Map()
let filterSeq = 0
function glassFilter({ w, h, r, bezel, scale, blur, aberration }) {
  w = Math.round(w); h = Math.round(h)
  const key = [w, h, Math.round(r), Math.round(bezel), Math.round(scale), blur, aberration].join(':')
  if (filterCache.has(key)) return filterCache.get(key)
  const id = `ios-lg-${++filterSeq}`
  const map = displacementMap(w, h, r, bezel, 2.2)
  const f = document.createElementNS(NS, 'filter')
  f.setAttribute('id', id)
  for (const [k, v] of Object.entries({ x: 0, y: 0, width: w, height: h, filterUnits: 'userSpaceOnUse', primitiveUnits: 'userSpaceOnUse', 'color-interpolation-filters': 'sRGB' })) f.setAttribute(k, v)
  const disp = (inp, s, res) => `<feDisplacementMap in="${inp}" in2="map" scale="${s.toFixed(2)}" xChannelSelector="R" yChannelSelector="G" result="${res}"/>`
  let body = `<feGaussianBlur in="SourceGraphic" stdDeviation="${blur}" edgeMode="duplicate" result="blur"/>` +
    `<feImage href="${map}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="map"/>`
  if (aberration) {
    // Slightly different bend per channel: a whisper of dispersion at the rim.
    body += disp('blur', scale * 1.0, 'dr') + disp('blur', scale * 0.93, 'dg') + disp('blur', scale * 0.86, 'db') +
      `<feColorMatrix in="dr" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="cr"/>` +
      `<feColorMatrix in="dg" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="cg"/>` +
      `<feColorMatrix in="db" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="cb"/>` +
      `<feComposite in="cr" in2="cg" operator="arithmetic" k2="1" k3="1" result="crg"/>` +
      `<feComposite in="crg" in2="cb" operator="arithmetic" k2="1" k3="1"/>`
  } else {
    body += disp('blur', scale, 'out')
  }
  f.innerHTML = body
  svgDefs().append(f)
  filterCache.set(key, id)
  return id
}

const glassObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver((entries) => {
  for (const e of entries) refreshGlass(e.target)
}) : null

function refreshGlass(el) {
  const fx = el.querySelector(':scope > .lg-fx')
  if (!fx || !config.refraction || el.classList.contains('lg-fallback')) return
  const w = el.offsetWidth, hgt = el.offsetHeight
  if (!w || !hgt) return
  const cs = getComputedStyle(el)
  let r = parseFloat(cs.borderTopLeftRadius) || 0
  r = Math.min(r, w / 2, hgt / 2)
  const m = Math.min(w, hgt)
  const bezel = +el.getAttribute('bezel') || clamp(m * 0.36, 9, 30)
  const scale = +el.getAttribute('refract') || clamp(m * 0.62, 16, 64)
  const blur = +el.getAttribute('blur') || parseFloat(cs.getPropertyValue('--lg-blur')) / 2.4 || 2
  const id = glassFilter({ w, h: hgt, r, bezel, scale, blur: +blur.toFixed(1), aberration: config.aberration && !el.hasAttribute('no-aberration') })
  const extra = ` saturate(var(--glass-sat)) brightness(var(--glass-bright))`
  fx.style.backdropFilter = `url(#${id})${extra}`
  fx.style.webkitBackdropFilter = `url(#${id})${extra}`
}

/** Turn any element into Liquid Glass. */
export function glass(el, { shape, interactive, strong } = {}) {
  if (el._lg) return el
  el._lg = true
  el.classList.add('lg')
  shape = shape || el.getAttribute('shape') || el.dataset.glass
  if (shape && shape !== 'true' && shape !== '') el.classList.add(`lg-${shape}`)
  if (interactive) el.setAttribute('interactive', '')
  if (strong) el.classList.add('lg-strong')
  if (!config.refraction) el.classList.add('lg-fallback')
  // Loose text can't stack above the positioned glass layers.
  for (const n of [...el.childNodes]) if (n.nodeType === 3 && n.textContent.trim()) n.replaceWith(h('span', {}, n.textContent))
  el.prepend(h('span', { class: 'lg-fx' }), h('span', { class: 'lg-tint' }), h('span', { class: 'lg-rim' }), h('span', { class: 'lg-glow' }))
  glassObserver?.observe(el)
  if (!glassObserver) requestAnimationFrame(() => refreshGlass(el))
  if (el.hasAttribute('interactive')) {
    const move = (e) => {
      const b = el.getBoundingClientRect()
      el.style.setProperty('--px', `${((e.clientX - b.left) / b.width) * 100}%`)
      el.style.setProperty('--py', `${((e.clientY - b.top) / b.height) * 100}%`)
    }
    el.addEventListener('pointerdown', (e) => { move(e); el.classList.add('pressed') })
    el.addEventListener('pointermove', (e) => { if (el.classList.contains('pressed')) move(e) })
    for (const t of ['pointerup', 'pointerleave', 'pointercancel']) el.addEventListener(t, () => el.classList.remove('pressed'))
  }
  return el
}
export const refresh = refreshGlass

class IOSGlass extends HTMLElement {
  connectedCallback() { glass(this) }
}

// ───────────────────────── phone frame ─────────────────────────
const SIGNAL = {
  bars: '<svg width="19" height="12" viewBox="0 0 19 12"><rect x="0" y="7.5" width="3.2" height="4.5" rx=".9" fill="currentColor"/><rect x="5.1" y="5" width="3.2" height="7" rx=".9" fill="currentColor"/><rect x="10.2" y="2.5" width="3.2" height="9.5" rx=".9" fill="currentColor"/><rect x="15.3" y="0" width="3.2" height="12" rx=".9" fill="currentColor"/></svg>',
  none: '<svg width="22" height="12" viewBox="0 0 22 12"><g fill="currentColor" opacity=".35"><rect x="0" y="8.2" width="3.4" height="3.4" rx="1"/><rect x="6" y="8.2" width="3.4" height="3.4" rx="1"/><rect x="12" y="8.2" width="3.4" height="3.4" rx="1"/><rect x="18" y="8.2" width="3.4" height="3.4" rx="1"/></g></svg>',
}
const WIFI = '<svg width="19.5" height="14" viewBox="0 0 19.5 14"><path fill="currentColor" d="M9.75 2.9c2.7 0 5.2 1 7.1 2.8.2.2.5.2.7 0l1.4-1.4c.2-.2.2-.5 0-.7A13.2 13.2 0 0 0 .05 3.6c-.2.2-.2.5 0 .7l1.4 1.4c.2.2.5.2.7 0 1.9-1.8 4.4-2.8 7.1-2.8Zm0 4.4c1.5 0 2.9.6 4 1.5.2.2.5.2.7 0l1.4-1.4c.2-.2.2-.5 0-.7a9 9 0 0 0-12.2 0c-.2.2-.2.5 0 .7l1.4 1.4c.2.2.5.2.7 0 1.1-.9 2.5-1.5 4-1.5Zm2.6 3.2c.2-.2.2-.5 0-.7a3.9 3.9 0 0 0-5.2 0c-.2.2-.2.5 0 .7l2.2 2.2c.2.2.5.2.7 0l2.3-2.2Z"/></svg>'
const BATTERY = (level = 1) => `<svg width="31" height="14.5" viewBox="0 0 31 14.5"><rect x=".6" y=".6" width="26.6" height="13.3" rx="4.2" fill="none" stroke="currentColor" stroke-opacity=".4" stroke-width="1.2"/><rect x="2.4" y="2.4" width="${(23 * level).toFixed(1)}" height="9.7" rx="2.6" fill="currentColor"/><path d="M28.6 4.9v4.7c.9-.3 1.6-1.3 1.6-2.35S29.5 5.2 28.6 4.9Z" fill="currentColor" fill-opacity=".45"/></svg>`

class IOSPhone extends HTMLElement {
  static observedAttributes = ['theme', 'time', 'signal', 'statusbar']
  connectedCallback() {
    if (this._built) return
    this._built = true
    if (!this.hasAttribute('theme')) this.setAttribute('theme', 'light')
    const kids = [...this.childNodes]
    this.screen = h('div', { class: 'ios-screen ios' })
    this.screen.append(...kids)
    this.status = h('div', { class: 'ios-statusbar' })
    this.screen.append(this.status, h('div', { class: 'ios-island' }), h('div', { class: 'ios-home' }))
    this.append(h('div', { class: 'ios-device' }, this.screen))
    this.renderStatus()
  }
  attributeChangedCallback() { if (this._built) this.renderStatus() }
  renderStatus() {
    const sb = this.getAttribute('statusbar')
    this.status.className = 'ios-statusbar' + (sb ? ` on-${sb}` : '')
    this.status.innerHTML = `<span class="time">${esc(this.getAttribute('time') || '9:41')}</span>` +
      `<span class="icons">${SIGNAL[this.getAttribute('signal') || 'bars'] || SIGNAL.bars}${WIFI}${BATTERY(+(this.getAttribute('battery') ?? 1))}</span>`
  }
}

// ───────────────────────── sheet ─────────────────────────
/**
 * Present a sheet. `host` is any element inside a phone (or the phone itself).
 * Returns { el, body, close(), setDetent(d) }.
 */
export function sheet(host, { title = '', detent = 'medium', body = '', done = 'Done', onClose, glassy = true } = {}) {
  const screen = screenOf(host)
  const layer = h('div', { class: 'ios-sheet-layer' })
  const scrim = h('div', { class: 'ios-sheet-scrim' })
  const panel = h('div', { class: 'ios-sheet', role: 'dialog', 'aria-label': title })
  if (glassy) glass(panel, { shape: 'panel' })
  const grab = h('div', { class: 'ios-grabber' })
  const nav = h('div', { class: 'ios-sheet-nav' }, h('h3', {}, title))
  if (done) {
    const d = h('div', { class: 'done', interactive: true, role: 'button' }, done)
    glass(d, { shape: 'capsule' }); d.classList.add('lg-clear')
    d.addEventListener('click', () => api.close())
    nav.append(d)
  }
  const bodyEl = h('div', { class: 'ios-sheet-body' })
  if (typeof body === 'string') bodyEl.innerHTML = body
  else if (body) bodyEl.append(body)
  panel.append(grab, nav, bodyEl)
  layer.append(scrim, panel)
  screen.append(layer)
  const api = {
    el: panel, body: bodyEl,
    setDetent(d) { layer.classList.toggle('large', d === 'large'); api.detent = d },
    close() {
      layer.classList.remove('open')
      setTimeout(() => layer.remove(), 500)
      onClose?.()
    },
  }
  api.setDetent(detent)
  scrim.addEventListener('click', () => api.close())
  // Drag the grabber/nav: up → large, down → medium or dismiss.
  let start = null
  const down = (e) => { start = { y: e.clientY }; panel.classList.add('dragging'); e.target.setPointerCapture?.(e.pointerId) }
  const move = (e) => { if (start) panel.style.transform = `translateY(${Math.max(-40, e.clientY - start.y)}px)` }
  const up = (e) => {
    if (!start) return
    const dy = e.clientY - start.y
    panel.classList.remove('dragging'); panel.style.transform = ''
    if (dy < -40) api.setDetent('large')
    else if (dy > 80) api.detent === 'large' ? api.setDetent('medium') : api.close()
    start = null
  }
  for (const t of [grab, nav]) { t.addEventListener('pointerdown', down); t.addEventListener('pointermove', move); t.addEventListener('pointerup', up) }
  requestAnimationFrame(() => requestAnimationFrame(() => layer.classList.add('open')))
  return api
}

/** Grouped-list markup helper for sheets: [{ header, footer, rows: [{ label, value, icon, chevron }] }] */
export function groupedList(groups) {
  return groups.map((g) => `${g.header ? `<div class="ios-group-h">${esc(g.header)}</div>` : ''}<div class="ios-group">${g.rows.map((r) =>
    `<div class="ios-cell">${r.icon ? `<span class="ic">${icon(r.icon)}</span>` : ''}<span>${esc(r.label)}</span>${r.value ? `<span class="val">${esc(r.value)}</span>` : ''}${r.chevron ? `<span class="chev">${icon('chevron.right')}</span>` : ''}</div>`).join('')}</div>${g.footer ? `<div class="ios-group-f">${esc(g.footer)}</div>` : ''}`).join('')
}

// ───────────────────────── menu ─────────────────────────
/**
 * Native-style menu popover anchored to `anchor`.
 * items: [{ label, icon, destructive, submenu, action }] with '-' separators.
 */
export function menu(anchor, { title, items = [], align, placement = 'over' } = {}) {
  const screen = screenOf(anchor)
  const layer = h('div', { class: 'ios-menu-layer' })
  const m = h('div', { class: 'ios-menu', role: 'menu' })
  glass(m, { shape: 'panel' })
  if (title) m.append(h('div', { class: 'm-h' }, title))
  for (const it of items) {
    if (it === '-') { m.append(h('div', { class: 'm-sep' })); continue }
    const row = h('div', { class: 'm-i' + (it.destructive ? ' destructive' : ''), role: 'menuitem' })
    row.innerHTML = `<span class="ic">${it.icon ? icon(it.icon) : ''}</span><span>${esc(it.label)}</span>${it.submenu ? `<span class="sub">${icon('chevron.right')}</span>` : ''}`
    row.addEventListener('click', (e) => { e.stopPropagation(); close(); it.action?.() })
    m.append(row)
  }
  layer.append(m)
  screen.append(layer)
  const sb = screen.getBoundingClientRect(), ab = anchor.getBoundingClientRect()
  const sx = sb.width / screen.offsetWidth || 1
  const right = (align || (ab.left + ab.width / 2 - sb.left > sb.width / 2 ? 'right' : 'left')) === 'right'
  if (right) { m.style.right = `${(sb.right - ab.right) / sx}px`; m.style.transformOrigin = 'top right' }
  else { m.style.left = `${(ab.left - sb.left) / sx}px`; m.style.transformOrigin = 'top left' }
  if (placement === 'above') {
    m.style.bottom = `${(sb.bottom - ab.top) / sx + 8}px`
    m.style.transformOrigin = m.style.transformOrigin.replace('top', 'bottom')
  } else m.style.top = `${(ab.top - sb.top) / sx}px`
  function close() { m.classList.add('closing'); setTimeout(() => layer.remove(), 180) }
  layer.addEventListener('pointerdown', (e) => { if (!m.contains(e.target)) close() })
  return { el: m, close }
}

// ───────────────────────── alert ─────────────────────────
/** iOS 26 alert. Resolves with the chosen button label. */
export function alert(host, { title, message, buttons = [{ label: 'OK', role: 'default' }] } = {}) {
  const screen = screenOf(host)
  return new Promise((resolve) => {
    const layer = h('div', { class: 'ios-alert-layer' })
    const box = h('div', { class: 'ios-alert', role: 'alertdialog' }, h('h4', {}, title || ''), message ? h('p', {}, message) : null)
    glass(box, { shape: 'panel' })
    const btns = h('div', { class: 'btns' })
    for (const b of buttons) {
      const el = h('div', { class: b.role === 'destructive' ? 'destructive' : b.role === 'prominent' ? 'prominent' : '', interactive: true, role: 'button' }, b.label)
      glass(el, { shape: 'capsule' })
      el.addEventListener('click', () => { layer.remove(); resolve(b.label) })
      btns.append(el)
    }
    box.append(btns)
    layer.append(box)
    screen.append(layer)
  })
}

// ───────────────────────── keyboard (static illustration) ─────────────────────────
/** Show or hide an iOS 26 keyboard in the phone; returns its element. */
export function keyboard(host, show = true) {
  const screen = screenOf(host)
  let kb = screen.querySelector(':scope > .ios-keyboard')
  if (!kb) {
    kb = h('div', { class: 'ios-keyboard', 'aria-hidden': 'true' })
    const row = (keys, x0) => h('div', { class: 'kr', style: `padding-left:${x0}px` }, ...keys.map((k) => typeof k === 'string' ? h('span', { class: 'k' }, k) : k))
    const key = (cls, html) => h('span', { class: `k ${cls}`, html })
    kb.append(
      h('div', { class: 'sugg' }, h('span', {}, 'I'), h('span', {}, 'The'), h('span', {}, 'I’m')),
      row('QWERTYUIOP'.split(''), 6.7),
      row('ASDFGHJKL'.split(''), 28.2),
      row([key('w fn', '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 3.5 3 12.6h5v7.4h8v-7.4h5Z" fill="currentColor"/></svg>'), h('span', { style: 'width:2.6px' }), ...'ZXCVBNM'.split(''), h('span', { style: 'width:2.6px' }), key('w fn', icon('delete.left'))], 6.7),
      row([key('wide fn', '123'), key('sp', ''), key('ret', icon('arrow.up'))], 6.7),
      h('div', { class: 'kb-bottom', html: `<span>${icon('face.smiling', 'emoji')}</span><span>${icon('mic')}</span>` }),
    )
    screen.append(kb)
  }
  requestAnimationFrame(() => kb.classList.toggle('up', show))
  return kb
}

// ───────────────────────── define ─────────────────────────
const define = (name, cls) => { if (!customElements.get(name)) customElements.define(name, cls) }
define('ios-glass', IOSGlass)
define('ios-phone', IOSPhone)

// Upgrade [data-glass] elements, now and as they appear.
const upgradeAll = (root = document) => root.querySelectorAll?.('[data-glass]').forEach((el) => glass(el))
upgradeAll()
new MutationObserver((muts) => {
  for (const m of muts) for (const n of m.addedNodes) if (n.nodeType === 1) { if (n.matches('[data-glass]')) glass(n); upgradeAll(n) }
}).observe(document.documentElement, { childList: true, subtree: true })

export { h, clamp, esc, screenOf, emit, define }
const IOS = { config, keyboard, glass, refresh, icon, ICONS, sheet, groupedList, menu, alert, h, emit, screenOf }
window.IOS = IOS
export default IOS
