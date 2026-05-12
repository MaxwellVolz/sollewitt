import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing238: DrawingInstruction = {
  id: 'wall-drawing-238',
  title: 'Wall Drawing #238',
  description:
    'A parallelogram whose top and bottom are two and a half times the length of its left and right sides, located by an unbroken chain of midpoint constructions across the wall’s corners, side midpoints, and center.',
  year: 1974,
  medium: 'Black pencil and crayon',
  steps: [
    {
      type: 'labelled-shapes',
      params: {
        kinds: ['parallelogram'],
        color: '#1a1a1a',
        labelColor: '#1a1a1a',
        showLabels: true,
        lineWidth: 1.8,
        labelSize: 16,
      },
    },
  ],
}
