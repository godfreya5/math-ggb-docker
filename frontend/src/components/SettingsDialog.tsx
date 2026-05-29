import { useState, useEffect } from "react"
import { X, Loader2, RotateCcw, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { admin } from "@/lib/api"

interface LLMConfig {
  provider: string
  api_key: string
  base_url: string
  model: string
}

const PRESETS: Record<string, Omit<LLMConfig, "api_key">> = {
  zhipu: {
    provider: "zhipu",
    base_url: "https://open.bigmodel.cn/api/paas/v4/",
    model: "glm-4v",
  },
  deepseek: {
    provider: "deepseek",
    base_url: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
  },
  qwen: {
    provider: "qwen",
    base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen-vl-plus",
  },
  mimo: {
    provider: "mimo",
    base_url: "https://api.xiaomimimo.com/v1",
    model: "mimo-v2-flash",
  },
}

export default function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [config, setConfig] = useState<LLMConfig>({ provider: "", api_key: "", base_url: "", model: "" })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setMessage("")
    admin
      .getLLMConfig()
      .then(setConfig)
      .catch(() => setMessage("加载配置失败"))
      .finally(() => setLoading(false))
  }, [open])

  const applyPreset = (name: string) => {
    const preset = PRESETS[name]
    if (!preset) return
    setConfig(prev => ({ ...prev, ...preset, provider: preset.provider }))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage("")
    try {
      const updated = await admin.updateLLMConfig(config)
      setConfig(updated)
      setMessage("保存成功")
    } catch (err: any) {
      setMessage(err.message || "保存失败")
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    setSaving(true)
    setMessage("")
    try {
      const updated = await admin.resetLLMConfig()
      setConfig(updated)
      setMessage("已恢复默认设置")
    } catch (err: any) {
      setMessage(err.message || "重置失败")
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <Card
        className="w-full max-w-lg mx-4 p-6 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-violet-600" />
            <h2 className="text-lg font-semibold text-slate-800">AI 模型设置</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 text-violet-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* Preset selector */}
            <div className="mb-5">
              <label className="text-xs font-medium text-slate-500 mb-2 block">预设提供商</label>
              <div className="flex gap-2 flex-wrap">
                {Object.keys(PRESETS).map(name => (
                  <button
                    key={name}
                    onClick={() => applyPreset(name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                      config.provider === name
                        ? "bg-violet-100 text-violet-700 border border-violet-300"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent"
                    }`}
                  >
                    {name === "zhipu" ? "智谱 GLM" : name === "deepseek" ? "DeepSeek" : name === "qwen" ? "通义千问" : name === "mimo" ? "小米MiMo" : name}
                  </button>
                ))}
              </div>
            </div>

            {/* Form fields */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">提供商标识</label>
                <Input
                  value={config.provider}
                  onChange={e => setConfig(p => ({ ...p, provider: e.target.value }))}
                  placeholder="如 zhipu、deepseek、qwen、mimo"
                  className="rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">API Key</label>
                <Input
                  type="password"
                  value={config.api_key}
                  onChange={e => setConfig(p => ({ ...p, api_key: e.target.value }))}
                  placeholder="输入 API Key"
                  className="rounded-xl text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Base URL</label>
                <Input
                  value={config.base_url}
                  onChange={e => setConfig(p => ({ ...p, base_url: e.target.value }))}
                  placeholder="https://api.example.com/v1"
                  className="rounded-xl text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">模型名称</label>
                <Input
                  value={config.model}
                  onChange={e => setConfig(p => ({ ...p, model: e.target.value }))}
                  placeholder="如 glm-4v、deepseek-chat、mimo-v2-flash"
                  className="rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Message */}
            {message && (
              <p className={`text-sm mt-4 ${message.includes("失败") ? "text-red-500" : "text-green-600"}`}>
                {message}
              </p>
            )}

            {/* Actions */}
            <div className="flex justify-between mt-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={saving}
                className="rounded-xl text-xs gap-1 h-8"
              >
                <RotateCcw className="h-3 w-3" />
                恢复默认
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl text-xs h-8">
                  取消
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving} className="rounded-xl text-xs h-8 bg-violet-600 hover:bg-violet-700">
                  {saving && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                  保存
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
