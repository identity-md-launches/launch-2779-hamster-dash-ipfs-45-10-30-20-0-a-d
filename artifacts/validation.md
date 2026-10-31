# Hamster Dash validation and design review

Completed 2026-10-31. This is the worker’s local evidence, not independent certification.

| Area | Final result |
| --- | --- |
| Brief requirements | 15 groups met; 0 missing; 0 faked; publication after review |
| Broken primary interactions observed | 0 outstanding |
| Product and primary action at 390px | Yes; Start button y=460.17–510.17px at 390×844 |
| Production build / typecheck | Passed / passed |
| Logic tests / browser checks | 9/9 / 25/25 groups |
| taste@1 | 16/16; offline probe |
| Better Interface domains | All six reviewed; optional subcheck limits below |
| Accessibility scan | 0 axe violations in Chromium and WebKit on the English ready state |
| Copy findings / share card | 0 outstanding / real 1200×630 PNG and required metadata |

## Scope and assumptions

One static browser game, ready / running / paused / finished states, Chinese and English, mouse / keyboard / emulated touch. Source is React 19 + TypeScript + Vite 7. `dist/` is the complete production export; `base: './'` and in-page anchors allow static IPFS gateway subpaths. No backend, wallet, RPC, advertisements, analytics or paid API is required. Sound is an optional local synthesis feature and starts disabled. Best score and language are local to the browser origin, not a shared leaderboard.

Ordinary design choices were inferred from the brief: a deep green station, quiet grid, bright green energy, original warm hamster art and one primary action. All sprites, font and share assets are local. A numeric score has no monetary or onchain meaning. The supplied official URL is preserved; its external availability was not asserted.

The delivery platform pins `dist/` after submission. No publishing command ran, no CID was invented, and public gateway / social-crawler checks await that step.

## Requirement coverage

| Brief requirement | Status and evidence |
| --- | --- |
| “每局45秒” | Met: `ROUND_SECONDS` in `src/game.ts`; exact terminal time and single finish event tested; both browsers completed a full round |
| “种子+10…电池+30…石头-20…最低0分” | Met: engine collision tests check all values and floor; guide shows signed values |
| “随时间逐渐加速” | Met: speed and spawn interval depend on active elapsed time; engine and browser checks confirm acceleration |
| “方向键、A/D、手机拖动和触屏按钮” | Met: all four keys, captured pointer drag/hold, and actual emulated touch events change the rendered hamster position |
| “开始、暂停、重新开始、倒计时、得分、结算及本地最高分” | Met: native controls, visible HUD and result state; pause freezing, replay, restart, best and reload persistence tested |
| “离开页面自动暂停” | Met: window blur and hidden-document visibility signals freeze the countdown; resume is explicit |
| “深绿色…荧光绿…原创可爱仓鼠…手机和电脑” | Met: final screenshots, original SVG source and responsive production styles |
| “中英文切换” | Met: complete copy dictionaries, updated document language/title, persisted language and both layouts checked |
| Independent fan game, introduction, official link, no affiliation | Met: bilingual intro/footer and exact `https://squeekchain.com/` anchor; no official endorsement implied |
| No onchain claims, airdrops, earnings, wallet, ads, tracking or paid API | Met: explicit casual-game disclosure; source and request log reviewed; zero external runtime requests in browser tests |
| Working site, source, lockfile, relative `dist/index.html` and assets | Met: export loaded from `/preview/` in Chromium and WebKit; manifests/source present; production asset integrity recorded |
| Production build, typecheck and useful interactions with actual results | Met: commands below; standalone engine and browser checks are delivered in `tests/` |
| Pinned Better Interface and six-domain review, findings fixed | Met: core principles read before construction; consolidated review below |
| 390px first screen; title, favicon, description, og:title, og:image | Met: measured Start bounding box, manual screenshot review and taste share check; PNG also visually inspected |
| Root DESIGN.md and install / preview / rebuild README | Met: `DESIGN.md` extracted from final source and rendered observations; `README.md` includes commands and limitations |

