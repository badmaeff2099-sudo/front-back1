import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  User,
  Trophy,
  LogOut,
  MapPin,
  ArrowUpDown,
  Flame,
  Users,
  LayoutDashboard,
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
import { getUsers, getFriends, markDay } from "@/shared/api/client";
import { FriendsPanel } from "@/features/friends/ui/FriendsPanel";
import type { User as UserType } from "@/entities/user/model/types";

const PARTICIPANTS_PER_PAGE = 20;
const CYCLE = 30; // квадратиков в столбце

/* ─── Helpers ─────────────────────────────────────────────────── */

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function getStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const sorted = [...dates].sort().reverse();
  const today = todayISO();
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

/**
 * Строим 30 слотов (позиции 0..29 снизу вверх, т.е. отображаем 29..0).
 * Слот = один «оборот» из 30 дней.
 * cycle = Math.floor(totalDone / 30) — номер текущего цикла.
 * posInCycle = totalDone % 30 — сколько выполнено в текущем цикле (0..29).
 * Слоты 0..posInCycle-1 = выполнены (зелёные).
 * Слот posInCycle = сегодня (кнопка, если не отмечен — жёлтый, если отмечен — зелёный).
 * Слоты до posInCycle (прошедшие в этом цикле, уже «прошли» без отметки) = красные.
 *
 * Нам важна не дата, а позиция в цикле и пропуски.
 * Проще: берём 30 дат подряд назад, смотрим статус.
 */
interface SlotInfo {
  /** порядковый номер слота снизу: 0 = самый нижний */
  slotIdx: number;
  date: string;
  state: "done" | "missed" | "today" | "future";
}

function buildSlots(completedDates: string[], today: string): SlotInfo[] {
  // Берём последние 30 дней (включая сегодня)
  const slots: SlotInfo[] = [];
  for (let i = CYCLE - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const slotIdx = CYCLE - 1 - i; // 0=самый старый, 29=сегодня
    let state: SlotInfo["state"];
    if (dateStr === today) {
      state = completedDates.includes(dateStr) ? "done" : "today";
    } else if (completedDates.includes(dateStr)) {
      state = "done";
    } else {
      state = "missed";
    }
    slots.push({ slotIdx, date: dateStr, state });
  }
  return slots; // slots[0] = 30 дней назад, slots[29] = сегодня
}

/* ─── Vertical column for one user ───────────────────────────── */

interface UserColumnProps {
  user: UserType;
  isMe: boolean;
  today: string;
  onMarkDay?: () => void;
  onSelectUser: (u: UserType) => void;
}

