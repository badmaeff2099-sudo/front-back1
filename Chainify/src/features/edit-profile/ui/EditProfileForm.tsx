import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2, User, Mail, Edit2, Save, X, MapPin, Target, AtSign } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import { Field, FieldLabel, FieldError } from "@/shared/ui/field"
import { updateProfile } from "@/shared/api/client"
import type { User as UserType } from "@/entities/user/model/types"
import { profileSchema, type ProfileValues } from "@/pages/profile/model/schemas"

interface EditProfileFormProps {
  user: UserType
  onSave: (updated: UserType) => void
}

export function EditProfileForm({ user, onSave }: EditProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false)

  const { control, handleSubmit, reset, formState: { isSubmitting } } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user.username ?? "",
      nickname: user.nickname ?? "",
      email: user.email ?? "",
      bio: user.bio ?? "",
      location: user.location ?? "",
      goal: user.goal ?? "",
      daily_actions: user.daily_actions ?? "",
    },
  })

  const handleSave = async (values: ProfileValues) => {
    try {
      const res = await updateProfile(user.id, {
        username: values.username ?? "",
        nickname: values.nickname ?? "",
        goal: values.goal ?? "",
        location: values.location ?? "",
        bio: values.bio ?? "",
        daily_actions: values.daily_actions ?? "",
      })
      if (res.success) {
        const updated = { ...user, ...values, ...res.user }
        onSave(updated)
        toast.success("Профиль успешно обновлён!")
        setIsEditing(false)
      } else {
        toast.error(res.error || "Ошибка при сохранении")
      }
    } catch {
      toast.error("Ошибка соединения")
    }
  }

  const handleCancel = () => { reset(); setIsEditing(false) }

  return (
    <>
      {!isEditing && (
        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}
          className="bg-[#1a1a1a] border-[#252525] text-foreground hover:bg-[#222]">
          <Edit2 className="h-4 w-4 mr-2" /> Редактировать профиль
        </Button>
      )}

      <form onSubmit={handleSubmit(handleSave)} className="flex flex-col gap-4 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller name="username" control={control} render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Имя пользователя</FieldLabel>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input {...field} aria-invalid={fieldState.invalid} disabled={!isEditing} className="pl-9 bg-[#1a1a1a] border-[#252525] text-foreground disabled:opacity-60" />
              </div>
              <FieldError>{fieldState.error?.message}</FieldError>
            </Field>
          )} />
          <Controller name="nickname" control={control} render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Никнейм</FieldLabel>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input {...field} aria-invalid={fieldState.invalid} disabled={!isEditing} placeholder="уникальный никнейм" className="pl-9 bg-[#1a1a1a] border-[#252525] text-foreground disabled:opacity-60" />
              </div>
              <FieldError>{fieldState.error?.message}</FieldError>
            </Field>
          )} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller name="email" control={control} render={({ field }) => (
            <Field>
              <FieldLabel>Email</FieldLabel>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input {...field} disabled={!isEditing} placeholder="email@example.com" className="pl-9 bg-[#1a1a1a] border-[#252525] text-foreground disabled:opacity-60" />
              </div>
            </Field>
          )} />
        </div>

        <Controller name="bio" control={control} render={({ field }) => (
          <Field>
            <FieldLabel>О себе</FieldLabel>
            <Textarea {...field} disabled={!isEditing} rows={3} placeholder="Расскажите о себе..." maxLength={500}
              className="bg-[#1a1a1a] border-[#252525] text-foreground disabled:opacity-60 resize-none" />
          </Field>
        )} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller name="location" control={control} render={({ field }) => (
            <Field>
              <FieldLabel>Локация</FieldLabel>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input {...field} disabled={!isEditing} placeholder="Ваш город" className="pl-9 bg-[#1a1a1a] border-[#252525] text-foreground disabled:opacity-60" />
              </div>
            </Field>
          )} />
          <Controller name="goal" control={control} render={({ field }) => (
            <Field>
              <FieldLabel>Цель</FieldLabel>
              <div className="relative">
                <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input {...field} disabled={!isEditing} placeholder="Ваша цель" className="pl-9 bg-[#1a1a1a] border-[#252525] text-foreground disabled:opacity-60" />
              </div>
            </Field>
          )} />
        </div>

        <Controller name="daily_actions" control={control} render={({ field }) => (
          <Field>
            <FieldLabel>Ежедневные действия</FieldLabel>
            <Textarea {...field} disabled={!isEditing} rows={2} placeholder="Что делаете каждый день?" maxLength={300}
              className="bg-[#1a1a1a] border-[#252525] text-foreground disabled:opacity-60 resize-none" />
          </Field>
        )} />

        {isEditing && (
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleCancel} className="border-[#252525] bg-[#1a1a1a]">
              <X className="h-4 w-4 mr-2" /> Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting} className="profile-save-button">
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Сохранить
            </Button>
          </div>
        )}
      </form>
    </>
  )
}
