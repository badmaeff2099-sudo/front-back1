import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Trophy,
  Calendar,
  Camera,
  Loader2,
  Trash2,
} from "lucide-react";
import { Separator } from "@/shared/ui/separator";
import {
  getProgress,
  uploadAvatar,
  deleteAccount,
  blockAccount,
} from "@/shared/api/client";
import type { User as UserType } from "@/entities/user/model/types";
import { UserAvatar } from "@/entities/user/ui/UserAvatar";
import { EditProfileForm } from "@/features/edit-profile/ui/EditProfileForm";
import "./ProfilePage.css";
import { appVersion } from "@/shared/constants";

interface ProfileProps {
  currentUser: UserType;
  onBack: () => void;
  onUpdateUser: (u: Partial<UserType>) => void;
  onLogout?: () => void;
  profileUser?: UserType;
}

function Profile({
  currentUser,
  onBack,
  onUpdateUser,
  onLogout,
  profileUser,
}: ProfileProps) {
  const profileUserId = profileUser?.id || currentUser?.id;
  const isOwnProfile = !profileUser || profileUser.id === currentUser?.id;
  const [userData, setUserData] = useState<UserType>(
    profileUser ?? currentUser,
  );
  const [stats, setStats] = useState({ totalDays: 0, streak: 0 });
  const [uploading, setUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profileUserId) {
      getProgress(profileUserId).then((res: any) => {
        if (res.success) setStats({ totalDays: res.total, streak: res.streak });
      });
    }
  }, [profileUserId]);

  const handleSave = (updated: UserType) => {
    setUserData(updated);
    onUpdateUser(updated);
    localStorage.setItem("chainify-user-data", JSON.stringify(updated));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadAvatar(userData.id, file);
      if (res.success && res.avatar_url) {
        const updated = { ...userData, avatar_url: res.avatar_url };
        setUserData(updated);
        onUpdateUser(updated);
        localStorage.setItem("chainify-user-data", JSON.stringify(updated));
        toast.success("Аватарка обновлена!");
      } else {
        toast.error(res.error || "Ошибка загрузки");
      }
    } catch {
      toast.error("Ошибка соединения");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      const res = await deleteAccount(userData.id);
      if (res.success) {
        toast.success("Аккаунт удалён");
        localStorage.removeItem("chainify-user-data");
        onLogout?.();
      } else {
        toast.error(res.error || "Ошибка при удалении");
      }
    } catch {
      toast.error("Ошибка соединения");
    } finally {
      setActionLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleBlock = async () => {
    setActionLoading(true);
    try {
      const res = await blockAccount(userData.id);
      if (res.success) {
        toast.success("Аккаунт заблокирован");
        localStorage.removeItem("chainify-user-data");
        onLogout?.();
      } else {
        toast.error(res.error || "Ошибка при блокировке");
      }
    } catch {
      toast.error("Ошибка соединения");
    } finally {
      setActionLoading(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <button
          onClick={onBack}
          className="profile-back-button flex items-center gap-2 mb-5 text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Назад
        </button>

        <div className="profile-main-card">
          <div className="p-10">
            <div className="profile-header">
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <UserAvatar
                    avatarUrl={userData.avatar_url}
                    username={userData.username}
                    size={96}
                  />
                  {isOwnProfile && (
                    <>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        {uploading ? (
                          <Loader2 className="h-6 w-6 text-white animate-spin" />
                        ) : (
                          <Camera className="h-6 w-6 text-white" />
                        )}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </>
                  )}
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <p className="text-base font-semibold text-foreground">
                    {userData.username}
                  </p>
                  {userData.nickname && (
                    <p className="text-sm text-muted-foreground">
                      @{userData.nickname}
                    </p>
                  )}
                </div>
                {isOwnProfile && (
                  <EditProfileForm user={userData} onSave={handleSave} />
                )}
              </div>
            </div>

            <Separator className="my-6 bg-[#1e1e1e]" />

            <div className="profile-info-section">
              <span className="profile-info-label">
                <Calendar className="h-3 w-3" /> Дата регистрации
              </span>
              <span className="profile-info-value">
                {userData.created_at
                  ? new Date(userData.created_at).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : userData.joinDate || "—"}
              </span>
              {appVersion}
            </div>

            <Separator className="my-6 bg-[#1e1e1e]" />

            <div className="profile-stats">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4">
                Статистика Тест релиза #2 проверка скриптов
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="stat-card p-5">
                  <p className="text-xs text-muted-foreground mb-1">
                    Всего дней
                  </p>
                  <p className="text-2xl font-bold text-brand flex items-center gap-2">
                    <Trophy className="h-5 w-5" /> {stats.totalDays}
                  </p>
                </div>
                <div className="stat-card p-5">
                  <p className="text-xs text-muted-foreground mb-1">
                    Текущая серия
                  </p>
                  <p className="text-2xl font-bold text-yellow-500 flex items-center gap-2">
                    <Trophy className="h-5 w-5" /> {stats.streak}
                  </p>
                </div>
              </div>
            </div>

            {isOwnProfile && (
              <>
                <Separator className="my-6 bg-[#1e1e1e]" />
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center gap-2 text-sm text-red-500/60 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" /> Удалить мой аккаунт
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete account modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-6 w-96 shadow-2xl">
            <h3 className="text-base font-semibold text-foreground mb-1">
              Подождите!
            </h3>
            <p className="text-sm text-muted-foreground mb-5">
              Вы можете временно заблокировать ваш аккаунт вместо удаления.
              Заблокированный аккаунт можно восстановить, обратившись в
              поддержку.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleBlock}
                disabled={actionLoading}
                className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-brand/80 hover:bg-brand transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Да, заблокировать аккаунт
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="w-full px-4 py-2.5 rounded-lg text-sm text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Нет, я хочу удалить аккаунт
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={actionLoading}
                className="w-full px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
