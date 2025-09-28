class RestClientError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.name = 'RestClientError';
    this.status = status;
    this.body = body;
  }
}

async function parseResponse(response) {
  const contentType = typeof response.headers?.get === 'function'
    ? response.headers.get('content-type')
    : response.headers?.get?.('content-type') ?? response.headers?.['content-type'];

  if (contentType && contentType.includes('application/json') && typeof response.json === 'function') {
    return response.json();
  }
  if (typeof response.text === 'function') {
    return response.text();
  }
  return undefined;
}

export function createRestClient({ baseUrl, getToken = () => undefined, fetchImpl = fetch } = {}) {
  if (!baseUrl) {
    throw new RestClientError('baseUrl is required');
  }

  async function request(path, { method = 'GET', body, headers = {} } = {}) {
    const token = getToken();
    const requestHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }

    const response = await fetchImpl(`${baseUrl}${path}`, {
      method,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const payload = await parseResponse(response);
      const messageSuffix =
        typeof payload === 'string'
          ? `: ${payload}`
          : payload && typeof payload === 'object'
            ? `: ${JSON.stringify(payload)}`
            : '';
      throw new RestClientError(`Request failed with status ${response.status}${messageSuffix}`, {
        status: response.status,
        body: payload,
      });
    }

    return parseResponse(response);
  }

  return {
    get: (path, options = {}) => request(path, { ...options, method: 'GET' }),
    post: (path, body, options = {}) => request(path, { ...options, method: 'POST', body }),
    put: (path, body, options = {}) => request(path, { ...options, method: 'PUT', body }),
    patch: (path, body, options = {}) => request(path, { ...options, method: 'PATCH', body }),
    delete: (path, options = {}) => request(path, { ...options, method: 'DELETE' }),
  };
}

export { RestClientError };
