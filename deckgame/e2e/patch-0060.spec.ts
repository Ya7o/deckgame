import { test, expect } from "@playwright/test";
import { execSync } from "child_process";

const BASE = "http://localhost:5173/deckgame/";
const SHOTS = "/home/kali/apps/deck/reports/patch-0060/screenshots/";

test.beforeAll(async () => { execSync("mkdir -p " + SHOTS); });

// ─── AUDIT FINAL V0.2 ─────────────────────────────────────────────────────────

test.describe("QA V0.2 — P1 résolus (paysage)", () => {
  test.use({ viewport: { width: 844, height: 390 } });

  test("01 — P1-1 : EN JEU présent en paysage", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.screenshot({ path: SHOTS + "01-landscape-debut.png" });
    await expect(page.locator("text=EN JEU").first()).toBeVisible();
  });

  test("02 — P1-2 : résumé bot visible après tour bot (✦ présent)", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.getByRole("button", { name: "Fin du tour" }).first().click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: SHOTS + "02-landscape-bot-summary.png" });
    const body = await page.locator("body").textContent();
    expect(body).toContain("✦");
  });

  test("03 — Paysage : layout complet visible", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.screenshot({ path: SHOTS + "03-landscape-layout.png" });
    await expect(page.locator("[data-layout='landscape']")).toBeVisible();
    await expect(page.locator("text=RANGÉE COMMERCIALE").first()).toBeVisible();
    await expect(page.locator("text=MAIN").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Fin du tour" }).first()).toBeEnabled();
  });

  test("04 — Paysage : Fin du tour désactivé pendant bot", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.getByRole("button", { name: "Fin du tour" }).first().click();
    await page.waitForTimeout(200);
    await expect(page.getByRole("button", { name: "Fin du tour" }).first()).toBeDisabled();
    await page.waitForTimeout(1200);
    await expect(page.getByRole("button", { name: "Fin du tour" }).first()).toBeEnabled();
    await page.screenshot({ path: SHOTS + "04-landscape-retour-tour.png" });
  });

  test("05 — Paysage : journal disponible et fonctionne", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.getByRole("button", { name: "Fin du tour" }).first().click();
    await page.waitForTimeout(1200);
    await page.getByRole("button", { name: "Journal" }).first().click();
    await page.screenshot({ path: SHOTS + "05-landscape-journal.png" });
    await expect(page.locator("button[aria-label='Fermer le journal']")).toBeVisible();
    await page.locator("button[aria-label='Fermer le journal']").click();
  });

  test("06 — Paysage : glossaire accessible", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.getByRole("button", { name: "Glossaire" }).first().click();
    await page.screenshot({ path: SHOTS + "06-landscape-glossaire.png" });
    const body = await page.locator("body").textContent();
    for (const term of ["Main", "Pioche", "Défausse", "Avant-poste", "Autorité"]) {
      expect(body).toContain(term);
    }
    await page.locator("button").filter({ hasText: "✕" }).last().click();
  });
});

test.describe("QA V0.2 — Portrait non régressé", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("07 — Portrait : layout intact", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.screenshot({ path: SHOTS + "07-portrait-intact.png" });
    await expect(page.locator("[data-layout='portrait']")).toBeVisible();
    await expect(page.getByRole("button", { name: "Fin du tour" }).first()).toBeVisible();
  });

  test("08 — Portrait : journal cycle", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.getByRole("button", { name: "Journal" }).first().click();
    await expect(page.locator("button[aria-label='Fermer le journal']")).toBeVisible();
    await page.locator("button[aria-label='Fermer le journal']").click();
    await page.screenshot({ path: SHOTS + "08-portrait-journal.png" });
    await expect(page.getByRole("button", { name: "Fin du tour" }).first()).toBeVisible();
  });

  test("09 — Portrait : résumé bot après tour", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.getByRole("button", { name: "Fin du tour" }).first().click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: SHOTS + "09-portrait-summary.png" });
    const body = await page.locator("body").textContent();
    expect(body).toContain("✦");
  });

  test("10 — Portrait : Abandonner < Fin du tour", async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    await page.screenshot({ path: SHOTS + "10-portrait-actions.png" });
    const endBox = await page.getByRole("button", { name: "Fin du tour" }).first().boundingBox();
    const concedeBox = await page.getByRole("button", { name: "Abandonner" }).first().boundingBox();
    expect(endBox!.height).toBeGreaterThan(concedeBox!.height);
  });
});

test.describe("QA V0.2 — Partie complète paysage", () => {
  test.use({ viewport: { width: 844, height: 390 } });

  test("11 — Paysage : 5 tours sans erreur JS", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.goto(BASE);
    await page.getByRole("button", { name: /bot/i }).click();
    for (let i = 0; i < 4; i++) {
      await page.getByRole("button", { name: "Fin du tour" }).first().click();
      await page.waitForTimeout(1400);
    }
    await page.screenshot({ path: SHOTS + "11-landscape-5tours.png" });
    expect(errors).toHaveLength(0);
    await expect(page.getByRole("button", { name: "Fin du tour" }).first()).toBeEnabled();
  });

  test("12 — Paysage : StartScreen → Fin du tour → pas de régression", async ({ page }) => {
    await page.goto(BASE);
    await page.screenshot({ path: SHOTS + "12-startscreen.png" });
    await expect(page.locator("text=DECKGAME V0").first()).toBeVisible();
    await page.getByRole("button", { name: /bot/i }).click();
    await expect(page.locator("[data-layout='landscape']")).toBeVisible();
    await page.getByRole("button", { name: "Fin du tour" }).first().click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: SHOTS + "12-landscape-tour2.png" });
    await expect(page.getByRole("button", { name: "Fin du tour" }).first()).toBeEnabled();
  });
});
