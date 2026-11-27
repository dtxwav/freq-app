/** Coarse on-device cat call-type tagging via Web Audio heuristics — not translation. */

export type CatCallType =
  | 'meow'
  | 'purr'
  | 'hiss'
  | 'trill'
  | 'chirp'
  | 'growl'
  | 'unclear'

export type CatListenError =
  | 'permission-denied'
  | 'no-mic'
  | 'unsupported'
  | 'failed'

export type CatCallTagResult = {
  type: CatCallType
  /** 0–1 heuristic score; treat as a rough acoustic guess, not model accuracy. */
  confidence: number
  /** Plain ethogram-style gloss — never an English “translation.” */
  explanation: string
  /** Dominant pitch estimate in Hz when voiced; null when noisy/unclear. */
  pitchHz: number | null
  /** Seconds of audio analyzed. */
  durationSec: number
}

export type CatCallListenOutcome =
  | { status: 'ok'; result: CatCallTagResult }
  | { status: 'no-sound'; result: CatCallTagResult }
  | { status: 'error'; error: CatListenError; message: string }

type FrameFeatures = {
  rms: number
  zcr: number
  spectralCentroid: number
  highBandRatio: number
  harmonicity: number
  pitchHz: number | null
  /** Energy in ~15–40 Hz AM band (purr modulation proxy). */
  amEnergy: number
}

const SAMPLE_RATE_TARGET = 44100
const FFT_SIZE = 2048
const LISTEN_MS_DEFAULT = 2800
const SILENCE_RMS = 0.012
const WEAK_RMS = 0.022

/** Ethogram-aligned glosses (call type, not English “translation”). */
const EXPLANATIONS: Record<CatCallType, string> = {
  purr: 'Likely purr — low continuous contact / contentment signal. Body language still decides mood.',
  meow: 'Likely meow — human-directed attention getter. Not a shared word like “Feed me!”',
  hiss: 'Likely hiss — defensive / threat display (ethogram). Give space; not play.',
  growl: 'Likely growl — low agonistic warning. Back off and watch posture.',
  trill: 'Likely trill / chirrup — friendly greeting or “follow me” in many cats.',
  chirp: 'Likely chirp / chatter — hunting interest or frustration at prey (window birds).',
  unclear:
    'Unclear — no confident call type. Try closer, quieter room, or read body language.',
}

/** One-line ethogram legend for UI chips. */
export const ETHOGRAM_GLOSS: Record<Exclude<CatCallType, 'unclear'>, string> = {
  meow: 'attention call',
  purr: 'contact / calm',
  hiss: 'threat display',
  trill: 'greeting',
  chirp: 'hunt chatter',
  growl: 'warning',
}

export function explanationFor(type: CatCallType): string {
  return EXPLANATIONS[type]
}

export const HONESTY_DISCLOSURE =
  'Not a translator. This is an on-device acoustic guess from pitch, noise, and continuity — not English meaning, not medical advice. Body language and situation matter more than the tag.'

let activeStop: (() => void) | null = null

export function stopCatListen(): void {
  if (activeStop) {
    activeStop()
    activeStop = null
  }
}

/**
 * Listen on the mic for ~listenMs and return a coarse call-type tag.
 * Prefer calling after a user gesture. Stops any previous listen session.
 */
