import { beforeEach, describe, expect, it } from "vitest";
import {
  clampFocusIndex,
  clampPage,
  DEFAULT_MENU_STATE,
  findChannelById,
  loadMenuState,
  MENU_STORAGE_KEY,
  parseMenuState,
  saveMenuState,
  SLOTS_PER_PAGE,
  TOTAL_PAGES,
  type StorageLike,
} from "./menuState";

/** Minimal in-memory Storage double (vitest env is node — no real localStorage). */
function fakeStorage(initial: Record<string, string> = {}): StorageLike & {
  store: Record<string, string>;
} {
  const store: Record<string, string> = { ...initial };
  return {
    store,
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => {
      store[k] = String(v);
    },
  };
}

describe("menuState geometry", () => {
  it("derives slot/page counts from the channel data", () => {
    expect(SLOTS_PER_PAGE).toBe(12);
    expect(TOTAL_PAGES).toBe(3);
  });

  it("knows real and empty slots by id", () => {
    expect(findChannelById("disc")).toBeDefined();
    expect(findChannelById("p2-1")).toBeDefined();
    expect(findChannelById("p3-e3")).toBeDefined();
    expect(findChannelById("not-a-channel")).toBeUndefined();
  });
});

describe("clamp helpers", () => {
  it("clamps pages into range and maps NaN to 0", () => {
    expect(clampPage(-1)).toBe(0);
    expect(clampPage(99)).toBe(2);
    expect(clampPage("2")).toBe(2);
    expect(clampPage("3")).toBe(2); // "3" is beyond the last page (index 2)
    expect(clampPage(NaN)).toBe(0);
    expect(clampPage(undefined)).toBe(0);
    expect(clampPage(0, 4)).toBe(0);
  });

  it("clamps focus indices into range and maps NaN to 0", () => {
    expect(clampFocusIndex(-5)).toBe(0);
    expect(clampFocusIndex(99)).toBe(SLOTS_PER_PAGE - 1);
    expect(clampFocusIndex("7")).toBe(7);
    expect(clampFocusIndex(1.9)).toBe(1);
    expect(clampFocusIndex(undefined)).toBe(0);
  });
});

describe("parseMenuState", () => {
  it("returns defaults for null/undefined/non-object input", () => {
    for (const bad of [null, undefined, 42, "wii", []]) {
      expect(parseMenuState(bad)).toEqual(DEFAULT_MENU_STATE);
    }
  });

  it("round-trips a valid state", () => {
    const state = {
      page: 2,
      focusIndex: 7,
      open: { mode: "modal" as const, channelId: "p2-1" },
    };
    expect(parseMenuState(state)).toEqual(state);
  });

  it("clamps out-of-range values instead of dropping them", () => {
    const parsed = parseMenuState({ page: 99, focusIndex: -3, open: null });
    expect(parsed.page).toBe(TOTAL_PAGES - 1);
    expect(parsed.focusIndex).toBe(0);
  });

  it("drops unknown channel ids but keeps page/focus", () => {
    const parsed = parseMenuState({
      page: 1,
      focusIndex: 3,
      open: { mode: "modal", channelId: "ghost-channel" },
    });
    expect(parsed.open).toBeNull();
    expect(parsed.page).toBe(1);
    expect(parsed.focusIndex).toBe(3);
  });

  it("drops malformed open shapes (bad mode, missing id, non-string id)", () => {
    for (const open of [
      { mode: "nope", channelId: "p1-1" },
      { mode: "modal" },
      { mode: "modal", channelId: 7 },
      { channelId: "p1-1" },
      "p1-1",
    ]) {
      expect(parseMenuState({ page: 0, focusIndex: 0, open }).open).toBeNull();
    }
  });
});

describe("loadMenuState / saveMenuState (StorageLike)", () => {
  let storage: ReturnType<typeof fakeStorage>;

  beforeEach(() => {
    storage = fakeStorage();
  });

  it("defaults when nothing is stored", () => {
    expect(loadMenuState(storage)).toEqual(DEFAULT_MENU_STATE);
  });

  it("round-trips through storage", () => {
    const state = { page: 2, focusIndex: 11, open: null };
    saveMenuState(storage, state);
    expect(loadMenuState(storage)).toEqual(state);
    expect(storage.store[MENU_STORAGE_KEY]).toBeDefined();
  });

  it("recovers from corrupted JSON", () => {
    storage.store[MENU_STORAGE_KEY] = "{not json!!";
    expect(loadMenuState(storage)).toEqual(DEFAULT_MENU_STATE);
  });

  it("recovers from a JSON array (valid JSON, wrong shape)", () => {
    storage.store[MENU_STORAGE_KEY] = "[1,2,3]";
    expect(loadMenuState(storage)).toEqual(DEFAULT_MENU_STATE);
  });

  it("does not throw when setItem rejects (quota/private mode)", () => {
    const rejecting: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    };
    expect(() => saveMenuState(rejecting, { page: 1, focusIndex: 1, open: null })).not.toThrow();
  });

  it("does not throw when getItem throws (storage disabled)", () => {
    const throwing: StorageLike = {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => undefined,
    };
    expect(() => loadMenuState(throwing)).not.toThrow();
    expect(loadMenuState(throwing)).toEqual(DEFAULT_MENU_STATE);
  });
});
