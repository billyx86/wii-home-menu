import { describe, expect, it } from "vitest";
import { CHANNEL_PAGES, PAGE_COUNT, type ChannelDef } from "./channels";

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
      expect(ch.name.length).toBeGreaterThan(0);
    }
  });

  it("empty slots are labeled and use kind 'empty'", () => {
    const empties = CHANNEL_PAGES.flat().filter((ch) => ch.kind === "empty");
    expect(empties.length).toBeGreaterThan(0);
    expect(empties.length).toBeLessThan(COLS * ROWS * PAGE_COUNT); // not ALL slots
    for (const ch of empties) {
      expect(ch.name).toBe("");
      expect(ch.kind).toBe("empty");
    }
  });

  it("every channel has a usable name/subtitle/description and accent colors", () => {
    for (const ch of CHANNEL_PAGES.flat()) {
      expect(ch.subtitle.length).toBeGreaterThan(0);
      expect(ch.description.length).toBeGreaterThan(0);
      expect(ch.accent).toMatch(/^#[0-9a-f]{6}$/i);
      expect(ch.accentSoft).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
