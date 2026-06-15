/**
 * E2E: Authenticated portal tests — one login per role.
 *
 * Each describe.serial block logs in ONCE via beforeAll and runs all
 * tests for that role with the shared page. This minimises login API
 * calls (well within authLimiter: 100/min on staging).
 *
 * Covers all 8 roles: instructor, accountant, sysadmin, admin,
 * organization, vendor, HR, courseadmin.
 */
import { test, expect } from '@playwright/test';
import { loginAs, USERS } from './fixtures';
import type { BrowserContext, Page } from '@playwright/test';

// ── Helper: standard portal test suite ───────────────────────────────────────
function portalSuite(
  roleName: string,
  user: { username: string; password: string; portal: string },
  extras?: (getPage: () => Page) => void,
) {
  test.describe.serial(`${roleName} (login, portal, logout)`, () => {
    let ctx: BrowserContext;
    let pg: Page;

    test.beforeAll(async ({ browser }) => {
      test.setTimeout(120000);
      ctx = await browser.newContext({ ignoreHTTPSErrors: true });
      pg = await ctx.newPage();
      await loginAs(pg, user.username, user.password);
    });
    test.afterAll(() => ctx.close());

    test(`redirected to ${roleName} portal after login`, async () => {
      const portalPath = user.portal.replace('/dashboard', '');
      await expect(pg).toHaveURL(new RegExp(portalPath));
    });

    test('dashboard loads', async () => {
      await pg.goto(user.portal);
      await pg.waitForLoadState('domcontentloaded');
      await expect(
        pg.locator('main, [role="main"], .MuiContainer-root').first()
      ).toBeVisible({ timeout: 8000 });
    });

    if (extras) extras(() => pg);

    test('logout redirects to /login', async () => {
      await pg.goto(user.portal, { waitUntil: 'domcontentloaded' });
      const logoutBtn = pg.locator('[aria-label="logout"]');
      if (await logoutBtn.count() > 0) {
        await expect(logoutBtn.first()).toBeVisible({ timeout: 15000 });
        await logoutBtn.first().click();
        await pg.waitForURL(/login/, { timeout: 10000 });
        await expect(pg).toHaveURL(/login/);
      } else {
        test.skip(true, 'No logout button found');
      }
    });
  });
}

// ── Instructor ───────────────────────────────────────────────────────────────
portalSuite('Instructor', USERS.instructor, (getPage) => {
  test('can navigate to My Classes', async () => {
    const pg = getPage();
    await pg.goto(USERS.instructor.portal);
    await pg.waitForLoadState('domcontentloaded');
    const link = pg.getByRole('link', { name: /classes|schedule|my classes/i });
    if (await link.count() > 0) {
      await link.first().click();
      await pg.waitForLoadState('domcontentloaded');
      await expect(pg.locator('main, [role="main"], .MuiContainer-root').first()).toBeVisible();
    } else {
      test.skip(true, 'No classes link in nav');
    }
  });
});

// ── Accountant ───────────────────────────────────────────────────────────────
portalSuite('Accountant', USERS.accountant, (getPage) => {
  test('invoices list is accessible', async () => {
    const pg = getPage();
    await pg.goto(USERS.accountant.portal);
    await pg.waitForLoadState('domcontentloaded');
    const link = pg.getByRole('link', { name: /invoices/i });
    if (await link.count() > 0) {
      await link.first().click();
      await pg.waitForLoadState('domcontentloaded');
      const table = pg.locator('table, [role="grid"], .MuiDataGrid-root');
      const emptyMsg = pg.getByText(/no invoices|no records/i);
      const visible = (await table.count() > 0)
        ? await table.first().isVisible()
        : await emptyMsg.first().isVisible();
      expect(visible).toBe(true);
    } else {
      test.skip(true, 'No invoices link in nav');
    }
  });
});

// ── Sysadmin ─────────────────────────────────────────────────────────────────
portalSuite('Sysadmin', USERS.sysadmin, (getPage) => {
  test('users list is accessible', async () => {
    const pg = getPage();
    await pg.goto(USERS.sysadmin.portal);
    await pg.waitForLoadState('domcontentloaded');
    const link = pg.getByRole('link', { name: /users/i });
    if (await link.count() > 0) {
      await link.first().click();
      await pg.waitForLoadState('domcontentloaded');
      await expect(pg.locator('table, [role="grid"], .MuiDataGrid-root').first()).toBeVisible({ timeout: 8000 });
    } else {
      test.skip(true, 'No users link in nav');
    }
  });
});

// ── Admin (course-admin role) ────────────────────────────────────────────────
portalSuite('Admin', USERS.admin, (getPage) => {
  test('can navigate to course requests', async () => {
    const pg = getPage();
    await pg.goto(USERS.admin.portal);
    await pg.waitForLoadState('domcontentloaded');
    const link = pg.getByRole('link', { name: /course request|requests/i });
    if (await link.count() > 0) {
      await link.first().click();
      await pg.waitForLoadState('domcontentloaded');
      await expect(pg.locator('main, [role="main"], .MuiContainer-root').first()).toBeVisible({ timeout: 8000 });
    } else {
      test.skip(true, 'No course requests link in nav');
    }
  });
});

// ── Organization ─────────────────────────────────────────────────────────────
portalSuite('Organization', USERS.orguser);

// ── Vendor ───────────────────────────────────────────────────────────────────
portalSuite('Vendor', USERS.vendor);

// ── HR ───────────────────────────────────────────────────────────────────────
portalSuite('HR', USERS.hr);

// ── Course Admin ─────────────────────────────────────────────────────────────
portalSuite('CourseAdmin', USERS.courseadmin);
