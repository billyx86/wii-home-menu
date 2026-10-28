import { expect, test } from "playwright/test";

/**
 * E2E coverage for the Shop Channel (#14).
 *
 * Covers the purchase flow end-to-end: open the shop from the menu, enter the
 * hub, browse a category, open a title, and **Download** it — asserting the
 * Wii Points balance decrements and the title flips to re-download. Also
 * covers the insufficient-balance guard, the free re-download, the **Gift**
 * action, and the Add-Points flow.
 *
 * i18n (#18): every selector targets a `data-testid` — never translatable UI
 * copy. Toast identity is asserted via `data-toast-key` (the i18n key), and
 * balance assertions match the numeric value only, so a second locale drops
 * in without touching this spec.
 *
 * Reuses the `menuReady`-style ready-wait and the `webServer` / `E2E_PORT`
 * contract from playwright.config.ts (same setup as wii-menu.spec.ts).
 */

const TILE = '[data-testid="wii-tile"]';
const FOCUSED_TILE = `${TILE}[data-focused="true"]`;
const MODAL = '[data-testid="channel-modal"]';
const MODAL_START = '[data-testid="channel-modal-start"]';
const CHANNEL_EXIT = '[data-testid="channel-screen-exit"]';

const WELCOME = '[data-testid="shop-welcome"]';
const START_SHOPPING = '[data-testid="shop-start-shopping"]';
const HUB = '[data-testid="shop-hub"]';
const POINTS_CHIP = '[data-testid="shop-points-chip"]';
const CAT_VIRTUAL = '[data-testid="shop-cat-virtual"]';
const DETAIL_TITLE = '[data-testid="shop-detail-title"]';
const DETAIL_BALANCE = '[data-testid="shop-detail-balance"]';
const DOWNLOAD_BTN = '[data-testid="shop-download-btn"]';
const GIFT_BTN = '[data-testid="shop-gift-btn"]';
const TOAST = '[data-testid="shop-toast"]';
const ADD_POINTS_TOOL = '[data-testid="shop-tool-add-points"]';
const POINTS_NOTE = '[data-testid="shop-points-note"]';
const PACK_1000 = '[data-testid="shop-pack-1000"]';
const OWNED_TAG = '[data-testid="shop-owned-tag"]';

/** Wait until the menu grid is ready (a highlighted tile holds DOM focus). */
async function menuReady(page: import("playwright").Page) {
  const focused = page.locator(FOCUSED_TILE).first();
  await focused.waitFor();
  await expect(focused).toBeFocused();
}

/**
 * Boot to the menu, navigate to the Shop Channel tile (row 1 / col 1:
 * ArrowRight -> Mii, ArrowDown -> Shop), open its modal, and launch it.
 * Resolves once the Shop Channel welcome screen is up.
 */
async function openShop(page: import("playwright").Page) {
  await page.goto("/");
  await menuReady(page);
  await page.keyboard.press("ArrowRight"); // disc -> Mii Channel
  await page.keyboard.press("ArrowDown"); // Mii -> Shop Channel
  await page.keyboard.press("Enter");
  await expect(page.locator(MODAL)).toBeVisible();
  await page.locator(MODAL_START).click();
  await expect(page.locator(CHANNEL_EXIT)).toBeVisible();
  // The shop always boots on its welcome screen.
  await expect(page.locator(WELCOME)).toBeVisible();
  await expect(page.locator(START_SHOPPING)).toBeVisible();
}

/** Enter the hub from the welcome screen. */
async function enterHub(page: import("playwright").Page) {
  await page.locator(START_SHOPPING).click();
  await expect(page.locator(HUB)).toBeVisible();
}

/** The balance shown on the chip/balance rows is `{points}` + a translatable
 * suffix — assert the digit run only. */
async function expectBalanceContains(locator: import("playwright").Locator, value: string) {
  await expect(locator).toContainText(new RegExp(`(?<!\\d)${value}(?!\\d)`));
}

