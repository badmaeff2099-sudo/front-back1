import { useState, useEffect, useRef, useCallback } from "react"
import { ArrowLeft, Target, BarChart2, CalendarDays, ListChecks, Plus, Trash2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import type { User as UserType } from "@/entities/user/model/types"
import { getGoals500, saveGoals500, getPlanner, savePlanner, getProgressYear } from "@/shared/api/client"

/* ─── Planner types & helpers ───────────────────────────────── */
interface NoteItem { id: number; text: string }
interface PlannerData {
  lastDate: string
  today: NoteItem[]
  tomorrow: NoteItem[]
}

function makeLines(count = 5): NoteItem[] {
  return Array.from({ length: count }, (_, i) => ({ id: i + 1, text: "" }))
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

interface CabinetPageProps {
  currentUser: UserType
  onBack: () => void
}

type Section = "goal" | "stats" | "planner" | "goals500"

interface PlanRow {
  id: number
  task: string
  steps: string
  deadline: string
}

const NAV_ITEMS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: "goal",    label: "Моя цель",        icon: <Target className="h-4 w-4" /> },
  { id: "stats",   label: "Моя статистика",  icon: <BarChart2 className="h-4 w-4" /> },
  { id: "planner", label: "Мой планнер",     icon: <CalendarDays className="h-4 w-4" /> },
  { id: "goals500",label: "Мои 500 целей",   icon: <ListChecks className="h-4 w-4" /> },
]

function makeRow(id: number): PlanRow {
  return { id, task: "", steps: "", deadline: "" }
}

