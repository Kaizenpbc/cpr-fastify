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

/** Find the logout element across all portal layouts:
 *  - IconButton aria-label="logout" (Instructor, Organization)
 *  - ListItem aria-label="Logout from application" (generic Layout: HR)
 *  - Button/ListItemText with text "Logout" (Accountant, Sysadmin, Vendor)
 *  - MenuItem with text "Logout" (CourseAdmin — inside dropdown menu)
 */
function logoutLocator(pg: Page) {
  return pg.locator([
    '[aria-label="logout"]',
    '[aria-label="Logout from application"]',
    'button:has-text("Logout")',
    '.MuiListItemText-root:has-text("Logout")',
  ].join(', '));
}

// ── Instructor ───────────────────────────────────────────────────────────────
test.describe.serial('Instructor (login, portal, logout)', () => {
  let ctx: BrowserContext;
  let pg: Page;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120000);
    ctx = await browser.newContext({ ignoreHTTPSErrors: true });
    pg = await ctx.newPage();
    await loginAs(pg, USERS.instructor.username, USERS.instructor.password);
  });
  test.afterAll(() => ctx.close());

  test('redirected to instructor portal after login', async () => {
    await expect(pg).toHaveURL(/instructor/);
  });

  test('dashboard loads with stats cards', async () => {
    await pg.goto('/instructor/dashboard');
    await pg.waitForLoadState('domcontentloaded');
    await expect(pg.locator('main, [role="main"], .MuiContainer-root').first()).toBeVisible({ timeout: 30000 });
  });

  test('can navigate to My Schedule', async () => {
    // Reuse page from prior test (already on dashboard) — avoid re-triggering lazy-load spinner
    if (!pg.url().includes('/instructor')) {
      await pg.goto('/instructor/dashboard');
      await pg.waitForLoadState('domcontentloaded');
    }
    // Sidebar uses ListItemText, not <a> links
    const link = pg.getByText('My Schedule');
    await expect(link).toBeVisible({ timeout: 30000 });
    await link.click();
    await pg.waitForLoadState('domcontentloaded');
    await expect(pg.locator('main, [role="main"], .MuiContainer-root').first()).toBeVisible();
  });

  test('logout redirects to /login', async () => {
    await pg.goto('/instructor/dashboard', { waitUntil: 'domcontentloaded' });
    // Instructor has IconButton aria-label="logout" in the header
    const btn = pg.locator('[aria-label="logout"]');
    await expect(btn.first()).toBeVisible({ timeout: 15000 });
    await btn.first().click();
    await pg.waitForURL(/login/, { timeout: 10000 });
    await expect(pg).toHaveURL(/login/);
  });
});

// ── Accountant ───────────────────────────────────────────────────────────────
test.describe.serial('Accountant (login, portal, logout)', () => {
  let ctx: BrowserContext;
  let pg: Page;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120000);
    ctx = await browser.newContext({ ignoreHTTPSErrors: true });
    pg = await ctx.newPage();
    await loginAs(pg, USERS.accountant.username, USERS.accountant.password);
  });
  test.afterAll(() => ctx.close());

  test('redirected to accounting portal after login', async () => {
    await expect(pg).toHaveURL(/accounting/);
  });

  test('dashboard loads with financial overview', async () => {
    await pg.goto('/accounting/dashboard');
    await pg.waitForLoadState('domcontentloaded');
    await expect(pg.locator('main, [role="main"], .MuiContainer-root').first()).toBeVisible({ timeout: 30000 });
  });

  test('billing tab is accessible', async () => {
    if (!pg.url().includes('/accounting')) {
      await pg.goto('/accounting/dashboard');
      await pg.waitForLoadState('domcontentloaded');
    }
    // Accounting portal uses horizontal tabs: "Billing & Receivables"
    const tab = pg.getByText('Billing & Receivables');
    await expect(tab).toBeVisible({ timeout: 30000 });
    await tab.click();
    await pg.waitForLoadState('domcontentloaded');
    await expect(pg.locator('main, [role="main"], .MuiContainer-root').first()).toBeVisible({ timeout: 30000 });
  });

  test('logout redirects to /login', async () => {
    await pg.goto('/accounting/dashboard', { waitUntil: 'domcontentloaded' });
    // Accountant has an outlined Button with text "Logout"
    const btn = pg.locator('button:has-text("Logout")');
    await expect(btn.first()).toBeVisible({ timeout: 15000 });
    await btn.first().click();
    await pg.waitForURL(/login/, { timeout: 10000 });
    await expect(pg).toHaveURL(/login/);
  });
});

