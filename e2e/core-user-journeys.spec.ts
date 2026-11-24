import { expect, test } from '@playwright/test';

test.describe('BreatheWise AI browser journeys', () => {
  test('loads the public landing page with its primary actions', async ({ page }) => {
    await page.goto('/');

    const heading = page.getByRole('heading', { level: 1 });
    const banner = page.getByRole('banner');
    const openWorkspace = banner.getByRole('button', {
      name: 'Open Workspace',
      exact: true,
    });
    const configureFamily = page.getByRole('button', {
      name: /configure family/i,
    });

    await expect(heading).toBeVisible();
    await expect(openWorkspace).toBeVisible();
    await expect(configureFamily).toBeVisible();
  });

  test('opens the workspace and returns to the landing page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /launch family workspace/i }).click();

    const workspaceNavigation = page.getByRole('navigation', {
      name: 'Workspace navigation',
    });
    const overviewButton = workspaceNavigation.getByRole('button', {
      name: 'Overview',
      exact: true,
    });

    await expect(workspaceNavigation).toBeVisible();
    await expect(overviewButton).toBeVisible();

    await page.getByRole('button', { name: 'Product Overview', exact: true }).click();

    const openWorkspace = page
      .getByRole('banner')
      .getByRole('button', { name: 'Open Workspace', exact: true });

    await expect(openWorkspace).toBeVisible();
  });

  test('starts the guided household onboarding flow', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /configure family/i }).click();

    const householdName = page.getByLabel('Household Name', { exact: true });
    const language = page.getByLabel('Language', { exact: true });
    const saveButton = page.getByRole('button', { name: /save/i });

    await expect(householdName).toBeVisible();
    await expect(language).toBeVisible();
    await expect(saveButton).toBeVisible();
  });

  test('opens every primary workspace section', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /launch family workspace/i }).click();

    const navigation = page.getByRole('navigation', {
      name: 'Workspace navigation',
    });
    const routes = [
      { label: 'Family', heading: 'Family Onboarding & Local Profile' },
      { label: 'Air Quality', heading: 'Environmental Intelligence & Providers' },
      { label: 'Protection Planner', heading: 'Daily Protection Planner' },
      { label: 'What-If Simulator', heading: 'What-If Scenario Simulator' },
      { label: 'Locations', heading: 'Neighborhood & City Comparison' },
      { label: 'Reports', heading: 'History & Printable Reports' },
      { label: 'Settings', heading: 'Settings & Data Trust' },
    ];

    for (const route of routes) {
      await navigation.getByRole('button', { name: route.label, exact: true }).click();
      const main = page.getByRole('main');
      const heading = main.getByRole('heading', { name: route.heading });
      await expect(heading).toBeVisible();
    }
  });

  test('runs a PM2.5 spike scenario with a clear hypothetical label', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /launch family workspace/i }).click();

    const navigation = page.getByRole('navigation', {
      name: 'Workspace navigation',
    });
    await navigation.getByRole('button', { name: 'What-If Simulator', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'What-If Scenario Simulator' })).toBeVisible();
    await page.getByRole('button', { name: 'PM2.5 Spike', exact: true }).click();

    const scenarioNotice = page.getByText('SCENARIO — NOT AN OBSERVED ENVIRONMENTAL MEASUREMENT', {
      exact: true,
    });
    const scenarioTitle = page.getByRole('heading', { name: /What if PM2\.5 spikes to 145/ });
    const hypotheticalLabel = page.getByText('Hypothetical Scenario', { exact: true });

    await expect(scenarioNotice).toBeVisible();
    await expect(scenarioTitle).toBeVisible();
    await expect(hypotheticalLabel).toBeVisible();
  });
});
