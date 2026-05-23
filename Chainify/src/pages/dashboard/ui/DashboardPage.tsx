import { useState, useEffect, type CSSProperties } from "react";
import { toast } from "sonner";
import {
  User,
  Trophy,
  LogOut,
  MapPin,
  ArrowUpDown,
  Flame,
  Users,
  Calendar,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import { getRank } from "@/entities/rank/model/ranks";
import { UserAvatar } from "@/entities/user/ui/UserAvatar";
import { getUsers, getFriends } from "@/shared/api/client";
import { MarkDayButton } from "@/features/mark-day/ui/MarkDayButton";
import { FriendsPanel } from "@/features/friends/ui/FriendsPanel";
import type { User as UserType } from "@/entities/user/model/types";

const DAYS = 14;
const PARTICIPANTS_PER_PAGE = 20;

// Heatmap: 3 rows × N columns, last ~90 days
function getHeatmapColumns(
  completedDates: string[],
  todayStr: string,
): Array<Array<{ date: string; completed: boolean; future: boolean }>> {
  const ROWS = 3;
  const COLS = 30;
  const total = ROWS * COLS;
  const today = new Date(todayStr);
  today.setHours(0, 0, 0, 0);
  const days: Array<{ date: string; completed: boolean; future: boolean }> = [];
  for (let i = total - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    days.push({
      date: dateStr,
      completed: completedDates.includes(dateStr),
      future: false,
    });
  }
  // Split into columns of ROWS
  const cols: Array<
    Array<{ date: string; completed: boolean; future: boolean }>
  > = [];
  for (let c = 0; c < COLS; c++) {
    cols.push(days.slice(c * ROWS, c * ROWS + ROWS));
  }
  return cols;
}

interface DashboardPageProps {
  currentUser: UserType;
  onShowProfile: () => void;
  onShowLeaderboard: () => void;
  onSelectUser: (user: UserType) => void;
  onLogout: () => void;
}

// Returns green color with intensity based on total days (0–365+)
function getCompletedColor(totalDays: number): { bg: string; glow: string } {
  const t = Math.min(totalDays / 120, 1);
  const lightness = Math.round(25 + t * 20);
  const sat = Math.round(60 + t * 30);
  return {
    bg: `hsl(142, ${sat}%, ${lightness}%)`,
    glow: `0 0 ${4 + Math.round(t * 8)}px hsla(142, ${sat}%, ${lightness}%, ${0.3 + t * 0.4}), inset 0 1px 0 rgba(255,255,255,0.1)`,
  };
}

function getStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const sorted = [...dates].sort().reverse();
  const today = new Date().toISOString().slice(0, 10);
  let streak = 0;
  let cursor = today;
  for (const d of sorted) {
    if (d === cursor) {
      streak++;
      const prev = new Date(cursor);
      prev.setDate(prev.getDate() - 1);
      cursor = prev.toISOString().slice(0, 10);
    } else if (d < cursor) break;
  }
  return streak;
}

const HEATMAP_THRESHOLD = 21;

