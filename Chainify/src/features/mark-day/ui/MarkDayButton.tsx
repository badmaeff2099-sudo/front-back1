import { toast } from "sonner"
import { CheckCircle2 } from "lucide-react"
import { markDay } from "@/shared/api/client"
import type { User as UserType } from "@/entities/user/model/types"

interface MarkDayButtonProps {
  currentUser: UserType
  todayMarked: boolean
  onMarked: () => void
}

export function MarkDayButton({ currentUser, todayMarked, onMarked }: MarkDayButtonProps) {
  const today = new Date().toISOString().slice(0, 10)

  const handleClick = async () => {
    if (todayMarked) return
    try {
      const res = await markDay(currentUser.id, today)
      if (res.success) {
        onMarked()
        toast.success("День отмечен! 🎉")
      } else if (res.error === "Already marked for this date") {
        toast.warning("Сегодня уже отмечено!")
      } else {
        toast.error(res.error || "Ошибка")
      }
    } catch {
      toast.error("Ошибка соединения")
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={todayMarked}
      className={`w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
        todayMarked
          ? "bg-green-500/10 text-green-500 border border-green-500/20 cursor-default"
          : "bg-brand/90 hover:bg-brand text-white border border-transparent active:scale-95"
      }`}
    >
      <CheckCircle2 className="h-4 w-4" />
      {todayMarked ? "Сегодня отмечено" : "Отметить сегодня"}
    </button>
  )
}
