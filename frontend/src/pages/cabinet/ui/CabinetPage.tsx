import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react"
import { ArrowLeft, Target, BarChart2, CalendarDays, ListChecks, CalendarRange, Plus, Trash2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import type { User as UserType } from "@/entities/user/model/types"
import { getGoals500, saveGoals500, getPlanner, savePlanner, getProgressYear, getYearGoals, saveYearGoal } from "@/shared/api/client"

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

type Section = "goal" | "stats" | "planner" | "goals500" | "yeargoals"

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
  { id: "yeargoals",label: "Мои цели на год", icon: <CalendarRange className="h-4 w-4" /> },
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

  /* Удалить строку */
  const removeGoal = (uid: number) => {
    // Последнюю строку не удаляем: пустая таблица без единой строки не
    // оставила бы точки входа, кроме кнопки "Добавить цель".
    if (goals.length <= 1) return
    // Меню закрываем: оно держит индекс строки, а после удаления индексы
    // сдвигаются, и "переместить вверх" применилось бы к чужой строке.
    setMenu(null)
    persist(goals.filter((g) => g.uid !== uid))
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
            Правая кнопка мыши по строке — переместить или удалить.
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
                {/* Колонка удаления без заголовка: подпись к иконке-корзине
                    не нужна, а пустой th держит ширину и выравнивание. */}
                <th className="w-10" />
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

                  {/* Удалить строку */}
                  <td className="px-2 py-2 text-center w-10">
                    <button
                      onClick={() => removeGoal(goal.uid)}
                      onContextMenu={(e) => e.stopPropagation()}
                      disabled={goals.length <= 1}
                      title="Удалить цель"
                      aria-label={`Удалить цель ${idx + 1}`}
                      // Появляется по наведению на строку — как в таблице
                      // плана выше. disabled:pointer-events-none, иначе на
                      // единственной строке кнопка ловила бы курсор впустую.
                      className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity
                        w-6 h-6 mx-auto flex items-center justify-center rounded
                        text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10
                        disabled:opacity-0 disabled:pointer-events-none"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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
          {/* То же действие, что и корзина в строке: меню уже открыто по ПКМ,
              и искать иконку глазами не нужно. */}
          <button
            disabled={goals.length <= 1 || !goals[menu.index]}
            // Проверка на существование: индекс в меню — снимок на момент
            // ПКМ, а список к этому времени мог стать короче (переключение
            // пользователя, перезагрузка), и goals[i] был бы undefined.
            onClick={() => {
              const target = goals[menu.index]
              if (target) removeGoal(target.uid)
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400/90
              hover:bg-red-500/10 hover:text-red-400 transition-colors
              disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <Trash2 className="h-4 w-4" />
            Удалить строку
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── Year goals section: 12 карточек месяцев ───────────────── */
const MONTH_NAMES = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
]

/** Сколько линеек подцелей всегда видно в карточке */
const BASE_SUBGOALS = 5
/** Предел на карточку — чтобы сетка из 12 карточек не расползалась */
const MAX_SUBGOALS = 20

// Границы совпадают с валидацией в backend/api/yeargoals/*.php: иначе
// переключатель мог бы запросить год, который API отклоняет.
const YEAR_GOALS_MIN = 2000
const YEAR_GOALS_MAX = 2100

/** Карточка одного месяца */
interface MonthGoal {
  goal: string
  /** Текст подцелей по порядку; позиция в массиве = position в БД */
  subgoals: string[]
}

/** Дотягивает список подцелей до BASE_SUBGOALS пустыми линейками */
function padSubgoals(subgoals: string[]): string[] {
  const out = [...subgoals]
  while (out.length < BASE_SUBGOALS) out.push("")
  return out
}

function emptyYear(): MonthGoal[] {
  return Array.from({ length: 12 }, () => ({ goal: "", subgoals: padSubgoals([]) }))
}

/**
 * Ответ сервера → ровно 12 карточек.
 * Бэкенд отдаёт все 12 месяцев, но полагаться на это не стоит: битый или
 * частичный ответ не должен схлопывать сетку до пары карточек.
 */
function normalizeYear(months: unknown): MonthGoal[] {
  const cards = emptyYear()
  if (!Array.isArray(months)) return cards

  for (const raw of months) {
    const m = Number((raw as { month?: unknown })?.month)
    if (!Number.isInteger(m) || m < 1 || m > 12) continue

    const subgoals = (raw as { subgoals?: unknown }).subgoals
    cards[m - 1] = {
      goal: String((raw as { goal?: unknown }).goal ?? ""),
      subgoals: padSubgoals(
        Array.isArray(subgoals)
          ? subgoals.slice(0, MAX_SUBGOALS).map((s) => String(s ?? ""))
          : [],
      ),
    }
  }

  return cards
}

interface AutoGrowTextareaProps {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  className?: string
  "aria-label"?: string
}

/**
 * Поле в одну строку, которое переносит текст вниз, когда он не влезает.
 *
 * Это textarea, а не input: input не умеет переносить строки в принципе,
 * длинная запись в нём уезжает за границу и её не видно целиком.
 * Высота подгоняется под содержимое, поэтому полосы прокрутки нет.
 */
function AutoGrowTextarea({
  value,
  onChange,
  readOnly = false,
  className = "",
  "aria-label": ariaLabel,
}: AutoGrowTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  // Пересчёт по value, а не в onChange: высота нужна верной и при внешней
  // смене текста — загрузке года, переключении пользователя, удалении строки.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    // Сброс перед замером: иначе scrollHeight никогда не уменьшится
    // и поле не сожмётся обратно после удаления текста.
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      readOnly={readOnly}
      onChange={(e) => onChange(e.target.value)}
      // placeholder намеренно нет: пустая карточка месяца должна выглядеть
      // чистым бланком, а не сеткой из повторяющихся подсказок. Доступное
      // имя поля даёт aria-label — на него подсказка не влияла.
      aria-label={ariaLabel}
      // resize-none + overflow-hidden: высотой управляет эффект выше,
      // ручной ресайз и прокрутка внутри поля были бы лишними.
      className={`block w-full resize-none overflow-hidden break-words bg-transparent focus:outline-none transition-colors ${className}`}
    />
  )
}

interface MonthGoalCardProps {
  name: string
  card: MonthGoal
  readOnly?: boolean
  onChange: (card: MonthGoal) => void
}

function MonthGoalCard({ name, card, readOnly = false, onChange }: MonthGoalCardProps) {
  const setSubgoal = (index: number, text: string) => {
    onChange({
      ...card,
      subgoals: card.subgoals.map((s, i) => (i === index ? text : s)),
    })
  }

  const addSubgoal = () => {
    if (card.subgoals.length >= MAX_SUBGOALS) return
    onChange({ ...card, subgoals: [...card.subgoals, ""] })
  }

  // Удалять можно только добавленные сверх базовых линеек — иначе карточка
  // потеряла бы обещанные 5 строк.
  const removeSubgoal = (index: number) => {
    if (card.subgoals.length <= BASE_SUBGOALS) return
    onChange({ ...card, subgoals: card.subgoals.filter((_, i) => i !== index) })
  }

  const filled = card.subgoals.filter((s) => s.trim() !== "").length

  return (
    <div className="flex flex-col bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden">
      {/* Название месяца */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-[#151515] border-b border-[#1e1e1e]">
        <p className="text-[11px] font-bold uppercase tracking-widest text-brand select-none">
          {name}
        </p>
        {filled > 0 && (
          <span className="text-[10px] text-muted-foreground/40 tabular-nums select-none">
            {filled}
          </span>
        )}
      </div>

      {/* Главная цель месяца */}
      <div className="px-4 pt-3 pb-3 border-b border-[#1a1a1a]">
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground/50 mb-1 select-none">
          Главная цель
        </p>
        <AutoGrowTextarea
          value={card.goal}
          onChange={(text) => onChange({ ...card, goal: text })}
          readOnly={readOnly}
          aria-label={`Главная цель на ${name}`}
          className={`text-sm font-semibold leading-snug px-2 py-1 -mx-2 rounded
            ${readOnly
              ? "text-foreground/70 cursor-default"
              : "text-foreground hover:bg-[#181818] focus:bg-[#1a1a1a]"
            }`}
        />
      </div>

      {/* Подцели */}
      <div className="flex flex-col flex-1 px-4 pt-2.5 pb-1">
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground/50 mb-0.5 select-none">
          Подцели
        </p>
        {/* Ключ по индексу: подцели — упорядоченный список строк, при удалении
            значения сдвигаются, и это именно то поведение, которое нужно. */}
        {card.subgoals.map((text, i) => (
          <div
            key={i}
            // items-start, а не center: запись может занять несколько строк,
            // номер и корзина должны остаться у её первой строки.
            className="group flex items-start gap-2 py-1 border-b border-[#191919] last:border-0"
          >
            <span className="w-3 shrink-0 pt-[3px] text-right text-[10px] text-muted-foreground/30 tabular-nums select-none">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <AutoGrowTextarea
                value={text}
                onChange={(next) => setSubgoal(i, next)}
                readOnly={readOnly}
                aria-label={`Подцель ${i + 1} на ${name}`}
                className={`text-[13px] leading-snug px-1.5 py-0.5 rounded
                  ${readOnly
                    ? "text-foreground/60 cursor-default"
                    : "text-foreground/90 hover:bg-[#181818] focus:bg-[#1a1a1a]"
                  }`}
              />
            </div>
            {!readOnly && i >= BASE_SUBGOALS && (
              <button
                onClick={() => removeSubgoal(i)}
                aria-label={`Удалить подцель ${i + 1}`}
                className="shrink-0 w-5 h-5 flex items-center justify-center rounded
                  opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity
                  text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Добавить подцель */}
      {!readOnly && (
        <div className="border-t border-[#1a1a1a] mt-1">
          {card.subgoals.length < MAX_SUBGOALS ? (
            <button
              onClick={addSubgoal}
              aria-label={`Добавить подцель в ${name}`}
              className="w-full flex items-center justify-center gap-1.5 py-2
                text-[11px] text-muted-foreground hover:text-foreground
                hover:bg-[#161616] transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Добавить подцель
            </button>
          ) : (
            <p className="text-center py-2 text-[10px] text-muted-foreground/40 select-none">
              Максимум {MAX_SUBGOALS} подцелей
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/** Что сервер сообщил про выбранный год */
interface YearMeta {
  /** Можно ли вносить данные — текущий год и дальше */
  editable: boolean
  /** Нижняя граница переключателя: самый ранний год с данными */
  minYear: number
}

function YearGoalsSection({ currentUser }: { currentUser: UserType }) {
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [cards, setCards] = useState<MonthGoal[]>(emptyYear)
  const [meta, setMeta] = useState<YearMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /* Отложенные сохранения. Ключ — "год-месяц": если пользователь переключил
     год, не дождавшись сохранения, правка всё равно уйдёт в свой год. */
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const pending = useRef(new Map<string, () => void>())

  /** Досылает все отложенные сохранения немедленно */
  const flushPending = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t))
    timers.current.clear()
    const runs = [...pending.current.values()]
    pending.current.clear()
    runs.forEach((run) => run())
  }, [])

  /* Уход из раздела не должен съедать последние набранные символы,
     поэтому на размонтировании сохраняем, а не просто гасим таймеры. */
  useEffect(() => flushPending, [flushPending])

  /* Загрузка года */
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getYearGoals(currentUser.id, year)
      .then((res) => {
        if (cancelled) return
        if (res?.success) {
          setCards(normalizeYear(res.months))
          // Права и границы берём с сервера: у него и время верное,
          // и он же отклонит запись — расхождения быть не может.
          setMeta({
            editable: res.editable === true,
            minYear: Number.isInteger(res.min_year) ? res.min_year : year,
          })
        } else {
          setError(res?.message ?? "Не удалось загрузить цели на год")
          setCards(emptyYear())
          setMeta(null)
        }
      })
      .catch(() => {
        if (cancelled) return
        setError("Не удалось загрузить цели на год")
        setCards(emptyYear())
        setMeta(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [currentUser.id, year])

  // Пока год не загрузился, ориентируемся на часы браузера — иначе при
  // недоступном API текущий год оказался бы заперт. Записать прошлое всё
  // равно не выйдет: save.php проверяет год независимо.
  const editable = meta ? meta.editable : year >= new Date().getFullYear()
  // YEAR_GOALS_MIN как страховка: переключатель не должен уводить за
  // диапазон, который принимает API, даже если в БД окажется странный год.
  const minYear = Math.max(YEAR_GOALS_MIN, meta ? meta.minYear : year)

  /* Правка карточки: сразу в состояние, в БД — с дебаунсом */
  const updateCard = (index: number, card: MonthGoal) => {
    // Прошлый год только для чтения. Поля и так заблокированы, но
    // проверка здесь не даёт правке уйти в БД ни при каком раскладе.
    if (!editable) return

    setCards((prev) => prev.map((c, i) => (i === index ? card : c)))

    const month = index + 1
    const key = `${year}-${month}`
    const savedYear = year

    const run = () =>
      saveYearGoal(currentUser.id, savedYear, month, card.goal, card.subgoals).catch(() => {})

    const prevTimer = timers.current.get(key)
    if (prevTimer) clearTimeout(prevTimer)
    pending.current.set(key, run)
    timers.current.set(
      key,
      setTimeout(() => {
        timers.current.delete(key)
        pending.current.delete(key)
        run()
      }, 500),
    )
  }

  /* Смена года: сначала досылаем правки, иначе загрузка нового года
     перезаписала бы состояние раньше, чем они успели уйти в БД. */
  const shiftYear = (delta: number) => {
    // Назад — не дальше самого раннего года с данными: пустые прошлые годы
    // листать незачем, вносить в них ничего нельзя.
    const next = Math.min(YEAR_GOALS_MAX, Math.max(minYear, year + delta))
    if (next === year) return
    flushPending()
    setYear(next)
  }

  const filledMonths = cards.filter(
    (c) => c.goal.trim() !== "" || c.subgoals.some((s) => s.trim() !== ""),
  ).length

  return (
    <div className="flex flex-col gap-5">
      {/* Заголовок + переключатель года справа вверху */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Мои цели на год</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {editable
              ? "Главная цель на каждый месяц и подцели к ней. Изменения сохраняются автоматически. "
              : "Прошедший год — только просмотр. "}
            Заполнено месяцев:{" "}
            <span className="text-foreground font-medium tabular-nums">
              {filledMonths}
            </span>{" "}
            / 12
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!editable && (
            <span className="mr-1.5 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider text-muted-foreground/70 bg-[#1a1a1a] border border-[#252525] select-none whitespace-nowrap">
              только просмотр
            </span>
          )}
          <button
            onClick={() => shiftYear(-1)}
            disabled={year <= minYear}
            aria-label="Предыдущий год"
            className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-[#1e1e1e] transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-foreground tabular-nums w-12 text-center select-none">
            {year}
          </span>
          <button
            onClick={() => shiftYear(1)}
            disabled={year >= YEAR_GOALS_MAX}
            aria-label="Следующий год"
            className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-[#1e1e1e] transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-400/80 bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-2.5">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
          Загрузка целей на {year} год...
        </div>
      ) : (
        /* 3 карточки в ряд → 4 ряда по кварталам, как в макете */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card, i) => (
            <MonthGoalCard
              key={i}
              name={MONTH_NAMES[i]}
              card={card}
              readOnly={!editable}
              onChange={(next) => updateCard(i, next)}
            />
          ))}
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

const MIN_YEAR = 2000

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

/* ─── Анализ поведения: аналитика за последние 10 дней ───────── */
const BEHAVIOR_WINDOW = 10

interface BehaviorMetrics {
  discipline: number
  stability: number
  resilience: number
  doneCount: number
  missedCount: number
  restCount: number
  maxStreak: number
  recoveries: number
  totalMisses: number
}

/** Последние BEHAVIOR_WINDOW дней, заканчивая сегодняшним днём. */
function lastWindowDates(): string[] {
  const today = new Date()
  const out: string[] = []
  for (let i = BEHAVIOR_WINDOW - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    out.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    )
  }
  return out
}

/**
 * Считает три показателя по окну из 10 дней.
 *
 * Дисциплина  = выполненные / (выполненные + пропущенные) * 100.
 *               Выходные (rest) в расчёт не идут.
 * Стабильность = максимальный стрик внутри окна / 10 * 100.
 *               Выходной нейтрален: стрик не растёт, но и не рвётся.
 * Устойчивость = случаи «после пропуска следующий день выполнен» /
 *               общее число пропусков * 100. Выходные пропускаются
 *               при поиске следующего дня.
 */
function calcBehavior(statusByDate: Map<string, DayStatus>): BehaviorMetrics {
  const dates = lastWindowDates()
  // Дни без отметки считаем пропущенными: цель на этот день не выполнена.
  const win = dates.map((date) => {
    const status = statusByDate.get(date) ?? "empty"
    return { date, status: status === "empty" ? ("missed" as DayStatus) : status }
  })

  const doneCount = win.filter((d) => d.status === "done").length
  const missedCount = win.filter((d) => d.status === "missed").length
  const restCount = win.filter((d) => d.status === "rest").length

  const discipline =
    doneCount + missedCount > 0
      ? (doneCount / (doneCount + missedCount)) * 100
      : 0

  let maxStreak = 0
  let current = 0
  for (const day of win) {
    if (day.status === "done") {
      current++
      maxStreak = Math.max(maxStreak, current)
    } else if (day.status === "missed") {
      current = 0
    }
    // rest — нейтрален, стрик не меняется
  }
  const stability = (maxStreak / BEHAVIOR_WINDOW) * 100

  let recoveries = 0
  let totalMisses = 0
  for (let i = 0; i < win.length; i++) {
    if (win[i].status !== "missed") continue
    // Ищем следующий рабочий день (выходные пропускаем)
    let j = i + 1
    while (j < win.length && win[j].status === "rest") j++
    if (j >= win.length) continue // нет следующего дня в окне — не учитываем
    totalMisses++
    if (win[j].status === "done") recoveries++
  }
  const resilience = totalMisses > 0 ? (recoveries / totalMisses) * 100 : 100

  return {
    discipline,
    stability,
    resilience,
    doneCount,
    missedCount,
    restCount,
    maxStreak,
    recoveries,
    totalMisses,
  }
}

function metricTone(value: number): string {
  if (value >= 70) return "text-green-400"
  if (value >= 40) return "text-yellow-400"
  return "text-red-400"
}

function metricBar(value: number): string {
  if (value >= 70) return "bg-green-500"
  if (value >= 40) return "bg-yellow-400"
  return "bg-red-500"
}

function MetricCard({
  label,
  hint,
  value,
  detail,
}: {
  label: string
  hint: string
  value: number
  detail: string
}) {
  const rounded = Math.round(value)

  return (
    <div className="bg-[#111] border border-[#1e1e1e] rounded-xl px-4 py-4 flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</span>
        <span className={`text-2xl font-bold tabular-nums ${metricTone(value)}`}>{rounded}%</span>
      </div>

      <div className="h-1.5 rounded-full bg-[#1e1e1e] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${metricBar(value)}`}
          style={{ width: `${Math.min(100, Math.max(0, rounded))}%` }}
        />
      </div>

      <p className="text-[11px] text-muted-foreground leading-snug">{hint}</p>
      <p className="text-[11px] text-muted-foreground/60 tabular-nums">{detail}</p>
    </div>
  )
}

function BehaviorSection({ days }: { days: YearDay[] }) {
  const statusByDate = new Map(days.map((d) => [d.date, d.status]))
  const m = calcBehavior(statusByDate)

  return (
    <div className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#1e1e1e]">
        <h2 className="text-sm font-semibold text-foreground">Анализ поведения</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Аналитика за последние {BEHAVIOR_WINDOW} дней. Выходные не учитываются.
        </p>
      </div>

      <div className="px-5 py-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MetricCard
          label="Дисциплина"
          value={m.discipline}
          hint="Насколько часто вы выполняете цель."
          detail={`${m.doneCount} выполнено / ${m.doneCount + m.missedCount} рабочих дней`}
        />
        <MetricCard
          label="Стабильность"
          value={m.stability}
          hint="Насколько равномерно вы идёте к цели без срывов."
          detail={`Лучшая серия: ${m.maxStreak} из ${BEHAVIOR_WINDOW}`}
        />
        <MetricCard
          label="Устойчивость"
          value={m.resilience}
          hint="Насколько быстро вы возвращаетесь после пропуска."
          detail={
            m.totalMisses > 0
              ? `${m.recoveries} возвратов / ${m.totalMisses} пропусков`
              : "Пропусков не было"
          }
        />
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
  // Окно последних 10 дней не зависит от выбранного года и может
  // пересекать границу года — грузим отдельно.
  const [recentDays, setRecentDays] = useState<YearDay[] | null>(null)

  useEffect(() => {
    let cancelled = false
    const win = lastWindowDates()
    const years = [...new Set(win.map((d) => Number(d.slice(0, 4))))]

    Promise.all(years.map((y) => getProgressYear(currentUser.id, y)))
      .then((results) => {
        if (cancelled) return
        const all = results.flatMap((res) =>
          res?.success && Array.isArray(res.days) ? (res.days as YearDay[]) : [],
        )
        setRecentDays(all)
      })
      .catch(() => {
        if (!cancelled) setRecentDays(null)
      })

    return () => {
      cancelled = true
    }
  }, [currentUser.id])

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
              onClick={() => setYear((y) => Math.max(MIN_YEAR, y - 1))}
              disabled={year <= MIN_YEAR}
              aria-label="Предыдущий год"
              className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-[#1e1e1e] transition-colors disabled:opacity-30 disabled:pointer-events-none"
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

      {/* Анализ поведения за последние 10 дней */}
      {recentDays && <BehaviorSection days={recentDays} />}
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
      {/*
        Раздел "Мои цели на год" шире остальных: при max-w-5xl на карточку
        месяца приходится ~253px, при 1138px — ~292px, то есть +15%.
        Расширение привязано к активному разделу, чтобы вид остальных
        разделов кабинета не поехал.
      */}
      <div className={`mx-auto ${active === "yeargoals" ? "max-w-[1138px]" : "max-w-5xl"}`}>
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
            {active === "yeargoals" && <YearGoalsSection currentUser={currentUser} />}
          </div>
        </div>
      </div>
    </div>
  )
}
