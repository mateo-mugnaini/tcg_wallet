import { createSlice } from "@reduxjs/toolkit";
import { getUserById, getUsers } from "../actions/users/get/users.actions.js";

const usersSlice = createSlice({
  name: "users",
  initialState: { items: [], current: null, status: "idle", error: null },
  reducers: {
    clearUsersError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const pending = (state) => {
      state.status = "loading";
      state.error = null;
    };
    const rejected = (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    };
    builder
      .addCase(getUsers.pending, pending)
      .addCase(getUsers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload?.data || [];
      })
      .addCase(getUsers.rejected, rejected)
      .addCase(getUserById.pending, pending)
      .addCase(getUserById.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.current = action.payload?.data || null;
      })
      .addCase(getUserById.rejected, rejected);
  },
});

export const { clearUsersError } = usersSlice.actions;
export default usersSlice.reducer;
