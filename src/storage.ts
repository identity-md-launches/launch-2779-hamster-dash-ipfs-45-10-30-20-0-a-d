const KEYS = { best: 'hamster-dash:best', language: 'hamster-dash:language' } as const;
export function readSaved() {
  try {
    const raw = Number(localStorage.getItem(KEYS.best));
    const best = Number.isSafeInteger(raw) && raw >= 0 && raw <= 10000000 ? raw : 0;
    const language = localStorage.getItem(KEYS.language) === 'en' ? 'en' : 'zh';
    localStorage.setItem('hamster-dash:storage-check', '1');
    localStorage.removeItem('hamster-dash:storage-check');
    return { best, language, available: true } as const;
  } catch { return { best: 0, language: 'zh', available: false } as const; }
}
export function saveBest(best: number) {
  try { localStorage.setItem(KEYS.best, String(best)); return true; } catch { return false; }
}
export function saveLanguage(language: string) {
  try { localStorage.setItem(KEYS.language, language); } catch { /* The game still works without storage. */ }
}
