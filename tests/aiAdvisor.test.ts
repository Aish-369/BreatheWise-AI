import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AiPlanContextSchema,
  generatePlanExplanation,
  type AiPlanContext,
} from '../src/server/aiAdvisor';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const context: AiPlanContext = {
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
      title: 'Shift the flexible morning walk',
      action: 'Move the walk to the cleaner forecast window',
      reason: 'The forecast indicates lower particulate matter later in the day',
      evidence: 'PM2.5 forecast comparison',
      severity: 'advisory',
    },
  ],
};

describe('AI plan explanation service', () => {
  it('rejects invalid or out-of-range client context before calling a model', () => {
    expect(AiPlanContextSchema.safeParse(context).success).toBe(true);
    expect(AiPlanContextSchema.safeParse({ ...context, aqiValue: 900 }).success).toBe(false);
    expect(
      AiPlanContextSchema.safeParse({
        ...context,
        recommendations: Array.from({ length: 5 }, () => context.recommendations[0]),
      }).success
    ).toBe(false);
  });

  it('uses the deterministic explanation when no Gemini key is configured', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await generatePlanExplanation(context, 'en');

    expect(result.provider).toBe('rules_fallback');
    expect(result.aiEnabled).toBe(false);
    expect(result.explanation).toContain('Shift the flexible morning walk');
    expect(result.notice).toContain('Gemini is not configured');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends only bounded plan context to Gemini and returns model output', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-secret-key');
    vi.stubEnv('GEMINI_MODEL', 'gemini-test-model');
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          steps: [
            { type: 'thought', content: [] },
            {
              type: 'model_output',
              content: [
                {
                  type: 'text',
                  text: 'The later window is preferable because the supplied forecast is cleaner.',
                },
              ],
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await generatePlanExplanation(context, 'en');

    expect(result).toEqual({
      provider: 'gemini',
      aiEnabled: true,
      model: 'gemini-test-model',
      explanation: 'The later window is preferable because the supplied forecast is cleaner.',
      notice: null,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/interactions');
    expect(options.headers).toEqual(
      expect.objectContaining({ 'x-goog-api-key': 'test-secret-key' })
    );
    const body = JSON.parse(String(options.body)) as Record<string, unknown>;
    expect(body.model).toBe('gemini-test-model');
    expect(body.store).toBe(false);
    expect(body).not.toHaveProperty('apiKey');
    expect(JSON.stringify(body)).not.toContain('test-secret-key');
    expect(String(body.input)).toContain('Respond only in English');
    expect(String(body.input)).toContain('<untrusted_plan_context>');
  });

  it('falls back safely when Gemini is unavailable', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-secret-key');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('provider unavailable', { status: 503 }))
    );

    const result = await generatePlanExplanation(context, 'mr');

    expect(result.provider).toBe('rules_fallback');
    expect(result.aiEnabled).toBe(false);
    expect(result.explanation).toContain('Shift the flexible morning walk');
    expect(result.notice).toContain('Gemini सध्या उपलब्ध नाही');
  });

  it('does not produce numeric claims when environmental data is unavailable', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const unavailable = {
      ...context,
      aqiValue: null,
      aqiBand: 'unavailable' as const,
      freshness: 'unavailable' as const,
      isAvailable: false,
      recommendations: [],
    };

    const result = await generatePlanExplanation(unavailable, 'hi');

    expect(result.provider).toBe('rules_fallback');
    expect(result.explanation).toContain('वर्तमान पर्यावरणीय डेटा उपलब्ध नहीं है');
  });
});
