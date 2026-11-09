import { describe, expect, it } from "vitest";
import { de } from "./de";
import { en } from "./en";

/**
 * Locale key/placeholder parity guard (#21): the README promises a second
 * locale is a "pure data drop-in" — translate every key from `en.ts` and
 * register it. The key-level drift-guard (`drift.test.ts`) already proves
 * every key referenced in `src/` exists in the *reference* map; this guard
 * closes the other direction and the placeholder contract:
 *
 *   1. `de` and `en` carry exactly the same key set — a missing translation
 *      or an orphaned key fails the suite instead of shipping a raw-key
 *      fallback (`t()` prints unknown keys verbatim) or a half-translated
 *      UI.
 *   2. Every key's `{placeholder}` set is identical across locales —
 *      `t(key, vars)` interpolates by name, so `en` saying `{pct}` while
 *      `de` says `{proz} ` would silently leave a literal `{pct}`/`{proz}`
 *      in the UI.
 *
 * The guard floor-asserts a non-trivial key count so a regression that
 * empties a map fails loudly instead of passing vacuously.
 */

function placeholders(value: string): Set<string> {
  const out = new Set<string>();
  for (const m of value.matchAll(/\{([a-zA-Z0-9_]+)\}/g)) out.add(m[1]);
  return out;
}

function samePlaceholders(enValue: string, deValue: string): boolean {
  const a = placeholders(enValue);
  const b = placeholders(deValue);
  if (a.size !== b.size) return false;
  for (const p of a) if (!b.has(p)) return false;
  return true;
}

describe("locale parity (#21)", () => {
  it("both maps carry a non-trivial key surface", () => {
    expect(Object.keys(en).length).toBeGreaterThan(100);
    expect(Object.keys(de).length).toBeGreaterThan(100);
  });

  it("de carries every key en carries (no missing translations)", () => {
    const missing = Object.keys(en).filter((k) => !(k in de)).sort();
    expect(missing).toEqual([]);
  });

  it("de carries no keys en lacks (no orphaned translations)", () => {
    const orphans = Object.keys(de).filter((k) => !(k in en)).sort();
    expect(orphans).toEqual([]);
  });

  it("every key keeps the same {placeholder} set across locales", () => {
    const drifted = Object.keys(en)
      .filter((k) => k in de && !samePlaceholders(en[k], de[k]))
      .sort();
    expect(drifted).toEqual([]);
  });
});
