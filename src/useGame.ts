import { useCallback, useEffect, useRef, useState } from 'react';
import { Game, type PauseReason } from './game';
import { drawGame, loadSprites } from './renderer';
import { Sound } from './sound';
import { readSaved, saveBest } from './storage';

export function useGame() {
  const [saved] = useState(readSaved);
  const [best, setBest] = useState(saved.best);
  const [storageAvailable, setStorageAvailable] = useState(saved.available);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundError, setSoundError] = useState(false);
  const [revision, setRevision] = useState(0);
  const [announcement, setAnnouncement] = useState<'ready' | 'run' | 'pause' | 'resume' | 'finish'>('ready');
  const game = useRef(new Game()).current;
  const sound = useRef(new Sound()).current;
  const canvas = useRef<HTMLCanvasElement>(null);
  const keys = useRef(new Set<string>());
  const touchDirection = useRef(0);
  const lastFrame = useRef<number | null>(null);
  const sprites = useRef<ReturnType<typeof loadSprites> | null>(null);
  const reduced = useRef(false);
  const previousBest = useRef(best);
  const paint = useCallback(() => {
    if (canvas.current && sprites.current) drawGame(canvas.current, game, sprites.current, reduced.current);
  }, [game]);
  const sync = useCallback(() => { setRevision(value => value + 1); paint(); }, [paint]);
  const clearInput = useCallback(() => { keys.current.clear(); touchDirection.current = 0; lastFrame.current = null; }, []);

  const start = useCallback(() => {
    previousBest.current = best; clearInput(); game.start(); sound.unlock();
    setAnnouncement('run'); sync();
  }, [best, clearInput, game, sound, sync]);
  const pause = useCallback((reason: PauseReason = 'manual') => {
    if (game.status !== 'running') return;
    game.pause(reason); clearInput(); setAnnouncement('pause'); sync();
  }, [game, clearInput, sync]);
  const resume = useCallback(() => {
    if (game.status !== 'paused') return;
    clearInput(); game.resume(); sound.unlock(); setAnnouncement('resume'); sync();
  }, [clearInput, game, sound, sync]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const preference = () => { reduced.current = media.matches; paint(); };
    preference(); media.addEventListener('change', preference);
    sprites.current = loadSprites(paint);
    const observer = new ResizeObserver(paint);
    if (canvas.current) observer.observe(canvas.current);
    paint();
    return () => { media.removeEventListener('change', preference); observer.disconnect(); };
  }, [paint]);

  useEffect(() => {
    let frame = 0, sinceSync = 0;
    const animate = (time: number) => {
      if (game.status === 'running') {
        const delta = lastFrame.current === null ? 0 : Math.max(0, (time - lastFrame.current) / 1000);
        lastFrame.current = time;
        const direction = touchDirection.current || (Number(keys.current.has('arrowright') || keys.current.has('d')) - Number(keys.current.has('arrowleft') || keys.current.has('a')));
        // A long foreground stall pauses instead of silently consuming the round.
        if (delta > 0.5) { pause('away'); }
        else {
          const events = game.tick(delta, direction);
          for (const event of events) {
            sound.play(event.type);
            if (event.type === 'finish') {
              setAnnouncement('finish'); clearInput();
              setBest(current => {
                const next = Math.max(current, game.score);
                if (!saveBest(next)) setStorageAvailable(false);
                return next;
              });
            }
          }
          sinceSync += delta;
          if (sinceSync >= .08 || events.length) { sinceSync = 0; setRevision(value => value + 1); }
          paint();
        }
      } else { lastFrame.current = null; }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [game, paint, sound, pause, clearInput]);

  useEffect(() => {
    const editable = (target: EventTarget | null) => target instanceof HTMLElement && (target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(target.tagName));
    const keyDown = (event: KeyboardEvent) => {
      if (editable(event.target) || event.altKey || event.ctrlKey || event.metaKey) return;
      const key = event.key.toLowerCase();
      if (game.status === 'running' && ['arrowleft', 'arrowright', 'a', 'd'].includes(key)) {
        event.preventDefault(); keys.current.add(key);
      }
      const onControl = event.target instanceof HTMLElement && Boolean(event.target.closest('button, a, summary'));
      if ((event.code === 'Space' && !onControl) || key === 'escape') {
        if (event.repeat) return;
        if (game.status === 'running') { event.preventDefault(); pause(); }
        else if (game.status === 'paused' && event.code === 'Space' && !onControl) { event.preventDefault(); resume(); }
      }
    };
    const keyUp = (event: KeyboardEvent) => { keys.current.delete(event.key.toLowerCase()); };
    const away = () => pause('away');
    const hidden = () => { if (document.hidden) away(); };
    window.addEventListener('keydown', keyDown); window.addEventListener('keyup', keyUp);
    window.addEventListener('blur', away); window.addEventListener('pagehide', away);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      window.removeEventListener('keydown', keyDown); window.removeEventListener('keyup', keyUp);
      window.removeEventListener('blur', away); window.removeEventListener('pagehide', away);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, [game, pause, resume]);

  const toggleSound = async () => {
    const success = await sound.toggle(); setSoundEnabled(sound.enabled); setSoundError(!success);
  };
  const direction = (value: number) => { touchDirection.current = value; };
  // React refreshes the HUD at most 12.5 times/sec; canvas stays at native frame rate.
  void revision;
  return { game, canvas, best, previousBest: previousBest.current, storageAvailable, savedLanguage: saved.language,
    start, pause, resume, direction, toggleSound, soundEnabled, soundError, announcement };
}
