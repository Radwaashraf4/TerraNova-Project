// ==================================================
// TerraNova API Client
// Backend: Vercel Production Domain
// ==================================================
export const API_URL = "https://terranova-backend.vercel.app";


// ==================================================
// CUSTOM API ERROR
// ==================================================

export class OrbitError extends Error {
  constructor(message, kind, status) {
    super(message);
    this.name = "OrbitError";
    this.kind = kind;
    this.status = status;
  }
}


// ==================================================
// API REQUEST HANDLER
// ==================================================

async function request(path, body, { signal, timeoutMs = 35000 } = {}) {
  const controller = new AbortController();

  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const abort = () => controller.abort();

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener("abort", abort, { once: true });
    }
  }

  try {
    let response;

    try {
      response = await fetch(`${API_URL}${path}`, {
        method: body ? "POST" : "GET",

        headers: body
          ? { "Content-Type": "application/json" }
          : undefined,

        body: body
          ? JSON.stringify(body)
          : undefined,

        signal: controller.signal
      });

    } catch (error) {
      if (timedOut) {
        throw new OrbitError(
          "The request took too long.",
          "timeout"
        );
      }

      if (error?.name === "AbortError") {
        throw new OrbitError(
          "Request cancelled.",
          "aborted"
        );
      }

      throw new OrbitError(
        "Could not reach the TerraNova API server.",
        "network"
      );
    }

    let data = null;

    try {
      data = await response.json();
    } catch {
      // Server returned a non-JSON response.
    }

    if (!response.ok) {
      const message =
        data?.detail ||
        data?.error ||
        `Request failed (${response.status}).`;

      throw new OrbitError(
        String(message),
        response.status >= 500 ? "server" : "client",
        response.status
      );
    }

    if (data == null) {
      throw new OrbitError(
        "The server sent an unreadable reply.",
        "server",
        response.status
      );
    }

    return data;

  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}


// ==================================================
// HEALTH CHECK
// ==================================================

export const getHealth = (opts) =>
  request("/api/health", null, opts);


// ==================================================
// MARS DISCOVERIES
// ==================================================

export const getDiscoveries = (limit, opts) =>
  request(
    `/api/discoveries${
      Number.isInteger(limit) && limit >= 0
        ? `?limit=${limit}`
        : ""
    }`,
    null,
    opts
  );


export const getDiscovery = (id, opts) =>
  request(
    `/api/discoveries/${encodeURIComponent(id)}`,
    null,
    opts
  );


// ==================================================
// MARS MODEL INFORMATION
// ==================================================

export const getModelInfo = (opts) =>
  request("/api/model", null, opts);


// ==================================================
// COMPARE MARS DISCOVERIES
// ==================================================

export const compareDiscoveries = (idA, idB, opts) =>
  request(
    "/api/compare",
    {
      id_a: idA,
      id_b: idB
    },
    opts
  );


// ==================================================
// TERRAIN SCORING
// ==================================================

export const scoreRows = (rows, opts) =>
  request(
    "/api/score",
    { rows },
    opts
  );


// ==================================================
// ORBIT CHATBOT
// ==================================================

export const askOrbit = (
  message,
  {
    discoveryIds = [],
    history = [],
    signal
  } = {}
) =>
  request(
    "/api/chat",
    {
      message,
      discovery_ids: discoveryIds,
      history
    },
    { signal }
  );


// ==================================================
// MOON DISCOVERIES
// ==================================================

export const getMoonDiscoveries = (limit = 20, opts) =>
  request(
    `/api/moon/discoveries${
      Number.isInteger(limit) && limit >= 0
        ? `?limit=${limit}`
        : ""
    }`,
    null,
    opts
  );


// ==================================================
// MOON MODEL INFORMATION
// ==================================================

export const getMoonModelInfo = (opts) =>
  request(
    "/api/moon/model",
    null,
    opts
  );


// ==================================================
// SINGLE MOON DISCOVERY
// ==================================================

export const getMoonDiscovery = (id, opts) =>
  request(
    `/api/moon/discoveries/${encodeURIComponent(id)}`,
    null,
    opts
  );


// ==================================================
// COMPARE MOON DISCOVERIES
// ==================================================

export const compareMoonDiscoveries = (idA, idB, opts) =>
  request(
    "/api/moon/compare",
    {
      id_a: idA,
      id_b: idB
    },
    opts
  );
