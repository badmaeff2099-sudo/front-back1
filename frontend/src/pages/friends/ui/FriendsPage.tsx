import { useEffect, useState, useRef } from "react"
import { ArrowLeft, Search, UserPlus, UserCheck, Clock, Check, X, Users } from "lucide-react"
import { toast } from "sonner"
import { getFriends, getUsers, sendFriendRequest, respondFriendRequest, getFriendStatus, deleteFriend } from "@/shared/api/client"
import { UserAvatar } from "@/entities/user/ui/UserAvatar"
import type { User as UserType } from "@/entities/user/model/types"

interface FriendsPageProps {
  currentUser: UserType
  onBack: () => void
  onSelectUser: (user: UserType) => void
}

interface FriendEntry {
  id: number
  username: string
  nickname?: string
  location?: string
  avatar_url?: string
  completed_dates: string[]
  friendship_id: number
}

interface IncomingEntry {
  friendship_id: number
  id: number
  username: string
  nickname?: string
  location?: string
  avatar_url?: string
}

interface SearchUser {
  id: number
  username: string
  nickname?: string
  location?: string
  avatar_url?: string
  completed_dates: string[]
}

type FriendStatus = "none" | "pending_sent" | "pending_received" | "accepted"

interface UserWithStatus extends SearchUser {
  friendStatus: FriendStatus
  friendshipId?: number
}

