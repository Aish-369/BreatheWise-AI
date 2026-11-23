import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  addMemberApi,
  ApiError,
  ensureBrowserSession,
  fetchBootstrap,
  toggleRoutineCompletionApi,
  updateMemberApi,
} from '../src/utils/api';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('frontend API client', () => {
  it('creates a browser session request without an unnecessary JSON content type', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ authenticated: false, household: null }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(ensureBrowserSession()).resolves.toEqual({
      authenticated: false,
      household: null,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/session');
    expect(init?.method).toBe('GET');
    expect(new Headers(init?.headers).has('Content-Type')).toBe(false);
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it('serializes bootstrap filters including explicit false values', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal('fetch', fetchMock);

    await fetchBootstrap({
      city: 'Ahilyanagar & Pune',
      simulateOutage: false,
      useFixtures: true,
      persist: true,
    });

    const url = String(fetchMock.mock.calls[0][0]);
    const parsed = new URL(url, 'http://localhost');
    expect(parsed.pathname).toBe('/api/bootstrap');
    expect(parsed.searchParams.get('city')).toBe('Ahilyanagar & Pune');
    expect(parsed.searchParams.get('simulateOutage')).toBe('false');
    expect(parsed.searchParams.get('useFixtures')).toBe('true');
    expect(parsed.searchParams.get('persist')).toBe('true');
  });

  it('sends JSON for a create-member request', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ member: {}, members: [] }));
    vi.stubGlobal('fetch', fetchMock);
    const input = { name: 'Test member' };

    await addMemberApi(input as never);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/members');
    expect(init?.method).toBe('POST');
    expect(new Headers(init?.headers).get('Content-Type')).toBe('application/json');
    expect(JSON.parse(String(init?.body))).toEqual(input);
  });

  it('encodes path identifiers before issuing update requests', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ member: {}, members: [] }));
    vi.stubGlobal('fetch', fetchMock);

    await updateMemberApi('member/with spaces', { name: 'Updated' } as never);

    expect(fetchMock.mock.calls[0][0]).toBe('/api/members/member%2Fwith%20spaces');
    expect(fetchMock.mock.calls[0][1]?.method).toBe('PUT');
  });

  it('uses PATCH and serializes the completion flag for routine completion', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ routine: {}, routines: [] }));
    vi.stubGlobal('fetch', fetchMock);

    await toggleRoutineCompletionApi('routine-1', false);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/routines/routine-1/completion');
    expect(init?.method).toBe('PATCH');
    expect(JSON.parse(String(init?.body))).toEqual({ completed: false });
  });

  it('preserves structured server errors as ApiError instances', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        jsonResponse({ error: 'Household validation failed', code: 'INVALID_HOUSEHOLD' }, 422)
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(ensureBrowserSession()).rejects.toMatchObject({
      name: 'ApiError',
      status: 422,
      code: 'INVALID_HOUSEHOLD',
      message: 'Household validation failed',
    });
  });

  it('uses a safe status-based message for non-JSON server errors', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response('upstream failure', { status: 503, headers: { 'content-type': 'text/plain' } })
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(ensureBrowserSession()).rejects.toEqual(
      expect.objectContaining<ApiError>({
        name: 'ApiError',
        status: 503,
        code: 'HTTP_503',
        message: 'Server responded with HTTP 503',
      })
    );
  });

  it('normalizes fetch failures into a network ApiError', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(ensureBrowserSession()).rejects.toMatchObject({
      name: 'ApiError',
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Failed to fetch',
    });
  });
});
