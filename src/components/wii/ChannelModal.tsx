import { useRef } from "react";
import type { ChannelDef } from "./channels";
import { ChannelArt } from "./ChannelArt";
import { useFocusTrap } from "./focusTrap";

type Props = {
  channel: ChannelDef;
  onClose: () => void;
  onLaunch: () => void;
};

export function ChannelModal({ channel, onClose, onLaunch }: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const launchable = channel.kind !== "empty" && channel.kind !== "disc";

  // #9: keep focus inside the dialog, close on Escape, and hand focus back to
  // the tile that opened the modal when it closes.
  useFocusTrap(true, panelRef, onClose);

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center p-4 sm:p-8"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-wii-bg/70 backdrop-blur-[2px] wii-fade-in"
        role="presentation"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Channel: ${channel.name}`}
        className="wii-modal-panel relative w-full max-w-lg rounded-2xl p-5 sm:p-6 wii-pop-in"
      >
        <div className="flex gap-4 sm:gap-5">
          <div
            className={`wii-channel-art w-24 h-24 sm:w-28 sm:h-28 rounded-xl flex-shrink-0 ${channel.kind === "disc" ? "wii-disc-frame" : ""}`}
            aria-hidden="true"
          >
            <ChannelArt
              kind={channel.kind}
              accent={channel.accent}
              accentSoft={channel.accentSoft}
              spinning
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="wii-modal-title font-semibold truncate">{channel.name}</h2>
            <p className="wii-modal-desc text-sm mt-1 leading-relaxed line-clamp-4">
              {channel.description}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-5">
          {launchable && (
            <button
              type="button"
              className="wii-modal-btn wii-modal-btn-primary"
              onClick={onLaunch}
            >
              Start
            </button>
          )}
          <button type="button" className="wii-modal-btn wii-modal-btn-ghost" onClick={onClose}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
