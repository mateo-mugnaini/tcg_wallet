import { configureStore } from "@reduxjs/toolkit";
import authReducer, { authInitialState } from "./slices/auth.slice.js";
import catalogReducer from "./slices/catalog.slice.js";
import collectionReducer from "./slices/collection.slice.js";
import gradingReducer from "./slices/grading.slice.js";
import healthReducer from "./slices/health.slice.js";
import pricesReducer from "./slices/prices.slice.js";
import syncReducer from "./slices/sync.slice.js";
import usersReducer from "./slices/users.slice.js";
import notificationsReducer from "./slices/notifications.slice.js";
import openingsReducer from "./slices/openings.slice.js";
import { notificationsMiddleware } from "./notifications.middleware.js";

const persistedUserKey = "tcg-wallet-user";

function loadPersistedUser() {
  if (typeof window === "undefined") return null;

  try {
    return JSON.parse(window.localStorage.getItem(persistedUserKey) || "null");
  } catch {
    return null;
  }
}

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    catalog: catalogReducer,
    collection: collectionReducer,
    prices: pricesReducer,
    grading: gradingReducer,
    sync: syncReducer,
    health: healthReducer,
    notifications: notificationsReducer,
    openings: openingsReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(notificationsMiddleware),
  preloadedState: {
    auth: { ...authInitialState, user: loadPersistedUser() },
  },
});

if (typeof window !== "undefined") {
  store.subscribe(() => {
    const user = store.getState().auth.user;
    if (user) window.localStorage.setItem(persistedUserKey, JSON.stringify(user));
    else window.localStorage.removeItem(persistedUserKey);
  });
}
