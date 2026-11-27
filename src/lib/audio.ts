import type { ToneKind } from '../data/animals'

type StopHandle = () => void

type Step = {
  frequency: number
  duration: number
  type?: OscillatorType
  gain?: number
  slideTo?: number
}

/** Scale catalog gains into a clearly audible range without hard clipping. */
const GAIN_SCALE = 4.5
const MAX_PEAK = 0.85
const DEFAULT_PEAK = 0.7

/** Slider 0–1. ~0.45 = Normal (current loud-but-safe). 1 = Ultra loud (intentional drive). */
export const VOLUME_NORMAL = 0.45
const VOLUME_MIN_GAIN = 0.04
const VOLUME_NORMAL_GAIN = 1
const VOLUME_ULTRA_GAIN = 8.5

/** One press → one long cue. Prefer ~7s loops/sustains (acceptable 6.5–7.5). */
const CUE_TARGET_SEC = 7
const CUE_MIN_SEC = 6.5
const CUE_MAX_SEC = 7.5

/** Infinity / loop control: keep repeating the cue for this long by default. */
export const DEFAULT_LOOP_MS = 5 * 60 * 1000

let sharedContext: AudioContext | null = null
let activeStop: StopHandle | null = null
let unlocked = false
let playbackVolume = VOLUME_NORMAL
/** Bumped on every stop so in-flight loop chains abort cleanly. */
let playbackGeneration = 0
let loopSleepTimer: number | null = null

function loudPeak(gain?: number): number {
  return Math.min(MAX_PEAK, (gain ?? DEFAULT_PEAK / GAIN_SCALE) * GAIN_SCALE)
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return VOLUME_NORMAL
  return Math.min(1, Math.max(0, value))
}

/** Map slider position → linear master gain. Above Normal, ramps hard into makeup. */
export function volumeToMasterGain(volume: number): number {
  const v = clamp01(volume)
  if (v <= VOLUME_NORMAL) {
    const t = VOLUME_NORMAL <= 0 ? 1 : v / VOLUME_NORMAL
    return VOLUME_MIN_GAIN + t * (VOLUME_NORMAL_GAIN - VOLUME_MIN_GAIN)
  }
  const t = (v - VOLUME_NORMAL) / (1 - VOLUME_NORMAL)
  return VOLUME_NORMAL_GAIN + t * (VOLUME_ULTRA_GAIN - VOLUME_NORMAL_GAIN)
}

/** 0 at Normal and below; 1 at Ultra. Used for soft-clip drive / compressor makeup. */
export function volumeDriveAmount(volume: number): number {
  const v = clamp01(volume)
  if (v <= VOLUME_NORMAL) return 0
  return (v - VOLUME_NORMAL) / (1 - VOLUME_NORMAL)
}

export function getPlaybackVolume(): number {
  return playbackVolume
}

export function setPlaybackVolume(volume: number): void {
  playbackVolume = clamp01(volume)
}

function makeSoftClipCurve(drive: number): Float32Array<ArrayBuffer> {
  const samples = 2048
  const curve = new Float32Array(samples)
  // drive 0 → near-linear; drive 1 → aggressive tanh soft-clip (audible grit)
  const k = 1 + drive * 18
  for (let i = 0; i < samples; i += 1) {
    const x = (i * 2) / (samples - 1) - 1
    curve[i] = Math.tanh(k * x) / Math.tanh(k)
  }
  return curve
}

function sleepMs(ms: number, generation: number): Promise<void> {
  return new Promise((resolve) => {
    if (loopSleepTimer != null) {
      window.clearTimeout(loopSleepTimer)
      loopSleepTimer = null
    }
    if (ms <= 0 || generation !== playbackGeneration) {
      resolve()
      return
    }
    loopSleepTimer = window.setTimeout(() => {
      loopSleepTimer = null
      resolve()
    }, ms)
  })
}

function getContext(): AudioContext {
  if (!sharedContext) {
    const Ctx =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) {
      throw new Error('Web Audio API is not available in this browser.')
    }
    sharedContext = new Ctx()
  }
  return sharedContext
}

export function isAudioUnlocked(): boolean {
  return unlocked && !!sharedContext && sharedContext.state === 'running'
}

export function getAudioContextState(): AudioContextState | 'missing' {
  if (!sharedContext) return 'missing'
  return sharedContext.state
}

