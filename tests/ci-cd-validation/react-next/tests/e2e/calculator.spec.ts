import { test, expect } from '@playwright/test';

test.describe('Calculator E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('has title and heading', async ({ page }) => {
    await expect(page).toHaveTitle(/CI\/CD Test App/);
    await expect(page.locator('h1')).toContainText('CI/CD Test Application');
  });

  test('performs basic calculation', async ({ page }) => {
    // Fill in the numbers
    await page.fill('input[aria-label="First number"]', '25');
    await page.fill('input[aria-label="Second number"]', '5');
    
    // Select operation
    await page.selectOption('select[aria-label="Operation"]', 'multiply');
    
    // Click calculate
    await page.click('button[aria-label="Calculate"]');
    
    // Check result
    await expect(page.locator('text=Result: 125')).toBeVisible();
  });

  test('handles division by zero', async ({ page }) => {
    await page.fill('input[aria-label="First number"]', '10');
    await page.fill('input[aria-label="Second number"]', '0');
    await page.selectOption('select[aria-label="Operation"]', 'divide');
    await page.click('button[aria-label="Calculate"]');
    
    await expect(page.locator('text=Cannot divide by zero')).toBeVisible();
  });

  test('handles invalid input', async ({ page }) => {
    await page.fill('input[aria-label="First number"]', 'abc');
    await page.click('button[aria-label="Calculate"]');
    
    await expect(page.locator('text=Please enter valid numbers')).toBeVisible();
  });

  test('performs all operations', async ({ page }) => {
    const operations = [
      { op: 'add', expected: '15' },
      { op: 'subtract', expected: '5' },
      { op: 'multiply', expected: '50' },
      { op: 'divide', expected: '2' },
    ];

    for (const { op, expected } of operations) {
      await page.fill('input[aria-label="First number"]', '10');
      await page.fill('input[aria-label="Second number"]', '5');
      await page.selectOption('select[aria-label="Operation"]', op);
      await page.click('button[aria-label="Calculate"]');
      
      await expect(page.locator(`text=Result: ${expected}`)).toBeVisible();
    }
  });

  test('is accessible', async ({ page }) => {
    // Check for proper ARIA labels
    await expect(page.locator('input[aria-label="First number"]')).toBeVisible();
    await expect(page.locator('input[aria-label="Second number"]')).toBeVisible();
    await expect(page.locator('select[aria-label="Operation"]')).toBeVisible();
    await expect(page.locator('button[aria-label="Calculate"]')).toBeVisible();
    
    // Check for keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('input[aria-label="First number"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('select[aria-label="Operation"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('input[aria-label="Second number"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('button[aria-label="Calculate"]')).toBeFocused();
  });

  test('works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.fill('input[aria-label="First number"]', '7');
    await page.fill('input[aria-label="Second number"]', '3');
    await page.click('button[aria-label="Calculate"]');
    
    await expect(page.locator('text=Result: 10')).toBeVisible();
  });
});