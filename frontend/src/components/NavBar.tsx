import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { LogOut, Menu, Settings } from "lucide-react"

interface Props {
  onToggleHistory: () => void
  onToggleSettings: () => void
}

export default function NavBar({ onToggleHistory, onToggleSettings }: Props) {
  const { user, logout } = useAuth()

  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onToggleHistory} className="rounded-xl">
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-lg font-semibold text-violet-900">📐 数学备课助手</span>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onToggleSettings} className="rounded-xl text-slate-400 hover:text-violet-600" title="AI 模型设置">
          <Settings className="h-4 w-4" />
        </Button>
        <span className="text-sm text-slate-500">{user?.username || "教师"}</span>
        <Button variant="ghost" size="icon" onClick={logout} className="rounded-xl text-slate-400 hover:text-red-500">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
