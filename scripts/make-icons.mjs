import { promises as fs } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

// Генерируем PNG иконки приложения для Android (mipmap)
// и adaptive-icons (foreground/background) из branding/icon.svg.

const ROOT = path.resolve('.')
const SRC = path.join(ROOT, 'branding', 'icon.svg')
const ANDROID_RES = path.join(ROOT, 'android', 'app', 'src', 'main', 'res')

const SIZES = [
  { dir: 'mipmap-mdpi',    size: 48 },
  { dir: 'mipmap-hdpi',    size: 72 },
  { dir: 'mipmap-xhdpi',   size: 96 },
  { dir: 'mipmap-xxhdpi',  size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
]

async function ensureDir(p) { await fs.mkdir(p, { recursive: true }) }

async function exists(p) {
  try { await fs.access(p); return true } catch { return false }
}

async function main() {
  if (!(await exists(SRC))) {
    console.error('Не найден', SRC)
    process.exit(1)
  }
  if (!(await exists(ANDROID_RES))) {
    console.error('Сначала запустите: npm run cap:add:android (создаст ./android)')
    process.exit(1)
  }

  const svg = await fs.readFile(SRC)

  // Полные иконки приложения
  for (const { dir, size } of SIZES) {
    const out = path.join(ANDROID_RES, dir)
    await ensureDir(out)
    const buf = await sharp(svg).resize(size, size).png().toBuffer()
    await fs.writeFile(path.join(out, 'ic_launcher.png'), buf)
    await fs.writeFile(path.join(out, 'ic_launcher_round.png'), buf)
  }

  // Adaptive icon: фон + foreground (foreground — наша svg в круге безопасной зоны 66%)
  // Делаем foreground 432x432 (рекомендация Android)
  const fgSize = 432
  const fg = await sharp(svg)
    .resize(Math.round(fgSize * 0.66), Math.round(fgSize * 0.66))
    .extend({
      top: Math.round(fgSize * 0.17),
      bottom: Math.round(fgSize * 0.17),
      left: Math.round(fgSize * 0.17),
      right: Math.round(fgSize * 0.17),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()

  // Заливка фона adaptive-icon
  const bgPng = await sharp({
    create: {
      width: 432, height: 432, channels: 4,
      background: { r: 8, g: 12, b: 38, alpha: 1 },
    },
  }).png().toBuffer()

  const fgOut = path.join(ANDROID_RES, 'mipmap-anydpi-v26')
  await ensureDir(fgOut)
  // adaptive xml
  const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@mipmap/ic_launcher_background"/>
  <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`
  await fs.writeFile(path.join(fgOut, 'ic_launcher.xml'), adaptiveXml)
  await fs.writeFile(path.join(fgOut, 'ic_launcher_round.xml'), adaptiveXml)

  // Сохраняем foreground/background в каждый mipmap-? как PNG (упрощение)
  for (const { dir, size } of SIZES) {
    const out = path.join(ANDROID_RES, dir)
    const fgScaled = await sharp(fg).resize(size, size).png().toBuffer()
    const bgScaled = await sharp(bgPng).resize(size, size).png().toBuffer()
    await fs.writeFile(path.join(out, 'ic_launcher_foreground.png'), fgScaled)
    await fs.writeFile(path.join(out, 'ic_launcher_background.png'), bgScaled)
  }

  console.log('Иконки сгенерированы в', ANDROID_RES)
}

main().catch(err => { console.error(err); process.exit(1) })
