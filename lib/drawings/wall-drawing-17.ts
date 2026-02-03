import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing17: DrawingInstruction = {
  id: 'wall-drawing-17',
  title: 'Wall Drawing #17',
  description: 'Four-part drawing with a different line direction in each part.',
  year: 1969,
  medium: 'Black pencil',
  steps: [
    {
      type: 'divide',
      params: { rows: 1, cols: 4 },
    },
    {
      type: 'lines',
      params: {
        lineKinds: ['horizontal', 'vertical', 'diagonal-left', 'diagonal-right'],
        pickPerCell: 1,
        unique: true,
        density: { min: 15, max: 30 },
        strokeWidth: { min: 0.5, max: 1.5 },
      },
    },
  ],
}
