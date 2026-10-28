import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { en } from "./en";

/**
 * i18n drift-guard (#18, acceptance 3): prove that a second locale can drop
 * in as a pure data file. Every i18n key *referenced anywhere in `src/`* must
 * exist in the `en` map — otherwise `t()` would fall back to printing the raw
 * key in the UI, which is how a missing translation silently ships.
 *
 * Two reference shapes are scanned (both are how components actually pull a
 * key, and neither is a bare `t("…")` literal):
 *
 *   1. **Key-like string literals** — any `"…"` / `'…'` literal whose
 *      top-level namespace matches an `en` namespace (e.g. `channel.`,
 *      `shop.`) and has at least one dot. This catches `t("menu.settings")`
 *      *and* the `nameKey: "channel.mii.name"` / `titleKey: "shop.cat.…"`
 *      fields in the `channels.ts` + `ShopChannel` data arrays.
 *   2. **`titleKey(id, field)` builders** — `ShopChannel` assembles
 *      `shop.title.<id>.<field>` at runtime, so those keys never appear as
 *      literals; we reconstruct them from the call sites.
 *
 * The guard is one-directional (referenced ⊆ map) and floor-asserts that it
 * actually parsed a non-trivial number of keys, so a regex regression that
 * silently matches nothing fails loudly instead of passing vacuously.
 */

// `src/` is three levels up from this file (src/lib/i18n/drift.test.ts).
const SRC_ROOT = fileURLToPath(new URL("../../..", import.meta.url));

/** Recursively collect .ts/.tsx source files, skipping the i18n layer itself
 * (the map + resolver are the *source* of keys, not consumers) and tests. */
function collectSourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === "i18n") continue;
      collectSourceFiles(full, out);
    } else if (
      (name.endsWith(".ts") || name.endsWith(".tsx")) &&
      !name.endsWith(".test.ts") &&
      !name.endsWith(".test.tsx")
    ) {
      out.push(full);
    }
  }
  return out;
}

/** Namespaces present in the en map, e.g. channel/menu/modal/settings/shop/tile. */
const NAMESPACES = [...new Set(Object.keys(en).map((k) => k.split(".")[0]))].sort();

// A quoted literal that is a dotted key in a known namespace:
//   "shop.toast.downloaded", 'channel.mii.name', "tile.emptySlot", …
const LITERAL_RE = new RegExp(
  `["']((?:${NAMESPACES.join("|")})[A-Za-z0-9_]*(?:\\.[A-Za-z0-9_]+)+)["']`,
  "g",
);

// titleKey("vc-meadow", "name") → shop.title.vc-meadow.name
const TITLE_KEY_RE = /\btitleKey\(\s*["']([a-z0-9-]+)["']\s*,\s*["']([a-z][a-z0-9]*)["']/g;

const enKeys = new Set(Object.keys(en));
const files = collectSourceFiles(SRC_ROOT);

const literalKeys = new Set<string>();
const titleKeys = new Set<string>();

for (const file of files) {
  const text = readFileSync(file, "utf8");
  for (const m of text.matchAll(LITERAL_RE)) literalKeys.add(m[1]);
  for (const m of text.matchAll(TITLE_KEY_RE)) titleKeys.add(`shop.title.${m[1]}.${m[2]}`);
}

const referenced = new Set([...literalKeys, ...titleKeys]);

describe("i18n drift-guard", () => {
  it("scanned a non-trivial surface of the codebase", () => {
    expect(files.length).toBeGreaterThan(20);
    expect(NAMESPACES.length).toBeGreaterThan(3);
    expect(literalKeys.size).toBeGreaterThan(80);
    expect(titleKeys.size).toBeGreaterThan(50);
  });

  it("every referenced i18n key exists in the en map", () => {
    const missing = [...referenced].filter((k) => !enKeys.has(k)).sort();
    expect(missing).toEqual([]);
  });

  it("every titleKey-built shop.title key exists in the en map", () => {
    const missing = [...titleKeys].filter((k) => !enKeys.has(k)).sort();
    expect(missing).toEqual([]);
  });

  it("the reference surface is substantial (guard did not match vacuously)", () => {
    expect(referenced.size).toBeGreaterThan(150);
    expect(referenced.size).toBeLessThanOrEqual(enKeys.size);
  });
});
