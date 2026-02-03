import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing11: DrawingInstruction = {
  id: 'wall-drawing-11',
  title: 'Wall Drawing #11',
  description:
    'A wall divided horizontally and vertically into four equal parts. Within each part, three of the four kinds of lines are superimposed.',
  year: 1969,
  medium: 'Black pencil',
  steps: [
    {
      type: 'divide',
      params: { rows: 2, cols: 2, drawGrid: true },
    },
    {
      type: 'lines',
      params: {
        lineKinds: ['horizontal', 'vertical', 'diagonal-left', 'diagonal-right'],
        pickPerCell: 3,
        density: { min: 30, max: 60 },
        strokeWidth: { min: 0.5, max: 1.5 },
      },
    },
  ],
}
