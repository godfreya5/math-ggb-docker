import { useState, useEffect } from "react"
import { X, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { sessions } from "@/lib/api"
import type { Session } from "@/types"

interface Props {
  open: boolean
  onClose: () => void
  onSelectSession: (id: string) => void
}

export default function HistoryDrawer({ open, onClose, onSelectSession }: Props) {
  const [items, setItems] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setLoading(true)
      sessions.list().then(setItems).catch(() => {}).finally(() => setLoading(false))
    }
  }, [open])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await sessions.delete(id)
    setItems(prev => prev.filter(s => s.id !== id))
  }

  const handleNew = async () => {
    const s = await sessions.create()
    setItems(prev => [s, ...prev])
    onSelectSession(s.id)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-80 bg-white shadow-xl rounded-r-2xl flex flex-col animate-in slide-in-from-left">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">备课历史</h3>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={handleNew} className="rounded-xl h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-1">
          {loading ? (
            <p className="text-sm text-slate-400 text-center py-8">加载中...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">暂无历史记录</p>
          ) : (
            <div className="p-2 space-y-1">
              {items.map(s => (
                <div
                  key={s.id}
                  onClick={() => { onSelectSession(s.id); onClose() }}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 cursor-pointer group transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700 truncate">{s.title}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(s.updated_at).toLocaleDateString("zh-CN")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={e => handleDelete(s.id, e)}
                    className="rounded-full h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
