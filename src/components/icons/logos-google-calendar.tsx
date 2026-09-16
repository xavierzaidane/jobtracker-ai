import * as React from "react";

export interface GoogleCalendarProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  size?: number;
}

export function GoogleCalendarIcon({
  size = 16,
  className,
  style,
  alt = "Google Calendar",
  ...props
}: GoogleCalendarProps) {
  return (
    <img
      src="/gcalendar.png"
      alt={alt}
      width={size}
      height={size}
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        display: "inline-block",
        flexShrink: 0,
        ...style,
      }}
      {...props}
    />
  );
}

export { GoogleCalendarIcon as GoogleCalendar };
