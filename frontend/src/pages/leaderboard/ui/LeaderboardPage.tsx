import { useEffect, useState } from "react"
import { ArrowLeft, Trophy, Flame, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { Progress } from "@/shared/ui/progress"
import { Separator } from "@/shared/ui/separator"
import { getLeaderboard } from "@/shared/api/client"
import { getRank, RANKS } from "@/entities/rank/model/ranks"
import { UserAvatar } from "@/entities/user/ui/UserAvatar"
import { calcStreak } from "@/shared/lib/streak"
import type { User as UserType } from "@/entities/user/model/types"
import "./LeaderboardPage.css"

interface LeaderboardUser extends UserType {
  total_days: number
  missed_days: number
  streak?: number
  rest_dates?: string[]
}

type SortKey = "total_days" | "streak" | "missed_days"

function Leaderboard({ currentUser, onBack }: LeaderboardProps) {
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [sortKey, setSortKey] = useState<SortKey>("total_days")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  useEffect(() => { loadLeaderboard() }, [])

  const loadLeaderboard = async () => {
    try {
      const res = await getLeaderboard()
      if (res.success) setUsers(res.users)
    } catch (e) { console.error(e) }
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "desc" ? "asc" : "desc")
    else { setSortKey(key); setSortDir("desc") }
  }

  const sortedUsers = [...users].sort((a, b) => {
    let av = sortKey === "streak" ? calcStreak(a.completed_dates, a.rest_dates) : a[sortKey] ?? 0
    let bv = sortKey === "streak" ? calcStreak(b.completed_dates, b.rest_dates) : b[sortKey] ?? 0
    return sortDir === "desc" ? (bv as number) - (av as number) : (av as number) - (bv as number)
  })

  const totalDays = users.reduce((s, u) => s + u.total_days, 0)
  const bestUser = users[0]

  const getPlace = (i: number) => i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`

  const SortHeader = ({ label, k }: { label: string; k: SortKey }) => (
    <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium cursor-pointer hover:text-foreground select-none" onClick={() => handleSort(k)}>
      {label} {sortKey === k ? (sortDir === "desc" ? "↓" : "↑") : ""}
    </th>
  )

  return (
    <div className="leaderboard-page">
      <Button variant="ghost" onClick={onBack} className="mb-5 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-2" /> Назад
      </Button>

      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">🏆 Рейтинг участников</h2>
          <p className="text-sm text-muted-foreground">Самые дисциплинированные участники Chainify</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: "Участников", value: users.length },
            { label: "Всего выполнено", value: totalDays },
            { label: "Лидер", value: bestUser?.username || "—" },
          ].map((s) => (
            <div key={s.label} className="leaderboard-stat-card p-5">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="leaderboard-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e1e1e]">
                  <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium w-16"></th>
                  <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium">Участник</th>
                  <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium">Цикл</th>
                  <SortHeader label="Дней" k="total_days" />
                  <SortHeader label="Серия" k="streak" />
                  <SortHeader label="Пропущено" k="missed_days" />
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((user, index) => {
                  const rank = getRank(user.total_days)
                  const streak = calcStreak(user.completed_dates, user.rest_dates)
                  const cycle = user.total_days === 0 ? 0 : user.total_days % 30 || 30
                  const isMe = currentUser?.username === user.username
                  return (
                    <tr key={user.id} className={`border-b border-[#1a1a1a] hover:bg-white/[0.02] transition-colors ${isMe ? "bg-brand/5" : ""}`}>
                      <td className="px-4 py-3 text-xl font-bold">{getPlace(index)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar avatarUrl={user.avatar_url} username={user.username} size={40} />
                          <div>
                            <p className="font-semibold text-foreground text-sm">{user.username}</p>
                            <span className="text-xs px-2 py-0.5 rounded-full inline-block mt-0.5" style={{ background: rank.color + "22", color: rank.color }}>
                              {rank.icon} {rank.title}
                            </span>
                            {user.goal && <p className="text-xs text-muted-foreground mt-0.5">{user.goal}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="min-w-[140px]">
                          <p className="text-xs font-semibold text-foreground mb-1">{cycle} / 30</p>
                          <Progress value={(cycle / 30) * 100} className="h-1.5" />
                          <p className="text-xs text-muted-foreground mt-1">Осталось: {30 - cycle}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-brand/10 text-brand">
                          <CheckCircle className="h-3 w-3" /> {user.total_days}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400">
                          <Flame className="h-3 w-3" /> {streak}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400">
                          <XCircle className="h-3 w-3" /> {user.missed_days}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Leaderboard
