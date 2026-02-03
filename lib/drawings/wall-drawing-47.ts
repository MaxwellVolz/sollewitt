import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing47: DrawingInstruction = {
  id: 'wall-drawing-47',
  title: 'Wall Drawing #47',
  description: 'A wall divided into fifteen equal parts, each with a different line direction, and all combinations.',
  year: 1970,
  medium: 'Black pencil',
  steps: [
    {
      type: 'divide',
      params: { rows: 3, cols: 5, drawGrid: true },
    },
    {
      type: 'lines',
      params: {
        lineKinds: ['horizontal', 'vertical', 'diagonal-left', 'diagonal-right'],
        pickPerCell: 4,
        density: { min: 30, max: 60 },
        strokeWidth: { min: 0.5, max: 1.5 },
      },
    },
  ],
}
