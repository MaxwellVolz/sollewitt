import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing88: DrawingInstruction = {
  id: 'wall-drawing-88',
  title: 'Wall Drawing #88',
  description:
    'A 6-inch (15 cm) grid covering the wall. Within each square, not straight lines in either of four directions. Only one direction in each square but as many as desired, and at least one line in each square.',
  year: 1971,
  medium: 'Black pencil',
  steps: [
    {
      type: 'grid-wobbly',
      params: {
        cellSize: 0.08,
        lineKinds: ['horizontal', 'vertical', 'diagonal-left', 'diagonal-right'],
        linesPerCell: { min: 3, max: 12 },
        wobble: { min: 0.02, max: 0.04 },
        segments: { min: 8, max: 16 },
        drawGrid: true,
      },
    },
  ],
}
