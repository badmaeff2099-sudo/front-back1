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
 *
 * Это единственное место, где определены правила цикла. Дашборд, профиль
 * пользователя и рейтинг обязаны считать цикл только через этот модуль —
 * раньше у каждого из них была своя копия, и они разошлись.
 */

import { addDays, diffDays, normalizeDate, todayISO } from "./date"

export const CYCLE_LENGTH = 30

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
  /** Это цикл, в котором находится `today` */
  isCurrent: boolean
  /** Цикл целиком в прошлом — все 30 дней уже прожиты */
  isComplete: boolean
}

/** День 1 первого цикла: дата регистрации, либо сегодня, если её нет. */
function startDateOf(registeredAt: string | undefined, today: string): string {
  return registeredAt ? normalizeDate(registeredAt) : today
}

/**
 * Номер текущего цикла (1-based). Он же — общее число начатых циклов,
 * то есть верхняя граница для переключателя циклов.
 */
export function currentCycleNumber(
  registeredAt?: string,
  today: string = todayISO(),
): number {
  const daysSinceStart = diffDays(startDateOf(registeredAt, today), today)
  // Дата регистрации в будущем (рассинхрон часов / кривые данные) — держим 1-й цикл.
  return daysSinceStart < 0 ? 1 : Math.floor(daysSinceStart / CYCLE_LENGTH) + 1
}

/**
 * Цикл участника — по умолчанию текущий.
 *
 * @param registeredAt   — дата регистрации ("YYYY-MM-DD" или ISO-таймстамп)
 * @param completedDates — массив дат со статусом "done"
 * @param restDates      — массив дат со статусом "rest"
 * @param today          — «сегодня» в формате "YYYY-MM-DD". Передаётся, чтобы
 *                         компонент мог пересчитать цикл при смене суток
 *                         (см. useToday); по умолчанию — системная дата.
 * @param cycleNumber    — какой цикл посчитать (1-based). Нужен для просмотра
 *                         завершённых циклов. Значение зажимается в 1..текущий,
 *                         поэтому «цикл из будущего» получить нельзя.
 */
export function calcCycle(
  registeredAt?: string,
  completedDates: string[] = [],
  restDates: string[] = [],
  today: string = todayISO(),
  cycleNumber?: number,
): CycleInfo {
  const start = startDateOf(registeredAt, today)
  const current = currentCycleNumber(registeredAt, today)

  const number =
    cycleNumber === undefined
      ? current
      : Math.min(Math.max(1, Math.round(cycleNumber)), current)

  const cycleStart = addDays(start, (number - 1) * CYCLE_LENGTH)
  const cycleEnd = addDays(cycleStart, CYCLE_LENGTH - 1)

  const isCurrent = number === current
  const isComplete = today > cycleEnd

  // В завершённом цикле прожиты все 30 дней; в текущем — сколько прошло.
  const dayInCycle = isComplete
    ? CYCLE_LENGTH
    : Math.min(CYCLE_LENGTH, Math.max(1, diffDays(cycleStart, today) + 1))

  const inCycle = (d: string) => d >= cycleStart && d <= cycleEnd
  const doneSet = new Set(completedDates.map(normalizeDate).filter(inCycle))
  const restSet = new Set(restDates.map(normalizeDate).filter(inCycle))

  // Пропуск — прожитый день цикла без отметки. В текущем цикле сегодня ещё
  // можно отметить, поэтому последний день не судим; в завершённом — судим все.
  const daysToJudge = isComplete ? CYCLE_LENGTH : dayInCycle - 1
  let missedInCycle = 0
  for (let i = 0; i < daysToJudge; i++) {
    const d = addDays(cycleStart, i)
    if (!doneSet.has(d) && !restSet.has(d)) missedInCycle++
  }

  return {
    cycleNumber: number,
    dayInCycle,
    daysLeft: isComplete ? 0 : CYCLE_LENGTH - dayInCycle,
    markedInCycle: doneSet.size + restSet.size,
    doneInCycle: doneSet.size,
    restInCycle: restSet.size,
    missedInCycle,
    cycleStart,
    cycleEnd,
    today,
    isCurrent,
    isComplete,
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
 * 30 ячеек цикла — от первого дня к последнему (slots[0] = первый день цикла).
 * Дашборд рисует их снизу вверх, поэтому там применяется .reverse() уже
 * на этапе вёрстки.
 *
 * Принимает готовый CycleInfo, а не дату регистрации: так один и тот же
 * билдер рисует и текущий цикл, и любой завершённый — достаточно передать
 * ему нужный результат calcCycle(). И цикл не считается дважды.
 *
 * Состояния:
 * - done   — день отмечен как выполненный
 * - rest   — день отмечен как выходной
 * - today  — сегодня, отметки пока нет
 * - future — день ещё не наступил
 * - missed — прошедший день без отметки
 *
 * Отметка проверяется ПЕРЕД проверкой на будущее: если сервер в другой
 * таймзоне записал день «вперёд», отметка всё равно будет видна, а не
 * молча спрячется под серой ячейкой.
 */
export function buildCycleSlots(
  cycle: CycleInfo,
  completedDates: string[] = [],
  restDates: string[] = [],
): CycleSlot[] {
  const { cycleStart, today } = cycle
  const doneSet = new Set(completedDates.map(normalizeDate))
  const restSet = new Set(restDates.map(normalizeDate))

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
