import { test, expect, Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

// ---------------------------------------------------------------------------
// PATCH 0040 — Captures paysage layout plateau 844x390
// process.cwd() = ~/apps/deck/deckgame
// ---------------------------------------------------------------------------

const SHOT_DIR = path.resolve(process.cwd(), "../reports/patch-0040/screenshots");

function ensureDir() { fs.mkdirSync(SHOT_DIR, { recursive: true }); }

async function shot(page: Page, name: string) {
  await page.screenshot({ path: path.join(SHOT_DIR, `${name}.png`), fullPage: false });
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
    await page.waitForTimeout(100);
  }
}

test.describe("PATCH 0040 — Landscape 844x390", () => {
  test.use({ viewport: { width: 844, height: 390 } });
  test.beforeAll(() => { ensureDir(); });

  test("01 accueil", async ({ page }) => {
    await page.goto("/deckgame/");
    await expect(page.getByText(/DECKGAME/i)).toBeVisible({ timeout: 5_000 });
    await shot(page, "01-accueil");
  });

  test("02 debut-partie", async ({ page }) => {
    await startSoloGame(page);
    await shot(page, "02-debut-partie");
  });

  test("03 main-jouable", async ({ page }) => {
    await startSoloGame(page);
    await expect(page.getByRole("button", { name: "JOUER" }).first()).toBeVisible();
    await shot(page, "03-main-jouable");
  });

  test("04 trade-row", async ({ page }) => {
    await startSoloGame(page);
    await shot(page, "04-trade-row");
  });

  test("05 achat-visible", async ({ page }) => {
    await startSoloGame(page);
    await playAllCards(page);
    await shot(page, "05-achat-visible");
  });

  test("06 modale-carte", async ({ page }) => {
    await startSoloGame(page);
    const cards = page.locator("[title]");
    await expect(cards.first()).toBeVisible({ timeout: 3_000 });
    await cards.first().tap();
    await expect(page.getByRole("button", { name: /Fermer/i })).toBeVisible({ timeout: 3_000 });
    await shot(page, "06-modale-carte");
  });

  test("07 tour-bot", async ({ page }) => {
    await startSoloGame(page);
    await playAllCards(page);
    await page.getByRole("button", { name: /Fin du tour/i }).click();
    await page.waitForTimeout(300);
    await shot(page, "07-tour-bot");
  });

  test("08 journal-ouvert", async ({ page }) => {
    await startSoloGame(page);
    await playAllCards(page);
    const btn = page.getByRole("button", { name: /Journal/i });
    if (await btn.isVisible()) { await btn.click(); await page.waitForTimeout(200); }
    await shot(page, "08-journal-ouvert");
  });

  test("09 pret-fin-tour", async ({ page }) => {
    await startSoloGame(page);
    await playAllCards(page);
    await shot(page, "09-pret-fin-tour");
  });

  test("10 game-over", async ({ page }) => {
    await startSoloGame(page);
    page.on("dialog", async d => d.accept());
    await page.getByRole("button", { name: /Abandonner/i }).click();
    await page.waitForTimeout(700);
    await shot(page, "10-game-over");
  });
});
