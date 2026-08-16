import { createSlice } from "@reduxjs/toolkit";
import { getUserByEmail, getUserById, getUsers } from "../actions/users/get/users.actions.js";
import { createUser } from "../actions/users/post/users.actions.js";

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
      .addCase(createUser.pending, pending)
      .addCase(createUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.current = action.payload?.data || action.payload || null;
      })
      .addCase(createUser.rejected, rejected)
      .addCase(getUsers.pending, pending)
      .addCase(getUsers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload?.data || [];
      })
      .addCase(getUsers.rejected, rejected)
      .addCase(getUserById.pending, pending)
      .addCase(getUserById.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.current = action.payload?.data || action.payload || null;
      })
      .addCase(getUserById.rejected, rejected)
      .addCase(getUserByEmail.pending, pending)
      .addCase(getUserByEmail.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.current = action.payload?.data || action.payload || null;
      })
      .addCase(getUserByEmail.rejected, rejected);
  },
});

export const { clearUsersError } = usersSlice.actions;
export default usersSlice.reducer;
