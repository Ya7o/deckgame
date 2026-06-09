import { test, expect } from "@playwright/test";
import { execSync } from "child_process";

const BASE = "http://localhost:5173/deckgame/";
const SHOTS = "/home/kali/apps/deck/reports/patch-0055/screenshots/";

test.beforeAll(async () => { execSync("mkdir -p " + SHOTS); });

test.describe("A. Bases portrait", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("A1 — Portrait : démarrage sans avant-poste, pas de message bloquant", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.screenshot({ path: SHOTS + "A1-portrait-debut.png" });
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("détruisez-le");
  });

  test("A2 — Portrait : glossaire définit Avant-poste", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.getByRole("button", { name: "Glossaire" }).first().click();
    await page.screenshot({ path: SHOTS + "A2-portrait-glossaire-base.png" });
    const body = await page.locator("body").textContent();
    expect(body).toContain("Avant-poste");
    expect(body).toContain("doit être détruite avant d'attaquer l'adversaire");
  });

  test("A3 — Portrait : partie fonctionnelle après 2 tours", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.getByRole("button", { name: "Fin du tour" }).first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: SHOTS + "A3-portrait-tour2.png" });
    await expect(page.getByRole("button", { name: "Fin du tour" }).first()).toBeVisible();
  });
});

test.describe("B. Bases paysage", () => {
  test.use({ viewport: { width: 844, height: 390 } });

  test("B1 — Paysage : démarrage sans avant-poste", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.screenshot({ path: SHOTS + "B1-landscape-debut.png" });
    await expect(page.getByRole("button", { name: "Fin du tour" }).first()).toBeVisible();
  });

  test("B2 — Paysage : glossaire Avant-poste défini", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.getByRole("button", { name: "Glossaire" }).first().click();
    await page.screenshot({ path: SHOTS + "B2-landscape-glossaire.png" });
    const body = await page.locator("body").textContent();
    expect(body).toContain("Avant-poste");
  });
});
