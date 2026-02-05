import { expect, test } from '@playwright/test'

test('landing page and auth links should be reachable', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'AERO CRM' })).toBeVisible()

  await page.getByRole('link', { name: /giriş|sign in/i }).first().click()
  await expect(page).toHaveURL(/\/login/)

  await page.goto('/register')
  await expect(page).toHaveURL(/\/register/)
})
