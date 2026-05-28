import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RotateCcw, Download, Copy, Check, Code2, Play } from "lucide-react"

interface Props {
  commands: string[]
}

const GEOGEBRA_2D = "https://www.geogebra.org/classic"
const GEOGEBRA_3D = "https://www.geogebra.org/3d"

const _3D_COMMANDS = /\b(Prism|Pyramid|Tetrahedron|Cube|Sphere|Cone|Cylinder|Plane|IntersectPath|Net|Surface|Volume|Polyhedron)\s*\(/i
const _3D_POINT = /=\s*\([^)]*,[^)]*,[^)]*\)/

function is3D(cmds: string[]): boolean {
  const text = cmds.join("\n")
  return _3D_COMMANDS.test(text) || _3D_POINT.test(text)
}

function buildGgbUrl(cmds: string[], base: string): string {
  const params = new URLSearchParams()
  params.set("command", cmds.join(";"))
  params.set("embed", "")
  params.set("showToolBar", "false")
  params.set("showAlgebraInput", "false")
  params.set("showMenuBar", "false")
  return `${base}?${params.toString()}`
}

export default function GeoGebraViewer({ commands }: Props) {
  const [copied, setCopied] = useState(false)
  const [showPaste, setShowPaste] = useState(false)
  const [pasteInput, setPasteInput] = useState("")
  const [manualCommands, setManualCommands] = useState<string[] | null>(null)
  const [resetCount, setResetCount] = useState(0)

  const activeCommands = manualCommands ?? commands

  // Detect if commands contain 3D elements → use 3D app
  const is3DScene = useMemo(() => is3D(activeCommands), [activeCommands])
  const ggbBase = is3DScene ? GEOGEBRA_3D : GEOGEBRA_2D

  // Stable fingerprint: only changes when command content actually differs
  const fingerprint = useMemo(() => {
    if (activeCommands.length === 0) return "__empty__"
    return `${is3DScene ? "3d" : "2d"}:${activeCommands.join("\n")}`
  }, [activeCommands, is3DScene])

  // iframe key: remounts on content change or explicit reset
  const iframeKey = `${resetCount}--${fingerprint}`

  const src = useMemo(() => {
    if (activeCommands.length === 0) {
      return `${ggbBase}?embed&showToolBar=false&showAlgebraInput=false&showMenuBar=false`
    }
    return buildGgbUrl(activeCommands, ggbBase)
  }, [activeCommands, ggbBase])

  const handleReset = useCallback(() => {
    setManualCommands(null)
    setResetCount(c => c + 1)
  }, [])

  const handleExport = useCallback(() => {
    if (activeCommands.length === 0) return
    window.open(buildGgbUrl(activeCommands, ggbBase), "_blank")
  }, [activeCommands, ggbBase])

  const handleCopyCode = useCallback(() => {
    if (activeCommands.length === 0) return
    navigator.clipboard.writeText(activeCommands.join("\n")).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [activeCommands])

  const handlePasteExec = useCallback(() => {
    const lines = pasteInput
      .split("\n")
      .map(l => l.trim())
      .filter(l => l && !l.startsWith("//") && !l.startsWith("#"))
    if (lines.length === 0) return
    setManualCommands(lines)
    setShowPaste(false)
    setPasteInput("")
  }, [pasteInput])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-white">
        <span className="text-sm font-medium text-slate-600">GeoGebra 图形</span>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={handleReset} className="rounded-xl text-xs gap-1 h-8">
            <RotateCcw className="h-3 w-3" /> 重置
          </Button>
          <Button variant="ghost" size="sm" onClick={handleExport} className="rounded-xl text-xs gap-1 h-8">
            <Download className="h-3 w-3" /> 导出
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCopyCode} className="rounded-xl text-xs gap-1 h-8">
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "已复制" : "复制代码"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setShowPaste(!showPaste); setPasteInput(activeCommands.join("\n")) }}
            className={`rounded-xl text-xs gap-1 h-8 ${showPaste ? "bg-violet-100 text-violet-700" : ""}`}
          >
            <Code2 className="h-3 w-3" /> 粘贴代码
          </Button>
        </div>
      </div>

      {/* Paste code panel */}
      {showPaste && (
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <Textarea
            value={pasteInput}
            onChange={e => setPasteInput(e.target.value)}
            placeholder="在此粘贴 GeoGebra 命令，每行一条..."
            rows={5}
            className="rounded-xl resize-y text-xs font-mono"
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" size="sm" onClick={() => setShowPaste(false)} className="rounded-xl text-xs h-7">
              取消
            </Button>
            <Button size="sm" onClick={handlePasteExec} className="rounded-xl text-xs gap-1 h-7 bg-violet-600 hover:bg-violet-700">
              <Play className="h-3 w-3" /> 执行
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 relative">
        <iframe
          key={iframeKey}
          src={src}
          className="absolute inset-0 w-full h-full border-0"
          title="GeoGebra"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
    </div>
  )
}
