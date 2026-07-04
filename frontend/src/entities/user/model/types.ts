export interface User {
  id: number
  username: string
  nickname?: string
  email?: string
  fullName?: string
  bio?: string
  location?: string
  goal?: string
  daily_actions?: string
  completed_dates: string[]
  rest_dates?: string[]
  created_at?: string
  joinDate?: string
  avatar_url?: string
}

export interface Message {
  id: number
  username: string
  message: string
  created_at: string
}

export interface Reaction {
  emoji: string
  from_username: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  error?: string
  data?: T
}
