import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { copy, type Language } from './i18n';
import { useGame } from './useGame';
import { Icon } from './Icons';
import { hamsterUrl, itemImages } from './renderer';
import { POINTS, ROUND_SECONDS, type ItemKind } from './game';
import { saveLanguage } from './storage';

export default function App() {
  const state = useGame();
  const { game } = state;
  const [language, setLanguage] = useState<Language>(state.savedLanguage);
  const t = copy[language];
  const playfield = useRef<HTMLDivElement>(null);
  const mainAction = useRef<HTMLButtonElement>(null);
  const draggedPointer = useRef<number | null>(null);
  const statusBefore = useRef(game.status);
  const kinds: ItemKind[] = ['seed', 'battery', 'rock'];
  const isPlaying = game.status === 'running';
  const isPaused = game.status === 'paused';
  const isFinished = game.status === 'finished';
  const isReady = game.status === 'ready';
  const newBest = isFinished && game.score > state.previousBest;

  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    document.title = language === 'zh' ? 'Hamster Dash｜仓鼠能量站' : 'Hamster Dash | The energy station';
    saveLanguage(language);
  }, [language]);

  useEffect(() => {
    if (game.status !== statusBefore.current) {
      if (game.status === 'running') playfield.current?.focus({ preventScroll: true });
      else if (game.status === 'paused' || game.status === 'finished') mainAction.current?.focus({ preventScroll: true });
      statusBefore.current = game.status;
    }
  }, [game.status]);

  const changeLanguage = () => { if (isPlaying) state.pause(); setLanguage(value => value === 'zh' ? 'en' : 'zh'); };
  const drag = (event: PointerEvent<HTMLDivElement>) => {
    if (game.status !== 'running') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    game.moveTo((event.clientX - bounds.left) / bounds.width);
  };
  const stopDrag = () => { draggedPointer.current = null; };
  const onDragStart = (event: PointerEvent<HTMLDivElement>) => {
    if (game.status !== 'running' || (event.pointerType === 'mouse' && event.button !== 0)) return;
    draggedPointer.current = event.pointerId; event.currentTarget.setPointerCapture(event.pointerId); drag(event);
  };
  const moveButton = (value: number) => ({
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => { event.currentTarget.setPointerCapture(event.pointerId); state.direction(value); },
    onPointerUp: () => state.direction(0), onPointerCancel: () => state.direction(0), onLostPointerCapture: () => state.direction(0),
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => { if (event.detail === 0) game.moveTo(game.x + value * .08); },
  });
  const liveMessage = state.announcement === 'finish'
    ? t.statusFinish.replace('{score}', String(game.score))
    : ({ ready: t.statusReady, run: t.statusRun, pause: t.statusPause, resume: t.statusResume })[state.announcement];

  return (
    <>
      <a className="skip-link" href="#game">{t.skip}</a>
      <div className="site-shell">
        <header className="site-header">
          <a className="brand" href="#">
            <img src={hamsterUrl} width="48" height="48" alt="" />
            <span className="brand-name">Hamster Dash<span className="brand-subtitle">{t.station}</span></span>
          </a>
          <nav className="header-actions" aria-label={language === 'zh' ? '实用工具' : 'Utilities'}>
            <a className="help-link" href="#how-to" onClick={() => state.pause()}>{t.help}</a>
            <button type="button" className="icon-button sound-button" onClick={() => void state.toggleSound()} aria-label={state.soundEnabled ? t.soundOff : t.soundOn} aria-pressed={state.soundEnabled} title={state.soundEnabled ? t.soundOff : t.soundOn}>
              <Icon name={state.soundEnabled ? 'sound' : 'mute'} />
            </button>
            <button type="button" className="language-button" onClick={changeLanguage} aria-label={language === 'zh' ? '中 / EN: Switch to English' : '中 / EN: 切换到中文'}>
              <span lang="zh-CN" className={language === 'zh' ? 'selected' : ''}>中</span><span className="language-divider" aria-hidden="true">/</span><span lang="en" className={language === 'en' ? 'selected' : ''}>EN</span>
            </button>
          </nav>
        </header>

        <main>
          <div className="main-layout">
            <section className="intro" aria-labelledby="page-title">
              <h1 id="page-title">{t.headlineA}<br /><span>{t.headlineB}</span><svg className="title-spark" viewBox="0 0 40 40" aria-hidden="true"><path d="m21 1-9 15H3l13 8-2 14 11-12 13-2-12-7Z" fill="currentColor" /></svg></h1>
              <p className="intro-description">{t.description}</p>
              <p className="fan-line">{t.fanLine}</p>
            </section>

            <section id="game" className={`game-station status-${game.status}`} aria-label={t.gameName}>
              <div className="game-hud">
                <dl className="scoreboard">
                  <div><dt>{t.score}</dt><dd data-testid="score">{game.score.toString().padStart(3, '0')}</dd></div>
                  <div className={game.remaining <= 10 ? 'timer urgent' : 'timer'}><dt>{t.time}</dt><dd><span data-testid="timer">{Math.ceil(game.remaining).toString().padStart(2, '0')}</span><span className="unit">{t.seconds}</span></dd></div>
                  <div className="best-score"><dt><Icon name="trophy" />{t.best}</dt><dd data-testid="best">{state.best.toString().padStart(3, '0')}</dd></div>
                </dl>
                <div className="game-tools">
                  <button type="button" className="icon-button" onClick={() => isPaused ? state.resume() : state.pause()} disabled={isReady || isFinished} aria-label={isPaused ? t.resume : t.pause} title={isPaused ? t.resume : t.pause}><Icon name={isPaused ? 'play' : 'pause'} /></button>
                  <button type="button" className="icon-button" onClick={state.start} disabled={isReady} aria-label={t.restart} title={t.restart}><Icon name="restart" /></button>
                </div>
              </div>
              <div className="time-track" aria-hidden="true"><div style={{ width: `${game.remaining / ROUND_SECONDS * 100}%` }} /></div>
              <div className="playfield" ref={playfield} tabIndex={0} role="group" aria-label={t.gameName} aria-describedby="game-instructions"
                onPointerDown={onDragStart} onPointerMove={event => { if (event.pointerId === draggedPointer.current) drag(event); }}
                onPointerUp={stopDrag} onPointerCancel={stopDrag} onLostPointerCapture={stopDrag}>
                <canvas ref={state.canvas} aria-hidden="true" />
                {!isPlaying && <div className={`game-overlay ${isReady ? 'lobby' : ''}`}>
                  {isReady && <>
                    <h2>{t.ready}</h2><p>{t.readyHint}</p>
                    <button ref={mainAction} type="button" className="primary-button" onClick={state.start}><Icon name="play" />{t.start}<Icon name="arrow" /></button>
                    <span className="round-note">{t.round}</span>
                  </>}
                  {isPaused && <>
                    <div className="pause-mark" aria-hidden="true"><Icon name="pause" /></div>
                    <h2>{t.paused}</h2><p>{game.pauseReason === 'away' ? t.awayPause : t.manualPause}</p>
                    <button ref={mainAction} type="button" className="primary-button" onClick={state.resume}><Icon name="play" />{t.resume}</button>
                  </>}
                  {isFinished && <>
                    <h2>{t.finished}</h2>
                    <p className="result-message">{game.score === 0 ? t.zeroResult : t.resultHint}</p>
                    <div className="result-score" aria-label={`${t.finalScore}: ${game.score}`}><strong>{game.score}</strong><span>{t.pointUnit}</span></div>
                    <p className="result-best"><Icon name={newBest ? 'trophy' : 'check'} />{newBest ? t.newBest : `${t.best}: ${state.best}`}</p>
                    <dl className="result-breakdown">{kinds.map(kind => <div key={kind}><dt><img src={itemImages[kind]} alt={t[kind]} width="24" height="24" /></dt><dd>× {game.caught[kind]}</dd></div>)}</dl>
                    <button ref={mainAction} type="button" className="primary-button" onClick={state.start}><Icon name="restart" />{t.playAgain}</button>
                  </>}
                </div>}
                <div className="field-corners" aria-hidden="true"><i /><i /><i /><i /></div>
              </div>
              <div className="game-bottom">
                <span className="game-status"><span className={isPlaying ? 'status-dot active' : 'status-dot'} />{isPlaying ? t.collecting : isPaused ? t.resting : isFinished ? t.complete : t.standingBy}</span>
                <span className="speed-readout">{t.speed} <strong data-testid="speed">{game.speed.toFixed(1)}×</strong></span>
              </div>
              <div className="touch-controls">
                <button type="button" className="move-button" disabled={!isPlaying} aria-label={t.left} {...moveButton(-1)}><Icon name="left" /></button>
                <span>{t.hold}<small>{t.drag}</small></span>
                <button type="button" className="move-button" disabled={!isPlaying} aria-label={t.right} {...moveButton(1)}><Icon name="right" /></button>
              </div>
            </section>

            <section className="collect-guide" aria-labelledby="collect-title">
              <h2 id="collect-title">{t.guide}</h2>
              <ul>{kinds.map(kind => <li key={kind}>
                <img src={itemImages[kind]} width="44" height="44" alt="" />
                <div className="item-copy"><h3>{t[kind]}</h3><p>{t[`${kind}Hint`]}</p></div>
                <span className={`points points-${kind}`}>{POINTS[kind] > 0 ? '+' : ''}{POINTS[kind]}</span>
              </li>)}</ul>
              <div className="keyboard-hint"><Icon name="keyboard" /><span>{t.keyboard}<small>{t.pauseKey}</small></span><span className="keycaps" aria-hidden="true"><kbd>←</kbd><kbd>→</kbd></span></div>
            </section>

            <div className="under-game">
              <p className="desktop-instruction">{t.keyboard}<span>·</span>{t.pauseKey}</p>
              <p className={!state.storageAvailable ? 'storage-notice' : ''}>{state.storageAvailable ? t.localNote : t.sessionNote}</p>
              {state.soundError && <p role="status">{t.soundUnavailable}</p>}
            </div>
          </div>

          <section id="how-to" className="how-to" aria-labelledby="how-title">
            <div><h2 id="how-title">{t.howTo}</h2><p>{t.howBody}</p></div>
            <div className="control-notes"><p><Icon name="left" />{t.touch}</p><p>{t.autoPause}</p></div>
          </section>
          <span id="game-instructions" className="sr-only">{t.gameInstruction}</span>
          <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{liveMessage}</div>
        </main>

        <footer className="site-footer">
          <div className="footer-top"><p><Icon name="bolt" />{t.community}</p><a href="https://squeekchain.com/" target="_blank" rel="noopener noreferrer">{t.official}<Icon name="arrow" /></a></div>
          <div className="footer-bottom"><p>{t.about}<span>{t.noChain}</span></p><span className="privacy-note">{t.privacy}</span></div>
        </footer>
      </div>
    </>
  );
}
