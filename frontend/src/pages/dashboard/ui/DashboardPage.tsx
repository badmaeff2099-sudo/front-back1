import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  User,
  Trophy,
  LogOut,
  MapPin,
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
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function getStreak(dates: string[] | undefined): number {
  if (!dates?.length) return 0;
  const sorted = [...dates].sort().reverse(); // от новых к старым
  const today = todayISO();
  const yesterday = addDays(today, -1);

  // Серия актуальна если последняя отметка — сегодня или вчера
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let streak = 0;
  let cursor = sorted[0]; // начинаем с самой свежей отметки
  for (const d of sorted) {
    if (d === cursor) {
      streak++;
      cursor = addDays(cursor, -1);
    } else {
      break; // пропуск — серия прервана
    }
  }
  return streak;
}

/**
 * Строим 30 слотов текущего цикла, отсчитывая от даты регистрации.
 *
 * Логика:
 * - День 1 = дата регистрации (registeredAt), день 2 = +1 день и т.д.
 * - Цикл 1 = дни 1..30, цикл 2 = дни 31..60 и т.д.
 * - Определяем текущий цикл по тому, в каком диапазоне находится сегодня.
 * - Отображаем 30 слотов текущего цикла: слот 0 = самый нижний (первый день цикла).
 * - Слоты заполняются снизу вверх: пришёл день — закрасили снизу.
 * - Состояния: done (зелёный), missed (красный), today (жёлтый/зелёный), future (серый).
 */
interface SlotInfo {
  /** порядковый номер слота снизу: 0 = самый нижний (первый день цикла) */
  slotIdx: number;
  date: string;
  state: "done" | "missed" | "today" | "future";
}

