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

interface I18nState {
  /** Active locale tag. */
  locale: Locale;
  /** Switch locale (e.g. from a future language picker). */
  setLocale: (locale: Locale) => void;
}

export const useI18n = create<I18nState>((set) => ({
  locale: "en",
  setLocale: (locale) => set({ locale }),
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
