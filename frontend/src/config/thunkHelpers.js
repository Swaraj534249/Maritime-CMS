import { createAsyncThunk } from "@reduxjs/toolkit";

/** Wraps an API call for createAsyncThunk with consistent rejectWithValue handling. */
export function createApiThunk(typePrefix, apiFn) {
  return createAsyncThunk(typePrefix, async (arg, { rejectWithValue }) => {
    try {
      return await apiFn(arg);
    } catch (err) {
      return rejectWithValue(err);
    }
  });
}
