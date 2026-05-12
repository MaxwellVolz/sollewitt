export type LineKind = 'horizontal' | 'vertical' | 'diagonal-left' | 'diagonal-right'

export type StrokeStyle = {
  color: string
  width: number
  opacity: number
  /** Override the auto-detect (closed → fill, open → stroke). Used when an
   * outlined polygon should NOT be filled (e.g. hatched shapes whose closing
   * edge is needed for the outline but whose interior is filled by separate
   * hatch strokes). */
  mode?: 'stroke' | 'fill' | 'auto'
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
  type: 'divide' | 'lines' | 'arcs' | 'shapes' | 'fill' | 'bands' | 'pegboard' | 'wobbly-lines' | 'combinatorial' | 'scattered-lines' | 'grid-wobbly' | 'combinatorial-wobbly' | 'grid-and-arcs' | 'midpoint-arcs' | 'progressive-wobbly-grid' | 'square-and-line' | 'architectural-points' | 'random-wobbly' | 'circle-scatter' | 'imitative-bands' | 'solid-bands' | 'parallel-lines' | 'lines-to-grid-points' | 'labelled-shapes' | 'labelled-points' | 'walls-with-figures'
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
  /** When present, the stroke renders as text at path[0] instead of a polyline. */
  text?: { content: string; size: number; align?: CanvasTextAlign }
}
