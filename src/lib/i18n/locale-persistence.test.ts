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

function makeWindow(localStorage: unknown) {
  const listeners: Record<string, Set<(payload?: unknown) => void>> = {};
  return {
    localStorage,
    addEventListener: (type: string, fn: (payload?: unknown) => void) => {
      (listeners[type] ??= new Set()).add(fn);
    },
    removeEventListener: (type: string, fn: (payload?: unknown) => void) => {
      listeners[type]?.delete(fn);
    },
    _dispatch: (type: string, payload?: unknown) => {
      for (const fn of [...(listeners[type] ?? [])]) fn(payload);
    },
  };
}

async function importI18nWithWindow(windowStub: Record<string, unknown>) {
  vi.resetModules();
  vi.stubGlobal("window", windowStub);
  return await import("./index");
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

describe("cross-tab locale sync (#30)", () => {
  it("updates in-memory locale on a sibling storage event without re-writing localStorage", async () => {
    const ls = fakeLocalStorage();
    const setItem = vi.spyOn(ls, "setItem");
    const win = makeWindow(ls);
    const mod = await importI18nWithWindow(win);

    expect(mod.getLocale()).toBe("en");

    win._dispatch("storage", { key: "wii.locale", newValue: "de" });

    expect(mod.getLocale()).toBe("de");
    expect(mod.useI18n.getState().locale).toBe("de");
    expect(setItem).not.toHaveBeenCalled();
  });

  it("ignores own writes (re-entrancy guard)", async () => {
    const ls = fakeLocalStorage();
    const win = makeWindow(ls);
    const mod = await importI18nWithWindow(win);

    const seen: string[] = [];
    const unsub = mod.subscribeLocale((locale) => seen.push(locale));

    mod.useI18n.getState().setLocale("de");
    expect(mod.getLocale()).toBe("de");

    const storeListener = vi.fn();
    const unsubStore = mod.useI18n.subscribe(storeListener);

    win._dispatch("storage", { key: "wii.locale", newValue: "de" });

    expect(seen).toEqual([]);
    expect(storeListener).not.toHaveBeenCalled();
    expect(
      mod.applyLocaleStorageEvent(
        { key: "wii.locale", newValue: "de" },
        { lastOwnWrite: "de" },
      ),
    ).toBeNull();

    unsubStore();
    unsub();
  });

  it("ignores storage events for other keys", async () => {
    const win = makeWindow(fakeLocalStorage());
    const mod = await importI18nWithWindow(win);

    const seen: string[] = [];
    const unsub = mod.subscribeLocale((locale) => seen.push(locale));

    win._dispatch("storage", { key: "wii.audio", newValue: "de" });
    win._dispatch("storage", { key: "wii.menu", newValue: "{}" });

    expect(mod.getLocale()).toBe("en");
    expect(seen).toEqual([]);

    unsub();
  });

  it("ignores malformed or unregistered values without crashing", async () => {
    const win = makeWindow(fakeLocalStorage());
    const mod = await importI18nWithWindow(win);

    const seen: string[] = [];
    const unsub = mod.subscribeLocale((locale) => seen.push(locale));

    for (const bad of ["xx", "", null, "{not valid", "toString"]) {
      expect(() =>
        win._dispatch("storage", { key: "wii.locale", newValue: bad }),
      ).not.toThrow();
    }

    expect(mod.getLocale()).toBe("en");
    expect(seen).toEqual([]);

    unsub();
  });
});
