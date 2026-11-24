import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  addRoutineApi,
  clearLocalApi,
  createLocationApi,
  deleteLocationApi,
  deleteMemberApi,
  deleteRoutineApi,
  ensureBrowserSession,
  fetchProvidersApi,
  importCamsApi,
  resetDemoApi,
  runScenarioApi,
  updateLocationApi,
  updateRoutineApi,
  updateSettingsApi,
} from '../src/utils/api';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('frontend API client timeout and response hardening', () => {
  it('aborts a request after the 15-second deadline and returns a stable timeout error', async () => {
    vi.useFakeTimers();

    const fetchMock = vi.fn<typeof fetch>().mockImplementation(
      (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            'abort',
            () => reject(new DOMException('The request was aborted.', 'AbortError')),
            { once: true }
          );
        })
    );
    vi.stubGlobal('fetch', fetchMock);

    const request = ensureBrowserSession();
    const timeoutAssertion = expect(request).rejects.toMatchObject({
      name: 'ApiError',
      status: 408,
      code: 'TIMEOUT',
      message: 'Request timed out while contacting local server.',
    });
    await vi.advanceTimersByTimeAsync(15_000);
    await timeoutAssertion;
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns an empty object for a successful non-JSON response', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('ready', {
        status: 200,
        headers: { 'content-type': 'text/plain' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(ensureBrowserSession()).resolves.toEqual({});
  });

  it('routes the remaining household, settings, provider, import, and scenario operations', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal('fetch', fetchMock);

    await deleteMemberApi('member/2');
    await addRoutineApi({} as never);
    await updateRoutineApi('routine/2', {} as never);
    await deleteRoutineApi('routine/2');
    await createLocationApi({} as never);
    await updateLocationApi('location/2', {} as never);
    await deleteLocationApi('location/2');
    await updateSettingsApi({} as never);
    await fetchProvidersApi();
    await importCamsApi('city,timeWindow,expectedPm25');
    await runScenarioApi({} as never, { simulateOutage: true, useFixtures: false });
    await resetDemoApi();
    await clearLocalApi();

    expect(
      fetchMock.mock.calls.map(([url, init]) => [url, init?.method ?? 'GET'])
    ).toEqual([
      ['/api/members/member%2F2', 'DELETE'],
      ['/api/routines', 'POST'],
      ['/api/routines/routine%2F2', 'PUT'],
      ['/api/routines/routine%2F2', 'DELETE'],
      ['/api/locations', 'POST'],
      ['/api/locations/location%2F2', 'PUT'],
      ['/api/locations/location%2F2', 'DELETE'],
      ['/api/settings', 'PUT'],
      ['/api/providers', 'GET'],
      ['/api/environment/import-cams', 'POST'],
      ['/api/scenarios/run', 'POST'],
      ['/api/local/reset-demo', 'POST'],
      ['/api/local/clear', 'DELETE'],
    ]);

    expect(JSON.parse(String(fetchMock.mock.calls[9][1]?.body))).toEqual({
      rawText: 'city,timeWindow,expectedPm25',
    });
    expect(JSON.parse(String(fetchMock.mock.calls[10][1]?.body))).toEqual({
      modification: {},
      simulateOutage: true,
      useFixtures: false,
    });
  });

  it('uses safe HTTP fallback details when a JSON error omits message and code', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ detail: 'internal upstream information' }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(ensureBrowserSession()).rejects.toMatchObject({
      name: 'ApiError',
      status: 502,
      code: 'HTTP_502',
      message: 'Server responded with HTTP 502',
    });
  });
});
