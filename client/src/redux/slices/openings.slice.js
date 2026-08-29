import { createSlice } from "@reduxjs/toolkit";
import {
  getOpeningStatus,
  getSetPokedex,
  openPacks,
} from "../actions/openings/openings.actions.js";

const initialState = {
  status: "idle",
  error: null,
  opening: null,
  openingStatus: { can_open: true, next_open_at: null },
  openingStatusState: "idle",
  pokedex: null,
  pokedexStatus: "idle",
  pokedexError: null,
};

const openingsSlice = createSlice({
  name: "openings",
  initialState,
  reducers: {
    clearOpening: (state) => {
      state.opening = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getOpeningStatus.pending, (state) => {
        state.openingStatusState = "loading";
      })
      .addCase(getOpeningStatus.fulfilled, (state, action) => {
        state.openingStatusState = "succeeded";
        state.openingStatus = action.payload?.data || initialState.openingStatus;
      })
      .addCase(getOpeningStatus.rejected, (state, action) => {
        state.openingStatusState = "failed";
        state.error = action.payload;
      })
      .addCase(getSetPokedex.pending, (state) => {
        state.pokedexStatus = "loading";
        state.pokedexError = null;
      })
      .addCase(getSetPokedex.fulfilled, (state, action) => {
        state.pokedexStatus = "succeeded";
        state.pokedex = action.payload?.data || null;
      })
      .addCase(getSetPokedex.rejected, (state, action) => {
        state.pokedexStatus = "failed";
        state.pokedexError = action.payload;
      })
      .addCase(openPacks.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.opening = null;
      })
      .addCase(openPacks.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.opening = action.payload?.data || null;
        if (action.payload?.data?.next_open_at) {
          state.openingStatus = {
            can_open: false,
            next_open_at: action.payload.data.next_open_at,
          };
        }
      })
      .addCase(openPacks.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { clearOpening } = openingsSlice.actions;
export default openingsSlice.reducer;