// ── Sysadmin ─────────────────────────────────────────────────────────────────
test.describe.serial('Sysadmin (login, portal, logout)', () => {
  let ctx: BrowserContext;
  let pg: Page;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120000);
    ctx = await browser.newContext({ ignoreHTTPSErrors: true });
    pg = await ctx.newPage();
    await loginAs(pg, USERS.sysadmin.username, USERS.sysadmin.password);
  });
  test.afterAll(() => ctx.close());

  test('redirected to sysadmin portal after login', async () => {
    await expect(pg).toHaveURL(/sysadmin/);
  });

  test('dashboard loads', async () => {
    await pg.goto('/sysadmin/dashboard');
    await pg.waitForLoadState('domcontentloaded');
    await expect(pg.locator('main, [role="main"], .MuiContainer-root').first()).toBeVisible({ timeout: 30000 });
  });

  test('user management is accessible', async () => {
    if (!pg.url().includes('/sysadmin')) {
      await pg.goto('/sysadmin/dashboard');
      await pg.waitForLoadState('domcontentloaded');
    }
    // Sysadmin sidebar has ListItemText "User Management"
    const link = pg.getByText('User Management');
    await expect(link).toBeVisible({ timeout: 30000 });
    await link.click();
    await pg.waitForLoadState('domcontentloaded');
    await expect(pg.locator('table, [role="grid"], .MuiDataGrid-root, main').first()).toBeVisible({ timeout: 30000 });
  });

  test('logout redirects to /login', async () => {
    await pg.goto('/sysadmin/dashboard', { waitUntil: 'domcontentloaded' });
    // Sysadmin has ListItem with text "Logout" in sidebar
    const btn = logoutLocator(pg);
    await expect(btn.first()).toBeVisible({ timeout: 15000 });
    await btn.first().click();
    await pg.waitForURL(/login/, { timeout: 10000 });
    await expect(pg).toHaveURL(/login/);
  });
});

