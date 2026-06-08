import { test, expect, Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

// ---------------------------------------------------------------------------
// PATCH 0044 — Paysage sur viewport contraint (navigateur mobile réel)
// Viewports testés :
//   844×390 — Playwright théorique (base de référence)
//   800×360 — Android moyen en paysage avec barre d'adresse
//   740×340 — Android compact en paysage avec barres système visibles
// Captures : reports/patch-0044/screenshots/
// ---------------------------------------------------------------------------

const BASE = path.resolve(process.cwd(), "../reports/patch-0044/screenshots");
const APP  = "/deckgame/";

function dir(label: string) { return path.join(BASE, label); }
function ensureDirs() {
  ["ref-844x390", "contraint-800x360", "contraint-740x340", "portrait-390x844"]
    .forEach(d => fs.mkdirSync(dir(d), { recursive: true }));
}

async function shot(page: Page, folder: string, name: string) {
  await page.screenshot({ path: path.join(dir(folder), `${name}.png`), fullPage: false });
  console.log(`  📸 [${folder}] ${name}.png`);
}

async function startSolo(page: Page) {
  await page.goto(APP);
  await expect(page.getByRole("button", { name: /contre le bot/i })).toBeVisible({ timeout: 5_000 });
  await page.getByRole("button", { name: /contre le bot/i }).click();
  await expect(page.getByText(/MAIN/)).toBeVisible({ timeout: 5_000 });
}

async function playAll(page: Page) {
  for (let i = 0; i < 8; i++) {
    const btns = await page.getByRole("button", { name: "JOUER" }).all();
    if (!btns.length) break;
    await btns[0].click();
    await page.waitForTimeout(120);
  }
}

// ---------------------------------------------------------------------------
// REF — 844×390 (viewport Playwright standard)
// ---------------------------------------------------------------------------
test.describe("PATCH 0044 — REF 844×390 (viewport standard)", () => {
  test.use({ viewport: { width: 844, height: 390 } });
  test.beforeAll(() => { ensureDirs(); });

  test("REF-01 plateau debut partie", async ({ page }) => {
    await startSolo(page);
    await shot(page, "ref-844x390", "01-plateau");
  });

  test("REF-02 main jouable", async ({ page }) => {
    await startSolo(page);
    await expect(page.getByRole("button", { name: "JOUER" }).first()).toBeVisible();
    await shot(page, "ref-844x390", "02-main-jouable");
  });

  test("REF-03 modale carte", async ({ page }) => {
    await startSolo(page);
    await page.locator("[title]").first().click();
    await expect(page.getByRole("button", { name: /Fermer/i })).toBeVisible({ timeout: 3_000 });
    await shot(page, "ref-844x390", "03-modal");
  });

  test("REF-04 journal ouvert", async ({ page }) => {
    await startSolo(page);
    await playAll(page);
    const btn = page.getByRole("button", { name: /Journal/i });
    if (await btn.isVisible()) { await btn.click(); await page.waitForTimeout(250); }
    await shot(page, "ref-844x390", "04-journal");
  });

  test("REF-05 achat + fin de tour", async ({ page }) => {
    await startSolo(page);
    await playAll(page);
    await expect(page.getByRole("button", { name: /Fin du tour/i })).toBeVisible();
    await shot(page, "ref-844x390", "05-fin-tour");
  });
});

// ---------------------------------------------------------------------------
// CONTRAINT — 800×360 (Android moyen avec barre d'adresse)
// ---------------------------------------------------------------------------
test.describe("PATCH 0044 — CONTRAINT 800×360", () => {
  test.use({ viewport: { width: 800, height: 360 } });

  test("C360-01 plateau main visible", async ({ page }) => {
    await startSolo(page);
    // Hand must be visible
    await expect(page.getByText(/MAIN/)).toBeVisible();
    await expect(page.getByRole("button", { name: "JOUER" }).first()).toBeVisible();
    await shot(page, "contraint-800x360", "01-plateau-main");
  });

  test("C360-02 main jouable — bouton JOUER accessible", async ({ page }) => {
    await startSolo(page);
    const jouerBtns = await page.getByRole("button", { name: "JOUER" }).all();
    expect(jouerBtns.length).toBeGreaterThan(0);
    await shot(page, "contraint-800x360", "02-main-jouable");
  });

  test("C360-03 fin de tour visible", async ({ page }) => {
    await startSolo(page);
    await playAll(page);
    await expect(page.getByRole("button", { name: /Fin du tour/i })).toBeVisible();
    await shot(page, "contraint-800x360", "03-fin-tour");
  });

  test("C360-04 modale carte utilisable", async ({ page }) => {
    await startSolo(page);
    await page.locator("[title]").first().click();
    await expect(page.getByRole("button", { name: /Fermer/i })).toBeVisible({ timeout: 3_000 });
    await shot(page, "contraint-800x360", "04-modal");
  });

  test("C360-05 journal ouvre et main reste dans le DOM", async ({ page }) => {
    await startSolo(page);
    await playAll(page);
    const btn = page.getByRole("button", { name: /Journal/i });
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(250);
    }
    // MAIN text still visible in DOM (journal is absolute overlay)
    await expect(page.getByText(/MAIN/)).toBeVisible();
    await shot(page, "contraint-800x360", "05-journal");
  });
});

// ---------------------------------------------------------------------------
// CONTRAINT — 740×340 (Android compact avec barres système)
// ---------------------------------------------------------------------------
test.describe("PATCH 0044 — CONTRAINT 740×340", () => {
  test.use({ viewport: { width: 740, height: 340 } });

  test("C340-01 plateau main visible", async ({ page }) => {
    await startSolo(page);
    await expect(page.getByText(/MAIN/)).toBeVisible();
    await expect(page.getByRole("button", { name: "JOUER" }).first()).toBeVisible();
    await shot(page, "contraint-740x340", "01-plateau-main");
  });

  test("C340-02 main jouable — bouton JOUER accessible", async ({ page }) => {
    await startSolo(page);
    const jouerBtns = await page.getByRole("button", { name: "JOUER" }).all();
    expect(jouerBtns.length).toBeGreaterThan(0);
    await shot(page, "contraint-740x340", "02-main-jouable");
  });

  test("C340-03 fin de tour visible en viewport contraint", async ({ page }) => {
    await startSolo(page);
    await playAll(page);
    await expect(page.getByRole("button", { name: /Fin du tour/i })).toBeVisible();
    await shot(page, "contraint-740x340", "03-fin-tour");
  });
});

// ---------------------------------------------------------------------------
// PORTRAIT TEMOIN — 390×844 (non-régression)
// ---------------------------------------------------------------------------
test.describe("PATCH 0044 — Portrait témoin 390×844", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("PORT-01 plateau portrait intact", async ({ page }) => {
    await startSolo(page);
    await expect(page.getByText(/MAIN/)).toBeVisible();
    await shot(page, "portrait-390x844", "01-plateau");
  });

  test("PORT-02 main jouable portrait", async ({ page }) => {
    await startSolo(page);
    await expect(page.getByRole("button", { name: "JOUER" }).first()).toBeVisible();
    await shot(page, "portrait-390x844", "02-main-jouable");
  });
});
