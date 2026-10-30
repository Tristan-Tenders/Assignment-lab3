const { test, expect } = require('@playwright/test');

// MISSION 4 — Mock the first /api/stations GET as 503, confirm the error banner,
// then let Retry loading reach the real server and recover to 4 stations.

test('station API outage shows an error and retry restores results', async ({ page }) => {
  let attempts = 0;
  await page.route('**/api/stations', async route => {
    attempts++;
    if (attempts === 1) {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Service Unavailable' })
      });
    } else {
      await route.continue(); // let the real server answer
    }
  });

  await page.goto('/');

  const alert = page.getByRole('alert');
  await expect(alert).toBeVisible();
  await expect(alert).toContainText('Unable to load stations.');
  await expect(page.getByTestId('station-card')).toHaveCount(0);
  await expect(page.getByText('0 stations')).toBeVisible();

  await page.getByRole('button', { name: 'Retry loading' }).click();

  await expect(page.getByTestId('station-card')).toHaveCount(4);
  await expect(alert).toBeHidden();
  await expect(page.getByText('4 stations')).toBeVisible();
  expect(attempts).toBe(2);
});
