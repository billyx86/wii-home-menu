import { useEffect, useState } from "react";

// Hoisted to module scope: Intl.DateTimeFormat construction is expensive, and
// the display only changes when the minute rolls over anyway.
const timeFmt = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});
const dateFmt = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
});

export function WiiClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => {
      // Tick every second (cheap) but bail out unless the displayed minute
      // actually changed — returning the same Date lets React skip the
      // re-render entirely between minute boundaries.
      setNow((prev) => {
        const next = new Date();
        return next.getMinutes() === prev.getMinutes() ? prev : next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="wii-clock text-right leading-tight">
      <div className="text-lg sm:text-xl font-semibold tracking-wide">{timeFmt.format(now)}</div>
      <div className="text-[0.7rem] sm:text-xs font-medium text-wii-muted">{dateFmt.format(now)}</div>
    </div>
  );
}
