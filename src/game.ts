export type ItemKind = 'seed' | 'battery' | 'rock';
export type GameStatus = 'ready' | 'running' | 'paused' | 'finished';
export type PauseReason = 'manual' | 'away';
export type GameEvent = { type: ItemKind | 'finish'; x: number; points: number };
export interface FallingItem { id: number; kind: ItemKind; x: number; y: number; rotation: number }
export interface Feedback { x: number; age: number; points: number }

export const ROUND_SECONDS = 45;
export const CATCH_Y = 0.82;
export const CATCH_DISTANCE = 0.09;
export const POINTS: Record<ItemKind, number> = { seed: 10, battery: 30, rock: -20 };
export const boundX = (x: number) => Math.max(0.085, Math.min(0.915, x));

/** Independent of pixels, React and refresh rate. Randomness is injectable for validation. */
export class Game {
  status: GameStatus = 'ready';
  pauseReason: PauseReason = 'manual';
  elapsed = 0;
  score = 0;
  x = 0.5;
  items: FallingItem[] = [];
  feedback: Feedback[] = [];
  caught: Record<ItemKind, number> = { seed: 0, battery: 0, rock: 0 };
  private spawnIn = 0.25;
  private nextId = 0;
  private random: () => number;

  constructor(random: () => number = Math.random) { this.random = random; }
  get remaining() { return Math.max(0, ROUND_SECONDS - this.elapsed); }
  get speed() { return 1 + this.elapsed / ROUND_SECONDS; }

  start() {
    this.status = 'running'; this.elapsed = 0; this.score = 0; this.x = 0.5;
    this.items = []; this.feedback = [];
    this.caught = { seed: 0, battery: 0, rock: 0 };
    this.spawnIn = 0.25; this.nextId = 0; this.pauseReason = 'manual';
  }
  pause(reason: PauseReason = 'manual') {
    if (this.status === 'running') { this.status = 'paused'; this.pauseReason = reason; }
  }
  resume() { if (this.status === 'paused') this.status = 'running'; }
  moveTo(x: number) { if (this.status === 'running' && Number.isFinite(x)) this.x = boundX(x); }

  tick(seconds: number, direction = 0): GameEvent[] {
    if (this.status !== 'running' || !Number.isFinite(seconds) || seconds <= 0) return [];
    // Substeps keep collisions and spawning correct even if a frame arrives late.
    let pending = Math.min(seconds, this.remaining);
    const events: GameEvent[] = [];
    while (pending > 0.000001) {
      const dt = Math.min(pending, 1 / 60);
      pending -= dt;
      this.elapsed = Math.min(ROUND_SECONDS, this.elapsed + dt);
      this.x = boundX(this.x + Math.max(-1, Math.min(1, direction)) * 0.8 * dt);
      this.spawnIn -= dt;
      if (this.spawnIn <= 0) {
        const roll = this.random();
        const kind: ItemKind = roll < 0.60 ? 'seed' : roll < 0.78 ? 'battery' : 'rock';
        this.items.push({ id: this.nextId++, kind, x: 0.08 + this.random() * 0.84, y: -0.06, rotation: (this.random() - 0.5) * 0.65 });
        this.spawnIn += 0.82 - 0.44 * (this.elapsed / ROUND_SECONDS);
      }
      this.items = this.items.filter(item => {
        const before = item.y;
        item.y += (0.22 * this.speed) * dt;
        if (before < CATCH_Y && item.y >= CATCH_Y && Math.abs(item.x - this.x) <= CATCH_DISTANCE) {
          const points = POINTS[item.kind];
          this.score = Math.max(0, this.score + points);
          this.caught[item.kind]++;
          this.feedback.push({ x: item.x, age: 0, points });
          events.push({ type: item.kind, x: item.x, points });
          return false;
        }
        return item.y < 1.1;
      });
      this.feedback = this.feedback.filter(f => { f.age += dt; return f.age < 0.65; });
    }
    if (this.remaining < 0.00001) {
      this.elapsed = ROUND_SECONDS; this.status = 'finished';
      events.push({ type: 'finish', x: this.x, points: this.score });
    }
    return events;
  }
}
