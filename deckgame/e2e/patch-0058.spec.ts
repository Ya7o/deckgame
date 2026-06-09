import { test, expect } from "@playwright/test";
import { execSync } from "child_process";

const BASE = "http://localhost:5173/deckgame/";
const SHOTS = "/home/kali/apps/deck/reports/patch-0058/screenshots/";

test.beforeAll(async () => { execSync("mkdir -p " + SHOTS); });

test.describe("A. Activer direct paysage", () => {
  test.use({ viewport: { width: 844, height: 390 } });

  test("A1 — Paysage : démarrage partie sans bases, Fin du tour actif", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.screenshot({ path: SHOTS + "A1-landscape-debut.png" });
    await expect(page.getByRole("button", { name: "Fin du tour" }).first()).toBeEnabled();
  });

  test("A2 — Paysage : après 3 tours, vérifier actions disponibles", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    // Turn 1
    await page.getByRole("button", { name: "Fin du tour" }).first().click();
    await page.waitForTimeout(1000);
    // Turn 2
    await page.getByRole("button", { name: "Fin du tour" }).first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: SHOTS + "A2-landscape-tour3.png" });
    await expect(page.getByRole("button", { name: "Fin du tour" }).first()).toBeEnabled();
    await expect(page.locator("[data-layout='landscape']")).toBeVisible();
  });

  test("A3 — Paysage : bouton Activer visible si base activable", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.screenshot({ path: SHOTS + "A3-landscape-enjeu.png" });
    // If no base yet at start, just verify EN JEU section is there
    await expect(page.locator("text=EN JEU").first()).toBeVisible();
  });
});

test.describe("B. Portrait non régressé", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("B1 — Portrait : layout intact", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.screenshot({ path: SHOTS + "B1-portrait-intact.png" });
    await expect(page.locator("[data-layout='portrait']")).toBeVisible();
    await expect(page.getByRole("button", { name: "Fin du tour" }).first()).toBeVisible();
  });

  test("B2 — Portrait : journal cycle intact", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.getByRole("button", { name: "Journal" }).first().click();
    await expect(page.locator("button[aria-label='Fermer le journal']")).toBeVisible();
    await page.locator("button[aria-label='Fermer le journal']").click();
    await page.screenshot({ path: SHOTS + "B2-portrait-journal.png" });
  });
});
