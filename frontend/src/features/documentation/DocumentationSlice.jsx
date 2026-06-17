import { createSlice } from "@reduxjs/toolkit";
import { createApiThunk } from "../../config/thunkHelpers";
import {
  fetchDocumentations,
  getDocumentationById,
} from "./DocumentationApi";

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
  },
  selected: null,
  status: {
    fetch: "idle",
  },
  ui: {
    paginationModel: { page: 0, pageSize: 10 },
    sortModel: [{ field: "createdAt", sort: "desc" }],
    searchValue: "",
    statusFilter: "",
  },
  error: null,
};

export const DOCUMENTATION_STATUS_OPTIONS = [
  "In Documentation",
  "Verified",
  "Contract Finalized",
];

export const fetchDocumentationsAsync = createApiThunk(
  "documentation/fetch",
  ({ params = {}, signal } = {}) => fetchDocumentations(params, signal),
);

export const getDocumentationByIdAsync = createApiThunk(
  "documentation/getById",
  (id) => getDocumentationById(id),
);

const documentationSlice = createSlice({
  name: "documentationSlice",
  initialState,
  reducers: {
    setDocumentationPaginationModel(state, action) {
      state.ui.paginationModel = action.payload;
    },
    setDocumentationSortModel(state, action) {
      state.ui.sortModel = action.payload;
    },
    setDocumentationSearchValue(state, action) {
      state.ui.searchValue = action.payload;
    },
    setDocumentationStatusFilter(state, action) {
      state.ui.statusFilter = action.payload;
    },
    clearSelectedDocumentation(state) {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocumentationsAsync.pending, (state) => {
        state.status.fetch = "pending";
      })
      .addCase(fetchDocumentationsAsync.fulfilled, (state, action) => {
        state.status.fetch = "fulfilled";
        const { data, meta, aggregates } = action.payload || {};
        state.list.data = data || [];
        state.list.meta = meta || initialState.list.meta;
        state.list.statusCounts = aggregates?.statusCounts || {
          total: 0,
          byStatus: {},
        };
      })
      .addCase(fetchDocumentationsAsync.rejected, (state, action) => {
        state.status.fetch = "rejected";
        state.error = action.payload;
      })
      .addCase(getDocumentationByIdAsync.fulfilled, (state, action) => {
        state.selected = action.payload;
      });
  },
});

export const {
  setDocumentationPaginationModel,
  setDocumentationSortModel,
  setDocumentationSearchValue,
  setDocumentationStatusFilter,
  clearSelectedDocumentation,
} = documentationSlice.actions;

export default documentationSlice.reducer;

const base = (state) => state.DocumentationSlice;

export const selectDocumentations = (state) => base(state).list.data;
export const selectDocumentationsTotalCount = (state) =>
  base(state).list.meta.pagination?.totalRecords ?? 0;
export const selectDocumentationStatusCounts = (state) =>
  base(state).list.statusCounts || { total: 0, byStatus: {} };
export const selectDocumentationFetchStatus = (state) =>
  base(state).status.fetch;
export const selectDocumentationPaginationModel = (state) =>
  base(state).ui.paginationModel;
export const selectDocumentationSortModel = (state) => base(state).ui.sortModel;
export const selectDocumentationSearchValue = (state) =>
  base(state).ui.searchValue;
export const selectDocumentationStatusFilter = (state) =>
  base(state).ui.statusFilter;
export const selectSelectedDocumentation = (state) => base(state).selected;