function GoalSection({ currentUser }: { currentUser: UserType }) {
  const storageKey = `cabinet-plan-${currentUser.id}`
  const [rows, setRows] = useState<PlanRow[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) return JSON.parse(saved)
    } catch {}
    return Array.from({ length: 10 }, (_, i) => makeRow(i + 1))
  })

  const save = (updated: PlanRow[]) => {
    setRows(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))
  }

  const updateCell = (id: number, field: keyof Omit<PlanRow, "id">, value: string) => {
    save(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  const addRow = () => {
    const nextId = rows.length > 0 ? Math.max(...rows.map((r) => r.id)) + 1 : 1
    save([...rows, makeRow(nextId)])
  }

  const removeRow = (id: number) => {
    if (rows.length <= 1) return
    save(rows.filter((r) => r.id !== id))
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Goal display */}
      <div className="flex flex-col items-center gap-3 py-8 px-4 bg-[#111] border border-[#1e1e1e] rounded-xl">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Моя цель</p>
        {currentUser.goal ? (
          <h2 className="text-3xl font-bold text-foreground text-center leading-snug max-w-2xl">
            {currentUser.goal}
          </h2>
        ) : (
          <p className="text-muted-foreground text-center text-sm">
            Цель не задана. Укажите её в разделе «Мой профиль».
          </p>
        )}
      </div>

      {/* Plan table */}
      <div className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1e1e1e]">
          <h3 className="text-sm font-semibold text-foreground">Мой подробный план достижения цели</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e1e1e]">
                <th className="w-10 px-3 py-2.5 text-[10px] text-muted-foreground uppercase tracking-wider text-center font-medium">#</th>
                <th className="px-4 py-2.5 text-[10px] text-muted-foreground uppercase tracking-wider text-left font-medium min-w-[180px]">Задачи</th>
                <th className="px-4 py-2.5 text-[10px] text-muted-foreground uppercase tracking-wider text-left font-medium min-w-[220px]">Мои шаги, действия</th>
                <th className="px-4 py-2.5 text-[10px] text-muted-foreground uppercase tracking-wider text-left font-medium min-w-[130px]">Сроки</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#161616]">
              {rows.map((row, idx) => (
                <tr key={row.id} className="group hover:bg-[#161616] transition-colors">
                  <td className="px-3 py-2 text-center text-xs text-muted-foreground/50 tabular-nums select-none">
                    {idx + 1}
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      value={row.task}
                      onChange={(e) => updateCell(row.id, "task", e.target.value)}
                      placeholder="Введите задачу..."
                      className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none px-2 py-1 rounded hover:bg-[#1a1a1a] focus:bg-[#1a1a1a] transition-colors"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      value={row.steps}
                      onChange={(e) => updateCell(row.id, "steps", e.target.value)}
                      placeholder="Опишите шаги..."
                      className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none px-2 py-1 rounded hover:bg-[#1a1a1a] focus:bg-[#1a1a1a] transition-colors"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      value={row.deadline}
                      onChange={(e) => updateCell(row.id, "deadline", e.target.value)}
                      placeholder="напр. 30 дней"
                      className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none px-2 py-1 rounded hover:bg-[#1a1a1a] focus:bg-[#1a1a1a] transition-colors"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <button
                      onClick={() => removeRow(row.id)}
                      disabled={rows.length <= 1}
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 disabled:pointer-events-none"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add row */}
        <div className="border-t border-[#1e1e1e]">
          <button
            onClick={addRow}
            className="w-full flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground hover:text-foreground hover:bg-[#161616] transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Добавить строку
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Sticky note card ──────────────────────────────────────── */
interface StickyNoteProps {
  title: string
  items: NoteItem[]
  readonly?: boolean
  tilt?: string
  onAdd: () => void
  onChange: (id: number, value: string) => void
}

function StickyNote({ title, items, readonly = false, tilt = "", onAdd, onChange }: StickyNoteProps) {
  return (
    <div
      className={`flex flex-col bg-[#fef9c3] border border-[#e8c93a]/50 rounded-xl shadow-lg overflow-hidden ${tilt} transition-transform`}
      style={{ minWidth: 0 }}
    >
      {/* Pin */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-3 h-3 rounded-full bg-[#e05252] shadow-sm border border-[#c43b3b]/40" />
      </div>

      {/* Title */}
      <div className="px-5 pb-2 pt-1">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#8b6914] text-center">
          {title}
        </p>
        {readonly && (
          <p className="text-[9px] text-[#a07820]/60 text-center mt-0.5 uppercase tracking-wider">
            только просмотр
          </p>
        )}
      </div>

      {/* Lines */}
      <div className="flex flex-col px-4 pb-2">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="flex items-center gap-2 border-b border-[#d4b84a]/40 py-1.5 group"
          >
            <span className="text-[11px] text-[#b08a1e]/60 w-4 shrink-0 text-right select-none font-medium">
              {idx + 1}
            </span>
            <input
              value={item.text}
              readOnly={readonly}
              onChange={(e) => onChange(item.id, e.target.value)}
              placeholder={readonly ? "" : "Запишите план..."}
              className={`flex-1 bg-transparent text-sm font-medium focus:outline-none placeholder:text-[#b08a1e]/30
                ${readonly
                  ? "text-[#4a3a0a]/70 cursor-default select-text"
                  : "text-[#2a1e00] caret-[#8b6914]"
                }`}
            />
          </div>
        ))}
      </div>

      {/* Add button */}
      {!readonly && (
        <button
          onClick={onAdd}
          className="mx-4 mb-4 mt-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg
            border border-dashed border-[#c9a02a]/50
            text-[12px] font-semibold text-[#8b6914]
            hover:bg-[#fef08a] hover:border-[#c9a02a] transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Добавить строку
        </button>
      )}
      {readonly && <div className="mb-3" />}
    </div>
  )
}

/* ─── Planner section ───────────────────────────────────────── */
function PlannerSection({ currentUser }: { currentUser: UserType }) {
  const [data, setData] = useState<PlannerData>({ lastDate: todayStr(), today: [], tomorrow: [] })
  const [loading, setLoading] = useState(true)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* Загрузка из БД (ротация выполняется на бэкенде) */
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getPlanner(currentUser.id)
      .then((res) => {
        if (cancelled) return
        if (res?.success) {
          setData({
            lastDate: res.lastDate ?? todayStr(),
            today: Array.isArray(res.today) && res.today.length ? res.today : makeLines(),
            tomorrow: Array.isArray(res.tomorrow) ? res.tomorrow : [],
          })
        } else {
          setData({ lastDate: todayStr(), today: makeLines(), tomorrow: makeLines() })
        }
      })
      .catch(() => {
        if (!cancelled) setData({ lastDate: todayStr(), today: makeLines(), tomorrow: makeLines() })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [currentUser.id])

  /* Сохранение в БД (с дебаунсом) */
  const saveData = (updated: PlannerData) => {
    setData(updated)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      savePlanner(
        currentUser.id,
        updated.today.map((i) => ({ text: i.text })),
        updated.tomorrow.map((i) => ({ text: i.text })),
      ).catch(() => {})
    }, 500)
  }

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  const handleTomorrowChange = (id: number, value: string) => {
    saveData({
      ...data,
      tomorrow: data.tomorrow.map((item) => (item.id === id ? { ...item, text: value } : item)),
    })
  }

  const addTomorrowLine = () => {
    const nextId = data.tomorrow.length > 0 ? Math.max(...data.tomorrow.map((i) => i.id)) + 1 : 1
    saveData({ ...data, tomorrow: [...data.tomorrow, { id: nextId, text: "" }] })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
        Загрузка планнера...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Мой планнер</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Записывайте планы на завтра — они автоматически станут планами на сегодня в новый день.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <StickyNote
          title="Планы на сегодня"
          items={data.today}
          tilt="sm:-rotate-1"
          onAdd={() => {
            const nextId = data.today.length > 0 ? Math.max(...data.today.map((i) => i.id)) + 1 : 1
            saveData({ ...data, today: [...data.today, { id: nextId, text: "" }] })
          }}
          onChange={(id, value) => {
            saveData({
              ...data,
              today: data.today.map((item) => (item.id === id ? { ...item, text: value } : item)),
            })
          }}
        />
        <StickyNote
          title="Планы на завтра"
          items={data.tomorrow}
          tilt="sm:rotate-1"
          onAdd={addTomorrowLine}
          onChange={handleTomorrowChange}
        />
      </div>
    </div>
  )
}

/* ─── Goals 500 section ─────────────────────────────────────── */
const MAX_GOALS = 10000

interface GoalEntry {
  /** Уникальный стабильный ID — не меняется при перемещении */
  uid: number
  /** Текст цели */
  text: string
  /** Выполнена? */
  done: boolean
}

interface ContextMenu {
  x: number
  y: number
  index: number
}

function Goals500Section({ currentUser }: { currentUser: UserType }) {
  const [goals, setGoals] = useState<GoalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [nextUid, setNextUid] = useState<number>(1)

  const [menu, setMenu] = useState<ContextMenu | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* Загрузка из БД */
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getGoals500(currentUser.id)
      .then((res) => {
        if (cancelled) return
        const rows: { text: string; done: boolean | string }[] =
          res?.success && Array.isArray(res.goals) ? res.goals : []
        const loaded: GoalEntry[] = rows.length
          ? rows.map((r, i) => ({
              uid: i + 1,
              text: r.text ?? "",
              done: r.done === true || r.done === "t" || r.done === "1",
            }))
          : Array.from({ length: 10 }, (_, i) => ({ uid: i + 1, text: "", done: false }))
        setGoals(loaded)
        setNextUid(loaded.length + 1)
      })
      .catch(() => {
        if (cancelled) return
        setGoals(Array.from({ length: 10 }, (_, i) => ({ uid: i + 1, text: "", done: false })))
        setNextUid(11)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [currentUser.id])

  /* Сохранение в БД (с дебаунсом) */
  const persist = useCallback(
    (updated: GoalEntry[]) => {
      setGoals(updated)
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        saveGoals500(
          currentUser.id,
          updated.map((g) => ({ text: g.text, done: g.done })),
        ).catch(() => {})
      }, 500)
    },
    [currentUser.id],
  )

  /* Сброс таймера сохранения при размонтировании */
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  /* Закрыть меню при клике вне */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(null)
      }
    }
    if (menu) {
      document.addEventListener("mousedown", handler)
    }
    return () => document.removeEventListener("mousedown", handler)
  }, [menu])

  /* ПКМ по строке */
  const handleContextMenu = (e: React.MouseEvent, index: number) => {
    e.preventDefault()
    setMenu({ x: e.clientX, y: e.clientY, index })
  }

  /* Переместить вверх (меняем позицию в массиве, не uid) */
  const moveUp = (index: number) => {
    if (index === 0) return
    const next = [...goals]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    persist(next)
    setMenu(null)
  }

  /* Переместить вниз */
  const moveDown = (index: number) => {
    if (index === goals.length - 1) return
    const next = [...goals]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    persist(next)
    setMenu(null)
  }

  /* Изменить текст */
  const updateText = (uid: number, text: string) => {
    persist(goals.map((g) => (g.uid === uid ? { ...g, text } : g)))
  }

  /* Переключить выполнение */
  const toggleDone = (uid: number) => {
    persist(goals.map((g) => (g.uid === uid ? { ...g, done: !g.done } : g)))
  }

  /* Добавить строку */
  const addGoal = () => {
    if (goals.length >= MAX_GOALS) return
    const newGoal: GoalEntry = { uid: nextUid, text: "", done: false }
    setNextUid((n) => n + 1)
    persist([...goals, newGoal])
  }

  const doneCount = goals.filter((g) => g.done).length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
        Загрузка целей...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Мои 500 целей</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Правая кнопка мыши по строке — переместить вверх или вниз.
            Выполнено: <span className="text-foreground font-medium">{doneCount}</span> / {goals.length}
          </p>
        </div>
        {goals.length < MAX_GOALS && (
          <span className="text-[10px] text-muted-foreground/50 tabular-nums">
            {goals.length} / {MAX_GOALS}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e1e1e]">
                <th className="w-12 px-3 py-2.5 text-[10px] text-muted-foreground uppercase tracking-wider text-center font-medium select-none">
                  №
                </th>
                <th className="px-4 py-2.5 text-[10px] text-muted-foreground uppercase tracking-wider text-left font-medium">
                  Цель
                </th>
                <th className="w-24 px-3 py-2.5 text-[10px] text-muted-foreground uppercase tracking-wider text-center font-medium select-none">
                  Выполнено
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#161616]">
              {goals.map((goal, idx) => (
                <tr
                  key={goal.uid}
                  onContextMenu={(e) => handleContextMenu(e, idx)}
                  className={`group transition-colors cursor-default select-none
                    ${goal.done
                      ? "bg-[#0d1a0d] hover:bg-[#0f1f0f]"
                      : "hover:bg-[#161616]"
                    }`}
                >
                  {/* Номер — фиксированный, не меняется при перемещении */}
                  <td className="px-3 py-2 text-center text-xs text-muted-foreground/40 tabular-nums select-none w-12">
                    {idx + 1}
                  </td>

                  {/* Цель */}
                  <td className="px-2 py-1.5">
                    <input
                      value={goal.text}
                      onChange={(e) => updateText(goal.uid, e.target.value)}
                      placeholder="Введите цель..."
                      onContextMenu={(e) => e.stopPropagation()}
                      className={`w-full bg-transparent text-sm focus:outline-none px-2 py-1 rounded
                        hover:bg-[#1a1a1a] focus:bg-[#1a1a1a] transition-colors cursor-text select-text
                        placeholder:text-muted-foreground/25
                        ${goal.done
                          ? "text-muted-foreground/40 line-through"
                          : "text-foreground"
                        }`}
                    />
                  </td>

                  {/* Чекбокс */}
                  <td className="px-3 py-2 text-center w-24">
                    <button
                      onClick={() => toggleDone(goal.uid)}
                      onContextMenu={(e) => e.stopPropagation()}
                      aria-label={goal.done ? "Отметить не выполненной" : "Отметить выполненной"}
                      className={`w-5 h-5 mx-auto flex items-center justify-center rounded border transition-all
                        ${goal.done
                          ? "bg-green-500/20 border-green-500/50 text-green-400"
                          : "border-[#2e2e2e] text-transparent hover:border-[#444] hover:text-muted-foreground/30"
                        }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 12 12"
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="2,6 5,9 10,3" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add button */}
        <div className="border-t border-[#1e1e1e]">
          {goals.length < MAX_GOALS ? (
            <button
              onClick={addGoal}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-xs text-muted-foreground hover:text-foreground hover:bg-[#161616] transition-colors"
            >
              <Plus className="h-4 w-4" />
              Добавить цель
            </button>
          ) : (
            <p className="text-center py-3 text-xs text-muted-foreground/40">
              Достигнут лимит {MAX_GOALS.toLocaleString("ru")} целей
            </p>
          )}
        </div>
      </div>

      {/* Context menu (portal-like, fixed to viewport) */}
      {menu && (
        <div
          ref={menuRef}
          style={{ position: "fixed", top: menu.y, left: menu.x, zIndex: 9999 }}
          className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg shadow-2xl overflow-hidden min-w-[180px] py-1"
        >
          <div className="px-3 py-1.5 border-b border-[#252525] mb-1">
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">
              Строка {menu.index + 1}
            </p>
          </div>
          <button
            disabled={menu.index === 0}
            onClick={() => moveUp(menu.index)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground/80
              hover:bg-[#252525] hover:text-foreground transition-colors
              disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
            Переместить вверх
          </button>
          <button
            disabled={menu.index === goals.length - 1}
            onClick={() => moveDown(menu.index)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground/80
              hover:bg-[#252525] hover:text-foreground transition-colors
              disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
            Переместить вниз
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── Stats section: годовая сетка стрика ───────────────────── */
type DayStatus = "done" | "rest" | "missed" | "empty"

interface YearDay {
  date: string
  status: DayStatus
}

const MONTH_LABELS = [
  "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
  "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
]

const WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]

const CELL_STYLE: Record<DayStatus, string> = {
  done:   "bg-green-500 border-green-400/40",
  rest:   "bg-yellow-400 border-yellow-300/40",
  missed: "bg-red-500 border-red-400/40",
  empty:  "bg-[#242424] border-[#2e2e2e]",
}

const STATUS_LABEL: Record<DayStatus, string> = {
  done:   "выполнено",
  rest:   "выходной",
  missed: "пропущено",
  empty:  "нет отметки",
}

const LEGEND: { status: DayStatus; label: string }[] = [
  { status: "done",   label: "Отмеченные" },
  { status: "rest",   label: "Выходные" },
  { status: "missed", label: "Пропущенные" },
  { status: "empty",  label: "Без отметки" },
]

/** Разбивает дни года по месяцам и дополняет каждый месяц пустыми
 *  ячейками в начале, чтобы недели выстраивались в колонки (Пн — сверху). */
function buildMonths(days: YearDay[]): (YearDay | null)[][] {
  const months: (YearDay | null)[][] = Array.from({ length: 12 }, () => [])

  for (const day of days) {
    const d = new Date(`${day.date}T00:00:00`)
    const monthIndex = d.getMonth()
    if (months[monthIndex].length === 0) {
      // getDay(): 0 = Вс. Приводим к понедельнику как началу недели.
      const offset = (d.getDay() + 6) % 7
      for (let i = 0; i < offset; i++) months[monthIndex].push(null)
    }
    months[monthIndex].push(day)
  }

  return months
}

function formatDateRu(date: string): string {
  const d = new Date(`${date}T00:00:00`)
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`
}

function YearGrid({ days }: { days: YearDay[] }) {
  const months = buildMonths(days)

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-4 min-w-max pb-1">
        {/* Подписи дней недели */}
        <div className="flex flex-col gap-[3px] pt-[18px] shrink-0">
          {WEEKDAY_LABELS.map((label, i) => (
            <div
              key={label}
              className="h-[11px] text-[9px] leading-[11px] text-muted-foreground/40 select-none w-5 text-right"
            >
              {i % 2 === 1 ? label : ""}
            </div>
          ))}
        </div>

        {months.map((cells, monthIndex) => {
          const weeks: (YearDay | null)[][] = []
          for (let i = 0; i < cells.length; i += 7) {
            const week = cells.slice(i, i + 7)
            while (week.length < 7) week.push(null)
            weeks.push(week)
          }

          return (
            <div key={monthIndex} className="flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground/60 select-none h-[14px]">
                {MONTH_LABELS[monthIndex]}
              </span>
              <div className="flex gap-[3px]">
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-[3px]">
                    {week.map((day, di) =>
                      day ? (
                        <div
                          key={day.date}
                          title={`${formatDateRu(day.date)} — ${STATUS_LABEL[day.status]}`}
                          className={`w-[11px] h-[11px] rounded-[2px] border ${CELL_STYLE[day.status]}`}
                        />
                      ) : (
                        <div key={`${wi}-${di}`} className="w-[11px] h-[11px]" />
                      ),
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatsSection({ currentUser }: { currentUser: UserType }) {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [days, setDays] = useState<YearDay[]>([])
  const [counts, setCounts] = useState<Record<DayStatus, number> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getProgressYear(currentUser.id, year)
      .then((res) => {
        if (cancelled) return
        if (res?.success && Array.isArray(res.days)) {
          setDays(res.days)
          setCounts(res.counts ?? null)
        } else {
          setError(res?.message ?? "Не удалось загрузить статистику")
          setDays([])
          setCounts(null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Не удалось загрузить статистику")
          setDays([])
          setCounts(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [currentUser.id, year])

  return (
    <div className="flex flex-col gap-6">
      {/* Годовая сетка стрика */}
      <div className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e1e]">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Стрик за год</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Каждая клетка — один день. Наведите курсор, чтобы увидеть дату.
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setYear((y) => y - 1)}
              aria-label="Предыдущий год"
              className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-[#1e1e1e] transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-foreground tabular-nums w-12 text-center select-none">
              {year}
            </span>
            <button
              onClick={() => setYear((y) => y + 1)}
              disabled={year >= currentYear}
              aria-label="Следующий год"
              className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-[#1e1e1e] transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-5 py-5">
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Загрузка статистики...</p>
          ) : error ? (
            <p className="text-sm text-red-400/80 py-8 text-center">{error}</p>
          ) : (
            <YearGrid days={days} />
          )}
        </div>

        {/* Легенда */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3 border-t border-[#1e1e1e]">
          {LEGEND.map((item) => (
            <div key={item.status} className="flex items-center gap-1.5">
              <span className={`w-[11px] h-[11px] rounded-[2px] border ${CELL_STYLE[item.status]}`} />
              <span className="text-[11px] text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Сводка за год */}
      {counts && !loading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {LEGEND.map((item) => (
            <div
              key={item.status}
              className="bg-[#111] border border-[#1e1e1e] rounded-xl px-4 py-3 flex flex-col gap-1"
            >
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {item.label}
              </span>
              <span className="text-xl font-bold text-foreground tabular-nums">
                {counts[item.status] ?? 0}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 bg-[#111] border border-[#1e1e1e] rounded-xl">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">Раздел в разработке</p>
    </div>
  )
}

export default function CabinetPage({ currentUser, onBack }: CabinetPageProps) {
  const [active, setActive] = useState<Section>("goal")

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Назад
        </button>

        <h1 className="text-xl font-bold text-foreground mb-6">Мой кабинет</h1>

        <div className="flex gap-6 items-start">
          {/* Sidebar nav */}
          <nav className="w-52 shrink-0 bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left border-b border-[#1a1a1a] last:border-0 ${
                  active === item.id
                    ? "bg-brand/10 text-brand font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-[#161616]"
                }`}
              >
                <span className={active === item.id ? "text-brand" : "text-muted-foreground/60"}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {active === "goal"     && <GoalSection currentUser={currentUser} />}
            {active === "stats"    && <StatsSection currentUser={currentUser} />}
            {active === "planner"  && <PlannerSection currentUser={currentUser} />}
            {active === "goals500" && <Goals500Section currentUser={currentUser} />}
          </div>
        </div>
      </div>
    </div>
  )
}
