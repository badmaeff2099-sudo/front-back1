import { useEffect, useState } from "react"
import { Check, X } from "lucide-react"
import { toast } from "sonner"
import { getFriends, respondFriendRequest } from "@/shared/api/client"
import { UserAvatar } from "@/entities/user/ui/UserAvatar"
import type { User as UserType } from "@/entities/user/model/types"

interface FriendsPanelProps {
  currentUser: UserType
  onSelectUser: (user: UserType) => void
}

interface FriendEntry {
  id: number
  username: string
  location?: string
  avatar_url?: string
  completed_dates: string[]
  friendship_id: number
}

interface IncomingEntry {
  friendship_id: number
  id: number
  username: string
  location?: string
}

export function FriendsPanel({ currentUser, onSelectUser }: FriendsPanelProps) {
  const [friends, setFriends] = useState<FriendEntry[]>([])
  const [incoming, setIncoming] = useState<IncomingEntry[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    getFriends(currentUser.id).then((res) => {
      if (res.success) {
        setFriends(res.friends ?? [])
        setIncoming(res.incoming ?? [])
      }
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [currentUser.id])

  const handleRespond = async (friendshipId: number, action: "accept" | "decline") => {
    const res = await respondFriendRequest(friendshipId, action)
    if (res.success) {
      toast.success(action === "accept" ? "Заявка принята!" : "Заявка отклонена")
      load()
    }
  }

  return (
    <div className="profile-card p-5 mt-4">
      {/* Incoming requests */}
      {incoming.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            Заявки в друзья ({incoming.length})
          </p>
          <div className="flex flex-col gap-2">
            {incoming.map((req) => (
              <div key={req.friendship_id} className="flex items-center justify-between gap-2 bg-[#1a1a1a] rounded-lg px-3 py-2">
                <span className="text-xs font-medium text-foreground truncate">{req.username}</span>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => handleRespond(req.friendship_id, "accept")}
                    className="w-6 h-6 rounded-md bg-green-500/10 hover:bg-green-500/20 text-green-500 flex items-center justify-center transition-colors">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleRespond(req.friendship_id, "decline")}
                    className="w-6 h-6 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-[#1e1e1e] my-3" />
        </div>
      )}

      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">
        Друзья {friends.length > 0 && `(${friends.length})`}
      </p>

      {loading ? (
        <div className="grid grid-cols-3 gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex flex-col items-center gap-1.5">
              <div className="w-12 h-12 rounded-full bg-[#2a2a2a]" />
              <div className="w-10 h-2 rounded bg-[#2a2a2a]" />
            </div>
          ))}
        </div>
      ) : friends.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3">Пока нет друзей</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {friends.map((friend) => (
            <button
              key={friend.id}
              onClick={() => onSelectUser({ ...friend, completed_dates: friend.completed_dates ?? [] } as UserType)}
              className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors"
            >
              <UserAvatar avatarUrl={friend.avatar_url} username={friend.username} size={48} />
              <span className="text-[10px] text-foreground font-medium truncate w-full text-center leading-tight">
                {friend.username}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
