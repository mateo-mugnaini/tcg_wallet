import { store } from "./store.js";
import { sessionExpired, setAccessToken } from "./slices/auth.slice.js";
import { configureApiClient } from "../lib/http/api-client.js";

export function configureReduxApiClient() {
  configureApiClient({
    accessTokenGetter: () => store.getState().auth.accessToken,
    accessTokenSetter: (accessToken) => store.dispatch(setAccessToken(accessToken)),
    sessionExpiredHandler: () => store.dispatch(sessionExpired()),
  });
}
