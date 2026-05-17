import * as React from "react"
import { cn } from "@/shared/lib/utils"

function Field({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="field" className={cn("flex flex-col gap-1", className)} {...props} />
  )
}

function FieldLabel({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label data-slot="field-label" className={cn("text-xs text-muted-foreground", className)} {...props} />
  )
}

function FieldError({ className, children, ...props }: React.ComponentProps<"p">) {
  if (!children) return null
  return (
    <p data-slot="field-error" className={cn("text-xs text-red-500", className)} {...props}>
      {children}
    </p>
  )
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p data-slot="field-description" className={cn("text-xs text-muted-foreground", className)} {...props} />
  )
}

export { Field, FieldLabel, FieldError, FieldDescription }
