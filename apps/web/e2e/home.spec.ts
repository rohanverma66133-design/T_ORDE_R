import { expect, test } from '@playwright/test';

test('home page presents the platform foundation', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /grocery and medicine delivery/i })).toBeVisible();
});
