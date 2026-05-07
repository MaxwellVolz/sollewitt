import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing631: DrawingInstruction = {
  id: 'wall-drawing-631',
  title: 'Wall Drawing #631',
  description:
    'A wall divided diagonally into two parts. Each part with alternating black and white bands.',
  year: 1989,
  medium: 'Black and white paint',
  steps: [
    {
      type: 'solid-bands',
      params: {
        direction: 'diagonal-right',
        bandCount: 14,
        colors: ['#1a1a1a', '#faf8f4'],
      },
    },
  ],
}
