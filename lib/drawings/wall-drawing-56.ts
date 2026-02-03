import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing56: DrawingInstruction = {
  id: 'wall-drawing-56',
  title: 'Wall Drawing #56',
  description:
    'A square is divided horizontally and vertically into four equal parts, each with lines in four directions superimposed progressively.',
  year: 1970,
  medium: 'Black pencil',
  steps: [
    {
      type: 'divide',
      params: { rows: 2, cols: 2 },
    },
    {
      type: 'lines',
      params: {
        lineKinds: ['horizontal', 'vertical', 'diagonal-left', 'diagonal-right'],
        progressive: true,
        density: { min: 20, max: 35 },
        strokeWidth: { min: 0.5, max: 1.5 },
      },
    },
  ],
}
