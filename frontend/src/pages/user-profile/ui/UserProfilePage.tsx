import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Trophy, MapPin, Calendar, Flame, Target, Moon } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Progress } from "@/shared/ui/progress";
import { Separator } from "@/shared/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { getRank, RANKS } from "@/entities/rank/model/ranks";
import { UserAvatar } from "@/entities/user/ui/UserAvatar";
import { FriendButton } from "@/features/friends/ui/FriendButton";
import { calcStreak, calcLongestStreak } from "@/shared/lib/streak";
import { calcDiscipline } from "@/shared/lib/discipline";
import {
  calcCycle,
  buildCycleSlots,
  CYCLE_LENGTH,
  type CycleSlotState,
} from "@/shared/lib/cycle";
import { useToday } from "@/shared/lib/useToday";
import { getProgress } from "@/shared/api/client";
import type { User as UserType } from "@/entities/user/model/types";

/** Оформление ячейки истории активности по состоянию дня цикла */
const SLOT_STYLE: Record<
  CycleSlotState,
  { color: string; label: string; legend: string }
> = {
  done: { color: "#22c55e", label: "Выполнено", legend: "Выполнено" },
  rest: { color: "#eab308", label: "Выходной", legend: "Выходной" },
  missed: { color: "#ef4444", label: "Пропущено", legend: "Пропущено" },
  today: {
    color: "#2a2a2a",
    label: "Сегодня — ещё не отмечено",
    legend: "Сегодня",
  },
  future: { color: "#1e1e1e", label: "Ещё не наступил", legend: "Впереди" },
};

/** "2025-09-02" → "2 сент." */
function formatShort(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
}

/** Уникальные даты в формате "YYYY-MM-DD", по возрастанию */
function normalizeDates(dates?: string[]): string[] {
  return Array.from(
    new Set((dates || []).filter(Boolean).map((d) => d.slice(0, 10))),
  ).sort();
}

interface UserProfileProps {
  user: UserType;
  currentUser: UserType;
  onBack: () => void;
}

