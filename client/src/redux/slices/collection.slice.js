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
      .addCase(getCollectionStats.fulfilled, (state, action) => {
        state.stats = action.payload?.data || null;
      })
      .addCase(getCollectionValue.fulfilled, (state, action) => {
        state.value = action.payload?.data || null;
      });
  },
});

export const { clearCollectionError } = collectionSlice.actions;
export default collectionSlice.reducer;
