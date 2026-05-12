import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing630: DrawingInstruction = {
  id: 'wall-drawing-630',
  title: 'Wall Drawing #630',
  description:
    'A wall is divided horizontally into two equal parts. Top: alternating horizontal black and white 8-inch (20 cm) bands. Bottom: alternating vertical black and white 8-inch (20 cm) bands.',
  year: 1989,
  medium: 'Black and white paint',
  steps: [
    {
      type: 'solid-bands',
      params: {
        direction: 'horizontal',
        bandThicknessFracRange: { min: 0.04, max: 0.09 },
        colors: ['#1a1a1a', '#faf8f4'],
        randomizeColorStart: true,
        region: { x: 0, y: 0, w: 1, h: 0.5 },
      },
    },
    {
      type: 'solid-bands',
      params: {
        direction: 'vertical',
        colors: ['#1a1a1a', '#faf8f4'],
        randomizeColorStart: true,
        region: { x: 0, y: 0.5, w: 1, h: 0.5 },
      },
    },
  ],
}
