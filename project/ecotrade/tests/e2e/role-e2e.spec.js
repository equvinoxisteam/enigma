import { test, expect } from '@playwright/test';

const roles = [
  {
    name: 'buyer',
    email: 'buyer.e2e@example.com',
    password: 'E2eTest@123',
    expectedRoleLabelRegex: /Buyer/i,
    visibleTabs: ['/manufacturers-pool', '/start-rfq', '/my-rfqs', '/my-manufacturers'],
    forbiddenTabs: ['/rfqs-pool', '/accepted-rfqs']
  },
  {
    name: 'seller',
    email: 'seller.e2e@example.com',
    password: 'E2eTest@123',
    expectedRoleLabelRegex: /(Seller|Manufacturer)/i,
    visibleTabs: ['/rfqs-pool', '/accepted-rfqs', '/invitations', '/analytics'],
    forbiddenTabs: ['/start-rfq', '/manufacturers-pool']
  },
  {
    name: 'hybrid',
    email: 'hybrid.e2e@example.com',
    password: 'E2eTest@123',
    expectedRoleLabelRegex: /Hybrid/i,
    visibleTabs: ['/rfqs-pool', '/accepted-rfqs', '/invitations', '/analytics', '/manufacturers-pool', '/start-rfq', '/my-rfqs', '/my-manufacturers'],
    forbiddenTabs: []
  }
];

async function login(page, email, password) {
  await page.goto('/login');
  await page.fill('#login-email', email);
  await page.fill('#login-password', password);
  await page.click('#login-submit-btn');
  await page.waitForURL('**/dashboard', { timeout: 30000 });
}

async function assertPageLoads(page, path) {
  await page.goto(path);
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('text=Server error')).toHaveCount(0);
}

for (const role of roles) {
  test.describe(`${role.name} role E2E`, () => {
    test(`core tabs and guards work for ${role.name}`, async ({ page }) => {
      await login(page, role.email, role.password);

      // Dashboard & role badge
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.getByText(role.expectedRoleLabelRegex).first()).toBeVisible();

      // Visible tabs should load
      for (const tab of role.visibleTabs) {
        await assertPageLoads(page, tab);
      }

      // Forbidden tabs should redirect to dashboard
      for (const tab of role.forbiddenTabs) {
        await page.goto(tab);
        await page.waitForLoadState('domcontentloaded');
        await expect(page).toHaveURL(/\/dashboard/);
      }

      // Pricing page should render plan sections
      await assertPageLoads(page, '/pricing');
      await expect(page.locator('text=Manufacturer & Hybrid Plans')).toBeVisible();
      await expect(page.locator('text=Buyer Plan (Always Free)')).toBeVisible();

      // Role-specific flow checks
      if (role.name === 'buyer' || role.name === 'hybrid') {
        await page.goto('/start-rfq');
        await page.waitForLoadState('domcontentloaded');
        await expect(page.locator('main')).toBeVisible();
      }

      if (role.name === 'seller' || role.name === 'hybrid') {
        await page.goto('/rfqs-pool');
        await page.waitForLoadState('domcontentloaded');
        await expect(page.locator('main')).toBeVisible();
        await expect(page.getByText('E2E Open RFQ')).toBeVisible();

        const firstRfqLink = page.locator('a[href*="/rfqs-pool/"]').first();
        if (await firstRfqLink.count()) {
          await firstRfqLink.click();
          await page.waitForLoadState('domcontentloaded');
          await expect(page.locator('main')).toBeVisible();
        }

        await page.goto('/accepted-rfqs');
        await page.waitForLoadState('domcontentloaded');
        const acceptedLink = page.locator('a[href*="/accepted-rfqs/"]').first();
        if (await acceptedLink.count()) {
          await acceptedLink.click();
          await page.waitForLoadState('domcontentloaded');
          await expect(page.getByText('Production & Chat')).toBeVisible();
          await page.getByRole('button', { name: 'Production & Chat' }).click();
          await expect(page.getByRole('heading', { name: 'Chat' })).toBeVisible();
        }
      }

      await page.goto('/invitations');
      await page.waitForLoadState('domcontentloaded');
      if (role.name === 'buyer') {
        await expect(page).toHaveURL(/\/dashboard/);
      } else {
        await expect(page.locator('main')).toBeVisible();
        await expect(page.getByText('E2E Open RFQ')).toBeVisible();
      }
    });
  });
}
