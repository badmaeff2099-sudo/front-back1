const AVATAR_EMOJIS = ["🦊", "🐺", "🐻", "🦁", "🐯", "🐼", "🦅", "🦋", "🐉", "🦄", "🐸", "🦩"]
const AVATAR_COLORS = [
  "#1a2a4a", "#2a1a3a", "#1a3a2a", "#3a2a1a",
  "#1a3a3a", "#3a1a2a", "#2a3a1a", "#1a1a3a",
]

function getDefaultAvatar(username?: string): { emoji: string; bg: string } {
  if (!username) return { emoji: "👤", bg: "#1a1a2a" }
  let hash = 0
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash)
  const emoji = AVATAR_EMOJIS[Math.abs(hash) % AVATAR_EMOJIS.length]
  const bg = AVATAR_COLORS[Math.abs(hash >> 4) % AVATAR_COLORS.length]
  return { emoji, bg }
}

interface UserAvatarProps {
  avatarUrl?: string | null
  username?: string
  size?: number
  className?: string
}

export function UserAvatar({ avatarUrl, username, size = 40, className = "" }: UserAvatarProps) {
  const src = avatarUrl || null
  const style = { width: size, height: size, minWidth: size, minHeight: size }

  if (src) {
    return (
      <img
        src={src}
        alt="avatar"
        style={style}
        className={`rounded-full object-cover ${className}`}
      />
    )
  }

  const { emoji, bg } = getDefaultAvatar(username)
  const fontSize = Math.round(size * 0.48)

  return (
    <div
      style={{ ...style, background: bg, fontSize }}
      className={`rounded-full flex items-center justify-center border border-white/5 ${className}`}
    >
      {emoji}
    </div>
  )
}
