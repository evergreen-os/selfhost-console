import { test, expect } from '@playwright/test';

test('renders login screen', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /sign in to EvergreenOS/i })).toBeVisible();
});
