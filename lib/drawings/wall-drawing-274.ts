import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing274: DrawingInstruction = {
  id: 'wall-drawing-274',
  title: 'Wall Drawing #274',
  description:
    'The location of six geometric figures. Works are done in black pencil with geometric figures emphasized in crayon. Every line on the wall is labeled with a code marking its role in defining a shape — e.g. R12 reads as "rectangle, first group, second line." The labels turn the wall into an exposed wiring diagram: the shapes you see and the reasoning that produced them, both legible at once.',
  year: 1975,
  medium: 'Black pencil and colored crayon',
  steps: [
    {
      type: 'labelled-shapes',
      params: {
        kinds: ['rectangle', 'triangle', 'trapezoid', 'parallelogram', 'rhombus', 'pentagon'],
        color: '#1a1a1a',
        showLabels: false,
        fillStyle: 'lines',
        // Three crayon hues rotating across the six figures.
        fillColors: ['#c43d3d', '#d9a521', '#2f6fb8', '#c43d3d', '#d9a521', '#2f6fb8'],
        hatchAngles: [Math.PI / 4],
        hatchWidth: 0.9,
        hatchOpacity: 0.8,
        lineWidth: 1.6,
        // Construction-line documentation: 2 groups × 2 lines per shape.
        showConstructionLines: true,
        constructionGroups: 2,
        constructionLinesPerGroup: 2,
        constructionLabelSize: 10,
        constructionColor: '#7a7a7a',
        constructionLabelColor: '#333',
        constructionOpacity: 0.42,
      },
    },
  ],
}
