import { useState } from "react"
import { ArrowLeft, Target, BarChart2, CalendarDays, ListChecks, Plus, Trash2 } from "lucide-react"
import type { User as UserType } from "@/entities/user/model/types"

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

function loadPlanner(userId: number): PlannerData {
  try {
    const raw = localStorage.getItem(`planner-${userId}`)
    if (raw) {
      const saved: PlannerData = JSON.parse(raw)
      if (saved.lastDate < todayStr()) {
        // New day — carry tomorrow → today, reset tomorrow
        const rotated: PlannerData = {
          lastDate: todayStr(),
          today: saved.tomorrow.length ? saved.tomorrow : makeLines(),
          tomorrow: makeLines(),
        }
        localStorage.setItem(`planner-${userId}`, JSON.stringify(rotated))
        return rotated
      }
      return saved
    }
  } catch {}
  const fresh: PlannerData = { lastDate: todayStr(), today: makeLines(), tomorrow: makeLines() }
  localStorage.setItem(`planner-${userId}`, JSON.stringify(fresh))
  return fresh
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
  const [data, setData] = useState<PlannerData>(() => loadPlanner(currentUser.id))

  const saveData = (updated: PlannerData) => {
    setData(updated)
    localStorage.setItem(`planner-${currentUser.id}`, JSON.stringify(updated))
  }

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
            {active === "stats"    && <ComingSoon label="Моя статистика" />}
            {active === "planner"  && <PlannerSection currentUser={currentUser} />}
            {active === "goals500" && <ComingSoon label="Мои 500 целей" />}
          </div>
        </div>
      </div>
    </div>
  )
}
