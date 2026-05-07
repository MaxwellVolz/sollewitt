import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing237: DrawingInstruction = {
  id: 'wall-drawing-237',
  title: 'Wall Drawing #237',
  description:
    'The location of a trapezoid. (The trapezoid is located by a written sentence describing its corners geometrically.)',
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
