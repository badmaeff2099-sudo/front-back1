/**
 * Единые date-хелперы для всех расчётов по дням (цикл, стрик, Discipline Score).
 *
 * Правила, общие для всего проекта:
 * - День представляется строкой "YYYY-MM-DD" — так же, как приходит из БД
 *   (progress.day_date — тип date), поэтому сравнение дат — это сравнение строк.
 * - Вся арифметика идёт в ЛОКАЛЬНОМ времени пользователя. Через Date.parse
 *   строка "2025-08-02" читается как UTC-полночь, и у пользователей с
 *   отрицательным смещением день уезжает назад — поэтому дату всегда собираем
 *   через new Date(y, m - 1, d).
 *
 * Раньше эти четыре функции лежали копиями в cycle.ts, streak.ts,
 * discipline.ts и DashboardPage.tsx — с расхождениями в способе парсинга.
 */

/** Date → "YYYY-MM-DD" в локальном времени */
export function toISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Сегодняшняя локальная дата, "YYYY-MM-DD" */
export function todayISO(): string {
  return toISO(new Date())
}

/**
 * Приводит значение к виду "YYYY-MM-DD".
 * Терпит и "2025-08-02", и "2025-08-02 10:33:00", и ISO-таймстамп —
 * из БД created_at приходит в разных видах.
 */
export function normalizeDate(value: string): string {
  return value.slice(0, 10)
}

/** Прибавить N дней (N может быть отрицательным) к строке "YYYY-MM-DD" */
export function addDays(dateStr: string, n: number): string {
  const [y, m, d] = normalizeDate(dateStr).split("-").map(Number)
  return toISO(new Date(y, m - 1, d + n))
}

/** Разность в днях (b − a) для строк "YYYY-MM-DD" */
export function diffDays(a: string, b: string): number {
  const [ay, am, ad] = normalizeDate(a).split("-").map(Number)
  const [by, bm, bd] = normalizeDate(b).split("-").map(Number)
  const da = new Date(ay, am - 1, ad)
  const db = new Date(by, bm - 1, bd)
  // Округление, а не деление в лоб: переходы на летнее время дают ±1 час,
  // и без round получилось бы 29.958 дней вместо 30.
  return Math.round((db.getTime() - da.getTime()) / 86400000)
}
