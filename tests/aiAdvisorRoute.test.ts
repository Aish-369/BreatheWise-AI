import express from 'express';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { errorMiddleware } from '../src/server/errors';
import { createAiAdvisorRouter } from '../src/server/routes/aiAdvisor';

const servers: http.Server[] = [];

async function startApp(): Promise<string> {
  const app = express();
  app.use(express.json());
  app.use('/api', createAiAdvisorRouter());
  app.use(errorMiddleware);
  const server = await new Promise<http.Server>((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  servers.push(server);
  const { port } = server.address() as AddressInfo;
  return `http://127.0.0.1:${port}`;
}

afterEach(async () => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  while (servers.length > 0) {
    const server = servers.pop()!;
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

const validBody = {
  lang: 'en',
  context: {
    aqiValue: 82,
    aqiBand: 'satisfactory',
    freshness: 'fresh',
    dominantPollutant: 'pm25',
    dataType: 'physical_station',
    isAvailable: true,
    isDemoFixture: false,
    pollutants: { pm25: 42, pm10: 70 },
    householdGroups: { infants: 0, children: 1, adults: 2, olderAdults: 1 },
    recommendations: [
      {
        title: 'Shift the flexible walk',
        action: 'Move it to the cleaner forecast window',
        reason: 'The forecast indicates lower particulate matter',
        evidence: 'PM2.5 forecast comparison',
        severity: 'advisory',
      },
    ],
  },
};

describe('AI advisor API route', () => {
  it('returns the rules-based fallback when Gemini is not configured', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const baseUrl = await startApp();

    const response = await fetch(`${baseUrl}/api/ai/explain-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      provider: string;
      aiEnabled: boolean;
      explanation: string;
      notice: string | null;
    };
    expect(body.provider).toBe('rules_fallback');
    expect(body.aiEnabled).toBe(false);
    expect(body.explanation).toContain('Shift the flexible walk');
    expect(body.notice).toContain('Gemini is not configured');
  });

  it('rejects malformed explanation context with a safe validation response', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const baseUrl = await startApp();

    const response = await fetch(`${baseUrl}/api/ai/explain-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validBody,
        context: { ...validBody.context, aqiValue: 900 },
      }),
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as { code: string; error: string };
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.error).toBeTruthy();
  });
});
