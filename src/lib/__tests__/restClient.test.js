import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRestClient } from '../restClient.js';

describe('createRestClient', () => {
  it('sends JSON requests with authorization headers', async () => {
    const requests = [];
    const client = createRestClient({
      baseUrl: 'https://api.example.com',
      getToken: () => 'test-token',
      fetchImpl: async (url, init) => {
        requests.push({ url, init });
        return {
          ok: true,
          status: 200,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => ({ ok: true }),
        };
      },
    });

    const response = await client.post('/devices', { hostname: 'laptop-1' });

    assert.deepEqual(response, { ok: true });
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, 'https://api.example.com/devices');
    assert.equal(requests[0].init.headers['Authorization'], 'Bearer test-token');
    assert.equal(requests[0].init.body, JSON.stringify({ hostname: 'laptop-1' }));
  });

  it('throws descriptive errors for non-2xx responses', async () => {
    const client = createRestClient({
      baseUrl: 'https://api.example.com',
      fetchImpl: async () => ({
        ok: false,
        status: 403,
        text: async () => 'Forbidden',
      }),
    });

    await assert.rejects(
      client.get('/policies'),
      (error) => {
        assert.equal(error.name, 'RestClientError');
        assert.match(error.message, /403/);
        assert.match(error.message, /Forbidden/);
        return true;
      }
    );
  });
});
