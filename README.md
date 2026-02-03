# sollewitt

Instruction-driven generative wall drawings in a spatial web gallery — a tribute to Sol LeWitt.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, static export) |
| Rendering | Three.js 0.180 via React Three Fiber + Drei |
| Animation | Framer Motion |
| Language | TypeScript 5 (strict) |
| Runtime | React 19 |

## Project Structure

```
app/
  layout.tsx          Root layout, metadata
  page.tsx            Entry point — renders the Gallery

components/
  Gallery.tsx         Scrollable gallery of wall sections
  WallSection.tsx     Full-viewport (100dvh) container per drawing
  DrawingCanvas.tsx   R3F canvas, orthographic camera, stroke rendering
  Controls.tsx        Play / Stop / Re-roll buttons
  Timeline.tsx        Draggable progress bar (stroke-based, 5s playback)

lib/
  engine.ts           Seeded stroke generator — turns instructions into geometry
  drawings/
    index.ts          Drawing registry
    wall-drawing-11.ts   Wall Drawing #11 definition

types/
  drawings.ts         DrawingInstruction, StrokeElement, LineKind, etc.

styles/
  globals.css         Minimal, gallery-appropriate styles
```

## Concepts

### Instruction Model

Each drawing is defined as a `DrawingInstruction` — a title, description, year, and ordered list of `DrawingStep`s that the engine interprets into renderable `StrokeElement`s.

### Playback

Each wall section has a timeline driven by stroke count, not clock time. The 5-second default maps linearly across all strokes. The timeline bar is seekable.

### Re-roll

Re-rolling generates a new seed, producing a different valid interpretation of the same instruction (varying density, line selection, and stroke weight within defined ranges).

## Scope — MVP

1. Full-viewport (`100dvh`) wall sections, one per drawing
2. Animated playback of stroke creation (5s default, seekable timeline)
3. Play / Stop / Re-roll controls
4. Seeded randomness — re-roll stays within acceptable parameter ranges
5. Wall Drawing #11 as the first implemented instruction

## Adding a Drawing

1. Create `lib/drawings/wall-drawing-<N>.ts` exporting a `DrawingInstruction`
2. Register it in `lib/drawings/index.ts`
3. If the instruction requires a new step type, extend `engine.ts` to handle it

## Development

```sh
npm install
npm run dev        # http://localhost:3000
npm run build      # Static export to out/
npm run type-check # TypeScript verification
```
