import { CATCH_Y, type Game, type ItemKind } from './game';
import hamsterUrl from './assets/hamster.svg';
import seedUrl from './assets/seed.svg';
import batteryUrl from './assets/battery.svg';
import rockUrl from './assets/rock.svg';

const urls = { hamster: hamsterUrl, seed: seedUrl, battery: batteryUrl, rock: rockUrl };
export function loadSprites(onLoad: () => void) {
  return Object.fromEntries(Object.entries(urls).map(([key, url]) => {
    const img = new Image(); img.onload = onLoad; img.src = url; return [key, img];
  })) as Record<keyof typeof urls, HTMLImageElement>;
}
type Sprites = ReturnType<typeof loadSprites>;

export function drawGame(canvas: HTMLCanvasElement, game: Game, images: Sprites, reduced: boolean) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const width = canvas.clientWidth, height = canvas.clientHeight;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  }
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#153c2d'; ctx.fillRect(0, 0, width, height);

  // Quiet engineering-paper grid: the single energy-station motif.
  ctx.strokeStyle = '#244a37'; ctx.lineWidth = 0.6;
  const grid = 34;
  ctx.beginPath();
  for (let x = width / 2 % grid; x < width; x += grid) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
  for (let y = 0; y < height; y += grid) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
  ctx.stroke();
  const specks = [[.08, .13], [.89, .11], [.15, .47], [.83, .58], [.41, .2], [.61, .53], [.93, .36], [.31, .68]];
  for (const [x, y] of specks) {
    // Leave the lobby's instructions on a quiet, consistently dark background.
    if (game.status === 'ready' && x > .25 && x < .75 && y < .6) continue;
    ctx.fillStyle = '#4b7150'; ctx.beginPath(); ctx.arc(x * width, y * height, 2, 0, Math.PI * 2); ctx.fill();
    if (x > .8 || x < .1) {
      ctx.strokeStyle = '#537b53'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x * width - 5, y * height); ctx.lineTo(x * width + 5, y * height);
      ctx.moveTo(x * width, y * height - 5); ctx.lineTo(x * width, y * height + 5); ctx.stroke();
    }
  }
  // Soft banks and small plants leave the active falling lanes unobstructed.
  ctx.fillStyle = '#1d4933'; ctx.beginPath(); ctx.moveTo(0, height * .91);
  ctx.bezierCurveTo(width * .25, height * .85, width * .64, height * .97, width, height * .88);
  ctx.lineTo(width, height); ctx.lineTo(0, height); ctx.fill();
  ctx.fillStyle = '#28533a';
  for (const x of [.035, .96]) {
    ctx.beginPath(); ctx.ellipse(x * width, height * .91, 7, 18, -.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x * width + 8, height * .92, 6, 13, .6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.strokeStyle = '#43674a'; ctx.lineWidth = 1; ctx.setLineDash([4, 8]);
  ctx.beginPath(); ctx.moveTo(20, height * .92); ctx.lineTo(width - 20, height * .92); ctx.stroke(); ctx.setLineDash([]);

  function sprite(kind: keyof Sprites, x: number, y: number, size: number, rotation = 0) {
    const image = images[kind];
    if (!image.complete || !image.naturalWidth) return;
    ctx!.save(); ctx!.translate(x, y); ctx!.rotate(rotation);
    ctx!.drawImage(image, -size / 2, -size / 2, size, size); ctx!.restore();
  }
  if (game.status === 'ready') {
    sprite('seed', width * .16, height * .38, Math.max(30, width * .06), -.3);
    sprite('battery', width * .85, height * .29, Math.max(34, width * .064), .25);
    sprite('seed', width * .79, height * .69, Math.max(26, width * .045), .35);
    sprite('rock', width * .2, height * .76, Math.max(30, width * .05), -.2);
    ctx.fillStyle = '#244f36'; ctx.beginPath(); ctx.ellipse(width / 2, height * .90, width * .23, height * .037, 0, 0, Math.PI * 2); ctx.fill();
    sprite('hamster', width / 2, height * .76, Math.min(196, height * .44));
    return;
  }
  const objectSize = Math.max(26, Math.min(43, width * .07));
  for (const item of game.items) sprite(item.kind, item.x * width, item.y * height, objectSize, item.rotation);
  sprite('hamster', game.x * width, (CATCH_Y + .015) * height, Math.max(62, Math.min(96, width * .18)));
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '800 20px Nunito, sans-serif';
  for (const feedback of game.feedback) {
    ctx.globalAlpha = Math.max(0, 1 - feedback.age / .65);
    ctx.fillStyle = feedback.points < 0 ? '#ffba9f' : '#c3ff82';
    const rise = reduced ? 0 : feedback.age * 45;
    ctx.fillText(`${feedback.points > 0 ? '+' : ''}${feedback.points}`, feedback.x * width, height * .69 - rise);
  }
  ctx.globalAlpha = 1;
}

export const itemImages: Record<ItemKind, string> = { seed: seedUrl, battery: batteryUrl, rock: rockUrl };
export { hamsterUrl };
