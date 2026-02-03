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
  Gallery.tsx           # Maps drawings to WallSection components
  WallSection.tsx       # Full-viewport section with canvas, controls, timeline
  DrawingCanvas.tsx     # Canvas rendering with incremental stroke drawing
  Controls.tsx          # Play/stop/reroll/download buttons
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
- `backgroundColor` (optional) - section background color
- `steps` - array of drawing steps (`divide`, `lines`, `arcs`, `bands`, `pegboard`, etc.)

The engine (`lib/engine.ts`) interprets these steps and generates `StrokeElement[]` which are rendered incrementally on a canvas based on timeline progress.

### Key Patterns

- Seeded random for reproducible outputs - each drawing has a seed that can be rerolled
- Double-buffered canvas rendering - offscreen buffer accumulates strokes, blits to display
- RequestAnimationFrame loop for smooth animation
- Scroll snapping between full-viewport sections

## Style Guide

- Use CSS custom properties defined in `:root` (`--bg`, `--fg`, `--muted`, etc.)
- Mobile breakpoint at 640px
- Font: Space Grotesk (loaded via next/font)
