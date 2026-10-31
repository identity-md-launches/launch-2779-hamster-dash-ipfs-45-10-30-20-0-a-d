import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { Game, CATCH_Y } from '../src/game.ts';
import type { ItemKind } from '../src/game.ts';

function collision(game: Game, kind: ItemKind, x = game.x) {
  game.items = [{ id: 999, kind, x, y: CATCH_Y - .001, rotation: 0 }];
  return game.tick(.02);
}

test('seeds +10, batteries +30, rocks −20; score is clamped at zero', () => {
  const game = new Game(() => .5); game.start();
  collision(game, 'rock'); assert.equal(game.score, 0);
  collision(game, 'seed'); assert.equal(game.score, 10);
  collision(game, 'battery'); assert.equal(game.score, 40);
  collision(game, 'rock'); assert.equal(game.score, 20);
  assert.deepEqual(game.caught, { seed: 1, battery: 1, rock: 2 });
  assert.equal(game.tick(.02).length, 0, 'an already collected item cannot score twice');
});

test('items outside the hamster catch range are missed', () => {
  const game = new Game(() => .5); game.start();
  collision(game, 'seed', .9); assert.equal(game.score, 0);
  assert.equal(game.caught.seed, 0);
});

test('pause freezes time, position, falling items, score and feedback; resume continues', () => {
  const game = new Game(() => .5); game.start(); game.tick(2);
  game.pause('away'); const paused = JSON.stringify(game);
  game.tick(20, 1); game.moveTo(.9);
  assert.equal(JSON.stringify(game), paused);
  assert.equal(game.pauseReason, 'away');
  game.resume(); game.tick(1); assert.equal(game.status, 'running');
  assert.ok(Math.abs(game.elapsed - 3) < .00001);
});

test('round ends at 45 active seconds, emits finish once and stops updating', () => {
  const game = new Game(() => .5); game.start();
  let finishes = 0;
  for (let i = 0; i < 500; i++) finishes += game.tick(.1).filter(e => e.type === 'finish').length;
  assert.equal(game.status, 'finished'); assert.equal(game.elapsed, 45);
  assert.equal(game.remaining, 0); assert.equal(finishes, 1);
  assert.ok(game.score > 0);
  const final = JSON.stringify(game); game.tick(10, -1);
  assert.equal(JSON.stringify(game), final);
});

test('movement works in both directions and stays inside playfield', () => {
  const game = new Game(() => .5); game.start();
  game.tick(.25, -1); assert.ok(game.x < .5);
  game.tick(.5, 1); assert.ok(game.x > .5);
  game.moveTo(-10); assert.ok(game.x > 0);
  game.moveTo(10); assert.ok(game.x < 1);
  const x = game.x; game.moveTo(NaN); assert.equal(game.x, x);
});

test('falling speed and spawn frequency increase during the round', () => {
  const game = new Game(() => .5); game.start();
  const early = game.speed;
  game.tick(30); assert.ok(game.speed > early);
  assert.ok(game.speed < 2.01);
  assert.ok(game.items.length > 1);
});

test('restart from running, paused and finished creates a clean 45-second round', () => {
  for (const phase of ['running', 'paused', 'finished']) {
    const game = new Game(() => .5); game.start(); game.tick(5);
    if (phase === 'paused') game.pause();
    if (phase === 'finished') game.tick(45);
    game.start();
    assert.equal(game.status, 'running'); assert.equal(game.remaining, 45);
    assert.equal(game.score, 0); assert.equal(game.x, .5); assert.equal(game.speed, 1);
    assert.deepEqual(game.caught, { seed: 0, battery: 0, rock: 0 });
    assert.equal(game.items.length, 0);
  }
});

test('different frame rates produce the same stationary round with identical randomness', () => {
  const simulate = (fps: number) => {
    const game = new Game(() => .5); game.start();
    while (game.status === 'running') game.tick(1 / fps);
    return { score: game.score, caught: game.caught, elapsed: game.elapsed };
  };
  assert.deepEqual(simulate(30), simulate(60));
  assert.deepEqual(simulate(120), simulate(60));
});

test('invalid or negative deltas do not advance the round', () => {
  const game = new Game(() => .5); game.start();
  game.tick(-1); game.tick(NaN); game.tick(Infinity);
  assert.equal(game.elapsed, 0);
});
