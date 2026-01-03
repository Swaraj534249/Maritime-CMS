import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  createAgency,
  fetchAgencies,
  getAgencyById,
  toggleAgencyStatus,
  updateAgencyById,
} from "./AgencyApi";

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
      counts: {
        total: 0,
        active: 0,
        inactive: 0,
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

export const fetchAgenciesAsync = createAsyncThunk(
  "agencies/fetch",
  async ({ params = {}, signal } = {}, { rejectWithValue }) => {
    try {
      return await fetchAgencies(params, signal);
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const createAgencyAsync = createAsyncThunk(
  "agencies/create",
  async (payload, { rejectWithValue }) => {
    try {
      return await createAgency(payload);
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const updateAgencyByIdAsync = createAsyncThunk(
  "agencies/update",
  async (payload, { rejectWithValue }) => {
    try {
      return await updateAgencyById(payload);
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchAgencyByIdAsync = createAsyncThunk(
  "agencies/getById",
  async (id, { rejectWithValue }) => {
    try {
      return await getAgencyById(id);
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const toggleAgencyStatusAsync = createAsyncThunk(
  "agencies/toggleStatus",
  async (payload, { rejectWithValue }) => {
    try {
      return await toggleAgencyStatus(payload);
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const agencySlice = createSlice({
  name: "agencies",
  initialState,
  reducers: {
    resetStatuses(state) {
      state.status.fetch = "idle";
      state.status.create = "idle";
      state.status.update = "idle";
      state.error = null;
    },
    resetCurrentAgency(state) {
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
    resetAgencyTableState: (state) => {
      state.ui.paginationModel = { page: 0, pageSize: 10 };
      state.ui.sortModel = [];
      state.ui.searchValue = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Agencies
      .addCase(fetchAgenciesAsync.pending, (state) => {
        state.status.fetch = "pending";
      })
      .addCase(fetchAgenciesAsync.fulfilled, (state, action) => {
        state.status.fetch = "fulfilled";

        const { data, meta, aggregates, context } = action.payload || {};

        state.list.data = data || [];
        state.list.meta = meta || initialState.list.meta;
        state.list.aggregates = aggregates || initialState.list.aggregates;
        state.list.context = context || {};
      })
      .addCase(fetchAgenciesAsync.rejected, (state, action) => {
        state.status.fetch = "rejected";
        state.error = action.payload;
      })

      // Create Agency
      .addCase(createAgencyAsync.pending, (state) => {
        state.status.create = "pending";
      })
      .addCase(createAgencyAsync.fulfilled, (state, action) => {
        state.status.create = "fulfilled";
        // The response contains both agency and admin
        if (action.payload.agency) {
          state.list.data.unshift({
            ...action.payload.agency,
            admin: action.payload.admin,
          });
          state.current = action.payload.agency;
        }
      })
      .addCase(createAgencyAsync.rejected, (state, action) => {
        state.status.create = "rejected";
        state.error = action.payload;
      })

      // Update Agency
      .addCase(updateAgencyByIdAsync.pending, (state) => {
        state.status.update = "pending";
      })
      .addCase(updateAgencyByIdAsync.fulfilled, (state, action) => {
        state.status.update = "fulfilled";
        const idx = state.list.data.findIndex(
          (v) => v._id === action.payload.agency._id
        );
        if (idx !== -1) {
          state.list.data[idx] = {
            ...action.payload.agency,
            admin: action.payload.admin || state.list.data[idx].admin,
          };
        }
      })
      .addCase(updateAgencyByIdAsync.rejected, (state, action) => {
        state.status.update = "rejected";
        state.error = action.payload;
      })

      // Get Agency By ID
      .addCase(fetchAgencyByIdAsync.fulfilled, (state, action) => {
        state.selectedByUser = action.payload;
      })

      // Toggle Agency Status
      .addCase(toggleAgencyStatusAsync.pending, (state) => {
        state.status.update = "pending";
      })
      .addCase(toggleAgencyStatusAsync.fulfilled, (state, action) => {
        state.status.update = "fulfilled";
        const updated = action.payload;
        const idx = state.list.data.findIndex((v) => v._id === updated._id);
        if (idx !== -1) {
          state.list.data[idx] = {
            ...state.list.data[idx],
            ...updated,
          };
        }
      })
      .addCase(toggleAgencyStatusAsync.rejected, (state, action) => {
        state.status.update = "rejected";
        state.error = action.payload;
      });
  },
});

export const {
  resetStatuses,
  resetCurrentAgency,
  setPaginationModel,
  setSortModel,
  setSearchValue,
  resetAgencyTableState,
} = agencySlice.actions;

export default agencySlice.reducer;

// Selectors
const base = (state) => state.AgencySlice;

export const selectAgencies = (state) => base(state).list.data;
export const selectAgenciesMeta = (state) => base(state).list.meta;
export const selectAgenciesAggregates = (state) => base(state).list.aggregates;
export const selectAgenciesContext = (state) => base(state).list.context;

export const selectTotalCount = (state) =>
  base(state).list.meta.pagination.totalRecords;

export const selectFetchStatus = (state) => base(state).status.fetch;
export const selectCreateStatus = (state) => base(state).status.create;
export const selectUpdateStatus = (state) => base(state).status.update;

export const selectActiveCount = (state) =>
  base(state).list.aggregates.counts.active;

export const selectInactiveCount = (state) =>
  base(state).list.aggregates.counts.inactive;

export const selectPaginationModel = (state) => base(state).ui.paginationModel;

export const selectSortModel = (state) => base(state).ui.sortModel;

export const selectSearchValue = (state) => base(state).ui.searchValue;