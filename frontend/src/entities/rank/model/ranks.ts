export interface Rank {
  title: string
  icon: string
  days: number
  color: string
}

export const RANKS: Rank[] = [
  { title: "Пыль", icon: "🪨", days: 0, color: "#8c8c8c" },
  { title: "Росток", icon: "🌱", days: 11, color: "#73d13d" },
  { title: "Бревно", icon: "🪵", days: 23, color: "#ff4d4f" },
  { title: "Рабочий режим", icon: "🛠", days: 35, color: "#1890ff" },
  { title: "Стабильный", icon: "🛡", days: 51, color: "#52c41a" },
  { title: "Воин", icon: "⚔️", days: 69, color: "#fa8c16" },
  { title: "Дисциплина", icon: "💎", days: 87, color: "#13c2c2" },
  { title: "Фундамент", icon: "🧱", days: 100, color: "#722ed1" },
  { title: "Закаленный", icon: "🔥", days: 150, color: "#fadb14" },
  { title: "Монолит", icon: "🗿", days: 181, color: "#fadb14" },
  { title: "Железная воля", icon: "🦍", days: 200, color: "#fadb14" },
  { title: "Мастер", icon: "👑", days: 231, color: "#fadb14" },
  { title: "Наблюдатель", icon: "👁", days: 271, color: "#fadb14" },
  { title: "Гигант", icon: "🗻", days: 300, color: "#fadb14" },
  { title: "Легенда", icon: "🏆", days: 331, color: "#fadb14" },
  { title: "Абсолют", icon: "✨", days: 365, color: "#fadb14" },
]

export function getRank(totalDays: number): Rank {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (totalDays >= RANKS[i].days) return RANKS[i]
  }
  return RANKS[0]
}
