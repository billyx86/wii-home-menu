import { useEffect, useState } from "react";

export function WiiClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const time = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(now);

  const date = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(now);

  return (
    <div className="wii-clock text-right leading-tight">
      <div className="text-lg sm:text-xl font-semibold tracking-wide">{time}</div>
      <div className="text-[0.7rem] sm:text-xs font-medium text-wii-muted">{date}</div>
    </div>
  );
}
