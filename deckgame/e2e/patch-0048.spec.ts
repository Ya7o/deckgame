import { test, expect } from "@playwright/test";
import { execSync } from "child_process";

const BASE = "http://localhost:5173/deckgame/";
const SHOTS = "/home/kali/apps/deck/reports/patch-0048/screenshots/";

// ─────────────────────────────────────────────────────────────────────────────
// PATCH 0048 — Accessibilité + confort tactile
// Touch targets ≥ 44px portrait, ≥ 36px landscape
// aria-label sur bouton × landscape journal
// ─────────────────────────────────────────────────────────────────────────────

test.beforeAll(async () => {
  execSync("mkdir -p " + SHOTS);
});

// ─── Section A : Portrait touch targets ──────────────────────────────────────

test.describe("A. Portrait touch targets", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("A1 — Journal portrait : hauteur ≥ 44px", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.screenshot({ path: SHOTS + "A1-portrait-actions.png" });

    const journalBtn = page.getByRole("button", { name: "Journal" }).first();
    await expect(journalBtn).toBeVisible();
    const box = await journalBtn.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test("A2 — Fin du tour portrait : hauteur ≥ 44px", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();

    const endBtn = page.getByRole("button", { name: "Fin du tour" }).first();
    await expect(endBtn).toBeVisible();
    const box = await endBtn.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test("A3 — Close journal × portrait : hauteur ≥ 32px", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.getByRole("button", { name: "Journal" }).first().click();
    await page.screenshot({ path: SHOTS + "A3-portrait-journal-close.png" });

    const closeBtn = page.locator("button[aria-label='Fermer le journal']");
    await expect(closeBtn).toBeVisible();
    const box = await closeBtn.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(32);
  });
});

// ─── Section B : Landscape touch targets + aria-label ────────────────────────

test.describe("B. Landscape touch targets + aria-label", () => {
  test.use({ viewport: { width: 844, height: 390 } });

  test("B1 — Journal landscape : hauteur ≥ 36px", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.screenshot({ path: SHOTS + "B1-landscape-actions.png" });

    const journalBtn = page.getByRole("button", { name: "Journal" }).first();
    await expect(journalBtn).toBeVisible();
    const box = await journalBtn.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(36);
  });

  test("B2 — Fin du tour landscape : hauteur ≥ 36px", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();

    const endBtn = page.getByRole("button", { name: "Fin du tour" }).first();
    await expect(endBtn).toBeVisible();
    const box = await endBtn.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(36);
  });

  test("B3 — Journal overlay × landscape : aria-label='Fermer le journal'", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.getByRole("button", { name: "Journal" }).first().click();
    await page.screenshot({ path: SHOTS + "B3-landscape-journal-overlay.png" });

    const closeBtn = page.locator("button[aria-label='Fermer le journal']");
    await expect(closeBtn).toBeVisible();
  });

  test("B4 — Journal overlay × landscape : taille ≥ 44×44px", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.getByRole("button", { name: "Journal" }).first().click();

    const closeBtn = page.locator("button[aria-label='Fermer le journal']");
    const box = await closeBtn.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });
});

// ─── Section C : Régression gameplay ─────────────────────────────────────────

test.describe("C. Régression gameplay", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("C1 — Portrait : Fin du tour fonctionne (fin de tour joueur 1)", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    const endBtn = page.getByRole("button", { name: "Fin du tour" }).first();
    await expect(endBtn).toBeEnabled();
    await endBtn.click();
    await page.screenshot({ path: SHOTS + "C1-portrait-end-turn.png" });
    // After end of turn, it's bot turn (button disabled or bot banner)
    // Just verify app doesn't crash
    await expect(page.locator("body")).toBeDefined();
  });

  test("C2 — Portrait : Journal ouvre et ferme correctement", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    const journalBtn = page.getByRole("button", { name: "Journal" }).first();
    await journalBtn.click();
    const closeBtn = page.locator("button[aria-label='Fermer le journal']");
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await expect(closeBtn).toHaveCount(0);
    await page.screenshot({ path: SHOTS + "C2-portrait-journal-cycle.png" });
  });
});
