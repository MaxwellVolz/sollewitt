import { DrawingInstruction, StrokeElement, LineKind } from '@/types/drawings'

function seededRandom(seed: number) {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function randRange(rand: () => number, range: { min: number; max: number }): number {
  return range.min + rand() * (range.max - range.min)
}

function generateLinesForCell(
  kind: LineKind,
  x: number,
  y: number,
  w: number,
  h: number,
  count: number,
): [number, number][][] {
  const lines: [number, number][][] = []
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count
    switch (kind) {
      case 'horizontal':
        lines.push([[x, y + t * h], [x + w, y + t * h]])
        break
      case 'vertical':
        lines.push([[x + t * w, y], [x + t * w, y + h]])
        break
      case 'diagonal-right': {
        // Parallel \ lines at 45°. Sweep offset k along the anti-diagonal.
        // In local coords: ly = lx + k, k ranges from -w to h.
        // Evenly space count lines across that range.
        const k = -w + (i + 0.5) / count * (w + h)
        const lx0 = Math.max(0, -k)
        const ly0 = Math.max(0, k)
        const lx1 = Math.min(w, h - k)
        const ly1 = Math.min(h, w + k)
        if (lx0 < lx1) {
          lines.push([[x + lx0, y + ly0], [x + lx1, y + ly1]])
        }
        break
      }
      case 'diagonal-left': {
        // Parallel / lines at 45°. Sweep offset k along the diagonal.
        // In local coords: ly = -lx + k, k ranges from 0 to w + h.
        const k = (i + 0.5) / count * (w + h)
        const lx0 = Math.max(0, k - h)
        const ly0 = Math.min(k, h)
        const lx1 = Math.min(w, k)
        const ly1 = Math.max(0, k - w)
        if (lx0 < lx1) {
          lines.push([[x + lx0, y + ly0], [x + lx1, y + ly1]])
        }
        break
      }
    }
  }
  return lines
}

function pushStroke(
  strokes: StrokeElement[],
  path: [number, number][],
  style: { color: string; width: number; opacity: number },
): void {
  const order = strokes.length
  strokes.push({ id: order, path, style, drawOrder: order })
}

// --- Step handlers ---

function handleDivideAndLines(
  instruction: DrawingInstruction,
  rand: () => number,
  w: number,
  h: number,
  strokes: StrokeElement[],
) {
  const divideStep = instruction.steps.find((s) => s.type === 'divide')
  const linesStep = instruction.steps.find((s) => s.type === 'lines')
  if (!divideStep || !linesStep) return

  const rows = (divideStep.params.rows as number) || 2
  const cols = (divideStep.params.cols as number) || 2
  const cellW = w / cols
  const cellH = h / rows

  const drawGrid = divideStep.params.drawGrid as boolean | undefined
  if (drawGrid) {
    const gridStyle = { color: '#222', width: 1.5, opacity: 0.8 }
    // Vertical dividers
    for (let c = 1; c < cols; c++) {
      pushStroke(strokes, [[c * cellW, 0], [c * cellW, h]], gridStyle)
    }
    // Horizontal dividers
    for (let r = 1; r < rows; r++) {
      pushStroke(strokes, [[0, r * cellH], [w, r * cellH]], gridStyle)
    }
  }

  const allKinds = (linesStep.params.lineKinds as LineKind[]) || []
  const pick = (linesStep.params.pickPerCell as number) || 3
  const density = linesStep.params.density as { min: number; max: number }
  const unique = linesStep.params.unique as boolean | undefined
  const progressive = linesStep.params.progressive as boolean | undefined

  // For unique mode (#17), shuffle all kinds and assign one per cell without repeats
  const shuffledKinds = unique || progressive ? shuffle(allKinds, rand) : null
  let cellIndex = 0

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let cellKinds: LineKind[]
      if (progressive) {
        // Progressive mode (#56): cell 0 gets 1 kind, cell 1 gets 2, etc.
        const numKinds = Math.min(cellIndex + 1, shuffledKinds!.length)
        cellKinds = shuffledKinds!.slice(0, numKinds)
        cellIndex++
      } else if (shuffledKinds) {
        cellKinds = [shuffledKinds[cellIndex % shuffledKinds.length]]
        cellIndex++
      } else {
        cellKinds = shuffle(allKinds, rand).slice(0, pick)
      }

      const x = c * cellW
      const y = r * cellH

      for (const kind of cellKinds) {
        const count = Math.floor(randRange(rand, density))
        const lines = generateLinesForCell(kind, x, y, cellW, cellH, count)

        for (const path of lines) {
          pushStroke(strokes, path, {
            color: '#222',
            width: 0.5 + rand() * 1,
            opacity: 0.4 + rand() * 0.4,
          })
        }
      }
    }
  }
}