/** Прибавить N дней к строке "YYYY-MM-DD" без Date-объектов (нет проблем с таймзоной) */
function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n); // локальное время, без UTC-сдвига
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** Разность дат в днях (b - a), строки "YYYY-MM-DD" */
function diffDays(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const da = new Date(ay, am - 1, ad);
  const db = new Date(by, bm - 1, bd);
  return Math.round((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
}

function buildSlots(completedDates: string[] | undefined, today: string, registeredAt?: string): SlotInfo[] {
  completedDates = completedDates ?? [];

  // Если нет даты регистрации — используем сегодня как точку отсчёта
  const startStr = registeredAt ? registeredAt.slice(0, 10) : today;

  const daysSinceStart = diffDays(startStr, today);

  // Номер текущего цикла (0-based)
  const cycleIndex = daysSinceStart < 0 ? 0 : Math.floor(daysSinceStart / CYCLE);

  // Первый день текущего цикла (строка)
  const cycleStartStr = addDays(startStr, cycleIndex * CYCLE);

  const doneSet = new Set(completedDates);

  const slots: SlotInfo[] = [];
  for (let i = 0; i < CYCLE; i++) {
    const dateStr = addDays(cycleStartStr, i);

    let state: SlotInfo["state"];
    if (dateStr === today) {
      state = doneSet.has(dateStr) ? "done" : "today";
    } else if (dateStr > today) {
      state = "future";
    } else if (doneSet.has(dateStr)) {
      state = "done";
    } else {
      state = "missed";
    }

    slots.push({ slotIdx: i, date: dateStr, state });
  }

  // slots[0] = первый день цикла (нижний квадратик), slots[29] = последний (верхний)
  return slots;
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
  const dates = user.completed_dates ?? [];
  const streak = getStreak(dates);
  const total = dates.length;
  const rank = getRank(total);
  const slots = buildSlots(dates, today, user.created_at);
  const todayMarked = dates.includes(today);

  // Номер текущего цикла (1-based)
  const cycleNumber = (() => {
    const startStr = user.created_at ? user.created_at.slice(0, 10) : today;
    const startDate = new Date(startStr);
    const todayDate = new Date(today);
    const daysSinceStart = Math.floor(
      (todayDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceStart < 0 ? 1 : Math.floor(daysSinceStart / CYCLE) + 1;
  })();
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
        <TooltipTrigger render={
          <button
            onClick={() => onSelectUser(user)}
            className="flex flex-col items-center gap-1.5 group"
          />
        }>
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
        <Flame className="h-3 w-3 text-orange-400 shrink-0" />
        {streak > 0 ? (
          <span className="text-[11px] font-bold text-orange-400 tabular-nums">{streak}</span>
        ) : (
          <span className="text-[10px] text-muted-foreground/30">—</span>
        )}
      </div>

      {/* 30 squares — rendered top to bottom (slot 29 on top, slot 0 on bottom — fills bottom-up) */}
      <div className="flex flex-col gap-[3px]">
        {[...slots].reverse().map((slot) => {
          const isToday = slot.state === "today";
          const isDone = slot.state === "done";
          const isMissed = slot.state === "missed";
          const isFuture = slot.state === "future";

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
          } else if (isFuture) {
            bg = "#111";
            border = "1px solid #1e1e1e";
            title = slot.date;
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
                <TooltipTrigger render={
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
                } />
                <TooltipContent>
                  <p>{title}</p>
                </TooltipContent>
              </Tooltip>
            );
          }

          return (
            <Tooltip key={slot.date}>
              <TooltipTrigger render={
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
              } />
              <TooltipContent>
                <p>{title}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Total days — внизу колонки, тултип с циклом */}
      <Tooltip>
        <TooltipTrigger render={
          <div className="flex items-center gap-1 mt-0.5 cursor-default" />
        }>
          <Trophy className="h-2.5 w-2.5 text-muted-foreground/50 shrink-0" />
          <span className="text-[10px] text-muted-foreground/50 tabular-nums">{total}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Всего дней: {total} · Цикл {cycleNumber}</p>
        </TooltipContent>
      </Tooltip>
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
  const [allUsers, setAllUsers] = useState<UserType[]>([]); // все без фильтра локации
  const [friendIds, setFriendIds] = useState<Set<number>>(new Set());
  // Локальная копия текущего пользователя — обновляется при отметке дня,
  // не зависит от фильтра локации и наличия в participants
  const [myData, setMyData] = useState<UserType>({
    ...currentUser,
    completed_dates: currentUser.completed_dates ?? [],
  });
  const [viewMode, setViewMode] = useState<"all" | "friends">("all");
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [sortBy, setSortBy] = useState<"streak" | "total">("streak");

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

  // Загружаем ВСЕХ пользователей (без фильтра локации) — источник данных для вкладки «Друзья»
  const loadAllUsers = async () => {
    const res = await getUsers("");
    if (res.success) {
      setAllUsers(res.users);
    }
  };

  // Загружаем только ID друзей
  const loadFriendIds = async () => {
    const res = await getFriends(currentUser.id);
    if (res.success) {
      const ids = new Set<number>(
        (res.friends ?? []).map((f: any) => Number(f.id))
      );
      setFriendIds(ids);
    }
  };

  useEffect(() => {
    const loc = currentUser.location || "";
    setSelectedLocation(loc);
    setMyData({ ...currentUser, completed_dates: currentUser.completed_dates ?? [] }); // сбрасываем при смене пользователя
    loadParticipants(loc);
    loadAllUsers();
    loadFriendIds();
  }, [currentUser]);

  const handleLocationChange = (loc: string) => {
    const val = loc === "__all__" ? "" : loc;
    setSelectedLocation(val);
    setCurrentPage(1);
    loadParticipants(val);
  };

  const handleMarkDay = () => {
    const addToday = (list: UserType[]) =>
      list.map((p) =>
        Number(p.id) === Number(currentUser.id)
          ? { ...p, completed_dates: [...(p.completed_dates ?? []), today] }
          : p,
      );
    setMyData((prev) => ({
      ...prev,
      completed_dates: [...(prev.completed_dates ?? []), today],
    }));
    setParticipants(addToday);
    setAllUsers(addToday);
  };

  // «Все» — из participants (с фильтром локации).
  // «Друзья» — из allUsers (без фильтра локации), отфильтрованных по friendIds.
  const othersBase = (() => {
    if (viewMode === "friends") {
      return allUsers.filter(
        (u) => Number(u.id) !== Number(currentUser.id) && friendIds.has(Number(u.id))
      );
    }
    return participants.filter((p) => Number(p.id) !== Number(currentUser.id));
  })();

  const sortedOthers = [...othersBase].sort((a, b) => {
    const valA = sortBy === "streak" ? getStreak(a.completed_dates) : (a.completed_dates?.length ?? 0);
    const valB = sortBy === "streak" ? getStreak(b.completed_dates) : (b.completed_dates?.length ?? 0);
    return sortDir === "desc" ? valB - valA : valA - valB;
  });

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
                      const total = myData.completed_dates.length ?? 0;
                      const streak = getStreak(myData.completed_dates);
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
                            onClick={() => { setViewMode("friends"); setCurrentPage(1); loadAllUsers(); loadFriendIds(); }}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${viewMode === "friends" ? "bg-brand/20 text-brand" : "text-muted-foreground hover:text-foreground"}`}
                          >
                            <Users className="h-2.5 w-2.5" /> Друзья
                          </button>
                        </div>
                        <div className="flex items-center gap-1 ml-auto">
                          <button
                            onClick={() => {
                              if (sortBy === "streak") setSortDir((d) => d === "desc" ? "asc" : "desc");
                              else { setSortBy("streak"); setSortDir("desc"); }
                              setCurrentPage(1);
                            }}
                            title="По стрику"
                            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[12px] transition-colors ${sortBy === "streak" ? "bg-orange-500/20 text-orange-400" : "text-muted-foreground hover:text-foreground"}`}
                          >
                            🔥 {sortBy === "streak" && <span className="text-[9px]">{sortDir === "desc" ? "↑" : "↓"}</span>}
                          </button>
                          <button
                            onClick={() => {
                              if (sortBy === "total") setSortDir((d) => d === "desc" ? "asc" : "desc");
                              else { setSortBy("total"); setSortDir("desc"); }
                              setCurrentPage(1);
                            }}
                            title="По количеству дней"
                            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[12px] transition-colors ${sortBy === "total" ? "bg-brand/20 text-brand" : "text-muted-foreground hover:text-foreground"}`}
                          >
                            🏆 {sortBy === "total" && <span className="text-[9px]">{sortDir === "desc" ? "↑" : "↓"}</span>}
                          </button>
                        </div>
                      </div>

                      {/* Columns area: sticky me + scrollable others */}
                      <div className="flex overflow-hidden" style={{ minHeight: 0 }}>
                        {/* Sticky: current user column — всегда из myData, не зависит от фильтра локации */}
                        <div
                          className="shrink-0 border-r border-brand/20 bg-[#0d0d0d]"
                          style={{ zIndex: 10 }}
                        >
                          <div className="py-4 px-1">
                            <UserColumn
                              user={myData}
                              isMe={true}
                              today={today}
                              onMarkDay={handleMarkDay}
                              onSelectUser={onSelectUser}
                            />
                          </div>
                        </div>

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
