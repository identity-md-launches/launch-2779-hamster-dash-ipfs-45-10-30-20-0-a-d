# Hamster Dash design system

## Overview

Hamster Dash｜仓鼠能量站 is a Chinese / English arcade game for the Squeekchain fan community. It is an independent project, with a visible non-affiliation statement. The central visual idea is a friendly hamster inside a deep green energy station: a quiet grid, bright green energy, warm original character art.

The game is the primary content. Desktop places the short introduction and item guide beside it; smaller screens put the game ahead of the guide. There is no separate marketing splash screen. One bright action starts, resumes or replays the round. The source of truth is `src/styles.css`, `src/App.tsx`, `src/renderer.ts` and the original SVG assets.

## Colors

Colors use sRGB hex values. CSS primitives map to semantic roles; components use the role tokens. Canvas scenery and illustration colors are literal art values in `src/renderer.ts` and `src/assets/*.svg`.

| Semantic token | Value | Use |
| --- | --- | --- |
| `--color-bg` | `#0b211a` | Page background |
| `--color-surface` | `#102b21` | HUD and station control area |
| `--color-field` | `#153c2d` | Canvas base |
| `--color-control` | `#224533` | Neutral controls, keycaps, time track |
| `--color-border` | `#395944` | Station boundary and structural dividers |
| `--color-text` | `#f4f5df` | Main text |
| `--color-muted` | `#a7b9a3` | Descriptions and secondary labels |
| `--color-accent` | `#b5f56c` | Primary action, positive energy and countdown track |
| `--color-accent-hover` | `#cdff96` | Primary button hover |
| `--color-on-accent` | `#0b211a` | Text and icons on the primary action |
| `--color-warning` | `#ffba9f` | Negative points, final ten seconds, storage notice |
| `--color-focus` | `#f4f5df` | Visible keyboard perimeter |

Pause and result overlays use `#102b21ed` over the frozen scene. Grid lines use `#244a37`; central decorative specks are omitted in the lobby so instructions keep a consistently dark background. Fur is `#e7ae70`, face/belly `#fff0d3`, outlines `#533a24`; green bandana and battery tie the art to the station.

Measured in the rendered Chinese 390px lobby: primary button text/background **13.03:1**, secondary text/page **8.11:1**, focus/field **11.06:1**. Sampling actual canvas pixels within the instruction boxes found heading minimum **10.03:1** and description / round note minimum **5.35:1**. These are specific measurements, not a claim that every game sprite or frame was audited. See `artifacts/validation.md` for coverage.

## Typography

Family: `Nunito, 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif`. The Latin variable font is self-hosted at `src/assets/nunito-latin-wght-normal.woff2`, with `font-display: swap`. Its declared axis is 200–1000; actual UI weights are **400, 600 and 800**. The loaded Nunito face was confirmed in the browser. Chinese uses available system fallbacks; no external font service is requested.

| Token | Default | Role |
| --- | --- | --- |
| `--text-caption` | 13px | Compact instructions, secondary labels, footer |
| `--text-body` | 16px | Buttons, item names, body text |
| `--text-subhead` | 20px | Section headings and brand; mobile HUD / game heading |
| `--text-heading` | 28px | Desktop HUD numbers and game state heading |
| `--text-score` | 40px | Final result |
| `--text-display` | 64px | Main headline |

Display is 56px at 1100–1200px and 40px below 1100px. This preserves one scale of at most six sizes at a given width. Headline line-height is 1.14 desktop, 1.15 tablet, 1.12 phone; desktop tracking is −.045em and phone −.04em. Game headings use 1.25 line-height, guide headings 1.4, and paragraphs 1.6. Headings balance; short descriptions use pretty wrapping. Long instructional prose is capped at 65ch and footer copy at 76ch. Numeric score, timer and speed use tabular digits. Critical values are not ellipsized.

## Layout

Shared spacing variables are 4, 8, 12, 16, 24 and 32px. Larger layout separations are 40 and 64px; 20px is used for compact inset / item rhythm. The site shell is at most 1264px including 40px inline padding. Shared left/right edges align the header, introduction, game, rules and footer.

| Width | Implemented behavior |
| --- | --- |
| Above 1200px | `.82fr / 1.4fr` introduction / game grid, 64px column gap, game spanning introduction and guide rows |
| 1100–1200px | Same grid, 40px gap and 56px display type |
| 600–1099px | Single column, shell max 800px with 32px gutters; intro, game, local note, then a three-column item guide |
| 360–599px | 16px minimum gutters with safe-area handling, 88px header, two-line headline, one-column guide, compact HUD; header help link hidden while rules remain below |
| Under 360px | Brand illustration hidden to preserve space for language and sound; tighter HUD inset |

