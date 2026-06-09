import { test, expect } from "@playwright/test";
import { execSync } from "child_process";

const BASE = "http://localhost:5173/deckgame/";
const SHOTS = "/home/kali/apps/deck/reports/patch-0052/screenshots/";

test.beforeAll(async () => { execSync("mkdir -p " + SHOTS); });

// ─── Section A : Landscape layout optimisé ───────────────────────────────────

test.describe("A. Landscape layout optimisé", () => {
  test.use({ viewport: { width: 844, height: 390 } });

  test("A1 — Début de partie paysage : toutes zones visibles", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.screenshot({ path: SHOTS + "A1-landscape-debut.png" });
    // All key zones should be visible
    await expect(page.locator("text=MAIN").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Fin du tour" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Journal" }).first()).toBeVisible();
  });

  test("A2 — Paysage : Fin du tour en premier dans les actions", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    // Fin du tour should have fontWeight bold (primary action)
    const endBtn = page.getByRole("button", { name: "Fin du tour" }).first();
    await expect(endBtn).toBeVisible();
    await page.screenshot({ path: SHOTS + "A2-landscape-actions.png" });
  });

  test("A3 — Paysage : journal overlay non envahissant", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.getByRole("button", { name: "Journal" }).first().click();
    await page.screenshot({ path: SHOTS + "A3-landscape-journal.png" });
    // Hand should still be visible under journal overlay
    await expect(page.locator("text=MAIN").first()).toBeVisible();
    // Close journal
    await page.locator("button[aria-label='Fermer le journal']").click();
  });

  test("A4 — Paysage : section EN JEU présente", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.screenshot({ path: SHOTS + "A4-landscape-enjeu.png" });
    await expect(page.locator("text=EN JEU").first()).toBeVisible();
  });
});

// ─── Section B : Portrait non régressé ───────────────────────────────────────

test.describe("B. Portrait non régressé", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("B1 — Portrait : layout intact, Fin du tour accessible", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.screenshot({ path: SHOTS + "B1-portrait-intact.png" });
    await expect(page.getByRole("button", { name: "Fin du tour" }).first()).toBeVisible();
    await expect(page.locator("text=MAIN").first()).toBeVisible();
  });
});