export async function listenAndTagCatCall(
  listenMs: number = LISTEN_MS_DEFAULT,
): Promise<CatCallListenOutcome> {
  stopCatListen()

  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return {
      status: 'error',
      error: 'unsupported',
      message: 'This browser cannot access a microphone for listening.',
    }
  }

  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: false,
        autoGainControl: true,
      },
      video: false,
    })
  } catch (err) {
    const name = err instanceof DOMException ? err.name : ''
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      return {
        status: 'error',
        error: 'permission-denied',
        message: 'Microphone permission denied. Allow mic access to tag a call type.',
      }
    }
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      return {
        status: 'error',
        error: 'no-mic',
        message: 'No microphone found on this device.',
      }
    }
    return {
      status: 'error',
      error: 'failed',
      message: 'Could not open the microphone. Try again.',
    }
  }

  const Ctx =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) {
    stream.getTracks().forEach((t) => t.stop())
    return {
      status: 'error',
      error: 'unsupported',
      message: 'Web Audio is unavailable in this browser.',
    }
  }

  const ctx = new Ctx({ sampleRate: SAMPLE_RATE_TARGET })
  try {
    if (ctx.state === 'suspended') await ctx.resume()
  } catch {
    /* continue; frames may still arrive after resume */
  }

  const source = ctx.createMediaStreamSource(stream)
  const analyser = ctx.createAnalyser()
  analyser.fftSize = FFT_SIZE
  analyser.smoothingTimeConstant = 0.35
  source.connect(analyser)

  const timeBuf = new Float32Array(analyser.fftSize)
  const freqBuf = new Float32Array(analyser.frequencyBinCount)
  const frames: FrameFeatures[] = []
  let stopped = false
  let settle: (() => void) | null = null

  const cleanup = () => {
    if (stopped) return
    stopped = true
    window.clearInterval(intervalId)
    window.clearTimeout(timeoutId)
    try {
      source.disconnect()
    } catch {
      /* ignore */
    }
    stream.getTracks().forEach((t) => t.stop())
    void ctx.close()
    if (activeStop === cleanup) activeStop = null
    settle?.()
    settle = null
  }
  activeStop = cleanup

  const intervalId = window.setInterval(() => {
    if (stopped) return
    analyser.getFloatTimeDomainData(timeBuf)
    analyser.getFloatFrequencyData(freqBuf)
    frames.push(extractFeatures(timeBuf, freqBuf, ctx.sampleRate))
  }, 40)

  const timeoutId = window.setTimeout(() => {
    cleanup()
  }, listenMs)

  await new Promise<void>((resolve) => {
    settle = resolve
  })

  if (frames.length < 8) {
    const unclear = makeResult('unclear', 0.2, null, listenMs / 1000)
    return { status: 'no-sound', result: unclear }
  }

  return classifyFrames(frames, listenMs / 1000)
}

function extractFeatures(
  time: Float32Array,
  freqDb: Float32Array,
  sampleRate: number,
): FrameFeatures {
  let sumSq = 0
  let zc = 0
  let prev = time[0] ?? 0
  for (let i = 0; i < time.length; i++) {
    const s = time[i] ?? 0
    sumSq += s * s
    if ((prev >= 0 && s < 0) || (prev < 0 && s >= 0)) zc += 1
    prev = s
  }
  const rms = Math.sqrt(sumSq / time.length)
  const zcr = zc / time.length

  const binHz = sampleRate / (2 * freqDb.length)
  let weighted = 0
  let magSum = 0
  let high = 0
  let lowMid = 0
  const mags = new Float32Array(freqDb.length)
  for (let i = 0; i < freqDb.length; i++) {
    const db = freqDb[i] ?? -100
    const lin = Math.pow(10, db / 20)
    mags[i] = lin
    const hz = i * binHz
    weighted += lin * hz
    magSum += lin
    if (hz >= 2500) high += lin
    if (hz >= 80 && hz <= 2000) lowMid += lin
  }
  const spectralCentroid = magSum > 1e-9 ? weighted / magSum : 0
  const highBandRatio = magSum > 1e-9 ? high / magSum : 0

  // Peak vs neighborhood as a crude harmonicity proxy.
  let peak = 0
  let peakIdx = 0
  for (let i = 2; i < mags.length - 2; i++) {
    const v = mags[i] ?? 0
    if (v > peak) {
      peak = v
      peakIdx = i
    }
  }
  let neigh = 0
  const n0 = Math.max(2, peakIdx - 6)
  const n1 = Math.min(mags.length - 1, peakIdx + 6)
  for (let i = n0; i <= n1; i++) {
    if (i === peakIdx) continue
    neigh += mags[i] ?? 0
  }
  const neighAvg = neigh / Math.max(1, n1 - n0)
  const harmonicity = peak > 1e-9 ? peak / (peak + neighAvg * 4 + 1e-9) : 0

  const pitchHz = estimatePitchAutocorr(time, sampleRate, rms)
  const amEnergy = estimateAmBandEnergy(time, sampleRate)

  return {
    rms,
    zcr,
    spectralCentroid,
    highBandRatio,
    harmonicity,
    pitchHz,
    amEnergy,
  }
}

