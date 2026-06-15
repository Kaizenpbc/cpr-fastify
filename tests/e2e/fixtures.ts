import { Page } from '@playwright/test';
import { test as base } from '@playwright/test';

// Shared credentials — test accounts on staging (most use test123, admin uses test1234)
export const USERS = {
  instructor:  { username: 'instructor',  password: 'test123',  portal: '/instructor/dashboard' },
  accountant:  { username: 'accountant',  password: 'test123',  portal: '/accounting/dashboard' },
  sysadmin:    { username: 'sysadmin',    password: 'test123',  portal: '/sysadmin/dashboard'   },
  admin:       { username: 'admin',       password: 'test123',  portal: '/admin/dashboard'       },
  orguser:     { username: 'orguser',     password: 'test123',  portal: '/organization/dashboard' },
  vendor:      { username: 'vendoruser',  password: 'test123',  portal: '/vendor/dashboard'      },
  hr:          { username: 'hruser',      password: 'test123',  portal: '/hr'                    },
  courseadmin: { username: 'courseadmin',  password: 'test123',  portal: '/admin/dashboard'        },
} as const;

/** Log in via the login form and wait for navigation away from /login.
 *  Retries up to 3 times if rate-limited (429). */
export async function loginAs(page: Page, username: string, password: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.goto('/login');
    await page.waitForSelector('input[name="username"]');
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);

    const [response] = await Promise.all([
      page.waitForResponse(
        resp => resp.url().includes('/auth/login') && resp.request().method() === 'POST',
        { timeout: 15000 }
      ),
      page.click('button[type="submit"]'),
    ]);

    if (response.status() === 429) {
      // Rate limited — wait and retry
      await page.waitForTimeout(30000);
      continue;
    }

    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 20000 });
    await page.waitForLoadState('domcontentloaded');
    return;
  }
  throw new Error(`Login as ${username} failed after 3 attempts (rate limited)`);
}

export type TestFixtures = Record<string, never>;
export const test = base;
export { expect } from '@playwright/test';
