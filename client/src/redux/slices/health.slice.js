import { createSlice } from "@reduxjs/toolkit";
import { getHealth, getReadiness } from "../actions/health/get/health.actions.js";

const healthSlice = createSlice({
  name: "health",
  initialState: { live: null, ready: null, status: "idle", error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getHealth.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getHealth.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.live = action.payload;
      })
      .addCase(getHealth.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(getReadiness.fulfilled, (state, action) => {
        state.ready = action.payload;
      });
  },
});

export default healthSlice.reducer;
