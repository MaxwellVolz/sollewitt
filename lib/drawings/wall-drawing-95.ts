import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing95: DrawingInstruction = {
  id: 'wall-drawing-95',
  title: 'Wall Drawing #95',
  description:
    'On a wall divided vertically into fifteen equal parts, vertical lines, not straight, using four colors in all one-, two-, three-, and four-part combinations.',
  year: 1971,
  medium: 'Red, yellow, blue, and black crayon',
  steps: [
    {
      type: 'combinatorial-wobbly',
      params: {
        colors: ['#e63946', '#f4a261', '#457b9d', '#1d3557'],
        linesPerColor: { min: 8, max: 16 },
        wobble: { min: 0.01, max: 0.03 },
        segments: { min: 20, max: 40 },
      },
    },
  ],
}
