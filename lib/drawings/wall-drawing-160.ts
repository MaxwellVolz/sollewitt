import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing160: DrawingInstruction = {
  id: 'wall-drawing-160',
  title: 'Wall Drawing #160',
  description:
    'A black outlined square with a red diagonal line centered on the axis between the upper left and lower right corners and another red diagonal line centered on the axis between the lower left and upper right corners.',
  year: 1973,
  medium: 'Black and red pencil',
  steps: [
    {
      type: 'square-and-line',
      params: {
        squareColor: '#222',
        squareWidth: { min: 10, max: 25 },
        squareOpacity: { min: 0.85, max: 1 },
        lines: [
          { from: [0, 0], to: [1, 1], length: { min: 0.1, max: 1 }, centered: true, color: '#c23b22', width: { min: 10, max: 25 }, opacity: { min: 0.85, max: 1 } },
          { from: [0, 1], to: [1, 0], length: { min: 0.1, max: 1 }, centered: true, color: '#c23b22', width: { min: 10, max: 25 }, opacity: { min: 0.85, max: 1 } },
        ],
      },
    },
  ],
}
