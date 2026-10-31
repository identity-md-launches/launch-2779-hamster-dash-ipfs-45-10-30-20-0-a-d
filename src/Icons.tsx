type IconName = 'play' | 'pause' | 'restart' | 'left' | 'right' | 'arrow' | 'bolt' | 'trophy' | 'sound' | 'mute' | 'keyboard' | 'check';
const paths: Record<IconName, React.ReactNode> = {
  play: <path d="m9 5 11 7-11 7V5Z" fill="currentColor" stroke="none" />,
  pause: <><path d="M8 5v14M16 5v14" strokeWidth="4" /></>,
  restart: <><path d="M4 10a8 8 0 1 1 1 8M4 4v6h6" /></>,
  left: <path d="m14 6-6 6 6 6" />,
  right: <path d="m10 6 6 6-6 6" />,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  bolt: <path d="m13 2-9 12h7l-1 8 10-13h-8l1-7Z" fill="currentColor" stroke="none" />,
  trophy: <><path d="M8 4h8v7a4 4 0 0 1-8 0V4Zm0 1H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4M12 15v5m-4 0h8" /></>,
  sound: <><path d="m11 4-5 4H3v8h3l5 4V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></>,
  mute: <><path d="m11 4-5 4H3v8h3l5 4V4Zm5 5 5 6m0-6-5 6" /></>,
  keyboard: <><rect x="2" y="5" width="20" height="14" rx="3" /><path d="M6 9h.1M10 9h.1M14 9h.1M18 9h.1M6 12h.1M10 12h.1M14 12h.1M18 12h.1M7 15h10" /></>,
  check: <path d="m5 12 4 4L19 6" />,
};
export function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  return <svg className={`icon ${className}`} viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
