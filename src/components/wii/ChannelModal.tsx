import { useEffect } from "react";
import { ChannelArt } from "./ChannelArt";
import type { ChannelDef } from "./channels";

type Props = {
  channel: ChannelDef;
  onStart: () => void;
  onBack: () => void;
};

export function ChannelModal({ channel, onStart, onBack }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onBack();
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (channel.kind !== "empty") onStart();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [channel.kind, onBack, onStart]);

  const empty = channel.kind === "empty";

  return (
    <div className="wii-modal-backdrop flex items-center justify-center p-4" role="presentation" onClick={onBack}>
      <div
        className="wii-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="channel-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="wii-modal-hero"
          style={{
            background: `linear-gradient(160deg, ${channel.accentSoft} 0%, #ffffff 50%, color-mix(in srgb, ${channel.accent} 18%, #e8eef5) 100%)`,
          }}
        >
          <ChannelArt
            kind={channel.kind}
            accent={channel.accent}
            accentSoft={channel.accentSoft}
            size="hero"
            spinning={channel.kind === "disc"}
          />
        </div>

        <div className="px-6 pt-5 pb-6 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-wii-muted mb-1">
            {empty ? "Channel slot" : "Channel"}
          </p>
          <h2 id="channel-title" className="text-2xl font-semibold tracking-tight text-wii-fg">
            {empty ? "Empty Slot" : channel.name}
          </h2>
          <p className="mt-1 text-sm font-medium text-wii-accent-deep">
            {empty ? "Nothing installed here" : channel.subtitle}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-wii-muted">{channel.description}</p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {!empty && (
              <button type="button" className="wii-primary-btn" onClick={onStart}>
                Start
              </button>
            )}
            <button type="button" className="wii-secondary-btn" onClick={onBack} autoFocus>
              {empty ? "Close" : "Back"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