function estimatePitchAutocorr(
  time: Float32Array,
  sampleRate: number,
  rms: number,
): number | null {
  if (rms < SILENCE_RMS * 0.8) return null

  const minF = 70
  const maxF = 1800
  const minLag = Math.floor(sampleRate / maxF)
  const maxLag = Math.min(Math.floor(sampleRate / minF), time.length - 1)

  let bestLag = -1
  let bestCorr = 0
  let energy0 = 0
  for (let i = 0; i < time.length; i++) {
    const s = time[i] ?? 0
    energy0 += s * s
  }
  if (energy0 < 1e-8) return null

  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0
    for (let i = 0; i < time.length - lag; i++) {
      corr += (time[i] ?? 0) * (time[i + lag] ?? 0)
    }
    if (corr > bestCorr) {
      bestCorr = corr
      bestLag = lag
    }
  }

  const norm = bestCorr / energy0
  if (bestLag < 0 || norm < 0.18) return null
  return sampleRate / bestLag
}

/** Rough energy of envelope modulation in the purr band (~20–30 Hz). */
function estimateAmBandEnergy(time: Float32Array, sampleRate: number): number {
  const env: number[] = []
  const win = Math.max(8, Math.floor(sampleRate / 500))
  for (let i = 0; i + win < time.length; i += win) {
    let e = 0
    for (let j = 0; j < win; j++) {
      const s = time[i + j] ?? 0
      e += s * s
    }
    env.push(Math.sqrt(e / win))
  }
  if (env.length < 8) return 0

  const mean = env.reduce((a, b) => a + b, 0) / env.length
  let ac = 0
  let energy = 0
  const envRate = sampleRate / win
  const lag = Math.max(1, Math.round(envRate / 25))
  for (let i = 0; i < env.length; i++) {
    const d = (env[i] ?? 0) - mean
    energy += d * d
    if (i + lag < env.length) {
      ac += d * ((env[i + lag] ?? 0) - mean)
    }
  }
  if (energy < 1e-10) return 0
  return Math.max(0, ac / energy)
}

function average(values: number[]): number {
  if (!values.length) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

function median(values: number[]): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
  }
  return sorted[mid] ?? null
}

