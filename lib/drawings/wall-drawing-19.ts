import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing19: DrawingInstruction = {
  id: 'wall-drawing-19',
  title: 'Wall Drawing #19',
  description:
    'A wall divided vertically into six equal parts, with two of the four kinds of line directions superimposed in each part.',
  year: 1969,
  medium: 'Black pencil',
  steps: [
    {
      type: 'divide',
      params: { rows: 1, cols: 6 },
    },
    {
      type: 'lines',
      params: {
        lineKinds: ['horizontal', 'vertical', 'diagonal-left', 'diagonal-right'],
        pickPerCell: 2,
        density: { min: 12, max: 25 },
        strokeWidth: { min: 0.5, max: 1.5 },
      },
    },
  ],
}
