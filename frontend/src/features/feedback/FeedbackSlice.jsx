import { createSlice } from "@reduxjs/toolkit";
import { createApiThunk } from "../../config/thunkHelpers";
import {
  submitFeedback,
  fetchFeedbacks,
  getFeedbackById,
  updateFeedbackById,
} from "./FeedbackApi";

const initialState = {
  list: {
    data: [],
    meta: {
      pagination: {
        page: 1,
        pageSize: 10,
        totalRecords: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
      searchValue: null,
      sortField: "createdAt",
      sortOrder: "desc",
    },
    aggregates: {},
    context: {},
  },
  selected: null,
  status: {
    fetch: "idle",
    submit: "idle",
    update: "idle",
  },
  ui: {
    paginationModel: { page: 0, pageSize: 10 },
    sortModel: [{ field: "createdAt", sort: "desc" }],
    searchValue: "",
  },
  error: null,
};

export const submitFeedbackAsync = createApiThunk(
  "feedback/submit",
  (formData) => submitFeedback(formData),
);

export const fetchFeedbacksAsync = createApiThunk(
  "feedback/fetch",
  ({ params = {}, signal } = {}) => fetchFeedbacks(params, signal),
);

export const getFeedbackByIdAsync = createApiThunk(
  "feedback/getById",
  (id) => getFeedbackById(id),
);

export const updateFeedbackByIdAsync = createApiThunk(
  "feedback/update",
  async ({ id, status, note, files = [] }) => {
    const formData = new FormData();
    formData.append("status", status);
    if (note) formData.append("note", note);
    files.forEach((file) => formData.append("attachments", file));
    return updateFeedbackById({ id, formData });
  },
);

const feedbackSlice = createSlice({
  name: "feedbackSlice",
  initialState,
  reducers: {
    resetFeedbackStatuses(state) {
      state.status.submit = "idle";
      state.status.update = "idle";
      state.error = null;
    },
    setFeedbackPaginationModel(state, action) {
      state.ui.paginationModel = action.payload;
    },
    setFeedbackSortModel(state, action) {
      state.ui.sortModel = action.payload;
    },
    setFeedbackSearchValue(state, action) {
      state.ui.searchValue = action.payload;
    },
    clearSelectedFeedback(state) {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitFeedbackAsync.pending, (state) => {
        state.status.submit = "pending";
      })
      .addCase(submitFeedbackAsync.fulfilled, (state) => {
        state.status.submit = "fulfilled";
      })
      .addCase(submitFeedbackAsync.rejected, (state, action) => {
        state.status.submit = "rejected";
        state.error = action.payload;
      })
      .addCase(fetchFeedbacksAsync.pending, (state) => {
        state.status.fetch = "pending";
      })
      .addCase(fetchFeedbacksAsync.fulfilled, (state, action) => {
        state.status.fetch = "fulfilled";
        const { data, meta } = action.payload || {};
        state.list.data = data || [];
        state.list.meta = meta || initialState.list.meta;
      })
      .addCase(fetchFeedbacksAsync.rejected, (state, action) => {
        state.status.fetch = "rejected";
        state.error = action.payload;
      })
      .addCase(getFeedbackByIdAsync.fulfilled, (state, action) => {
        state.selected = action.payload;
      })
      .addCase(updateFeedbackByIdAsync.pending, (state) => {
        state.status.update = "pending";
      })
      .addCase(updateFeedbackByIdAsync.fulfilled, (state, action) => {
        state.status.update = "fulfilled";
        const idx = state.list.data.findIndex(
          (f) => f._id === action.payload._id,
        );
        if (idx !== -1) state.list.data[idx] = action.payload;
        state.selected = action.payload;
      })
      .addCase(updateFeedbackByIdAsync.rejected, (state, action) => {
        state.status.update = "rejected";
        state.error = action.payload;
      });
  },
});

export const {
  resetFeedbackStatuses,
  setFeedbackPaginationModel,
  setFeedbackSortModel,
  setFeedbackSearchValue,
  clearSelectedFeedback,
} = feedbackSlice.actions;

export default feedbackSlice.reducer;

const base = (state) => state.FeedbackSlice;

export const selectFeedbacks = (state) => base(state).list.data;
export const selectFeedbacksTotalCount = (state) =>
  base(state).list.meta.pagination?.totalRecords ?? 0;
export const selectFeedbackFetchStatus = (state) => base(state).status.fetch;
export const selectFeedbackSubmitStatus = (state) => base(state).status.submit;
export const selectFeedbackUpdateStatus = (state) => base(state).status.update;
export const selectFeedbackPaginationModel = (state) => base(state).ui.paginationModel;
export const selectFeedbackSortModel = (state) => base(state).ui.sortModel;
export const selectFeedbackSearchValue = (state) => base(state).ui.searchValue;
export const selectSelectedFeedback = (state) => base(state).selected;
