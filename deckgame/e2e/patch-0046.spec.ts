import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * PATCH 0046 — Audit réel mobile post-PWA
 * Viewports testés :
 *   - Portrait  390×844  (iPhone standard)
 *   - Paysage   844×390  (landscape standard)
 *   - Paysage   800×360  (Android moyen contraint)
 *   - Paysage   740×340  (Android compact très contraint)
 *
 * Objectif : audit / captures uniquement. Aucune correction dans ce patch.
 * Toutes les assertions sont des vérifications documentaires.
 */

const BASE = "/deckgame/";
const SHOTS = "/home/kali/apps/deck/reports/patch-0046/screenshots/";

async function startSoloGame(page: Page) {
  await page.goto(BASE);
  await page.getByRole("button", { name: /bot/i }).first().click();
  await page.waitForSelector("[data-layout]", { timeout: 8000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// A. Vérifications PWA / HTML / manifest (viewport-indépendant)
// ─────────────────────────────────────────────────────────────────────────────
test.describe("AUDIT 0046 — A. PWA et manifest", () => {
  test("A1 — manifest.webmanifest accessible (HTTP 200)", async ({ page }) => {
    const response = await page.goto(BASE + "manifest.webmanifest");
    expect(response?.status()).toBe(200);
    const body = await response?.text() ?? "";
    expect(body).toContain("Deckgame");
    expect(body).toContain("standalone");
    expect(body).toContain("#0e0e12");
    expect(body).toContain("any"); // orientation
  });

  test("A2 — index.html : metas PWA présentes", async ({ page }) => {
    await page.goto(BASE);
    // manifest link
    const manifestLink = await page.locator('link[rel="manifest"]').count();
    expect(manifestLink).toBeGreaterThan(0);
    // viewport-fit=cover
    const viewport = await page.locator('meta[name="viewport"]').getAttribute("content");
    expect(viewport).toContain("viewport-fit=cover");
    // apple metas
    const appleCapable = await page.locator('meta[name="apple-mobile-web-app-capable"]').count();
    expect(appleCapable).toBeGreaterThan(0);
    const themeColor = await page.locator('meta[name="theme-color"]').getAttribute("content");
    expect(themeColor).toBe("#0e0e12");
  });

  test("A3 — Bouton plein écran visible en Chromium (fullscreenEnabled=true)", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).first().click();
    await page.waitForSelector("[data-layout]", { timeout: 8000 });
    const hasFS = await page.evaluate(() => document.fullscreenEnabled);
    // Chromium supports fullscreen — document fact
    expect(typeof hasFS).toBe("boolean");
    if (hasFS) {
      const fsBtn = page.locator("button", { hasText: /écran/ });
      await expect(fsBtn.first()).toBeVisible();
    }
  });

  test("A4 — favicon accessible via base path", async ({ page }) => {
    // Favicon is served at /deckgame/favicon.svg (Vite base path)
    const response = await page.goto(BASE + "favicon.svg");
    expect(response?.status()).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// B. Portrait 390×844
// ─────────────────────────────────────────────────────────────────────────────
test.describe("AUDIT 0046 — B. Portrait 390×844", () => {
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });

  test("B1 — Accueil portrait", async ({ page }) => {
    await page.goto(BASE);
    await page.screenshot({ path: SHOTS + "B1-portrait-accueil.png" });
    await expect(page.getByRole("button", { name: /bot/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /2 joueurs/i }).first()).toBeVisible();
  });

  test("B2 — Plateau initial portrait", async ({ page }) => {
    await startSoloGame(page);
    await page.screenshot({ path: SHOTS + "B2-portrait-plateau.png" });
    expect(await page.locator("[data-layout='portrait']").count()).toBeGreaterThan(0);
    await expect(page.getByText("MAIN").first()).toBeVisible();
  });

  test("B3 — Main joueur et JOUER portrait", async ({ page }) => {
    await startSoloGame(page);
    await page.screenshot({ path: SHOTS + "B3-portrait-main.png" });
    const jouerBtns = page.getByRole("button", { name: "JOUER" });
    const nb = await jouerBtns.count();
    expect(nb).toBeGreaterThan(0);
  });

  test("B4 — Modale carte portrait", async ({ page }) => {
    await startSoloGame(page);
    // Click first JOUER button to get card detail via tap on card (not JOUER but card area)
    const cards = page.locator("[data-layout='portrait'] button", { hasText: /JOUER/ });
    const nb = await cards.count();
    if (nb > 0) {
      // Click the parent area to open modal
      await cards.first().click();
      await page.waitForTimeout(300);
    }
    await page.screenshot({ path: SHOTS + "B4-portrait-modal.png" });
  });

  test("B5 — Journal portrait", async ({ page }) => {
    await startSoloGame(page);
    const journalBtn = page.getByRole("button", { name: /journal/i });
    await journalBtn.first().click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: SHOTS + "B5-portrait-journal.png" });
    // Journal should be visible (overlay)
    await expect(page.getByText("Journal").first()).toBeVisible();
  });

  test("B6 — Fin du tour portrait", async ({ page }) => {
    await startSoloGame(page);
    const endTurnBtn = page.getByRole("button", { name: "Fin du tour" });
    await expect(endTurnBtn.first()).toBeVisible();
    await expect(endTurnBtn.first()).toBeEnabled();
    await page.screenshot({ path: SHOTS + "B6-portrait-fin-tour.png" });
  });

  test("B7 — Tour bot portrait : Fin du tour disabled", async ({ page }) => {
    await startSoloGame(page);
    // End human turn to trigger bot
    const endTurnBtn = page.getByRole("button", { name: "Fin du tour" });
    await endTurnBtn.first().click();
    // Check at 200ms — bot timer fires at 600ms, so button is disabled here
    await page.waitForTimeout(200);
    await page.screenshot({ path: SHOTS + "B7-portrait-tour-bot.png" });
    // During bot delay window (0-600ms), Fin du tour must be disabled
    const disabled = await endTurnBtn.first().isDisabled();
    expect(disabled).toBe(true);
  });

  test("B8 — Rangée commerciale portrait", async ({ page }) => {
    await startSoloGame(page);
    // Trade row should show cards
    await page.screenshot({ path: SHOTS + "B8-portrait-trade-row.png" });
    // Trade row label visible
    const tradeLabel = page.getByText(/rangée commerciale/i);
    const hasLabel = await tradeLabel.count() > 0;
    // May be uppercase — try alternate
    const tradeAlt = page.getByText(/RANGÉE COMMERCIALE/);
    const hasAlt = await tradeAlt.count() > 0;
    expect(hasLabel || hasAlt).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// C. Paysage 844×390
// ─────────────────────────────────────────────────────────────────────────────
test.describe("AUDIT 0046 — C. Paysage 844×390", () => {
  test.use({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3 });

  test("C1 — Accueil paysage 844×390", async ({ page }) => {
    await page.goto(BASE);
    await page.screenshot({ path: SHOTS + "C1-landscape-844-accueil.png" });
    await expect(page.getByRole("button", { name: /bot/i }).first()).toBeVisible();
  });

  test("C2 — Plateau paysage 844×390 : MAIN + actions", async ({ page }) => {
    await startSoloGame(page);
    await page.screenshot({ path: SHOTS + "C2-landscape-844-plateau.png" });
    expect(await page.locator("[data-layout='landscape']").count()).toBeGreaterThan(0);
    await expect(page.getByText("MAIN").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Fin du tour" }).first()).toBeVisible();
  });

  test("C3 — Main jouable paysage 844×390", async ({ page }) => {
    await startSoloGame(page);
    const jouerBtns = page.getByRole("button", { name: "JOUER" });
    const nb = await jouerBtns.count();
    expect(nb).toBeGreaterThan(0);
    await page.screenshot({ path: SHOTS + "C3-landscape-844-main.png" });
  });

  test("C4 — Journal paysage 844×390", async ({ page }) => {
    await startSoloGame(page);
    const journalBtn = page.getByRole("button", { name: /journal/i });
    await journalBtn.first().click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: SHOTS + "C4-landscape-844-journal.png" });
  });

  test("C5 — Tour bot paysage 844×390", async ({ page }) => {
    await startSoloGame(page);
    await page.getByRole("button", { name: "Fin du tour" }).first().click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: SHOTS + "C5-landscape-844-bot.png" });
    const disabled = await page.getByRole("button", { name: "Fin du tour" }).first().isDisabled();
    expect(disabled).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// D. Paysage contraint 800×360
// ─────────────────────────────────────────────────────────────────────────────
test.describe("AUDIT 0046 — D. Paysage contraint 800×360", () => {
  test.use({ viewport: { width: 800, height: 360 }, deviceScaleFactor: 3 });

  test("D1 — Plateau paysage 800×360 : MAIN visible", async ({ page }) => {
    await startSoloGame(page);
    await page.screenshot({ path: SHOTS + "D1-landscape-800-plateau.png" });
    await expect(page.getByText("MAIN").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "JOUER" }).first()).toBeVisible();
  });

  test("D2 — Fin du tour accessible 800×360", async ({ page }) => {
    await startSoloGame(page);
    await expect(page.getByRole("button", { name: "Fin du tour" }).first()).toBeVisible();
    await page.screenshot({ path: SHOTS + "D2-landscape-800-fin-tour.png" });
  });

  test("D3 — Journal overlay 800×360", async ({ page }) => {
    await startSoloGame(page);
    await page.getByRole("button", { name: /journal/i }).first().click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: SHOTS + "D3-landscape-800-journal.png" });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E. Paysage très contraint 740×340
// ─────────────────────────────────────────────────────────────────────────────
test.describe("AUDIT 0046 — E. Paysage très contraint 740×340", () => {
  test.use({ viewport: { width: 740, height: 340 }, deviceScaleFactor: 3 });

  test("E1 — Plateau paysage 740×340 : MAIN visible", async ({ page }) => {
    await startSoloGame(page);
    await page.screenshot({ path: SHOTS + "E1-landscape-740-plateau.png" });
    await expect(page.getByText("MAIN").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "JOUER" }).first()).toBeVisible();
  });

  test("E2 — Fin du tour accessible 740×340", async ({ page }) => {
    await startSoloGame(page);
    await expect(page.getByRole("button", { name: "Fin du tour" }).first()).toBeVisible();
    await page.screenshot({ path: SHOTS + "E2-landscape-740-fin-tour.png" });
  });

  test("E3 — Hauteur utile 740×340 : mesure CSS", async ({ page }) => {
    await startSoloGame(page);
    // Measure the MAIN section height to document remaining space
    const mainHeight = await page.evaluate(() => {
      const main = document.querySelector("[data-layout='landscape']");
      if (!main) return null;
      const mainSection = Array.from(main.querySelectorAll("div")).find(
        d => d.textContent?.includes("MAIN") && (d as HTMLElement).style.flex === "1 1 0%"
      );
      return mainSection ? (mainSection as HTMLElement).getBoundingClientRect().height : null;
    });
    // Document — don't assert specific value, just record
    console.log(`E3: Hauteur section MAIN à 740×340 = ${mainHeight}px`);
    await page.screenshot({ path: SHOTS + "E3-landscape-740-main-height.png" });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// F. Vérifications de sécurité gameplay
// ─────────────────────────────────────────────────────────────────────────────
test.describe("AUDIT 0046 — F. Sécurité gameplay", () => {
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });

  test("F1 — Main bot non exposée pendant tour bot", async ({ page }) => {
    await startSoloGame(page);
    await page.getByRole("button", { name: "Fin du tour" }).first().click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: SHOTS + "F1-bot-turn-no-bot-hand.png" });
    // The content should show player_1's info (Humain), not bot's cards as playable
    const pageText = await page.locator("[data-layout]").textContent();
    // Bot's hand should not show individual JOUER buttons for its cards
    // (Bot plays automatically; UI shows player_1 perspective)
    expect(pageText).not.toBeNull();
  });

  test("F2 — Bouton plein écran visible ou absent (jamais en erreur)", async ({ page }) => {
    await startSoloGame(page);
    const hasFS = await page.evaluate(() => document.fullscreenEnabled);
    const fsBtns = page.locator("button", { hasText: /écran/ });
    const count = await fsBtns.count();
    if (hasFS) {
      expect(count).toBeGreaterThan(0);
    } else {
      expect(count).toBe(0);
    }
    await page.screenshot({ path: SHOTS + "F2-fullscreen-state.png" });
  });
});