function handleBands(
  instruction: DrawingInstruction,
  rand: () => number,
  w: number,
  h: number,
  strokes: StrokeElement[],
) {
  const step = instruction.steps.find((s) => s.type === 'bands')
  if (!step) return

  const bandWidthRatio = (step.params.bandWidth as number) || 0.15
  const directions = (step.params.directions as LineKind[]) || []
  const lineDensity = step.params.lineDensity as { min: number; max: number }
  const bandCount = step.params.bandCount as { min: number; max: number }

  const bandW = bandWidthRatio * Math.min(w, h)

  for (const dir of directions) {
    const count = Math.floor(randRange(rand, bandCount))
    for (let b = 0; b < count; b++) {
      const linesInBand = Math.floor(randRange(rand, lineDensity))

      if (dir === 'vertical') {
        const cx = rand() * (w - bandW) + bandW / 2
        for (let i = 0; i < linesInBand; i++) {
          const lx = cx - bandW / 2 + (i + 0.5) / linesInBand * bandW
          pushStroke(strokes, [[lx, 0], [lx, h]], {
            color: '#222',
            width: 0.5 + rand() * 0.8,
            opacity: 0.3 + rand() * 0.4,
          })
        }
      } else if (dir === 'horizontal') {
        const cy = rand() * (h - bandW) + bandW / 2
        for (let i = 0; i < linesInBand; i++) {
          const ly = cy - bandW / 2 + (i + 0.5) / linesInBand * bandW
          pushStroke(strokes, [[0, ly], [w, ly]], {
            color: '#222',
            width: 0.5 + rand() * 0.8,
            opacity: 0.3 + rand() * 0.4,
          })
        }
      } else if (dir === 'diagonal-right') {
        const offset = rand() * (w + h) - h
        for (let i = 0; i < linesInBand; i++) {
          const d = (i + 0.5) / linesInBand * bandW - bandW / 2
          pushStroke(strokes, [[offset + d, 0], [offset + d + h, h]], {
            color: '#222',
            width: 0.5 + rand() * 0.8,
            opacity: 0.3 + rand() * 0.4,
          })
        }
      } else if (dir === 'diagonal-left') {
        const offset = rand() * (w + h) - h
        for (let i = 0; i < linesInBand; i++) {
          const d = (i + 0.5) / linesInBand * bandW - bandW / 2
          pushStroke(strokes, [[w - offset - d, 0], [w - offset - d - h, h]], {
            color: '#222',
            width: 0.5 + rand() * 0.8,
            opacity: 0.3 + rand() * 0.4,
          })
        }
      }
    }
  }
}

function handlePegboard(
  instruction: DrawingInstruction,
  rand: () => number,
  w: number,
  h: number,
  strokes: StrokeElement[],
) {
  const step = instruction.steps.find((s) => s.type === 'pegboard')
  if (!step) return

  const cellRatio = (step.params.cellSize as number) || 0.025
  const gapRatio = (step.params.gapRatio as number) || 0.2
  const colors = (step.params.colors as string[]) || ['#c23b22']

  const cellSize = cellRatio * Math.min(w, h)
  const gap = cellSize * gapRatio
  const squareSize = cellSize - gap

  const cols = Math.floor(w / cellSize)
  const rows = Math.floor(h / cellSize)

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cellSize + gap / 2
      const y = r * cellSize + gap / 2
      const color = colors[Math.floor(rand() * colors.length)]

      // Represent each square as a small filled quad (4-point closed path)
      pushStroke(strokes, [
        [x, y],
        [x + squareSize, y],
        [x + squareSize, y + squareSize],
        [x, y + squareSize],
        [x, y],
      ], {
        color,
        width: squareSize,
        opacity: 0.85 + rand() * 0.15,
      })
    }
  }
}

