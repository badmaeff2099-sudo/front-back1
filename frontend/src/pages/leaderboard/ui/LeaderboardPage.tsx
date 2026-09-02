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
import { useToday } from "@/shared/lib/useToday"
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
  // Реактивное «сегодня» — иначе таблица переживёт полночь со старым циклом
  const today = useToday()

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

  // Стрелка рендерится всегда (невидимой у неактивных колонок) — иначе
  // заголовок дёргается по ширине при смене колонки сортировки.
  const SortHeader = ({ label, k, className = "" }: { label: string; k: SortKey; className?: string }) => (
    <th className={`px-2 py-2.5 text-center text-xs text-muted-foreground font-medium whitespace-nowrap cursor-pointer hover:text-foreground select-none ${className}`} onClick={() => handleSort(k)}>
      {label}
      <span className={`sort-arrow ${sortKey === k ? "" : "is-idle"}`}>
        {sortKey === k && sortDir === "asc" ? "↑" : "↓"}
      </span>
    </th>
  )

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-inner">
        <Button variant="ghost" onClick={onBack} className="mb-4 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-2" /> Назад
        </Button>

        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-0.5">🏆 Рейтинг участников</h2>
              <p className="text-sm text-muted-foreground">Самые дисциплинированные участники Chainify</p>
            </div>

            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger className="h-9 w-[185px] shrink-0 bg-[#141414] border-[#252525] text-foreground">
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

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Участников", value: users.length },
              { label: "Лидер", value: bestUser?.username || "—" },
            ].map((s) => (
              <div
                key={s.label}
                className="leaderboard-stat-card px-4 py-3 flex items-baseline justify-between gap-3"
              >
                <p className="text-xs text-muted-foreground shrink-0">{s.label}</p>
                <p className="text-base font-bold text-foreground truncate">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="leaderboard-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="leaderboard-table">
                <colgroup>
                  <col className="col-place" />
                  <col className="col-user" />
                  <col className="col-cycle" />
                  <col className="col-days" />
                  <col className="col-streak" />
                  <col className="col-score" />
                </colgroup>
                <thead>
                  <tr className="border-b border-[#1e1e1e]">
                    <th className="px-4 py-2.5 text-left text-xs text-muted-foreground font-medium"></th>
                    <th className="px-4 py-2.5 text-left text-xs text-muted-foreground font-medium">Участник</th>
                    <th className="px-4 py-2.5 text-left text-xs text-muted-foreground font-medium">Цикл</th>
                    <SortHeader label="Дней" k="total_days" />
                    <SortHeader label="Серия" k="streak" />
                    <SortHeader label="Discipline Score" k="discipline_score" className="score-col" />
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-sm text-muted-foreground">
                        Нет участников в этой локации
                      </td>
                    </tr>
                  )}
                  {sortedUsers.map((user, index) => {
                    const rank = getRank(user.total_days)
                    const streak = calcStreak(user.completed_dates, user.rest_dates)
                    const score = scoreOf(user)
                    const cycle = calcCycle(user.created_at, user.completed_dates, user.rest_dates, today)
                    // Сравниваем по id — username может совпасть у разных аккаунтов.
                    const isMe = currentUser?.id === user.id
                    return (
                      <tr key={user.id} className={`leaderboard-row border-b border-[#1a1a1a] transition-colors ${isMe ? "is-me" : "hover:bg-white/[0.02]"}`}>
                        <td className="px-4 py-2.5 text-lg font-bold">{getPlace(index)}</td>
                        <td className="px-4 py-2.5">
                          <div className="leaderboard-cell flex items-center gap-2.5">
                            <UserAvatar avatarUrl={user.avatar_url} username={user.username} size={36} />
                            <div className="min-w-0">
                              {/* Бейдж вне усечения: длинный ник обрезается, «вы» остаётся виден */}
                              <p className="flex items-center gap-1.5 font-semibold text-foreground text-sm leading-tight">
                                <span className="truncate">{user.username}</span>
                                {isMe && <span className="me-badge">вы</span>}
                              </p>
                              <span className="text-[11px] px-2 py-0.5 rounded-full inline-block mt-0.5 leading-tight max-w-full truncate" style={{ background: rank.color + "22", color: rank.color }}>
                                {rank.icon} {rank.title}
                              </span>
                              {user.goal && <p className="text-xs text-muted-foreground mt-0.5 truncate">{user.goal}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="leaderboard-cell flex flex-col justify-center">
                            <div className="flex items-baseline justify-between gap-2 mb-1">
                              <p className="text-xs font-semibold text-foreground whitespace-nowrap">
                                День {cycle.dayInCycle} / {CYCLE_LENGTH}
                              </p>
                              <span className="text-[11px] text-muted-foreground shrink-0">
                                цикл {cycle.cycleNumber}
                              </span>
                            </div>
                            {/* Прогресс — по календарю цикла, а не по выполненным дням */}
                            <Progress value={(cycle.dayInCycle / CYCLE_LENGTH) * 100} className="h-1.5" />
                            <p className="text-[11px] text-muted-foreground mt-1">
                              Выполнено: {cycle.doneInCycle} · осталось: {cycle.daysLeft}
                            </p>
                          </div>
                        </td>
                        <td className="px-2 py-2.5 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-brand/10 text-brand tabular-nums">
                            <CheckCircle className="h-3 w-3" /> {user.total_days}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 tabular-nums">
                            <Flame className="h-3 w-3" /> {streak}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 text-center score-col">
                          <span
                            className={`score-badge tabular-nums ${score >= 0 ? "is-positive" : "is-negative"}`}
                          >
                            <Target className="h-3.5 w-3.5" /> {score}
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
    </div>
  )
}

export default Leaderboard
