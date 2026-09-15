import { useCallback, useEffect, useRef, useState } from 'react'
import { loadInkNote, saveInkNote } from '../lib/notesDb'

type Point = { x: number; y: number; pressure: number }

type Props = {
  /** Stable id for this note, e.g. `event:<googleEventId>` or `day:2026-09-21`. */
  noteId: string
  height?: number
  strokeColor?: string
}

const AUTOSAVE_DELAY_MS = 800

export default function InkCanvas({ noteId, height = 220, strokeColor = '#2b2b33' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)

  const strokesRef = useRef<string[]>([])
  const currentPointsRef = useRef<Point[]>([])
  const activePenIdRef = useRef<number | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [isEmpty, setIsEmpty] = useState(true)
  const [loaded, setLoaded] = useState(false)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.restore()
    ctx.strokeStyle = strokeColor
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 2.2
    for (const d of strokesRef.current) {
      const path = new Path2D(d)
      ctx.stroke(path)
    }
  }, [strokeColor])

  // Size the canvas to its container, accounting for device pixel ratio so
  // strokes stay crisp on a high-density tablet screen.
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = container.getBoundingClientRect()
      canvas.width = Math.max(1, Math.round(rect.width * dpr))
      canvas.height = Math.max(1, Math.round(rect.height * dpr))
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(dpr, dpr)
        ctxRef.current = ctx
        redraw()
      }
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    return () => observer.disconnect()
  }, [redraw])

  useEffect(() => {
    let cancelled = false
    setLoaded(false)
    loadInkNote(noteId).then((note) => {
      if (cancelled) return
      strokesRef.current = note?.strokesSvgPaths ?? []
      setIsEmpty(strokesRef.current.length === 0)
      setLoaded(true)
      redraw()
    })
    return () => {
      cancelled = true
    }
  }, [noteId, redraw])

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveInkNote(noteId, strokesRef.current)
    }, AUTOSAVE_DELAY_MS)
  }, [noteId])

  const pointsToPath = (points: Point[]): string => {
    if (points.length === 0) return ''
    const [first, ...rest] = points
    let d = `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`
    for (const p of rest) {
      d += ` L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`
    }
    return d
  }

  const getLocalPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure || 0.5,
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Palm rejection: once a pen is actively writing, ignore touch input
    // (a resting palm) until the pen lifts.
    if (activePenIdRef.current !== null && e.pointerType !== 'pen') return
    if (e.pointerType === 'touch' && activePenIdRef.current === null) {
      // Allow finger drawing when no pen is present at all.
    }
    if (e.pointerType === 'pen') activePenIdRef.current = e.pointerId
    e.currentTarget.setPointerCapture(e.pointerId)
    currentPointsRef.current = [getLocalPoint(e)]
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (currentPointsRef.current.length === 0) return
    if (activePenIdRef.current !== null && e.pointerId !== activePenIdRef.current) return
    const point = getLocalPoint(e)
    currentPointsRef.current.push(point)
    const ctx = ctxRef.current
    if (!ctx || currentPointsRef.current.length < 2) return
    const pts = currentPointsRef.current
    const prev = pts[pts.length - 2]
    ctx.strokeStyle = strokeColor
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 1.4 + point.pressure * 2.2
    ctx.beginPath()
    ctx.moveTo(prev.x, prev.y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
  }

  const endStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (currentPointsRef.current.length > 1) {
      strokesRef.current.push(pointsToPath(currentPointsRef.current))
      setIsEmpty(false)
      scheduleSave()
    }
    currentPointsRef.current = []
    if (e.pointerType === 'pen') activePenIdRef.current = null
  }

  const handleUndo = () => {
    strokesRef.current.pop()
    setIsEmpty(strokesRef.current.length === 0)
    redraw()
    scheduleSave()
  }

  const handleClear = () => {
    strokesRef.current = []
    setIsEmpty(true)
    redraw()
    scheduleSave()
  }

  return (
    <div className="ink-canvas">
      <div className="ink-canvas__toolbar">
        <span className="ink-canvas__hint">Write with your stylus</span>
        <div className="ink-canvas__actions">
          <button type="button" onClick={handleUndo} disabled={!loaded || isEmpty}>
            Undo
          </button>
          <button type="button" onClick={handleClear} disabled={!loaded || isEmpty}>
            Clear
          </button>
        </div>
      </div>
      <div className="ink-canvas__surface" ref={containerRef} style={{ height }}>
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endStroke}
          onPointerLeave={endStroke}
          onPointerCancel={endStroke}
        />
      </div>
    </div>
  )
}
