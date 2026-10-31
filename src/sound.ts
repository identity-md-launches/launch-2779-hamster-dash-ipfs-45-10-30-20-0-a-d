/** Optional, short synthesized effects. No audio files, requests or background music. */
export class Sound {
  private context: AudioContext | undefined;
  enabled = false;
  async toggle() {
    if (this.enabled) { this.enabled = false; return true; }
    try {
      this.context ??= new AudioContext();
      await this.context.resume();
      this.enabled = true; this.play('seed'); return true;
    } catch { this.enabled = false; return false; }
  }
  unlock() { if (this.enabled) void this.context?.resume().catch(() => {}); }
  play(kind: 'seed' | 'battery' | 'rock' | 'finish') {
    if (!this.enabled || !this.context || this.context.state !== 'running') return;
    const context = this.context;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    oscillator.type = kind === 'rock' ? 'triangle' : 'sine';
    const frequency = { seed: 660, battery: 880, rock: 140, finish: 1046 }[kind];
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * (kind === 'rock' ? 0.5 : 1.5), now + 0.12);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.075, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.17);
    oscillator.connect(gain); gain.connect(context.destination);
    oscillator.start(now); oscillator.stop(now + 0.18);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
}
