import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing295: DrawingInstruction = {
  id: 'wall-drawing-295',
  title: 'Wall Drawing #295',
  description:
    'Six white geometric figures on a black wall. The shapes are superimposed, layered within the square.',
  year: 1976,
  medium: 'White crayon on black wall',
  backgroundColor: '#0e0e0e',
  steps: [
    {
      type: 'labelled-shapes',
      params: {
        kinds: ['rectangle', 'triangle', 'trapezoid', 'parallelogram', 'rhombus', 'hexagon'],
        color: '#f4f1ea',
        showLabels: false,
        superimposed: true,
        fillStyle: 'lines',
        fillColors: ['#f4f1ea'],
        // Two cross-hatch directions per shape so layered shapes stay
        // distinguishable when their outlines overlap.
        hatchAngles: [Math.PI / 4, -Math.PI / 4],
        hatchSpacing: 14,
        hatchWidth: 0.7,
        hatchOpacity: 0.55,
        lineWidth: 1.6,
      },
    },
  ],
}
