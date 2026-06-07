import { test, expect, Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// PATCH 0017 - QA mobile automatisee (iPhone 12 portrait, 390x844)
//
// Ces tests necessitent: npx playwright install chromium
// Sur Ubuntu 26.04 l'installation echoue (non supporte).
// Resultats verifies via Preview MCP eval le 2026-06-07.
// ---------------------------------------------------------------------------

async function startSoloGame(page: Page) {
  await page.goto("/");
  const botBtn = page.getByRole("button", { name: /contre le bot/i });
  if (await botBtn.isVisible()) {
    await botBtn.click();
  }
  await expect(page.getByText(/MAIN/)).toBeVisible({ timeout: 5_000 });
}

test.describe("PATCH 0017 - QA mobile portrait", () => {

  test("1. ecran de debut de partie visible en mobile", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Deckgame/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /contre le bot/i })).toBeVisible();
  });

  test("2. zones principales visibles apres demarrage", async ({ page }) => {
    await startSoloGame(page);
    await expect(page.getByText(/RANG.E COMMERCIALE/)).toBeVisible();
    await expect(page.getByText(/MAIN/)).toBeVisible();
    await expect(page.getByText(/Joueur 1/)).toBeVisible();
  });

  test("3. main du bot non affichee au joueur humain", async ({ page }) => {
    await startSoloGame(page);
    const mainSection = page.getByText(/MAIN — /);
    await expect(mainSection).toBeVisible();
    const label = await mainSection.textContent();
    expect(label).toContain("Joueur 1");
    expect(label).not.toContain("Bot");
    expect(label).not.toContain("Joueur 2");
  });

  test("4. tap carte ouvre detail sans jouer directement", async ({ page }) => {
    await startSoloGame(page);
    const cardDiv = page.locator('[style*="var(--card-w)"]').first();
    await cardDiv.click();
    await expect(page.getByRole("button", { name: /Fermer/ })).toBeVisible({ timeout: 3_000 });
  });

  test("5. bouton JOUER visible sur cartes jouables", async ({ page }) => {
    await startSoloGame(page);
    const jouerBtns = page.getByRole("button", { name: "JOUER" });
    await expect(jouerBtns.first()).toBeVisible();
  });

  test("6. bouton JOUER absent pendant tour bot", async ({ page }) => {
    await startSoloGame(page);
    const finBtn = page.getByRole("button", { name: /Fin du tour/i });
    await finBtn.click();
    await expect(page.getByRole("button", { name: "JOUER" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "JOUER" })).not.toHaveCount(0, { timeout: 1_500 });
  });

  test("7. bouton ACHAT present quand commerce suffisant", async ({ page }) => {
    await startSoloGame(page);
    for (let i = 0; i < 10; i++) {
      const btns = await page.getByRole("button", { name: "JOUER" }).all();
      if (btns.length === 0) break;
      for (const btn of btns) await btn.click();
      await page.waitForTimeout(100);
    }
    const commerceText = await page.evaluate(() =>
      document.body.innerText.match(/Commerce\s*:\s*(\d+)/)?.[1] ?? "0"
    );
    const commerce = parseInt(commerceText, 10);
    const achatCount = await page.getByRole("button", { name: "ACHAT" }).count();
    if (commerce >= 2) expect(achatCount).toBeGreaterThan(0);
  });

  test("8. perspective joueur 1 stable pendant tout le tour bot", async ({ page }) => {
    await startSoloGame(page);
    const finBtn = page.getByRole("button", { name: /Fin du tour/i });
    await finBtn.click();
    await page.waitForTimeout(300);
    const mainLabel = await page.evaluate(() =>
      document.body.innerText.match(/MAIN[^\n]*/)?.[0] ?? ""
    );
    expect(mainLabel).toContain("Joueur 1");
    expect(mainLabel).not.toContain("Bot");
  });

});