## Six-domain coverage

| Domain | Checked coverage | Not applicable / not verified |
| --- | --- | --- |
| Accessibility | Native buttons/anchors, one h1/main, definition-list HUD, icon names, label/name consistency, skip link, tab flow, visible focus on skip/playfield/primary action, pause/resume focus movement, 44px controls, stable polite state region, reduced-motion styles; axe in both engines | Not a screen-reader session or full WCAG certification. No forms or page-wide modals. Nonvisual spatial gameplay, forced-color rendering and real assistive technology not verified |
| Layout | Actual export at `/preview/`; mobile/desktop screenshots; probe at 320/390/1440; English overflow assertions at 320/390/768/1100/1440; stable game states; guide follows game on phone | Native 200% zoom, physical rotation / notches and every possible viewport not verified. RTL is not a supported locale |
| Writing | Every button and status reviewed against its action, whole Chinese/English copy dictionaries, local-only record explanation, recovery messages, concise intro, supplied official destination and independence disclosure | No forms or remote-service transaction states. External official-site uptime not checked |
| Typography | Six declared size roles, three weights, visible heading hierarchy, Chinese / English wrapping, tabular numbers, no ellipsized critical values; loaded Nunito face confirmed in browser | No claim of identical Chinese glyph selection across OSs. Browser-native text zoom and screen-reader pronunciation not verified |
| Colors | Role/primitive mapping, actual rendered solid pairs from taste, sampled canvas backgrounds under Chinese lobby text, focus and primary button measurements below; signs/text accompany state colors | taste excluded 8 media-backed text boxes. Supplementary measurements cover the 390px Chinese lobby, not every sprite, feedback fade, locale or gameplay frame. No alternate light theme is requested |
| UI details | Ready, playing, manual/automatic pause, completed/new-best and replay flows; disabled/hover/pressed/focus states; keyboard, pointer and touch capture; storage denial; sound success/failure; flat single-surface composition; reduced-motion emulation has zero running DOM animations | Physical audio listening, device haptics and 10%-speed DevTools animation replay not performed. Essential falling-game motion remains available with pause |

## Findings, corrections and rechecks

1. **High · accessibility: visible labels were excluded from accessible names.** Source: `src/App.tsx:64` (brand anchor) and `src/App.tsx:73` (language button). Before: the brand’s aria-label omitted its subtitle, and the language action’s name omitted “中 / EN”. Reproduction: English ready page at 1440px, axe `label-content-name-mismatch`, 2 nodes. Change: remove the redundant brand aria-label and include the visible language label in the button’s name. Why: voice and assistive-technology names should match visible labels. Recheck: axe reports 0 violations in Chromium and WebKit.

2. **Medium · writing/layout: the same keyboard instruction line appeared twice.** Source: `src/App.tsx:148` (instructions beside the game) and `src/App.tsx:156` (rules notes). Before: the first taste run reported `2× 方向键或 a d 移动 空格暂停`, with 15/16 checks passing. Change: remove the duplicate from the lower notes; the notes grid closes around the two remaining paragraphs. Why: avoid repeated prose and keep directions at the controls. Recheck: final taste repetition check passes; 16/16 overall, no text collisions.

3. **Low · touch comfort: four controls were below 44px on the first phone screen.** Source: `src/styles.css:73` (brand minimum height), `src/styles.css:79` (utilities), `src/styles.css:251` and `src/styles.css:280` (phone HUD tools). Before: all controls met the probe’s 24px minimum, but 4 were below its comfortable size. Change: use 44px utility targets and a 44px minimum brand hit area without increasing the artwork. Recheck: final taste reports `0 under the 44px comfortable size`; 320px English layout remains within the viewport. This was a comfort improvement, not a claimed WCAG minimum-size failure.

