import { expect, test } from "playwright/test";

/**
 * E2E coverage for the Settings panel (#22) and the language picker (#21).
 *
 * The Settings panel was the only major surface with zero Playwright
 * coverage: it carries the mute toggle, the persisted volume slider
 * (audio.ts -> `wii.audio`), and the Done button that returns focus to
 * the menu grid. #21 adds a language picker (`wii.locale` persistence)
 * to the same panel, so its assertions live here too.
 *
 * i18n convention (carried over from wii-menu.spec.ts): every selector
 * targets a `data-testid` — never the translatable UI copy — so the spec
 * stays valid in every registered locale.
 *
 * The dev server is managed by `webServer` in playwright.config.ts.
 */

const SETTINGS_OPEN = '[data-testid="settings-open"]';
const PANEL = '[data-testid="settings-panel"]';
const PANEL_CLOSE = '[data-testid="settings-close"]';
const MUTE_TOGGLE = '[data-testid="settings-mute-toggle"]';
const VOLUME_SLIDER = '[data-testid="settings-volume-slider"]';
const LOCALE_SELECT = '[data-testid="settings-locale-select"]';
const DONE = '[data-testid="settings-done"]';
const LISTBOX = '[data-testid="channel-grid"]';
const TILE = '[data-testid="wii-tile"]';
const FOCUSED_TILE = `${TILE}[data-focused="true"]`;

/**
 * Wait until the menu is fully ready (same contract as wii-menu.spec.ts):
 * a tile is highlighted AND holds DOM focus, proving the keydown listener
 * and focus-follow effect are attached.
 */
async function menuReady(page: import("playwright").Page) {
  const focused = page.locator(FOCUSED_TILE).first();
  await focused.waitFor();
  await expect(focused).toBeFocused();
}

async function gotoMenu(page: import("playwright").Page) {
  await page.goto("/");
  await menuReady(page);
}

async function readAudioPrefs(page: import("playwright").Page) {
  const raw = await page.evaluate(() => localStorage.getItem("wii.audio"));
  return raw ? (JSON.parse(raw) as { volume?: number; muted?: boolean }) : {};
}

