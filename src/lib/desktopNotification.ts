// Browser Desktop Notification Helper (HTML5 Notification API)

export async function requestDesktopNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  if (Notification.permission === "granted") {
    return "granted";
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn("Desktop notification permission error:", err);
    return "denied";
  }
}

export function getDesktopNotificationPermission(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  return Notification.permission;
}

export function showDesktopNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    tag?: string;
    onClick?: () => void;
  }
) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    const notification = new Notification(title, {
      body: options?.body,
      icon: options?.icon || "/favicon.ico",
      tag: options?.tag || `job-${Date.now()}`,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      if (options?.onClick) {
        options.onClick();
      }
    };
  } catch (err) {
    console.warn("Failed to create desktop notification:", err);
  }
}

