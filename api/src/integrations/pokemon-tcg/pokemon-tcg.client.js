import env from "../../config/env.js";

const POKEMON_TCG_API_URL = "https://api.pokemontcg.io/v2";

/* ====================================
        CLIENTE POKÉMON TCG API
==================================== */

export async function pokemonTcgRequest(endpoint, options = {}) {
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
    });

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
      } catch {
        // No se pudo leer el body.
      }

      const error = new Error(
        errorData?.error?.message ||
          `Pokémon TCG API error: ${response.status}`,
      );

      error.status = response.status;
      error.data = errorData;
      error.endpoint = endpoint;

      throw error;
    }

    return await response.json();
  } catch (error) {
    if (error.status) {
      throw error;
    }

    throw error;
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
