export type LineKind = 'horizontal' | 'vertical' | 'diagonal-left' | 'diagonal-right'

export type StrokeStyle = {
  color: string
  width: number
  opacity: number
}

export interface DrawingInstruction {
  id: string
  title: string
  description: string
  year?: number
  medium?: string
  backgroundColor?: string
  steps: DrawingStep[]
}

export interface DrawingStep {
  type: 'divide' | 'lines' | 'arcs' | 'shapes' | 'fill' | 'bands' | 'pegboard' | 'wobbly-lines' | 'combinatorial' | 'scattered-lines' | 'grid-wobbly' | 'combinatorial-wobbly' | 'grid-and-arcs'
  params: Record<string, unknown>
}

export interface DrawingState {
  instruction: DrawingInstruction
  progress: number
  isPlaying: boolean
  seed: number
}

export interface StrokeElement {
  id: number
  path: [number, number][]
  style: StrokeStyle
  drawOrder: number
}
