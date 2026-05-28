import { useState } from "react"
import ResizableSplit from "@/components/ResizableSplit"
import NavBar from "@/components/NavBar"
import ImageUploader from "@/components/ImageUploader"
import ImagePreview from "@/components/ImagePreview"
import ChatPanel from "@/components/ChatPanel"
import GeoGebraViewer from "@/components/GeoGebraViewer"
import HistoryDrawer from "@/components/HistoryDrawer"
import SettingsDialog from "@/components/SettingsDialog"

export default function WorkspacePage() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [imagePath, setImagePath] = useState<string | null>(null)
  const [ggbCommands, setGgbCommands] = useState<string[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [autoSendCount, setAutoSendCount] = useState(0)

  const handleNewSession = (id: string) => {
    setSessionId(id)
    setImagePath(null)
    setGgbCommands([])
  }

  const leftPanel = (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-slate-100">
        {!imagePath ? (
          <ImageUploader sessionId={sessionId} onUploaded={setImagePath} onSessionCreated={handleNewSession} onAutoAnalyze={() => setAutoSendCount(c => c + 1)} />
        ) : (
          <ImagePreview imagePath={imagePath} onRemove={() => setImagePath(null)} />
        )}
      </div>
      <div className="flex-1 min-h-0">
        <ChatPanel
          sessionId={sessionId}
          onSessionCreated={handleNewSession}
          onGgbCommands={setGgbCommands}
          autoSendTrigger={autoSendCount}
        />
      </div>
    </div>
  )

  const rightPanel = <GeoGebraViewer commands={ggbCommands} />

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <NavBar onToggleHistory={() => setHistoryOpen(!historyOpen)} onToggleSettings={() => setSettingsOpen(true)} />
      <div className="flex-1 min-h-0">
        <ResizableSplit left={leftPanel} right={rightPanel} />
      </div>
      <HistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} onSelectSession={handleNewSession} />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
