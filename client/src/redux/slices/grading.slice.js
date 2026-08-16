import { createSlice } from "@reduxjs/toolkit";
import {
  getGradingCompanies,
  getGradingCompanyById,
} from "../actions/grading/get/grading.actions.js";
import { createGradingCompany } from "../actions/grading/post/grading.actions.js";
import { updateGradingCompany } from "../actions/grading/patch/grading.actions.js";
import { deleteGradingCompany } from "../actions/grading/delete/grading.actions.js";

const gradingSlice = createSlice({
  name: "grading",
  initialState: { companies: [], selected: null, status: "idle", error: null, mutationStatus: "idle", mutationError: null },
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
      })
      .addCase(createGradingCompany.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(createGradingCompany.fulfilled, (state) => {
        state.mutationStatus = "succeeded";
      })
      .addCase(createGradingCompany.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload;
      })
      .addCase(updateGradingCompany.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(updateGradingCompany.fulfilled, (state) => {
        state.mutationStatus = "succeeded";
      })
      .addCase(updateGradingCompany.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload;
      })
      .addCase(deleteGradingCompany.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(deleteGradingCompany.fulfilled, (state) => {
        state.mutationStatus = "succeeded";
      })
      .addCase(deleteGradingCompany.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload;
      });
  },
});

export const { clearGradingError } = gradingSlice.actions;
export default gradingSlice.reducer;
