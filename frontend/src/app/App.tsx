import { useState, useEffect, lazy, Suspense } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { TooltipProvider } from "@/shared/ui/tooltip"
import { requestPermission, checkAndNotify } from "@/shared/api/notifications"
import type { User as UserType } from "@/entities/user/model/types"

const AuthPage = lazy(() => import("@/pages/auth/ui/AuthPage"))
const DashboardPage = lazy(() => import("@/pages/dashboard/ui/DashboardPage"))
const ProfilePage = lazy(() => import("@/pages/profile/ui/ProfilePage"))
const LeaderboardPage = lazy(() => import("@/pages/leaderboard/ui/LeaderboardPage"))
const UserProfilePage = lazy(() => import("@/pages/user-profile/ui/UserProfilePage"))
const FriendsPage = lazy(() => import("@/pages/friends/ui/FriendsPage"))
const CabinetPage = lazy(() => import("@/pages/cabinet/ui/CabinetPage"))

function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a0a]">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem("chainify-user-data"))
  const [currentUser, setCurrentUser] = useState<UserType | null>(() => {
    const saved = localStorage.getItem("chainify-user-data")
    return saved ? JSON.parse(saved) : null
  })
  const [showProfile, setShowProfile] = useState(false)
  const [showFriends, setShowFriends] = useState(false)
  const [showCabinet, setShowCabinet] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !currentUser) return
    requestPermission()
    checkAndNotify()
  }, [isAuthenticated, currentUser])

  const handleLogin = (userData: UserType) => {
    localStorage.setItem("chainify-user-data", JSON.stringify(userData))
    setCurrentUser(userData)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem("chainify-user-data")
    setIsAuthenticated(false)
    setCurrentUser(null)
    setShowProfile(false)
    setShowFriends(false)
    setShowCabinet(false)
    setShowLogoutConfirm(false)
    toast("Вы вышли из системы")
  }

  const handleUpdateUser = (updatedUser: Partial<UserType>) => {
    setCurrentUser(prev => ({ ...prev!, ...updatedUser }))
    localStorage.setItem("chainify-user-data", JSON.stringify({ ...currentUser, ...updatedUser }))
  }

  const handleMarkDayInApp = (today: string) => {
    setCurrentUser(prev => {
      if (!prev) return prev
      const already = (prev.completed_dates ?? []).includes(today)
      if (already) return prev
      const updated = { ...prev, completed_dates: [...(prev.completed_dates ?? []), today] }
      localStorage.setItem("chainify-user-data", JSON.stringify(updated))
      return updated
    })
  }

  const handleSelectUser = (user: UserType) => {
    setShowFriends(false)
    setSelectedUser(user)
  }

  if (!isAuthenticated) return <Suspense fallback={<PageLoader />}><AuthPage onLogin={handleLogin} /></Suspense>
  if (showLeaderboard) return <Suspense fallback={<PageLoader />}><LeaderboardPage currentUser={currentUser ?? undefined} onBack={() => setShowLeaderboard(false)} /></Suspense>
  if (showProfile) return <Suspense fallback={<PageLoader />}><ProfilePage currentUser={currentUser!} onBack={() => setShowProfile(false)} onUpdateUser={handleUpdateUser} onLogout={handleLogout} /></Suspense>
  if (showFriends) return <Suspense fallback={<PageLoader />}><FriendsPage currentUser={currentUser!} onBack={() => setShowFriends(false)} onSelectUser={handleSelectUser} /></Suspense>
  if (showCabinet) return <Suspense fallback={<PageLoader />}><CabinetPage currentUser={currentUser!} onBack={() => setShowCabinet(false)} /></Suspense>
  if (selectedUser) return <Suspense fallback={<PageLoader />}><TooltipProvider><UserProfilePage user={selectedUser} currentUser={currentUser!} onBack={() => setSelectedUser(null)} /></TooltipProvider></Suspense>

  return (
    <Suspense fallback={<PageLoader />}>
      <DashboardPage
        currentUser={currentUser!}
        onShowProfile={() => setShowProfile(true)}
        onShowLeaderboard={() => setShowLeaderboard(true)}
        onShowFriends={() => setShowFriends(true)}
        onShowCabinet={() => setShowCabinet(true)}
        onSelectUser={setSelectedUser}
        onLogout={() => setShowLogoutConfirm(true)}
        onMarkDayInApp={handleMarkDayInApp}
      />
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-6 w-80 shadow-2xl">
            <h3 className="text-base font-semibold text-foreground mb-1">Выйти из аккаунта?</h3>
            <p className="text-sm text-muted-foreground mb-5">Вы уверены, что хотите выйти?</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm text-muted-foreground bg-[#1a1a1a] border border-[#252525] hover:bg-[#222] transition-colors">
                Отмена
              </button>
              <button onClick={handleLogout}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600/80 hover:bg-red-600 transition-colors">
                Выйти
              </button>
            </div>
          </div>
        </div>
      )}
    </Suspense>
  )
}

export default App
