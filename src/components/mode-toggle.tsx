"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ModeToggleProps {
  variant?: "ghost" | "outline" | "default" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  align?: "start" | "center" | "end"
}

export function ModeToggle({
  variant = "ghost",
  size = "icon",
  className = "h-7 w-7 rounded-md text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100",
  align = "end",
}: ModeToggleProps) {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <Sun className="h-3.5 w-3.5" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-muted-foreground" />
          <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-muted-foreground" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-32 rounded-lg bg-card border-border shadow-lg p-1 text-xs">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={`cursor-pointer gap-2 py-1.5 text-xs ${theme === "light" ? "font-semibold text-primary" : ""}`}
        >
          <Sun className="size-3.5 text-muted-foreground" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={`cursor-pointer gap-2 py-1.5 text-xs ${theme === "dark" ? "font-semibold text-primary" : ""}`}
        >
          <Moon className="size-3.5 text-muted-foreground" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={`cursor-pointer gap-2 py-1.5 text-xs ${theme === "system" ? "font-semibold text-primary" : ""}`}
        >
          <Monitor className="size-3.5 text-muted-foreground" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

