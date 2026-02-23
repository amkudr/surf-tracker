import { test, expect, request } from '@playwright/test';

test('register → create spot → create session → session visible', async ({ page }) => {
  const unique = Date.now();
  const email = `e2e_user_${unique}@example.com`;
  const password = 'Playwright1!';
  const spotName = `E2E Spot ${unique}`;

  // Register & login via API to avoid UI dependency
  const apiBase = process.env.API_BASE_URL ?? 'http://localhost:8000';
  const api = await request.newContext({ baseURL: apiBase });
  await api.post('/auth/register', { data: { email, password } });
  const loginResp = await api.post('/auth/login', {
    form: {
      username: email,
      password,
      remember_me: 'false',
    },
  });
  const { access_token: accessToken } = await loginResp.json();

  // Prime token before any page scripts run
  await page.addInitScript((token) => {
    localStorage.setItem('token', token);
  }, accessToken);

  // Go straight to Spots (skip dashboard render)
  await page.goto('/');
  await page.getByRole('link', { name: 'Spots' }).click();

  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(/\/spots$/);
  await expect(page.getByRole('heading', { name: 'Surf Spots', exact: true })).toBeVisible({ timeout: 30000 });
  const addSpotButton = page.getByRole('button', { name: /Add Spot/i }).first();
  await expect(addSpotButton).toBeVisible({ timeout: 30000 });
  await addSpotButton.click();

  await page.getByPlaceholder('Enter spot name').fill(spotName);
  await page.getByRole('button', { name: /^Add Spot$/ }).click();

  await expect(page.getByText(spotName)).toBeVisible();

  // Create a surf session using the new spot
  await page.getByRole('link', { name: 'Sessions' }).click();
  await expect(page).toHaveURL(/\/sessions$/);
  await page.getByRole('button', { name: 'Add Session' }).click();

  const spotSelect = page.locator('select[name="spot_id"]');
  await spotSelect.selectOption({ label: spotName });
  // Form defaults are pre-filled; just save.
  await page.getByRole('button', { name: 'Save Session' }).click();

  await expect(page).toHaveURL(/\/sessions$/);
  const sessionSpotCell = page.getByRole('cell', { name: spotName });
  await expect(sessionSpotCell).toBeVisible({ timeout: 30000 });
});
