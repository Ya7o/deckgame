import { test, expect, Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

// ---------------------------------------------------------------------------
// PATCH 0043 — Stabilisation mode paysage post-audit
// Scénarios ciblés : accueil landscape (P1 fix) + régression portrait
// Viewport landscape : 844×390  /  portrait : 390×844
// Captures : reports/patch-0043/screenshots/
// ---------------------------------------------------------------------------

const BASE_DIR = path.resolve(process.cwd(), "../reports/patch-0043/screenshots");
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

// ---- PORTRAIT ---------------------------------------------------------------
test.describe("PATCH 0043 — Portrait stabilité", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test.beforeAll(() => { ensureDirs(); });

  test("P43-01 accueil portrait (NR)", async ({ page }) => {
    await page.goto(APP_URL);
    await expect(page.getByText(/DECKGAME/i)).toBeVisible({ timeout: 5_000 });
    await shot(page, "portrait", "01-accueil");
  });

  test("P43-02 plateau portrait (NR)", async ({ page }) => {
    await startSolo(page);
    await shot(page, "portrait", "02-plateau");
  });
});

// ---- LANDSCAPE --------------------------------------------------------------
test.describe("PATCH 0043 — Landscape corrections", () => {
  test.use({ viewport: { width: 844, height: 390 } });

  test("L43-01 accueil landscape (fix P1 — description visible)", async ({ page }) => {
    await page.goto(APP_URL);
    await expect(page.getByText(/DECKGAME/i)).toBeVisible({ timeout: 5_000 });
    // Rules text must be visible (was cut off before fix)
    await expect(page.getByText(/Éclaireurs/i)).toBeVisible({ timeout: 3_000 });
    await shot(page, "landscape", "01-accueil");
  });

  test("L43-02 accueil landscape — boutons accessibles", async ({ page }) => {
    await page.goto(APP_URL);
    await expect(page.getByRole("button", { name: /contre le bot/i })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole("button", { name: /2 joueurs/i })).toBeVisible({ timeout: 3_000 });
    await shot(page, "landscape", "02-accueil-buttons");
  });

  test("L43-03 plateau depuis accueil landscape", async ({ page }) => {
    await startSolo(page);
    await shot(page, "landscape", "03-plateau");
  });

  test("L43-04 accueil landscape layout 2 colonnes", async ({ page }) => {
    await page.goto(APP_URL);
    await expect(page.getByText(/DECKGAME/i)).toBeVisible({ timeout: 5_000 });
    // Both form and description should be visible simultaneously
    await expect(page.getByText(/DECKGAME/i)).toBeVisible();
    await expect(page.getByText(/Éclaireurs/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /contre le bot/i })).toBeVisible();
    await shot(page, "landscape", "04-accueil-2cols");
  });
});
