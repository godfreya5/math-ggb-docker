import { useState, useCallback, useRef, useEffect, type ReactNode } from "react"

interface Props {
  left: ReactNode
  right: ReactNode
  defaultLeftWidth?: number
  minLeftWidth?: number
  minRightWidth?: number
}

export default function ResizableSplit({
  left,
  right,
  defaultLeftWidth = 45,
  minLeftWidth = 30,
  minRightWidth = 30,
}: Props) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
  }, [])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct = ((e.clientX - rect.left) / rect.width) * 100
      setLeftWidth(Math.max(minLeftWidth, Math.min(100 - minRightWidth, pct)))
    }
    const onMouseUp = () => { dragging.current = false }
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }
  }, [minLeftWidth, minRightWidth])

  return (
    <div ref={containerRef} className="flex h-full">
      <div style={{ width: `${leftWidth}%` }} className="min-h-0 overflow-auto">
        {left}
      </div>
      <div
        onMouseDown={onMouseDown}
        className="w-1.5 bg-slate-200 hover:bg-violet-400 cursor-col-resize shrink-0 transition-colors rounded-full my-4"
      />
      <div style={{ width: `${100 - leftWidth}%` }} className="min-h-0 overflow-hidden">
        {right}
      </div>
    </div>
  )
}
