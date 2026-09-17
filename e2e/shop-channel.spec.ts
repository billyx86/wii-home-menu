import { expect, test } from "playwright/test";

/**
 * E2E coverage for the Shop Channel (#14).
 *
 * Covers the purchase flow end-to-end: open the shop from the menu, enter the
 * hub, browse a category, open a title, and **Download** it — asserting the
 * Wii Points balance decrements and the title flips to "Re-download". Also
 * covers the **"Not enough Wii Points"** guard and the **Gift** action.
 *
 * Reuses the `menuReady`-style ready-wait and the `webServer` / `E2E_PORT`
 * contract from playwright.config.ts (same setup as wii-menu.spec.ts).
 */

const LISTBOX = '[role="listbox"][aria-label="Channel grid"]';
const TILE = '[role="option"]';
const FOCUSED_TILE = `${TILE}[data-focused="true"]`;

/** Wait until the menu grid is ready (a highlighted tile holds DOM focus). */
async function menuReady(page: import("playwright").Page) {
  const focused = page.locator(FOCUSED_TILE).first();
  await focused.waitFor();
  await expect(focused).toBeFocused();
}

/**
 * Boot to the menu, navigate to the Shop Channel tile (row 1 / col 1:
 * ArrowRight -> Mii, ArrowDown -> Shop), open its modal, and launch it.
 * Resolves once the Shop Channel screen is up (its "Return to Wii Menu"
 * exit button is present).
 */
async function openShop(page: import("playwright").Page) {
  await page.goto("/");
  await menuReady(page);
  await page.keyboard.press("ArrowRight"); // disc -> Mii Channel
  await page.keyboard.press("ArrowDown"); // Mii -> Shop Channel
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Channel: Shop Channel" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Start" }).click();
  await expect(page.getByRole("button", { name: "Return to Wii Menu" })).toBeVisible();
  // The shop always boots on its welcome screen.
  await expect(page.getByRole("button", { name: "Start Shopping" })).toBeVisible();
}

/** Enter the hub from the welcome screen. */
async function enterHub(page: import("playwright").Page) {
  await page.getByRole("button", { name: "Start Shopping" }).click();
  await expect(page.getByRole("heading", { name: "What would you like to shop for?" })).toBeVisible();
}

test.describe("shop channel (#14)", () => {
  test("open Shop Channel and reach the hub with a 2,500-point balance", async ({ page }) => {
    await openShop(page);
    await enterHub(page);
    // Fresh shop starts at the default balance.
    await expect(page.locator(".shop-points-chip")).toContainText("2,500");
    // The three aisles are present.
    for (const cat of ["Virtual Console", "WiiWare", "Wii Channels"]) {
      await expect(page.getByRole("button", { name: new RegExp(cat) })).toBeVisible();
    }
  });

  test("download a title decrements Wii Points and marks it owned", async ({ page }) => {
    await openShop(page);
    await enterHub(page);
    await page.getByRole("button", { name: /Virtual Console/ }).click();
    // First row of Virtual Console is "Meadow Knight" (500 pts).
    await page.getByRole("button", { name: /Meadow Knight/ }).click();
    await expect(page.getByRole("heading", { name: "Meadow Knight" })).toBeVisible();
    await expect(page.locator(".shop-detail-balance")).toContainText("2,500");

    await page.getByRole("button", { name: /Download/ }).click();
    // Confirmation toast + balance now 2,000.
    await expect(page.getByRole("status")).toHaveText(/Downloaded · Meadow Knight/);
    await expect(page.locator(".shop-detail-balance")).toContainText("2,000");
    // The action flips to "Re-download" and the title is on this console.
    await expect(page.getByRole("button", { name: /Re-download/ })).toBeVisible();
    await expect(page.locator(".shop-detail-balance")).toContainText("On this console");
  });

  test("re-downloading an owned title is free (no double charge)", async ({ page }) => {
    await openShop(page);
    await enterHub(page);
    await page.getByRole("button", { name: /Virtual Console/ }).click();
    await page.getByRole("button", { name: /Meadow Knight/ }).click();
    await page.getByRole("button", { name: /Download/ }).click(); // 2500 -> 2000
    await expect(page.locator(".shop-detail-balance")).toContainText("2,000");
    await page.getByRole("button", { name: /Re-download/ }).click();
    // Balance is unchanged (free re-download).
    await expect(page.getByRole("status")).toContainText(/Already on your console/);
    await expect(page.locator(".shop-detail-balance")).toContainText("2,000");
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
    await page.getByRole("dialog", { name: "Channel: Shop Channel" }).getByRole("button", { name: "Start" }).click();
    await expect(page.getByRole("button", { name: "Return to Wii Menu" })).toBeVisible();
    await page.getByRole("button", { name: "Start Shopping" }).click();

    await page.getByRole("button", { name: /Virtual Console/ }).click();
    // "Orbit Patrol" costs 800 pts > the 300 seeded balance.
    await page.getByRole("button", { name: /Orbit Patrol/ }).click();
    await expect(page.getByRole("heading", { name: "Orbit Patrol" })).toBeVisible();
    await page.getByRole("button", { name: /Download/ }).click();
    await expect(page.getByRole("status")).toHaveText("Not enough Wii Points.");
    // Balance is unchanged — the purchase was refused.
    await expect(page.locator(".shop-detail-balance")).toContainText("300");
  });

  test("the Gift action queues a gift without spending points", async ({ page }) => {
    await openShop(page);
    await enterHub(page);
    await page.getByRole("button", { name: /Virtual Console/ }).click();
    await page.getByRole("button", { name: /Meadow Knight/ }).click();
    await expect(page.locator(".shop-detail-balance")).toContainText("2,500");
    await page.getByRole("button", { name: /Gift/ }).click();
    await expect(page.getByRole("status")).toContainText(/Gift message queued/);
    // Gifting does not change the balance.
    await expect(page.locator(".shop-detail-balance")).toContainText("2,500");
  });

  test("adding a Wii Points pack increases the balance", async ({ page }) => {
    await openShop(page);
    await enterHub(page);
    await page.getByRole("button", { name: "Add Wii Points" }).click();
    await expect(page.getByRole("heading", { name: "Add Wii Points" })).toBeVisible();
    // Add the 1,000 pack: 2,500 -> 3,500.
    await page.getByRole("button", { name: /1,000/ }).click();
    await expect(page.getByRole("status")).toContainText(/Added 1,000 Wii Points/);
    await expect(page.locator(".shop-inline-note")).toContainText("3,500");
  });
});
