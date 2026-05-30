// Лёгкий аудио-движок на Web Audio.
// Генерирует звуки и петли музыки без внешних файлов.

let ctx = null
let masterSfx = null
let masterMusic = null
let initialized = false

let musicTimer = null
let musicBeat = 0
let currentTheme = null
let currentIntensity = 1
let musicEnabled = true
let sfxEnabled = true

function ensureCtx() {
  if (ctx) return ctx
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    ctx = new Ctx()
  } catch {
    ctx = null
    return null
  }
  masterSfx = ctx.createGain()
  masterSfx.gain.value = 0.55
  masterSfx.connect(ctx.destination)
  masterMusic = ctx.createGain()
  masterMusic.gain.value = 0.18
  masterMusic.connect(ctx.destination)
  initialized = true
  return ctx
}

// Должно вызываться по первому пользовательскому жесту (тап/клик).
export function unlockAudio() {
  const c = ensureCtx()
  if (c && c.state !== 'running') {
    c.resume().catch(() => {})
  }
}

// ===== Настройки громкости =====
export function setSoundEnabled(on) {
  sfxEnabled = !!on
  if (masterSfx) masterSfx.gain.value = on ? 0.55 : 0.0
}
export function setMusicEnabled(on) {
  musicEnabled = !!on
  if (masterMusic) masterMusic.gain.value = on ? 0.18 : 0.0
  if (!on) stopMusic()
  else if (currentTheme) startMusic(currentTheme, currentIntensity)
}

// ===== SFX =====

function osc({ type = 'sine', freq, freqEnd, attack = 0.01, decay = 0.18, vol = 0.4, dur = 0.2, detune = 0 }) {
  const c = ensureCtx()
  if (!c || !sfxEnabled) return
  const t = c.currentTime
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (detune) o.detune.setValueAtTime(detune, t)
  if (freqEnd != null) o.frequency.exponentialRampToValueAtTime(Math.max(0.0001, freqEnd), t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(masterSfx)
  o.start(t)
  o.stop(t + dur + decay)
}

function noise({ dur = 0.2, vol = 0.5, hp = 600, lp = 4000 }) {
  const c = ensureCtx()
  if (!c || !sfxEnabled) return
  const t = c.currentTime
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1)
  const src = c.createBufferSource()
  src.buffer = buf
  const hpF = c.createBiquadFilter(); hpF.type = 'highpass'; hpF.frequency.value = hp
  const lpF = c.createBiquadFilter(); lpF.type = 'lowpass'; lpF.frequency.value = lp
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(hpF).connect(lpF).connect(g).connect(masterSfx)
  src.start(t)
  src.stop(t + dur + 0.05)
}

// ===== Конкретные звуки =====
export function sfxTap() {
  osc({ type: 'square', freq: 320, freqEnd: 220, vol: 0.18, dur: 0.06 })
}
export function sfxHit() {
  noise({ dur: 0.12, vol: 0.35, hp: 800, lp: 5500 })
  osc({ type: 'sawtooth', freq: 220, freqEnd: 110, vol: 0.18, dur: 0.10 })
}
export function sfxCrit() {
  noise({ dur: 0.15, vol: 0.45, hp: 1200, lp: 8000 })
  osc({ type: 'square', freq: 660, freqEnd: 330, vol: 0.22, dur: 0.18 })
}
export function sfxChestOpen() {
  // лёгкое скрип + металлический «дзынь»
  noise({ dur: 0.14, vol: 0.35, hp: 700, lp: 3500 })
  osc({ type: 'triangle', freq: 880, freqEnd: 1320, vol: 0.20, dur: 0.18, attack: 0.03 })
  osc({ type: 'triangle', freq: 1320, freqEnd: 1760, vol: 0.16, dur: 0.22, attack: 0.05 })
}
export function sfxLevelUp() {
  // быстрый аккорд
  osc({ type: 'triangle', freq: 523, vol: 0.18, dur: 0.18 })
  setTimeout(() => osc({ type: 'triangle', freq: 659, vol: 0.20, dur: 0.20 }), 80)
  setTimeout(() => osc({ type: 'triangle', freq: 784, vol: 0.22, dur: 0.30 }), 160)
}
export function sfxFanfare() {
  // фанфары: 4 ноты по мажорному трезвучию + блестящий отзвук
  const notes = [392, 523, 659, 784, 1046]
  notes.forEach((f, i) => {
    setTimeout(() => osc({ type: 'triangle', freq: f, vol: 0.22, dur: 0.32 }), i * 100)
  })
  setTimeout(() => noise({ dur: 0.45, vol: 0.18, hp: 2000, lp: 9000 }), 80)
}
export function sfxUlt() {
  osc({ type: 'square', freq: 660, freqEnd: 990, vol: 0.18, dur: 0.18 })
  setTimeout(() => osc({ type: 'square', freq: 880, freqEnd: 1320, vol: 0.18, dur: 0.18 }), 80)
}
export function sfxSuper() {
  noise({ dur: 0.35, vol: 0.5, hp: 800, lp: 6000 })
  osc({ type: 'sawtooth', freq: 220, freqEnd: 660, vol: 0.20, dur: 0.32 })
  setTimeout(() => osc({ type: 'sawtooth', freq: 330, freqEnd: 990, vol: 0.18, dur: 0.30 }), 100)
}

