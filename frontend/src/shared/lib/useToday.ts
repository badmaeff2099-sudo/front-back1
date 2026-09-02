/**
 * «Сегодня» как реактивное значение.
 *
 * Цикл и история активности считаются от текущей даты, поэтому открытая
 * страница обязана сама перейти на новые сутки — иначе после полуночи
 * (и, что важнее, в день окончания цикла) она продолжит показывать
 * вчерашнее окно, пока пользователь не перезагрузит вкладку.
 *
 * Обновляемся двумя путями:
 * - таймер на ближайшую локальную полночь (+1 c, чтобы точно перешагнуть сутки);
 * - visibilitychange / focus — таймеры в фоновых вкладках браузер throttl-ит,
 *   а после сна ноутбука они могут не сработать вовсе.
 */

import { useEffect, useState } from "react"
import { todayISO } from "./date"

/** Возвращает текущую дату "YYYY-MM-DD", меняется при наступлении новых суток. */
export function useToday(): string {
  const [today, setToday] = useState(todayISO)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    const sync = () => {
      // setToday с тем же значением React отбросит — лишних рендеров нет.
      setToday(todayISO())
    }

    const scheduleMidnight = () => {
      const now = new Date()
      const midnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        1,
      )
      timer = setTimeout(() => {
        sync()
        scheduleMidnight()
      }, midnight.getTime() - now.getTime())
    }

    scheduleMidnight()
    document.addEventListener("visibilitychange", sync)
    window.addEventListener("focus", sync)

    return () => {
      clearTimeout(timer)
      document.removeEventListener("visibilitychange", sync)
      window.removeEventListener("focus", sync)
    }
  }, [])

  return today
}