/** Resume AudioContext on a user gesture; primes a tiny tick for Safari. */
export async function unlockAudio(): Promise<void> {
  const ctx = getContext()
  if (ctx.state === 'suspended') {
    await ctx.resume()
  }

  // Near-silent tick so some browsers fully unlock the destination.
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  gain.gain.value = 0.00001
  osc.connect(gain)
  gain.connect(ctx.destination)
  const now = ctx.currentTime
  osc.start(now)
  osc.stop(now + 0.04)

  if (ctx.state === 'suspended') {
    await ctx.resume()
  }
  if (ctx.state !== 'running') {
    throw new Error('AudioContext still suspended after unlock.')
  }
  unlocked = true
}

export function stopPlayback(): void {
  playbackGeneration += 1
  if (loopSleepTimer != null) {
    window.clearTimeout(loopSleepTimer)
    loopSleepTimer = null
  }
  if (activeStop) {
    activeStop()
    activeStop = null
  }
}

function scheduleStop(nodes: AudioNode[], timeoutMs: number): StopHandle {
  const stopAt = window.setTimeout(() => {
    for (const node of nodes) {
      try {
        if ('stop' in node && typeof (node as OscillatorNode).stop === 'function') {
          ;(node as OscillatorNode).stop()
        }
      } catch {
        // already stopped
      }
      try {
        node.disconnect()
      } catch {
        // already disconnected
      }
    }
    activeStop = null
  }, timeoutMs)

  return () => {
    window.clearTimeout(stopAt)
    for (const node of nodes) {
      try {
        if ('stop' in node && typeof (node as OscillatorNode).stop === 'function') {
          ;(node as OscillatorNode).stop()
        }
      } catch {
        // ignore
      }
      try {
        node.disconnect()
      } catch {
        // ignore
      }
    }
  }
}

function createMaster(ctx: AudioContext): {
  master: GainNode
  nodes: AudioNode[]
} {
  const master = ctx.createGain()
  const drive = volumeDriveAmount(playbackVolume)
  // Previous bug: master stayed at 0.0001 forever → inaudible.
  // Normal ≈ gain 1 with soft limiter. Ultra adds makeup + soft-clip grit on purpose.
  master.gain.value = volumeToMasterGain(playbackVolume)

  const softClip = ctx.createWaveShaper()
  softClip.curve = makeSoftClipCurve(drive)
  softClip.oversample = drive > 0.35 ? '4x' : '2x'

  const limiter = ctx.createDynamicsCompressor()
  if (drive < 0.08) {
    // Comfortable / Normal: soft peak control, same spirit as the original chain.
    limiter.threshold.value = -8
    limiter.knee.value = 16
    limiter.ratio.value = 10
    limiter.attack.value = 0.003
    limiter.release.value = 0.12
  } else {
    // Ultra: less protective squashing + makeup so outdoor throw can get hot / distorted.
    limiter.threshold.value = -2 + drive * 4
    limiter.knee.value = 4
    limiter.ratio.value = 3
    limiter.attack.value = 0.01
    limiter.release.value = 0.2
  }

  const makeup = ctx.createGain()
  makeup.gain.value = 1 + drive * 2.4

  master.connect(softClip)
  softClip.connect(limiter)
  limiter.connect(makeup)
  makeup.connect(ctx.destination)
  return { master, nodes: [master, softClip, limiter, makeup] }
}

function motifLengthSec(steps: Step[], gap: number): number {
  return steps.reduce((sum, step) => sum + Math.max(0.03, step.duration) + gap, 0)
}

/**
 * Repeat a short motif so the scheduled cue lands in ~6.5–7.5s.
 * `phraseGap` is folded into the last note of each phrase as extra sustain
 * (keeps playSequence's single gap simple; still reads as spaced phrases).
 */
