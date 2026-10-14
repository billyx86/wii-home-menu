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

/* ---- cross-tab sync (#17) ------------------------------------------------
 *
 * A `storage` event only ever fires in OTHER tabs (the writing tab never
 * receives its own event), so a change in one tab can re-hydrate the live
 * state of every other open tab without a reload. Everything above the fold
 * is a pure function of the event, so the decision is unit-testable without a
 * real `window`; the thin `window.addEventListener` glue is at the bottom.
 */

/** The slice of the browser `storage` event this module cares about. */
export interface StorageEventLike {
  key: string | null;
  newValue: string | null;
}

/**
 * Parse a persisted shop-state string, returning `null` for malformed input
 * (bad JSON, or a parsed value that is not a plain object). The caller falls
 * back to its current state, so a corrupt write in another tab can never
 * corrupt this one. Valid input still goes through {@link parseShopState}'s
 * clamps, so a sane-but-weird payload degrades safely.
 */
export function parseShopStateValue(value: string): ShopState | null {
  let raw: unknown;
  try {
    raw = JSON.parse(value);
  } catch {
    return null;
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return parseShopState(raw);
}

/**
 * Decide how a `storage` event from another tab affects the shop state.
 *
 * Returns `null` — the event is ignored — when:
 * - the key is not `wii.shop` (e.g. a `wii.menu` write),
 * - `newValue` is `null` (the entry was deleted in the other tab — we keep
 *   our state rather than wiping it to defaults),
 * - `newValue` equals `lastOwnWrite` (re-entrancy guard: this tab's own
 *   serialized write echoed back — browsers normally suppress this, but a
 *   re-write of an identical value must not churn state or loop),
 * - `newValue` is malformed (see {@link parseShopStateValue}).
 *
 * Otherwise returns the re-hydrated state.
 */
export function applyShopStorageEvent(
  event: StorageEventLike,
  opts?: { lastOwnWrite?: string | null },
): ShopState | null {
  if (event.key !== STORAGE_KEY) return null;
  if (event.newValue === null) return null;
  if (opts?.lastOwnWrite != null && event.newValue === opts.lastOwnWrite) return null;
  return parseShopStateValue(event.newValue);
}

/* ---- thin window.localStorage glue (browser only) ----------------------- */

/** Last value this tab wrote — the re-entrancy guard for applyShopStorageEvent. */
let lastOwnWrite: string | null = null;

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
  if (!s) return;
  try {
    const serialized = serializeShopState(state);
    s.setItem(STORAGE_KEY, serialized);
    lastOwnWrite = serialized;
  } catch {
    // Storage unavailable (private mode, quota) — state stays in memory only.
  }
}

/**
 * Re-hydrate shop state when another tab writes `wii.shop` (#17): a
 * download or top-up in one tab shows up in the others without a reload.
 * Returns an unsubscribe function; no-op when `window` is unavailable.
 */
export function subscribeShopState(listener: (state: ShopState) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (event: StorageEvent) => {
    const next = applyShopStorageEvent(event, { lastOwnWrite });
    if (next) listener(next);
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}