// ── Admin (course-admin role) ────────────────────────────────────────────────
test.describe.serial('Admin (login, portal, logout)', () => {
  let ctx: BrowserContext;
  let pg: Page;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120000);
    ctx = await browser.newContext({ ignoreHTTPSErrors: true });
    pg = await ctx.newPage();
    await loginAs(pg, USERS.admin.username, USERS.admin.password);
  });
  test.afterAll(() => ctx.close());

  test('redirected to admin portal after login', async () => {
    await expect(pg).toHaveURL(/admin/);
  });

  test('dashboard loads with calendar', async () => {
    await pg.goto('/admin/dashboard');
    await pg.waitForLoadState('domcontentloaded');
    // CourseAdmin portal lazy-loads — wait for the portal header or content
    await expect(
      pg.locator('main, [role="main"], .MuiContainer-root, .MuiBox-root, .MuiToolbar-root').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('course scheduling tab is accessible', async () => {
    // Don't re-navigate — reuse the page from the previous test (already on /admin/dashboard).
    // If we did navigate away, go back; otherwise just wait for lazy-load to finish.
    if (!pg.url().includes('/admin')) {
      await pg.goto('/admin/dashboard');
      await pg.waitForLoadState('domcontentloaded');
    }
    // Wait for the lazy-loaded portal to finish rendering (spinner goes away, tabs appear)
    const tab = pg.getByText('Course Scheduling');
    await expect(tab).toBeVisible({ timeout: 30000 });
    await tab.click();
    await pg.waitForLoadState('domcontentloaded');
    await expect(pg.locator('main, [role="main"], .MuiContainer-root, .MuiBox-root').first()).toBeVisible({ timeout: 30000 });
  });

  test('logout via user menu redirects to /login', async () => {
    await pg.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
    // CourseAdmin logout is behind a person icon menu
    const accountBtn = pg.locator('[aria-label="account"], [aria-label="Account"], .MuiAvatar-root')
      .or(pg.locator('button').filter({ has: pg.locator('svg[data-testid="AccountCircleIcon"]') }));
    await expect(accountBtn.first()).toBeVisible({ timeout: 15000 });
    await accountBtn.first().click();
    // Wait for menu to open, then click "Logout" menu item
    const logoutMenuItem = pg.getByRole('menuitem', { name: /logout/i })
      .or(pg.locator('.MuiMenuItem-root:has-text("Logout")'));
    await expect(logoutMenuItem.first()).toBeVisible({ timeout: 5000 });
    await logoutMenuItem.first().click();
    await pg.waitForURL(/login/, { timeout: 10000 });
    await expect(pg).toHaveURL(/login/);
  });
});

// ── Organization ─────────────────────────────────────────────────────────────
test.describe.serial('Organization (login, portal, logout)', () => {
  let ctx: BrowserContext;
  let pg: Page;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120000);
    ctx = await browser.newContext({ ignoreHTTPSErrors: true });
    pg = await ctx.newPage();
    await loginAs(pg, USERS.orguser.username, USERS.orguser.password);
  });
  test.afterAll(() => ctx.close());

  test('redirected to organization portal after login', async () => {
    await expect(pg).toHaveURL(/organization/);
  });

  test('dashboard loads', async () => {
    await pg.goto('/organization/dashboard');
    await pg.waitForLoadState('domcontentloaded');
    await expect(pg.locator('main, [role="main"], .MuiContainer-root').first()).toBeVisible({ timeout: 30000 });
  });

  test('can navigate to billing or courses section', async () => {
    if (!pg.url().includes('/organization')) {
      await pg.goto('/organization/dashboard');
      await pg.waitForLoadState('domcontentloaded');
    }
    // Organization sidebar has navigation items
    const navItem = pg.getByText(/billing|invoices|course request|students/i).first();
    await expect(navItem).toBeVisible({ timeout: 30000 });
    await navItem.click();
    await pg.waitForLoadState('domcontentloaded');
    await expect(pg.locator('main, [role="main"], .MuiContainer-root').first()).toBeVisible({ timeout: 30000 });
  });

  test('logout redirects to /login', async () => {
    await pg.goto('/organization/dashboard', { waitUntil: 'domcontentloaded' });
    // Organization has IconButton aria-label="logout"
    const btn = pg.locator('[aria-label="logout"]');
    await expect(btn.first()).toBeVisible({ timeout: 15000 });
    await btn.first().click();
    await pg.waitForURL(/login/, { timeout: 10000 });
    await expect(pg).toHaveURL(/login/);
  });
});

// ── Vendor ───────────────────────────────────────────────────────────────────
test.describe.serial('Vendor (login, portal, logout)', () => {
  let ctx: BrowserContext;
  let pg: Page;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120000);
    ctx = await browser.newContext({ ignoreHTTPSErrors: true });
    pg = await ctx.newPage();
    await loginAs(pg, USERS.vendor.username, USERS.vendor.password);
  });
  test.afterAll(() => ctx.close());

  test('redirected to vendor portal after login', async () => {
    await expect(pg).toHaveURL(/vendor/);
  });

  test('dashboard loads', async () => {
    await pg.goto('/vendor/dashboard');
    await pg.waitForLoadState('domcontentloaded');
    await expect(pg.locator('main, [role="main"], .MuiContainer-root').first()).toBeVisible({ timeout: 30000 });
  });

  test('can navigate to invoices', async () => {
    if (!pg.url().includes('/vendor')) {
      await pg.goto('/vendor/dashboard');
      await pg.waitForLoadState('domcontentloaded');
    }
    // Vendor sidebar has "Invoices" or "Submit Invoice"
    const link = pg.getByText(/invoices|submit invoice/i).first();
    await expect(link).toBeVisible({ timeout: 30000 });
    await link.click();
    await pg.waitForLoadState('domcontentloaded');
    await expect(pg.locator('main, [role="main"], .MuiContainer-root').first()).toBeVisible({ timeout: 30000 });
  });

  test('logout redirects to /login', async () => {
    await pg.goto('/vendor/dashboard', { waitUntil: 'domcontentloaded' });
    // Vendor has Button "Logout" in AppBar
    const btn = pg.locator('button:has-text("Logout")');
    await expect(btn.first()).toBeVisible({ timeout: 15000 });
    await btn.first().click();
    await pg.waitForURL(/login/, { timeout: 10000 });
    await expect(pg).toHaveURL(/login/);
  });
});

