import { test, expect } from '@playwright/test';

/**
 * E2E smoke test (Stage 5 §21). Verifies the app boots, the home route renders,
 * and the health endpoint reports ok. Expanded per-phase with real user journeys.
 */
test('home page renders the foundation shell', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

interface HealthResponseBody {
  ok: boolean;
  data: { status: string; timestamp: string };
}

test('health endpoint returns ok', async ({ request }) => {
  const response = await request.get('/api/v1/health');
  expect(response.ok()).toBeTruthy();
  const json: unknown = await response.json();
  const body = json as HealthResponseBody;
  expect(body.ok).toBe(true);
  expect(body.data.status).toBe('ok');
});
