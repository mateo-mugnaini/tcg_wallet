import { createSlice } from "@reduxjs/toolkit";
import { login, logout, refreshSession } from "../actions/auth/post/auth.actions.js";

export const authInitialState = {
  accessToken: null,
  user: null,
  status: "idle",
  error: null,
  initialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState: authInitialState,
  reducers: {
    setAccessToken: (state, action) => {
      state.accessToken = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    sessionExpired: (state) => {
      state.accessToken = null;
      state.user = null;
      state.initialized = true;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.accessToken = action.payload?.data?.accessToken || null;
        state.user = action.payload?.data?.user || null;
        state.initialized = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || { message: "No se pudo iniciar sesión" };
        state.initialized = true;
      })
      .addCase(refreshSession.pending, (state) => {
        state.status = "loading";
      })
      .addCase(refreshSession.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.accessToken = action.payload?.data?.accessToken || null;
        state.initialized = true;
      })
      .addCase(refreshSession.rejected, (state, action) => {
        state.status = "failed";
        state.accessToken = null;
        state.user = null;
        state.error = action.payload || null;
        state.initialized = true;
      })
      .addCase(logout.fulfilled, (state) => {
        Object.assign(state, authInitialState, { initialized: true });
      })
      .addCase(logout.rejected, (state) => {
        Object.assign(state, authInitialState, { initialized: true });
      });
  },
});

export const { setAccessToken, setUser, sessionExpired, clearAuthError } =
  authSlice.actions;
export default authSlice.reducer;
