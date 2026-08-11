import { useMemo, useState } from "react";
import { ArrowLeft, Target, CheckCircle, XCircle, Moon } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { UserAvatar } from "@/entities/user/ui/UserAvatar";
import {
  buildDisciplineHistory,
  calcDiscipline,
  POINTS_DONE,
  POINTS_MISSED,
  type DisciplinePoint,
} from "@/shared/lib/discipline";
import type { User as UserType } from "@/entities/user/model/types";

interface DisciplinePageProps {
  user: UserType;
  onBack: () => void;
}

const RANGES = [
  { label: "30 дней", days: 30 },
  { label: "90 дней", days: 90 },
  { label: "Всё время", days: 0 },
] as const;

// Геометрия графика в координатах viewBox
const VB_W = 900;
const VB_H = 340;
const PAD_L = 52;
const PAD_R = 16;
const PAD_T = 16;
const PAD_B = 44;

const PLOT_W = VB_W - PAD_L - PAD_R;
const PLOT_H = VB_H - PAD_T - PAD_B;

function formatDay(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
}

/** Красивый шаг для сетки, чтобы подписи оси были круглыми числами. */
function niceStep(range: number, target = 6) {
  const raw = Math.max(1, range / target);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return step * mag;
}

export default function DisciplinePage({ user, onBack }: DisciplinePageProps) {
  const [rangeDays, setRangeDays] = useState<number>(30);
  const [hover, setHover] = useState<number | null>(null);

  const fullHistory = useMemo(
    () =>
      buildDisciplineHistory(
        user.completed_dates ?? [],
        user.rest_dates ?? [],
        user.created_at,
      ),
    [user.completed_dates, user.rest_dates, user.created_at],
  );

  const totals = useMemo(
    () =>
      calcDiscipline(
        user.completed_dates ?? [],
        user.rest_dates ?? [],
        user.created_at,
      ),
    [user.completed_dates, user.rest_dates, user.created_at],
  );

  const history: DisciplinePoint[] = useMemo(
    () => (rangeDays > 0 ? fullHistory.slice(-rangeDays) : fullHistory),
    [fullHistory, rangeDays],
  );

  // Шкала Y охватывает и накопительный балл, и ноль
  const scores = history.map((p) => p.score);
  const rawMin = Math.min(0, ...(scores.length ? scores : [0]));
  const rawMax = Math.max(0, ...(scores.length ? scores : [0]));
  const step = niceStep(rawMax - rawMin || 10);
  const yMin = Math.floor(rawMin / step) * step;
  const yMax = Math.ceil(rawMax / step) * step;
  const ySpan = yMax - yMin || 1;

  const xFor = (i: number) =>
    PAD_L + (history.length <= 1 ? PLOT_W / 2 : (i / (history.length - 1)) * PLOT_W);
  const yFor = (v: number) => PAD_T + PLOT_H - ((v - yMin) / ySpan) * PLOT_H;

  const gridLines: number[] = [];
  for (let v = yMin; v <= yMax; v += step) gridLines.push(v);

  const linePath = history
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i).toFixed(2)} ${yFor(p.score).toFixed(2)}`)
    .join(" ");

  const areaPath = history.length
    ? `${linePath} L ${xFor(history.length - 1).toFixed(2)} ${yFor(yMin < 0 ? 0 : yMin).toFixed(2)} L ${xFor(0).toFixed(2)} ${yFor(yMin < 0 ? 0 : yMin).toFixed(2)} Z`
    : "";

  // Подписи по X — не чаще, чем влезает без наложения
  const labelEvery = Math.max(1, Math.ceil(history.length / 10));

  const active = hover !== null ? history[hover] : null;

  const statusColor = (s: DisciplinePoint["status"]) =>
    s === "done" ? "#22c55e" : s === "rest" ? "#a1a1aa" : "#ef4444";

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

        {/* Заголовок */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-lg p-6 mb-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <UserAvatar
                avatarUrl={user.avatar_url}
                username={user.username}
                size={48}
              />
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Target className="h-5 w-5 text-brand" /> Discipline Score
                </h2>
                <p className="text-sm text-muted-foreground">{user.username}</p>
              </div>
            </div>
            <div className="text-right">
              <p
                className={`text-4xl font-bold tabular-nums ${
                  totals.score >= 0 ? "text-brand" : "text-red-400"
                }`}
              >
                {totals.score}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">баллов</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-[#1e1e1e]">
            Выполненный день{" "}
            <span className="text-green-400 font-semibold">+{POINTS_DONE}</span>, пропущенный{" "}
            <span className="text-red-400 font-semibold">{POINTS_MISSED}</span>. Дни, отмеченные
            как выходной, не учитываются. Ниже{" "}
            <span className="font-semibold">0</span> балл не опускается.
          </p>
        </div>

        {/* Разбивка */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {[
            {
              label: "Выполнено",
              value: totals.completedDays,
              sub: `+${totals.earnedPoints}`,
              color: "text-green-400",
              Icon: CheckCircle,
            },
            {
              label: "Пропущено",
              value: totals.missedDays,
              sub: `${totals.penaltyPoints}`,
              color: "text-red-400",
              Icon: XCircle,
            },
            {
              label: "Выходные",
              value: totals.restDays,
              sub: "0",
              color: "text-muted-foreground",
              Icon: Moon,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-[#111] border border-[#1e1e1e] rounded-lg p-5"
            >
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                <s.Icon className={`h-3.5 w-3.5 ${s.color}`} /> {s.label}
              </p>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {s.value}
                <span className={`text-sm font-semibold ml-2 ${s.color}`}>
                  {s.sub}
                </span>
              </p>
            </div>
          ))}
        </div>

        {/* График */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-lg p-6">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Динамика баллов
              </h3>
              <p className="text-xs text-muted-foreground">
                По вертикали — баллы, по горизонтали — дни
              </p>
            </div>
            <div className="flex gap-1">
              {RANGES.map((r) => (
                <button
                  key={r.label}
                  onClick={() => {
                    setRangeDays(r.days);
                    setHover(null);
                  }}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    rangeDays === r.days
                      ? "bg-brand/20 text-brand"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {history.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Пока нет данных — отметьте первый день, и график появится.
            </div>
          ) : (
            <>
              <svg
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                className="w-full h-auto select-none"
                onMouseLeave={() => setHover(null)}
                role="img"
                aria-label="График Discipline Score по дням"
              >
                <defs>
                  <linearGradient id="ds-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand, #7c5cff)" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="var(--brand, #7c5cff)" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Горизонтальная сетка + подписи оси Y */}
                {gridLines.map((v) => (
                  <g key={v}>
                    <line
                      x1={PAD_L}
                      y1={yFor(v)}
                      x2={VB_W - PAD_R}
                      y2={yFor(v)}
                      stroke={v === 0 ? "#3f3f46" : "#1e1e1e"}
                      strokeWidth={v === 0 ? 1.5 : 1}
                    />
                    <text
                      x={PAD_L - 10}
                      y={yFor(v) + 4}
                      textAnchor="end"
                      fontSize="12"
                      fill="#71717a"
                    >
                      {v}
                    </text>
                  </g>
                ))}

                {/* Область под линией */}
                {areaPath && <path d={areaPath} fill="url(#ds-area)" />}

                {/* Линия накопительного балла */}
                <path
                  d={linePath}
                  fill="none"
                  stroke="var(--brand, #7c5cff)"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />

                {/* Точки по дням + подписи оси X */}
                {history.map((p, i) => (
                  <g key={p.date}>
                    <circle
                      cx={xFor(i)}
                      cy={yFor(p.score)}
                      r={hover === i ? 5 : history.length > 60 ? 0 : 3}
                      fill={statusColor(p.status)}
                    />
                    {i % labelEvery === 0 && (
                      <text
                        x={xFor(i)}
                        y={VB_H - PAD_B + 20}
                        textAnchor="middle"
                        fontSize="11"
                        fill="#71717a"
                      >
                        {formatDay(p.date)}
                      </text>
                    )}
                    {/* Прозрачная зона наведения */}
                    <rect
                      x={xFor(i) - Math.max(4, PLOT_W / Math.max(1, history.length) / 2)}
                      y={PAD_T}
                      width={Math.max(8, PLOT_W / Math.max(1, history.length))}
                      height={PLOT_H}
                      fill="transparent"
                      onMouseEnter={() => setHover(i)}
                    />
                  </g>
                ))}

                {/* Вертикальная линия под курсором */}
                {active && hover !== null && (
                  <line
                    x1={xFor(hover)}
                    y1={PAD_T}
                    x2={xFor(hover)}
                    y2={PAD_T + PLOT_H}
                    stroke="#52525b"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                )}
              </svg>

              {/* Подпись под графиком — состояние выбранного дня */}
              <div className="mt-3 min-h-[42px] flex items-center justify-between flex-wrap gap-3 border-t border-[#1e1e1e] pt-3">
                {active ? (
                  <>
                    <span className="text-sm text-foreground font-medium">
                      {formatDay(active.date)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {active.status === "done"
                        ? "Выполнено"
                        : active.status === "rest"
                          ? "Выходной"
                          : "Пропущено"}
                      <span
                        className="font-semibold ml-2"
                        style={{ color: statusColor(active.status) }}
                      >
                        {active.delta > 0 ? `+${active.delta}` : active.delta}
                      </span>
                      <span className="ml-3">
                        Итого:{" "}
                        <span className="font-semibold text-foreground tabular-nums">
                          {active.score}
                        </span>
                      </span>
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Наведите на график, чтобы увидеть детали дня
                  </span>
                )}
              </div>

              {/* Легенда */}
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                {[
                  { c: "#22c55e", t: `Выполнено +${POINTS_DONE}` },
                  { c: "#ef4444", t: `Пропущено ${POINTS_MISSED}` },
                  { c: "#a1a1aa", t: "Выходной 0" },
                ].map((l) => (
                  <span
                    key={l.t}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: l.c }}
                    />
                    {l.t}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
