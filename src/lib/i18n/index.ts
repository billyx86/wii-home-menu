/**
 * i18n layer (#18) — a tiny zustand-backed message resolver.
 *
 * `t(key, vars?)` resolves a dot-namespaced key against the active locale's
 * message map (English ships today, see `./en.ts`) and interpolates
 * `{placeholder}` slots from `vars`.
 *
 * The active locale lives in a zustand store (this repo already uses zustand
 * for app state) so:
 *   - `t()` works outside React (event handlers, toasts) via the store's
 *     non-reactive `getState()`,
 *   - components can re-render on locale changes if they ever subscribe,
 *   - adding a locale is a new map file + a registry entry here — zero
 *     component changes.
 *
 * Unknown keys fall back to the key itself: loud and grep-able in tests,
 * graceful in the UI. The drift-guard test (`drift.test.ts`) makes sure a key
 * can never go missing from the map silently.
 */
import { create } from "zustand";
import { en } from "./en";

export type MessageMap = Record<string, string>;

/** Locales with a registered message map. Add new ones in REGISTRY below. */
export type Locale = "en";

const REGISTRY: Record<Locale, MessageMap> = { en };

/** localStorage key for the persisted locale (#21). */
const STORAGE_KEY = "wii.locale";

/**
 * Hydrate the active locale from localStorage at module load, so a choice
 * made in the language picker survives a reload (#21). Mirrors the
 * `components/wii/audio.ts` pattern: unknown tags and unreadable storage
 * fall back to `en` instead of crashing boot.
 */
function loadLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw && raw in REGISTRY) return raw as Locale;
  } catch {
    // Unreadable storage (private mode etc.) — default locale.
  }
  return "en";
}

function saveLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Storage unavailable (private mode etc.) — choice stays in-memory only.
  }
}

interface I18nState {
  /** Active locale tag. */
  locale: Locale;
  /** Switch locale (language picker in Settings, #21). */
  setLocale: (locale: Locale) => void;
}

export const useI18n = create<I18nState>((set) => ({
  locale: loadLocale(),
  setLocale: (locale) => {
    saveLocale(locale);
    set({ locale });
  },
}));

/** Active locale tag, non-reactive — for imperative code paths. */
export function getLocale(): Locale {
  return useI18n.getState().locale;
}

/**
 * Resolve a message key in the active locale.
 *
 * `vars` interpolates `{name}` placeholders, e.g.
 * `t("shop.toast.downloaded", { title: "Meadow Knight" })` →
 * `"Downloaded · Meadow Knight"`. Missing keys fall back to the key itself.
 */
export function t(key: string, vars?: Record<string, string | number>): string {
  const map = REGISTRY[useI18n.getState().locale] ?? en;
  const found = map[key];
  if (found === undefined) return key;
  if (!vars) return found;
  let out = found;
  for (const [name, value] of Object.entries(vars)) {
    out = out.replaceAll(`{${name}}`, String(value));
  }
  return out;
}

export { en };
