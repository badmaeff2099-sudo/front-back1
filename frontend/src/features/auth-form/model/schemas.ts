import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().min(1, "Введите email").email("Введите корректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
})

export const registerSchema = z
  .object({
    email: z.string().min(1, "Введите email").email("Введите корректный email"),
    username: z.string().min(3, "Минимум 3 символа"),
    password: z.string().min(6, "Минимум 6 символов"),
    confirmPassword: z.string().min(1, "Подтвердите пароль"),
    location: z.string().optional(),
    goal: z.string().optional(),
    daily_actions: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  })

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>
