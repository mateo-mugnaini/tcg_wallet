import { createSlice } from "@reduxjs/toolkit";
import {
  getCollectionItemById,
  getCollectionItems,
  getCollectionStats,
  getCollectionValue,
} from "../actions/collection/get/collection.actions.js";

const collectionSlice = createSlice({
  name: "collection",
  initialState: {
    items: [],
    selectedItem: null,
    stats: null,
    value: null,
    status: "idle",
    error: null,
    statsStatus: "idle",
    statsError: null,
    valueStatus: "idle",
    valueError: null,
  },
  reducers: {
    clearCollectionError: (state) => {
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
    builder
      .addCase(getCollectionItems.pending, loading)
      .addCase(getCollectionItems.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload?.data || [];
      })
      .addCase(getCollectionItems.rejected, failed)
      .addCase(getCollectionItemById.pending, loading)
      .addCase(getCollectionItemById.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.selectedItem = action.payload?.data || null;
      })
      .addCase(getCollectionItemById.rejected, failed)
      .addCase(getCollectionStats.pending, (state) => {
        state.statsStatus = "loading";
        state.statsError = null;
      })
      .addCase(getCollectionStats.fulfilled, (state, action) => {
        state.statsStatus = "succeeded";
        state.statsError = null;
        state.stats = action.payload?.data || null;
      })
      .addCase(getCollectionStats.rejected, (state, action) => {
        state.statsStatus = "failed";
        state.statsError = action.payload;
      })
      .addCase(getCollectionValue.pending, (state) => {
        state.valueStatus = "loading";
        state.valueError = null;
      })
      .addCase(getCollectionValue.fulfilled, (state, action) => {
        state.valueStatus = "succeeded";
        state.valueError = null;
        state.value = action.payload?.data || null;
      })
      .addCase(getCollectionValue.rejected, (state, action) => {
        state.valueStatus = "failed";
        state.valueError = action.payload;
      });
  },
});

export const { clearCollectionError } = collectionSlice.actions;
export default collectionSlice.reducer;
