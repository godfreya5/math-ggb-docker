import { useState } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface Props {
  onSend: (message: string) => Promise<void>
  disabled?: boolean
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    try {
      await onSend(input.trim())
      setInput("")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex gap-2 p-3 border-t border-slate-100 bg-white">
      <Textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="输入问题或指令..."
        disabled={disabled}
        rows={2}
        className="rounded-xl resize-none text-sm"
      />
      <Button
        onClick={handleSend}
        disabled={disabled || !input.trim() || sending}
        size="icon"
        className="rounded-xl bg-violet-600 hover:bg-violet-700 shrink-0 self-end h-10 w-10"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  )
}
