import { useState } from "react"
import { Upload, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { sessions } from "@/lib/api"

interface Props {
  sessionId: string | null
  onUploaded: (path: string) => void
  onSessionCreated: (id: string) => void
  onAutoAnalyze?: () => void
}

export default function ImageUploader({ sessionId, onUploaded, onSessionCreated, onAutoAnalyze }: Props) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  const uploadFile = async (file: File) => {
    let sid = sessionId
    if (!sid) {
      try {
        const s = await sessions.create()
        sid = s.id
        onSessionCreated(sid)
      } catch (err: any) {
        setError(err.message || "创建会话失败，请重试")
        return
      }
    }
    if (!sid) {
      setError("创建会话失败，请重试")
      return
    }
    setUploading(true)
    setError("")
    try {
      const res = await sessions.upload(sid, file)
      onUploaded(res.image_path)
      onAutoAnalyze?.()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) {
      uploadFile(file)
    } else {
      setError("请上传图片文件")
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    // Reset so re-selecting the same file triggers onChange
    e.target.value = ""
  }

  return (
    <Card
      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${
        dragging ? "border-violet-400 bg-violet-50" : "border-slate-200 hover:border-violet-300"
      }`}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <label className="cursor-pointer block">
        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
            <p className="text-sm text-slate-500">上传并分析中...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4">
            <Upload className="h-8 w-8 text-violet-400" />
            <p className="text-sm font-medium text-slate-600">拖拽或点击上传题目截图</p>
            <p className="text-xs text-slate-400">支持 PNG、JPG、JPEG，上传后自动分析</p>
          </div>
        )}
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        <input
          type="file"
          accept="image/*"
          style={{ position: "absolute", width: "1px", height: "1px", padding: 0, margin: "-1px", overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", borderWidth: 0 }}
          onChange={handleFileChange}
        />
      </label>
    </Card>
  )
}
