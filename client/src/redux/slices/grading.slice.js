import { createSlice } from "@reduxjs/toolkit";
import {
  getGradingCompanies,
  getGradingCompanyById,
} from "../actions/grading/get/grading.actions.js";

const gradingSlice = createSlice({
  name: "grading",
  initialState: { companies: [], selected: null, status: "idle", error: null },
  reducers: {
    clearGradingError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getGradingCompanies.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(getGradingCompanies.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.companies = action.payload?.data || [];
      })
      .addCase(getGradingCompanies.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(getGradingCompanyById.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.selected = action.payload?.data || null;
      });
  },
});

export const { clearGradingError } = gradingSlice.actions;
export default gradingSlice.reducer;
