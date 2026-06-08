import { test, expect, Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

// ---------------------------------------------------------------------------
// PATCH 0038 — Captures portrait post-corrections frictions
// Viewport : 390×844  (project default: deviceScaleFactor 3, isMobile, hasTouch)
// process.cwd() = ~/apps/deck/deckgame
// ---------------------------------------------------------------------------

const SHOT_DIR = path.resolve(process.cwd(), "../reports/patch-0038/screenshots");

function ensureDir() {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
}

async function shot(page: Page, name: string) {
  const file = path.join(SHOT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  📸 ${name}.png`);
}

async function startSoloGame(page: Page) {
  await page.goto("/deckgame/");
  await expect(page.getByRole("button", { name: /contre le bot/i })).toBeVisible({ timeout: 5_000 });
  await page.getByRole("button", { name: /contre le bot/i }).click();
  await expect(page.getByText(/MAIN/)).toBeVisible({ timeout: 5_000 });
}

async function playAllCards(page: Page) {
  for (let i = 0; i < 8; i++) {
    const btns = await page.getByRole("button", { name: "JOUER" }).all();
    if (btns.length === 0) break;
    await btns[0].click();
    await page.waitForTimeout(120);
  }
}

test.describe("PATCH 0038 — Portrait 390×844", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeAll(() => { ensureDir(); });

  // 01 — Start screen
  test("01 accueil", async ({ page }) => {
    await page.goto("/deckgame/");
    await expect(page.getByText(/DECKGAME/i)).toBeVisible({ timeout: 5_000 });
    await shot(page, "01-accueil");
  });

  // 02 — Main with 5 cards (scroll indicator visible)
  test("02 main-5-cartes", async ({ page }) => {
    await startSoloGame(page);
    await expect(page.getByRole("button", { name: "JOUER" }).first()).toBeVisible();
    await shot(page, "02-main-5-cartes");
  });

  // 03 — Trade row — long card names
  test("03 trade-row-noms", async ({ page }) => {
    await startSoloGame(page);
    await shot(page, "03-trade-row-noms");
  });

  // 04 — Cards played (EN JEU) + ACHAT visible
  test("04 achat-en-jeu", async ({ page }) => {
    await startSoloGame(page);
    await playAllCards(page);
    await shot(page, "04-achat-en-jeu");
  });

  // 05 — Bot turn state (overlay + grayscale + banner)
  test("05 tour-bot", async ({ page }) => {
    await startSoloGame(page);
    await playAllCards(page);
    await page.getByRole("button", { name: /Fin du tour/i }).click();
    await page.waitForTimeout(300);
    await shot(page, "05-tour-bot");
  });

  // 06 — Modal open (close button 44px)
  test("06 modale-ouverte", async ({ page }) => {
    await startSoloGame(page);
    // Tap first card in trade row (any card with [title])
    const cards = page.locator("[title]");
    await expect(cards.first()).toBeVisible({ timeout: 3_000 });
    await cards.first().tap();
    await expect(page.getByRole("button", { name: /Fermer/i })).toBeVisible({ timeout: 3_000 });
    await shot(page, "06-modale-ouverte");
  });

  // 07 — Journal open
  test("07 journal-ouvert", async ({ page }) => {
    await startSoloGame(page);
    await playAllCards(page);
    const btn = page.getByRole("button", { name: /Journal/i });
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(300);
    }
    await shot(page, "07-journal-ouvert");
  });

  // 08 — Fin de tour (attaque disponible si combat > 0)
  test("08 pret-fin-tour", async ({ page }) => {
    await startSoloGame(page);
    await playAllCards(page);
    await expect(page.getByRole("button", { name: /Fin du tour/i })).toBeVisible();
    await shot(page, "08-pret-fin-tour");
  });

  // 09 — Game over
  test("09 game-over", async ({ page }) => {
    await startSoloGame(page);
    page.on("dialog", async d => d.accept());
    await page.getByRole("button", { name: /Abandonner/i }).click();
    await page.waitForTimeout(700);
    await shot(page, "09-game-over");
  });
});