function handleWobblyLines(
  instruction: DrawingInstruction,
  rand: () => number,
  w: number,
  h: number,
  strokes: StrokeElement[],
) {
  const step = instruction.steps.find((s) => s.type === 'wobbly-lines')
  if (!step) return

  const countRange = step.params.count as { min: number; max: number }
  const wobbleRange = step.params.wobble as { min: number; max: number }
  const segRange = step.params.segments as { min: number; max: number }

  const lineCount = Math.floor(randRange(rand, countRange))

  for (let i = 0; i < lineCount; i++) {
    const x = (i + 0.5) / lineCount * w
    const segments = Math.floor(randRange(rand, segRange))
    const wobble = randRange(rand, wobbleRange)
    const path: [number, number][] = []

    for (let s = 0; s <= segments; s++) {
      const t = s / segments
      const offsetX = (rand() - 0.5) * 2 * wobble
      path.push([x + offsetX, t * h])
    }

    pushStroke(strokes, path, {
      color: '#222',
      width: 0.5 + rand() * 1,
      opacity: 0.4 + rand() * 0.4,
    })
  }
}

function getCombinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]]
  if (arr.length < k) return []
  const [first, ...rest] = arr
  const withFirst = getCombinations(rest, k - 1).map((c) => [first, ...c])
  const withoutFirst = getCombinations(rest, k)
  return [...withFirst, ...withoutFirst]
}

function handleCombinatorial(
  instruction: DrawingInstruction,
  rand: () => number,
  w: number,
  h: number,
  strokes: StrokeElement[],
) {
  const step = instruction.steps.find((s) => s.type === 'combinatorial')
  if (!step) return

  const allKinds = (step.params.lineKinds as LineKind[]) || []
  const density = step.params.density as { min: number; max: number }

  // Generate all combinations: singles, pairs, triples, quadruple
  const singles = getCombinations(allKinds, 1) // 4 combinations
  const pairs = getCombinations(allKinds, 2) // 6 combinations
  const triples = getCombinations(allKinds, 3) // 4 combinations
  const quadruple = getCombinations(allKinds, 4) // 1 combination

  // Row layout: [4 cells, 6 cells, 4 cells, 1 cell]
  const rows = [
    { combinations: shuffle(singles, rand), cols: 4 },
    { combinations: shuffle(pairs, rand), cols: 6 },
    { combinations: shuffle(triples, rand), cols: 4 },
    { combinations: quadruple, cols: 1 },
  ]

  const totalRows = rows.length
  const rowHeight = h / totalRows

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]
    const y = r * rowHeight
    const cellW = w / row.cols

    for (let c = 0; c < row.cols; c++) {
      const x = c * cellW
      const cellKinds = row.combinations[c] || []

      for (const kind of cellKinds) {
        const count = Math.floor(randRange(rand, density))
        const lines = generateLinesForCell(kind, x, y, cellW, rowHeight, count)

        for (const path of lines) {
          pushStroke(strokes, path, {
            color: '#222',
            width: 0.5 + rand() * 1,
            opacity: 0.4 + rand() * 0.4,
          })
        }
      }
    }
  }
}

// --- Main entry ---

export function generateStrokes(
  instruction: DrawingInstruction,
  seed: number,
  canvasWidth: number,
  canvasHeight: number,
): StrokeElement[] {
  const rand = seededRandom(seed)
  const strokes: StrokeElement[] = []

  const stepTypes = new Set(instruction.steps.map((s) => s.type))

  if (stepTypes.has('divide') && stepTypes.has('lines')) {
    handleDivideAndLines(instruction, rand, canvasWidth, canvasHeight, strokes)
  }

  if (stepTypes.has('bands')) {
    handleBands(instruction, rand, canvasWidth, canvasHeight, strokes)
  }

  if (stepTypes.has('pegboard')) {
    handlePegboard(instruction, rand, canvasWidth, canvasHeight, strokes)
  }

  if (stepTypes.has('wobbly-lines')) {
    handleWobblyLines(instruction, rand, canvasWidth, canvasHeight, strokes)
  }

  if (stepTypes.has('combinatorial')) {
    handleCombinatorial(instruction, rand, canvasWidth, canvasHeight, strokes)
  }

  return strokes
}
