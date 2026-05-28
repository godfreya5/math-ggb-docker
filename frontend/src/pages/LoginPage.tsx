import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const { login, register } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      if (isRegister) {
        await register(username, email, password)
      } else {
        await login(email, password)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      <Card className="w-full max-w-md mx-4 shadow-lg rounded-2xl border-0">
        <CardHeader className="text-center pb-6">
          <div className="text-4xl mb-3">📐</div>
          <CardTitle className="text-2xl font-bold text-violet-900">数学备课助手</CardTitle>
          <CardDescription className="text-slate-500">
            {isRegister ? "创建新账号" : "登录你的账号"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="text-sm font-medium text-slate-700">用户名</label>
                <Input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  required
                  className="mt-1 rounded-xl"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-slate-700">邮箱</label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="请输入邮箱"
                required
                className="mt-1 rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">密码</label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="请输入密码"
                required
                className="mt-1 rounded-xl"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-violet-600 hover:bg-violet-700"
            >
              {loading ? "处理中..." : isRegister ? "注册" : "登录"}
            </Button>
          </form>
          <p className="text-center mt-4 text-sm text-slate-500">
            {isRegister ? "已有账号？" : "没有账号？"}
            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError("") }}
              className="ml-1 text-violet-600 hover:underline font-medium"
            >
              {isRegister ? "去登录" : "去注册"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
