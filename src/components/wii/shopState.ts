/**
 * Shop Channel persistence (#13).
 *
 * The Home Menu persists position/focus (`menuState.ts`) and audio
 * volume/mute (`audio.ts`), but the Shop Channel kept everything in in-memory
 * `useState` — so a purchase or a top-up was lost the moment the page reloaded.
 *
 * This mirrors the `menuState` pattern: everything here is a pure function of
 * an explicit storage object so the logic is unit-testable without a real
 * `window` (see `shopState.test.ts`), and the thin `window.localStorage` glue
 * lives at the bottom.
 *
 * We persist `{ points, owned }` so a re-download list and the balance survive
 * reloading the Shop Channel, keeping the shop consistent with the rest of the
 * menu that carefully remembers where the user was.
 */

const STORAGE_KEY = "wii.shop";
export const SHOP_STORAGE_KEY = STORAGE_KEY;

/** Starting Wii Points balance for a fresh shop. */
export const DEFAULT_SHOP_POINTS = 2500;

export interface ShopState {
  /** Wii Points balance. */
  points: number;
  /** Title ids the user has downloaded on this console. */
  owned: string[];
}

export const DEFAULT_SHOP_STATE: ShopState = {
  points: DEFAULT_SHOP_POINTS,
  owned: [],
};

/**
 * Clamp + NaN-guard a persisted balance into a sane non-negative integer.
 *
 * A corrupt/absent balance falls back to the fresh-shop default
 * ({@link DEFAULT_SHOP_POINTS}) rather than stranding the user at 0 or a
 * negative number.
 */
export function clampPoints(points: unknown, max: number = Number.MAX_SAFE_INTEGER): number {
  const n = Math.floor(Number(points));
  if (!Number.isFinite(n) || n < 0) return DEFAULT_SHOP_POINTS;
  return Math.min(n, max);
}

/**
 * Sanitize a persisted `owned` list into unique strings.
 *
 * We keep only non-empty strings and de-duplicate (first wins). Stale/unknown
 * title ids are harmless — `owned` is only ever read via `owned.includes(id)`
 * against the live catalog, so a dead id simply never matches — so we do not
 * couple this module to the catalog and drop unknown ids.
 */
export function sanitizeOwned(owned: unknown): string[] {
  if (!Array.isArray(owned)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of owned) {
    if (typeof id === "string" && id && !seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

/**
 * Coerce a persisted value into a safe {@link ShopState}.
 *
 * Invalid shapes (not an object, non-numeric points, non-array owned) fall
 * back safely so corrupt or half-written storage can never render a broken
 * shop.
 */
export function parseShopState(raw: unknown): ShopState {
  if (!raw || typeof raw !== "object") return DEFAULT_SHOP_STATE;
  const obj = raw as Record<string, unknown>;
  return {
    points: clampPoints(obj.points),
    owned: sanitizeOwned(obj.owned),
  };
}

/** Serialize a shop state for storage (stable key order). */
export function serializeShopState(state: ShopState): string {
  return JSON.stringify({
    points: state.points,
    owned: state.owned,
  });
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** Read the persisted shop state (defaults when absent or unreadable). */
export function loadShopState(storage: StorageLike): ShopState {
  let raw: unknown;
  try {
    const value = storage.getItem(STORAGE_KEY);
    if (value === null) return DEFAULT_SHOP_STATE;
    raw = JSON.parse(value);
  } catch {
    return DEFAULT_SHOP_STATE;
  }
  return parseShopState(raw);
}

/** Persist a shop state; silently no-ops when storage rejects the write. */
export function saveShopState(storage: StorageLike, state: ShopState): void {
  try {
    storage.setItem(STORAGE_KEY, serializeShopState(state));
  } catch {
    // Storage unavailable (private mode, quota) — state stays in memory only.
  }
}

/* ---- thin window.localStorage glue (browser only) ----------------------- */

function local(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getSavedShopState(): ShopState {
  const s = local();
  return s ? loadShopState(s) : DEFAULT_SHOP_STATE;
}

export function persistShopState(state: ShopState): void {
  const s = local();
  if (s) saveShopState(s, state);
}
