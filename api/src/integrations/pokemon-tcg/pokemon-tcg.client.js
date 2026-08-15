import env from "../../config/env.js";
import { createAppError } from "../../errors/app.errors.js";

const POKEMON_TCG_API_URL = "https://api.pokemontcg.io/v2";
const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;

/* ====================================
        CLIENTE POKÉMON TCG API
==================================== */

export async function pokemonTcgRequest(endpoint, options = {}) {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const url = `${POKEMON_TCG_API_URL}${endpoint}`;

  const headers = {
    "X-Api-Key": env.pokemonTcg.apiKey,
    "Content-Type": "application/json",
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body: options.body,
      signal: controller.signal,
    });

    /* ====================================
          ERROR HTTP
    ==================================== */

    if (!response.ok) {
      let errorData = null;
      let rawResponse = null;

      try {
        rawResponse = await response.text();

        if (rawResponse) {
          try {
            errorData = JSON.parse(rawResponse);
          } catch {
            // La respuesta no es JSON.
          }
        }
      } catch (error) {
        if (error?.name === "AbortError") {
          throw error;
        }

        // No se pudo leer el body.
      }

      const message =
        errorData?.error?.message ||
        `Pokémon TCG API error: ${response.status}`;

      /* ====================================
            DETERMINAR SI ES REINTENTABLE
      ==================================== */

      const retryableStatuses = [429, 500, 502, 503, 504];

      const retryable = retryableStatuses.includes(response.status);

      throw createAppError(message, 502, "POKEMON_TCG_API_ERROR", {
        externalStatus: response.status,
        endpoint,
        data: errorData,
        rawResponse,
        retryable,
      });
    }

    /* ====================================
          PARSEAR RESPONSE
    ==================================== */

    try {
      return await response.json();
    } catch (error) {
      if (error?.name === "AbortError") {
        throw error;
      }

      throw createAppError(
        "Pokémon TCG API devolvió una respuesta inválida",
        502,
        "POKEMON_TCG_API_INVALID_RESPONSE",
        {
          endpoint,
          originalError: error?.message,
          retryable: false,
        },
      );
    }
  } catch (error) {
    /* ====================================
          ERROR YA NORMALIZADO
    ==================================== */

    if (
      error?.code === "POKEMON_TCG_API_ERROR" ||
      error?.code === "POKEMON_TCG_API_INVALID_RESPONSE" ||
      error?.code === "POKEMON_TCG_API_TIMEOUT"
    ) {
      throw error;
    }

    if (error?.name === "AbortError") {
      throw createAppError(
        "Pokémon TCG API agotó el tiempo de espera",
        504,
        "POKEMON_TCG_API_TIMEOUT",
        {
          endpoint,
          timeoutMs,
          retryable: true,
        },
      );
    }

    /* ====================================
          ERROR DE RED / FETCH
    ==================================== */

    throw createAppError(
      "No se pudo comunicar con Pokémon TCG API",
      503,
      "POKEMON_TCG_API_UNAVAILABLE",
      {
        endpoint,
        originalError: error?.message,
        retryable: true,
      },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/* ====================================
             OBTENER SET
==================================== */

export async function getPokemonTcgSet(setId) {
  return pokemonTcgRequest(`/sets/${setId}`);
}

/* ====================================
            LISTAR SETS
==================================== */

export async function getPokemonTcgSets({
  page = 1,
  pageSize = 250,
  q,
  orderBy,
} = {}) {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("pageSize", String(pageSize));

  if (q) {
    params.set("q", q);
  }

  if (orderBy) {
    params.set("orderBy", orderBy);
  }

  return pokemonTcgRequest(`/sets?${params.toString()}`);
}

/* ====================================
            LISTAR CARDS
==================================== */

export async function getPokemonTcgCards({
  page = 1,
  pageSize = 250,
  q,
  orderBy,
} = {}) {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("pageSize", String(pageSize));

  if (q) {
    params.set("q", q);
  }

  if (orderBy) {
    params.set("orderBy", orderBy);
  }

  return pokemonTcgRequest(`/cards?${params.toString()}`);
}