4. **Medium · colors: decorative specks entered the instruction background.** Source: `src/renderer.ts:37`. Before: conservative sampling of every canvas pixel within the Chinese lobby description and round-note boxes found a 2.68:1 minimum on a bright speck. The sample included glyph gaps, so it was a background-risk finding, not a claim that all text pixels failed. Change: skip central lobby specks in the text zone, preserving the side decorations and grid. Reproduction/recheck: 390×844 production page, canvas `getImageData` sampled within each DOM text rectangle using its actual foreground. Description/round-note minimum becomes 5.35:1; heading minimum 10.03:1. Final screenshots and offline probe rechecked.

5. **Low · writing: recovery labels inferred a cause they did not always know.** Source: `src/i18n.ts:11`, `src/i18n.ts:18`, English equivalents at lines 35 and 42. Before: automatic-pause text always attributed the pause to leaving, although a long foreground stall also pauses; sound failure said the browser was unsupported even when audio could fail for another reason. Change: “已自动暂停，准备好就继续本局。” / “Paused automatically. Resume when you’re ready.” and “音效暂不可用，仍可正常游戏。” / “Sound is unavailable. You can still play.” Recheck: automatic-pause and WebKit sound-fallback checks pass on the final export.

All five findings are resolved. No outstanding high/medium finding was observed in the stated coverage.

## Contrast evidence

Measurements used WCAG 2 relative luminance from actual computed colors. Media-backed instruction checks sampled the canvas within the text’s DOM rectangle, scaled to its device-pixel dimensions.

| Pair/state | Measured contrast |
| --- | ---: |
| Primary action `#0b211a` on `#b5f56c` | 13.03:1 |
| Secondary text `#a7b9a3` on page `#0b211a` | 8.11:1 |
| Focus perimeter `#f4f5df` against field `#153c2d` | 11.06:1 |
| Warning `#ffba9f` on HUD `#102b21` | 9.19:1 |
| Chinese lobby heading over its actual canvas rectangle, minimum | 10.03:1 |
| Chinese lobby description / round note over their actual canvas rectangles, minimum | 5.35:1 |

The final probe reports all automatically measured text meeting 4.5:1 (3:1 large). Its media exclusions and the narrower coverage of the manual sampling are retained above.

## Commands and actual results

Dependencies were installed with the delivered lockfile into a clean `/tmp/hamster-dash-build` staging project. Source and configuration were copied there, and production output was directed back to the repository. This respected the repository’s prohibition on touching `node_modules/`; no runtime aliases, dependency archives or registry mirror were shipped.

```bash
npm ci --prefix /tmp/hamster-dash-build --cache /tmp/hamster-dash-npm-cache --no-audit --no-fund
npm run typecheck --prefix /tmp/hamster-dash-build
npm run build --prefix /tmp/hamster-dash-build -- --outDir "$PWD/dist" --emptyOutDir
npm test
```

- Typecheck exits 0 (`tsc --noEmit`). Production build exits 0, transforms 40 modules and outputs the complete relative export. The final build also includes third-party runtime notices.
- `npm test` exits 0, 9 passed / 0 failed. It checks score deltas/floor, misses, pause freezing, exact 45-second finish and no duplicate finish, movement boundaries, acceleration, clean restarts, frame-rate equivalence and invalid deltas.
- `npm run test:browser --prefix /tmp/hamster-dash-build` exits 0, 25 groups passed. Tests load the actual repository export via `HAMSTER_DIST` under a temporary `/preview/` HTTP subpath. Engine groups and browser groups are different levels of evidence, not added together as a coverage percentage.
- Browser tests use an injected `Math.random = () => .5` and virtual active time to get reproducible full-round checks. Both finish with 730 points from 73 seeds. This is explicitly a test fixture, not a community record or the production random generator.
- Both engines checked arrow keys, A/D, held button and captured drag by measuring the rendered hamster, pause freezing over 3 virtual seconds, explicit resume/focus, window blur, clean restart, acceleration, full result and persisted best/language. Chromium additionally checked emulated touch start/move/end and hidden-document signal with storage denied. The hidden-document condition is simulated; it is not presented as a physical OS switch.
- At 320, 390, 768, 1100 and 1440px, English document width stays within viewport width. axe ready-state scans have no violations. App console errors, failed network requests and external runtime requests are all empty in both engines. A separate browser-tool navigation also showed all five initial local requests at HTTP 200 and no console warnings/errors.

