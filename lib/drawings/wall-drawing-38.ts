import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing38: DrawingInstruction = {
  id: 'wall-drawing-38',
  title: 'Wall Drawing #38',
  description:
    'Tissue paper cut into 1½-inch (4 cm) squares and inserted into holes in the gray pegboard walls. All holes in the walls are filled randomly.',
  year: 1970,
  medium: 'Colored tissue papers, gray pegboard walls',
  steps: [
    {
      type: 'pegboard',
      params: {
        cellSize: 0.025,
        gapRatio: 0.2,
        colors: [
          '#c23b22', '#e8a735', '#3a7d44', '#2e5fa1',
          '#7b3f8d', '#e86833', '#d4a5a5', '#f0e68c',
          '#5b9bd5', '#ff6b6b', '#88d8b0', '#ffd93d',
        ],
        background: '#b0b0b0',
      },
    },
  ],
}