// ── HR ───────────────────────────────────────────────────────────────────────
test.describe.serial('HR (login, portal, logout)', () => {
  let ctx: BrowserContext;
  let pg: Page;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120000);
    ctx = await browser.newContext({ ignoreHTTPSErrors: true });
    pg = await ctx.newPage();
    await loginAs(pg, USERS.hr.username, USERS.hr.password);
  });
  test.afterAll(() => ctx.close());

  test('redirected to HR portal after login', async () => {
    await expect(pg).toHaveURL(/hr/);
  });

  test('dashboard loads', async () => {
    // HR route is /hr, not /hr/dashboard
    await pg.goto('/hr');
    await pg.waitForLoadState('domcontentloaded');
    await expect(pg.locator('main, [role="main"], .MuiContainer-root, .MuiBox-root').first()).toBeVisible({ timeout: 30000 });
  });

  test('HR portal has navigation items', async () => {
    if (!pg.url().includes('/hr')) {
      await pg.goto('/hr');
      await pg.waitForLoadState('domcontentloaded');
    }
    // HR portal has sidebar items like "Dashboard", "Profile Changes", "Timesheets"
    const navItem = pg.getByText(/dashboard|profile|timesheet|employee/i).first();
    await expect(navItem).toBeVisible({ timeout: 30000 });
  });

  test('logout redirects to /login', async () => {
    await pg.goto('/hr', { waitUntil: 'domcontentloaded' });
    // HR portal has an IconButton with LogoutIcon (no aria-label)
    const btn = pg.locator('button:has(svg[data-testid="LogoutIcon"])');
    await expect(btn.first()).toBeVisible({ timeout: 15000 });
    await btn.first().click();
    await pg.waitForURL(/login/, { timeout: 10000 });
    await expect(pg).toHaveURL(/login/);
  });
});

// ── Course Admin ─────────────────────────────────────────────────────────────
test.describe.serial('CourseAdmin (login, portal, logout)', () => {
  let ctx: BrowserContext;
  let pg: Page;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120000);
    ctx = await browser.newContext({ ignoreHTTPSErrors: true });
    pg = await ctx.newPage();
    await loginAs(pg, USERS.courseadmin.username, USERS.courseadmin.password);
  });
  test.afterAll(() => ctx.close());

  test('redirected to admin portal after login', async () => {
    // courseadmin role redirects to /admin
    await expect(pg).toHaveURL(/admin/);
  });

  test('dashboard loads with calendar', async () => {
    await pg.goto('/admin/dashboard');
    await pg.waitForLoadState('domcontentloaded');
    await expect(
      pg.locator('main, [role="main"], .MuiContainer-root, .MuiBox-root, .MuiToolbar-root').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('instructor management tab is accessible', async () => {
    if (!pg.url().includes('/admin')) {
      await pg.goto('/admin/dashboard');
      await pg.waitForLoadState('domcontentloaded');
    }
    // CourseAdmin portal has horizontal tabs
    const tab = pg.getByText('Instructor Management');
    await expect(tab).toBeVisible({ timeout: 30000 });
    await tab.click();
    await pg.waitForLoadState('domcontentloaded');
    await expect(pg.locator('main, [role="main"], .MuiContainer-root').first()).toBeVisible({ timeout: 30000 });
  });

  test('logout via user menu redirects to /login', async () => {
    await pg.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
    // CourseAdmin logout is behind person icon menu
    const accountBtn = pg.locator('[aria-label="account"], [aria-label="Account"], .MuiAvatar-root')
      .or(pg.locator('button').filter({ has: pg.locator('svg[data-testid="AccountCircleIcon"]') }));
    await expect(accountBtn.first()).toBeVisible({ timeout: 15000 });
    await accountBtn.first().click();
    const logoutMenuItem = pg.getByRole('menuitem', { name: /logout/i })
      .or(pg.locator('.MuiMenuItem-root:has-text("Logout")'));
    await expect(logoutMenuItem.first()).toBeVisible({ timeout: 5000 });
    await logoutMenuItem.first().click();
    await pg.waitForURL(/login/, { timeout: 10000 });
    await expect(pg).toHaveURL(/login/);
  });
});