Playfield height is 397px desktop/tablet, 350px phone, and 330px below 360px. The engine uses normalized coordinates and the canvas redraws with `ResizeObserver`; sprites stay square and device-pixel ratio is capped at 2. Page text remains in normal document flow. Only the game illustration layer is gesture driven and unselectable.

At 390×844 the Chinese Start game button occupies y=460.17–510.17px. The game and action are visible without scrolling. Browser checks covered 320, 390, 768, 1100 and 1440px; native browser zoom, physical devices and landscape safe-area behavior are not claimed as tested.

## Elevation & Depth

The surface system is flat: no card shadows or gradient text. A 1px border identifies the single game station, while tonal changes separate HUD, playfield and controls. Score groups are unboxed. Pause and results occupy the existing playfield instead of opening a page-wide modal. No fixed action blocks page copy. Illustration shadows are drawn into the artwork, not applied to interface cards.

## Shapes

Station radius is 24px desktop and 20px phone. Primary buttons use `--radius-control: 12px`; utility and movement controls use 10px. The station is not globally overflow-clipped, so keyboard outlines and text remain visible. Circular status dots are always accompanied by text. Corner marks belong to the scene, not to an extra nested card.

## Components and behavior

- **Brand / utilities** (`src/App.tsx`, `.site-header`): brand at the leading edge, help, optional sound and language at the trailing edge. The language control includes visible text in its accessible name. Sound is off by default and exposes its state with `aria-pressed`.
- **Primary action** (`.primary-button`): a single green action per game state. Start / resume / play again have native button semantics, icon and text. Heights are at least 52px desktop and 50px phone. Hover brightens; pressed scale is .96.
- **Utility / movement buttons** (`.icon-button`, `.move-button`): 44px minimum targets. Native disabled state marks actions unavailable before a round or after it ends. Pointer capture supports holds and release outside the button. Keyboard activation of movement buttons steps the hamster.
- **HUD** (`.scoreboard`, `.time-track`): definition lists associate score, time and local best with their values. Color and shrinking track supplement a numeric countdown. The final ten seconds use warning text without flashing.
- **Playfield / state overlay** (`.playfield`, `.game-overlay`): ready, running, paused and finished occupy one stable area. Focus moves into the playfield on start/resume and to the primary action on pause/finish. Pointer drag, arrow keys and A/D move the same hamster. Space pauses; Escape pauses. Main state changes have a stable polite live region; the continuously changing timer is not announced every frame.
- **Item guide** (`.collect-guide`): three aligned rows with original icons, names, plain hints and signed point values. Positive and negative results are expressed with numbers as well as color.
- **Local state** (`src/storage.ts`, `src/useGame.ts`): best and language are local to the browser origin. Storage errors show a session-only notice and do not prevent play. No global leaderboard is implied. Restart resets the active round immediately.
- **Icons** (`src/Icons.tsx`): exported `Icon` accepts `name` and optional `className`; one 24px viewBox and currentColor line style. Decorative SVGs are hidden from assistive technology; icon-only buttons receive names.
- **Original art** (`src/assets/hamster.svg`, `seed.svg`, `battery.svg`, `rock.svg`): reusable square sprites shared between guide, canvas and share artwork. Editable share composition is `src/assets/share-card.svg`; the deployed share asset is `public/og-image.png` (1200×630).
- **Community footer**: official link plus explicit independent fan status and casual-game / privacy disclosure in both languages. Keep this visible in future adaptations.

Motion is opt-in under `prefers-reduced-motion: no-preference`: 120ms background/transform changes and .96 button press with `cubic-bezier(.2,0,0,1)`. Reduced motion removes these transitions and upward floating score effects. Essential falling-game movement remains, with visible pause controls; the lobby has no endless animation. Forced colors retain system Highlight focus and ButtonText control borders.

## Do’s and don’ts

Reuse the semantic color and type tokens, `Icon`, button patterns and shared shell. Keep the game ahead of supplementary copy at narrow widths, keep the item rules truthful, and preserve the local-only best explanation. Give important text enough room to wrap; keep numeric values readable and use native links for destinations.

Do not introduce another primary filled action beside Start / Resume / Play again, competing visual effects, external runtime fonts, fake community statistics or wallet flows. Do not put decorative bright points behind instructional text. For a future rules/about view, reuse `.site-shell`, the header/footer, the existing type scale and a 65ch reading measure; use an anchor or exported static page suitable for IPFS hosting. Do not turn this page-specific two-column game arrangement into a universal layout rule.

Design guidance: Jakub Krehel’s Better Interface, pinned commit `267330e1adfc66a718fb65fa6918c1f06d0a689e` (MIT). Documentation method adapted from Paul Bakaus’s Impeccable, pinned commit `9d715cc4f5564a990ca8345abfdd5df6dc9b41c8` (Apache-2.0). Notices and licenses are retained in `licenses/design-guidance.txt`; this document describes the implemented product rather than reproducing the guide.
