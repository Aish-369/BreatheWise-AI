import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearCpcbCache, fetchCpcbSnapshots } from '../src/server/adapters/cpcb';

describe('CPCB data.gov.in adapter', () => {
  const originalApiKey = process.env.DATA_GOV_IN_API_KEY;
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    clearCpcbCache();
    if (originalApiKey === undefined) delete process.env.DATA_GOV_IN_API_KEY;
    else process.env.DATA_GOV_IN_API_KEY = originalApiKey;
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('reads the documented pollutant_avg field and filters the city by state', async () => {
    process.env.DATA_GOV_IN_API_KEY = 'test-key';
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 'ok',
          records: [
            {
              city: 'Ahmednagar',
              state: 'Maharashtra',
              station: 'Test Monitoring Station',
              last_update: new Date().toISOString(),
              pollutant_id: 'PM2.5',
              pollutant_avg: '34.5',
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    globalThis.fetch = fetchMock as typeof fetch;

    const result = await fetchCpcbSnapshots('Ahilyanagar');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestedUrl = new URL(String(fetchMock.mock.calls[0][0]));
    expect(requestedUrl.searchParams.get('filters[city]')).toBe('Ahmednagar');
    expect(requestedUrl.searchParams.get('filters[state]')).toBe('Maharashtra');
    expect(result.status.status).toBe('live');
    expect(result.snapshots).toHaveLength(1);
    expect(result.snapshots[0].pollutants.pm25).toBe(34.5);
    expect(result.snapshots[0].city).toBe('Ahilyanagar');
  });
});
