// One-off script: hand-encodes simple PNG app icons (no image-processing
// dependency available in this environment) — a mint square with a white
// "page" and a few rule lines, echoing the planner's paper aesthetic.
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { mkdirSync } from 'node:fs'

function crc32(buf) {
  let c
  const table = crc32.table ?? (crc32.table = (() => {
    const t = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
      c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      t[n] = c >>> 0
    }
    return t
  })())
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function drawIcon(size) {
  const bg = hexToRgb('#c9ead1')
  const page = hexToRgb('#fbf9f4')
  const line = hexToRgb('#c8c2b3')
  const disc = hexToRgb('#a99be0')

  const pixels = new Uint8Array(size * size * 4)
  const set = (x, y, [r, g, b], a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const i = (y * size + x) * 4
    pixels[i] = r
    pixels[i + 1] = g
    pixels[i + 2] = b
    pixels[i + 3] = a
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) set(x, y, bg)
  }

  const pad = Math.round(size * 0.16)
  const pageX0 = pad
  const pageX1 = size - pad
  const pageY0 = pad
  const pageY1 = size - pad
  const radius = Math.round(size * 0.06)

  const inRoundedRect = (x, y) => {
    if (x < pageX0 || x >= pageX1 || y < pageY0 || y >= pageY1) return false
    const cx = x < pageX0 + radius ? pageX0 + radius : x > pageX1 - radius ? pageX1 - radius : x
    const cy = y < pageY0 + radius ? pageY0 + radius : y > pageY1 - radius ? pageY1 - radius : y
    const dx = x - cx
    const dy = y - cy
    return dx * dx + dy * dy <= radius * radius
  }

  for (let y = pageY0; y < pageY1; y++) {
    for (let x = pageX0; x < pageX1; x++) {
      if (inRoundedRect(x, y)) set(x, y, page)
    }
  }

  // A few rule lines across the page.
  const lineCount = 4
  for (let i = 1; i <= lineCount; i++) {
    const ly = pageY0 + Math.round(((pageY1 - pageY0) * i) / (lineCount + 1))
    for (let x = pageX0 + radius; x < pageX1 - radius / 2; x++) {
      set(x, ly, line)
      set(x, ly + 1, line)
    }
  }

  // Small binder discs along the left edge of the page.
  const discR = Math.max(2, Math.round(size * 0.018))
  const discX = pageX0 - Math.round(size * 0.01)
  const discCount = 5
  for (let i = 0; i < discCount; i++) {
    const cy = pageY0 + Math.round(((pageY1 - pageY0) * (i + 0.5)) / discCount)
    for (let y = cy - discR; y <= cy + discR; y++) {
      for (let x = discX - discR; x <= discX + discR; x++) {
        const dx = x - discX
        const dy = y - cy
        if (dx * dx + dy * dy <= discR * discR) set(x, y, disc)
      }
    }
  }

  return pixels
}

function encodePng(size) {
  const pixels = drawIcon(size)
  const stride = size * 4
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0 // filter type: none
    Buffer.from(pixels.buffer, y * stride, stride).copy(raw, y * (stride + 1) + 1)
  }
  const idat = deflateSync(raw)

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync(new URL('../public/icons', import.meta.url), { recursive: true })
for (const size of [192, 512, 180]) {
  const png = encodePng(size)
  const path = new URL(`../public/icons/icon-${size}.png`, import.meta.url)
  writeFileSync(path, png)
  console.log(`wrote ${path.pathname} (${png.length} bytes)`)
}
