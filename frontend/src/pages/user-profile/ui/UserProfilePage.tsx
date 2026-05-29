import { ArrowLeft, Trophy, MapPin, Calendar, Flame } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { Progress } from "@/shared/ui/progress"
import { Separator } from "@/shared/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"
import { getRank, RANKS } from "@/entities/rank/model/ranks"
import { UserAvatar } from "@/entities/user/ui/UserAvatar"
import { FriendButton } from "@/features/friends/ui/FriendButton"
import type { User as UserType } from "@/entities/user/model/types"

const DAYS_TO_SHOW = 30

interface UserProfileProps {
  user: UserType
  currentUser: UserType
  onBack: () => void
}

function calculateCurrentStreak(dates: string[], todayDate: Date): number {
  if (!dates.length) return 0
  let streak = 0
  const check = new Date(todayDate)
  while (true) {
    const s = check.toLocaleDateString("sv-SE")
    if (dates.includes(s)) { streak++; check.setDate(check.getDate() - 1) }
    else break
  }
  return streak
}

function getLongestStreak(dates: string[]): number {
  if (!dates.length) return 0
  const sorted = [...dates].sort()
  let longest = 1, current = 1
  for (let i = 1; i < sorted.length; i++) {
    const diff = (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86400000
    if (diff === 1) { current++; longest = Math.max(longest, current) } else current = 1
  }
  return longest
}

export default function UserProfile({ user, currentUser, onBack }: UserProfileProps) {
  const completedDates = Array.from(new Set(
    (user?.completed_dates || []).filter(Boolean).map(d => { const x = new Date(d); x.setHours(0,0,0,0); return x.toLocaleDateString("sv-SE") })
  )).sort()

  const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0)
  const today = todayDate.toLocaleDateString("sv-SE")
  const createdAt = user.created_at ? new Date(user.created_at + "T00:00:00") : new Date()
  createdAt.setHours(0, 0, 0, 0)

  const completedDays = completedDates.length
  const todayCompleted = completedDates.includes(today)
  const passedDays = Math.floor((todayDate.getTime() - createdAt.getTime()) / 86400000)
  const missedDays = Math.max(0, passedDays - completedDays + (todayCompleted ? 1 : 0))
  const totalCycleDays = completedDays + missedDays
  const currentCycleDays = totalCycleDays === 0 ? 0 : totalCycleDays % DAYS_TO_SHOW || DAYS_TO_SHOW
  const progressPercent = (currentCycleDays / DAYS_TO_SHOW) * 100

  const currentStreak = calculateCurrentStreak(completedDates, todayDate)
  const longestStreak = getLongestStreak(completedDates)
  const rank = getRank(completedDays)
  const rankPercent = Math.min((completedDays / 365) * 100, 100)

  const currentRankIndex = RANKS.findIndex(r => r.title === rank.title)
  const nextRank = RANKS[currentRankIndex + 1] || RANKS[currentRankIndex]
  const currentRankMin = RANKS[currentRankIndex]?.days || 0
  const nextRankDays = nextRank.days
  const rankProgress = nextRankDays === currentRankMin ? 100 : ((completedDays - currentRankMin) / (nextRankDays - currentRankMin)) * 100
  const daysLeftToRank = Math.max(0, nextRankDays - completedDays)

  const ranks = RANKS

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" onClick={onBack} className="mb-5 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-2" /> Назад
        </Button>

        {/* Rank progress card */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-lg p-6 mb-5">
          <div className="flex justify-between items-center mb-3 flex-wrap gap-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Ранг пользователя</h3>
              <p className="text-sm text-muted-foreground">Продвижение от Пыли до Абсолюта</p>
            </div>
            <span className="px-3 py-1 rounded-full text-sm font-bold" style={{ background: rank.color + "22", color: rank.color }}>
              {rank.icon} {rank.title}
            </span>
          </div>
          <Progress value={Math.round(rankPercent)} className="h-2 mb-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{completedDays} / 365 дней</span>
            <span>{Math.round(rankPercent)}%</span>
          </div>
          {/* Rank icons row */}
          <div className="overflow-x-auto mt-5">
            <div className="flex gap-3 min-w-max pb-2">
              {ranks.map((item) => {
                const unlocked = completedDays >= item.days
                return (
                  <div key={item.title} className={`flex flex-col items-center gap-1 min-w-[70px] transition-opacity ${unlocked ? "opacity-100" : "opacity-30"}`}>
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl"
                      style={{ background: unlocked ? item.color + "33" : "#1a1a1a", border: rank.title === item.title ? `2px solid ${item.color}` : "2px solid transparent" }}>
                      {item.icon}
                    </div>
                    <span className="text-[10px] font-semibold text-foreground text-center leading-tight">{item.title}</span>
                    <span className="text-[10px] text-muted-foreground">{item.days}д.</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: user info */}
          <div className="bg-[#111] border border-[#1e1e1e] rounded-lg p-6 flex flex-col items-center gap-4">
            <UserAvatar avatarUrl={user.avatar_url} username={user.username} size={128} />
            <div className="text-center flex flex-col items-center gap-3">
              <div>
                <h2 className="text-xl font-bold text-foreground capitalize">{user.username}</h2>
                {user.nickname && <p className="text-sm text-muted-foreground mt-0.5">@{user.nickname}</p>}
              </div>
              <span className="px-3 py-1 rounded-full text-sm font-semibold" style={{ background: rank.color + "22", color: rank.color }}>
                {rank.icon} {rank.title}
              </span>
              {Number(currentUser.id) !== Number(user.id) && (
                <FriendButton currentUser={currentUser} targetUser={user} />
              )}
            </div>
            {user.goal && (
              <div className="w-full bg-[#1a1a1a] rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Цель</p>
                <p className="text-sm font-semibold text-foreground">{user.goal}</p>
              </div>
            )}
            {user.location && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" /> {user.location}
              </span>
            )}
          </div>

          {/* Right: stats */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Next rank progress */}
            <div className="bg-[#111] border border-[#1e1e1e] rounded-lg p-5">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-xs text-muted-foreground">Ранг</p>
                  <p className="text-lg font-bold" style={{ color: rank.color }}>{rank.icon} {rank.title}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Следующий ранг</p>
                  <p className="text-sm font-semibold text-foreground">{nextRank.icon} {nextRank.title}</p>
                </div>
              </div>
              <Progress value={Math.round(rankProgress)} className="h-2 mb-2" />
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-foreground">{completedDays} дней</span>
                <span className="text-muted-foreground">Осталось {daysLeftToRank} дней</span>
              </div>
            </div>

            {/* Cycle progress */}
            <div className="bg-[#111] border border-[#1e1e1e] rounded-lg p-5">
              <h4 className="font-semibold text-foreground mb-1">Прогресс текущего цикла</h4>
              <p className="text-xs text-muted-foreground mb-3">Учитываются выполненные и пропущенные дни</p>
              <Progress value={Math.round(progressPercent)} className="h-2 mb-2" />
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-foreground">{currentCycleDays} / {DAYS_TO_SHOW} дней</span>
                <span className="text-muted-foreground">{Math.round(progressPercent)}%</span>
              </div>

              <Separator className="my-4 bg-[#1e1e1e]" />

              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <Calendar className="h-5 w-5" />, title: "Всего отмечено", value: completedDays },
                  { icon: <Flame className="h-5 w-5" />, title: "Пропущено дней", value: missedDays },
                  { icon: <Trophy className="h-5 w-5" />, title: "Рекордная серия", value: `${longestStreak} дней` },
                  { icon: <Flame className="h-5 w-5" />, title: "Текущая серия", value: `${currentStreak} дней` },
                ].map((s) => (
                  <div key={s.title} className="bg-[#1a1a1a] rounded-lg p-4 flex items-center gap-3">
                    <span className="text-muted-foreground">{s.icon}</span>
                    <div>
                      <p className="text-xs text-muted-foreground">{s.title}</p>
                      <p className="text-base font-bold text-foreground">{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity history */}
            <div className="bg-[#111] border border-[#1e1e1e] rounded-lg p-5">
              <h4 className="font-semibold text-foreground mb-1">История активности</h4>
              <p className="text-xs text-muted-foreground mb-4">Зелёные — выполненные дни. Красные — пропущенные.</p>
              <div className="flex gap-1.5 flex-wrap">
                {[...Array(DAYS_TO_SHOW)].map((_, index) => {
                  const cellDate = new Date(createdAt); cellDate.setDate(createdAt.getDate() + index); cellDate.setHours(0, 0, 0, 0)
                  const dateStr = cellDate.toLocaleDateString("sv-SE")
                  const isToday = dateStr === today
                  const isCompleted = completedDates.includes(dateStr)
                  let color = "#1e1e1e"
                  if (cellDate > todayDate) color = "#1e1e1e"
                  else if (isCompleted) color = "#22c55e"
                  else if (cellDate < todayDate) color = "#ef4444"
                  else color = "#2a2a2a"
                  return (
                    <Tooltip key={index}>
                      <TooltipTrigger>
                        <div className="w-5 h-5 rounded-sm transition-all" style={{ backgroundColor: color, border: isToday ? "2px solid #faad14" : "none" }} />
                      </TooltipTrigger>
                      <TooltipContent><p>{dateStr}</p></TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-[#111] border border-[#1e1e1e] rounded-lg p-5">
              <h4 className="font-semibold text-foreground mb-4">Достижения</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { done: completedDays >= 1, text: "Первый шаг" },
                  { done: completedDays >= 7, text: "7 дней" },
                  { done: completedDays >= 30, text: "30 дней" },
                  { done: completedDays >= 100, text: "100 дней" },
                  { done: completedDays >= 365, text: "Год дисциплины" },
                ].map((a) => (
                  <Badge key={a.text} variant={a.done ? "default" : "outline"}
                    className={`px-3 py-1.5 text-sm ${a.done ? "bg-brand/20 text-brand border-brand/30" : "border-[#252525] text-muted-foreground"}`}>
                    {a.done ? "🏆" : "🔒"} {a.text}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