function loopMotif(
  motif: Step[],
  targetSec = CUE_TARGET_SEC,
  stepGap = 0.04,
  phraseGap = 0.22,
): Step[] {
  if (!motif.length) return motif

  const unit: Step[] = motif.map((step, index) => {
    const extra = index === motif.length - 1 ? Math.max(0, phraseGap - stepGap) : 0
    return { ...step, duration: Math.max(0.03, step.duration) + extra }
  })

  const durationPart = unit.reduce((sum, step) => sum + step.duration, 0)
  const gapPart = unit.length * stepGap
  if (durationPart <= 0) return unit

  const scalePhrase = (scale: number): Step[] =>
    unit.map((step) => ({ ...step, duration: Math.max(0.03, step.duration * scale) }))

  let best: Step[] | null = null
  let bestErr = Number.POSITIVE_INFINITY

  for (let n = 1; n <= 64; n += 1) {
    // Gaps don't scale — solve n * (scale * durationPart + gapPart) = targetSec
    const scale = (targetSec / n - gapPart) / durationPart
    if (scale < 0.25 || scale > 24) continue
    const phrase = scalePhrase(scale)
    const total = n * motifLengthSec(phrase, stepGap)
    if (total < CUE_MIN_SEC - 0.01 || total > CUE_MAX_SEC + 0.01) continue
    const err = Math.abs(total - targetSec)
    if (err < bestErr) {
      bestErr = err
      best = []
      for (let i = 0; i < n; i += 1) {
        for (const step of phrase) best.push({ ...step })
      }
    }
  }

  if (best) return best

  // Guaranteed fallback: one phrase stretched so duration+gaps ≈ target.
  const scale = (targetSec - gapPart) / durationPart
  return scalePhrase(Math.max(0.25, scale))
}

function sustainSteps(
  pattern: Step[],
  totalSec = CUE_TARGET_SEC,
): Step[] {
  const base = motifLengthSec(pattern, 0)
  if (base <= 0) return pattern
  const scale = totalSec / base
  return pattern.map((step) => ({
    ...step,
    duration: Math.max(0.08, step.duration * scale),
  }))
}

function playSequence(
  ctx: AudioContext,
  steps: Step[],
  gap = 0.04,
): { stop: StopHandle; durationMs: number } {
  if (!steps.length) {
    throw new Error('No oscillator steps scheduled for this cue.')
  }

  const { master, nodes: masterNodes } = createMaster(ctx)
  const nodes: AudioNode[] = [...masterNodes]
  let cursor = ctx.currentTime + 0.02

  for (const step of steps) {
    const hz = Number.isFinite(step.frequency) ? Math.max(20, Math.min(step.frequency, 20000)) : 440
    const dur = Math.max(0.03, step.duration)
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = step.type ?? 'sine'
    osc.frequency.setValueAtTime(hz, cursor)
    if (step.slideTo != null && Number.isFinite(step.slideTo)) {
      osc.frequency.linearRampToValueAtTime(
        Math.max(20, Math.min(step.slideTo, 20000)),
        cursor + dur,
      )
    }

    const peak = loudPeak(step.gain)
    gain.gain.setValueAtTime(0.0001, cursor)
    gain.gain.exponentialRampToValueAtTime(peak, cursor + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, cursor + dur)

    osc.connect(gain)
    gain.connect(master)
    osc.start(cursor)
    osc.stop(cursor + dur + 0.02)
    nodes.push(osc, gain)
    cursor += dur + gap
  }

  const durationMs = Math.ceil((cursor - ctx.currentTime) * 1000) + 80
  return { stop: scheduleStop(nodes, durationMs), durationMs }
}

/** Pulsed noise (hiss envelopes) spanning the target cue length. */
function pulsedNoise(
  ctx: AudioContext,
  totalSec = CUE_TARGET_SEC,
  burstSec = 0.45,
  gapSec = 0.28,
  gainLevel = 0.55,
  centerHz = 1800,
): { stop: StopHandle; durationMs: number } {
  const { master, nodes: masterNodes } = createMaster(ctx)
  const nodes: AudioNode[] = [...masterNodes]
  const start = ctx.currentTime + 0.02
  let cursor = start
  const end = start + totalSec
  const peak = loudPeak(gainLevel / GAIN_SCALE)

  while (cursor < end - 0.04) {
    const remaining = end - cursor
    const dur = Math.min(burstSec, remaining)
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * dur))
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = Math.random() * 2 - 1
    }
    const source = ctx.createBufferSource()
    source.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = centerHz
    filter.Q.value = 0.7
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, cursor)
    gain.gain.exponentialRampToValueAtTime(peak, cursor + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, cursor + dur)
    source.connect(filter)
    filter.connect(gain)
    gain.connect(master)
    source.start(cursor)
    source.stop(cursor + dur + 0.02)
    nodes.push(source, filter, gain)
    if (cursor + dur >= end - 0.04) {
      cursor = cursor + dur
      break
    }
    cursor += dur + gapSec
  }

  const durationMs = Math.ceil((Math.max(cursor, end) - ctx.currentTime) * 1000) + 40
  return { stop: scheduleStop(nodes, durationMs), durationMs }
}