export default function UserProfile({
  user,
  currentUser,
  onBack,
}: UserProfileProps) {
  // Сегодня как реактивное значение: в момент окончания цикла страница
  // сама пересчитает окно и покажет новый цикл без перезагрузки.
  const today = useToday();

  // Прогресс приходит из списка участников и может быть устаревшим
  // (список грузится один раз). Для актуального цикла тянем прогресс
  // просматриваемого пользователя с сервера — и заново при смене суток.
  const [progress, setProgress] = useState<{
    completed_dates: string[];
    rest_dates: string[];
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setProgress(null);
    getProgress(user.id)
      .then((res) => {
        if (cancelled || !res.success) return;
        setProgress({
          completed_dates: res.completed_dates ?? [],
          rest_dates: res.rest_dates ?? [],
        });
      })
      .catch(() => {
        // Сеть недоступна — остаёмся на данных из пропсов.
      });
    return () => {
      cancelled = true;
    };
  }, [user.id, today]);

  const completedDates = useMemo(
    () => normalizeDates(progress?.completed_dates ?? user.completed_dates),
    [progress, user.completed_dates],
  );
  const restDates = useMemo(
    () => normalizeDates(progress?.rest_dates ?? user.rest_dates),
    [progress, user.rest_dates],
  );

  const completedDays = completedDates.length;

  // Discipline Score — отдельный показатель, на цикл не влияет
  const discipline = calcDiscipline(completedDates, restDates, user.created_at);

  // Единая логика цикла — та же, что на дашборде и в рейтинге
  const cycle = useMemo(
    () => calcCycle(user.created_at, completedDates, restDates, today),
    [user.created_at, completedDates, restDates, today],
  );
  const slots = useMemo(
    () => buildCycleSlots(user.created_at, completedDates, restDates, today),
    [user.created_at, completedDates, restDates, today],
  );
  const progressPercent = (cycle.dayInCycle / CYCLE_LENGTH) * 100;

  const currentStreak = calcStreak(completedDates, restDates);
  const longestStreak = calcLongestStreak(completedDates, restDates);
  const rank = getRank(completedDays);
  const rankPercent = Math.min((completedDays / 365) * 100, 100);

  const currentRankIndex = RANKS.findIndex((r) => r.title === rank.title);
  const nextRank = RANKS[currentRankIndex + 1] || RANKS[currentRankIndex];
  const currentRankMin = RANKS[currentRankIndex]?.days || 0;
  const nextRankDays = nextRank.days;
  const rankProgress =
    nextRankDays === currentRankMin
      ? 100
      : ((completedDays - currentRankMin) / (nextRankDays - currentRankMin)) *
        100;
  const daysLeftToRank = Math.max(0, nextRankDays - completedDays);

  const ranks = RANKS;

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="max-w-5xl mx-auto">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Назад
        </Button>

        {/* Rank progress card */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-lg p-6 mb-5">
          <div className="flex justify-between items-center mb-3 flex-wrap gap-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Ранг пользователя
              </h3>
              <p className="text-sm text-muted-foreground">
                Продвижение от Пыли до Абсолюта
              </p>
            </div>
            <span
              className="px-3 py-1 rounded-full text-sm font-bold"
              style={{ background: rank.color + "22", color: rank.color }}
            >
              {rank.icon} {rank.title}
            </span>
          </div>
          <Progress value={Math.round(rankPercent)} className="h-2 mb-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">
              {completedDays} / 365 дней
            </span>
            <span>{Math.round(rankPercent)}%</span>
          </div>
          {/* Rank icons row */}
          <div className="overflow-x-auto mt-5">
            <div className="flex gap-3 min-w-max pb-2">
              {ranks.map((item) => {
                const unlocked = completedDays >= item.days;
                return (
                  <div
                    key={item.title}
                    className={`flex flex-col items-center gap-1 min-w-[70px] transition-opacity ${unlocked ? "opacity-100" : "opacity-30"}`}
                  >
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-xl"
                      style={{
                        background: unlocked ? item.color + "33" : "#1a1a1a",
                        border:
                          rank.title === item.title
                            ? `2px solid ${item.color}`
                            : "2px solid transparent",
                      }}
                    >
                      {item.icon}
                    </div>
                    <span className="text-[10px] font-semibold text-foreground text-center leading-tight">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {item.days}д.
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: user info */}
          <div className="bg-[#111] border border-[#1e1e1e] rounded-lg p-6 flex flex-col items-center gap-4">
            <UserAvatar
              avatarUrl={user.avatar_url}
              username={user.username}
              size={128}
            />
            <div className="text-center flex flex-col items-center gap-3">
              <div>
                <h2 className="text-xl font-bold text-foreground capitalize">
                  {user.username}
                </h2>
                {user.nickname && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    @{user.nickname}
                  </p>
                )}
              </div>
              <span
                className="px-3 py-1 rounded-full text-sm font-semibold"
                style={{ background: rank.color + "22", color: rank.color }}
              >
                {rank.icon} {rank.title}
              </span>
              {Number(currentUser.id) !== Number(user.id) && (
                <FriendButton currentUser={currentUser} targetUser={user} />
              )}
            </div>
            {user.goal && (
              <div className="w-full bg-[#1a1a1a] rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Цель</p>
                <p className="text-sm font-semibold text-foreground">
                  {user.goal}
                </p>
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
                  <p
                    className="text-lg font-bold"
                    style={{ color: rank.color }}
                  >
                    {rank.icon} {rank.title}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    Следующий ранг
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {nextRank.icon} {nextRank.title}
                  </p>
                </div>
              </div>
              <Progress value={Math.round(rankProgress)} className="h-2 mb-2" />
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-foreground">
                  {completedDays} дней
                </span>
                <span className="text-muted-foreground">
                  Осталось {daysLeftToRank} дней
                </span>
              </div>
            </div>

            {/* Cycle progress */}
            <div className="bg-[#111] border border-[#1e1e1e] rounded-lg p-5">
              <div className="flex justify-between items-start gap-3 mb-1">
                <h4 className="font-semibold text-foreground">
                  Прогресс текущего цикла
                </h4>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-brand/15 text-brand whitespace-nowrap">
                  Цикл {cycle.cycleNumber}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {formatShort(cycle.cycleStart)} — {formatShort(cycle.cycleEnd)}
                {cycle.daysLeft > 0
                  ? ` · до конца цикла ${cycle.daysLeft} дн.`
                  : " · последний день цикла"}
              </p>
              <Progress
                value={Math.round(progressPercent)}
                className="h-2 mb-2"
              />
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-foreground">
                  День {cycle.dayInCycle} / {CYCLE_LENGTH}
                </span>
                <span className="text-muted-foreground">
                  {Math.round(progressPercent)}%
                </span>
              </div>

              <Separator className="my-4 bg-[#1e1e1e]" />

              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    icon: <Calendar className="h-5 w-5" />,
                    title: "Выполнено в цикле",
                    value: `${cycle.doneInCycle} / ${CYCLE_LENGTH}`,
                  },
                  {
                    icon: <Flame className="h-5 w-5" />,
                    title: "Пропущено в цикле",
                    value: cycle.missedInCycle,
                  },
                  {
                    icon: <Moon className="h-5 w-5" />,
                    title: "Выходных в цикле",
                    value: cycle.restInCycle,
                  },
                  {
                    icon: <Calendar className="h-5 w-5" />,
                    title: "Всего отмечено",
                    value: completedDays,
                  },
                  {
                    icon: <Flame className="h-5 w-5" />,
                    title: "Текущая серия",
                    value: `${currentStreak} дней`,
                  },
                  {
                    icon: <Trophy className="h-5 w-5" />,
                    title: "Рекордная серия",
                    value: `${longestStreak} дней`,
                  },
                  {
                    icon: <Target className="h-5 w-5 text-brand" />,
                    title: "Discipline Score",
                    value: discipline.score,
                  },
                  {
                    icon: <Moon className="h-5 w-5" />,
                    title: "Выходных всего",
                    value: discipline.restDays,
                  },
                ].map((s) => (
                  <div
                    key={s.title}
                    className="bg-[#1a1a1a] rounded-lg p-4 flex items-center gap-3"
                  >
                    <span className="text-muted-foreground">{s.icon}</span>
                    <div>
                      <p className="text-xs text-muted-foreground">{s.title}</p>
                      <p className="text-base font-bold text-foreground">
                        {s.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity history — только текущий цикл */}
            <div className="bg-[#111] border border-[#1e1e1e] rounded-lg p-5">
              <div className="flex justify-between items-start gap-3 mb-1">
                <h4 className="font-semibold text-foreground">
                  История активности
                </h4>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  Цикл {cycle.cycleNumber} · {formatShort(cycle.cycleStart)} —{" "}
                  {formatShort(cycle.cycleEnd)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                {CYCLE_LENGTH} дней текущего цикла. С началом нового цикла сетка
                обнуляется.
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {slots.map((slot) => {
                  const style = SLOT_STYLE[slot.state];
                  const isToday = slot.date === cycle.today;
                  return (
                    <Tooltip key={slot.date}>
                      <TooltipTrigger>
                        <div
                          className="w-5 h-5 rounded-sm transition-all"
                          style={{
                            backgroundColor: style.color,
                            border: isToday ? "2px solid #faad14" : "none",
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-semibold">
                          День {slot.dayNumber} · {formatShort(slot.date)}
                        </p>
                        <p className="text-muted-foreground">{style.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 text-xs text-muted-foreground">
                {(
                  ["done", "rest", "missed", "today", "future"] as CycleSlotState[]
                ).map((state) => (
                  <span key={state} className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-sm inline-block"
                      style={{
                        backgroundColor: SLOT_STYLE[state].color,
                        border:
                          state === "today" ? "1px solid #faad14" : "none",
                      }}
                    />
                    {SLOT_STYLE[state].legend}
                  </span>
                ))}
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
                  <Badge
                    key={a.text}
                    variant={a.done ? "default" : "outline"}
                    className={`px-3 py-1.5 text-sm ${a.done ? "bg-brand/20 text-brand border-brand/30" : "border-[#252525] text-muted-foreground"}`}
                  >
                    {a.done ? "🏆" : "🔒"} {a.text}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
