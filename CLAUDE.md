# Sol LeWitt Generative Wall Drawings

A Next.js web gallery that renders Sol LeWitt's instruction-based wall drawings using generative algorithms.

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
```

### Drawing System

Drawings are defined as `DrawingInstruction` objects with:
- `id`, `title`, `description`, `year`, `medium`
- `backgroundColor` (optional) - section background color, defaults to white
- `steps` - array of drawing steps

The engine (`lib/engine.ts`) interprets these steps and generates `StrokeElement[]` which are rendered incrementally on a canvas based on timeline progress.

### Step Types

| Type | Description | Example |
|------|-------------|---------|
| `divide` + `lines` | Grid of cells with line directions | #17, #56 |
| `bands` | Randomly placed bands of parallel lines | #46, #47 |
| `pegboard` | Grid of colored squares | #38 |
| `wobbly-lines` | Hand-drawn style vertical lines | #11 |
| `combinatorial` | All combinations of line directions in rows | #85 |

### Line Modes (for divide + lines)

- `unique: true` - Each cell gets a different single direction (#17)
- `progressive: true` - Cell 0 gets 1 direction, cell 1 gets 2, etc. (#56)
- Default - Each cell gets `pickPerCell` random directions

### Key Patterns

- Seeded random for reproducible outputs - each drawing has a seed that can be rerolled
- Double-buffered canvas rendering - offscreen buffer accumulates strokes, blits to display
- RequestAnimationFrame loop for smooth animation
- Scroll snapping between full-viewport sections
- White background default for all drawings (composited into downloads)
- Web Share API on mobile for native "Save Image" experience

## Adding a New Drawing

1. Create `lib/drawings/wall-drawing-{N}.ts` with a `DrawingInstruction`
2. Add import and export in `lib/drawings/index.ts`
3. If new step type needed, add handler in `lib/engine.ts` and type in `types/drawings.ts`

## Style Guide

- Use CSS custom properties defined in `:root` (`--bg`, `--fg`, `--muted`, etc.)
- Mobile breakpoint at 640px
- Font: Space Grotesk (loaded via next/font)
- Drawings default to white background unless `backgroundColor` specified
