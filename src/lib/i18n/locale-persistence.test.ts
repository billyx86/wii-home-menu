import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Locale persistence (#21): the i18n store hydrates the active locale from
 * `wii.locale` in localStorage at module load and writes on every setLocale —
 * the same pattern as `components/wii/audio.ts` for volume/mute, including
 * the throws-in-private-mode guard.
 *
 * `src/lib/i18n/index.ts` is module state (zustand store created at import),
 * so each scenario stubs window/localStorage fresh, resets the module
 * registry, and re-imports — the repo's existing reload-survival pattern
 * (see `components/wii/audio.test.ts`).
 */

function fakeLocalStorage(data: Record<string, string> = {}) {
  const store = new Map(Object.entries(data));
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  };
}

async function importI18n(localStorage: unknown) {
  vi.resetModules();
  vi.stubGlobal("window", { localStorage });
  const mod = await import("./index");
  return mod;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("locale persistence (#21)", () => {
  it("defaults to en when nothing is stored", async () => {
    const mod = await importI18n(fakeLocalStorage());
    expect(mod.getLocale()).toBe("en");
  });

  it("hydrates a stored, registered locale", async () => {
    const mod = await importI18n(fakeLocalStorage({ "wii.locale": "en" }));
    expect(mod.getLocale()).toBe("en");
  });

  it("falls back to en for a stored locale tag that is not registered", async () => {
    const mod = await importI18n(fakeLocalStorage({ "wii.locale": "xx" }));
    expect(mod.getLocale()).toBe("en");
  });

  it("setLocale writes the choice to localStorage", async () => {
    const ls = fakeLocalStorage();
    const mod = await importI18n(ls);
    mod.useI18n.getState().setLocale("en");
    expect(ls.getItem("wii.locale")).toBe("en");
  });

  it("a setLocale choice survives a simulated reload (re-import)", async () => {
    const ls = fakeLocalStorage();
    const mod = await importI18n(ls);
    mod.useI18n.getState().setLocale("en");
    expect(ls.getItem("wii.locale")).toBe("en");

    const reloaded = await importI18n(ls);
    expect(reloaded.getLocale()).toBe("en");
  });

  it("survives a localStorage that throws (private mode)", async () => {
    const throwing = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
    };
    const mod = await importI18n(throwing);
    expect(mod.getLocale()).toBe("en");
    expect(() => mod.useI18n.getState().setLocale("en")).not.toThrow();
  });
});
