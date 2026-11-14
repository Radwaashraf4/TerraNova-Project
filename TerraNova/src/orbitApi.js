// ORBIT API client. Set VITE_API_URL to the backend origin in each environment.
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export class OrbitError extends Error {
  constructor(message, kind, status) {
    super(message);
    this.name = 'OrbitError';
    this.kind = kind;
    this.status = status;
  }
}

async function request(path, body, { signal, timeoutMs = 35000 } = {}) {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const abort = () => controller.abort();

  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', abort, { once: true });
  }

  try {
    let response;
    try {
      response = await fetch(`${API_URL}${path}`, {
        method: body ? 'POST' : 'GET',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });
    } catch (error) {
      if (timedOut) throw new OrbitError('The request took too long.', 'timeout');
      if (error?.name === 'AbortError') throw new OrbitError('Request cancelled.', 'aborted');
      throw new OrbitError('Could not reach the TerraNova API server.', 'network');
    }

    let data = null;
    try {
      data = await response.json();
    } catch {
      // A non-JSON response is reported below as an unreadable server reply.
    }

    if (!response.ok) {
      const message = data?.detail || data?.error || `Request failed (${response.status}).`;
      throw new OrbitError(String(message), response.status >= 500 ? 'server' : 'client', response.status);
    }
    if (data == null) throw new OrbitError('The server sent an unreadable reply.', 'server', response.status);
    return data;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

export const getHealth = (opts) => request('/api/health', null, opts);
export const getDiscoveries = (limit, opts) =>
  request(`/api/discoveries${Number.isInteger(limit) && limit >= 0 ? `?limit=${limit}` : ''}`, null, opts);
export const getDiscovery = (id, opts) => request(`/api/discoveries/${encodeURIComponent(id)}`, null, opts);
export const getModelInfo = (opts) => request('/api/model', null, opts);
export const compareDiscoveries = (idA, idB, opts) =>
  request('/api/compare', { id_a: idA, id_b: idB }, opts);
export const scoreRows = (rows, opts) => request('/api/score', { rows }, opts);

export const askOrbit = (message, { discoveryIds = [], history = [], signal } = {}) =>
  request('/api/chat', { message, discovery_ids: discoveryIds, history }, { signal });

export const getMoonDiscoveries = (limit = 20, opts) =>
  request(`/api/moon/discoveries${Number.isInteger(limit) && limit >= 0 ? `?limit=${limit}` : ''}`, null, opts);
export const getMoonModelInfo = (opts) => request('/api/moon/model', null, opts);
export const getMoonDiscovery = (id, opts) => request(`/api/moon/discoveries/${encodeURIComponent(id)}`, null, opts);
export const compareMoonDiscoveries = (idA, idB, opts) =>
  request('/api/moon/compare', { id_a: idA, id_b: idB }, opts);