function classifyFrames(frames: FrameFeatures[], durationSec: number): CatCallListenOutcome {
  const loud = frames.filter((f) => f.rms >= SILENCE_RMS)
  if (loud.length < Math.max(6, frames.length * 0.12)) {
    return {
      status: 'no-sound',
      result: makeResult('unclear', 0.25, null, durationSec),
    }
  }

  const rmsAvg = average(loud.map((f) => f.rms))
  if (rmsAvg < WEAK_RMS && loud.length < frames.length * 0.25) {
    return {
      status: 'no-sound',
      result: makeResult('unclear', 0.3, null, durationSec),
    }
  }

  const zcrAvg = average(loud.map((f) => f.zcr))
  const centroidAvg = average(loud.map((f) => f.spectralCentroid))
  const highAvg = average(loud.map((f) => f.highBandRatio))
  const harmAvg = average(loud.map((f) => f.harmonicity))
  const amAvg = average(loud.map((f) => f.amEnergy))
  const pitches = loud.map((f) => f.pitchHz).filter((p): p is number => p != null && p > 0)
  const pitch = median(pitches)
  const voicedRatio = pitches.length / loud.length
  const sustained = loud.length / frames.length

  type Score = { type: CatCallType; score: number }
  const scores: Score[] = []

  // Hiss: noisy, high ZCR, broadband highs, weak pitch.
  let hiss = 0
  if (zcrAvg > 0.12) hiss += 0.35
  if (highAvg > 0.35) hiss += 0.25
  if (harmAvg < 0.45) hiss += 0.2
  if (voicedRatio < 0.35) hiss += 0.15
  if (centroidAvg > 2200) hiss += 0.1
  scores.push({ type: 'hiss', score: hiss })

  // Purr: sustained, low pitch or strong ~25 Hz AM, moderate harmonicity.
  let purr = 0
  if (amAvg > 0.25) purr += 0.4
  if (sustained > 0.55) purr += 0.15
  if (pitch != null && pitch < 220) purr += 0.25
  if (zcrAvg < 0.1) purr += 0.1
  if (harmAvg > 0.35 && highAvg < 0.35) purr += 0.1
  scores.push({ type: 'purr', score: purr })

  // Growl: low pitch, sustained, less bright than hiss, some roughness.
  let growl = 0
  if (pitch != null && pitch >= 70 && pitch <= 320) growl += 0.35
  if (sustained > 0.45) growl += 0.15
  if (zcrAvg > 0.06 && zcrAvg < 0.16) growl += 0.15
  if (highAvg < 0.3) growl += 0.15
  if (centroidAvg < 1200) growl += 0.1
  if (amAvg < 0.2) growl += 0.05
  scores.push({ type: 'growl', score: growl })

  // Meow: clear mid pitch, harmonic, not extremely noisy.
  let meow = 0
  if (pitch != null && pitch >= 280 && pitch <= 1400) meow += 0.4
  if (harmAvg > 0.48) meow += 0.25
  if (zcrAvg < 0.11) meow += 0.15
  if (voicedRatio > 0.4) meow += 0.1
  if (sustained > 0.2 && sustained < 0.85) meow += 0.08
  scores.push({ type: 'meow', score: meow })

  // Trill: higher short-ish harmonic with some roughness / mid pitch.
  let trill = 0
  if (pitch != null && pitch >= 350 && pitch <= 1200) trill += 0.25
  if (harmAvg > 0.4 && zcrAvg > 0.05 && zcrAvg < 0.14) trill += 0.25
  if (sustained > 0.15 && sustained < 0.55) trill += 0.2
  if (centroidAvg > 900 && centroidAvg < 2800) trill += 0.15
  scores.push({ type: 'trill', score: trill })

  // Chirp: short, higher F0, more transient.
  let chirp = 0
  if (pitch != null && pitch >= 800 && pitch <= 1800) chirp += 0.35
  if (sustained < 0.4) chirp += 0.25
  if (harmAvg > 0.4) chirp += 0.15
  if (centroidAvg > 1500) chirp += 0.15
  scores.push({ type: 'chirp', score: chirp })

  scores.sort((a, b) => b.score - a.score)
  const best = scores[0] ?? { type: 'unclear' as const, score: 0 }
  const second = scores[1]?.score ?? 0
  const margin = best.score - second

  if (best.score < 0.42) {
    return {
      status: 'ok',
      result: makeResult('unclear', clamp01(0.2 + best.score * 0.4), pitch, durationSec),
    }
  }

  // Soften confidence: heuristics are coarse; never claim model-grade accuracy.
  let confidence = 0.4 + best.score * 0.35 + margin * 0.25
  if (best.type === 'purr' && amAvg > 0.35) confidence += 0.08
  if (best.type === 'hiss' && zcrAvg > 0.15 && highAvg > 0.4) confidence += 0.08
  confidence = clamp01(Math.min(confidence, 0.86))

  if (confidence < 0.48) {
    return {
      status: 'ok',
      result: makeResult('unclear', confidence, pitch, durationSec),
    }
  }

  return {
    status: 'ok',
    result: makeResult(best.type, confidence, pitch, durationSec),
  }
}

function makeResult(
  type: CatCallType,
  confidence: number,
  pitchHz: number | null,
  durationSec: number,
): CatCallTagResult {
  return {
    type,
    confidence: clamp01(confidence),
    explanation: explanationFor(type),
    pitchHz,
    durationSec,
  }
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}
