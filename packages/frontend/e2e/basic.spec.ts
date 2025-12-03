import { test, expect } from '@playwright/test';

test('happy path: home -> catalog -> product -> cart -> profile', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/BRACE/i);

  await page.goto('/catalog');
  await expect(page.getByText(/каталог/i)).toBeVisible({ timeout: 5000 });

  await page.goto('/product/test-product');
  await expect(page.getByText(/загружаем товар/i)).toBeVisible({ timeout: 5000 });

  await page.goto('/cart');
  await expect(page.getByText(/Корзина/i)).toBeVisible({ timeout: 5000 });

  await page.goto('/profile');
  await expect(page.getByText(/Загружаем профиль/i)).toBeHidden({ timeout: 5000 });
  await expect(page.getByRole('heading', { name: /Профиль/i })).toBeVisible({ timeout: 5000 });
});
