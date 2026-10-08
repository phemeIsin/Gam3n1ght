// Gam3n1ght Sound FX Engine using Web Audio API
// 100% client-side, zero external audio files, low-latency and works offline.

class SoundEngine {
  private ctx: AudioContext | null = null
  private enabled: boolean = true

  constructor() {
    try {
      const stored = localStorage.getItem('game-night-sound-enabled')
      if (stored !== null) {
        this.enabled = stored === 'true'
      }
    } catch {
      this.enabled = true
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume()
    }
    return this.ctx
  }

  public isEnabled(): boolean {
    return this.enabled
  }

  public toggle(): boolean {
    this.enabled = !this.enabled
    try {
      localStorage.setItem('game-night-sound-enabled', String(this.enabled))
    } catch {}
    if (this.enabled) {
      this.playTap()
    }
    return this.enabled
  }

  public setEnabled(val: boolean) {
    this.enabled = val
    try {
      localStorage.setItem('game-night-sound-enabled', String(this.enabled))
    } catch {}
  }

  // Quick tactile UI click
  public playTap() {
    if (!this.enabled) return
    const ctx = this.initCtx()
    if (!ctx) return
    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      const now = ctx.currentTime
      osc.frequency.setValueAtTime(800, now)
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04)
      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.04)
    } catch {}
  }

  // Cheerful chime when joining room or player joins
  public playJoin() {
    if (!this.enabled) return
    const ctx = this.initCtx()
    if (!ctx) return
    try {
      const notes = [523.25, 659.25, 783.99] // C5, E5, G5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        const start = ctx.currentTime + i * 0.07
        osc.frequency.setValueAtTime(freq, start)
        gain.gain.setValueAtTime(0.15, start)
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(start)
        osc.stop(start + 0.18)
      })
    } catch {}
  }

  // Score point awarded chime
  public playScore() {
    if (!this.enabled) return
    const ctx = this.initCtx()
    if (!ctx) return
    try {
      const notes = [659.25, 880] // E5, A5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        const start = ctx.currentTime + i * 0.08
        osc.frequency.setValueAtTime(freq, start)
        gain.gain.setValueAtTime(0.18, start)
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(start)
        osc.stop(start + 0.22)
      })
    } catch {}
  }

  // Timer countdown woodblock tick
  public playTick() {
    if (!this.enabled) return
    const ctx = this.initCtx()
    if (!ctx) return
    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      const now = ctx.currentTime
      osc.frequency.setValueAtTime(950, now)
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.03)
      gain.gain.setValueAtTime(0.1, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.03)
    } catch {}
  }

  // Buzzer when timer expires
  public playBuzzer() {
    if (!this.enabled) return
    const ctx = this.initCtx()
    if (!ctx) return
    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      const now = ctx.currentTime
      osc.frequency.setValueAtTime(200, now)
      osc.frequency.linearRampToValueAtTime(140, now + 0.35)
      gain.gain.setValueAtTime(0.18, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.35)
    } catch {}
  }

  // Victory fanfare when a game is won
  public playFanfare() {
    if (!this.enabled) return
    const ctx = this.initCtx()
    if (!ctx) return
    try {
      const chords = [
        { f: 523.25, t: 0 },
        { f: 659.25, t: 0.1 },
        { f: 783.99, t: 0.2 },
        { f: 1046.5, t: 0.35 }
      ]
      chords.forEach(({ f, t }) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        const start = ctx.currentTime + t
        osc.frequency.setValueAtTime(f, start)
        gain.gain.setValueAtTime(0.2, start)
        gain.gain.exponentialRampToValueAtTime(0.001, start + (t === 0.35 ? 0.6 : 0.25))
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(start)
        osc.stop(start + (t === 0.35 ? 0.6 : 0.25))
      })
    } catch {}
  }

  // Reaction pop sound
  public playReaction() {
    if (!this.enabled) return
    const ctx = this.initCtx()
    if (!ctx) return
    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      const now = ctx.currentTime
      osc.frequency.setValueAtTime(440, now)
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08)
      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.08)
    } catch {}
  }
}

export const sound = new SoundEngine()
