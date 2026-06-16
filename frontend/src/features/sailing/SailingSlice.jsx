import { createSlice } from "@reduxjs/toolkit";
import { createApiThunk } from "../../config/thunkHelpers";
import { fetchSailings } from "./SailingApi";

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
    statusCounts: { total: 0, byStatus: {} },
  },
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

export const SAILING_STATUS_OPTIONS = ["Onboard", "Signed Off"];

export const fetchSailingsAsync = createApiThunk(
  "sailing/fetch",
  ({ params = {}, signal } = {}) => fetchSailings(params, signal),
);

const sailingSlice = createSlice({
  name: "sailingSlice",
  initialState,
  reducers: {
    setSailingPaginationModel(state, action) {
      state.ui.paginationModel = action.payload;
    },
    setSailingSortModel(state, action) {
      state.ui.sortModel = action.payload;
    },
    setSailingSearchValue(state, action) {
      state.ui.searchValue = action.payload;
    },
    setSailingStatusFilter(state, action) {
      state.ui.statusFilter = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSailingsAsync.pending, (state) => {
        state.status.fetch = "pending";
      })
      .addCase(fetchSailingsAsync.fulfilled, (state, action) => {
        state.status.fetch = "fulfilled";
        const { data, meta, aggregates } = action.payload || {};
        state.list.data = data || [];
        state.list.meta = meta || initialState.list.meta;
        state.list.statusCounts = aggregates?.statusCounts || {
          total: 0,
          byStatus: {},
        };
      })
      .addCase(fetchSailingsAsync.rejected, (state, action) => {
        state.status.fetch = "rejected";
        state.error = action.payload;
      });
  },
});

export const {
  setSailingPaginationModel,
  setSailingSortModel,
  setSailingSearchValue,
  setSailingStatusFilter,
} = sailingSlice.actions;

export default sailingSlice.reducer;

const base = (state) => state.SailingSlice;

export const selectSailings = (state) => base(state).list.data;
export const selectSailingsTotalCount = (state) =>
  base(state).list.meta.pagination?.totalRecords ?? 0;
export const selectSailingStatusCounts = (state) =>
  base(state).list.statusCounts || { total: 0, byStatus: {} };
export const selectSailingFetchStatus = (state) => base(state).status.fetch;
export const selectSailingPaginationModel = (state) =>
  base(state).ui.paginationModel;
export const selectSailingSortModel = (state) => base(state).ui.sortModel;
export const selectSailingSearchValue = (state) => base(state).ui.searchValue;
export const selectSailingStatusFilter = (state) => base(state).ui.statusFilter;
