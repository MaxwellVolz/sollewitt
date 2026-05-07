import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing295: DrawingInstruction = {
  id: 'wall-drawing-295',
  title: 'Wall Drawing #295',
  description: 'Six white geometric figures on a black wall.',
  year: 1976,
  medium: 'White crayon on black wall',
  backgroundColor: '#0e0e0e',
  steps: [
    {
      type: 'labelled-shapes',
      params: {
        kinds: ['rectangle', 'triangle', 'trapezoid', 'parallelogram', 'rhombus', 'hexagon'],
        color: '#f4f1ea',
        labelColor: '#f4f1ea',
        showLabels: false,
        lineWidth: 1.6,
        labelSize: 12,
      },
    },
  ],
}
