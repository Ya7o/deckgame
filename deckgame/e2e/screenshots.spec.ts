import { test, expect, Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

// ---------------------------------------------------------------------------
// Screenshots spec — multiple game screens
// Viewport : 390×844 (Chromium mobile portrait)
// App URL  : http://localhost:5173/deckgame/
// ---------------------------------------------------------------------------

// process.cwd() = ~/apps/deck/deckgame
const SCREENSHOT_DIR = path.resolve(process.cwd(), "reports/screenshots");
const APP_URL = "/deckgame/";

async function ensureDir() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function shot(page: Page, name: string) {
  const file = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  📸 ${name}.png`);
}

async function startSoloGame(page: Page) {
  await page.goto(APP_URL);
  const botBtn = page.getByRole("button", { name: /contre le bot/i });
  await expect(botBtn).toBeVisible({ timeout: 5_000 });
  await botBtn.click();
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

// ---------------------------------------------------------------------------

test.describe("Screenshots — écrans de jeu mobile 390×844", () => {
  test.beforeAll(async () => {
    await ensureDir();
  });

  test("01 — écran d'accueil", async ({ page }) => {
    await page.goto(APP_URL);
    await expect(page.getByText(/DECKGAME/i)).toBeVisible({ timeout: 5_000 });
    await shot(page, "01-accueil");
  });

  test("02 — début de partie (vue initiale)", async ({ page }) => {
    await startSoloGame(page);
    await shot(page, "02-debut-partie");
  });

  test("03 — main du joueur avec boutons JOUER", async ({ page }) => {
    await startSoloGame(page);
    await expect(page.getByRole("button", { name: "JOUER" }).first()).toBeVisible();
    await shot(page, "03-main-joueur-jouer");
  });

  test("04 — rangée commerciale (vue complète)", async ({ page }) => {
    await startSoloGame(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await shot(page, "04-trade-row");
  });

  test("05 — cartes jouées (EN JEU)", async ({ page }) => {
    await startSoloGame(page);
    const btns = page.getByRole("button", { name: "JOUER" });
    if (await btns.count() > 0) {
      await btns.first().click();
      await page.waitForTimeout(200);
    }
    await shot(page, "05-en-jeu-apres-jouer");
  });

  test("06 — ressources + boutons ACHAT visibles", async ({ page }) => {
    await startSoloGame(page);
    await playAllCards(page);
    await shot(page, "06-ressources-achat");
  });

  test("07 — modale de détail carte main (tap)", async ({ page }) => {
    await startSoloGame(page);
    const cards = page.locator("[title]");
    await expect(cards.first()).toBeVisible({ timeout: 3_000 });
    await cards.first().tap();
    await expect(page.getByRole("button", { name: /Fermer/i })).toBeVisible({ timeout: 3_000 });
    await shot(page, "07-modal-detail-main");
  });

  test("08 — modale rangée commerciale + overlay opaque", async ({ page }) => {
    await startSoloGame(page);
    const cards = page.locator("[title]");
    const cnt = await cards.count();
    if (cnt >= 3) {
      await cards.nth(2).tap();
      await page.waitForTimeout(200);
    }
    await shot(page, "08-modal-trade-row-overlay");
  });

  test("09 — prêt pour Fin du tour (ressources générées)", async ({ page }) => {
    await startSoloGame(page);
    await playAllCards(page);
    await expect(page.getByRole("button", { name: /Fin du tour/i })).toBeVisible();
    await shot(page, "09-pret-fin-tour");
  });

  test("10 — bannière tour bot", async ({ page }) => {
    await startSoloGame(page);
    const finBtn = page.getByRole("button", { name: /Fin du tour/i });
    await finBtn.click();
    await page.waitForTimeout(400);
    await shot(page, "10-tour-bot-banniere");
  });

  test("11 — retour tour humain (après bot)", async ({ page }) => {
    await startSoloGame(page);
    const fin1 = page.getByRole("button", { name: /Fin du tour/i });
    await fin1.click();
    await expect(page.getByRole("button", { name: /Fin du tour/i })).toBeVisible({ timeout: 5_000 });
    await page.waitForTimeout(300);
    await shot(page, "11-retour-tour-humain");
  });

  test("12 — game over (abandon)", async ({ page }) => {
    await startSoloGame(page);
    page.on("dialog", async dialog => { await dialog.accept(); });
    const concedeBtn = page.getByRole("button", { name: /Abandonner/i });
    await concedeBtn.click();
    await page.waitForTimeout(700);
    await shot(page, "12-game-over");
  });
});
