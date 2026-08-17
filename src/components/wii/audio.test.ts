import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * audio.ts hydrates its module-level defaults from localStorage at module
 * load, so each scenario stubs window/localStorage fresh, resets the module
 * registry, and re-imports. No AudioContext is needed — the setters/getters
 * under test work while ctx is null.
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

async function importAudio(localStorage: unknown) {
  vi.resetModules();
  vi.stubGlobal("window", { localStorage });
  const mod = await import("./audio");
  return mod;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("audio prefs persistence", () => {
  it("defaults to volume 0.55, unmuted, when nothing is stored", async () => {
    const a = await importAudio(fakeLocalStorage());
    expect(a.getWiiVolume()).toBe(0.55);
    expect(a.getWiiMuted()).toBe(false);
  });

  it("hydrates saved volume and mute from localStorage", async () => {
    const a = await importAudio(
      fakeLocalStorage({ "wii.audio": JSON.stringify({ volume: 0.2, muted: true }) }),
    );
    expect(a.getWiiVolume()).toBe(0.2);
    expect(a.getWiiMuted()).toBe(true);
  });

  it("clamps a corrupted out-of-range saved volume into [0, 1]", async () => {
    const a = await importAudio(fakeLocalStorage({ "wii.audio": JSON.stringify({ volume: 42 }) }));
    expect(a.getWiiVolume()).toBe(1);

    const b = await importAudio(fakeLocalStorage({ "wii.audio": JSON.stringify({ volume: -3 }) }));
    expect(b.getWiiVolume()).toBe(0);
  });

  it("falls back to defaults on corrupt JSON", async () => {
    const a = await importAudio(fakeLocalStorage({ "wii.audio": "{not json" }));
    expect(a.getWiiVolume()).toBe(0.55);
    expect(a.getWiiMuted()).toBe(false);
  });

  it("falls back to defaults on non-object JSON", async () => {
    const a = await importAudio(fakeLocalStorage({ "wii.audio": "42" }));
    expect(a.getWiiVolume()).toBe(0.55);
    expect(a.getWiiMuted()).toBe(false);
  });

  it("setWiiVolume clamps to [0, 1] and persists", async () => {
    const ls = fakeLocalStorage();
    const a = await importAudio(ls);
    a.setWiiVolume(1.7);
    expect(a.getWiiVolume()).toBe(1);
    expect(JSON.parse(ls.getItem("wii.audio")!)).toEqual({ volume: 1, muted: false });

    a.setWiiVolume(-0.5);
    expect(a.getWiiVolume()).toBe(0);
    expect(JSON.parse(ls.getItem("wii.audio")!)).toEqual({ volume: 0, muted: false });
  });

  it("setWiiMuted persists and survives a reload (re-import)", async () => {
    const ls = fakeLocalStorage();
    const a = await importAudio(ls);
    a.setWiiMuted(true);
    expect(ls.getItem("wii.audio")).toContain('"muted":true');

    const reloaded = await importAudio(ls);
    expect(reloaded.getWiiMuted()).toBe(true);
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
    const a = await importAudio(throwing);
    expect(a.getWiiVolume()).toBe(0.55);
    expect(() => a.setWiiVolume(0.3)).not.toThrow();
    expect(a.getWiiVolume()).toBe(0.3);
  });
});
