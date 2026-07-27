import { useEffect } from "react";
import { Volume2, VolumeX, X } from "lucide-react";
import { getWiiMuted, getWiiVolume, setWiiMuted, setWiiVolume } from "./audio";

type Props = {
  open: boolean;
  volume: number;
  muted: boolean;
  onVolume: (v: number) => void;
  onMuted: (m: boolean) => void;
  onClose: () => void;
};

export function SettingsPanel({ open, volume, muted, onVolume, onMuted, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="wii-modal-backdrop flex items-end sm:items-center justify-center p-3 sm:p-6" onClick={onClose}>
      <div
        className="wii-modal w-full max-w-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <h2 id="settings-title" className="text-xl font-semibold tracking-tight">
            Wii Settings
          </h2>
          <button type="button" className="wii-bar-btn !px-3 !min-h-10" onClick={onClose} aria-label="Close settings">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pb-6 space-y-5">
          <div className="wii-settings-panel p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 font-semibold text-sm">
                {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                Sound
              </div>
              <button
                type="button"
                className="wii-bar-btn !min-h-9 !px-3 text-xs"
                data-active={muted ? "true" : "false"}
                onClick={() => {
                  const next = !muted;
                  setWiiMuted(next);
                  onMuted(next);
                }}
              >
                {muted ? "Unmute" : "Mute"}
              </button>
            </div>
            <label className="block text-xs font-medium text-wii-muted mb-2" htmlFor="wii-vol">
              Volume · {Math.round(volume * 100)}%
            </label>
            <input
              id="wii-vol"
              className="wii-slider"
              type="range"
              min={0}
              max={100}
              value={Math.round(volume * 100)}
              onChange={(e) => {
                const v = Number(e.target.value) / 100;
                setWiiVolume(v);
                onVolume(v);
                if (muted && v > 0) {
                  setWiiMuted(false);
                  onMuted(false);
                }
              }}
            />
          </div>

          <div className="wii-settings-panel p-4 space-y-2">
            <div className="font-semibold text-sm">Controls</div>
            <ul className="text-sm text-wii-muted space-y-1.5 leading-relaxed">
              <li>
                <span className="font-semibold text-wii-fg">Arrow keys</span> — move focus across channels
              </li>
              <li>
                <span className="font-semibold text-wii-fg">Enter</span> — open focused channel
              </li>
              <li>
                <span className="font-semibold text-wii-fg">Esc</span> — back / close
              </li>
              <li>
                <span className="font-semibold text-wii-fg">[ ]</span> — previous / next page
              </li>
            </ul>
          </div>

          <div className="wii-settings-panel p-4">
            <div className="font-semibold text-sm mb-1">About this menu</div>
            <p className="text-sm text-wii-muted leading-relaxed">
              A fan-made recreation of the classic living-room home menu look and feel — original channel art and
              layout, no console hardware required.
            </p>
          </div>

          <button type="button" className="wii-primary-btn w-full" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// re-export helpers used at boot for initial state
export { getWiiMuted, getWiiVolume };
