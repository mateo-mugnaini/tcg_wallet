import { createAsyncThunk } from "@reduxjs/toolkit";

export function serializeApiError(error) {
  return {
    message: error?.message || "La solicitud no pudo completarse",
    code: error?.code || "API_ERROR",
    status: error?.status || 0,
  };
}

export function createApiAction(typePrefix, request) {
  return createAsyncThunk(typePrefix, async (payload, thunkApi) => {
    try {
      return await request(payload, thunkApi);
    } catch (error) {
      return thunkApi.rejectWithValue(serializeApiError(error));
    }
  });
}
