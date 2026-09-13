"use client"

import * as React from "react"
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  LogOut,
  Moon,
  Monitor,
  ShieldCheck,
  Sparkles,
  Sun,
  UserCheck,
} from "lucide-react"
import { useTheme } from "next-themes"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { getUserAvatarUrl } from "@/lib/utils"

interface NavUserProps {
  user: {
    name: string
    email: string
    avatar?: string
    isAuthenticated?: boolean
  }
  onOpenAuthModal?: () => void
  onSignOut?: () => void
}

export function NavUser({
  user,
  onOpenAuthModal,
  onSignOut,
}: NavUserProps) {
  const { isMobile } = useSidebar()
  const { setTheme, theme } = useTheme()

  const avatarSrc = user.avatar || getUserAvatarUrl(user.email)

  const initials = (user.name || user.email || "User")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase() || "U"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-neutral-200/60 dark:hover:bg-neutral-800/70 transition-colors rounded-lg p-1.5 h-auto flex items-center gap-2 w-full overflow-hidden"
            >
              <div className="relative shrink-0 flex items-center justify-center">
                <Avatar className="h-8 w-8 min-h-8 min-w-8 max-h-8 max-w-8 rounded-full bg-amber-400 overflow-hidden shrink-0 ring-1 ring-border/40 shadow-2xs">
                  <AvatarImage src={avatarSrc} alt={user.name} className="h-full w-full object-cover rounded-full" />
                  <AvatarFallback className="rounded-full bg-amber-400 text-amber-950 font-bold text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {/* Green status badge at bottom right */}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-sidebar" />
              </div>
              <div className="grid flex-1 text-left text-xs leading-tight ml-0.5 min-w-0">
                <span className="truncate font-semibold text-[13px] text-neutral-900 dark:text-neutral-100">
                  {user.name}
                </span>
                <span className="truncate text-[11px] text-neutral-500 dark:text-neutral-400 font-normal">
                  {user.email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-3.5 text-neutral-400 shrink-0" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg bg-card border-border shadow-lg p-1 text-xs"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-2 font-normal">
              <div className="flex items-center gap-2.5 text-left text-sm">
                <Avatar className="h-8 w-8 min-h-8 min-w-8 max-h-8 max-w-8 rounded-full bg-amber-400 overflow-hidden shrink-0 ring-1 ring-border/40">
                  <AvatarImage src={avatarSrc} alt={user.name} className="h-full w-full object-cover rounded-full" />
                  <AvatarFallback className="rounded-full bg-amber-400 text-amber-950 font-bold text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-xs leading-tight min-w-0">
                  <span className="truncate font-semibold text-foreground">{user.name}</span>
                  <span className="truncate text-[11px] text-muted-foreground font-normal">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={onOpenAuthModal}
                className="cursor-pointer gap-2 py-1.5 text-xs font-medium"
              >
                {user.isAuthenticated ? (
                  <>
                    <ShieldCheck className="size-4 text-emerald-500" />
                    <span>Account Security (RLS Active)</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4 text-amber-500" />
                    <span>Connect Supabase Account</span>
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={onOpenAuthModal}
                className="cursor-pointer gap-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <BadgeCheck className="size-4" />
                <span>Manage Profile</span>
              </DropdownMenuItem>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer gap-2 py-1.5 text-xs text-muted-foreground hover:text-foreground">
                  <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-muted-foreground" />
                  <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-muted-foreground" />
                  <span>Theme</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-32 rounded-lg bg-card border-border shadow-lg p-1 text-xs">
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
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            {user.isAuthenticated && onSignOut && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onSignOut}
                  className="cursor-pointer gap-2 py-1.5 text-xs text-destructive focus:text-destructive font-medium"
                >
                  <LogOut className="size-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
