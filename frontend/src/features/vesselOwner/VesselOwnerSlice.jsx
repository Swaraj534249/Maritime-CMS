import { createSlice } from "@reduxjs/toolkit";
import { createApiThunk } from "../../config/thunkHelpers";
import {
  createVesselOwner,
  fetchVesselOwners,
  getVesselOwnerById,
  toggleVesselOwnerStatus,
  updateVesselOwnerById,
} from "./VesselOwnerApi";

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
      sortField: "_id",
      sortOrder: "asc",
    },
    aggregates: {
      vesselCountByOwner: {},
      counts: {
        total: 0,
        active: 0,
        deleted: 0,
      },
    },
    context: {},
  },

  current: null,
  selectedByUser: null,

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

export const fetchVesselOwnersAsync = createApiThunk(
  "vesselOwners/fetch",
  ({ params = {}, signal } = {}) => fetchVesselOwners(params, signal),
);

export const createVesselOwnerAsync = createApiThunk(
  "vesselOwners/create",
  (payload) => createVesselOwner(payload),
);

export const updateVesselOwnerByIdAsync = createApiThunk(
  "vesselOwners/update",
  (payload) => updateVesselOwnerById(payload),
);

export const fetchVesselOwnerByIdAsync = createApiThunk(
  "vesselOwners/getById",
  (id) => getVesselOwnerById(id),
);

export const toggleVesselOwnerStatusAsync = createApiThunk(
  "vesselOwners/toggleStatus",
  (payload) => toggleVesselOwnerStatus(payload),
);

const vesselOwnerSlice = createSlice({
  name: "vesselOwners",
  initialState,
  reducers: {
    resetStatuses(state) {
      state.status.fetch = "idle";
      state.status.create = "idle";
      state.status.update = "idle";
      state.error = null;
    },
    resetCurrentVesselOwner(state) {
      state.current = null;
    },
    setPaginationModel(state, action) {
      state.ui.paginationModel = action.payload;
    },

    setSortModel(state, action) {
      state.ui.sortModel = action.payload;
    },

    setSearchValue(state, action) {
      state.ui.searchValue = action.payload;
    },

    resetVesselOwnerTableState: (state) => {
      state.ui.paginationModel = { page: 0, pageSize: 10 };
      state.ui.sortModel = [];
      state.ui.searchValue = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVesselOwnersAsync.pending, (state) => {
        state.status.fetch = "pending";
      })
      .addCase(fetchVesselOwnersAsync.fulfilled, (state, action) => {
        state.status.fetch = "fulfilled";

        const { data, meta, aggregates, context } = action.payload || {};

        state.list.data = data || [];
        state.list.meta = meta || initialState.list.meta;
        state.list.aggregates = aggregates || initialState.list.aggregates;
        state.list.context = context || {};

        state.totalCount = meta?.pagination?.totalRecords || 0;
      })
      .addCase(fetchVesselOwnersAsync.rejected, (state, action) => {
        state.status.fetch = "rejected";
        state.error = action.payload;
      })

      .addCase(createVesselOwnerAsync.pending, (state) => {
        state.status.create = "pending";
      })
      .addCase(createVesselOwnerAsync.fulfilled, (state, action) => {
        state.status.create = "fulfilled";
        state.list.data.unshift(action.payload);
        state.current = action.payload;
      })
      .addCase(createVesselOwnerAsync.rejected, (state, action) => {
        state.status.create = "rejected";
        state.error = action.payload;
      })

      .addCase(updateVesselOwnerByIdAsync.pending, (state) => {
        state.status.update = "pending";
      })
      .addCase(updateVesselOwnerByIdAsync.fulfilled, (state, action) => {
        state.status.update = "fulfilled";
        const idx = state.list.data.findIndex(
          (v) => v._id === action.payload._id,
        );
        if (idx !== -1) state.list.data[idx] = action.payload;
      })
      .addCase(updateVesselOwnerByIdAsync.rejected, (state, action) => {
        state.status.update = "rejected";
        state.error = action.payload;
      })

      .addCase(fetchVesselOwnerByIdAsync.fulfilled, (state, action) => {
        state.selectedByUser = action.payload;
      })

      .addCase(toggleVesselOwnerStatusAsync.pending, (state) => {
        state.status.update = "pending";
      })
      .addCase(toggleVesselOwnerStatusAsync.fulfilled, (state, action) => {
        state.status.update = "fulfilled";
        const updated = action.payload;
        if (updated.isDeleted) {
          state.list.data = state.list.data.filter(
            (item) => item._id !== updated._id,
          );
        } else {
          const idx = state.list.data.findIndex((v) => v._id === updated._id);
          if (idx !== -1) {
            state.list.data[idx] = updated;
          }
        }
      })
      .addCase(toggleVesselOwnerStatusAsync.rejected, (state, action) => {
        state.status.update = "rejected";
        state.error = action.payload;
      });
  },
});

export const {
  resetStatuses,
  resetCurrentVesselOwner,
  setPaginationModel,
  setSortModel,
  setSearchValue,
  resetVesselOwnerTableState,
} = vesselOwnerSlice.actions;

export default vesselOwnerSlice.reducer;

const base = (state) => state.VesselOwnerSlice;

export const selectVesselOwners = (state) => base(state).list.data;
export const selectVesselOwnersMeta = (state) => base(state).list.meta;
export const selectVesselOwnersAggregates = (state) =>
  base(state).list.aggregates;
export const selectVesselOwnersContext = (state) => base(state).list.context;

export const selectTotalCount = (state) =>
  base(state).list.meta.pagination.totalRecords;

export const selectFetchStatus = (state) => base(state).status.fetch;
export const selectCreateStatus = (state) => base(state).status.create;
export const selectUpdateStatus = (state) => base(state).status.update;

export const selectActiveCount = (state) =>
  base(state).list.aggregates.counts.active;

export const selectDeletedCount = (state) =>
  base(state).list.aggregates.counts.deleted;

export const selectPaginationModel = (state) => base(state).ui.paginationModel;

export const selectSortModel = (state) => base(state).ui.sortModel;

export const selectSearchValue = (state) => base(state).ui.searchValue;
