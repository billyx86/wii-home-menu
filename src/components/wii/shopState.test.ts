import { beforeEach, describe, expect, it } from "vitest";
import {
  clampPoints,
  DEFAULT_SHOP_POINTS,
  DEFAULT_SHOP_STATE,
  loadShopState,
  parseShopState,
  sanitizeOwned,
  saveShopState,
  SHOP_STORAGE_KEY,
  type StorageLike,
} from "./shopState";

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

describe("clampPoints", () => {
  it("clamps negative/NaN to the fresh-shop default", () => {
    expect(clampPoints(-5)).toBe(DEFAULT_SHOP_POINTS);
    expect(clampPoints(NaN)).toBe(DEFAULT_SHOP_POINTS);
    expect(clampPoints(undefined)).toBe(DEFAULT_SHOP_POINTS);
    expect(clampPoints("not-a-number")).toBe(DEFAULT_SHOP_POINTS);
  });

  it("keeps a valid balance and floors fractional values", () => {
    expect(clampPoints(1234)).toBe(1234);
    expect(clampPoints(0)).toBe(0);
    expect(clampPoints("2500")).toBe(2500);
    expect(clampPoints(1500.9)).toBe(1500);
  });

  it("caps at the provided max", () => {
    expect(clampPoints(10_000, 5_000)).toBe(5_000);
    expect(clampPoints(1_000, 5_000)).toBe(1_000);
  });
});

describe("sanitizeOwned", () => {
  it("returns [] for non-array input", () => {
    for (const bad of [null, undefined, 42, "vc-arcade", {}]) {
      expect(sanitizeOwned(bad)).toEqual([]);
    }
  });

  it("keeps only non-empty strings and de-duplicates (first wins)", () => {
    expect(
      sanitizeOwned(["vc-arcade", "vc-arcade", "", "ww-garden", null, 7, "vc-tune"]),
    ).toEqual(["vc-arcade", "ww-garden", "vc-tune"]);
  });

  it("preserves order for distinct ids", () => {
    expect(sanitizeOwned(["a", "b", "c"])).toEqual(["a", "b", "c"]);
  });
});

describe("parseShopState", () => {
  it("returns defaults for null/undefined/non-object input", () => {
    for (const bad of [null, undefined, 42, "wii", []]) {
      expect(parseShopState(bad)).toEqual(DEFAULT_SHOP_STATE);
    }
  });

  it("round-trips a valid state", () => {
    const state = { points: 1750, owned: ["vc-arcade", "ww-garden"] };
    expect(parseShopState(state)).toEqual(state);
  });

  it("falls back a corrupt balance to the default but keeps owned", () => {
    const parsed = parseShopState({ points: -1, owned: ["vc-castle"] });
    expect(parsed.points).toBe(DEFAULT_SHOP_POINTS);
    expect(parsed.owned).toEqual(["vc-castle"]);
  });

  it("keeps the balance but sanitizes a malformed owned list", () => {
    const parsed = parseShopState({ points: 900, owned: ["a", "a", 5, "b"] });
    expect(parsed.points).toBe(900);
    expect(parsed.owned).toEqual(["a", "b"]);
  });
});

describe("loadShopState / saveShopState (StorageLike)", () => {
  let storage: ReturnType<typeof fakeStorage>;

  beforeEach(() => {
    storage = fakeStorage();
  });

  it("defaults when nothing is stored", () => {
    expect(loadShopState(storage)).toEqual(DEFAULT_SHOP_STATE);
  });

  it("round-trips through storage", () => {
    const state = { points: 1500, owned: ["vc-arcade", "ww-sketch"] };
    saveShopState(storage, state);
    expect(loadShopState(storage)).toEqual(state);
    expect(storage.store[SHOP_STORAGE_KEY]).toBeDefined();
  });

  it("recovers from corrupted JSON", () => {
    storage.store[SHOP_STORAGE_KEY] = "{not json!!";
    expect(loadShopState(storage)).toEqual(DEFAULT_SHOP_STATE);
  });

  it("recovers from a JSON array (valid JSON, wrong shape)", () => {
    storage.store[SHOP_STORAGE_KEY] = "[1,2,3]";
    expect(loadShopState(storage)).toEqual(DEFAULT_SHOP_STATE);
  });

  it("does not throw when setItem rejects (quota/private mode)", () => {
    const rejecting: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    };
    expect(() => saveShopState(rejecting, { points: 1, owned: [] })).not.toThrow();
  });
});
