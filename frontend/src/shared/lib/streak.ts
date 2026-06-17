/**
 * Единая логика расчёта стрика для всего проекта.
 *
 * Правила:
 * - done-день   → стрик +1.
 * - rest-день   → нейтрален: стрик не растёт и не падает.
 * - два rest подряд → стрик обнуляется (return 0).
 * - пустой день (не done и не rest) → серия прерывается.
 * - Серия жива только если сегодня или вчера есть хоть какая-то отметка.
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

/**
 * Текущий стрик.
 *
 * @param completedDates — массив дат со статусом "done"
 * @param restDates      — массив дат со статусом "rest"
 */
export function calcStreak(completedDates: string[] = [], restDates: string[] = []): number {
  const today     = todayISO()
  const yesterday = addDays(today, -1)
  const restSet   = new Set(restDates)
  const doneSet   = new Set(completedDates)

  // Серия жива только если сегодня или вчера есть отметка
  const todayMarked     = doneSet.has(today)     || restSet.has(today)
  const yesterdayMarked = doneSet.has(yesterday) || restSet.has(yesterday)
  if (!todayMarked && !yesterdayMarked) return 0

  // Если сегодня ещё не отмечено — начинаем со вчера
  let cursor      = (todayMarked ? today : yesterday)
  let streak      = 0
  let prevWasRest = false

  while (true) {
    if (doneSet.has(cursor)) {
      streak++
      prevWasRest = false
    } else if (restSet.has(cursor)) {
      if (prevWasRest) return 0  // два rest подряд — обнуляем
      prevWasRest = true
    } else {
      break  // пустой день — конец серии
    }
    cursor = addDays(cursor, -1)
  }

  return streak
}

/**
 * Рекордный стрик за всё время.
 *
 * Правила те же: rest нейтрален, два rest подряд разрывают серию.
 *
 * @param completedDates — массив дат со статусом "done"
 * @param restDates      — массив дат со статусом "rest"
 */
export function calcLongestStreak(completedDates: string[] = [], restDates: string[] = []): number {
  const allDates = [...new Set([...completedDates, ...restDates])].sort()
  if (!allDates.length) return 0

  const restSet = new Set(restDates)
  const doneSet = new Set(completedDates)

  let longest     = 0
  let current     = 0
  let prevWasRest = false

  for (let i = 0; i < allDates.length; i++) {
    const d      = allDates[i]
    const isDone = doneSet.has(d)
    const isRest = restSet.has(d)

    // Проверяем разрыв между предыдущей и текущей датой
    if (i > 0 && addDays(allDates[i - 1], 1) !== d) {
      // Пропуск — серия прерывается
      longest     = Math.max(longest, current)
      current     = 0
      prevWasRest = false
    }

    if (isDone) {
      current++
      prevWasRest = false
    } else if (isRest) {
      if (prevWasRest) {
        // Два rest подряд — серия рвётся
        longest     = Math.max(longest, current)
        current     = 0
        prevWasRest = false
      } else {
        prevWasRest = true
        // rest не добавляет к current, но и не обрывает
      }
    }
  }

  return Math.max(longest, current)
}
