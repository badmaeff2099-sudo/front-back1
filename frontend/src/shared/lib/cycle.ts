/**
 * Единая логика расчёта текущего цикла для всего проекта.
 *
 * Цикл — это календарное окно в 30 дней, отсчитываемое от даты регистрации:
 * - День 1 = дата регистрации, день 2 = +1 календарный день и т.д.
 * - Цикл 1 = дни 1..30, цикл 2 = дни 31..60 и т.д.
 * - Текущий цикл определяется тем, в какой диапазон попадает сегодня.
 *
 * Важно: цикл считается по календарю, а НЕ по количеству выполненных дней.
 * Пропущенные дни всё равно двигают участника вперёд по циклу.
 * Та же логика, что в buildSlots() на дашборде.
 */

export const CYCLE_LENGTH = 30

function toISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function todayISO(): string {
  return toISO(new Date())
}

/** Прибавить N дней к строке "YYYY-MM-DD" в локальном времени (без UTC-сдвига) */
function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  return toISO(new Date(y, m - 1, d + n))
}

/** Разность дат в днях (b - a), строки "YYYY-MM-DD" */
function diffDays(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number)
  const [by, bm, bd] = b.split("-").map(Number)
  const da = new Date(ay, am - 1, ad)
  const db = new Date(by, bm - 1, bd)
  return Math.round((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24))
}

export interface CycleInfo {
  /** Номер текущего цикла, 1-based (1 = первые 30 дней после регистрации) */
  cycleNumber: number
  /** Какой сейчас день внутри цикла, 1..30 */
  dayInCycle: number
  /** Сколько дней осталось до конца текущего цикла */
  daysLeft: number
  /** Отмечено (done + rest) внутри текущего цикла */
  markedInCycle: number
  /** Выполнено (done) внутри текущего цикла */
  doneInCycle: number
  /** Выходных (rest) внутри текущего цикла */
  restInCycle: number
  /** Пропущено внутри цикла: прошедшие дни без отметки (сегодня не считается) */
  missedInCycle: number
  /** Первый день текущего цикла, "YYYY-MM-DD" */
  cycleStart: string
  /** Последний день текущего цикла, "YYYY-MM-DD" */
  cycleEnd: string
  /** Сегодня в виде "YYYY-MM-DD" — та точка отсчёта, по которой посчитан цикл */
  today: string
}

/**
 * Текущий цикл участника.
 *
 * @param registeredAt   — дата регистрации ("YYYY-MM-DD" или ISO-таймстамп)
 * @param completedDates — массив дат со статусом "done"
 * @param restDates      — массив дат со статусом "rest"
 * @param today          — «сегодня» в формате "YYYY-MM-DD". Передаётся, чтобы
 *                         компонент мог пересчитать цикл при смене суток
 *                         (см. useToday); по умолчанию — системная дата.
 */
export function calcCycle(
  registeredAt?: string,
  completedDates: string[] = [],
  restDates: string[] = [],
  today: string = todayISO(),
): CycleInfo {
  // Нет даты регистрации — считаем, что участник стартовал сегодня.
  const start = registeredAt ? registeredAt.slice(0, 10) : today

  const daysSinceStart = diffDays(start, today)

  // Дата регистрации в будущем (рассинхрон часов / кривые данные) — держим 1-й цикл.
  const cycleIndex = daysSinceStart < 0 ? 0 : Math.floor(daysSinceStart / CYCLE_LENGTH)
  const cycleStart = addDays(start, cycleIndex * CYCLE_LENGTH)
  const cycleEnd = addDays(cycleStart, CYCLE_LENGTH - 1)

  const dayInCycle = Math.min(
    CYCLE_LENGTH,
    Math.max(1, diffDays(cycleStart, today) + 1),
  )

  const inCycle = (d: string) => d >= cycleStart && d <= cycleEnd
  const doneSet = new Set(completedDates.map((d) => d.slice(0, 10)).filter(inCycle))
  const restSet = new Set(restDates.map((d) => d.slice(0, 10)).filter(inCycle))

  // Пропуск — прошедший день цикла без отметки. Сегодня ещё можно отметить,
  // поэтому текущий день пропуском не считаем.
  let missedInCycle = 0
  for (let i = 0; i < dayInCycle - 1; i++) {
    const d = addDays(cycleStart, i)
    if (!doneSet.has(d) && !restSet.has(d)) missedInCycle++
  }

  return {
    cycleNumber: cycleIndex + 1,
    dayInCycle,
    daysLeft: CYCLE_LENGTH - dayInCycle,
    markedInCycle: doneSet.size + restSet.size,
    doneInCycle: doneSet.size,
    restInCycle: restSet.size,
    missedInCycle,
    cycleStart,
    cycleEnd,
    today,
  }
}

/** Состояние одной ячейки истории активности */
export type CycleSlotState = "done" | "rest" | "missed" | "today" | "future"

export interface CycleSlot {
  /** Номер дня внутри цикла, 1..30 */
  dayNumber: number
  /** Дата ячейки, "YYYY-MM-DD" */
  date: string
  state: CycleSlotState
}

/**
 * 30 ячеек текущего цикла — от первого дня цикла к последнему.
 *
 * Та же семантика состояний, что у столбцов на дашборде (buildSlots):
 * - done   — день отмечен как выполненный
 * - rest   — день отмечен как выходной
 * - today  — сегодня, отметки пока нет
 * - future — день ещё не наступил
 * - missed — прошедший день без отметки
 */
export function buildCycleSlots(
  registeredAt?: string,
  completedDates: string[] = [],
  restDates: string[] = [],
  today: string = todayISO(),
): CycleSlot[] {
  const { cycleStart } = calcCycle(registeredAt, completedDates, restDates, today)
  const doneSet = new Set(completedDates.map((d) => d.slice(0, 10)))
  const restSet = new Set(restDates.map((d) => d.slice(0, 10)))

  const slots: CycleSlot[] = []
  for (let i = 0; i < CYCLE_LENGTH; i++) {
    const date = addDays(cycleStart, i)

    let state: CycleSlotState
    if (doneSet.has(date)) state = "done"
    else if (restSet.has(date)) state = "rest"
    else if (date === today) state = "today"
    else if (date > today) state = "future"
    else state = "missed"

    slots.push({ dayNumber: i + 1, date, state })
  }

  return slots
}
