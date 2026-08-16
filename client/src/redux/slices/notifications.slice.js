import { createSlice } from "@reduxjs/toolkit";

const initialState = { items: [] };

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification: {
      reducer: (state, action) => {
        state.items.push(action.payload);
        if (state.items.length > 4) state.items.shift();
      },
      prepare: ({ message, title, type = "error", duration = 4500 }) => ({
        payload: {
          duration,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          message,
          title: title || (type === "success" ? "Completado" : "Atención"),
          type,
        },
      }),
    },
    dismissNotification: (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.items = [];
    },
  },
});

export const {
  addNotification,
  clearNotifications,
  dismissNotification,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
