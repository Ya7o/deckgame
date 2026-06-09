import { test, expect } from "@playwright/test";
import { execSync } from "child_process";

const BASE = "http://localhost:5173/deckgame/";
const SHOTS = "/home/kali/apps/deck/reports/patch-0054/screenshots/";

test.beforeAll(async () => { execSync("mkdir -p " + SHOTS); });

// ─── Section A : Glossaire portrait ──────────────────────────────────────────

test.describe("A. Glossaire — portrait", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("A1 — Portrait : bouton ? présent", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.screenshot({ path: SHOTS + "A1-portrait-debut.png" });
    await expect(page.getByRole("button", { name: "Glossaire" }).first()).toBeVisible();
  });

  test("A2 — Portrait : clic ? ouvre le glossaire avec les termes", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.getByRole("button", { name: "Glossaire" }).first().click();
    await page.screenshot({ path: SHOTS + "A2-portrait-glossaire.png" });
    await expect(page.locator("text=Glossaire").first()).toBeVisible();
    await expect(page.locator("text=Main").first()).toBeVisible();
    await expect(page.locator("text=Défausse").first()).toBeVisible();
  });

  test("A3 — Portrait : terme Écarter expliqué", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.getByRole("button", { name: "Glossaire" }).first().click();
    const body = await page.locator("body").textContent();
    expect(body).toContain("Retirer définitivement");
    await page.screenshot({ path: SHOTS + "A3-portrait-glossaire-ecarter.png" });
  });
});

// ─── Section B : Glossaire landscape ─────────────────────────────────────────

test.describe("B. Glossaire — paysage", () => {
  test.use({ viewport: { width: 844, height: 390 } });

  test("B1 — Paysage : bouton ? présent", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.screenshot({ path: SHOTS + "B1-landscape-debut.png" });
    await expect(page.getByRole("button", { name: "Glossaire" }).first()).toBeVisible();
  });

  test("B2 — Paysage : glossaire contient Effet allié", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.getByRole("button", { name: "Glossaire" }).first().click();
    await page.screenshot({ path: SHOTS + "B2-landscape-glossaire.png" });
    const body = await page.locator("body").textContent();
    expect(body).toContain("Effet allié");
    expect(body).toContain("même faction a été jouée ce tour");
  });
});
