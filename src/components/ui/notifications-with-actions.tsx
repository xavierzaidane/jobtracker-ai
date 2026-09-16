"use client";

import * as React from "react"
import {
  Bell,
  GripVertical,
  Trash2,
  Archive,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"

export interface NotificationItem {
  id: string
  title: string
  description: string
  time: string
  icon?: React.ReactNode
  type?: "welcome" | "update" | "reminder" | "success" | "warning" | "info"
}

export interface NotificationsWithActionsProps {
  items?: NotificationItem[]
  placement?: "top" | "right" | "bottom" | "left"
  onDelete?: (id: string) => void
  onArchive?: (id: string) => void
}

const defaultNotifications: NotificationItem[] = [
  {
    id: "1",
    title: "Welcome",
    description: "Thanks for checking out the notifications component!",
    time: "just now",
    type: "welcome",
  },
  {
    id: "2",
    title: "System Update",
    description: "We’ve rolled out a new feature for you.",
    time: "1h ago",
    type: "update",
  },
  {
    id: "3",
    title: "Reminder",
    description: "Don’t forget to finish your profile setup.",
    time: "3h ago",
    type: "reminder",
  },
]

function getNotificationIcon(item: NotificationItem) {
  if (item.icon) return item.icon
  switch (item.type) {
    case "welcome":
      return <Sparkles className="h-3.5 w-3.5 text-primary" />
    case "update":
      return <RefreshCw className="h-3.5 w-3.5 text-blue-500" />
    case "reminder":
      return <Clock className="h-3.5 w-3.5 text-purple-500" />
    case "success":
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
    case "warning":
      return <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
    default:
      return <Info className="h-3.5 w-3.5 text-muted-foreground" />
  }
}

export default function NotificationsWithActions({
  items = defaultNotifications,
  placement = "bottom",
  onDelete,
  onArchive,
}: NotificationsWithActionsProps) {
  const [notifications, setNotifications] =
    React.useState<NotificationItem[]>(items)
  const [activeId, setActiveId] = React.useState<string | null>(null)

  React.useEffect(() => {
    setNotifications(items)
  }, [items])

  const handleArchive = (id: string) => {
    onArchive?.(id)
    setActiveId(null)
  }

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    onDelete?.(id)
    setActiveId(null)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative inline-flex items-center justify-center rounded-full p-2 hover:bg-muted transition-colors">
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <Badge
              variant="default"
              className="absolute -top-1 -right-1 text-xs px-1.5 py-0"
            >
              {notifications.length}
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0"
        align="center"
        side={placement}
      >
        <Card className="max-h-80 overflow-y-auto rounded-lg border-none shadow-none">
          {notifications.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No notifications
            </div>
          ) : (
            <ul className="divide-y divide-border list-none m-0 p-0">
              {notifications.map((item) => {
                const isActive = activeId === item.id
                return (
                  <li
                    key={item.id}
                    className="flex items-center justify-between p-3.5 hover:bg-muted/50 transition-colors"
                  >
                    {/* Left text with animation */}
                    <motion.div
                      animate={{ x: isActive ? -40 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-1 min-w-0 pr-2 flex items-start gap-2.5"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/70 mt-0.5">
                        {getNotificationIcon(item)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="font-medium text-sm truncate">{item.title}</span>
                          <span className="text-xs text-muted-foreground shrink-0 ml-2">
                            {item.time}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    </motion.div>

                    {/* Right side controls */}
                    <div className="ml-2 flex items-center shrink-0">
                      {isActive ? (
                        <div className="flex items-center space-x-1">
                          <button
                            className="p-1 rounded-md hover:bg-muted transition-colors"
                            onClick={() => handleArchive(item.id)}
                            title="Archive notification"
                          >
                            <Archive className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <button
                            className="p-1 rounded-md hover:bg-muted transition-colors"
                            onClick={() => handleDelete(item.id)}
                            title="Delete notification"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </button>
                          <button
                            className="p-1 rounded-md hover:bg-muted transition-colors"
                            onClick={() => setActiveId(null)}
                            title="Close actions"
                          >
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </div>
                      ) : (
                        <button
                          className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() =>
                            setActiveId(isActive ? null : item.id)
                          }
                          title="Actions"
                        >
                          <GripVertical className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </PopoverContent>
    </Popover>
  )
}
export { NotificationsWithActions };
