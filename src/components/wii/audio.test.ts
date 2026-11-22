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

/**
 * AudioContext mock that simulates the browser autoplay policy (issue #24):
 * a context created without user activation starts "suspended" and
 * `resume()` always resolves, but the state only actually flips to
 * "running" once `activation.granted` is true (i.e. the call happened
 * inside — or after — a real user gesture).
 */
function makeAutoplayPolicyCtx() {
  const activation = { granted: false };
  const created = { oscillators: 0, gains: 0 as number };
  const gainNodes: Array<{ gain: { value: number } }> = [];
  let state: "suspended" | "running" = "suspended";
  const stateHandlers: Array<() => void> = [];
  const ctx = {
    get state() {
      return state;
    },
    currentTime: 0,
    destination: {},
    createGain() {
      created.gains++;
      const node = {
        gain: { value: 0, setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
        connect: () => {},
      };
      gainNodes.push(node as { gain: { value: number } });
      return node;
    },
    createOscillator() {
      created.oscillators++;
      return {
        type: "",
        frequency: { setValueAtTime: () => {} },
        connect: () => {},
        start: () => {},
        stop: () => {},
      };
    },
    addEventListener(type: string, fn: () => void) {
      if (type === "statechange") stateHandlers.push(fn);
    },
    removeEventListener(type: string, fn: () => void) {
      if (type === "statechange") {
        const i = stateHandlers.indexOf(fn);
        if (i >= 0) stateHandlers.splice(i, 1);
      }
    },
    resume() {
      if (activation.granted) {
        state = "running";
        for (const h of [...stateHandlers]) h();
      }
      // Autoplay policy: without activation the promise resolves but the
      // context stays suspended.
      return Promise.resolve();
    },
  };
  // `new AC()` — a classic function returning an object uses it as the
  // constructed value (arrow functions cannot be constructed).
  const Ctx = function () {
    return ctx;
  };
  return { Ctx, activation, created, ctx, gainNodes };
}

function makeWindow(localStorage: unknown, AudioContext: unknown) {
  const listeners: Record<string, Set<(payload?: unknown) => void>> = {};
  return {
    localStorage,
    AudioContext,
    addEventListener: (type: string, fn: () => void) => {
      (listeners[type] ??= new Set()).add(fn);
    },
    removeEventListener: (type: string, fn: () => void) => {
      listeners[type]?.delete(fn);
    },
    // test helpers
    _dispatch: (type: string, payload?: unknown) => {
      for (const fn of [...(listeners[type] ?? [])]) fn(payload as never);
    },
    _has: (type: string) => (listeners[type]?.size ?? 0) > 0,
    _count: (type: string) => (listeners[type]?.size ?? 0),
  };
}

async function importAudioWithWindow(windowStub: Record<string, unknown>) {
  vi.resetModules();
  vi.stubGlobal("window", windowStub);
  return await import("./audio");
}

const tick = () => new Promise((r) => setTimeout(r, 0));

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

describe("suspended AudioContext (autoplay policy, issue #24)", () => {
  it("playBoot without user activation schedules nothing and arms a one-shot flush", async () => {
    const { Ctx, created } = makeAutoplayPolicyCtx();
    const win = makeWindow(fakeLocalStorage(), Ctx) as ReturnType<typeof makeWindow>;
    const a = await importAudioWithWindow(win);

    a.playBoot();

    expect(created.oscillators).toBe(0);
    expect(win._has("pointerdown")).toBe(true);
    expect(win._has("keydown")).toBe(true);
  });

  it("first pointerdown activates the context: the boot jingle plays exactly once, listeners are removed", async () => {
    const { Ctx, activation, created } = makeAutoplayPolicyCtx();
    const win = makeWindow(fakeLocalStorage(), Ctx) as ReturnType<typeof makeWindow>;
    const a = await importAudioWithWindow(win);

    a.playBoot();
    expect(created.oscillators).toBe(0);

    activation.granted = true;
    win._dispatch("pointerdown");
    await tick();

    expect(created.oscillators).toBe(4);
    expect(win._has("pointerdown")).toBe(false);
    expect(win._has("keydown")).toBe(false);

    // A later gesture must not replay the jingle.
    win._dispatch("pointerdown");
    await tick();
    expect(created.oscillators).toBe(4);
  });

  it("first keydown also activates the deferred jingle, exactly once", async () => {
    const { Ctx, activation, created } = makeAutoplayPolicyCtx();
    const win = makeWindow(fakeLocalStorage(), Ctx) as ReturnType<typeof makeWindow>;
    const a = await importAudioWithWindow(win);

    a.playBoot();
    expect(created.oscillators).toBe(0);

    activation.granted = true;
    win._dispatch("keydown");
    await tick();

    expect(created.oscillators).toBe(4);
    expect(win._has("pointerdown")).toBe(false);
    expect(win._has("keydown")).toBe(false);
  });

  it("a context that turns running without a gesture (statechange) plays the jingle once; a later gesture does not replay it", async () => {
    const { Ctx, activation, created, ctx } = makeAutoplayPolicyCtx();
    const win = makeWindow(fakeLocalStorage(), Ctx) as ReturnType<typeof makeWindow>;
    const a = await importAudioWithWindow(win);

    a.playBoot();
    expect(created.oscillators).toBe(0);

    // The browser grants audio on its own (e.g. autoplay-allowed profile):
    // resume settles and statechange fires with no gesture at all.
    activation.granted = true;
    void ctx.resume();
    await tick();

    expect(created.oscillators).toBe(4);
    expect(win._has("pointerdown")).toBe(false);
    expect(win._has("keydown")).toBe(false);

    win._dispatch("pointerdown");
    await tick();
    expect(created.oscillators).toBe(4);
  });

  it("playHover before activation schedules nothing and does not arm a flush", async () => {
    const { Ctx, created } = makeAutoplayPolicyCtx();
    const win = makeWindow(fakeLocalStorage(), Ctx) as ReturnType<typeof makeWindow>;
    const a = await importAudioWithWindow(win);

    a.playHover();
    await tick();

    expect(created.oscillators).toBe(0);
    expect(win._has("pointerdown")).toBe(false);
    expect(win._has("keydown")).toBe(false);
  });

  it("repeated playBoot calls while suspended arm a single flush", async () => {
    const { Ctx, activation, created } = makeAutoplayPolicyCtx();
    const win = makeWindow(fakeLocalStorage(), Ctx) as ReturnType<typeof makeWindow>;
    const a = await importAudioWithWindow(win);

    a.playBoot();
    a.playBoot();
    expect(win._count("pointerdown")).toBe(1);
    expect(win._count("keydown")).toBe(1);

    activation.granted = true;
    win._dispatch("pointerdown");
    await tick();

    expect(created.oscillators).toBe(4);
  });

  it("a tone fired inside the activating gesture waits for the resume and still sounds", async () => {
    const { Ctx, activation, created } = makeAutoplayPolicyCtx();
    const win = makeWindow(fakeLocalStorage(), Ctx) as ReturnType<typeof makeWindow>;
    const a = await importAudioWithWindow(win);

    a.playBoot(); // 400 ms timer, no gesture yet
    expect(created.oscillators).toBe(0);

    // The user clicks a channel: pointerdown (capture) fires first, and the
    // click handler's playSelect() runs in the same task — before the
    // context's state has flipped to "running".
    activation.granted = true;
    win._dispatch("pointerdown");
    a.playSelect(); // 2 tones
    await tick();

    expect(created.oscillators).toBe(6);
  });
});

describe("cross-tab sync (storage event, issue #26)", () => {
  const AUDIO_KEY = "wii.audio";

  it("parseAudioPrefsValue normalizes a valid payload into clamped state", async () => {
    const a = await importAudio(fakeLocalStorage());
    expect(a.parseAudioPrefsValue(JSON.stringify({ volume: 0.2, muted: true }))).toEqual({
      volume: 0.2,
      muted: true,
    });
    // Out-of-range / missing volume degrades to the clamped / default value.
    expect(a.parseAudioPrefsValue(JSON.stringify({ volume: 42 }))).toEqual({
      volume: 1,
      muted: false,
    });
    expect(a.parseAudioPrefsValue(JSON.stringify({ muted: true }))).toEqual({
      volume: 0.55,
      muted: true,
    });
  });

  it("parseAudioPrefsValue returns null for malformed or wrong-shape input", async () => {
    const a = await importAudio(fakeLocalStorage());
    expect(a.parseAudioPrefsValue("{not json")).toBeNull();
    expect(a.parseAudioPrefsValue("42")).toBeNull();
    expect(a.parseAudioPrefsValue(JSON.stringify([1, 2, 3]))).toBeNull();
  });

  it("applyAudioStorageEvent ignores other keys, clears, and this tab's own echo", async () => {
    const a = await importAudio(fakeLocalStorage());
    // Another store's write (e.g. wii.menu / wii.shop) must not touch audio.
    expect(
      a.applyAudioStorageEvent({ key: "wii.menu", newValue: JSON.stringify({ volume: 0.1 }) }),
    ).toBeNull();
    // Another tab deleted the entry — keep our prefs, don't snap to defaults.
    expect(a.applyAudioStorageEvent({ key: AUDIO_KEY, newValue: null })).toBeNull();
    // Re-entrancy guard: our own serialized write echoed back is skipped.
    expect(
      a.applyAudioStorageEvent(
        { key: AUDIO_KEY, newValue: JSON.stringify({ volume: 0.3, muted: false }) },
        { lastOwnWrite: JSON.stringify({ volume: 0.3, muted: false }) },
      ),
    ).toBeNull();
    // A genuine foreign write resolves to clamped state.
    expect(a.applyAudioStorageEvent({ key: AUDIO_KEY, newValue: JSON.stringify({ volume: 0.7 }) })).toEqual({
      volume: 0.7,
      muted: false,
    });
    // Malformed foreign write is skipped, never corrupting this tab.
    expect(a.applyAudioStorageEvent({ key: AUDIO_KEY, newValue: "{nope" })).toBeNull();
  });

  it("subscribeAudioPrefs re-hydrates module state + masterGain from another tab's write", async () => {
    const { Ctx, gainNodes } = makeAutoplayPolicyCtx();
    const win = makeWindow(fakeLocalStorage(), Ctx) as ReturnType<typeof makeWindow>;
    const a = await importAudioWithWindow(win);

    // Create the context + master gain (granted, so it runs and the tone lands).
    a.playHover();
    await tick();
    expect(gainNodes.length).toBe(1);
    expect(gainNodes[0].gain.value).toBeCloseTo(0.55, 5);

    const seen: Array<{ volume: number; muted: boolean }> = [];
    const unsub = a.subscribeAudioPrefs((s) => seen.push(s));

    // Tab A turns the volume down and mutes: the storage event arrives here.
    win._dispatch("storage", { key: AUDIO_KEY, newValue: JSON.stringify({ volume: 0.2, muted: true }) });

    expect(seen).toEqual([{ volume: 0.2, muted: true }]);
    expect(a.getWiiVolume()).toBe(0.2);
    expect(a.getWiiMuted()).toBe(true);
    // Live audio follows the sibling tab immediately (muted -> gain 0).
    expect(gainNodes[0].gain.value).toBe(0);

    // Unsubscribing stops further updates.
    unsub();
    win._dispatch("storage", { key: AUDIO_KEY, newValue: JSON.stringify({ volume: 0.9, muted: false }) });
    expect(seen).toEqual([{ volume: 0.2, muted: true }]);
    expect(a.getWiiVolume()).toBe(0.2);
  });

  it("subscribeAudioPrefs ignores other keys and this tab's own echoed write", async () => {
    const { Ctx, gainNodes } = makeAutoplayPolicyCtx();
    const win = makeWindow(fakeLocalStorage(), Ctx) as ReturnType<typeof makeWindow>;
    const a = await importAudioWithWindow(win);
    a.playHover();
    await tick();

    let seen = 0;
    a.subscribeAudioPrefs(() => seen++);

    // wii.menu write from the same tab — must be ignored (wrong key).
    win._dispatch("storage", { key: "wii.menu", newValue: "{}" });
    expect(seen).toBe(0);

    // This tab's own write, then that same serialized value arriving back as
    // a storage event — the re-entrancy guard must skip it (no double-apply).
    a.setWiiVolume(0.3);
    const own = JSON.stringify({ volume: 0.3, muted: false });
    expect(a.getWiiVolume()).toBe(0.3);
    win._dispatch("storage", { key: "wii.audio", newValue: own });
    expect(seen).toBe(0);
    expect(gainNodes[0].gain.value).toBeCloseTo(0.3, 5);
  });

  it("savePrefs records lastOwnWrite so an identical foreign write is not re-applied", async () => {
    const ls = fakeLocalStorage();
    const a = await importAudioWithWindow(makeWindow(ls, makeAutoplayPolicyCtx().Ctx) as ReturnType<typeof makeWindow>);
    a.setWiiVolume(0.4);
    // The serialized form now saved is what lastOwnWrite guards against.
    const own = ls.getItem(AUDIO_KEY);
    expect(a.applyAudioStorageEvent({ key: AUDIO_KEY, newValue: own }, { lastOwnWrite: own })).toBeNull();
  });
});
