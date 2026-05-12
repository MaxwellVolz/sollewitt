import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing237: DrawingInstruction = {
  id: 'wall-drawing-237',
  title: 'Wall Drawing #237',
  description:
    'A trapezoid whose top is half its bottom and whose left side is one and a half times the top, located by an unbroken chain of midpoint constructions between the wall’s corners, side midpoints, and center.',
  year: 1974,
  medium: 'Black pencil and crayon',
  steps: [
    {
      type: 'labelled-shapes',
      params: {
        kinds: ['trapezoid'],
        color: '#1a1a1a',
        labelColor: '#1a1a1a',
        showLabels: true,
        lineWidth: 1.8,
        labelSize: 16,
      },
    },
  ],
}
