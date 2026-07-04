import { useState } from "react"
import { createPortal } from "react-dom"
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
  const [showModal, setShowModal] = useState(false)
  const today = new Date().toISOString().slice(0, 10)

  const handleClick = () => {
    if (todayMarked) return
    setShowModal(true)
  }

  const handleConfirm = async () => {
    setShowModal(false)
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
    <>
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

      {showModal && createPortal(
        <div
          style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{ position: "relative", margin: "0 16px", maxWidth: "360px", width: "100%", backgroundColor: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "28px", boxShadow: "0 25px 50px rgba(0,0,0,0.5)", textAlign: "center" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>🌟</div>

            <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "14px", lineHeight: "1.6", fontWeight: 500, margin: 0 }}>
              Помни! Здесь ты не соревнуешься с другими, ты соревнуешься с самим собой, работая не над количеством, а над качеством каждого дня!
            </p>

            <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ flex: 1, padding: "8px", borderRadius: "8px", fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.4)", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}
              >
                Отмена
              </button>
              <button
                onClick={handleConfirm}
                style={{ flex: 1, padding: "8px", borderRadius: "8px", fontSize: "14px", fontWeight: 600, color: "#fff", background: "var(--color-brand, #6366f1)", border: "none", cursor: "pointer" }}
              >
                Отметить
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
