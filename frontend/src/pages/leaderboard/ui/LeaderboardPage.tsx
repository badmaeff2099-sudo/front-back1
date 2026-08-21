import { useEffect, useState } from "react"
import { ArrowLeft, Flame, CheckCircle, Target, MapPin } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Progress } from "@/shared/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { getLeaderboard } from "@/shared/api/client"
import { getRank } from "@/entities/rank/model/ranks"
import { UserAvatar } from "@/entities/user/ui/UserAvatar"
import { calcStreak } from "@/shared/lib/streak"
import { calcDisciplineScore } from "@/shared/lib/discipline"
import { calcCycle, CYCLE_LENGTH } from "@/shared/lib/cycle"
import type { User as UserType } from "@/entities/user/model/types"
import "./LeaderboardPage.css"

interface LeaderboardUser extends UserType {
  total_days: number
  streak?: number
  rest_dates?: string[]
  discipline_score?: number
}

interface LeaderboardProps {
  currentUser?: UserType | null
  onBack: () => void
}

type SortKey = "total_days" | "streak" | "discipline_score"

// Значение-заглушка: Radix Select не разрешает пустую строку как value.
const ALL_LOCATIONS = "__all__"

function Leaderboard({ currentUser, onBack }: LeaderboardProps) {
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [location, setLocation] = useState<string>(ALL_LOCATIONS)
  const [sortKey, setSortKey] = useState<SortKey>("total_days")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  useEffect(() => { loadLeaderboard(location) }, [location])

  const loadLeaderboard = async (loc: string) => {
    try {
      const res = await getLeaderboard(loc === ALL_LOCATIONS ? "" : loc)
      if (res.success) {
        setUsers(res.users)
        // Полный список локаций приходит независимо от фильтра,
        // поэтому меню не схлопывается после выбора города.
        if (Array.isArray(res.locations)) setLocations(res.locations)
      }
    } catch (e) { console.error(e) }
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "desc" ? "asc" : "desc")
    else { setSortKey(key); setSortDir("desc") }
  }

  // Считаем на клиенте из completed_dates/rest_dates — так число всегда
  // актуально и совпадает с дашбордом, даже если ответ сервера закэширован.
  const scoreOf = (u: LeaderboardUser) =>
    calcDisciplineScore(u.completed_dates, u.rest_dates, u.created_at)

  const valueOf = (u: LeaderboardUser, key: SortKey): number => {
    if (key === "streak") return calcStreak(u.completed_dates, u.rest_dates)
    if (key === "discipline_score") return scoreOf(u)
    return (u[key] as number) ?? 0
  }

  const sortedUsers = [...users].sort((a, b) => {
    const av = valueOf(a, sortKey)
    const bv = valueOf(b, sortKey)
    return sortDir === "desc" ? bv - av : av - bv
  })

  // Лидер — первый по текущей сортировке в пределах выбранной локации.
  const bestUser = sortedUsers[0]

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
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">🏆 Рейтинг участников</h2>
            <p className="text-sm text-muted-foreground">Самые дисциплинированные участники Chainify</p>
          </div>

          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="h-9 w-[190px] shrink-0 bg-[#141414] border-[#252525] text-foreground">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Все локации" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_LOCATIONS}>Все локации</SelectItem>
              {locations.map(loc => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { label: "Участников", value: users.length },
            { label: "Лидер", value: bestUser?.username || "—" },
          ].map((s) => (
            <div key={s.label} className="leaderboard-stat-card p-5 text-center">
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
                  <SortHeader label="Discipline Score" k="discipline_score" />
                </tr>
              </thead>
              <tbody>
                {sortedUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      Нет участников в этой локации
                    </td>
                  </tr>
                )}
                {sortedUsers.map((user, index) => {
                  const rank = getRank(user.total_days)
                  const streak = calcStreak(user.completed_dates, user.rest_dates)
                  const score = scoreOf(user)
                  const cycle = calcCycle(user.created_at, user.completed_dates, user.rest_dates)
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
                        <div className="min-w-[150px]">
                          <div className="flex items-baseline justify-between gap-2 mb-1">
                            <p className="text-xs font-semibold text-foreground">
                              День {cycle.dayInCycle} / {CYCLE_LENGTH}
                            </p>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              цикл {cycle.cycleNumber}
                            </span>
                          </div>
                          {/* Прогресс — по календарю цикла, а не по выполненным дням */}
                          <Progress value={(cycle.dayInCycle / CYCLE_LENGTH) * 100} className="h-1.5" />
                          <p className="text-xs text-muted-foreground mt-1">
                            Выполнено: {cycle.doneInCycle} · осталось дней: {cycle.daysLeft}
                          </p>
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
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold tabular-nums ${
                            score >= 0 ? "bg-brand/10 text-brand" : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          <Target className="h-3 w-3" /> {score}
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
