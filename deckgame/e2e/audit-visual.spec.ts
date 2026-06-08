import { test, expect, Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

// ---------------------------------------------------------------------------
// PATCH 0036 — Audit visuel mobile
// Viewport : 390×844  |  Chromium 149  |  locale fr-FR
// Captures → reports/patch-0036/screenshots/  (racine repo)
// process.cwd() = ~/apps/deck/deckgame  →  "../reports/..." = racine repo
// ---------------------------------------------------------------------------

const SCREENSHOT_DIR = path.resolve(process.cwd(), "../reports/patch-0036/screenshots");
const APP_URL = "/deckgame/";

function ensureDir() {
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
    await page.waitForTimeout(130);
  }
}

async function endTurnAndWaitBack(page: Page) {
  const fin = page.getByRole("button", { name: /Fin du tour/i });
  await fin.click();
  await expect(page.getByRole("button", { name: /Fin du tour/i })).toBeVisible({ timeout: 8_000 });
  await page.waitForTimeout(300);
}

// ---------------------------------------------------------------------------

test.describe("PATCH 0036 — Audit visuel mobile 390×844", () => {
  test.beforeAll(() => { ensureDir(); });

  // ── 01 Écran d'accueil ─────────────────────────────────────────────────
  test("01 — accueil", async ({ page }) => {
    await page.goto(APP_URL);
    await expect(page.getByText(/DECKGAME/i)).toBeVisible({ timeout: 5_000 });
    await shot(page, "01-accueil");
  });

  // ── 02 Début de partie humain vs bot ───────────────────────────────────
  test("02 — debut-partie", async ({ page }) => {
    await startSoloGame(page);
    await shot(page, "02-debut-partie");
  });

  // ── 03 Main joueur avec cartes jouables ────────────────────────────────
  test("03 — main-jouable-jouer", async ({ page }) => {
    await startSoloGame(page);
    await expect(page.getByRole("button", { name: "JOUER" }).first()).toBeVisible();
    await shot(page, "03-main-jouable-jouer");
  });

  // ── 04 Carte en main — modale détail (tap) ─────────────────────────────
  test("04 — detail-carte-main", async ({ page }) => {
    await startSoloGame(page);
    const cards = page.locator("[title]");
    await expect(cards.first()).toBeVisible({ timeout: 3_000 });
    await cards.first().tap();
    await expect(page.getByRole("button", { name: /Fermer/i })).toBeVisible({ timeout: 3_000 });
    await shot(page, "04-detail-carte-main");
  });

  // ── 05 Carte rangée commerciale — modale détail (tap) ──────────────────
  test("05 — detail-carte-trade", async ({ page }) => {
    await startSoloGame(page);
    const cards = page.locator("[title]");
    const cnt = await cards.count();
    // Trade row cards appear before hand cards — tap card at index 2
    if (cnt >= 3) {
      await cards.nth(2).tap();
      await page.waitForTimeout(200);
    }
    await shot(page, "05-detail-carte-trade");
  });

  // ── 06 Rangée commerciale complète (scroll horizontal) ─────────────────
  test("06 — trade-row-scroll", async ({ page }) => {
    await startSoloGame(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await shot(page, "06-trade-row-scroll");
  });

  // ── 07 Achat visible (après avoir joué toutes les cartes) ──────────────
  test("07 — achat-visible", async ({ page }) => {
    await startSoloGame(page);
    await playAllCards(page);
    await shot(page, "07-achat-visible");
  });

  // ── 08 Journal ouvert ──────────────────────────────────────────────────
  test("08 — journal-ouvert", async ({ page }) => {
    await startSoloGame(page);
    await playAllCards(page);
    const journalBtn = page.getByRole("button", { name: /Journal/i });
    if (await journalBtn.isVisible()) {
      await journalBtn.click();
      await page.waitForTimeout(300);
    }
    await shot(page, "08-journal-ouvert");
  });

  // ── 09 Prêt pour fin de tour (ressources générées) ─────────────────────
  test("09 — pret-fin-tour", async ({ page }) => {
    await startSoloGame(page);
    await playAllCards(page);
    await expect(page.getByRole("button", { name: /Fin du tour/i })).toBeVisible();
    await shot(page, "09-pret-fin-tour");
  });

  // ── 10 Tour bot — bannière ──────────────────────────────────────────────
  test("10 — tour-bot", async ({ page }) => {
    await startSoloGame(page);
    await playAllCards(page);
    const fin = page.getByRole("button", { name: /Fin du tour/i });
    await fin.click();
    await page.waitForTimeout(500);
    await shot(page, "10-tour-bot");
  });

  // ── 11 Retour tour humain (tour 2) ─────────────────────────────────────
  test("11 — retour-tour-humain", async ({ page }) => {
    await startSoloGame(page);
    await playAllCards(page);
    await endTurnAndWaitBack(page);
    await shot(page, "11-retour-tour-humain");
  });

  // ── 12 Base ou avant-poste en jeu (best effort — tour 2+) ──────────────
  test("12 — base-en-jeu-best-effort", async ({ page }) => {
    await startSoloGame(page);
    await playAllCards(page);
    // Try buying a card if affordable
    const achatBtns = page.getByRole("button", { name: "ACHAT" });
    if (await achatBtns.count() > 0) {
      await achatBtns.first().click();
      await page.waitForTimeout(200);
    }
    await endTurnAndWaitBack(page);
    await playAllCards(page);
    await shot(page, "12-base-en-jeu");
  });

  // ── 13 Fin de partie (abandon) ─────────────────────────────────────────
  test("13 — fin-de-partie", async ({ page }) => {
    await startSoloGame(page);
    page.on("dialog", async d => { await d.accept(); });
    const concedeBtn = page.getByRole("button", { name: /Abandonner/i });
    await concedeBtn.click();
    await page.waitForTimeout(700);
    await shot(page, "13-game-over");
  });
});