test.describe("settings panel (#22)", () => {
  test("boots with the settings trigger in the menu bar", async ({ page }) => {
    await gotoMenu(page);
    await expect(page.locator(SETTINGS_OPEN)).toBeVisible();
    await expect(page.locator(SETTINGS_OPEN)).toHaveAttribute("data-active", "false");
    // The panel is not open yet.
    await expect(page.locator(PANEL)).toHaveCount(0);
  });

  test("opens from the menu with all sections present", async ({ page }) => {
    await gotoMenu(page);
    await page.locator(SETTINGS_OPEN).click();
    const panel = page.locator(PANEL);
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute("aria-modal", "true");
    // The trigger reflects the open state…
    await expect(page.locator(SETTINGS_OPEN)).toHaveAttribute("data-active", "true");
    // …and the panel exposes its interactive sections (structural, locale-proof):
    // sound (mute toggle + volume slider), language picker, controls list
    // (4 key rows), about, and the Done button.
    await expect(panel.locator(MUTE_TOGGLE)).toHaveCount(1);
    await expect(panel.locator(VOLUME_SLIDER)).toHaveCount(1);
    await expect(panel.locator(LOCALE_SELECT)).toHaveCount(1);
    await expect(panel.locator("ul li")).toHaveCount(4);
    await expect(panel.locator(DONE)).toHaveCount(1);
  });

  test("mutes and unmutes via the toggle, persisting state", async ({ page }) => {
    await gotoMenu(page);
    await page.locator(SETTINGS_OPEN).click();
    const toggle = page.locator(MUTE_TOGGLE);
    await expect(toggle).toHaveAttribute("data-active", "false");

    await toggle.click();
    await expect(toggle).toHaveAttribute("data-active", "true");
    const prefs = await readAudioPrefs(page);
    expect(prefs.muted).toBe(true);

    await toggle.click();
    await expect(toggle).toHaveAttribute("data-active", "false");
    const again = await readAudioPrefs(page);
    expect(again.muted).toBe(false);
  });

  test("moving the volume slider persists via the audio storage key", async ({ page }) => {
    await gotoMenu(page);
    await page.locator(SETTINGS_OPEN).click();
    const slider = page.locator(VOLUME_SLIDER);
    // Fresh context: no `wii.audio` yet -> default volume 0.55 -> slider at 55.
    await expect(slider).toHaveValue("55");

    await slider.focus();
    await page.keyboard.press("ArrowRight"); // 55 -> 56
    await expect(slider).toHaveValue("56");
    const prefs = await readAudioPrefs(page);
    expect(prefs.volume).toBeCloseTo(0.56, 5);

    // The persisted value survives a reload (audio.ts hydration).
    await page.reload();
    await menuReady(page);
    await page.locator(SETTINGS_OPEN).click();
    await expect(page.locator(VOLUME_SLIDER)).toHaveValue("56");
  });

  test("Done closes the panel and returns focus to the menu grid", async ({ page }) => {
    await gotoMenu(page);
    await page.locator(SETTINGS_OPEN).click();
    await expect(page.locator(PANEL)).toBeVisible();
    await page.locator(DONE).click();
    await expect(page.locator(PANEL)).toHaveCount(0);
    await expect(page.locator(SETTINGS_OPEN)).toHaveAttribute("data-active", "false");
    // Focus is back on the highlighted tile (focus-follow effect re-arms).
    const focused = page.locator(FOCUSED_TILE);
    await expect(focused).toHaveCount(1);
    await expect(focused).toBeFocused();
  });

  test("Escape closes the panel and returns focus to the menu grid", async ({ page }) => {
    await gotoMenu(page);
    await page.locator(SETTINGS_OPEN).click();
    await expect(page.locator(PANEL)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(PANEL)).toHaveCount(0);
    const focused = page.locator(FOCUSED_TILE);
    await expect(focused).toHaveCount(1);
    await expect(focused).toBeFocused();
  });
});

test.describe("language picker (#21)", () => {
  test("offers every registered locale, English first", async ({ page }) => {
    await gotoMenu(page);
    await page.locator(SETTINGS_OPEN).click();
    const select = page.locator(LOCALE_SELECT);
    await expect(select).toHaveCount(1);
    await expect(select.locator("option")).toHaveCount(2);
    await expect(select.locator("option").first()).toHaveAttribute("value", "en");
    await expect(select.locator("option").nth(1)).toHaveAttribute("value", "de");
    await expect(select).toHaveValue("en");
  });

  test("switching to German persists the choice to wii.locale", async ({ page }) => {
    await gotoMenu(page);
    await page.locator(SETTINGS_OPEN).click();
    await page.locator(LOCALE_SELECT).selectOption("de");
    const stored = await page.evaluate(() => localStorage.getItem("wii.locale"));
    expect(stored).toBe("de");
  });

  test("the chosen locale survives a reload", async ({ page }) => {
    await gotoMenu(page);
    await page.locator(SETTINGS_OPEN).click();
    await page.locator(LOCALE_SELECT).selectOption("de");
    await page.locator(DONE).click();
    await expect(page.locator(PANEL)).toHaveCount(0);

    await page.reload();
    await menuReady(page);
    // The menu itself is now rendered in German — the select inside the
    // re-opened panel still reports the persisted choice (locale-proof
    // assertion: value, not copy).
    await page.locator(SETTINGS_OPEN).click();
    await expect(page.locator(LOCALE_SELECT)).toHaveValue("de");
    await page.locator(DONE).click();
    const focused = page.locator(FOCUSED_TILE);
    await expect(focused).toHaveCount(1);
    await expect(focused).toBeFocused();
  });
});
