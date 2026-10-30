const { test, expect } = require('@playwright/test');

// MISSION 3 — Add two realistic tests:
// (a) invalid email gives visible error without a POST to /api/reservations
// (b) a successful reservation; intercept/mock POST /api/reservations and assert
//     the JSON request payload and success message.

test('invalid email blocks reservation', async ({ page }) => {
  // Count any reservation POST that leaves the browser.
  let reservationPosts = 0;
  page.on('request', request => {
    if (request.method() === 'POST' && request.url().includes('/api/reservations')) reservationPosts++;
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Reserve at Central Square' }).click();
  await expect(page.getByRole('heading', { name: 'Reserve a bike' })).toBeVisible();
  await expect(page.getByText('Selected station: Central Square')).toBeVisible();

  await page.getByRole('textbox', { name: 'Email address' }).fill('student-at-example');
  await page.getByRole('button', { name: 'Confirm reservation' }).click();

  await expect(page.getByText('Enter a valid email address.')).toBeVisible();
  await expect(page.getByRole('status')).not.toContainText('Reservation confirmed');
  expect(reservationPosts).toBe(0);
});

test('reservation sends correct payload and confirms booking', async ({ page }) => {
  let requestBody;
  await page.route('**/api/reservations', async route => {
    expect(route.request().method()).toBe('POST');
    requestBody = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ reservationId: 'CB-DEMO-777', stationId: requestBody.stationId })
    });
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Reserve at Central Square' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('student@example.com');
  await page.getByRole('button', { name: 'Confirm reservation' }).click();

  await expect(page.getByRole('status')).toHaveText('Reservation confirmed: CB-DEMO-777');
  await expect(page.getByText('Enter a valid email address.')).toBeHidden();
  expect(requestBody).toEqual({ stationId: 'central', email: 'student@example.com' });
});
