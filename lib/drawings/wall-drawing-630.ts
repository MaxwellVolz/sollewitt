import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing630: DrawingInstruction = {
  id: 'wall-drawing-630',
  title: 'Wall Drawing #630',
  description:
    'A wall divided horizontally into two parts. Each part with alternating black and white bands.',
  year: 1989,
  medium: 'Black and white paint',
  steps: [
    {
      type: 'solid-bands',
      params: {
        direction: 'horizontal',
        bandCount: 16,
        colors: ['#1a1a1a', '#faf8f4'],
      },
    },
  ],
}
