import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing422: DrawingInstruction = {
  id: 'wall-drawing-422',
  title: 'Wall Drawing #422',
  description:
    'A wall divided vertically into fifteen equal parts, each with a different line direction and color, and all combinations.',
  year: 1984,
  medium: 'Color ink wash',
  steps: [
    {
      type: 'combinatorial',
      params: {
        lineKinds: ['horizontal', 'vertical', 'diagonal-left', 'diagonal-right'],
        layout: 'strip',
        colors: [
          '#c23b22', '#e8a735', '#3a7d44', '#2554c7',
          '#7b3f8d', '#e86833', '#5b9bd5', '#88d8b0',
          '#d4a5a5', '#ffd93d', '#1a1a1a', '#a25a44',
          '#4f7942', '#b6321c', '#2f4f4f',
        ],
        density: { min: 18, max: 30 },
      },
    },
  ],
}
