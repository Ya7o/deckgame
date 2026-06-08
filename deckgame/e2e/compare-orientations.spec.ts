import { test, expect, Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

// ---------------------------------------------------------------------------
// PATCH 0037 — Audit comparatif portrait vs paysage
// Portrait  : 390×844  (9:19 mobile standard)
// Landscape : 844×390  (16:9 horizontal)
// Captures  : reports/patch-0037/screenshots/{portrait,landscape}/
// process.cwd() = ~/apps/deck/deckgame
// ---------------------------------------------------------------------------

const BASE_DIR = path.resolve(process.cwd(), "../reports/patch-0037/screenshots");
const APP_URL = "/deckgame/";

function shotDir(orientation: "portrait" | "landscape") {
  return path.join(BASE_DIR, orientation);
}

function ensureDirs() {
  fs.mkdirSync(shotDir("portrait"),  { recursive: true });
  fs.mkdirSync(shotDir("landscape"), { recursive: true });
}

async function shot(page: Page, orientation: "portrait" | "landscape", name: string) {
  const file = path.join(shotDir(orientation), `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  📸 [${orientation}] ${name}.png`);
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

// ---------------------------------------------------------------------------
// PORTRAIT — 390×844
// ---------------------------------------------------------------------------
test.describe("Portrait 390×844", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeAll(() => { ensureDirs(); });

  test("P-01 accueil", async ({ page }) => {
    await page.goto(APP_URL);
    await expect(page.getByText(/DECKGAME/i)).toBeVisible({ timeout: 5_000 });
    await shot(page, "portrait", "01-accueil");
  });

  test("P-02 debut-partie", async ({ page }) => {
    await startSoloGame(page);
    await shot(page, "portrait", "02-debut-partie");
  });

  test("P-03 main-jouable", async ({ page }) => {
    await startSoloGame(page);
    await expect(page.getByRole("button", { name: "JOUER" }).first()).toBeVisible();
    await shot(page, "portrait", "03-main-jouable");
  });

  test("P-04 detail-carte-main", async ({ page }) => {
    await startSoloGame(page);
    // Hand cards are in the MAIN section — locator scoped to avoid trade row
    const handSection = page.locator("text=MAIN").locator("..");
    const cards = handSection.locator("[title]");
    const cnt = await cards.count();
    if (cnt > 0) {
      await cards.first().tap();
      await expect(page.getByRole("button", { name: /Fermer/i })).toBeVisible({ timeout: 3_000 });
    }
    await shot(page, "portrait", "04-detail-carte-main");
  });

  test("P-05 detail-carte-trade", async ({ page }) => {
    await startSoloGame(page);
    const cards = page.locator("[title]");
    if (await cards.count() >= 2) {
      await cards.nth(1).tap();
      await page.waitForTimeout(200);
    }
    await shot(page, "portrait", "05-detail-carte-trade");
  });

  test("P-06 trade-row", async ({ page }) => {
    await startSoloGame(page);
    await shot(page, "portrait", "06-trade-row");
  });

  test("P-07 achat-visible", async ({ page }) => {
    await startSoloGame(page);
    await playAllCards(page);
    await shot(page, "portrait", "07-achat-visible");
  });

  test("P-08 journal-ouvert", async ({ page }) => {
    await startSoloGame(page);
    await playAllCards(page);
    const btn = page.getByRole("button", { name: /Journal/i });
    if (await btn.isVisible()) { await btn.click(); await page.waitForTimeout(300); }
    await shot(page, "portrait", "08-journal-ouvert");
  });

  test("P-09 pret-fin-tour", async ({ page }) => {
    await startSoloGame(page);
    await playAllCards(page);
    await expect(page.getByRole("button", { name: /Fin du tour/i })).toBeVisible();
    await shot(page, "portrait", "09-pret-fin-tour");
  });

  test("P-10 tour-bot", async ({ page }) => {
    await startSoloGame(page);
    await playAllCards(page);
    await page.getByRole("button", { name: /Fin du tour/i }).click();
    await page.waitForTimeout(500);
    await shot(page, "portrait", "10-tour-bot");
  });

  test("P-11 game-over", async ({ page }) => {
    await startSoloGame(page);
    page.on("dialog", async d => d.accept());
    await page.getByRole("button", { name: /Abandonner/i }).click();
    await page.waitForTimeout(700);
    await shot(page, "portrait", "11-game-over");
  });
});

// ---------------------------------------------------------------------------
// LANDSCAPE — 844×390
// ---------------------------------------------------------------------------
test.describe("Landscape 844×390", () => {
  test.use({ viewport: { width: 844, height: 390 } });

  test("L-01 accueil", async ({ page }) => {
    await page.goto(APP_URL);
    await expect(page.getByText(/DECKGAME/i)).toBeVisible({ timeout: 5_000 });
    await shot(page, "landscape", "01-accueil");
  });

  test("L-02 debut-partie", async ({ page }) => {
    await startSoloGame(page);
    await shot(page, "landscape", "02-debut-partie");
  });

  test("L-03 main-jouable", async ({ page }) => {
    await startSoloGame(page);
    await expect(page.getByRole("button", { name: "JOUER" }).first()).toBeVisible();
    await shot(page, "landscape", "03-main-jouable");
  });

  test("L-04 detail-carte-main", async ({ page }) => {
    await startSoloGame(page);
    const cards = page.locator("[title]");
    if (await cards.count() > 0) {
      await cards.first().tap();
      await page.waitForTimeout(200);
    }
    await shot(page, "landscape", "04-detail-carte-main");
  });

  test("L-05 detail-carte-trade", async ({ page }) => {
    await startSoloGame(page);
    const cards = page.locator("[title]");
    if (await cards.count() >= 2) {
      await cards.nth(1).tap();
      await page.waitForTimeout(200);
    }
    await shot(page, "landscape", "05-detail-carte-trade");
  });

  test("L-06 trade-row", async ({ page }) => {
    await startSoloGame(page);
    await shot(page, "landscape", "06-trade-row");
  });

  test("L-07 achat-visible", async ({ page }) => {
    await startSoloGame(page);
    await playAllCards(page);
    await shot(page, "landscape", "07-achat-visible");
  });

  test("L-08 journal-ouvert", async ({ page }) => {
    await startSoloGame(page);
    await playAllCards(page);
    const btn = page.getByRole("button", { name: /Journal/i });
    if (await btn.isVisible()) { await btn.click(); await page.waitForTimeout(300); }
    await shot(page, "landscape", "08-journal-ouvert");
  });

  test("L-09 pret-fin-tour", async ({ page }) => {
    await startSoloGame(page);
    await playAllCards(page);
    await expect(page.getByRole("button", { name: /Fin du tour/i })).toBeVisible();
    await shot(page, "landscape", "09-pret-fin-tour");
  });

  test("L-10 tour-bot", async ({ page }) => {
    await startSoloGame(page);
    await playAllCards(page);
    await page.getByRole("button", { name: /Fin du tour/i }).click();
    await page.waitForTimeout(500);
    await shot(page, "landscape", "10-tour-bot");
  });

  test("L-11 game-over", async ({ page }) => {
    await startSoloGame(page);
    page.on("dialog", async d => d.accept());
    await page.getByRole("button", { name: /Abandonner/i }).click();
    await page.waitForTimeout(700);
    await shot(page, "landscape", "11-game-over");
  });
});
