import { expect, test } from '@playwright/test';

test.describe('BreatheWise AI browser journeys', () => {
  test('loads the public landing page with its primary actions', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /open workspace/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /configure family/i })).toBeVisible();
  });

  test('opens the workspace and returns to the landing page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /open app/i }).click();

    await expect(page.getByRole('navigation', { name: 'Workspace navigation' })).toBeVisible();
    await expect(page.getByRole('button', { name: /overview/i })).toBeVisible();

    await page.getByRole('button', { name: /product overview/i }).click();
    await expect(page.getByRole('button', { name: /open app/i })).toBeVisible();
  });

  test('starts the guided household onboarding flow', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /start onboarding/i }).click();

    await expect(page.getByLabel('Household Name')).toBeVisible();
    await expect(page.getByLabel('Language')).toBeVisible();
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
  });
});
