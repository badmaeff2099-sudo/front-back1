/**
 * Discipline Score — единая логика расчёта для всего проекта.
 *
 * Формула:
 *   score идёт по дням: +3 за выполненный, −1 за пропущенный, 0 за отмеченный выходной.
 *
 * Правила:
 * - Выполненный день — день со статусом "done": +3 балла.
 * - Пропущенный день — день без отметки в диапазоне [дата старта; вчера]: −1 балл.
 * - Выходной — только день, который пользователь сам отметил как "rest".
 *   Такие дни нейтральны: не выполненные и не пропущенные, 0 баллов.
 *   День недели (суббота/воскресенье) роли не играет.
 * - Сегодня не считается пропущенным — день ещё не закончился.
 * - Балл не опускается ниже 0: если пользователь не отмечает дни, счёт
 *   упирается в 0 и дальше не падает. Клампим накопительный итог на каждом
 *   дне, поэтому фактическая дельта дня может быть меньше −1 по модулю.
 */

function toISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00")
  d.setDate(d.getDate() + n)
  return toISO(d)
}

function todayISO(): string {
  return toISO(new Date())
}

/** Нормализует значение даты к виду YYYY-MM-DD. */
function normalize(d: string): string {
  return d.slice(0, 10)
}

export const POINTS_DONE = 3
export const POINTS_MISSED = -1
/** Нижняя граница накопительного балла. */
export const SCORE_MIN = 0

export interface DisciplineResult {
  completedDays: number
  missedDays: number
  restDays: number
  /** Сумма начисленных баллов за выполненные дни */
  earnedPoints: number
  /** Сумма фактически снятых баллов (≤ 0), с учётом того, что ниже 0 не падаем */
  penaltyPoints: number
  score: number
}

export interface DisciplinePoint {
  date: string
  /** "done" | "rest" | "missed" */
  status: "done" | "rest" | "missed"
  /** Баллы, фактически зачтённые в этот день с учётом нижней границы 0 */
  delta: number
  /** Накопительный балл на конец этого дня (никогда не ниже 0) */
  score: number
}

/**
 * Разворачивает историю по дням — от даты старта до вчера включительно.
 * Используется и для итогового счёта, и для построения графика.
 */
export function buildDisciplineHistory(
  completedDates: string[] = [],
  restDates: string[] = [],
  startDate?: string,
): DisciplinePoint[] {
  const doneSet = new Set(completedDates.filter(Boolean).map(normalize))
  const restSet = new Set(restDates.filter(Boolean).map(normalize))

  // Начало отсчёта: дата регистрации, либо первая отметка
  const all = [...doneSet, ...restSet].sort()
  const firstMark = all[0]
  let start = startDate ? normalize(startDate) : firstMark
  if (!start) return []
  // Если отметки есть раньше даты регистрации (импорт, правка даты),
  // начинаем с самой ранней — иначе часть выполненных дней потерялась бы.
  if (firstMark && firstMark < start) start = firstMark

  // Сегодня ещё не закончилось — штрафовать за него рано.
  // Но если день уже отмечен, показываем его на графике.
  const today = todayISO()
  const end = doneSet.has(today) || restSet.has(today) ? today : addDays(today, -1)
  if (start > end) return []

  const points: DisciplinePoint[] = []
  let score = 0
  let cursor = start

  while (cursor <= end) {
    let status: DisciplinePoint["status"]
    let rawDelta: number

    if (doneSet.has(cursor)) {
      status = "done"
      rawDelta = POINTS_DONE
    } else if (restSet.has(cursor)) {
      status = "rest"
      rawDelta = 0
    } else {
      status = "missed"
      rawDelta = POINTS_MISSED
    }

    // Балл не уходит в минус: на 0 штраф за пропуск просто не применяется.
    const next = Math.max(SCORE_MIN, score + rawDelta)
    const delta = next - score
    score = next
    points.push({ date: cursor, status, delta, score })
    cursor = addDays(cursor, 1)
  }

  return points
}

export function calcDiscipline(
  completedDates: string[] = [],
  restDates: string[] = [],
  startDate?: string,
): DisciplineResult {
  const history = buildDisciplineHistory(completedDates, restDates, startDate)

  let completedDays = 0
  let missedDays = 0
  let restDays = 0
  let earnedPoints = 0
  let penaltyPoints = 0

  for (const p of history) {
    if (p.status === "done") {
      completedDays++
      earnedPoints += p.delta
    } else if (p.status === "missed") {
      missedDays++
      penaltyPoints += p.delta
    } else restDays++
  }

  return {
    completedDays,
    missedDays,
    restDays,
    earnedPoints,
    penaltyPoints,
    // Итог — накопительный балл последнего дня, он уже с нижней границей 0.
    score: history.length ? history[history.length - 1].score : 0,
  }
}

/** Только итоговый балл — удобно для сортировок. */
export function calcDisciplineScore(
  completedDates: string[] = [],
  restDates: string[] = [],
  startDate?: string,
): number {
  return calcDiscipline(completedDates, restDates, startDate).score
}