function warble(
  ctx: AudioContext,
  low: number,
  high: number,
  duration: number,
): { stop: StopHandle; durationMs: number } {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const { master, nodes: masterNodes } = createMaster(ctx)
  const now = ctx.currentTime
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(low, now)
  const steps = Math.max(8, Math.round(duration * 4))
  for (let i = 1; i <= steps; i += 1) {
    const t = now + (duration * i) / steps
    osc.frequency.linearRampToValueAtTime(i % 2 === 0 ? low : high, t)
  }
  const peak = loudPeak(0.18)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(peak, now + 0.03)
  // Soft breathe so a 7s sustain stays audible without flat clipping feel.
  const mid = now + duration * 0.5
  gain.gain.exponentialRampToValueAtTime(peak * 0.85, mid)
  gain.gain.exponentialRampToValueAtTime(peak, now + duration * 0.85)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  osc.connect(gain)
  gain.connect(master)
  osc.start(now)
  osc.stop(now + duration + 0.02)
  const durationMs = Math.ceil(duration * 1000) + 60
  return { stop: scheduleStop([osc, gain, ...masterNodes], durationMs), durationMs }
}

type Plan =
  | { kind: 'steps'; steps: Step[]; gap?: number }
  | { kind: 'noise-pulse' }
  | { kind: 'startle' }
  | { kind: 'warble' }
  | { kind: 'horn' }

