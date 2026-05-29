import { z } from "zod"

export const profileSchema = z.object({
  username: z.string().min(3, "Минимум 3 символа"),
  nickname: z.string().max(50, "Максимум 50 символов").optional(),
  email: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  goal: z.string().optional(),
  daily_actions: z.string().optional(),
})

export type ProfileValues = z.infer<typeof profileSchema>
