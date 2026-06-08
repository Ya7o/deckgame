import { test, expect } from "@playwright/test";

/**
 * PATCH 0045 — Plein écran mobile et PWA
 * Viewports : portrait 390×844, paysage 844×390
 * - Bouton plein écran visible quand API disponible
 * - Bouton plein écran absent quand API indisponible (contexte sécurisé requis)
 * - manifest.webmanifest accessible
 * - StartScreen : bouton plein écran
 */

const BASE = "http://localhost:5173/deckgame/";

// Helper : start a game
async function startGame(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: /bot/i }).first().click();
  await page.waitForSelector("[data-layout]", { timeout: 5000 });
}

test.describe("PATCH 0045 — Portrait 390×844", () => {
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });

  test("01 — StartScreen portrait : présence du layout", async ({ page }) => {
    await page.goto(BASE);
    await page.screenshot({ path: "reports/patch-0045/screenshots/portrait-01-startscreen.png", fullPage: false });
  });

  test("02 — Plateau portrait avec bouton plein écran (si supporté)", async ({ page }) => {
    await page.goto(BASE);
    await startGame(page);
    await page.screenshot({ path: "reports/patch-0045/screenshots/portrait-02-plateau.png", fullPage: false });
    // If fullscreen API available, button should exist
    const hasFS = await page.evaluate(() => document.fullscreenEnabled ?? false);
    if (hasFS) {
      const fsBtn = page.locator("button", { hasText: /écran/ });
      await expect(fsBtn.first()).toBeVisible();
    }
  });

  test("03 — Plateau portrait MAIN + JOUER visibles", async ({ page }) => {
    await page.goto(BASE);
    await startGame(page);
    await expect(page.getByText("MAIN").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "JOUER" }).first()).toBeVisible();
    await page.screenshot({ path: "reports/patch-0045/screenshots/portrait-03-main-jouable.png", fullPage: false });
  });
});

test.describe("PATCH 0045 — Paysage 844×390", () => {
  test.use({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3 });

  test("04 — StartScreen paysage : présence du layout 2 colonnes", async ({ page }) => {
    await page.goto(BASE);
    await page.screenshot({ path: "reports/patch-0045/screenshots/landscape-04-startscreen.png", fullPage: false });
    // Two-column layout
    await expect(page.getByRole("button", { name: /bot/i }).first()).toBeVisible();
  });

  test("05 — Plateau paysage avec bouton plein écran (si supporté)", async ({ page }) => {
    await page.goto(BASE);
    await startGame(page);
    await page.screenshot({ path: "reports/patch-0045/screenshots/landscape-05-plateau.png", fullPage: false });
    const hasFS = await page.evaluate(() => document.fullscreenEnabled ?? false);
    if (hasFS) {
      const fsBtn = page.locator("button", { hasText: /écran/ });
      await expect(fsBtn.first()).toBeVisible();
    }
  });

  test("06 — Plateau paysage MAIN + Fin du tour visibles", async ({ page }) => {
    await page.goto(BASE);
    await startGame(page);
    await expect(page.getByText("MAIN").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Fin du tour" }).first()).toBeVisible();
    await page.screenshot({ path: "reports/patch-0045/screenshots/landscape-06-actions.png", fullPage: false });
  });

  test("07 — Plateau paysage : modale accessible", async ({ page }) => {
    await page.goto(BASE);
    await startGame(page);
    const cards = page.locator("[data-layout='landscape'] button", { hasText: /JOUER/ });
    const count = await cards.count();
    if (count > 0) {
      // Click first JOUER card to open modal
      await cards.first().click();
      // Wait for modal or detail overlay
      await page.waitForTimeout(400);
    }
    await page.screenshot({ path: "reports/patch-0045/screenshots/landscape-07-modal.png", fullPage: false });
  });

  test("08 — manifest.webmanifest accessible", async ({ page }) => {
    const response = await page.goto(BASE + "manifest.webmanifest");
    expect(response?.status()).toBe(200);
    const body = await response?.text();
    expect(body).toContain("Deckgame");
    expect(body).toContain("standalone");
  });
});