The local WebKit runtime initially failed because system graphic/media libraries were missing. Library packages were downloaded/extracted only under `/tmp`; software EGL rendering and private runtime library paths allowed the real WebKit engine to run. `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1` was used because its system `ldconfig` inventory cannot see those private libraries. This bypassed only the host-package preflight, not any application assertion. The actual browser launched, loaded and executed every WebKit check. Its AudioContext was unavailable, so the expected visible fallback was tested; Chromium enabled and muted AudioContext. No listening result is claimed. For an ordinary machine, README’s standard Playwright `--with-deps` install replaces this environment-specific setup.

The final pinned probe command was:

```bash
IMD_PLAYWRIGHT=/tmp/hamster-dash-tools/node_modules/playwright/index.mjs \
PLAYWRIGHT_BROWSERS_PATH=/tmp/hamster-dash-browsers \
node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste --offline
```

It exits 0, all **16/16** checks pass: render, layout, targets, contrast, casing, tracking, eyebrows, type sizes/faces, glyphs, slogans, repetition, copy budget, chrome, motion, share. All 9 counted phone controls are at least 44px. No horizontal scroll, text-over-text, floating control overlap or clipped text was reported. Probe screenshots were viewed and the final 390px screen was also inspected through the supplied browser tool. The pinned inputs and `test/scratch` are not needed to build or run the delivered site.

## Evidence and delivery integrity

- `browser-checks.json`: final 25-group report, copied from the test output.
- `taste-summary.json`: unchanged final probe checks, excluding bulky diagnostic DOM dumps.
- `export-manifest.json`: actual production file sizes and SHA-256 values.
- `bundle-budget.json`: delivered path sizes, total and 8 MiB limit; excludes the provided input/read-only directories and disposable scratch tree.
- `screenshots/mobile-390-zh.webp`: final first screen at 390×844.
- `screenshots/desktop-1440-zh.webp`: final desktop page including community disclosure.
- `screenshots/paused-390-zh.webp`: manual pause and visible keyboard focus on Resume.
- `screenshots/result-390-en.webp`: completed deterministic browser-test round; 730 is fixture output.
- `screenshots/webkit-desktop-en.webp`: actual WebKit English page, including its sound-unavailable notice.

The export retains source, manifest/lockfile, original assets, local font, favicon and share image; runtime React/Nunito notices are in `dist/third-party-notices.txt`. A read-only `git check-ignore --no-index` check found the review artifacts excluded by existing rules. The explicit path budget for the new `.gitignore` is **256 bytes**: it preserves `dist/` and `artifacts/` while excluding dependencies/caches at every nesting level and disposable `test/scratch/`. Its actual size is enforced in `bundle-budget.json`. No submodule was added, and no dependency/cache directory is inside the deliverable. No scratch scripts or logs were written into source paths.

## Completion and limitations

**Complete for the stated implementation and local validation scope.** Public IPFS publication is after review, owned by the delivery platform.

Unperformed checks remain explicit: real Safari/iPhone/Android hardware, physical audio output, screen-reader sessions, browser-native 200% zoom, forced-color screenshots, exhaustive locale/frame contrast, full nonvisual spatial play and external social-share unfurl/public gateway behavior. Emulated touch and Linux WebKit do not establish those results. The game’s essential spatial animation requires vision; accessible controls and state announcements are provided, but a nonvisual alternative game mode is not claimed.
