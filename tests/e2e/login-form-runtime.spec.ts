import { expect, test } from '@playwright/test';

// Run against `astro build` + the standalone server. Dev/Vitest resolve
// Astro's own Zod correctly and cannot detect SSR externalization drift.
test('built login form returns validation errors instead of crashing before the handler', async ({
  request,
  baseURL,
}) => {
  const response = await request.post('/login?_astroAction=login', {
    form: {},
    headers: { Origin: baseURL!, Referer: `${baseURL}/login` },
    maxRedirects: 0,
  });
  expect(response.status()).toBe(302);
  const actionCookie = response
    .headersArray()
    .find(
      ({ name, value }) =>
        name.toLowerCase() === 'set-cookie' && value.startsWith('_astroActionPayload='),
    );
  expect(actionCookie).toBeDefined();
  const payload = JSON.parse(
    decodeURIComponent(actionCookie!.value.split(';')[0].split('=').slice(1).join('=')),
  );
  expect(payload.actionResult.status, payload.actionResult.body).toBe(400);
  expect(JSON.parse(payload.actionResult.body).type).toBe('AstroActionInputError');

  const page = await request.get('/login', {
    headers: { Cookie: actionCookie!.value.split(';')[0] },
    maxRedirects: 0,
  });
  expect(page.status()).toBe(400);
  expect(await page.text()).toContain('Sign-in could not be completed');
  expect(await page.text()).not.toContain('Something interrupted this request');
});

test('built login form handles rejected credentials without a server error', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Login identity').fill('nonexistent-runtime-probe-01a0821f');
  await page.getByLabel('Password', { exact: true }).fill('invalid-runtime-probe-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Sign-in could not be completed');
  await expect(page.getByRole('heading', { name: 'Sign in', exact: true })).toBeVisible();
  await expect(page.getByText('Something interrupted this request')).toHaveCount(0);
});
