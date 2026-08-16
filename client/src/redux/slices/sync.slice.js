import { createSlice } from "@reduxjs/toolkit";
import { getSyncJobById, getSyncJobs } from "../actions/sync/get/sync.actions.js";

const syncSlice = createSlice({
  name: "sync",
  initialState: { jobs: [], activeJobId: null, selectedJob: null, status: "idle", error: null },
  reducers: {
    clearSyncError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getSyncJobs.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(getSyncJobs.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.jobs = action.payload?.data || [];
        state.activeJobId = action.payload?.activeJobId || null;
      })
      .addCase(getSyncJobs.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(getSyncJobById.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.selectedJob = action.payload?.data || null;
      });
  },
});

export const { clearSyncError } = syncSlice.actions;
export default syncSlice.reducer;