export default function FriendsPage({ currentUser, onBack, onSelectUser }: FriendsPageProps) {
  const [friends, setFriends] = useState<FriendEntry[]>([])
  const [incoming, setIncoming] = useState<IncomingEntry[]>([])
  const [query, setQuery] = useState("")
  const [searchResults, setSearchResults] = useState<UserWithStatus[]>([])
  const [allUsers, setAllUsers] = useState<SearchUser[]>([])
  const [loadingFriends, setLoadingFriends] = useState(true)
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadFriends = () => {
    getFriends(currentUser.id).then((res) => {
      if (res.success) {
        setFriends(res.friends ?? [])
        setIncoming(res.incoming ?? [])
      }
      setLoadingFriends(false)
    })
  }

  useEffect(() => {
    loadFriends()
    getUsers("").then((res) => {
      if (res.success) {
        setAllUsers(res.users.filter((u: SearchUser) => u.id !== currentUser.id))
      }
    })
  }, [currentUser.id])

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    const q = query.trim().toLowerCase()
    if (!q) {
      setSearchResults([])
      return
    }
    setLoadingSearch(true)
    searchTimeout.current = setTimeout(async () => {
      const matched = allUsers.filter((u) =>
        u.username.toLowerCase().includes(q) ||
        (u.nickname && u.nickname.toLowerCase().includes(q))
      )
      // Fetch friend status for each matched user
      const withStatus: UserWithStatus[] = await Promise.all(
        matched.map(async (u) => {
          try {
            const res = await getFriendStatus(currentUser.id, u.id)
            let friendStatus: FriendStatus = "none"
            let friendshipId: number | undefined
            if (res.success) {
              if (res.status === "accepted") friendStatus = "accepted"
              else if (res.status === "pending") {
                friendStatus = res.direction === "sent" ? "pending_sent" : "pending_received"
                friendshipId = res.friendship_id
              }
            }
            return { ...u, friendStatus, friendshipId }
          } catch {
            return { ...u, friendStatus: "none" as FriendStatus }
          }
        })
      )
      setSearchResults(withStatus)
      setLoadingSearch(false)
    }, 350)
  }, [query, allUsers, currentUser.id])

  const handleSendRequest = async (userId: number) => {
    setActionLoading(userId)
    const res = await sendFriendRequest(currentUser.id, userId)
    if (res.success) {
      toast.success("Запрос в друзья отправлен!")
      setSearchResults((prev) =>
        prev.map((u) => u.id === userId ? { ...u, friendStatus: "pending_sent" } : u)
      )
    } else {
      toast.error("Ошибка при отправке запроса")
    }
    setActionLoading(null)
  }

  const handleRespond = async (friendshipId: number, action: "accept" | "decline", userId?: number) => {
    setActionLoading(userId ?? friendshipId)
    const res = await respondFriendRequest(friendshipId, action)
    if (res.success) {
      toast.success(action === "accept" ? "Заявка принята!" : "Заявка отклонена")
      loadFriends()
      if (userId) {
        setSearchResults((prev) =>
          prev.map((u) => u.id === userId
            ? { ...u, friendStatus: action === "accept" ? "accepted" : "none", friendshipId: undefined }
            : u
          )
        )
      }
    }
    setActionLoading(null)
  }

  const handleDeleteFriend = async (friendshipId: number, username: string) => {
    if (!window.confirm(`Удалить ${username} из друзей?`)) return
    setActionLoading(friendshipId)
    const res = await deleteFriend(friendshipId, currentUser.id)
    if (res.success) {
      setFriends((prev) => prev.filter((f) => f.friendship_id !== friendshipId))
      toast.success(`${username} удалён из друзей`)
    } else {
      toast.error("Не удалось удалить из друзей")
    }
    setActionLoading(null)
  }

  const isMyFriend = (userId: number) => friends.some((f) => f.id === userId)

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Назад
        </button>

        <div className="flex items-center gap-3 mb-6">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-bold text-foreground">Мои друзья</h1>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по имени или никнейму..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#111] border border-[#1e1e1e] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#333] transition-colors"
          />
        </div>

        {/* Search results */}
        {query.trim() && (
          <div className="bg-[#111] border border-[#1e1e1e] rounded-xl mb-6 overflow-hidden">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-4 pt-4 pb-2">
              Результаты поиска
            </p>
            {loadingSearch ? (
              <div className="flex flex-col gap-2 p-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-[#1e1e1e]" />
                    <div className="flex-1 h-3 rounded bg-[#1e1e1e]" />
                  </div>
                ))}
              </div>
            ) : searchResults.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Никого не найдено</p>
            ) : (
              <div className="divide-y divide-[#1a1a1a]">
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 px-4 py-3">
                    <button
                      onClick={() => onSelectUser({ ...user, completed_dates: user.completed_dates ?? [] })}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
                    >
                      <UserAvatar avatarUrl={user.avatar_url} username={user.username} size={40} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{user.username}</p>
                        {user.nickname && (
                          <p className="text-xs text-muted-foreground">@{user.nickname}</p>
                        )}
                      </div>
                    </button>
                    <div className="shrink-0">
                      {user.friendStatus === "accepted" || isMyFriend(user.id) ? (
                        <span className="flex items-center gap-1.5 text-xs text-green-500 bg-green-500/10 px-2.5 py-1 rounded-lg border border-green-500/20">
                          <UserCheck className="h-3.5 w-3.5" /> В друзьях
                        </span>
                      ) : user.friendStatus === "pending_sent" ? (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-[#1a1a1a] px-2.5 py-1 rounded-lg border border-[#252525]">
                          <Clock className="h-3.5 w-3.5" /> Отправлено
                        </span>
                      ) : user.friendStatus === "pending_received" ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleRespond(user.friendshipId!, "accept", user.id)}
                            disabled={actionLoading === user.id}
                            className="w-7 h-7 rounded-md bg-green-500/10 hover:bg-green-500/20 text-green-500 flex items-center justify-center transition-colors"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleRespond(user.friendshipId!, "decline", user.id)}
                            disabled={actionLoading === user.id}
                            className="w-7 h-7 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(user.id)}
                          disabled={actionLoading === user.id}
                          className="flex items-center gap-1.5 text-xs text-foreground bg-[#1a1a1a] hover:bg-[#222] px-2.5 py-1 rounded-lg border border-[#252525] transition-colors disabled:opacity-50"
                        >
                          <UserPlus className="h-3.5 w-3.5" /> Добавить
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Incoming requests */}
        {incoming.length > 0 && (
          <div className="bg-[#111] border border-[#1e1e1e] rounded-xl mb-6 overflow-hidden">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-4 pt-4 pb-2">
              Заявки в друзья ({incoming.length})
            </p>
            <div className="divide-y divide-[#1a1a1a]">
              {incoming.map((req) => (
                <div key={req.friendship_id} className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => onSelectUser({ ...req, completed_dates: [] } as UserType)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
                  >
                    <UserAvatar avatarUrl={req.avatar_url} username={req.username} size={40} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{req.username}</p>
                      {req.nickname && (
                        <p className="text-xs text-muted-foreground">@{req.nickname}</p>
                      )}
                    </div>
                  </button>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleRespond(req.friendship_id, "accept")}
                      disabled={actionLoading === req.friendship_id}
                      className="w-7 h-7 rounded-md bg-green-500/10 hover:bg-green-500/20 text-green-500 flex items-center justify-center transition-colors"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleRespond(req.friendship_id, "decline")}
                      disabled={actionLoading === req.friendship_id}
                      className="w-7 h-7 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends list */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-4 pt-4 pb-2">
            Друзья {friends.length > 0 && `(${friends.length})`}
          </p>
          {loadingFriends ? (
            <div className="flex flex-col gap-2 p-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-[#1e1e1e]" />
                  <div className="flex-1 h-3 rounded bg-[#1e1e1e]" />
                </div>
              ))}
            </div>
          ) : friends.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Пока нет друзей. Найдите кого-нибудь через поиск выше.
            </p>
          ) : (
            <div className="divide-y divide-[#1a1a1a]">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="group flex items-center gap-3 px-4 py-3 hover:bg-[#161616] transition-colors"
                >
                  <button
                    onClick={() => onSelectUser({ ...friend, completed_dates: friend.completed_dates ?? [] } as UserType)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <UserAvatar avatarUrl={friend.avatar_url} username={friend.username} size={40} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{friend.username}</p>
                      {friend.nickname && (
                        <p className="text-xs text-muted-foreground">@{friend.nickname}</p>
                      )}
                      {friend.location && (
                        <p className="text-xs text-muted-foreground/60 truncate">{friend.location}</p>
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => handleDeleteFriend(friend.friendship_id, friend.username)}
                    disabled={actionLoading === friend.friendship_id}
                    title={`Удалить ${friend.username} из друзей`}
                    aria-label={`Удалить ${friend.username} из друзей`}
                    className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-red-500/10 hover:text-red-500 transition-all disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
