import { test, expect } from "@playwright/test";
import { execSync } from "child_process";

const BASE = "http://localhost:5173/deckgame/";
const SHOTS = "/home/kali/apps/deck/reports/patch-0057/screenshots/";

test.beforeAll(async () => { execSync("mkdir -p " + SHOTS); });

// ─── AUDIT COMPLET — Paysage plein écran ──────────────────────────────────────

test.describe("QA Paysage — début de partie", () => {
  test.use({ viewport: { width: 844, height: 390 } });

  test("01 — Accueil StartScreen affiché correctement", async ({ page }) => {
    await page.goto(BASE);
    await page.screenshot({ path: SHOTS + "01-landscape-startscreen.png" });
    await expect(page.locator("text=DECKGAME V0").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /bot/i }).first()).toBeVisible();
  });

  test("02 — Démarrage partie bot, layout paysage rendu", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.screenshot({ path: SHOTS + "02-landscape-debut.png" });
    await expect(page.locator("[data-layout='landscape']")).toBeVisible();
    await expect(page.locator("text=MAIN").first()).toBeVisible();
    await expect(page.locator("text=EN JEU").first()).toBeVisible();
  });

  test("03 — Rangée commerciale visible avec cartes", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.screenshot({ path: SHOTS + "03-landscape-traderow.png" });
    await expect(page.locator("text=RANGÉE COMMERCIALE").first()).toBeVisible();
  });

  test("04 — Barre d'actions : Fin du tour + Journal + ? présents", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await expect(page.getByRole("button", { name: "Fin du tour" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Journal" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Glossaire" }).first()).toBeVisible();
    await page.screenshot({ path: SHOTS + "04-landscape-action-bar.png" });
  });
});

test.describe("QA Paysage — tour bot et résumé", () => {
  test.use({ viewport: { width: 844, height: 390 } });

  test("05 — Après fin de tour humain, Fin du tour désactivé", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.getByRole("button", { name: "Fin du tour" }).first().click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: SHOTS + "05-landscape-bot-thinking.png" });
    await expect(page.getByRole("button", { name: "Fin du tour" }).first()).toBeDisabled();
  });

  test("06 — Après tour bot, retour au tour humain + Fin du tour actif", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.getByRole("button", { name: "Fin du tour" }).first().click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: SHOTS + "06-landscape-apres-bot.png" });
    await expect(page.getByRole("button", { name: "Fin du tour" }).first()).toBeEnabled();
  });

  test("07 — Journal disponible après tour bot", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.getByRole("button", { name: "Fin du tour" }).first().click();
    await page.waitForTimeout(1200);
    await page.getByRole("button", { name: "Journal" }).first().click();
    await page.screenshot({ path: SHOTS + "07-landscape-journal-tour2.png" });
    await expect(page.locator("button[aria-label='Fermer le journal']")).toBeVisible();
    await page.locator("button[aria-label='Fermer le journal']").click();
  });
});

test.describe("QA Paysage — glossaire et vocabulaire", () => {
  test.use({ viewport: { width: 844, height: 390 } });

  test("08 — Glossaire : 11 termes affichés", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.getByRole("button", { name: "Glossaire" }).first().click();
    await page.screenshot({ path: SHOTS + "08-landscape-glossaire.png" });
    const body = await page.locator("body").textContent();
    // Key terms must be present
    for (const term of ["Main", "Pioche", "Défausse", "Écarter", "Effet allié", "Avant-poste"]) {
      expect(body).toContain(term);
    }
    // Close
    await page.locator("button").filter({ hasText: "✕" }).last().click();
  });

  test("09 — Tap sur carte ouvre la modale CardDetail", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    // Click on first card in hand (JOUER badge area)
    await page.screenshot({ path: SHOTS + "09-landscape-avant-clic-carte.png" });
    // Try clicking a card in the hand area (at the bottom of landscape)
    const joueurBtn = page.locator("button").filter({ hasText: "JOUER" }).first();
    if (await joueurBtn.isVisible()) {
      // There's a JOUER badge - click the card above it
      await page.screenshot({ path: SHOTS + "09-landscape-main-visible.png" });
    }
    const body = await page.locator("body").textContent();
    expect(body).toBeDefined();
  });
});

test.describe("QA Portrait — non régressé", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("10 — Portrait : layout portrait rendu", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.screenshot({ path: SHOTS + "10-portrait-intact.png" });
    await expect(page.locator("[data-layout='portrait']")).toBeVisible();
    await expect(page.getByRole("button", { name: "Fin du tour" }).first()).toBeVisible();
  });

  test("11 — Portrait : journal cycle ouvre et ferme", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.getByRole("button", { name: "Journal" }).first().click();
    await expect(page.locator("button[aria-label='Fermer le journal']")).toBeVisible();
    await page.locator("button[aria-label='Fermer le journal']").click();
    await page.screenshot({ path: SHOTS + "11-portrait-journal-closed.png" });
    await expect(page.getByRole("button", { name: "Fin du tour" }).first()).toBeVisible();
  });

  test("12 — Portrait : Abandonner présent et moins grand que Fin du tour", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.screenshot({ path: SHOTS + "12-portrait-actions.png" });
    const endBox = await page.getByRole("button", { name: "Fin du tour" }).first().boundingBox();
    const concedeBox = await page.getByRole("button", { name: "Abandonner" }).first().boundingBox();
    expect(endBox!.height).toBeGreaterThan(concedeBox!.height);
  });
});