function UserColumn({ user, isMe, today, onMarkDay, onSelectUser }: UserColumnProps) {
  const streak = getStreak(user.completed_dates);
  const total = user.completed_dates.length;
  const rank = getRank(total);
  const slots = buildSlots(user.completed_dates, today);
  const todayMarked = user.completed_dates.includes(today);
  const [marking, setMarking] = useState(false);

  const handleMark = async () => {
    if (!isMe || todayMarked || marking) return;
    setMarking(true);
    try {
      const res = await markDay(user.id, today);
      if (res.success) {
        onMarkDay?.();
        toast.success("День отмечен! 🎉");
      } else if (res.error === "Already marked for this date") {
        toast.warning("Сегодня уже отмечено!");
        onMarkDay?.();
      } else {
        toast.error(res.error || "Ошибка");
      }
    } catch {
      toast.error("Ошибка соединения");
    } finally {
      setMarking(false);
    }
  };

  return (
    <div
      className={`flex flex-col items-center gap-2 select-none ${
        isMe
          ? "ring-2 ring-brand/40 rounded-xl bg-brand/5 px-2 py-3"
          : "px-2 py-3"
      }`}
      style={{ minWidth: 64 }}
    >
      {/* Avatar + name */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onSelectUser(user)}
            className="flex flex-col items-center gap-1.5 group"
          >
            <UserAvatar
              avatarUrl={user.avatar_url}
              username={user.username}
              size={36}
            />
            <span
              className={`text-[11px] font-semibold truncate max-w-[56px] text-center leading-tight ${
                isMe ? "text-brand" : "text-foreground group-hover:text-primary"
              }`}
            >
              {user.username}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {rank.icon} {rank.title}
            {isMe ? " · Вы" : ""}
          </p>
        </TooltipContent>
      </Tooltip>

      {/* Streak */}
      <div className="flex items-center gap-1">
        {streak > 0 ? (
          <>
            <Flame className="h-3 w-3 text-orange-400 shrink-0" />
            <span className="text-[11px] font-bold text-orange-400 tabular-nums">
              {streak}
            </span>
          </>
        ) : (
          <span className="text-[10px] text-muted-foreground/30 tabular-nums">—</span>
        )}
      </div>

      {/* 30 squares — rendered top to bottom (slot 29 on top, slot 0 on bottom) */}
      <div className="flex flex-col gap-[3px]">
        {[...slots].reverse().map((slot) => {
          const isToday = slot.state === "today";
          const isDone = slot.state === "done";
          const isMissed = slot.state === "missed";

          let bg = "#1e1e1e";
          let border = "1px solid #2a2a2a";
          let shadow = "none";
          let cursor = "default";
          let title = slot.date;

          if (isDone) {
            bg = "#166534"; // green-800
            border = "1px solid #15803d";
            shadow = "0 0 6px rgba(34,197,94,0.35)";
            title = `✓ ${slot.date}`;
          } else if (isMissed) {
            bg = "#3b0f0f";
            border = "1px solid #7f1d1d";
            title = `✗ ${slot.date}`;
          } else if (isToday && isMe) {
            bg = todayMarked ? "#166534" : "#3d2e00";
            border = todayMarked ? "1px solid #15803d" : "1.5px solid #faad14";
            shadow = todayMarked
              ? "0 0 6px rgba(34,197,94,0.35)"
              : "0 0 8px rgba(250,173,20,0.4)";
            cursor = todayMarked ? "default" : "pointer";
            title = todayMarked ? `✓ Сегодня` : "Нажмите чтобы отметить";
          } else if (isToday && !isMe) {
            bg = todayMarked ? "#166534" : "#3d2e00";
            border = todayMarked ? "1px solid #15803d" : "1.5px solid #faad14";
            shadow = todayMarked ? "0 0 6px rgba(34,197,94,0.35)" : "0 0 6px rgba(250,173,20,0.3)";
            title = todayMarked ? `✓ Сегодня` : "Сегодня";
          }

          if (isToday && isMe && !todayMarked) {
            return (
              <Tooltip key={slot.date}>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleMark}
                    disabled={marking}
                    style={{
                      width: 36,
                      height: 20,
                      borderRadius: 5,
                      backgroundColor: bg,
                      border,
                      boxShadow: shadow,
                      cursor,
                      transition: "all 0.15s",
                      flexShrink: 0,
                      animation: "pulse-border 2s ease-in-out infinite",
                    }}
                    aria-label="Отметить сегодня"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{title}</p>
                </TooltipContent>
              </Tooltip>
            );
          }

          return (
            <Tooltip key={slot.date}>
              <TooltipTrigger asChild>
                <div
                  style={{
                    width: 36,
                    height: 20,
                    borderRadius: 5,
                    backgroundColor: bg,
                    border,
                    boxShadow: shadow,
                    transition: "all 0.15s",
                    flexShrink: 0,
                  }}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>{title}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Total days */}
      <span className="text-[10px] text-muted-foreground/40 tabular-nums mt-0.5">
        {total}д
      </span>
    </div>
  );
}

/* ─── DashboardPage ───────────────────────────────────────────── */

interface DashboardPageProps {
  currentUser: UserType;
  onShowProfile: () => void;
  onShowLeaderboard: () => void;
  onShowFriends: () => void;
  onShowCabinet: () => void;
  onSelectUser: (user: UserType) => void;
  onLogout: () => void;
}

export default function DashboardPage({
  currentUser,
  onShowProfile,
  onShowLeaderboard,
  onShowFriends,
  onShowCabinet,
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

  const scrollRef = useRef<HTMLDivElement>(null);
  const today = todayISO();

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

  const handleMarkDay = () => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === currentUser.id
          ? { ...p, completed_dates: [...(p.completed_dates ?? []), today] }
          : p,
      ),
    );
  };

  const myEntry = participants.find(
    (p) => Number(p.id) === Number(currentUser.id),
  );

  // Others list
  const othersBase = (() => {
    const list =
      viewMode === "friends"
        ? friendsList.filter((f) => Number(f.id) !== Number(currentUser.id))
        : participants.filter((p) => Number(p.id) !== Number(currentUser.id));
    return list;
  })();

  const sortedOthers = [...othersBase].sort((a, b) =>
    sortDir === "desc"
      ? getStreak(b.completed_dates) - getStreak(a.completed_dates)
      : getStreak(a.completed_dates) - getStreak(b.completed_dates),
  );

  const paginated = sortedOthers.slice(
    (currentPage - 1) * PARTICIPANTS_PER_PAGE,
    currentPage * PARTICIPANTS_PER_PAGE,
  );
  const totalPages = Math.ceil(othersBase.length / PARTICIPANTS_PER_PAGE);

  return (
    <TooltipProvider>
      <style>{`
        @keyframes pulse-border {
          0%, 100% { box-shadow: 0 0 6px rgba(250,173,20,0.3); }
          50% { box-shadow: 0 0 14px rgba(250,173,20,0.7); }
        }
      `}</style>

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
                    <SelectItem value="__all__" className="text-muted-foreground">
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
                      <p className="text-xs text-muted-foreground -mt-2">
                        @{currentUser.nickname}
                      </p>
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

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onShowProfile}
                      className="bg-[#1a1a1a] border-[#252525] text-muted-foreground hover:text-foreground hover:bg-[#222] w-full"
                    >
                      <User className="h-4 w-4 mr-2" /> Мой профиль
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onShowCabinet}
                      className="bg-[#1a1a1a] border-[#252525] text-muted-foreground hover:text-foreground hover:bg-[#222] w-full"
                    >
                      <LayoutDashboard className="h-4 w-4 mr-2" /> Мой кабинет
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

                    {(() => {
                      const total = myEntry?.completed_dates.length ?? 0;
                      const streak = myEntry ? getStreak(myEntry.completed_dates) : 0;
                      const joinDate = currentUser.created_at
                        ? new Date(currentUser.created_at).toLocaleDateString("ru-RU", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : null;
                      return (
                        <div className="w-full border-t border-[#1e1e1e] pt-3 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Trophy className="h-3 w-3" /> Всего дней
                            </span>
                            <span className="text-xs font-bold text-foreground">{total}</span>
                          </div>
                          {streak > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Flame className="h-3 w-3 text-orange-400" /> Серия
                              </span>
                              <span className="text-xs font-bold text-orange-400">{streak}д</span>
                            </div>
                          )}
                          {joinDate && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">С нами с</span>
                              <span className="text-xs text-foreground">{joinDate}</span>
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
                  onShowFriends={onShowFriends}
                />
              </div>

              {/* Right panel — horizontal scroll, columns */}
              <div className="right-panel">
                <div className="progress-card overflow-hidden">
                  {loading ? (
                    <div className="flex gap-4 p-6 animate-pulse">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                          <div className="w-9 h-9 rounded-full bg-[#2a2a2a]" />
                          <div className="w-8 h-3 rounded bg-[#222]" />
                          {[...Array(CYCLE)].map((_, j) => (
                            <div key={j} className="w-9 h-5 rounded bg-[#1e1e1e]" />
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : participants.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <div className="w-14 h-14 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                        <User className="h-7 w-7 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">Пока никого нет</p>
                      <p className="text-xs text-muted-foreground">
                        Станьте первым участником в этой локации
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Controls row */}
                      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-[#1a1a1a]">
                        {/* view toggle */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setViewMode("all"); setCurrentPage(1); }}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${viewMode === "all" ? "bg-brand/20 text-brand" : "text-muted-foreground hover:text-foreground"}`}
                          >
                            Все
                          </button>
                          <button
                            onClick={() => { setViewMode("friends"); setCurrentPage(1); }}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${viewMode === "friends" ? "bg-brand/20 text-brand" : "text-muted-foreground hover:text-foreground"}`}
                          >
                            <Users className="h-2.5 w-2.5" /> Друзья
                          </button>
                        </div>
                        <button
                          onClick={() => { setSortDir((d) => d === "desc" ? "asc" : "desc"); setCurrentPage(1); }}
                          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors ml-auto"
                        >
                          <ArrowUpDown className="h-3 w-3" />
                          По стрику
                        </button>
                      </div>

                      {/* Columns area: sticky me + scrollable others */}
                      <div className="flex overflow-hidden" style={{ minHeight: 0 }}>
                        {/* Sticky: current user column */}
                        {myEntry && (
                          <div
                            className="shrink-0 border-r border-brand/20 bg-[#0d0d0d]"
                            style={{ zIndex: 10 }}
                          >
                            <div className="py-4 px-1">
                              <UserColumn
                                user={myEntry}
                                isMe={true}
                                today={today}
                                onMarkDay={handleMarkDay}
                                onSelectUser={onSelectUser}
                              />
                            </div>
                          </div>
                        )}

                        {/* Scrollable: others */}
                        <div
                          ref={scrollRef}
                          className="flex overflow-x-auto gap-1 px-3 py-4"
                          style={{ scrollbarWidth: "thin" }}
                        >
                          {paginated.map((participant) => (
                            <UserColumn
                              key={participant.id}
                              user={participant}
                              isMe={false}
                              today={today}
                              onSelectUser={onSelectUser}
                            />
                          ))}
                          {paginated.length === 0 && (
                            <div className="flex items-center justify-center py-12 px-8 text-xs text-muted-foreground/50">
                              Нет участников
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="flex items-center gap-4 px-4 py-2 border-t border-[#1a1a1a] bg-[#0a0a0a]">
                        <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wider mr-1">
                          Легенда:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-3 rounded-[3px]" style={{ backgroundColor: "#166534", border: "1px solid #15803d" }} />
                          <span className="text-[10px] text-muted-foreground/60">Выполнено</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-3 rounded-[3px]" style={{ backgroundColor: "#3b0f0f", border: "1px solid #7f1d1d" }} />
                          <span className="text-[10px] text-muted-foreground/60">Пропущено</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-3 rounded-[3px]" style={{ backgroundColor: "#3d2e00", border: "1.5px solid #faad14" }} />
                          <span className="text-[10px] text-muted-foreground/60">Сегодня</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-3 rounded-[3px]" style={{ backgroundColor: "#1e1e1e", border: "1px solid #2a2a2a" }} />
                          <span className="text-[10px] text-muted-foreground/60">Не началось</span>
                        </div>
                      </div>

                      {/* Pagination */}
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
