import { expect, test } from "playwright/test";

/**
 * E2E coverage for the Wii Menu (#8).
 *
 * Covers: boot + grid semantics, keyboard navigation, channel modal
 * (open/close/focus trap/focus restore — #9) and localStorage menu
 * persistence across reloads (#10).
 *
 * The dev server is managed by `webServer` in playwright.config.ts.
 */

const LISTBOX = '[role="listbox"][aria-label="Channel grid"]';
const TILE = '[role="option"]';
const FOCUSED_TILE = `${TILE}[data-focused="true"]`;

/**
 * Wait until the menu is fully ready: a tile is highlighted AND holds DOM
 * focus. The keydown listener and the focus-follow effect attach in the same
 * commit, so "the tile holds DOM focus" proves the menu is ready to receive
 * keyboard input (avoids racing React's passive effects right after paint).
 */
async function menuReady(page: import("playwright").Page) {
  const focused = page.locator(FOCUSED_TILE).first();
  await focused.waitFor();
  await expect(focused).toBeFocused();
}

/** Navigate to the menu and wait until it is ready. */
async function gotoMenu(page: import("playwright").Page) {
  await page.goto("/");
  await menuReady(page);
}

test.describe("menu boot & semantics", () => {
  test("boots with a listbox of 12 channel options; first tile is focused", async ({ page }) => {
    await gotoMenu(page);
    const listbox = page.locator(LISTBOX);
    await expect(listbox).toBeVisible();
    await expect(listbox.locator(TILE)).toHaveCount(12);
    const focused = page.locator(FOCUSED_TILE);
    await expect(focused).toHaveCount(1);
    await expect(focused).toHaveAttribute("aria-selected", "true");
    // A11y (#9): DOM focus follows the highlighted tile.
    await expect(focused).toBeFocused();
    // Only one tab stop in the grid (roving tabindex).
    await expect(listbox.locator(`${TILE}[tabindex="0"]`)).toHaveCount(1);
  });
});

test.describe("keyboard navigation", () => {
  test("arrow keys move the highlight and DOM focus follows (#9)", async ({ page }) => {
    await gotoMenu(page);
    await page.keyboard.press("ArrowRight");
    const focused = page.locator(FOCUSED_TILE);
    await expect(focused).toHaveCount(1);
    await expect(focused).toHaveAttribute("data-channel-id", "mii");
    await expect(focused).toBeFocused();
    await page.keyboard.press("ArrowDown"); // row 0 -> row 2, same column
    await expect(focused).toHaveAttribute("data-channel-id", "shop");
    await expect(focused).toBeFocused();
  });

  test("ArrowRight at the page edge turns the page", async ({ page }) => {
    await gotoMenu(page);
    // 11 right-presses: disc(0) -> homebrew(11, last slot of page 0)
    for (let i = 0; i < 11; i++) await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(page.locator(FOCUSED_TILE)).toHaveAttribute("data-channel-id", "p2-1");
  });

  test("[ and ] keys turn pages and reset focus to the first slot", async ({ page }) => {
    await gotoMenu(page);
    await page.keyboard.press("]");
    await expect(page.locator(FOCUSED_TILE)).toHaveAttribute("data-channel-id", "p2-1");
    await page.keyboard.press("]");
    await expect(page.locator(FOCUSED_TILE)).toHaveAttribute("data-channel-id", "p3-e1");
    await page.keyboard.press("[");
    await expect(page.locator(FOCUSED_TILE)).toHaveAttribute("data-channel-id", "p2-1");
  });
});

test.describe("channel modal (a11y #9)", () => {
  test("Enter opens the channel modal; focus moves inside the dialog", async ({ page }) => {
    await gotoMenu(page);
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Channel: Disc Channel" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    // Disc channel is not launchable -> single "Back" control, focused.
    await expect(dialog.getByRole("button", { name: "Back" })).toBeFocused();
    // The grid behind the modal exposes no tab stops while it is open.
    await expect(page.locator(`${TILE}[tabindex="0"]`)).toHaveCount(0);
  });

  test("Escape closes the modal and restores focus to the opener tile", async ({ page }) => {
    await gotoMenu(page);
    const opener = page.locator(FOCUSED_TILE);
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(opener).toBeFocused();
  });

  test("Tab wraps inside the open modal (focus trap)", async ({ page }) => {
    await gotoMenu(page);
    await page.keyboard.press("ArrowRight"); // Mii Channel -> modal has Start + Back
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Channel: Mii Channel" });
    await expect(dialog).toBeVisible();
    const buttons = dialog.locator("button");
    await expect(buttons).toHaveCount(2);
    await expect(buttons.nth(0)).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(buttons.nth(1)).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(buttons.nth(0)).toBeFocused();
  });

  test("Start launches the channel screen; exit returns to the menu", async ({ page }) => {
    await gotoMenu(page);
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Channel: Mii Channel" });
    await dialog.getByRole("button", { name: "Start" }).click();
    const exit = page.getByRole("button", { name: "Return to Wii Menu" });
    await expect(exit).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await exit.click();
    await expect(page.locator(FOCUSED_TILE)).toHaveCount(1);
  });
});

test.describe("menu persistence across reloads (#10)", () => {
  test("page and focused slot survive a reload", async ({ page }) => {
    await gotoMenu(page);
    await page.keyboard.press("]"); // page index 1
    await page.keyboard.press("ArrowDown"); // slot 4
    await page.keyboard.press("ArrowRight"); // slot 5 -> "Mii Parade" (p2-6)
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("wii.menu")))
      .toContain('"focusIndex":5');
    const stored = await page.evaluate(() => localStorage.getItem("wii.menu"));
    expect(stored).toContain('"page":1');

    await page.reload();
    await menuReady(page);
    await expect(page.locator(FOCUSED_TILE)).toHaveAttribute("data-channel-id", "p2-6");
  });

  test("an open channel modal is restored after reload", async ({ page }) => {
    await gotoMenu(page);
    await page.keyboard.press("Enter"); // Disc Channel modal
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.reload();
    // Deferred re-open fires after the boot fade-in.
    await expect(page.getByRole("dialog", { name: "Channel: Disc Channel" })).toBeVisible();
  });

  test("a running channel screen is restored after reload", async ({ page }) => {
    await gotoMenu(page);
    await page.keyboard.press("ArrowRight"); // Mii Channel
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Channel: Mii Channel" });
    await dialog.getByRole("button", { name: "Start" }).click();
    const exit = page.getByRole("button", { name: "Return to Wii Menu" });
    await expect(exit).toBeVisible();
    await page.reload();
    await expect(exit).toBeVisible();
  });

  test("a closed channel is NOT resurrected after reload", async ({ page }) => {
    await gotoMenu(page);
    await page.keyboard.press("Enter"); // open Disc modal
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape"); // close it again
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("wii.menu")))
      .toContain('"open":null');
    await page.reload();
    await menuReady(page);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator(FOCUSED_TILE)).toHaveAttribute("data-channel-id", "disc");
  });

  test("corrupted menu storage falls back to defaults without crashing", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("wii.menu", "{corrupt!!"));
    await page.reload();
    await menuReady(page);
    await expect(page.locator(FOCUSED_TILE)).toHaveAttribute("data-channel-id", "disc");
  });
});
