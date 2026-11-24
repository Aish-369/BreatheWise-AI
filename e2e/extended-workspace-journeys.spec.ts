import { expect, test } from '@playwright/test';

async function openWorkspace(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /launch family workspace/i }).click();
  const navigation = page.getByRole('navigation', { name: 'Workspace navigation' });
  await expect(navigation).toBeVisible();
  return navigation;
}

test.describe('BreatheWise AI extended browser journeys', () => {
  test('every primary workspace section opens its matching view', async ({ page }) => {
    const navigation = await openWorkspace(page);
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
      const heading = page
        .getByRole('main')
        .getByRole('heading', { name: route.heading });
      await expect(heading).toBeVisible();
    }
  });

  test(
    'a pollution-spike preset produces an explicitly hypothetical result',
    async ({ page }) => {
      const navigation = await openWorkspace(page);
      await navigation
        .getByRole('button', { name: 'What-If Simulator', exact: true })
        .click();

      await expect(
        page.getByRole('heading', { name: 'What-If Scenario Simulator' })
      ).toBeVisible();
      await page.getByRole('button', { name: 'PM2.5 Spike', exact: true }).click();

      await expect(
        page.getByText('SCENARIO — NOT AN OBSERVED ENVIRONMENTAL MEASUREMENT', {
          exact: true,
        })
      ).toBeVisible();
      await expect(
        page.getByRole('heading', { name: /What if PM2\.5 spikes to 145/ })
      ).toBeVisible();
      await expect(
        page.getByText('Hypothetical Scenario', { exact: true })
      ).toBeVisible();
    }
  );
});
