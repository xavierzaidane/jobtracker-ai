import * as React from "react"
import { Check, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "checked"> {
  checked?: boolean | "indeterminate"
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked = false, onCheckedChange, disabled, ...props }, ref) => {
    const isChecked = checked === true
    const isIndeterminate = checked === "indeterminate"

    return (
      <label
        className={cn(
          "relative inline-flex items-center justify-center cursor-pointer select-none",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <input
          type="checkbox"
          ref={ref}
          checked={isChecked}
          disabled={disabled}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className="sr-only peer"
          {...props}
        />
        <div
          className={cn(
            "h-4 w-4 shrink-0 rounded-[4px] border border-muted-foreground/30 transition-all focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring flex items-center justify-center bg-card text-primary-foreground",
            (isChecked || isIndeterminate) && "bg-primary border-primary text-primary-foreground",
            className
          )}
        >
          {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
          {isIndeterminate && <Minus className="h-3 w-3 stroke-[3]" />}
        </div>
      </label>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
