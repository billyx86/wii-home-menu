/**
 * Menu persistence (#10).
 *
 * Remembers where the user was across reloads: the current page, the focused
 * slot, and — if a channel was open — WHICH one and in which mode (info modal
 * vs. running channel screen). Closing the channel/screen records `open: null`,
 * so a reload lands the user exactly where they left off, but never resurrects
 * a channel they had already closed.
 *
 * Audio volume/mute persist in `audio.ts`; this is the menu-position twin.
 *
 * Everything here is a pure function of an explicit storage object so the
 * logic is unit-testable without a real `window` (see `menuState.test.ts`).
 * The thin `window.localStorage` glue lives at the bottom.
 */
import { CHANNEL_PAGES, PAGE_COUNT, type ChannelDef } from "./channels";

const STORAGE_KEY = "wii.menu";
export const MENU_STORAGE_KEY = STORAGE_KEY;

/** Page/slot geometry straight from the channel data (single source of truth). */
export const SLOTS_PER_PAGE = CHANNEL_PAGES[0].length;
export const TOTAL_PAGES = PAGE_COUNT;

/** A channel that was open when the page was persisted. */
export interface OpenChannel {
  /** "modal" = channel info dialog, "screen" = the channel itself is running. */
  mode: "modal" | "screen";
  channelId: string;
}

export interface MenuState {
  /** 0-based page index. */
  page: number;
  /** 0-based slot index within the page. */
  focusIndex: number;
  /** Channel open at persist time (modal or screen), or null for plain menu. */
  open: OpenChannel | null;
}

export const DEFAULT_MENU_STATE: MenuState = {
  page: 0,
  focusIndex: 0,
  open: null,
};

/** Flat map of every channel id -> ChannelDef across all pages. */
const CHANNELS_BY_ID = new Map<string, ChannelDef>();
for (const page of CHANNEL_PAGES) {
  for (const ch of page) CHANNELS_BY_ID.set(ch.id, ch);
}

/** Find a channel by id anywhere in the grid, or undefined. */
export function findChannelById(id: string): ChannelDef | undefined {
  return CHANNELS_BY_ID.get(id);
}

/** Clamp + NaN-guard a persisted page index into the valid range. */
export function clampPage(page: unknown, totalPages: number = TOTAL_PAGES): number {
  const n = Math.floor(Number(page));
  if (!Number.isFinite(n)) return 0;
  return Math.min(Math.max(0, n), Math.max(0, totalPages - 1));
}

/** Clamp + NaN-guard a persisted slot index into the valid range. */
export function clampFocusIndex(
  focusIndex: unknown,
  slotsPerPage: number = SLOTS_PER_PAGE,
): number {
  const n = Math.floor(Number(focusIndex));
  if (!Number.isFinite(n)) return 0;
  return Math.min(Math.max(0, n), Math.max(0, slotsPerPage - 1));
}

/**
 * Coerce a persisted value into a safe {@link MenuState}.
 *
 * Invalid shapes (not an object, missing/NaN fields, out-of-range numbers,
 * unknown channel ids) fall back safely so corrupt or half-written storage
 * can never strand the user off the grid or in a phantom channel.
 */
export function parseMenuState(
  raw: unknown,
  opts?: { totalPages?: number; slotsPerPage?: number },
): MenuState {
  const totalPages = opts?.totalPages ?? TOTAL_PAGES;
  const slotsPerPage = opts?.slotsPerPage ?? SLOTS_PER_PAGE;

  if (!raw || typeof raw !== "object") return DEFAULT_MENU_STATE;
  const obj = raw as Record<string, unknown>;

  const open = parseOpenChannel(obj.open);

  return {
    page: clampPage(obj.page, totalPages),
    focusIndex: clampFocusIndex(obj.focusIndex, slotsPerPage),
    open,
  };
}

function parseOpenChannel(raw: unknown): OpenChannel | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (obj.mode !== "modal" && obj.mode !== "screen") return null;
  if (typeof obj.channelId !== "string" || !obj.channelId) return null;
  if (!findChannelById(obj.channelId)) return null; // stale/unknown channel
  return { mode: obj.mode, channelId: obj.channelId };
}

/** Serialize a menu state for storage (stable key order). */
export function serializeMenuState(state: MenuState): string {
  return JSON.stringify({
    page: state.page,
    focusIndex: state.focusIndex,
    open: state.open ? { mode: state.open.mode, channelId: state.open.channelId } : null,
  });
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** Read the persisted menu state (defaults when absent or unreadable). */
export function loadMenuState(storage: StorageLike): MenuState {
  let raw: unknown;
  try {
    const value = storage.getItem(STORAGE_KEY);
    if (value === null) return DEFAULT_MENU_STATE;
    raw = JSON.parse(value);
  } catch {
    return DEFAULT_MENU_STATE;
  }
  return parseMenuState(raw);
}

/** Persist a menu state; silently no-ops when storage rejects the write. */
export function saveMenuState(storage: StorageLike, state: MenuState): void {
  try {
    storage.setItem(STORAGE_KEY, serializeMenuState(state));
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

export function getSavedMenuState(): MenuState {
  const s = local();
  return s ? loadMenuState(s) : DEFAULT_MENU_STATE;
}

export function persistMenuState(state: MenuState): void {
  const s = local();
  if (s) saveMenuState(s, state);
}
