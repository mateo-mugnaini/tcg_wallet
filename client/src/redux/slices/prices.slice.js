import { createSlice } from "@reduxjs/toolkit";
import {
  getGradedPriceAggregations,
  getGradedPriceStats,
  getGradedPriceVariation,
  getGradedPrices,
  getLatestGradedPrice,
  getLatestPrice,
  getPriceAggregations,
  getPrices,
  getPriceStats,
  getPriceVariation,
} from "../actions/prices/get/prices.actions.js";

const pricesSlice = createSlice({
  name: "prices",
  initialState: {
    normal: { list: [], latest: null, stats: null, variation: null, aggregations: null, pagination: null },
    graded: { list: [], latest: null, stats: null, variation: null, aggregations: null, pagination: null },
    status: "idle",
    error: null,
  },
  reducers: {
    clearPricesError: (state) => {
      state.error = null;
    },
    clearPrices: (state) => {
      state.normal = { list: [], latest: null, stats: null, variation: null, aggregations: null, pagination: null };
      state.graded = { list: [], latest: null, stats: null, variation: null, aggregations: null, pagination: null };
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const loading = (state) => {
      state.status = "loading";
      state.error = null;
    };
    const failed = (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    };
    const normal = (field) => (state, action) => {
      state.status = "succeeded";
      state.normal[field] = action.payload?.data || null;
      if (field === "list") state.normal.pagination = action.payload?.pagination || null;
    };
    const graded = (field) => (state, action) => {
      state.status = "succeeded";
      state.graded[field] = action.payload?.data || null;
      if (field === "list") state.graded.pagination = action.payload?.pagination || null;
    };

    [getPrices, getLatestPrice, getPriceStats, getPriceVariation, getPriceAggregations].forEach(
      (action) => builder.addCase(action.pending, loading).addCase(action.rejected, failed),
    );
    [getGradedPrices, getLatestGradedPrice, getGradedPriceStats, getGradedPriceVariation, getGradedPriceAggregations].forEach(
      (action) => builder.addCase(action.pending, loading).addCase(action.rejected, failed),
    );

    builder
      .addCase(getPrices.fulfilled, normal("list"))
      .addCase(getLatestPrice.fulfilled, normal("latest"))
      .addCase(getPriceStats.fulfilled, normal("stats"))
      .addCase(getPriceVariation.fulfilled, normal("variation"))
      .addCase(getPriceAggregations.fulfilled, normal("aggregations"))
      .addCase(getGradedPrices.fulfilled, graded("list"))
      .addCase(getLatestGradedPrice.fulfilled, graded("latest"))
      .addCase(getGradedPriceStats.fulfilled, graded("stats"))
      .addCase(getGradedPriceVariation.fulfilled, graded("variation"))
      .addCase(getGradedPriceAggregations.fulfilled, graded("aggregations"));
  },
});

export const { clearPrices, clearPricesError } = pricesSlice.actions;
export default pricesSlice.reducer;
