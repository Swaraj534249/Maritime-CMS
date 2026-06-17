import { createSlice } from "@reduxjs/toolkit";
import { createApiThunk } from "../../../config/thunkHelpers";
import {
  fetchRanks,
  createRank,
  updateRank,
  toggleRankStatus,
} from "./RankApi";

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
      sortField: "rankName",
      sortOrder: "asc",
    },
  },
  status: {
    fetch: "idle",
    create: "idle",
    update: "idle",
  },
  ui: {
    paginationModel: { page: 0, pageSize: 10 },
    sortModel: [],
    searchValue: "",
  },
  error: null,
};

export const fetchRanksAsync = createApiThunk(
  "rank/fetch",
  ({ params = {}, signal } = {}) => fetchRanks(params, signal),
);

export const createRankAsync = createApiThunk(
  "rank/create",
  (payload) => createRank(payload),
);

export const updateRankAsync = createApiThunk(
  "rank/update",
  ({ id, ...payload }) => updateRank({ id, ...payload }),
);

export const toggleRankStatusAsync = createApiThunk(
  "rank/toggleStatus",
  (id) => toggleRankStatus(id),
);

const rankSlice = createSlice({
  name: "rankSlice",
  initialState,
  reducers: {
    resetRankStatuses(state) {
      state.status.create = "idle";
      state.status.update = "idle";
      state.error = null;
    },
    setRankPaginationModel(state, action) {
      state.ui.paginationModel = action.payload;
    },
    setRankSortModel(state, action) {
      state.ui.sortModel = action.payload;
    },
    setRankSearchValue(state, action) {
      state.ui.searchValue = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRanksAsync.pending, (state) => {
        state.status.fetch = "pending";
      })
      .addCase(fetchRanksAsync.fulfilled, (state, action) => {
        state.status.fetch = "fulfilled";
        const { data, meta } = action.payload || {};
        state.list.data = data || [];
        state.list.meta = meta || initialState.list.meta;
      })
      .addCase(fetchRanksAsync.rejected, (state, action) => {
        state.status.fetch = "rejected";
        state.error = action.payload;
      })
      .addCase(createRankAsync.pending, (state) => {
        state.status.create = "pending";
      })
      .addCase(createRankAsync.fulfilled, (state) => {
        state.status.create = "fulfilled";
      })
      .addCase(createRankAsync.rejected, (state, action) => {
        state.status.create = "rejected";
        state.error = action.payload;
      })
      .addCase(updateRankAsync.pending, (state) => {
        state.status.update = "pending";
      })
      .addCase(updateRankAsync.fulfilled, (state) => {
        state.status.update = "fulfilled";
      })
      .addCase(updateRankAsync.rejected, (state, action) => {
        state.status.update = "rejected";
        state.error = action.payload;
      })
      .addCase(toggleRankStatusAsync.pending, (state) => {
        state.status.update = "pending";
      })
      .addCase(toggleRankStatusAsync.fulfilled, (state, action) => {
        state.status.update = "fulfilled";
        const idx = state.list.data.findIndex(
          (r) => r._id === action.payload._id,
        );
        if (idx !== -1) state.list.data[idx] = action.payload;
      })
      .addCase(toggleRankStatusAsync.rejected, (state, action) => {
        state.status.update = "rejected";
        state.error = action.payload;
      });
  },
});

export const {
  resetRankStatuses,
  setRankPaginationModel,
  setRankSortModel,
  setRankSearchValue,
} = rankSlice.actions;

export default rankSlice.reducer;

const base = (state) => state.RankSlice;

export const selectRanks = (state) => base(state).list.data;
export const selectRanksTotalCount = (state) =>
  base(state).list.meta.pagination?.totalRecords ?? 0;
export const selectRankFetchStatus = (state) => base(state).status.fetch;
export const selectRankCreateStatus = (state) => base(state).status.create;
export const selectRankUpdateStatus = (state) => base(state).status.update;
export const selectRankPaginationModel = (state) =>
  base(state).ui.paginationModel;
export const selectRankSortModel = (state) => base(state).ui.sortModel;
export const selectRankSearchValue = (state) => base(state).ui.searchValue;
