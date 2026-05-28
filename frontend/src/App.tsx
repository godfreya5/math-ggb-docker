import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import LoginPage from '@/pages/LoginPage'
import WorkspacePage from '@/pages/WorkspacePage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()
  if (token) return <Navigate to="/workspace" replace />
  return <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/workspace" element={<ProtectedRoute><WorkspacePage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/workspace" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