test.describe("shop channel (#14)", () => {
  test("open Shop Channel and reach the hub with a 2,500-point balance", async ({ page }) => {
    await openShop(page);
    await enterHub(page);
    // Fresh shop starts at the default balance.
    await expectBalanceContains(page.locator(POINTS_CHIP), "2,500");
    // The three aisles are present.
    for (const cat of ["virtual", "wiiware", "channels"]) {
      await expect(page.locator(`[data-testid="shop-cat-${cat}"]`)).toBeVisible();
    }
  });

  test("download a title decrements Wii Points and marks it owned", async ({ page }) => {
    await openShop(page);
    await enterHub(page);
    await page.locator(CAT_VIRTUAL).click();
    // First row of Virtual Console is Meadow Knight (500 pts).
    await page.locator('[data-testid="shop-title-row-vc-meadow"]').click();
    await expect(page.locator(DETAIL_TITLE)).toBeVisible();
    await expectBalanceContains(page.locator(DETAIL_BALANCE), "2,500");

    await page.locator(DOWNLOAD_BTN).click();
    // Confirmation toast (asserted by i18n key, not copy) + balance now 2,000.
    await expect(page.locator(TOAST)).toHaveAttribute("data-toast-key", "shop.toast.downloaded");
    await expectBalanceContains(page.locator(DETAIL_BALANCE), "2,000");
    // The action flips to re-download and the title is on this console.
    await expect(page.locator(OWNED_TAG)).toBeVisible();
  });

  test("re-downloading an owned title is free (no double charge)", async ({ page }) => {
    await openShop(page);
    await enterHub(page);
    await page.locator(CAT_VIRTUAL).click();
    await page.locator('[data-testid="shop-title-row-vc-meadow"]').click();
    await page.locator(DOWNLOAD_BTN).click(); // 2500 -> 2000
    await expectBalanceContains(page.locator(DETAIL_BALANCE), "2,000");
    await page.locator(DOWNLOAD_BTN).click(); // free re-download
    // Balance is unchanged; the re-owned toast fires (by i18n key).
    await expect(page.locator(TOAST)).toHaveAttribute("data-toast-key", "shop.toast.reowned");
    await expectBalanceContains(page.locator(DETAIL_BALANCE), "2,000");
  });

  test("insufficient balance shows the 'Not enough Wii Points' guard", async ({ page }) => {
    await page.goto("/");
    await menuReady(page);
    // Seed a low balance BEFORE the shop mounts so the fresh shop reads it.
    await page.evaluate(() => {
      localStorage.setItem("wii.shop", JSON.stringify({ points: 300, owned: [] }));
    });
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(page.locator(MODAL)).toBeVisible();
    await page.locator(MODAL_START).click();
    await expect(page.locator(CHANNEL_EXIT)).toBeVisible();
    await page.locator(START_SHOPPING).click();

    await page.locator(CAT_VIRTUAL).click();
    // Orbit Patrol costs 800 pts > the 300 seeded balance.
    await page.locator('[data-testid="shop-title-row-vc-orbit"]').click();
    await expect(page.locator(DETAIL_TITLE)).toBeVisible();
    await page.locator(DOWNLOAD_BTN).click();
    await expect(page.locator(TOAST)).toHaveAttribute("data-toast-key", "shop.toast.insufficient");
    // Balance is unchanged — the purchase was refused.
    await expectBalanceContains(page.locator(DETAIL_BALANCE), "300");
  });

  test("the Gift action queues a gift without spending points", async ({ page }) => {
    await openShop(page);
    await enterHub(page);
    await page.locator(CAT_VIRTUAL).click();
    await page.locator('[data-testid="shop-title-row-vc-meadow"]').click();
    await expectBalanceContains(page.locator(DETAIL_BALANCE), "2,500");
    await page.locator(GIFT_BTN).click();
    await expect(page.locator(TOAST)).toHaveAttribute("data-toast-key", "shop.toast.gift");
    // Gifting does not change the balance.
    await expectBalanceContains(page.locator(DETAIL_BALANCE), "2,500");
  });

  test("adding a Wii Points pack increases the balance", async ({ page }) => {
    await openShop(page);
    await enterHub(page);
    await page.locator(ADD_POINTS_TOOL).click();
    await expect(page.locator('[data-testid="shop-points-screen"]')).toBeVisible();
    // Add the 1,000 pack: 2,500 -> 3,500.
    await page.locator(PACK_1000).click();
    await expect(page.locator(TOAST)).toHaveAttribute("data-toast-key", "shop.toast.added");
    await expectBalanceContains(page.locator(POINTS_NOTE), "3,500");
  });
});
