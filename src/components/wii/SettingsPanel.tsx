import { useEffect } from "react";
import { Volume2, VolumeX, X } from "lucide-react";
import { t } from "../../lib/i18n";
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
        data-testid="settings-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <h2 id="settings-title" className="text-xl font-semibold tracking-tight">
            {t("settings.title")}
          </h2>
          <button type="button" className="wii-bar-btn !px-3 !min-h-10" data-testid="settings-close" onClick={onClose} aria-label={t("settings.close")}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pb-6 space-y-5">
          <div className="wii-settings-panel p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 font-semibold text-sm">
                {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                {t("settings.sound")}
              </div>
              <button
                type="button"
                className="wii-bar-btn !min-h-9 !px-3 text-xs"
                data-testid="settings-mute-toggle"
                data-active={muted ? "true" : "false"}
                onClick={() => {
                  const next = !muted;
                  setWiiMuted(next);
                  onMuted(next);
                }}
              >
                {muted ? t("settings.unmute") : t("settings.mute")}
              </button>
            </div>
            <label className="block text-xs font-medium text-wii-muted mb-2" htmlFor="wii-vol">
              {t("settings.volume", { pct: Math.round(volume * 100) })}
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
            <div className="font-semibold text-sm">{t("settings.controls")}</div>
            <ul className="text-sm text-wii-muted space-y-1.5 leading-relaxed">
              <li>
                <span className="font-semibold text-wii-fg">{t("settings.key.arrows")}</span> —{" "}
                {t("settings.key.arrows.desc")}
              </li>
              <li>
                <span className="font-semibold text-wii-fg">{t("settings.key.enter")}</span> —{" "}
                {t("settings.key.enter.desc")}
              </li>
              <li>
                <span className="font-semibold text-wii-fg">{t("settings.key.esc")}</span> —{" "}
                {t("settings.key.esc.desc")}
              </li>
              <li>
                <span className="font-semibold text-wii-fg">{t("settings.key.brackets")}</span> —{" "}
                {t("settings.key.brackets.desc")}
              </li>
            </ul>
          </div>

          <div className="wii-settings-panel p-4">
            <div className="font-semibold text-sm mb-1">{t("settings.about")}</div>
            <p className="text-sm text-wii-muted leading-relaxed">{t("settings.aboutBody")}</p>
          </div>

          <button type="button" className="wii-primary-btn w-full" data-testid="settings-done" onClick={onClose}>
            {t("settings.done")}
          </button>
        </div>
      </div>
    </div>
  );
}

// re-export helpers used at boot for initial state
export { getWiiMuted, getWiiVolume };
