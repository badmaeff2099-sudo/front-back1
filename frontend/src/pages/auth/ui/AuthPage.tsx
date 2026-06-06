import { AuthForm } from "@/features/auth-form/ui/AuthForm"
import type { User as UserType } from "@/entities/user/model/types"
import "./AuthPage.css"

interface AuthProps {
  onLogin: (user: UserType) => void
}

function Auth({ onLogin }: AuthProps) {
  return (
    <div className="auth-container">
      <div className="auth-background" />
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">Chainify</h2>
        </div>
        <AuthForm onLogin={onLogin} />
      </div>
    </div>
  )
}

export default Auth
