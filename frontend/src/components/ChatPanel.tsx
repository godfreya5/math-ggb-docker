import { useState, useEffect, useRef, useCallback } from "react"
import { Loader2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import ChatInput from "@/components/ChatInput"
import LatexContent from "@/components/LatexContent"
import { sessions } from "@/lib/api"
import type { Message } from "@/types"

interface Props {
  sessionId: string | null
  onSessionCreated: (id: string) => void
  onGgbCommands: (cmds: string[]) => void
  autoSendTrigger?: number
}

export default function ChatPanel({ sessionId, onSessionCreated, onGgbCommands, autoSendTrigger }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevTrigger = useRef<number | undefined>(autoSendTrigger)
  const prevSessionId = useRef<string | null>(null)

  // Collect GGB commands from all messages in history
  const collectCommands = useCallback((msgs: Message[]): string[] => {
    return msgs.flatMap(m => m.ggb_commands || [])
  }, [])

  // Load messages when session changes
  useEffect(() => {
    if (sessionId && sessionId !== prevSessionId.current) {
      prevSessionId.current = sessionId
      sessions.messages(sessionId).then(msgs => {
        setMessages(msgs)
        onGgbCommands(collectCommands(msgs))
      }).catch(() => {})
    } else if (!sessionId) {
      prevSessionId.current = null
      setMessages([])
      onGgbCommands([])
    }
  }, [sessionId, onGgbCommands, collectCommands])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Auto-analyze after image upload
  useEffect(() => {
    if (autoSendTrigger !== undefined && autoSendTrigger !== prevTrigger.current && sessionId) {
      prevTrigger.current = autoSendTrigger
      handleSend("请仔细观察这张题目图片中的几何图形，用 GeoGebra 代码精确复现它。先列出图中的点和几何关系，再生成代码。如果是立体图形请用 3D 命令。")
    }
  }, [autoSendTrigger])

  const handleSend = async (text: string) => {
    let sid = sessionId
    if (!sid) {
      try {
        const s = await sessions.create()
        sid = s.id
        onSessionCreated(sid)
        prevSessionId.current = sid
      } catch (err: any) {
        alert(err.message || "创建会话失败")
        return
      }
    }
    if (!sid) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      ggb_commands: null,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await sessions.chat(sid, text)
      const aiMsg: Message = {
        id: res.message.id,
        role: "ai",
        content: res.reply,
        ggb_commands: res.ggb_commands,
        created_at: res.message.created_at,
      }
      setMessages(prev => {
        const updated = prev.filter(m => m.id !== userMsg.id).concat([userMsg, aiMsg])
        // Accumulate GGB commands across all messages in this conversation
        onGgbCommands(collectCommands(updated))
        return updated
      })
    } catch (err: any) {
      setMessages(prev => prev.filter(m => m.id !== userMsg.id))
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 px-4 py-4">
        {messages.length === 0 && !loading && (
          <div className="text-center text-slate-400 mt-8">
            <p className="text-3xl mb-2">📐</p>
            <p className="text-sm">上传题目截图，AI 将自动分析并生成图形</p>
          </div>
        )}
        <div className="space-y-3">
          {messages.map(msg => (
            <Card
              key={msg.id}
              className={`p-3 rounded-2xl max-w-[90%] text-sm leading-relaxed ${
                msg.role === "user"
                  ? "ml-auto bg-violet-600 text-white border-0"
                  : "mr-auto bg-white border-slate-200"
              }`}
            >
              {msg.role === "user" ? (
                msg.content
              ) : (
                <LatexContent text={msg.content} />
              )}
            </Card>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-slate-400 text-sm pl-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              AI 思考中...
            </div>
          )}
        </div>
        <div ref={bottomRef} />
      </ScrollArea>
      <ChatInput onSend={handleSend} disabled={loading} />
    </div>
  )
}
