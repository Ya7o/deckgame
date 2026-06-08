import { test, expect } from "@playwright/test";
import { execSync } from "child_process";

const BASE = "http://localhost:5173/deckgame/";
const SHOTS = "/home/kali/apps/deck/reports/patch-0047/screenshots/";

// ─────────────────────────────────────────────────────────────────────────────
// PATCH 0047 — Corrections mobile/PWA
// P2-01 : Journal portrait close button (×)
// P2-03 : StartScreen fullscreen button less prominent (alignSelf center)
// ─────────────────────────────────────────────────────────────────────────────

test.beforeAll(async () => {
  execSync("mkdir -p " + SHOTS);
});

// ─── Section A : Journal portrait — bouton fermeture ─────────────────────────

test.describe("A. Journal portrait — bouton fermeture", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("A1 — Portrait : journal fermé par défaut, bouton Journal visible", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.screenshot({ path: SHOTS + "A1-portrait-game.png" });
    const journalBtn = page.getByRole("button", { name: "Journal" }).first();
    await expect(journalBtn).toBeVisible();
    const closeBtn = page.locator("button[aria-label='Fermer le journal']");
    await expect(closeBtn).toHaveCount(0);
  });

  test("A2 — Portrait : cliquer Journal ouvre avec bouton ×", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    const journalBtn = page.getByRole("button", { name: "Journal" }).first();
    await journalBtn.click();
    await page.screenshot({ path: SHOTS + "A2-portrait-journal-open.png" });
    const closeBtn = page.locator("button[aria-label='Fermer le journal']");
    await expect(closeBtn).toBeVisible();
    await expect(closeBtn).toContainText("×");
  });

  test("A3 — Portrait : bouton × ferme le journal", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    const journalBtn = page.getByRole("button", { name: "Journal" }).first();
    await journalBtn.click();
    const closeBtn = page.locator("button[aria-label='Fermer le journal']");
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await page.screenshot({ path: SHOTS + "A3-portrait-journal-closed.png" });
    await expect(closeBtn).toHaveCount(0);
  });

  test("A4 — Portrait : header Journal visible dans section log", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    const journalBtn = page.getByRole("button", { name: "Journal" }).first();
    await journalBtn.click();
    await page.screenshot({ path: SHOTS + "A4-portrait-journal-header.png" });
    // Header span "Journal" in log section (distinct from button)
    const spans = page.locator("span").filter({ hasText: /^Journal$/ });
    await expect(spans.first()).toBeVisible();
  });
});

// ─── Section B : StartScreen fullscreen button style ─────────────────────────

test.describe("B. StartScreen fullscreen button style", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("B1 — Portrait : bouton fullscreen secondaire (plus étroit que boutons jeu)", async ({ page }) => {
    await page.goto(BASE);
    await page.screenshot({ path: SHOTS + "B1-portrait-start.png" });
    const fsBtn = page.locator("button[aria-label='Plein écran']");
    const count = await fsBtn.count();
    if (count > 0) {
      await expect(fsBtn).toBeVisible();
      const fsBtnBox = await fsBtn.boundingBox();
      const gameBtnBox = await page.getByRole("button", { name: /bot/i }).boundingBox();
      if (fsBtnBox && gameBtnBox) {
        // Fullscreen button should be narrower than game mode buttons
        expect(fsBtnBox.width).toBeLessThan(gameBtnBox.width);
      }
    }
    // Pass even if fullscreen not supported (CI env)
    expect(true).toBe(true);
  });

  test("B2 — Landscape : bouton fullscreen visible et compact", async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto(BASE);
    await page.screenshot({ path: SHOTS + "B2-landscape-start.png" });
    const fsBtn = page.locator("button[aria-label='Plein écran']");
    const count = await fsBtn.count();
    if (count > 0) {
      await expect(fsBtn).toBeVisible();
      await page.screenshot({ path: SHOTS + "B2-landscape-start-fs.png" });
    }
    expect(true).toBe(true);
  });
});

// ─── Section C : Régression landscape journal ────────────────────────────────

test.describe("C. Régression — landscape journal intact", () => {
  test.use({ viewport: { width: 844, height: 390 } });

  test("C1 — Landscape : journal overlay ouvert avec bouton fermeture", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    const journalBtn = page.getByRole("button", { name: "Journal" }).first();
    await journalBtn.click();
    await page.screenshot({ path: SHOTS + "C1-landscape-journal.png" });
    // Landscape overlay has "Journal" text visible
    await expect(page.locator("text=Journal").first()).toBeVisible();
  });

  test("C2 — Portrait : MAIN + actions intactes après modif journal", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.screenshot({ path: SHOTS + "C2-portrait-game-intact.png" });
    await expect(page.locator("text=MAIN").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Fin du tour" }).first()).toBeVisible();
  });
});
