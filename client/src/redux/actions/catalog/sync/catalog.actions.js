import { api } from "../../../../lib/http/api-client.js";
import { createApiAction } from "../../action-helpers.js";

export const syncPokemonSets = createApiAction("catalog/sets/syncPokemon", () =>
  api.post("/sets/sync/pokemon"),
);
export const syncPokemonCards = createApiAction("catalog/cards/syncPokemon", () =>
  api.post("/cards/sync/pokemon"),
);
