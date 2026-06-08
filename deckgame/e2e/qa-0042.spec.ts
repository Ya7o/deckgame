import { test, expect, Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

// ---------------------------------------------------------------------------
// PATCH 0042 — QA comparative portrait vs paysage (décision d'activation)
// Portrait  : 390×844
// Landscape : 844×390
// Captures  : reports/patch-0042/screenshots/{portrait,landscape}/
// ---------------------------------------------------------------------------

const BASE_DIR = path.resolve(process.cwd(), "../reports/patch-0042/screenshots");
const APP_URL = "/deckgame/";

function shotDir(o: "portrait" | "landscape") { return path.join(BASE_DIR, o); }
function ensureDirs() {
  fs.mkdirSync(shotDir("portrait"),  { recursive: true });
  fs.mkdirSync(shotDir("landscape"), { recursive: true });
}
async function shot(page: Page, o: "portrait" | "landscape", name: string) {
  await page.screenshot({ path: path.join(shotDir(o), `${name}.png`), fullPage: false });
  console.log(`  📸 [${o}] ${name}.png`);
}
async function startSolo(page: Page) {
  await page.goto(APP_URL);
  await expect(page.getByRole("button", { name: /contre le bot/i })).toBeVisible({ timeout: 5_000 });
  await page.getByRole("button", { name: /contre le bot/i }).click();
  await expect(page.getByText(/MAIN/)).toBeVisible({ timeout: 5_000 });
}
async function playAll(page: Page) {
  for (let i = 0; i < 8; i++) {
    const btns = await page.getByRole("button", { name: "JOUER" }).all();
    if (!btns.length) break;
    await btns[0].click();
    await page.waitForTimeout(130);
  }
}

// ---- PORTRAIT ---------------------------------------------------------------
test.describe("QA Portrait 390×844", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test.beforeAll(() => { ensureDirs(); });

  test("QA-P01 accueil", async ({ page }) => {
    await page.goto(APP_URL);
    await expect(page.getByText(/DECKGAME/i)).toBeVisible({ timeout: 5_000 });
    await shot(page, "portrait", "01-accueil");
  });
  test("QA-P02 plateau debut", async ({ page }) => {
    await startSolo(page);
    await shot(page, "portrait", "02-plateau");
  });
  test("QA-P03 modale carte", async ({ page }) => {
    await startSolo(page);
    await page.locator("[title]").first().click();
    await expect(page.getByRole("button", { name: /Fermer/i })).toBeVisible({ timeout: 3_000 });
    await shot(page, "portrait", "03-modal");
  });
  test("QA-P04 achat visible", async ({ page }) => {
    await startSolo(page);
    await playAll(page);
    await shot(page, "portrait", "04-achat");
  });
  test("QA-P05 journal ouvert", async ({ page }) => {
    await startSolo(page);
    await playAll(page);
    const btn = page.getByRole("button", { name: /Journal/i });
    if (await btn.isVisible()) { await btn.click(); await page.waitForTimeout(300); }
    await shot(page, "portrait", "05-journal");
  });
  test("QA-P06 tour bot", async ({ page }) => {
    await startSolo(page);
    await playAll(page);
    await page.getByRole("button", { name: /Fin du tour/i }).click();
    await page.waitForTimeout(500);
    await shot(page, "portrait", "06-tour-bot");
  });
  test("QA-P07 game-over", async ({ page }) => {
    await startSolo(page);
    page.on("dialog", async d => d.accept());
    await page.getByRole("button", { name: /Abandonner/i }).click();
    await page.waitForTimeout(700);
    await shot(page, "portrait", "07-game-over");
  });
});

// ---- LANDSCAPE --------------------------------------------------------------
test.describe("QA Landscape 844×390", () => {
  test.use({ viewport: { width: 844, height: 390 } });

  test("QA-L01 accueil", async ({ page }) => {
    await page.goto(APP_URL);
    await expect(page.getByText(/DECKGAME/i)).toBeVisible({ timeout: 5_000 });
    await shot(page, "landscape", "01-accueil");
  });
  test("QA-L02 plateau debut", async ({ page }) => {
    await startSolo(page);
    await shot(page, "landscape", "02-plateau");
  });
  test("QA-L03 modale carte", async ({ page }) => {
    await startSolo(page);
    await page.locator("[title]").first().click();
    await expect(page.getByRole("button", { name: /Fermer/i })).toBeVisible({ timeout: 3_000 });
    await shot(page, "landscape", "03-modal");
  });
  test("QA-L04 achat visible", async ({ page }) => {
    await startSolo(page);
    await playAll(page);
    await shot(page, "landscape", "04-achat");
  });
  test("QA-L05 journal ouvert", async ({ page }) => {
    await startSolo(page);
    await playAll(page);
    const btn = page.getByRole("button", { name: /Journal/i });
    if (await btn.isVisible()) { await btn.click(); await page.waitForTimeout(300); }
    await shot(page, "landscape", "05-journal");
  });
  test("QA-L06 tour bot", async ({ page }) => {
    await startSolo(page);
    await playAll(page);
    await page.getByRole("button", { name: /Fin du tour/i }).click();
    await page.waitForTimeout(500);
    await shot(page, "landscape", "06-tour-bot");
  });
  test("QA-L07 game-over", async ({ page }) => {
    await startSolo(page);
    page.on("dialog", async d => d.accept());
    await page.getByRole("button", { name: /Abandonner/i }).click();
    await page.waitForTimeout(700);
    await shot(page, "landscape", "07-game-over");
  });
});
