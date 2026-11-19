import { expect, test } from "playwright/test";

/**
 * E2E coverage for dialog focus management (#25).
 *
 * ChannelModal has trapped focus since #9; #25 extends the same contract to
 * the two remaining dialogs — the SD Card dialog (WiiMenu) and the Settings
 * panel (SettingsPanel) — by wiring both to the shared `useFocusTrap` hook:
 *
 *   - opening a dialog moves DOM focus to its first control
 *   - Tab / Shift+Tab cycle inside the dialog and cannot escape it
 *   - Escape closes the dialog; the trap restores focus to the opener, and
 *     the menu's own focus-follow policy (#9) then puts focus back on the
 *     highlighted tile, which is the app's established "focus returns to
 *     the menu" assertion (see wii-menu.spec.ts, channel modal #9)
 *   - the channel grid exposes no tab stops while a dialog is open
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
const SD_OPEN = '[data-testid="sd-card-open"]';
const SD_DIALOG = '[data-testid="sd-card-dialog"]';
const SD_CLOSE = '[data-testid="sd-card-close"]';
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

test.describe("SD card dialog focus trap (#25)", () => {
  test("opening the dialog moves focus to its close button", async ({ page }) => {
    await gotoMenu(page);
    await page.locator(SD_OPEN).click();
    await expect(page.locator(SD_DIALOG)).toBeVisible();
    await expect(page.locator(SD_DIALOG)).toHaveAttribute("aria-modal", "true");
    // Single tabbable control in the dialog: it must hold focus on open.
    await expect(page.locator(SD_CLOSE)).toBeFocused();
  });

  test("Tab and Shift+Tab cannot escape the single-control dialog", async ({ page }) => {
    await gotoMenu(page);
    await page.locator(SD_OPEN).click();
    await expect(page.locator(SD_CLOSE)).toBeFocused();
    // The grid behind the dialog exposes no tab stops while it is open.
    await expect(page.locator(`${TILE}[tabindex="0"]`)).toHaveCount(0);
    // Repeated Tab presses wrap back onto the sole control — no escape.
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press("Tab");
      await expect(page.locator(SD_CLOSE)).toBeFocused();
    }
    await page.keyboard.press("Shift+Tab");
    await expect(page.locator(SD_CLOSE)).toBeFocused();
  });

  test("Escape closes the dialog and returns focus to the menu", async ({ page }) => {
    await gotoMenu(page);
    await page.locator(SD_OPEN).click();
    await expect(page.locator(SD_DIALOG)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(SD_DIALOG)).toHaveCount(0);
    await expect(page.locator(SD_OPEN)).toHaveAttribute("data-active", "false");
    // The menu is the active surface again: the highlighted tile holds
    // DOM focus (the focus-follow policy, #9, re-arms on close).
    const focused = page.locator(FOCUSED_TILE);
    await expect(focused).toHaveCount(1);
    await expect(focused).toBeFocused();
  });
});

test.describe("settings panel focus trap (#25)", () => {
  test("opening the panel moves focus to its close button", async ({ page }) => {
    await gotoMenu(page);
    await page.locator(SETTINGS_OPEN).click();
    await expect(page.locator(PANEL)).toBeVisible();
    // First tabbable control in DOM order: the header close (X) button.
    await expect(page.locator(PANEL_CLOSE)).toBeFocused();
  });

  test("Tab cycles through the panel and wraps back to the start", async ({ page }) => {
    await gotoMenu(page);
    await page.locator(SETTINGS_OPEN).click();
    await expect(page.locator(PANEL_CLOSE)).toBeFocused();
    // Five tabbable controls in DOM order: close (X), mute toggle, volume
    // slider, locale select, Done. Five Tabs from the first land back on it.
    for (let i = 0; i < 5; i++) await page.keyboard.press("Tab");
    await expect(page.locator(PANEL_CLOSE)).toBeFocused();
  });

  test("Escape closes the panel and returns focus to the menu", async ({ page }) => {
    await gotoMenu(page);
    await page.locator(SETTINGS_OPEN).click();
    await expect(page.locator(PANEL)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(PANEL)).toHaveCount(0);
    await expect(page.locator(SETTINGS_OPEN)).toHaveAttribute("data-active", "false");
    const focused = page.locator(FOCUSED_TILE);
    await expect(focused).toHaveCount(1);
    await expect(focused).toBeFocused();
  });
});
