import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2, Mail, Lock, Eye, EyeOff, User, MapPin, Target, LogIn, UserPlus } from "lucide-react"
import { Separator } from "@/shared/ui/separator"
import { register as apiRegister, login } from "@/shared/api/client"
import type { User as UserType } from "@/entities/user/model/types"
import { loginSchema, registerSchema, type LoginValues, type RegisterValues } from "../model/schemas"

interface AuthFormProps {
  onLogin: (user: UserType) => void
}

export function AuthForm({ onLogin }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [showRegConfirm, setShowRegConfirm] = useState(false)

  const {
    register: loginRegister,
    handleSubmit: loginHandleSubmit,
    formState: { errors: loginErrors, isSubmitting: loginSubmitting },
    reset: loginReset,
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: { email: "", password: "" },
  })

  const {
    register: regRegister,
    handleSubmit: regHandleSubmit,
    formState: { errors: regErrors, isSubmitting: regSubmitting },
    reset: regReset,
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: { email: "", username: "", password: "", confirmPassword: "", location: "", goal: "", daily_actions: "" },
  })

  const isSubmitting = isLogin ? loginSubmitting : regSubmitting

  const handleLogin = async (values: LoginValues) => {
    try {
      const res = await login({ email: values.email, password: values.password })
      if (!res.success) { toast.error(res.error || "Неверный email или пароль"); return }
      localStorage.setItem("chainify-user-data", JSON.stringify(res.user))
      toast.success("Добро пожаловать обратно!")
      onLogin(res.user)
    } catch {
      toast.error("Ошибка соединения. Попробуйте ещё раз.")
    }
  }

  const handleRegister = async (values: RegisterValues) => {
    try {
      const res = await apiRegister({
        username: values.username,
        password: values.password,
        email: values.email,
        location: values.location ?? "",
        goal: values.goal ?? "",
        daily_actions: values.daily_actions ?? "",
      })
      if (!res.success) { toast.error(res.error || "Ошибка регистрации"); return }
      localStorage.setItem("chainify-user-data", JSON.stringify(res.user))
      toast.success("Регистрация успешна! Добро пожаловать!")
      onLogin(res.user)
    } catch {
      toast.error("Ошибка соединения. Попробуйте ещё раз.")
    }
  }

  const switchMode = () => { setIsLogin(!isLogin); loginReset(); regReset() }

  const inputCls = "h-9 w-full rounded-lg border border-[#252525] bg-[#1a1a1a] px-3 py-1 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"

  return (
    <>
      {isLogin ? (
        <form onSubmit={loginHandleSubmit(handleLogin)} className="auth-form flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
              <input {...loginRegister("email")} type="email" placeholder="email@example.com" className={`${inputCls} pl-9`} />
            </div>
            {loginErrors.email && <p className="text-xs text-red-500">{loginErrors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Пароль</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
              <input {...loginRegister("password")} type={showLoginPassword ? "text" : "password"} placeholder="Пароль" className={`${inputCls} pl-9 pr-10`} />
              <button type="button" onClick={() => setShowLoginPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {loginErrors.password && <p className="text-xs text-red-500">{loginErrors.password.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="auth-submit-button w-full h-11 flex items-center justify-center rounded-lg text-sm font-semibold">
            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
            Войти
          </button>
        </form>
      ) : (
        <form onSubmit={regHandleSubmit(handleRegister)} className="auth-form flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
              <input {...regRegister("email")} type="email" placeholder="email@example.com" className={`${inputCls} pl-9`} />
            </div>
            {regErrors.email && <p className="text-xs text-red-500">{regErrors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Имя пользователя</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
              <input {...regRegister("username")} type="text" placeholder="Имя пользователя" className={`${inputCls} pl-9`} />
            </div>
            {regErrors.username && <p className="text-xs text-red-500">{regErrors.username.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Пароль</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
              <input {...regRegister("password")} type={showRegPassword ? "text" : "password"} placeholder="Пароль" className={`${inputCls} pl-9 pr-10`} />
              <button type="button" onClick={() => setShowRegPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {regErrors.password && <p className="text-xs text-red-500">{regErrors.password.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Подтвердите пароль</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
              <input {...regRegister("confirmPassword")} type={showRegConfirm ? "text" : "password"} placeholder="Подтвердите пароль" className={`${inputCls} pl-9 pr-10`} />
              <button type="button" onClick={() => setShowRegConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showRegConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {regErrors.confirmPassword && <p className="text-xs text-red-500">{regErrors.confirmPassword.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Город (необязательно)</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
              <input {...regRegister("location")} type="text" placeholder="Ваш город" className={`${inputCls} pl-9`} />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Цель (необязательно)</label>
            <div className="relative">
              <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
              <input {...regRegister("goal")} type="text" placeholder="Ваша цель" className={`${inputCls} pl-9`} />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Ежедневные действия (необязательно)</label>
            <textarea {...regRegister("daily_actions")} placeholder="Что будете делать каждый день?" rows={2}
              className="w-full rounded-lg border border-[#252525] bg-[#1a1a1a] px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30 resize-none" />
          </div>

          <button type="submit" disabled={isSubmitting} className="auth-submit-button w-full h-11 flex items-center justify-center rounded-lg text-sm font-semibold">
            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
            Зарегистрироваться
          </button>
        </form>
      )}

      <div className="flex items-center gap-3 my-5">
        <Separator className="flex-1 bg-[#1e1e1e]" />
        <span className="text-xs text-muted-foreground">или</span>
        <Separator className="flex-1 bg-[#1e1e1e]" />
      </div>

      <div className="auth-footer">
        <span className="text-sm text-muted-foreground">
          {isLogin ? "Нет аккаунта? " : "Уже есть аккаунт? "}
        </span>
        <button onClick={switchMode} className="auth-switch-link text-sm font-semibold ml-1">
          {isLogin ? "Зарегистрироваться" : "Войти"}
        </button>
      </div>
    </>
  )
}
