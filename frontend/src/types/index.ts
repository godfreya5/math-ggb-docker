export interface User {
  id: string
  username: string
  email: string
  created_at: string
}

export interface Session {
  id: string
  title: string
  image_path: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  role: "user" | "ai"
  content: string
  ggb_commands: string[] | null
  created_at: string
}

export interface ChatResponse {
  reply: string
  ggb_commands: string[] | null
  message: Message
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: User
}
