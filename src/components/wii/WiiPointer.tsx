import { useEffect, useState } from "react";

type Props = {
  enabled: boolean;
};

export function WiiPointer({ enabled }: Props) {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [visible, setVisible] = useState(false);
  const [coarse, setCoarse] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: none), (pointer: coarse)");
    const update = () => setCoarse(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!enabled || coarse) return;

    const onMove = (e: PointerEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      setVisible(true);
    };
    const onLeave = () => setVisible(false);

    window.addEventListener("pointermove", onMove);
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, [enabled, coarse]);

  if (!enabled || coarse) return null;

  return (
    <div
      className={`wii-pointer ${visible ? "" : "wii-pointer-hidden"}`}
      style={{ left: pos.x, top: pos.y }}
      aria-hidden
    >
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <path
          d="M8 4 L8 28 L14.5 22.5 L18.5 31.5 L22 30 L18 21 L26 20.5 Z"
          fill="#f8fafc"
          stroke="#2f6fb8"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle cx="24" cy="10" r="5.5" fill="#4aa3e8" opacity="0.35" />
        <circle cx="24" cy="10" r="3.2" fill="#6eb6ef" opacity="0.55" />
      </svg>
    </div>
  );
}
