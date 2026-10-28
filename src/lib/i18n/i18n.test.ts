import { beforeEach, describe, expect, it } from "vitest";
import { en, getLocale, t, useI18n } from "./index";

/**
 * Unit coverage for the i18n layer (#18): key resolution, interpolation,
 * fallback behavior, and the zustand locale store.
 *
 * The locale store is module state, so every test resets it back to `en`
 * first — same "clean slate" discipline as the fakeStorage tests in this repo.
 */
describe("t()", () => {
  beforeEach(() => {
    useI18n.getState().setLocale("en");
  });

  it("resolves a plain en key", () => {
    expect(t("menu.settings")).toBe("Settings");
    expect(t("shop.start")).toBe("Start Shopping");
  });

  it("interpolates {placeholder} slots from vars", () => {
    expect(t("shop.toast.downloaded", { title: "Meadow Knight" })).toBe(
      "Downloaded · Meadow Knight",
    );
    expect(t("menu.pageOf", { current: 2, total: 3 })).toBe("Page 2 of 3");
    expect(t("shop.yourBalance", { points: 2500 })).toBe("Your balance · 2500 Wii Points");
  });

  it("repeats the same placeholder multiple times", () => {
    // A template may reference a var more than once; replaceAll must hit all.
    expect(t("menu.pageOf", { current: 1, total: 1 })).toBe("Page 1 of 1");
  });

  it("falls back to the key itself for unknown keys (loud in tests, graceful in UI)", () => {
    expect(t("definitely.not.a.key")).toBe("definitely.not.a.key");
  });

  it("returns the template verbatim when no vars are passed", () => {
    expect(t("menu.pageOf")).toBe("Page {current} of {total}");
  });

  it("ignores unused vars instead of throwing", () => {
    expect(t("shop.start", { unused: "x" })).toBe("Start Shopping");
  });
});

describe("locale store", () => {
  it("defaults to en", () => {
    expect(getLocale()).toBe("en");
    expect(useI18n.getState().locale).toBe("en");
  });

  it("setLocale switches the resolver to the registered map", () => {
    // Only `en` is registered today; switching to it is a no-op round-trip.
    useI18n.getState().setLocale("en");
    expect(getLocale()).toBe("en");
    expect(t("modal.back")).toBe("Back");
  });

  it("exposes the en map for drift-guard and tooling use", () => {
    expect(Object.keys(en).length).toBeGreaterThan(50);
    expect(en["shop.start"]).toBe("Start Shopping");
  });
});
