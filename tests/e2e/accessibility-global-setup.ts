import { mkdir, rm, writeFile } from 'node:fs/promises';

import { chromium, type FullConfig } from '@playwright/test';

const emptyState = JSON.stringify({ cookies: [], origins: [] });
const states = [
  {
    path: '.ci-results/accessibility-employee-state.json',
    identity: () => process.env.QC_E2E_LOGIN_IDENTITY,
    password: () => process.env.QC_E2E_PASSWORD,
  },
  {
    path: '.ci-results/accessibility-admin-state.json',
    identity: () => process.env.QC_E2E_ADMIN_LOGIN_IDENTITY,
    password: () => process.env.QC_E2E_ADMIN_PASSWORD,
  },
] as const;

export default async function globalSetup(config: FullConfig): Promise<() => Promise<void>> {
  await mkdir('.ci-results', { recursive: true });
  const baseURL = String(config.projects[0]?.use.baseURL ?? 'http://127.0.0.1:4321');
  const credentials = states.map((state) => ({
    ...state,
    identity: state.identity(),
    password: state.password(),
  }));
  const needsBrowser = credentials.some(({ identity, password }) => identity && password);

  if (needsBrowser) {
    const browser = await chromium.launch();
    try {
      for (const state of credentials) {
        if (!state.identity || !state.password) {
          await writeFile(state.path, emptyState, 'utf8');
          continue;
        }
        const context = await browser.newContext({ baseURL });
        try {
          const page = await context.newPage();
          await page.goto('/login');
          await page.getByLabel('Login identity').fill(state.identity);
          await page.getByLabel('Password', { exact: true }).fill(state.password);
          await page.getByRole('button', { name: 'Sign in', exact: true }).click();
          await page.waitForURL(/\/dashboard(?:\?|$)/);
          await context.storageState({ path: state.path });
        } finally {
          await context.close();
        }
      }
    } catch (error) {
      await Promise.all(credentials.map(({ path }) => rm(path, { force: true })));
      throw error;
    } finally {
      await browser.close();
    }
  } else {
    await Promise.all(credentials.map(({ path }) => writeFile(path, emptyState, 'utf8')));
  }

  return async () => {
    await Promise.all(credentials.map(({ path }) => rm(path, { force: true })));
  };
}