// ===== Музыка =====
// Темы — по 4 «тонических» центра, 8-битные арпеджио.
// 1..5: forest, fire, crystal, dark, ice, sky, volcano, glacier, fate.
const THEMES = {
  forest:  { root: 196, scale: [0,2,3,5,7,8,10,12], waveLead: 'triangle', waveBass: 'sine',     bpm: 92 },
  fire:    { root: 175, scale: [0,2,4,5,7,9,11,12], waveLead: 'sawtooth', waveBass: 'triangle', bpm: 108 },
  crystal: { root: 220, scale: [0,2,3,5,7,9,10,12], waveLead: 'triangle', waveBass: 'square',   bpm: 100 },
  dark:    { root: 165, scale: [0,2,3,5,7,8,10,12], waveLead: 'sawtooth', waveBass: 'sawtooth', bpm: 88 },
  ice:     { root: 210, scale: [0,2,4,7,9,11,12,14], waveLead: 'triangle', waveBass: 'sine',    bpm: 96 },
  sky:     { root: 246, scale: [0,2,4,5,7,9,11,12], waveLead: 'triangle', waveBass: 'triangle', bpm: 104 },
  volcano: { root: 155, scale: [0,2,3,5,7,8,10,12], waveLead: 'square',   waveBass: 'sawtooth', bpm: 112 },
  glacier: { root: 233, scale: [0,2,4,5,7,9,11,12], waveLead: 'triangle', waveBass: 'sine',     bpm: 86 },
  fate:    { root: 165, scale: [0,2,3,7,8,10,12,15], waveLead: 'sawtooth', waveBass: 'triangle', bpm: 100 },
}

// Маппинг номера зоны → тема
const ZONE_THEMES = [
  'forest','fire','crystal','dark','dark','sky','volcano','glacier','fate',
  'forest','fire','crystal','dark','dark','sky','volcano','glacier','fate',
  'fate','fate'
]

export function getZoneTheme(zoneId) {
  const t = ZONE_THEMES[(Math.max(1, zoneId) - 1) % ZONE_THEMES.length]
  return t || 'forest'
}

export function startMusic(themeId, intensity = 1) {
  const c = ensureCtx()
  if (!c) return
  if (!musicEnabled) return
  if (currentTheme === themeId && musicTimer) {
    setMusicIntensity(intensity)
    return
  }
  stopMusic()
  const theme = THEMES[themeId] || THEMES.forest
  currentTheme = themeId
  setMusicIntensity(intensity)
  const beatMs = 60000 / theme.bpm / 2 // 8th-notes
  musicBeat = 0
  musicTimer = setInterval(() => playBeat(theme), beatMs)
}

export function stopMusic() {
  if (musicTimer) clearInterval(musicTimer)
  musicTimer = null
  currentTheme = null
}

// 1..3 — спокойно/норм/боево. Меняем гейн.
export function setMusicIntensity(level) {
  currentIntensity = Math.max(0.5, Math.min(3, Number(level) || 1))
  if (masterMusic) {
    const base = musicEnabled ? 0.18 : 0
    const factor = 0.6 + 0.5 * currentIntensity // 0.85..2.1
    masterMusic.gain.linearRampToValueAtTime(
      Math.min(0.45, base * factor),
      ensureCtx().currentTime + 0.6
    )
  }
}

function playBeat(theme) {
  const c = ensureCtx()
  if (!c) return
  const t = c.currentTime
  const beat = musicBeat++
  const root = theme.root
  // басс: тоника каждые 4 ноты
  if (beat % 4 === 0) {
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = theme.waveBass
    o.frequency.value = root / 2
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.45, t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5)
    o.connect(g).connect(masterMusic)
    o.start(t)
    o.stop(t + 0.55)
  }
  // лид: ходим по гамме
  const step = theme.scale[(beat * 3) % theme.scale.length]
  const f = root * Math.pow(2, step / 12)
  const o2 = c.createOscillator()
  const g2 = c.createGain()
  o2.type = theme.waveLead
  o2.frequency.value = f
  g2.gain.setValueAtTime(0.0001, t)
  g2.gain.exponentialRampToValueAtTime(0.18, t + 0.02)
  g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.25)
  o2.connect(g2).connect(masterMusic)
  o2.start(t)
  o2.stop(t + 0.3)
}
