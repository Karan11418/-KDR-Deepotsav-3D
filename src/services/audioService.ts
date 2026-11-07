/**
 * Procedural Web Audio API sound generator for Diwali celebration.
 * Generates Indian festive ambient drone, bansuri flute harmonics, temple bells,
 * firework whooshes & bursts, and diya lighting chimes without any external file dependencies.
 */

class DiwaliAudioService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isMusicPlaying: boolean = false;
  private musicGainNode: GainNode | null = null;
  private musicIntervalId: number | null = null;
  private droneOscillators: OscillatorNode[] = [];
  private droneGain: GainNode | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getContextState(): string {
    return this.ctx ? this.ctx.state : 'uninitialized';
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.musicGainNode && this.ctx) {
      this.musicGainNode.gain.setValueAtTime(this.isMuted ? 0 : 0.22, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getIsMusicPlaying(): boolean {
    return this.isMusicPlaying;
  }

  /**
   * Starts ambient festive Indian drone & flute melody
   */
  public startMusic() {
    if (this.isMusicPlaying) return;
    this.initContext();
    if (!this.ctx) return;

    this.isMusicPlaying = true;
    const now = this.ctx.currentTime;

    // Master music gain
    this.musicGainNode = this.ctx.createGain();
    this.musicGainNode.gain.setValueAtTime(this.isMuted ? 0 : 0.22, now);
    this.musicGainNode.connect(this.ctx.destination);

    // Warm Indian Tanpura Drone (Sa - Pa - Sa' : C3, G3, C4)
    // Frequencies: C3 = 130.81 Hz, G3 = 196.00 Hz, C4 = 261.63 Hz
    const droneFreqs = [130.81, 196.00, 261.63];
    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0.08, now);
    this.droneGain.connect(this.musicGainNode);

    this.droneOscillators = droneFreqs.map((freq) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      // Low pass filter for warm resonant drone
      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      filter.Q.setValueAtTime(3, now);

      osc.connect(filter);
      filter.connect(this.droneGain!);
      osc.start();
      return osc;
    });

    // Indian Raga Flute (Bansuri) notes in Raag Yaman / Bhupali (D, E, G, A, B, D)
    const scale = [293.66, 329.63, 392.00, 440.00, 493.88, 587.33, 659.25];
    let noteIndex = 0;

    const playFluteNote = () => {
      if (!this.isMusicPlaying || !this.ctx || !this.musicGainNode) return;
      const t = this.ctx.currentTime;

      // Pick next meditative note
      const freq = scale[noteIndex % scale.length];
      noteIndex = (noteIndex + Math.floor(Math.random() * 3) + 1) % scale.length;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Sine wave with soft vibrato for gentle flute
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      // Subtle vibrato
      const vibrato = this.ctx.createOscillator();
      const vibratoGain = this.ctx.createGain();
      vibrato.frequency.setValueAtTime(5, t);
      vibratoGain.gain.setValueAtTime(2.5, t);
      vibrato.connect(osc.frequency);
      vibrato.start(t);
      vibrato.stop(t + 2.4);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq, t);
      filter.Q.setValueAtTime(2, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 2.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGainNode);

      osc.start(t);
      osc.stop(t + 2.3);
    };

    // Play meditative flute notes periodically
    this.musicIntervalId = window.setInterval(() => {
      if (Math.random() > 0.25) {
        playFluteNote();
      }
    }, 1800);
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicIntervalId !== null) {
      clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
    this.droneOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // already stopped
      }
    });
    this.droneOscillators = [];
    if (this.musicGainNode) {
      this.musicGainNode.disconnect();
      this.musicGainNode = null;
    }
  }

  /**
   * Sound effect: Lighting a Diya (spark + warm bell chime)
   */
  public playDiyaIgniteSound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Harmonic bell chime
    const bellOsc = this.ctx.createOscillator();
    const bellGain = this.ctx.createGain();
    bellOsc.type = 'sine';
    bellOsc.frequency.setValueAtTime(1046.5, t); // C6
    bellOsc.frequency.exponentialRampToValueAtTime(523.25, t + 0.6); // C5

    bellGain.gain.setValueAtTime(0.15, t);
    bellGain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

    bellOsc.connect(bellGain);
    bellGain.connect(this.ctx.destination);
    bellOsc.start(t);
    bellOsc.stop(t + 0.7);

    // Soft whoosh spark
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.15, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, t);
    filter.Q.setValueAtTime(4, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(t);
  }

  /**
   * Sound effect: Firework launch & explosion
   */
  public playFireworkSound(type: 'burst' | 'whistle' = 'burst') {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    if (type === 'burst') {
      // Deep resonant thump
      const boomOsc = this.ctx.createOscillator();
      const boomGain = this.ctx.createGain();
      boomOsc.type = 'triangle';
      boomOsc.frequency.setValueAtTime(140, t);
      boomOsc.frequency.exponentialRampToValueAtTime(30, t + 0.4);

      boomGain.gain.setValueAtTime(0.35, t);
      boomGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      boomOsc.connect(boomGain);
      boomGain.connect(this.ctx.destination);
      boomOsc.start(t);
      boomOsc.stop(t + 0.45);

      // Crackling sparkles
      const crackleLength = 0.5;
      const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * crackleLength), this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) {
        data[i] = (Math.random() > 0.92 ? (Math.random() * 2 - 1) : 0);
      }
      const crackle = this.ctx.createBufferSource();
      crackle.buffer = buffer;

      const crackleFilter = this.ctx.createBiquadFilter();
      crackleFilter.type = 'highpass';
      crackleFilter.frequency.setValueAtTime(2200, t);

      const crackleGain = this.ctx.createGain();
      crackleGain.gain.setValueAtTime(0.2, t + 0.05);
      crackleGain.gain.exponentialRampToValueAtTime(0.001, t + crackleLength);

      crackle.connect(crackleFilter);
      crackleFilter.connect(crackleGain);
      crackleGain.connect(this.ctx.destination);
      crackle.start(t + 0.05);
    } else {
      // Whistle whoosh sound
      const whistleOsc = this.ctx.createOscillator();
      const whistleGain = this.ctx.createGain();
      whistleOsc.type = 'sine';
      whistleOsc.frequency.setValueAtTime(400, t);
      whistleOsc.frequency.exponentialRampToValueAtTime(1600, t + 0.35);

      whistleGain.gain.setValueAtTime(0.12, t);
      whistleGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      whistleOsc.connect(whistleGain);
      whistleGain.connect(this.ctx.destination);
      whistleOsc.start(t);
      whistleOsc.stop(t + 0.35);
    }
  }

  /**
   * Sound effect: Temple Bell (Ghanti)
   */
  public playTempleBell() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const partials = [1200, 2410, 3620, 4850];
    const gains = [0.25, 0.15, 0.08, 0.04];

    partials.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      const decay = 1.2 / (idx + 1);
      gain.gain.setValueAtTime(gains[idx], t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(t);
      osc.stop(t + decay);
    });
  }

  /**
   * Sound effect: Sky lantern release (ethereal shimmer)
   */
  public playLanternRelease() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.1);

      gain.gain.setValueAtTime(0, t + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.1, t + i * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.9);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(t + i * 0.1);
      osc.stop(t + i * 0.1 + 0.9);
    });
  }
}

export const audioService = new DiwaliAudioService();
