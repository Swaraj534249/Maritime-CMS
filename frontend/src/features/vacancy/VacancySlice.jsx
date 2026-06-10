import { createSlice } from "@reduxjs/toolkit";
import { createApiThunk } from "../../config/thunkHelpers";
import {
  fetchVacancies,
  getVacancyById,
  createVacancy,
  updateVacancyById,
  closeVacancy,
} from "./VacancyApi";

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
    create: "idle",
    update: "idle",
  },
  ui: {
    paginationModel: { page: 0, pageSize: 10 },
    sortModel: [{ field: "createdAt", sort: "desc" }],
    searchValue: "",
    statusFilter: "",
  },
  error: null,
};

export const fetchVacanciesAsync = createApiThunk(
  "vacancy/fetch",
  ({ params = {}, signal } = {}) => fetchVacancies(params, signal),
);

export const getVacancyByIdAsync = createApiThunk(
  "vacancy/getById",
  (id) => getVacancyById(id),
);

export const createVacancyAsync = createApiThunk(
  "vacancy/create",
  (payload) => createVacancy(payload),
);

export const updateVacancyByIdAsync = createApiThunk(
  "vacancy/update",
  ({ id, ...payload }) => updateVacancyById({ id, ...payload }),
);

export const closeVacancyAsync = createApiThunk(
  "vacancy/close",
  (id) => closeVacancy(id),
);

const vacancySlice = createSlice({
  name: "vacancySlice",
  initialState,
  reducers: {
    resetVacancyStatuses(state) {
      state.status.create = "idle";
      state.status.update = "idle";
      state.error = null;
    },
    setVacancyPaginationModel(state, action) {
      state.ui.paginationModel = action.payload;
    },
    setVacancySortModel(state, action) {
      state.ui.sortModel = action.payload;
    },
    setVacancySearchValue(state, action) {
      state.ui.searchValue = action.payload;
    },
    setVacancyStatusFilter(state, action) {
      state.ui.statusFilter = action.payload;
    },
    clearSelectedVacancy(state) {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVacanciesAsync.pending, (state) => {
        state.status.fetch = "pending";
      })
      .addCase(fetchVacanciesAsync.fulfilled, (state, action) => {
        state.status.fetch = "fulfilled";
        const { data, meta } = action.payload || {};
        state.list.data = data || [];
        state.list.meta = meta || initialState.list.meta;
      })
      .addCase(fetchVacanciesAsync.rejected, (state, action) => {
        state.status.fetch = "rejected";
        state.error = action.payload;
      })
      .addCase(getVacancyByIdAsync.fulfilled, (state, action) => {
        state.selected = action.payload;
      })
      .addCase(createVacancyAsync.pending, (state) => {
        state.status.create = "pending";
      })
      .addCase(createVacancyAsync.fulfilled, (state) => {
        state.status.create = "fulfilled";
      })
      .addCase(createVacancyAsync.rejected, (state, action) => {
        state.status.create = "rejected";
        state.error = action.payload;
      })
      .addCase(updateVacancyByIdAsync.pending, (state) => {
        state.status.update = "pending";
      })
      .addCase(updateVacancyByIdAsync.fulfilled, (state, action) => {
        state.status.update = "fulfilled";
        const idx = state.list.data.findIndex(
          (v) => v._id === action.payload._id,
        );
        if (idx !== -1) state.list.data[idx] = action.payload;
      })
      .addCase(updateVacancyByIdAsync.rejected, (state, action) => {
        state.status.update = "rejected";
        state.error = action.payload;
      })
      .addCase(closeVacancyAsync.pending, (state) => {
        state.status.update = "pending";
      })
      .addCase(closeVacancyAsync.fulfilled, (state, action) => {
        state.status.update = "fulfilled";
        const idx = state.list.data.findIndex(
          (v) => v._id === action.payload._id,
        );
        if (idx !== -1) state.list.data[idx] = action.payload;
      })
      .addCase(closeVacancyAsync.rejected, (state, action) => {
        state.status.update = "rejected";
        state.error = action.payload;
      });
  },
});

export const {
  resetVacancyStatuses,
  setVacancyPaginationModel,
  setVacancySortModel,
  setVacancySearchValue,
  setVacancyStatusFilter,
  clearSelectedVacancy,
} = vacancySlice.actions;

export const VACANCY_STATUS_OPTIONS = [
  "Open",
  "Partially Filled",
  "Filled",
  "Closed",
];

export default vacancySlice.reducer;

const base = (state) => state.VacancySlice;

export const selectVacancies = (state) => base(state).list.data;
export const selectVacanciesTotalCount = (state) =>
  base(state).list.meta.pagination?.totalRecords ?? 0;
export const selectVacancyFetchStatus = (state) => base(state).status.fetch;
export const selectVacancyCreateStatus = (state) => base(state).status.create;
export const selectVacancyUpdateStatus = (state) => base(state).status.update;
export const selectVacancyPaginationModel = (state) =>
  base(state).ui.paginationModel;
export const selectVacancySortModel = (state) => base(state).ui.sortModel;
export const selectVacancySearchValue = (state) => base(state).ui.searchValue;
export const selectVacancyStatusFilter = (state) =>
  base(state).ui.statusFilter;
export const selectSelectedVacancy = (state) => base(state).selected;
