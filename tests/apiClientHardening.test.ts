import { afterEach, describe, expect, it, vi } from 'vitest';
import { ensureBrowserSession } from '../src/utils/api';

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
    await vi.advanceTimersByTimeAsync(15_000);

    await expect(request).rejects.toMatchObject({
      name: 'ApiError',
      status: 408,
      code: 'TIMEOUT',
      message: 'Request timed out while contacting local server.',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns an empty object for a successful non-JSON response', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('ready', {
        status: 204,
        headers: { 'content-type': 'text/plain' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(ensureBrowserSession()).resolves.toEqual({});
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
