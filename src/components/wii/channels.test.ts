import { describe, expect, it } from "vitest";
import { CHANNEL_PAGES, PAGE_COUNT, type ChannelDef } from "./channels";
import { en } from "../../lib/i18n/en";

const COLS = 4;
const ROWS = 3;

describe("channel grid invariants", () => {
  it("exposes exactly 3 pages (PAGE_COUNT)", () => {
    expect(PAGE_COUNT).toBe(3);
    expect(CHANNEL_PAGES).toHaveLength(PAGE_COUNT);
  });

  it("every page fills the 4x3 grid with exactly 12 slots", () => {
    for (let p = 0; p < PAGE_COUNT; p++) {
      expect(CHANNEL_PAGES[p], `page ${p} slot count`).toHaveLength(COLS * ROWS);
    }
  });

  it("channel ids are unique across all pages", () => {
    const ids = CHANNEL_PAGES.flat().map((ch: ChannelDef) => ch.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("page 1 (index 0) is fully populated — no empty slots", () => {
    for (const ch of CHANNEL_PAGES[0]) {
      expect(ch.kind).not.toBe("empty");
      expect(t_name(ch).length).toBeGreaterThan(0);
    }
  });

  it("empty slots use kind 'empty' and resolve to blank display copy", () => {
    const empties = CHANNEL_PAGES.flat().filter((ch) => ch.kind === "empty");
    expect(empties.length).toBeGreaterThan(0);
    expect(empties.length).toBeLessThan(COLS * ROWS * PAGE_COUNT); // not ALL slots
    for (const ch of empties) {
      expect(en[ch.nameKey]).toBe("");
      expect(ch.kind).toBe("empty");
    }
  });

  it("every channel's name/subtitle/description keys resolve to non-empty copy (except empty slots)", () => {
    for (const ch of CHANNEL_PAGES.flat()) {
      expect(en[ch.nameKey], `${ch.id} name`).toBeDefined();
      expect(en[ch.subtitleKey], `${ch.id} subtitle`).toBeDefined();
      expect(en[ch.descriptionKey], `${ch.id} description`).toBeDefined();
      if (ch.kind !== "empty") {
        expect(en[ch.nameKey]?.length).toBeGreaterThan(0);
        expect(en[ch.subtitleKey]?.length).toBeGreaterThan(0);
        expect(en[ch.descriptionKey]?.length).toBeGreaterThan(0);
      }
      expect(ch.accent).toMatch(/^#[0-9a-f]{6}$/i);
      expect(ch.accentSoft).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

/** Resolve a channel's display name the same way components do (via the en map). */
function t_name(ch: ChannelDef): string {
  return en[ch.nameKey] ?? ch.nameKey;
}
