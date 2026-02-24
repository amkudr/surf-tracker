import { test, expect, request } from '@playwright/test';

test('register → create surfboard → create session with review → delete session & surfboard', async ({ page }) => {
  const unique = Date.now();
  const email = `e2e_user_${unique}@example.com`;
  const password = 'Playwright1!';
  const surfboardName = `E2E Board ${unique}`;

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

  // Background API setup: Create a spot so we have one to select
  await api.post('/spot/', {
    data: {
      name: `Background Spot ${unique}`,
      latitude: 0,
      longitude: 0,
    },
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  // Go straight to Surfboards (skip dashboard render)
  await page.goto('/');
  await page.getByRole('link', { name: 'Surfboards' }).click();

  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(/\/surfboards$/);
  
  const addBoardButton = page.getByRole('button', { name: /Add Surfboard/i }).first();
  await expect(addBoardButton).toBeVisible({ timeout: 30000 });
  await addBoardButton.click();

  await page.locator('input[name="name"]').fill(surfboardName);
  await page.locator('input[name="brand"]').fill('Test Brand');
  await page.locator('input[name="model"]').fill('Test Model');
  await page.locator('input[name="length_ft"]').fill('6.5');
  await page.locator('input[name="volume_liters"]').fill('35');
  await page.getByRole('button', { name: /^Save Board$/ }).click();

  await expect(page.getByText(surfboardName)).toBeVisible();

  // Create a surf session using an existing spot and the new surfboard
  await page.getByRole('link', { name: 'Sessions' }).click();
  await expect(page).toHaveURL(/\/sessions$/);
  await page.getByRole('button', { name: 'Add Session' }).click();

  // Select the first available spot
  const spotSelect = page.locator('select[name="spot_id"]');
  await spotSelect.selectOption({ index: 1 });
  
  // Select the new surfboard
  const surfboardSelect = page.locator('select[name="surfboard_id"]');
  await surfboardSelect.selectOption({ label: `${surfboardName} (Test Brand) - 6.5'` });

  // Enable Session Review
  await page.getByText('Session review').click();

  // Fill in session review
  await page.locator('input[name="quality"]').fill('8');
  await page.locator('input[name="crowded_level"]').fill('3');
  await page.locator('input[name="wave_height_index"]').fill('6');
  await page.locator('input[name="wind_index"]').fill('2');

  // Form defaults are pre-filled; just save.
  await page.getByRole('button', { name: 'Save Session' }).click();

  await expect(page).toHaveURL(/\/sessions$/);

  // Accept the dialog that will appear when clicking delete
  page.on('dialog', dialog => dialog.accept());
  
  // Delete the session we just created
  const deleteSessionBtn = page.locator('table button[title="Delete session"]').first();
  await expect(deleteSessionBtn).toBeVisible({ timeout: 10000 });
  await deleteSessionBtn.click();
  
  // Wait for the delete to finish
  const deleteSessionPromise = page.waitForResponse(response => response.url().includes('/surf_session/') && response.request().method() === 'DELETE');
  await deleteSessionBtn.click({ force: true });
  await deleteSessionPromise;
  
  // Now delete the surfboard
  await page.getByRole('link', { name: 'Surfboards' }).click();
  await expect(page).toHaveURL(/\/surfboards$/);
  
  const boardCard = page.locator('.p-6').filter({ hasText: surfboardName });
  const deleteBoardBtn = boardCard.locator('.text-destructive');
  await expect(deleteBoardBtn).toBeVisible({ timeout: 10000 });
  
  // Wait for the delete to finish
  const deleteBoardPromise = page.waitForResponse(response => response.url().includes('/surfboard/') && response.request().method() === 'DELETE');
  await deleteBoardBtn.click();
  await deleteBoardPromise;
});