function getLastNDays(n: number): string[] {
  const days: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

export default function DashboardPage({
  currentUser,
  onShowProfile,
  onShowLeaderboard,
  onSelectUser,
  onLogout,
}: DashboardPageProps) {
  const [participants, setParticipants] = useState<UserType[]>([]);
  const [friendsList, setFriendsList] = useState<UserType[]>([]);
  const [viewMode, setViewMode] = useState<"all" | "friends">("all");
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const today = new Date().toISOString().slice(0, 10);

  const loadParticipants = async (location: string) => {
    setLoading(true);
    try {
      const res = await getUsers(location);
      if (res.success) {
        setParticipants(res.users);
        const locs = [
          ...new Set(
            res.users.map((u: UserType) => u.location).filter(Boolean),
          ),
        ] as string[];
        setLocations((prev) =>
          JSON.stringify(prev) === JSON.stringify(locs) ? prev : locs,
        );
      }
    } catch {
      toast.error("Не удалось загрузить участников");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loc = currentUser.location || "";
    setSelectedLocation(loc);
    loadParticipants(loc);
    getFriends(currentUser.id).then((res) => {
      if (res.success) {
        const friends = (res.friends ?? []).map((f: any) => ({
          ...f,
          completed_dates: f.completed_dates ?? [],
        }));
        setFriendsList(friends);
      }
    });
  }, [currentUser]);

  const handleLocationChange = (loc: string) => {
    const val = loc === "__all__" ? "" : loc;
    setSelectedLocation(val);
    setCurrentPage(1);
    loadParticipants(val);
  };

  const handleMarkDay = (today: string) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === currentUser.id
          ? { ...p, completed_dates: [...p.completed_dates, today] }
          : p,
      ),
    );
  };

  const myEntry = participants.find(
    (p) => Number(p.id) === Number(currentUser.id),
  );
  const todayMarked = myEntry?.completed_dates.includes(today) ?? false;

  // In friends mode: show only friends (not self); in all mode: show everyone except self
  const othersBase = (() => {
    const list =
      viewMode === "friends"
        ? friendsList.filter((f) => Number(f.id) !== Number(currentUser.id))
        : participants.filter((p) => Number(p.id) !== Number(currentUser.id));
    return list;
  })();

  const sortedOthers = [...othersBase].sort((a, b) =>
    sortDir === "desc"
      ? b.completed_dates.length - a.completed_dates.length
      : a.completed_dates.length - b.completed_dates.length,
  );
  const paginated = sortedOthers.slice(
    (currentPage - 1) * PARTICIPANTS_PER_PAGE,
    currentPage * PARTICIPANTS_PER_PAGE,
  );
  const totalPages = Math.ceil(othersBase.length / PARTICIPANTS_PER_PAGE);

  return (
    <TooltipProvider>
      <div className="app-layout">
        {/* Header */}
        <header className="app-header">
          <div className="flex items-center justify-between w-full gap-5">
            <h1 className="header-title text-xl font-bold">Chainify</h1>
            <div className="flex-1 hidden md:flex items-center justify-center gap-3">
              <span className="text-sm text-muted-foreground font-medium">
                Каждый день — новая возможность
              </span>
            </div>
            <div className="flex items-center gap-3">
              {locations.length > 0 && (
                <Select
                  value={selectedLocation || "__all__"}
                  onValueChange={handleLocationChange}
                >
                  <SelectTrigger className="w-36 bg-[#1a1a1a] border-[#252525] text-foreground h-8 text-sm">
                    <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                    <SelectValue placeholder="Все локации" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#252525]">
                    <SelectItem
                      value="__all__"
                      className="text-muted-foreground"
                    >
                      Все локации
                    </SelectItem>
                    {locations.map((l) => (
                      <SelectItem key={l} value={l} className="text-foreground">
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onShowLeaderboard}
                className="text-muted-foreground hover:text-foreground h-8"
              >
                <Trophy className="h-4 w-4 mr-1.5" /> Рейтинг
              </Button>
              <span className="text-xs text-muted-foreground px-2.5 py-1 rounded-full bg-[#1a1a1a] border border-[#252525]">
                {participants.length} участников
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="text-muted-foreground hover:text-foreground h-8"
              >
                <LogOut className="h-4 w-4 mr-1.5" /> Выйти
              </Button>
            </div>
          </div>
        </header>

        <div className="app-content">
          <div className="app-content-inner">
            <div className="main-content">
              {/* Left panel */}
              <div className="left-panel">
                <div className="profile-card p-6">
                  <div className="flex flex-col items-center gap-4 w-full">
                    <h3 className="text-base font-semibold capitalize text-foreground">
                      {currentUser.username}
                    </h3>
                    {currentUser.nickname && (
                      <p className="text-xs text-muted-foreground -mt-2">@{currentUser.nickname}</p>
                    )}

                    <div className="relative">
                      <button
                        onClick={onShowProfile}
                        className="rounded-full overflow-hidden profile-avatar-clickable"
                      >
                        <UserAvatar
                          avatarUrl={currentUser.avatar_url}
                          username={currentUser.username}
                          size={80}
                        />
                      </button>
                    </div>

                    {/* Mark today button */}
                    <MarkDayButton
                      currentUser={currentUser}
                      todayMarked={todayMarked}
                      onMarked={() => handleMarkDay(today)}
                    />

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onShowProfile}
                      className="bg-[#1a1a1a] border-[#252525] text-muted-foreground hover:text-foreground hover:bg-[#222] w-full"
                    >
                      <User className="h-4 w-4 mr-2" /> Мой профиль
                    </Button>

                    {currentUser.goal && (
                      <div className="w-full bg-brand/5 border border-brand/15 rounded-lg px-3 py-2.5">
                        <p className="text-[10px] text-brand/60 uppercase tracking-wider mb-1">
                          Цель
                        </p>
                        <p className="text-sm font-semibold text-brand leading-snug">
                          {currentUser.goal}
                        </p>
                      </div>
                    )}

                    {/* bio */}
                    {currentUser.bio && (
                      <div className="w-full border-t border-[#1e1e1e] pt-3">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">
                          О себе
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {currentUser.bio}
                        </p>
                      </div>
                    )}

                    {currentUser.daily_actions && (
                      <div className="w-full border-t border-[#1e1e1e] pt-3">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">
                          Ежедневные действия
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {currentUser.daily_actions}
                        </p>
                      </div>
                    )}

                    {/* stats */}
                    {(() => {
                      const total = myEntry?.completed_dates.length ?? 0;
                      const streak = myEntry
                        ? getStreak(myEntry.completed_dates)
                        : 0;
                      const joinDate = currentUser.created_at
                        ? new Date(currentUser.created_at).toLocaleDateString(
                            "ru-RU",
                            { day: "numeric", month: "short", year: "numeric" },
                          )
                        : null;
                      return (
                        <div className="w-full border-t border-[#1e1e1e] pt-3 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Trophy className="h-3 w-3" /> Всего дней
                            </span>
                            <span className="text-xs font-bold text-foreground">
                              {total}
                            </span>
                          </div>
                          {streak > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Flame className="h-3 w-3 text-orange-400" />{" "}
                                Серия
                              </span>
                              <span className="text-xs font-bold text-orange-400">
                                {streak}д
                              </span>
                            </div>
                          )}
                          {joinDate && (
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" /> С нами с
                              </span>
                              <span className="text-xs text-foreground">
                                {joinDate}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <FriendsPanel
                  currentUser={currentUser}
                  onSelectUser={onSelectUser}
                />
              </div>

              {/* Right panel */}
              <div className="right-panel">
                <div className="progress-card">
                  {loading ? (
                    <div className="flex flex-col gap-3 p-6">
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-4 animate-pulse"
                        >
                          <div className="w-28 h-4 rounded bg-[#2a2a2a]" />
                          <div className="flex gap-1 flex-1">
                            {[...Array(DAYS)].map((_, j) => (
                              <div
                                key={j}
                                className="flex-1 h-7 rounded bg-[#1e1e1e]"
                              />
                            ))}
                          </div>
                          <div className="w-12 h-4 rounded bg-[#2a2a2a]" />
                        </div>
                      ))}
                    </div>
                  ) : participants.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <div className="w-14 h-14 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                        <User className="h-7 w-7 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        Пока никого нет
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Станьте первым участником в этой локации
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Header row */}
                      <div className="flex items-center gap-4 px-6 pt-4 pb-3 border-b border-[#1a1a1a]">
                        <span className="text-xs text-muted-foreground w-36 shrink-0">
                          Участник
                        </span>
                        <div className="flex gap-1 flex-1 items-center">
                          {/* view mode toggle */}
                          <div className="flex items-center gap-1 mr-2">
                            <button
                              onClick={() => {
                                setViewMode("all");
                                setCurrentPage(1);
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${viewMode === "all" ? "bg-brand/20 text-brand" : "text-muted-foreground hover:text-foreground"}`}
                            >
                              Все
                            </button>
                            <button
                              onClick={() => {
                                setViewMode("friends");
                                setCurrentPage(1);
                              }}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${viewMode === "friends" ? "bg-brand/20 text-brand" : "text-muted-foreground hover:text-foreground"}`}
                            >
                              <Users className="h-2.5 w-2.5" /> Друзья
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-20 justify-end shrink-0">
                          <button
                            onClick={() => {
                              setSortDir((d) =>
                                d === "desc" ? "asc" : "desc",
                              );
                              setCurrentPage(1);
                            }}
                            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ArrowUpDown className="h-3 w-3" />
                            Стрик
                          </button>
                        </div>
                      </div>

                      {/* Participant rows */}
                      <div className="flex flex-col divide-y divide-[#141414]">
                        {/* Pinned: current user row */}
                        {myEntry &&
                          (() => {
                            const rank = getRank(
                              myEntry.completed_dates.length,
                            );
                            const streak = getStreak(myEntry.completed_dates);
                            const total = myEntry.completed_dates.length;
                            const { bg, glow } = getCompletedColor(total);
                            return (
                              <div
                                className="flex items-center gap-4 px-6 py-3 bg-brand/8 border-b-2 border-brand/20 sticky top-0 z-10"
                                style={{
                                  background:
                                    "linear-gradient(90deg, rgba(var(--brand-rgb),0.10) 0%, rgba(var(--brand-rgb),0.04) 100%)",
                                }}
                              >
                                <div className="flex items-center gap-2.5 w-36 shrink-0 min-w-0">
                                  <span className="text-[10px] text-brand/50 w-4 text-right shrink-0">
                                    ★
                                  </span>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <button
                                        onClick={() => onSelectUser(myEntry)}
                                        className="flex items-center gap-1.5 text-xs font-bold truncate text-brand hover:text-brand/80 transition-colors text-left"
                                      >
                                        <UserAvatar
                                          avatarUrl={myEntry.avatar_url}
                                          username={myEntry.username}
                                          size={28}
                                        />
                                        {myEntry.username}
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>
                                        {rank.icon} {rank.title} · Вы
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                                {total > HEATMAP_THRESHOLD ? (
                                  <div className="flex gap-0.5 flex-1 overflow-hidden">
                                    {getHeatmapColumns(
                                      myEntry.completed_dates,
                                      today,
                                    ).map((week, wi) => (
                                      <div
                                        key={wi}
                                        className="flex flex-col gap-0.5"
                                      >
                                        {week.map((cell) => {
                                          const isToday = cell.date === today;
                                          let bg2 = "#161616";
                                          let border = "1px solid #222";
                                          let shadow = "none";
                                          if (cell.completed) {
                                            bg2 = bg;
                                            border = "none";
                                            shadow = glow;
                                          } else if (isToday) {
                                            bg2 = "#3d2e00";
                                            border = "1.5px solid #faad14";
                                          } else if (
                                            !cell.future &&
                                            cell.date < today
                                          ) {
                                            bg2 = "#1a1212";
                                            border = "1px solid #2a1818";
                                          }
                                          return (
                                            <Tooltip key={cell.date}>
                                              <TooltipTrigger>
                                                <div
                                                  style={{
                                                    width: 16,
                                                    height: 16,
                                                    borderRadius: 4,
                                                    backgroundColor: bg2,
                                                    border,
                                                    boxShadow: shadow,
                                                    transition: "all 0.15s",
                                                    flexShrink: 0,
                                                  }}
                                                />
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>
                                                  {cell.completed
                                                    ? "✓"
                                                    : isToday
                                                      ? "Сегодня"
                                                      : cell.future
                                                        ? "—"
                                                        : "✗"}{" "}
                                                  · {cell.date}
                                                </p>
                                              </TooltipContent>
                                            </Tooltip>
                                          );
                                        })}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="flex gap-1 flex-1">
                                    {getLastNDays(HEATMAP_THRESHOLD).map((d: string) => {
                                      const isCompleted = myEntry.completed_dates.includes(d);
                                      const isPast = d < today;
                                      const isToday = d === today;
                                      let style: CSSProperties = {
                                        borderRadius: 6,
                                        transition: "all 0.2s",
                                      };
                                      if (isCompleted) {
                                        style.backgroundColor = bg;
                                        style.boxShadow = glow;
                                      } else if (isToday) {
                                        style.backgroundColor = "#3d2e00";
                                        style.border = "1.5px solid #faad14";
                                        style.boxShadow =
                                          "0 0 6px rgba(250,173,20,0.25)";
                                      } else if (isPast) {
                                        style.backgroundColor = "#1f1010";
                                        style.border = "1px solid #2d1515";
                                      } else {
                                        style.backgroundColor = "#161616";
                                        style.border = "1px solid #222";
                                      }
                                      return (
                                        <Tooltip key={d}>
                                          <TooltipTrigger>
                                            <div
                                              style={style}
                                              className="flex-1 min-w-[28px] h-8 flex items-center justify-center"
                                            >
                                              {isCompleted && (
                                                <svg
                                                  width="10"
                                                  height="8"
                                                  viewBox="0 0 9 7"
                                                  fill="none"
                                                >
                                                  <path
                                                    d="M1 3.5L3.5 6L8 1"
                                                    stroke="rgba(255,255,255,0.9)"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                  />
                                                </svg>
                                              )}
                                              {isPast && !isCompleted && (
                                                <svg
                                                  width="8"
                                                  height="8"
                                                  viewBox="0 0 7 7"
                                                  fill="none"
                                                >
                                                  <path
                                                    d="M1 1L6 6M6 1L1 6"
                                                    stroke="#4a2020"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                  />
                                                </svg>
                                              )}
                                              {isToday && !isCompleted && (
                                                <svg
                                                  width="9"
                                                  height="9"
                                                  viewBox="0 0 8 8"
                                                  fill="none"
                                                >
                                                  <circle
                                                    cx="4"
                                                    cy="4"
                                                    r="3"
                                                    stroke="#faad14"
                                                    strokeWidth="1.5"
                                                  />
                                                  <circle
                                                    cx="4"
                                                    cy="4"
                                                    r="1"
                                                    fill="#faad14"
                                                  />
                                                </svg>
                                              )}
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>
                                              {isCompleted
                                                ? "✓ Выполнено"
                                                : isPast
                                                  ? "✗ Пропущено"
                                                  : isToday
                                                    ? "Сегодня"
                                                    : "—"}{" "}
                                              · {d}
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      );
                                    })}
                                  </div>
                                )}
                                <div className="flex flex-col items-end justify-center gap-0.5 w-24 shrink-0">
                                  <div className="flex items-center gap-1">
                                    {streak > 0 && (
                                      <Flame className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                                    )}
                                    <span
                                      className={`text-xs font-bold tabular-nums ${streak > 0 ? "text-orange-400" : "text-muted-foreground/40"}`}
                                    >
                                      {streak > 0 ? `${streak}д` : "—"}
                                    </span>
                                  </div>
                                  {total > 0 && (
                                    <div className="w-full">
                                      <div className="flex justify-between mb-0.5">
                                        <span className="text-[10px] text-muted-foreground/50 tabular-nums">
                                          {total}д
                                        </span>
                                      </div>
                                      <div className="w-full h-1 rounded-full bg-[#222] overflow-hidden">
                                        <div
                                          className="h-full rounded-full transition-all"
                                          style={{
                                            width: `${Math.min((total / 365) * 100, 100)}%`,
                                            backgroundColor: bg,
                                          }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}

                        {/* Other participants */}
                        {paginated.map((participant, index) => {
                          const rank = getRank(
                            participant.completed_dates.length,
                          );
                          const globalIndex =
                            (currentPage - 1) * PARTICIPANTS_PER_PAGE +
                            index +
                            1;
                          const streak = getStreak(participant.completed_dates);
                          const total = participant.completed_dates.length;
                          const { bg, glow } = getCompletedColor(total);

                          return (
                            <div
                              key={participant.id}
                              className="flex items-center gap-4 px-6 py-3 transition-colors hover:bg-[#141414]"
                            >
                              {/* Name */}
                              <div className="flex items-center gap-2.5 w-36 shrink-0 min-w-0">
                                <span className="text-[10px] text-muted-foreground/50 w-4 text-right shrink-0">
                                  {globalIndex}
                                </span>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <button
                                      onClick={() => onSelectUser(participant)}
                                      className="flex items-center gap-1.5 text-xs font-medium truncate text-foreground hover:text-primary transition-colors text-left"
                                    >
                                      <UserAvatar
                                        avatarUrl={participant.avatar_url}
                                        username={participant.username}
                                        size={28}
                                      />
                                      {participant.username}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {rank.icon} {rank.title}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>

                              {total > HEATMAP_THRESHOLD ? (
                                <div className="flex gap-0.5 flex-1 overflow-hidden">
                                  {getHeatmapColumns(
                                    participant.completed_dates,
                                    today,
                                  ).map((week, wi) => (
                                    <div
                                      key={wi}
                                      className="flex flex-col gap-0.5"
                                    >
                                      {week.map((cell) => {
                                        const isToday2 = cell.date === today;
                                        let bg2 = "#161616";
                                        let border = "1px solid #222";
                                        let shadow = "none";
                                        if (cell.completed) {
                                          bg2 = bg;
                                          border = "none";
                                          shadow = glow;
                                        } else if (isToday2) {
                                          bg2 = "#3d2e00";
                                          border = "1.5px solid #faad14";
                                        } else if (
                                          !cell.future &&
                                          cell.date < today
                                        ) {
                                          bg2 = "#1a1212";
                                          border = "1px solid #2a1818";
                                        }
                                        return (
                                          <Tooltip key={cell.date}>
                                            <TooltipTrigger>
                                              <div
                                                style={{
                                                  width: 16,
                                                  height: 16,
                                                  borderRadius: 4,
                                                  backgroundColor: bg2,
                                                  border,
                                                  boxShadow: shadow,
                                                  transition: "all 0.15s",
                                                  flexShrink: 0,
                                                }}
                                              />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>
                                                {cell.completed
                                                  ? "✓"
                                                  : isToday2
                                                    ? "Сегодня"
                                                    : cell.future
                                                      ? "—"
                                                      : "✗"}{" "}
                                                · {cell.date}
                                              </p>
                                            </TooltipContent>
                                          </Tooltip>
                                        );
                                      })}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex gap-1 flex-1">
                                  {getLastNDays(HEATMAP_THRESHOLD).map((d: string) => {
                                    const isCompleted = participant.completed_dates.includes(d);
                                    const isPast = d < today;
                                    const isToday = d === today;
                                    let style: CSSProperties = {
                                      borderRadius: 6,
                                      transition: "all 0.2s",
                                    };
                                    if (isCompleted) {
                                      style.backgroundColor = bg;
                                      style.boxShadow = glow;
                                    } else if (isToday) {
                                      style.backgroundColor = "#3d2e00";
                                      style.border = "1.5px solid #faad14";
                                      style.boxShadow =
                                        "0 0 6px rgba(250,173,20,0.25)";
                                    } else if (isPast) {
                                      style.backgroundColor = "#1f1010";
                                      style.border = "1px solid #2d1515";
                                    } else {
                                      style.backgroundColor = "#161616";
                                      style.border = "1px solid #222";
                                    }
                                    return (
                                      <Tooltip key={d}>
                                        <TooltipTrigger>
                                          <div
                                            style={style}
                                            className="flex-1 min-w-[28px] h-8 flex items-center justify-center"
                                          >
                                            {isCompleted && (
                                              <svg
                                                width="10"
                                                height="8"
                                                viewBox="0 0 9 7"
                                                fill="none"
                                              >
                                                <path
                                                  d="M1 3.5L3.5 6L8 1"
                                                  stroke="rgba(255,255,255,0.9)"
                                                  strokeWidth="1.5"
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                />
                                              </svg>
                                            )}
                                            {isPast && !isCompleted && (
                                              <svg
                                                width="8"
                                                height="8"
                                                viewBox="0 0 7 7"
                                                fill="none"
                                              >
                                                <path
                                                  d="M1 1L6 6M6 1L1 6"
                                                  stroke="#4a2020"
                                                  strokeWidth="1.5"
                                                  strokeLinecap="round"
                                                />
                                              </svg>
                                            )}
                                            {isToday && !isCompleted && (
                                              <svg
                                                width="9"
                                                height="9"
                                                viewBox="0 0 8 8"
                                                fill="none"
                                              >
                                                <circle
                                                  cx="4"
                                                  cy="4"
                                                  r="3"
                                                  stroke="#faad14"
                                                  strokeWidth="1.5"
                                                />
                                                <circle
                                                  cx="4"
                                                  cy="4"
                                                  r="1"
                                                  fill="#faad14"
                                                />
                                              </svg>
                                            )}
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>
                                            {isCompleted
                                              ? "✓ Выполнено"
                                              : isPast
                                                ? "✗ Пропущено"
                                                : isToday
                                                  ? "Сегодня"
                                                  : "—"}{" "}
                                            · {d}
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    );
                                  })}
                                </div>
                              )}
                              <div className="flex flex-col items-end justify-center gap-0.5 w-24 shrink-0">
                                <div className="flex items-center gap-1">
                                  {streak > 0 && (
                                    <Flame className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                                  )}
                                  <span
                                    className={`text-xs font-bold tabular-nums ${streak > 0 ? "text-orange-400" : "text-muted-foreground/40"}`}
                                  >
                                    {streak > 0 ? `${streak}д` : "—"}
                                  </span>
                                </div>
                                {total > 0 && (
                                  <div className="w-full">
                                    <div className="flex items-center justify-between mb-0.5">
                                      <span className="text-[10px] text-muted-foreground/50 tabular-nums">
                                        {total}д
                                      </span>
                                    </div>
                                    <div className="w-full h-1 rounded-full bg-[#222] overflow-hidden mt-0.5">
                                      <div
                                        className="h-full rounded-full transition-all"
                                        style={{
                                          width: `${Math.min((total / 365) * 100, 100)}%`,
                                          backgroundColor: bg,
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-3 py-4 border-t border-[#1a1a1a]">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((p) => p - 1)}
                            className="bg-[#1a1a1a] border-[#252525] text-foreground h-7 w-7 p-0"
                          >
                            ←
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            {currentPage} / {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((p) => p + 1)}
                            className="bg-[#1a1a1a] border-[#252525] text-foreground h-7 w-7 p-0"
                          >
                            →
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
