import { createSlice } from "@reduxjs/toolkit";
import { createApiThunk } from "../../../config/thunkHelpers";
import {
  fetchVesselTypes,
  createVesselType,
  updateVesselType,
  toggleVesselTypeStatus,
} from "./VesselTypeApi";

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
      sortField: "typeName",
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

export const fetchVesselTypesAsync = createApiThunk(
  "vesselType/fetch",
  ({ params = {}, signal } = {}) => fetchVesselTypes(params, signal),
);

export const createVesselTypeAsync = createApiThunk(
  "vesselType/create",
  (payload) => createVesselType(payload),
);

export const updateVesselTypeAsync = createApiThunk(
  "vesselType/update",
  ({ id, ...payload }) => updateVesselType({ id, ...payload }),
);

export const toggleVesselTypeStatusAsync = createApiThunk(
  "vesselType/toggleStatus",
  (id) => toggleVesselTypeStatus(id),
);

const vesselTypeSlice = createSlice({
  name: "vesselTypeSlice",
  initialState,
  reducers: {
    resetVesselTypeStatuses(state) {
      state.status.create = "idle";
      state.status.update = "idle";
      state.error = null;
    },
    setVesselTypePaginationModel(state, action) {
      state.ui.paginationModel = action.payload;
    },
    setVesselTypeSortModel(state, action) {
      state.ui.sortModel = action.payload;
    },
    setVesselTypeSearchValue(state, action) {
      state.ui.searchValue = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVesselTypesAsync.pending, (state) => {
        state.status.fetch = "pending";
      })
      .addCase(fetchVesselTypesAsync.fulfilled, (state, action) => {
        state.status.fetch = "fulfilled";
        const { data, meta } = action.payload || {};
        state.list.data = data || [];
        state.list.meta = meta || initialState.list.meta;
      })
      .addCase(fetchVesselTypesAsync.rejected, (state, action) => {
        state.status.fetch = "rejected";
        state.error = action.payload;
      })
      .addCase(createVesselTypeAsync.pending, (state) => {
        state.status.create = "pending";
      })
      .addCase(createVesselTypeAsync.fulfilled, (state) => {
        state.status.create = "fulfilled";
      })
      .addCase(createVesselTypeAsync.rejected, (state, action) => {
        state.status.create = "rejected";
        state.error = action.payload;
      })
      .addCase(updateVesselTypeAsync.pending, (state) => {
        state.status.update = "pending";
      })
      .addCase(updateVesselTypeAsync.fulfilled, (state) => {
        state.status.update = "fulfilled";
      })
      .addCase(updateVesselTypeAsync.rejected, (state, action) => {
        state.status.update = "rejected";
        state.error = action.payload;
      })
      .addCase(toggleVesselTypeStatusAsync.pending, (state) => {
        state.status.update = "pending";
      })
      .addCase(toggleVesselTypeStatusAsync.fulfilled, (state, action) => {
        state.status.update = "fulfilled";
        const idx = state.list.data.findIndex(
          (r) => r._id === action.payload._id,
        );
        if (idx !== -1) state.list.data[idx] = action.payload;
      })
      .addCase(toggleVesselTypeStatusAsync.rejected, (state, action) => {
        state.status.update = "rejected";
        state.error = action.payload;
      });
  },
});

export const {
  resetVesselTypeStatuses,
  setVesselTypePaginationModel,
  setVesselTypeSortModel,
  setVesselTypeSearchValue,
} = vesselTypeSlice.actions;

export default vesselTypeSlice.reducer;

const base = (state) => state.VesselTypeSlice;

export const selectVesselTypes = (state) => base(state).list.data;
export const selectVesselTypesTotalCount = (state) =>
  base(state).list.meta.pagination?.totalRecords ?? 0;
export const selectVesselTypeFetchStatus = (state) => base(state).status.fetch;
export const selectVesselTypeCreateStatus = (state) =>
  base(state).status.create;
export const selectVesselTypeUpdateStatus = (state) =>
  base(state).status.update;
export const selectVesselTypePaginationModel = (state) =>
  base(state).ui.paginationModel;
export const selectVesselTypeSortModel = (state) => base(state).ui.sortModel;
export const selectVesselTypeSearchValue = (state) =>
  base(state).ui.searchValue;
