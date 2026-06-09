import { test, expect } from "@playwright/test";
import { execSync } from "child_process";

const BASE = "http://localhost:5173/deckgame/";
const SHOTS = "/home/kali/apps/deck/reports/patch-0056/screenshots/";

test.beforeAll(async () => { execSync("mkdir -p " + SHOTS); });

test.describe("A. Barre d'actions — portrait", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("A1 — Portrait : boutons principaux visibles", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.screenshot({ path: SHOTS + "A1-portrait-actions.png" });
    await expect(page.getByRole("button", { name: "Fin du tour" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Journal" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Abandonner" }).first()).toBeVisible();
  });

  test("A2 — Portrait : Abandonner moins grand que Fin du tour", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    const endBtn = page.getByRole("button", { name: "Fin du tour" }).first();
    const concedeBtn = page.getByRole("button", { name: "Abandonner" }).first();
    const endBox = await endBtn.boundingBox();
    const concedeBox = await concedeBtn.boundingBox();
    expect(endBox!.height).toBeGreaterThan(concedeBox!.height);
  });

  test("A3 — Portrait : Fin du tour désactivé pendant tour bot", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.getByRole("button", { name: "Fin du tour" }).first().click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: SHOTS + "A3-portrait-bot-turn.png" });
    await expect(page.getByRole("button", { name: "Fin du tour" }).first()).toBeDisabled();
  });
});

test.describe("B. Barre d'actions — paysage", () => {
  test.use({ viewport: { width: 844, height: 390 } });

  test("B1 — Paysage : boutons principaux visibles", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.screenshot({ path: SHOTS + "B1-landscape-actions.png" });
    await expect(page.getByRole("button", { name: "Fin du tour" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Journal" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Abandonner" }).first()).toBeVisible();
  });

  test("B2 — Paysage : Fin du tour désactivé pendant tour bot", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.getByRole("button", { name: "Fin du tour" }).first().click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: SHOTS + "B2-landscape-bot-turn.png" });
    await expect(page.getByRole("button", { name: "Fin du tour" }).first()).toBeDisabled();
  });
});
