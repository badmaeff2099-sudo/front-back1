import { useEffect, useState } from "react"
import { getTodayChallenge } from "@/shared/api/client"
import type { User as UserType } from "@/entities/user/model/types"

interface ChallengeCardProps {
  currentUser: UserType
}

interface Challenge {
  id: number
  title: string
  description: string
}

/** Сколько миллисекунд осталось до ближайших 12:00 по локальному времени */
function msUntilNoon(): number {
  const now = new Date()
  const noon = new Date(now)
  noon.setHours(12, 0, 0, 0)
  if (noon.getTime() <= now.getTime()) noon.setDate(noon.getDate() + 1)
  return noon.getTime() - now.getTime() + 1000
}

export function ChallengeCard({ currentUser }: ChallengeCardProps) {
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    const load = () => {
      getTodayChallenge(currentUser.id)
        .then((res) => {
          if (cancelled) return
          if (res.success) {
            setChallenge({ id: res.id, title: res.title, description: res.description })
          }
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }

    // После наступления 12:00 запрашиваем новый челлендж и ставим таймер на следующий полдень
    const schedule = () => {
      timer = setTimeout(() => {
        load()
        schedule()
      }, msUntilNoon())
    }

    // Вкладка могла быть неактивной в момент смены челленджа — обновляем при возврате
    const onVisible = () => {
      if (document.visibilityState === "visible") load()
    }

    load()
    schedule()
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      cancelled = true
      clearTimeout(timer)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [currentUser.id])

  return (
    <div className="profile-card challenge-card p-5 mt-4">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
        Челлендж дня
      </p>

      {loading ? (
        <div className="mt-3 flex flex-col gap-2 animate-pulse">
          <div className="h-4 w-2/3 rounded bg-[#1e1e1e]" />
          <div className="h-3 w-full rounded bg-[#161616]" />
          <div className="h-3 w-4/5 rounded bg-[#161616]" />
        </div>
      ) : challenge ? (
        <div className="mt-3">
          <p className="text-sm font-semibold text-foreground leading-snug">
            {challenge.title}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
            {challenge.description}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          Не удалось загрузить челлендж
        </p>
      )}
    </div>
  )
}
