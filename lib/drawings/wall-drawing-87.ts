import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing87: DrawingInstruction = {
  id: 'wall-drawing-87',
  title: 'Wall Drawing #87',
  description:
    'A square divided horizontally and vertically into four equal parts, each with lines and colors in four directions superimposed progressively.',
  year: 1971,
  medium: 'Red, yellow, blue, and black crayon',
  steps: [
    {
      type: 'divide',
      params: { rows: 2, cols: 2 },
    },
    {
      type: 'lines',
      params: {
        lineKinds: ['horizontal', 'vertical', 'diagonal-left', 'diagonal-right'],
        colors: ['#e63946', '#f4a261', '#457b9d', '#1d3557'],
        progressive: true,
        density: { min: 20, max: 35 },
        strokeWidth: { min: 0.5, max: 1.5 },
      },
    },
  ],
}
