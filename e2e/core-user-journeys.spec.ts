import { expect, test } from '@playwright/test';

test.describe('BreatheWise AI browser journeys', () => {
  test('loads the public landing page with its primary actions', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(
      page.getByRole('banner').getByRole('button', { name: 'Open Workspace', exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /configure family/i })).toBeVisible();
  });

  test('opens the workspace and returns to the landing page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /launch family workspace/i }).click();

    await expect(
      page.getByRole('navigation', { name: 'Workspace navigation' }),
    ).toBeVisible();
    await expect(
      page
        .getByRole('navigation', { name: 'Workspace navigation' })
        .getByRole('button', { name: 'Overview', exact: true }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Product Overview', exact: true }).click();
    await expect(
      page.getByRole('banner').getByRole('button', { name: 'Open Workspace', exact: true }),
    ).toBeVisible();
  });

  test('starts the guided household onboarding flow', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /configure family/i }).click();

    await expect(page.getByLabel('Household Name', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Language', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
  });
});
