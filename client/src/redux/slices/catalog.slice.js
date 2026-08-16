import { createSlice } from "@reduxjs/toolkit";
import {
  getCardById,
  getCards,
  getSetById,
  getSets,
  getTcgById,
  getTcgs,
} from "../actions/catalog/get/catalog.actions.js";

const initialState = {
  tcgs: [],
  sets: [],
  cards: [],
  selectedTcg: null,
  selectedSet: null,
  selectedCard: null,
  status: "idle",
  error: null,
};

const catalogSlice = createSlice({
  name: "catalog",
  initialState,
  reducers: {
    clearCatalogError: (state) => {
      state.error = null;
    },
    clearSelections: (state) => {
      state.selectedTcg = null;
      state.selectedSet = null;
      state.selectedCard = null;
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

    builder
      .addCase(getTcgs.pending, loading)
      .addCase(getTcgs.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.tcgs = action.payload?.data || [];
      })
      .addCase(getTcgs.rejected, failed)
      .addCase(getSets.pending, loading)
      .addCase(getSets.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.sets = action.payload?.data || [];
      })
      .addCase(getSets.rejected, failed)
      .addCase(getCards.pending, loading)
      .addCase(getCards.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.cards = action.payload?.data || [];
      })
      .addCase(getCards.rejected, failed)
      .addCase(getTcgById.pending, loading)
      .addCase(getTcgById.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.selectedTcg = action.payload?.data || null;
      })
      .addCase(getTcgById.rejected, failed)
      .addCase(getSetById.pending, loading)
      .addCase(getSetById.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.selectedSet = action.payload?.data || null;
      })
      .addCase(getSetById.rejected, failed)
      .addCase(getCardById.pending, loading)
      .addCase(getCardById.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.selectedCard = action.payload?.data || null;
      })
      .addCase(getCardById.rejected, failed);
  },
});

export const { clearCatalogError, clearSelections } = catalogSlice.actions;
export default catalogSlice.reducer;
