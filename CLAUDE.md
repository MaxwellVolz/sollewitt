# Sol LeWitt Generative Wall Drawings

A Next.js web gallery that renders Sol LeWitt's instruction-based wall drawings using generative algorithms. 20 drawings implemented across 1969–1973.

## Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production (outputs to `out/`)
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking
- `npm run deploy` - Build and copy to intervolz.com deployment folder

## Architecture

### Project Structure

```
app/                    # Next.js app router
  layout.tsx            # Root layout with Space Grotesk font
  page.tsx              # Main page rendering Gallery
components/
  Gallery.tsx           # Maps drawings to WallSection components, includes footer
  WallSection.tsx       # Full-viewport section with canvas, controls, timeline
  DrawingCanvas.tsx     # Canvas rendering with incremental stroke drawing
  Controls.tsx          # Play/stop/reroll/download buttons (share icon on mobile)
  Timeline.tsx          # Progress bar with seek functionality
lib/
  engine.ts             # Core rendering engine - generates strokes from instructions
  drawings/             # Drawing instruction definitions
    index.ts            # Exports all drawings array
    wall-drawing-*.ts   # Individual drawing configs
types/
  drawings.ts           # TypeScript types for DrawingInstruction, StrokeElement, etc.
styles/
  globals.css           # All styles (no CSS modules)
docs/
  drawing_instructions.md  # Original LeWitt instruction texts (implemented + candidates)
```

### Drawing System

Drawings are defined as `DrawingInstruction` objects with:
- `id`, `title`, `description`, `year`, `medium`
- `backgroundColor` (optional) - section background color, defaults to white
- `steps` - array of drawing steps

The engine (`lib/engine.ts`) interprets these steps and generates `StrokeElement[]` which are rendered incrementally on a canvas based on timeline progress.

### Step Types

| Type | Description | Used by |
|------|-------------|---------|
| `divide` | Splits the wall into a grid of cells (optional `drawGrid`) | #11, #17, #19, #47, #56, #85, #87 |
| `lines` | Fills cells with line-kind combinations (modes: `unique`, `progressive`, default) | #11, #17, #19, #47, #56, #87 |
| `bands` | Random bands of parallel lines in selected directions | #16 |
| `pegboard` | Grid of evenly-spaced colored squares on a gray ground | #38 |
| `wobbly-lines` | Hand-drawn-style not-straight lines in one direction | #46 |
| `combinatorial` | Rows enumerating 1-, 2-, 3-, 4-direction combinations | #85 |
| `scattered-lines` | Many short lines at random positions and angles | #86 |
| `grid-wobbly` | Grid where each cell holds wobbly lines in one direction | #88 |
| `combinatorial-wobbly` | Color combinations of vertical wobbly lines across cells | #95 |
| `grid-and-arcs` | Grid plus concentric arcs swept from each corner | #130 |
| `midpoint-arcs` | Concentric circles/arcs centered on the four side midpoints | #138 |
| `progressive-wobbly-grid` | Grid where wobbly-line counts increase row by row | #142 |
| `square-and-line` | Outlined square plus colored lines from `from`/`to` anchors | #154, #159, #160 |

### Line Modes (for divide + lines)

- `unique: true` - Each cell gets a different single direction (#17)
- `progressive: true` - Cell 0 gets 1 direction, cell 1 gets 2, etc. (#56, #87)
- Default - Each cell gets `pickPerCell` random directions (#11, #19, #47)

### Key Patterns

- Seeded random for reproducible outputs - each drawing has a seed that can be rerolled
- Double-buffered canvas rendering - offscreen buffer accumulates strokes, blits to display
- RequestAnimationFrame loop for smooth animation
- Scroll snapping between full-viewport sections
- White background default for all drawings (composited into downloads)
- Web Share API on mobile for native "Save Image" experience

## Adding a New Drawing

1. Pick (or transcribe) an instruction. Candidates are queued in `docs/drawing_instructions.md`.
2. Create `lib/drawings/wall-drawing-{N}.ts` with a `DrawingInstruction`.
3. Add import and export in `lib/drawings/index.ts`.
4. If a new step type is needed, add the literal to `DrawingStep['type']` in `types/drawings.ts` and a handler in `lib/engine.ts`.
5. Update `docs/drawing_instructions.md` (move the entry from Candidates → Implemented).

## Style Guide

- Use CSS custom properties defined in `:root` (`--bg`, `--fg`, `--muted`, etc.)
- Mobile breakpoint at 640px
- Font: Space Grotesk (loaded via next/font)
- Drawings default to white background unless `backgroundColor` specified
