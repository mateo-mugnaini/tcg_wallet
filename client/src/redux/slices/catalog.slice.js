import { createSlice } from "@reduxjs/toolkit";
import {
  getCardById,
  getCards,
  getAllSets,
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
  pagination: {
    tcgs: { page: 1, limit: 10, total: 0, totalPages: 0 },
    sets: { page: 1, limit: 10, total: 0, totalPages: 0 },
    cards: { page: 1, limit: 10, total: 0, totalPages: 0 },
  },
  resourceStatus: { tcgs: "idle", sets: "idle", cards: "idle" },
  resourceErrors: { tcgs: null, sets: null, cards: null },
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
      state.cards = [];
      state.pagination.cards = initialState.pagination.cards;
      state.resourceStatus.cards = "idle";
      state.resourceErrors.cards = null;
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
      .addCase(getTcgs.pending, (state) => {
        loading(state);
        state.resourceStatus.tcgs = "loading";
        state.resourceErrors.tcgs = null;
      })
      .addCase(getTcgs.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.tcgs = action.payload?.data || [];
        state.pagination.tcgs = action.payload?.pagination || initialState.pagination.tcgs;
        state.resourceStatus.tcgs = "succeeded";
      })
      .addCase(getTcgs.rejected, (state, action) => {
        failed(state, action);
        state.resourceStatus.tcgs = "failed";
        state.resourceErrors.tcgs = action.payload;
      })
      .addCase(getSets.pending, (state) => {
        loading(state);
        state.resourceStatus.sets = "loading";
        state.resourceErrors.sets = null;
      })
      .addCase(getSets.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.sets = action.payload?.data || [];
        state.pagination.sets = action.payload?.pagination || initialState.pagination.sets;
        state.resourceStatus.sets = "succeeded";
      })
      .addCase(getSets.rejected, (state, action) => {
        failed(state, action);
        state.resourceStatus.sets = "failed";
        state.resourceErrors.sets = action.payload;
      })
      .addCase(getAllSets.pending, (state) => {
        loading(state);
        state.resourceStatus.sets = "loading";
        state.resourceErrors.sets = null;
      })
      .addCase(getAllSets.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.sets = action.payload?.data || [];
        state.pagination.sets = action.payload?.pagination || initialState.pagination.sets;
        state.resourceStatus.sets = "succeeded";
      })
      .addCase(getAllSets.rejected, (state, action) => {
        failed(state, action);
        state.resourceStatus.sets = "failed";
        state.resourceErrors.sets = action.payload;
      })
      .addCase(getCards.pending, (state) => {
        loading(state);
        state.resourceStatus.cards = "loading";
        state.resourceErrors.cards = null;
      })
      .addCase(getCards.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.cards = action.payload?.data || [];
        state.pagination.cards = action.payload?.pagination || initialState.pagination.cards;
        state.resourceStatus.cards = "succeeded";
      })
      .addCase(getCards.rejected, (state, action) => {
        failed(state, action);
        state.resourceStatus.cards = "failed";
        state.resourceErrors.cards = action.payload;
      })
      .addCase(getTcgById.pending, loading)
      .addCase(getTcgById.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.selectedTcg = action.payload?.data || action.payload || null;
      })
      .addCase(getTcgById.rejected, failed)
      .addCase(getSetById.pending, loading)
      .addCase(getSetById.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.selectedSet = action.payload?.data || action.payload || null;
      })
      .addCase(getSetById.rejected, failed)
      .addCase(getCardById.pending, loading)
      .addCase(getCardById.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.selectedCard = action.payload?.data || action.payload || null;
      })
      .addCase(getCardById.rejected, failed);
  },
});

export const { clearCatalogError, clearSelections } = catalogSlice.actions;
export default catalogSlice.reducer;
