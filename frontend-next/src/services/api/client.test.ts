import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient } from '@/services/api/client';

describe('ApiClient', () => {
  let client: ApiClient;
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    client = new ApiClient('http://localhost:5000');
    client.token = 'test-token';
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets and removes token', () => {
    client.setToken('new-token');
    expect(client.token).toBe('new-token');
    expect(localStorage.getItem('profissionalOS_token')).toBe('new-token');

    client.setToken(null);
    expect(client.token).toBeNull();
    expect(localStorage.getItem('profissionalOS_token')).toBeNull();
  });

  it('makes GET request with auth header', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: 'test' }),
    });

    const result = await client.get('/api/test');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/test',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        }),
      }),
    );
    expect(result).toEqual({ success: true, data: 'test' });
  });

  it('makes POST request with body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await client.post('/api/test', { name: 'test' });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/test',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'test' }),
      }),
    );
  });

  it('makes PUT request with body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await client.put('/api/test', { name: 'updated' });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/test',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ name: 'updated' }),
      }),
    );
  });

  it('makes DELETE request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await client.delete('/api/test/1');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/test/1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('returns error data on non-ok response with errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ success: false, errors: ['Campo obrigatório'] }),
    });

    const result = await client.get('/api/test');

    expect(result).toEqual({ success: false, errors: ['Campo obrigatório'] });
  });

  it('returns generic error on non-ok response without errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    const result = await client.get('/api/test');

    expect(result).toEqual({ success: false, errors: ['Erro HTTP 500'] });
  });

  it('handles network errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await client.get('/api/test');

    expect(result).toEqual({ success: false, errors: ['Erro de conexão com o servidor'] });
  });

  it('handles invalid JSON response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => { throw new Error('Invalid JSON'); },
    });

    const result = await client.get('/api/test');

    expect(result).toEqual({});
  });

  it('does not send Authorization header when no token', async () => {
    client.token = null;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await client.get('/api/test');

    const callArgs = mockFetch.mock.calls[0][1];
    expect(callArgs.headers).not.toHaveProperty('Authorization');
  });
});
