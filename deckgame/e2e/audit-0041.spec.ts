import { test, expect, Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

// ---------------------------------------------------------------------------
// PATCH 0041 — Audit paysage : interactions, modales, journal, game-over
// Viewport : 844×390  (landscape)
// Captures : reports/patch-0041/screenshots/
// ---------------------------------------------------------------------------

const BASE_DIR = path.resolve(process.cwd(), "../reports/patch-0041/screenshots");
const APP_URL = "/deckgame/";

function ensureDir() { fs.mkdirSync(BASE_DIR, { recursive: true }); }

async function shot(page: Page, name: string) {
  const file = path.join(BASE_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  📸 ${name}.png`);
}

async function startSoloGame(page: Page) {
  await page.goto(APP_URL);
  await expect(page.getByRole("button", { name: /contre le bot/i })).toBeVisible({ timeout: 5_000 });
  await page.getByRole("button", { name: /contre le bot/i }).click();
  await expect(page.getByText(/MAIN/)).toBeVisible({ timeout: 5_000 });
}

async function playAllCards(page: Page) {
  for (let i = 0; i < 8; i++) {
    const btns = await page.getByRole("button", { name: "JOUER" }).all();
    if (btns.length === 0) break;
    await btns[0].click();
    await page.waitForTimeout(130);
  }
}

test.describe("PATCH 0041 — Landscape interactions audit", () => {
  test.use({ viewport: { width: 844, height: 390 } });
  test.beforeAll(() => { ensureDir(); });

  test("L41-01 accueil paysage", async ({ page }) => {
    await page.goto(APP_URL);
    await expect(page.getByText(/DECKGAME/i)).toBeVisible({ timeout: 5_000 });
    await shot(page, "01-accueil");
  });

  test("L41-02 plateau paysage debut partie", async ({ page }) => {
    await startSoloGame(page);
    await shot(page, "02-plateau");
  });

  test("L41-03 modale carte main (maxHeight 78vh)", async ({ page }) => {
    await startSoloGame(page);
    // Click first card with a title (cards in trade row or hand)
    const cards = page.locator("[title]");
    await expect(cards.first()).toBeVisible({ timeout: 3_000 });
    await cards.first().click();
    await expect(page.getByRole("button", { name: /Fermer/i })).toBeVisible({ timeout: 3_000 });
    await shot(page, "03-modal-carte");
  });

  test("L41-04 fermeture modale ✕ (44×44px)", async ({ page }) => {
    await startSoloGame(page);
    const cards = page.locator("[title]");
    await expect(cards.first()).toBeVisible({ timeout: 3_000 });
    await cards.first().click();
    await expect(page.getByRole("button", { name: /Fermer/i })).toBeVisible({ timeout: 3_000 });
    await shot(page, "04-modal-ouverte");
    // Close via ✕ button
    const closeX = page.locator("button").filter({ hasText: "✕" });
    await closeX.click();
    await expect(page.getByRole("button", { name: /Fermer/i })).not.toBeVisible({ timeout: 2_000 });
    await shot(page, "04b-modal-fermee");
  });

  test("L41-05 journal paysage ouvert", async ({ page }) => {
    await startSoloGame(page);
    await playAllCards(page);
    const journalBtn = page.getByRole("button", { name: /Journal/i });
    if (await journalBtn.isVisible()) {
      await journalBtn.click();
      await page.waitForTimeout(300);
    }
    await shot(page, "05-journal-ouvert");
  });

  test("L41-06 journal fermeture ✕ (44×44px)", async ({ page }) => {
    await startSoloGame(page);
    await playAllCards(page);
    const journalBtn = page.getByRole("button", { name: /Journal/i });
    if (await journalBtn.isVisible()) {
      await journalBtn.click();
      await page.waitForTimeout(200);
      const closeX = page.locator("button[style*='min-width: 44px']").last();
      if (await closeX.isVisible()) {
        await closeX.click();
        await page.waitForTimeout(200);
      }
    }
    await shot(page, "06-journal-ferme");
  });

  test("L41-07 pret fin de tour paysage", async ({ page }) => {
    await startSoloGame(page);
    await playAllCards(page);
    await expect(page.getByRole("button", { name: /Fin du tour/i })).toBeVisible({ timeout: 3_000 });
    await shot(page, "07-pret-fin-tour");
  });

  test("L41-08 tour bot paysage", async ({ page }) => {
    await startSoloGame(page);
    await playAllCards(page);
    await page.getByRole("button", { name: /Fin du tour/i }).click();
    await page.waitForTimeout(600);
    await shot(page, "08-tour-bot");
  });

  test("L41-09 game-over paysage (2 colonnes)", async ({ page }) => {
    await startSoloGame(page);
    page.on("dialog", async d => d.accept());
    await page.getByRole("button", { name: /Abandonner/i }).click();
    await page.waitForTimeout(700);
    await shot(page, "09-game-over");
  });

  test("L41-10 nouvelle partie depuis game-over paysage", async ({ page }) => {
    await startSoloGame(page);
    page.on("dialog", async d => d.accept());
    await page.getByRole("button", { name: /Abandonner/i }).click();
    await page.waitForTimeout(700);
    // Click "Nouvelle partie"
    const newGameBtn = page.getByRole("button", { name: /Nouvelle/i });
    await expect(newGameBtn).toBeVisible({ timeout: 3_000 });
    await newGameBtn.click();
    await page.waitForTimeout(500);
    await shot(page, "10-apres-nouvelle-partie");
  });
});
