# sollewitt

Instruction-driven generative wall drawings in a spatial web gallery — a tribute to Sol LeWitt.

**Live demo:** [intervolz.com/sollewitt](https://intervolz.com/sollewitt)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, static export) |
| Runtime | React 19, TypeScript 5 (strict) |
| Rendering | HTML Canvas 2D with double-buffered offscreen blits |
| Animation | Framer Motion + `requestAnimationFrame` driven by stroke index |
| Icons | lucide-react |
| Font | Space Grotesk (via `next/font`) |

## Project Structure

```
app/
  layout.tsx          Root layout with Space Grotesk font
  page.tsx            Entry point — renders the Gallery

components/
  Gallery.tsx         Scrollable gallery of wall sections + footer
  WallSection.tsx     Full-viewport (100dvh) container per drawing
  DrawingCanvas.tsx   Canvas with incremental stroke rendering
  Controls.tsx        Play / Stop / Re-roll / Download (Share on mobile)
  Timeline.tsx        Stroke-based seekable progress bar

lib/
  engine.ts           Seeded stroke generator — turns instructions into geometry
  drawings/
    index.ts          Drawing registry
    wall-drawing-*.ts Per-drawing instruction definitions

types/
  drawings.ts         DrawingInstruction, DrawingStep, StrokeElement, LineKind

styles/
  globals.css         All styles (no CSS modules)

docs/
  drawing_instructions.md   Reference of original LeWitt instruction texts
```

## Concepts

### Instruction Model

Each drawing is a `DrawingInstruction` — a title, description, year, medium, optional background color, and ordered list of `DrawingStep`s the engine interprets into renderable `StrokeElement`s.

### Playback

Each wall section has a timeline driven by stroke count, not clock time. The 5-second default maps linearly across all strokes. The bar is seekable.

### Re-roll

Re-rolling generates a new seed, producing a different valid interpretation of the same instruction (varying density, direction selection, stroke weight, and wobble within defined ranges).

## Implemented Drawings

20 drawings spanning 1969–1973. See [`docs/drawing_instructions.md`](docs/drawing_instructions.md) for full instruction texts.

`#11`, `#16`, `#17`, `#19`, `#38`, `#46`, `#47`, `#56`, `#85`, `#86`, `#87`, `#88`, `#95`, `#130`, `#138`, `#142`, `#154`, `#159`, `#160`

## Adding a Drawing

1. Pick (or transcribe) an instruction. Authentic candidates are queued in `docs/drawing_instructions.md`.
2. Create `lib/drawings/wall-drawing-<N>.ts` exporting a `DrawingInstruction`.
3. Register it in `lib/drawings/index.ts`.
4. If the instruction requires a new step type, add the literal to `DrawingStep['type']` in `types/drawings.ts` and add a handler in `lib/engine.ts`.

See `CLAUDE.md` for the full step-type reference.

## Development

```sh
npm install
npm run dev          # http://localhost:3000
npm run build        # Static export to out/
npm run type-check   # TypeScript verification
npm run lint         # ESLint
npm run deploy       # Build + copy to intervolz.com/sollewitt
```