function tonePlan(kind: ToneKind): Plan {
  switch (kind) {
    case 'kitten-call':
      // Catalog: kitten isolation mew F0 ~1000–2500 Hz
      return {
        kind: 'steps',
        steps: loopMotif(
          [
            { frequency: 1400, duration: 0.28, type: 'triangle', gain: 0.18, slideTo: 1900 },
            { frequency: 1200, duration: 0.3, type: 'triangle', gain: 0.17, slideTo: 1700 },
            { frequency: 1600, duration: 0.26, type: 'triangle', gain: 0.16, slideTo: 1100 },
          ],
          CUE_TARGET_SEC,
          0.05,
          0.28,
        ),
      }
    case 'soft-kitten':
      return {
        kind: 'steps',
        steps: loopMotif(
          [
            { frequency: 1100, duration: 0.32, type: 'sine', gain: 0.14, slideTo: 1300 },
            { frequency: 1000, duration: 0.34, type: 'sine', gain: 0.13, slideTo: 1200 },
          ],
          CUE_TARGET_SEC,
          0.06,
          0.32,
        ),
      }
    case 'prey-chirp':
      // Prey-like broadband midrange (synth stand-in)
      return {
        kind: 'steps',
        steps: loopMotif(
          [
            { frequency: 3200, duration: 0.07, type: 'square', gain: 0.12 },
            { frequency: 2800, duration: 0.07, type: 'square', gain: 0.11 },
            { frequency: 3400, duration: 0.07, type: 'square', gain: 0.12 },
            { frequency: 2600, duration: 0.08, type: 'square', gain: 0.1 },
            { frequency: 3000, duration: 0.07, type: 'square', gain: 0.11 },
          ],
          CUE_TARGET_SEC,
          0.035,
          0.2,
        ),
      }
    case 'mouse-squeak':
      return {
        kind: 'steps',
        steps: loopMotif(
          [
            { frequency: 4200, duration: 0.1, type: 'sine', gain: 0.14, slideTo: 5100 },
            { frequency: 3900, duration: 0.09, type: 'sine', gain: 0.13, slideTo: 4600 },
            { frequency: 4500, duration: 0.11, type: 'sine', gain: 0.12, slideTo: 3800 },
          ],
          CUE_TARGET_SEC,
          0.05,
          0.24,
        ),
      }
    case 'food-cue':
      return {
        kind: 'steps',
        steps: loopMotif(
          [
            { frequency: 440, duration: 0.12, type: 'sawtooth', gain: 0.14 },
            { frequency: 520, duration: 0.12, type: 'sawtooth', gain: 0.13 },
            { frequency: 390, duration: 0.16, type: 'sawtooth', gain: 0.12 },
            { frequency: 610, duration: 0.14, type: 'triangle', gain: 0.15 },
          ],
          CUE_TARGET_SEC,
          0.05,
          0.3,
        ),
      }
    case 'kibble-shake':
      return {
        kind: 'steps',
        steps: loopMotif(
          [
            { frequency: 1800, duration: 0.05, type: 'sawtooth', gain: 0.1 },
            { frequency: 2400, duration: 0.05, type: 'sawtooth', gain: 0.09 },
            { frequency: 1600, duration: 0.06, type: 'sawtooth', gain: 0.1 },
            { frequency: 2200, duration: 0.05, type: 'triangle', gain: 0.09 },
            { frequency: 2800, duration: 0.06, type: 'sawtooth', gain: 0.09 },
            { frequency: 2000, duration: 0.05, type: 'sawtooth', gain: 0.08 },
          ],
          CUE_TARGET_SEC,
          0.03,
          0.18,
        ),
      }
    case 'pspsps':
      return {
        kind: 'steps',
        steps: loopMotif(
          [
            { frequency: 2600, duration: 0.06, type: 'square', gain: 0.1 },
            { frequency: 3100, duration: 0.06, type: 'square', gain: 0.1 },
            { frequency: 2800, duration: 0.06, type: 'square', gain: 0.1 },
            { frequency: 3300, duration: 0.07, type: 'square', gain: 0.09 },
            { frequency: 2900, duration: 0.06, type: 'square', gain: 0.08 },
          ],
          CUE_TARGET_SEC,
          0.035,
          0.22,
        ),
      }
    case 'cat-trill':
      // Friendly greeting ~500–900 Hz
      return {
        kind: 'steps',
        steps: loopMotif(
          [
            { frequency: 620, duration: 0.14, type: 'triangle', gain: 0.14, slideTo: 780 },
            { frequency: 700, duration: 0.14, type: 'triangle', gain: 0.13, slideTo: 860 },
            { frequency: 640, duration: 0.16, type: 'triangle', gain: 0.12, slideTo: 720 },
          ],
          CUE_TARGET_SEC,
          0.05,
          0.26,
        ),
      }
    case 'cat-mid-beep':
      // Catalog: ~13 kHz investigate beep — sustain / soft pulse
      return {
        kind: 'steps',
        gap: 0.12,
        steps: loopMotif(
          [{ frequency: 13000, duration: 0.55, type: 'sine', gain: 0.1 }],
          CUE_TARGET_SEC,
          0.12,
          0.2,
        ),
      }
    case 'tom-growl':
      return {
        kind: 'steps',
        steps: loopMotif(
          [
            { frequency: 110, duration: 0.55, type: 'sawtooth', gain: 0.2, slideTo: 85 },
            { frequency: 95, duration: 0.6, type: 'sawtooth', gain: 0.18, slideTo: 70 },
          ],
          CUE_TARGET_SEC,
          0.08,
          0.35,
        ),
      }
    case 'hiss-burst':
      return { kind: 'noise-pulse' }
    case 'dog-bark-cue':
      return {
        kind: 'steps',
        steps: loopMotif(
          [
            { frequency: 280, duration: 0.12, type: 'sawtooth', gain: 0.2 },
            { frequency: 190, duration: 0.14, type: 'sawtooth', gain: 0.18 },
            { frequency: 320, duration: 0.12, type: 'square', gain: 0.16 },
            { frequency: 210, duration: 0.16, type: 'sawtooth', gain: 0.17 },
          ],
          CUE_TARGET_SEC,
          0.06,
          0.28,
        ),
      }
    case 'human-hey':
      // Catalog: speech band ~300–4000 Hz — include mid speech energy, not only low F0
      return {
        kind: 'steps',
        steps: loopMotif(
          [
            { frequency: 320, duration: 0.14, type: 'sawtooth', gain: 0.17 },
            { frequency: 480, duration: 0.16, type: 'sawtooth', gain: 0.18 },
            { frequency: 720, duration: 0.14, type: 'triangle', gain: 0.14 },
            { frequency: 1100, duration: 0.18, type: 'sawtooth', gain: 0.15 },
            { frequency: 260, duration: 0.16, type: 'square', gain: 0.16 },
          ],
          CUE_TARGET_SEC,
          0.05,
          0.3,
        ),
      }
    case 'ultrasonic-try':
      // Phone stand-in for >20 kHz claims — audible high band 9–12 kHz
      return {
        kind: 'steps',
        gap: 0.08,
        steps: sustainSteps(
          [
            { frequency: 9000, duration: 2.2, type: 'sine', gain: 0.1 },
            { frequency: 10500, duration: 2.2, type: 'sine', gain: 0.09 },
            { frequency: 12000, duration: 2.4, type: 'sine', gain: 0.08 },
          ],
          CUE_TARGET_SEC,
        ),
      }
    case 'puppy-distress':
      // Catalog: ~950 Hz F0
      return {
        kind: 'steps',
        steps: loopMotif(
          [
            { frequency: 950, duration: 0.28, type: 'triangle', gain: 0.18, slideTo: 1100 },
            { frequency: 900, duration: 0.3, type: 'triangle', gain: 0.16, slideTo: 1050 },
            { frequency: 980, duration: 0.26, type: 'triangle', gain: 0.15, slideTo: 860 },
          ],
          CUE_TARGET_SEC,
          0.06,
          0.3,
        ),
      }
    case 'attention-whistle':
      // Catalog: audible training whistle ~5–16 kHz
      return {
        kind: 'steps',
        gap: 0.1,
        steps: loopMotif(
          [
            { frequency: 7000, duration: 0.35, type: 'sine', gain: 0.15, slideTo: 9000 },
            { frequency: 8500, duration: 0.32, type: 'sine', gain: 0.13, slideTo: 6500 },
            { frequency: 12000, duration: 0.28, type: 'sine', gain: 0.11, slideTo: 10000 },
          ],
          CUE_TARGET_SEC,
          0.1,
          0.28,
        ),
      }
    case 'squeaky-toy':
      return {
        kind: 'steps',
        steps: loopMotif(
          [
            { frequency: 2100, duration: 0.11, type: 'square', gain: 0.14, slideTo: 2800 },
            { frequency: 2400, duration: 0.1, type: 'square', gain: 0.13, slideTo: 1900 },
            { frequency: 2600, duration: 0.12, type: 'square', gain: 0.14, slideTo: 3200 },
          ],
          CUE_TARGET_SEC,
          0.05,
          0.22,
        ),
      }
    case 'treat-bag':
      return {
        kind: 'steps',
        steps: loopMotif(
          [
            { frequency: 1800, duration: 0.06, type: 'sawtooth', gain: 0.1 },
            { frequency: 2400, duration: 0.06, type: 'sawtooth', gain: 0.09 },
            { frequency: 1600, duration: 0.07, type: 'sawtooth', gain: 0.1 },
            { frequency: 2200, duration: 0.06, type: 'triangle', gain: 0.09 },
            { frequency: 2800, duration: 0.07, type: 'sawtooth', gain: 0.08 },
          ],
          CUE_TARGET_SEC,
          0.03,
          0.18,
        ),
      }
    case 'click-tsk':
      return {
        kind: 'steps',
        steps: loopMotif(
          [
            { frequency: 2800, duration: 0.05, type: 'square', gain: 0.14 },
            { frequency: 3200, duration: 0.05, type: 'square', gain: 0.12 },
            { frequency: 2400, duration: 0.06, type: 'square', gain: 0.11 },
          ],
          CUE_TARGET_SEC,
          0.04,
          0.2,
        ),
      }
    case 'pack-howl':
      return {
        kind: 'steps',
        gap: 0.12,
        steps: loopMotif(
          [
            { frequency: 360, duration: 0.85, type: 'sine', gain: 0.16, slideTo: 520 },
            { frequency: 480, duration: 0.9, type: 'sine', gain: 0.14, slideTo: 320 },
          ],
          CUE_TARGET_SEC,
          0.12,
          0.35,
        ),
      }
    case 'bark-interrupt':
      return {
        kind: 'steps',
        gap: 0.1,
        steps: loopMotif(
          [
            { frequency: 8500, duration: 0.28, type: 'sine', gain: 0.12 },
            { frequency: 9200, duration: 0.28, type: 'sine', gain: 0.11 },
            { frequency: 7800, duration: 0.32, type: 'sine', gain: 0.1 },
          ],
          CUE_TARGET_SEC,
          0.1,
          0.25,
        ),
      }
    case 'loud-startle':
      return { kind: 'startle' }
    case 'deter-burst':
      return {
        kind: 'steps',
        steps: loopMotif(
          [
            { frequency: 220, duration: 0.14, type: 'square', gain: 0.22 },
            { frequency: 180, duration: 0.16, type: 'square', gain: 0.2 },
            { frequency: 260, duration: 0.14, type: 'square', gain: 0.18 },
          ],
          CUE_TARGET_SEC,
          0.06,
          0.28,
        ),
      }
    case 'human-voice-burst':
      // Trail announce — speech band energy
      return {
        kind: 'steps',
        steps: loopMotif(
          [
            { frequency: 280, duration: 0.16, type: 'sawtooth', gain: 0.16 },
            { frequency: 420, duration: 0.2, type: 'sawtooth', gain: 0.18 },
            { frequency: 680, duration: 0.18, type: 'triangle', gain: 0.14 },
            { frequency: 900, duration: 0.18, type: 'sawtooth', gain: 0.15 },
          ],
          CUE_TARGET_SEC,
          0.06,
          0.32,
        ),
      }
    case 'aggressive-yell':
      return {
        kind: 'steps',
        steps: loopMotif(
          [
            { frequency: 360, duration: 0.16, type: 'sawtooth', gain: 0.2 },
            { frequency: 520, duration: 0.22, type: 'sawtooth', gain: 0.22 },
            { frequency: 780, duration: 0.18, type: 'square', gain: 0.18 },
            { frequency: 440, duration: 0.2, type: 'sawtooth', gain: 0.2 },
            { frequency: 1100, duration: 0.16, type: 'triangle', gain: 0.14 },
          ],
          CUE_TARGET_SEC,
          0.05,
          0.28,
        ),
      }
    case 'air-horn':
      return { kind: 'horn' }
    case 'warble-siren':
      return { kind: 'warble' }
    case 'metal-clang':
    case 'tanging-clang':
      return {
        kind: 'steps',
        steps: loopMotif(
          [
            { frequency: 880, duration: 0.14, type: 'square', gain: 0.16 },
            { frequency: 1320, duration: 0.16, type: 'triangle', gain: 0.14 },
            { frequency: 760, duration: 0.14, type: 'square', gain: 0.15 },
            { frequency: 1480, duration: 0.18, type: 'triangle', gain: 0.13 },
          ],
          CUE_TARGET_SEC,
          0.06,
          0.3,
        ),
      }
    case 'mosquito-wbf':
      // Catalog: female WBF ~400–700, peak ~500–575 (Ae. aegypti ~526 Hz)
      return {
        kind: 'steps',
        gap: 0.02,
        steps: sustainSteps(
          [
            { frequency: 526, duration: 3.4, type: 'sine', gain: 0.14 },
            { frequency: 549, duration: 3.4, type: 'sine', gain: 0.12 },
          ],
          CUE_TARGET_SEC,
        ),
      }
    case 'mosquito-15k':
      return {
        kind: 'steps',
        gap: 0.02,
        steps: [{ frequency: 15000, duration: CUE_TARGET_SEC, type: 'sine', gain: 0.1 }],
      }
    case 'hive-hum':
      // Educational hive atmosphere ~250–320 Hz (separate from stop-signal)
      return {
        kind: 'steps',
        gap: 0.02,
        steps: sustainSteps(
          [
            { frequency: 270, duration: 2.4, type: 'sine', gain: 0.13 },
            { frequency: 300, duration: 2.4, type: 'triangle', gain: 0.12 },
            { frequency: 250, duration: 2.2, type: 'sine', gain: 0.12 },
          ],
          CUE_TARGET_SEC,
        ),
      }
    case 'stop-signal-edu':
      // Biology: ~100–150 ms pulses at 300–400 Hz (A. mellifera) — repeat over ~7s
      return {
        kind: 'steps',
        gap: 0.18,
        steps: loopMotif(
          [
            { frequency: 340, duration: 0.13, type: 'sine', gain: 0.14 },
            { frequency: 380, duration: 0.12, type: 'triangle', gain: 0.12 },
            { frequency: 320, duration: 0.14, type: 'sine', gain: 0.13 },
          ],
          CUE_TARGET_SEC,
          0.18,
          0.35,
        ),
      }
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
}

function playHorn(ctx: AudioContext): { stop: StopHandle; durationMs: number } {
  return playSequence(
    ctx,
    sustainSteps(
      [
        { frequency: 410, duration: 3.4, type: 'sawtooth', gain: 0.22 },
        { frequency: 430, duration: 3.4, type: 'sawtooth', gain: 0.2 },
      ],
      CUE_TARGET_SEC,
    ),
    0.02,
  )
}

function playStartle(ctx: AudioContext): { stop: StopHandle; durationMs: number } {
  // Repeat startle sweeps across the cue window (not a single blip).
  return playSequence(
    ctx,
    loopMotif(
      [
        { frequency: 180, duration: 0.18, type: 'sawtooth', gain: 0.22, slideTo: 1400 },
        { frequency: 900, duration: 0.16, type: 'square', gain: 0.18, slideTo: 220 },
        { frequency: 420, duration: 0.14, type: 'sawtooth', gain: 0.16, slideTo: 1800 },
      ],
      CUE_TARGET_SEC,
      0.04,
      0.45,
    ),
    0.04,
  )
}

type PlayResult =
  | { ok: true; durationMs: number; looping?: boolean }
  | { ok: false; reason: 'blocked' | 'error'; message: string }

async function startCue(kind: ToneKind): Promise<PlayResult> {
  try {
    const ctx = getContext()
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
    if (ctx.state !== 'running') {
      unlocked = false
      return {
        ok: false,
        reason: 'blocked',
        message: 'Audio is blocked. Tap Enable sound, then try again.',
      }
    }
    unlocked = true

    if (activeStop) {
      activeStop()
      activeStop = null
    }

    const plan = tonePlan(kind)
    let result: { stop: StopHandle; durationMs: number }
    switch (plan.kind) {
      case 'noise-pulse':
        result = pulsedNoise(ctx, CUE_TARGET_SEC, 0.5, 0.28, 0.55, 1800)
        break
      case 'startle':
        result = playStartle(ctx)
        break
      case 'warble':
        result = warble(ctx, 600, 1200, CUE_TARGET_SEC)
        break
      case 'horn':
        result = playHorn(ctx)
        break
      case 'steps':
        result = playSequence(ctx, plan.steps, plan.gap ?? 0.04)
        break
      default: {
        const _exhaustive: never = plan
        return _exhaustive
      }
    }

    if (!result.durationMs || result.durationMs < 30) {
      return {
        ok: false,
        reason: 'error',
        message: 'Cue ended immediately — nothing audible was scheduled.',
      }
    }

    activeStop = result.stop
    return { ok: true, durationMs: result.durationMs }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not start audio playback.'
    return { ok: false, reason: 'error', message }
  }
}

/** One press → one ~7s cue. */
export async function playTone(kind: ToneKind): Promise<PlayResult> {
  stopPlayback()
  return startCue(kind)
}

/**
 * Repeat the same ~7s cue until `loopForMs` elapses (default 5 minutes) or Stop.
 * Returns total scheduled loop window so the UI can clear when it ends.
 */
export async function loopTone(
  kind: ToneKind,
  loopForMs: number = DEFAULT_LOOP_MS,
): Promise<PlayResult> {
  stopPlayback()
  const generation = playbackGeneration
  const deadline = Date.now() + Math.max(1_000, loopForMs)
  const windowMs = Math.max(1_000, loopForMs)

  const first = await startCue(kind)
  if (!first.ok) return first
  if (generation !== playbackGeneration) {
    return { ok: false, reason: 'error', message: 'Playback stopped.' }
  }

  while (generation === playbackGeneration && Date.now() + 400 < deadline) {
    const remaining = deadline - Date.now()
    const wait = Math.min(first.durationMs, Math.max(0, remaining))
    await sleepMs(wait, generation)
    if (generation !== playbackGeneration) break
    if (Date.now() + 200 >= deadline) break

    const next = await startCue(kind)
    if (generation !== playbackGeneration) break
    if (!next.ok) return next
  }

  return { ok: true, durationMs: windowMs, looping: true }
}

/** Approximate scheduled length for a cue (no AudioContext required) — used by audits/tests. */
export function estimateCueDurationMs(kind: ToneKind): number {
  const plan = tonePlan(kind)
  switch (plan.kind) {
    case 'noise-pulse':
      return Math.ceil(CUE_TARGET_SEC * 1000) + 80
    case 'warble':
      return Math.ceil(CUE_TARGET_SEC * 1000) + 60
    case 'horn': {
      const steps = sustainSteps(
        [
          { frequency: 410, duration: 3.4, type: 'sawtooth', gain: 0.22 },
          { frequency: 430, duration: 3.4, type: 'sawtooth', gain: 0.2 },
        ],
        CUE_TARGET_SEC,
      )
      return Math.ceil(motifLengthSec(steps, 0.02) * 1000) + 80
    }
    case 'startle': {
      const steps = loopMotif(
        [
          { frequency: 180, duration: 0.18, type: 'sawtooth', gain: 0.22, slideTo: 1400 },
          { frequency: 900, duration: 0.16, type: 'square', gain: 0.18, slideTo: 220 },
          { frequency: 420, duration: 0.14, type: 'sawtooth', gain: 0.16, slideTo: 1800 },
        ],
        CUE_TARGET_SEC,
        0.04,
        0.45,
      )
      return Math.ceil(motifLengthSec(steps, 0.04) * 1000) + 80
    }
    case 'steps':
      return Math.ceil(motifLengthSec(plan.steps, plan.gap ?? 0.04) * 1000) + 80
    default: {
      const _exhaustive: never = plan
      return _exhaustive
    }
  }
}
