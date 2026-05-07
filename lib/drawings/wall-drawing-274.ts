import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing274: DrawingInstruction = {
  id: 'wall-drawing-274',
  title: 'Wall Drawing #274',
  description: 'The location of six geometric figures.',
  year: 1975,
  medium: 'Black pencil',
  steps: [
    {
      type: 'labelled-shapes',
      params: {
        kinds: ['rectangle', 'triangle', 'trapezoid', 'parallelogram', 'rhombus', 'pentagon'],
        color: '#1a1a1a',
        labelColor: '#1a1a1a',
        showLabels: true,
        lineWidth: 1.6,
        labelSize: 12,
      },
    },
  ],
}
