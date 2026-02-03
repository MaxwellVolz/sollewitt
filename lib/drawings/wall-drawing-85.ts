import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing85: DrawingInstruction = {
  id: 'wall-drawing-85',
  title: 'Wall Drawing #85',
  description:
    'A wall is divided into four horizontal parts. In the top row are four equal divisions, each with lines in a different direction. In the second row, six double combinations; in the third row, four triple combinations; in the bottom row, all four combinations superimposed.',
  year: 1971,
  medium: 'Black pencil',
  steps: [
    {
      type: 'combinatorial',
      params: {
        lineKinds: ['horizontal', 'vertical', 'diagonal-left', 'diagonal-right'],
        density: { min: 18, max: 28 },
      },
    },
  ],
}
