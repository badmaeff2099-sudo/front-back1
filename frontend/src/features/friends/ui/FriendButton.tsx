import { useEffect, useState } from "react"
import { UserPlus, UserCheck, UserX, Clock, Users } from "lucide-react"
import { toast } from "sonner"
import { sendFriendRequest, getFriendStatus, respondFriendRequest } from "@/shared/api/client"
import type { User as UserType } from "@/entities/user/model/types"

interface FriendButtonProps {
  currentUser: UserType
  targetUser: UserType
}

type Status = "none" | "pending" | "accepted" | "received"

export function FriendButton({ currentUser, targetUser }: FriendButtonProps) {
  const [status, setStatus] = useState<Status>("none")
  const [friendshipId, setFriendshipId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFriendStatus(currentUser.id, targetUser.id).then((res) => {
      if (res.success) {
        if (res.status === "none") { setStatus("none") }
        else if (res.status === "accepted") { setStatus("accepted") }
        else if (res.status === "pending") {
          setStatus(res.direction === "sent" ? "pending" : "received")
          setFriendshipId(res.friendship_id)
        }
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [currentUser.id, targetUser.id])

  const handleSendRequest = async () => {
    const res = await sendFriendRequest(currentUser.id, targetUser.id)
    if (res.success) {
      setStatus("pending")
      toast.success("Запрос в друзья отправлен!")
    } else if (res.error === "already_exists") {
      toast.info("Запрос уже отправлен")
    } else {
      toast.error("Ошибка")
    }
  }

  const handleRespond = async (action: "accept" | "decline") => {
    if (!friendshipId) return
    const res = await respondFriendRequest(friendshipId, action)
    if (res.success) {
      setStatus(action === "accept" ? "accepted" : "none")
      toast.success(action === "accept" ? "Заявка принята!" : "Заявка отклонена")
    }
  }

  if (loading) return (
    <div className="h-8 w-36 rounded-lg bg-[#1a1a1a] animate-pulse" />
  )

  if (status === "accepted") {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-500 text-sm font-medium border border-green-500/20">
        <UserCheck className="h-4 w-4" /> В друзьях
      </div>
    )
  }

  if (status === "pending") {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1a1a] text-muted-foreground text-sm border border-[#252525]">
        <Clock className="h-4 w-4" /> Запрос отправлен
      </div>
    )
  }

  if (status === "received") {
    return (
      <div className="flex items-center gap-2">
        <button onClick={() => handleRespond("accept")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand/90 hover:bg-brand text-white text-sm font-medium transition-colors">
          <UserCheck className="h-4 w-4" /> Принять
        </button>
        <button onClick={() => handleRespond("decline")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#222] text-muted-foreground text-sm border border-[#252525] transition-colors">
          <UserX className="h-4 w-4" /> Отклонить
        </button>
      </div>
    )
  }

  return (
    <button onClick={handleSendRequest}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#222] text-foreground text-sm font-medium border border-[#252525] transition-colors active:scale-95">
      <UserPlus className="h-4 w-4" /> Добавить в друзья
    </button>
  )
}
