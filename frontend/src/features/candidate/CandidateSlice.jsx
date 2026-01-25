import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  createCandidate,
  fetchCandidates,
  getCandidateById,
  toggleCandidateStatus,
  updateCandidateById,
  updateCandidateWorkStatus,
  getAvailableCandidates,
} from "./CandidateApi";

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
        available: 0,
        onboard: 0,
      },
      byStatus: [],
      byRank: [],
    },
    context: {},
  },

  current: null,
  selectedByUser: null,
  availableCandidates: [],

  status: {
    fetch: "idle",
    create: "idle",
    update: "idle",
    available: "idle",
  },

  ui: {
    paginationModel: { page: 0, pageSize: 10 },
    sortModel: [],
    searchValue: "",
  },

  error: null,
};

export const fetchCandidatesAsync = createAsyncThunk(
  "candidates/fetch",
  async ({ params = {}, signal } = {}, { rejectWithValue }) => {
    try {
      return await fetchCandidates(params, signal);
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const createCandidateAsync = createAsyncThunk(
  "candidates/create",
  async (payload, { rejectWithValue }) => {
    try {
      return await createCandidate(payload);
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const updateCandidateByIdAsync = createAsyncThunk(
  "candidates/update",
  async (payload, { rejectWithValue }) => {
    try {
      return await updateCandidateById(payload);
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchCandidateByIdAsync = createAsyncThunk(
  "candidates/getById",
  async (id, { rejectWithValue }) => {
    try {
      return await getCandidateById(id);
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const toggleCandidateStatusAsync = createAsyncThunk(
  "candidates/toggleStatus",
  async (payload, { rejectWithValue }) => {
    try {
      return await toggleCandidateStatus(payload);
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const updateCandidateWorkStatusAsync = createAsyncThunk(
  "candidates/updateWorkStatus",
  async (payload, { rejectWithValue }) => {
    try {
      return await updateCandidateWorkStatus(payload);
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchAvailableCandidatesAsync = createAsyncThunk(
  "candidates/fetchAvailable",
  async (params = {}, { rejectWithValue }) => {
    try {
      return await getAvailableCandidates(params);
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const candidateSlice = createSlice({
  name: "candidates",
  initialState,
  reducers: {
    resetStatuses(state) {
      state.status.fetch = "idle";
      state.status.create = "idle";
      state.status.update = "idle";
      state.error = null;
    },
    resetCurrentCandidate(state) {
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
  },
  extraReducers: (builder) => {
    builder
      // Fetch Candidates
      .addCase(fetchCandidatesAsync.pending, (state) => {
        state.status.fetch = "pending";
      })
      .addCase(fetchCandidatesAsync.fulfilled, (state, action) => {
        state.status.fetch = "fulfilled";
        const { data, meta, aggregates, context } = action.payload || {};

        state.list.data = data || [];
        state.list.meta = meta || initialState.list.meta;
        state.list.aggregates = aggregates || initialState.list.aggregates;
        state.list.context = context || {};
      })
      .addCase(fetchCandidatesAsync.rejected, (state, action) => {
        state.status.fetch = "rejected";
        state.error = action.payload;
      })

      // Create Candidate
      .addCase(createCandidateAsync.pending, (state) => {
        state.status.create = "pending";
      })
      .addCase(createCandidateAsync.fulfilled, (state, action) => {
        state.status.create = "fulfilled";
        state.list.data.unshift(action.payload);
        state.current = action.payload;
      })
      .addCase(createCandidateAsync.rejected, (state, action) => {
        state.status.create = "rejected";
        state.error = action.payload;
      })

      // Update Candidate
      .addCase(updateCandidateByIdAsync.pending, (state) => {
        state.status.update = "pending";
      })
      .addCase(updateCandidateByIdAsync.fulfilled, (state, action) => {
        state.status.update = "fulfilled";
        const idx = state.list.data.findIndex(
          (c) => c._id === action.payload._id
        );
        if (idx !== -1) state.list.data[idx] = action.payload;
      })
      .addCase(updateCandidateByIdAsync.rejected, (state, action) => {
        state.status.update = "rejected";
        state.error = action.payload;
      })

      // Get Candidate By ID
      .addCase(fetchCandidateByIdAsync.fulfilled, (state, action) => {
        state.selectedByUser = action.payload;
      })

      // Toggle Status
      .addCase(toggleCandidateStatusAsync.pending, (state) => {
        state.status.update = "pending";
      })
      .addCase(toggleCandidateStatusAsync.fulfilled, (state, action) => {
        state.status.update = "fulfilled";
        const updated = action.payload;
        const idx = state.list.data.findIndex((c) => c._id === updated._id);
        if (idx !== -1) {
          state.list.data[idx] = updated;
        }
      })
      .addCase(toggleCandidateStatusAsync.rejected, (state, action) => {
        state.status.update = "rejected";
        state.error = action.payload;
      })

      // Update Work Status
      .addCase(updateCandidateWorkStatusAsync.pending, (state) => {
        state.status.update = "pending";
      })
      .addCase(updateCandidateWorkStatusAsync.fulfilled, (state, action) => {
        state.status.update = "fulfilled";
        const updated = action.payload;
        const idx = state.list.data.findIndex((c) => c._id === updated._id);
        if (idx !== -1) {
          state.list.data[idx] = updated;
        }
      })
      .addCase(updateCandidateWorkStatusAsync.rejected, (state, action) => {
        state.status.update = "rejected";
        state.error = action.payload;
      })

      // Get Available Candidates
      .addCase(fetchAvailableCandidatesAsync.pending, (state) => {
        state.status.available = "pending";
      })
      .addCase(fetchAvailableCandidatesAsync.fulfilled, (state, action) => {
        state.status.available = "fulfilled";
        state.availableCandidates = action.payload;
      })
      .addCase(fetchAvailableCandidatesAsync.rejected, (state, action) => {
        state.status.available = "rejected";
        state.error = action.payload;
      });
  },
});

export const {
  resetStatuses,
  resetCurrentCandidate,
  setPaginationModel,
  setSortModel,
  setSearchValue,
} = candidateSlice.actions;

export default candidateSlice.reducer;

// Selectors
const base = (state) => state.CandidateSlice;

export const selectCandidates = (state) => base(state).list.data;
export const selectCandidatesMeta = (state) => base(state).list.meta;
export const selectCandidatesAggregates = (state) => base(state).list.aggregates;
export const selectCandidatesContext = (state) => base(state).list.context;

export const selectTotalCount = (state) =>
  base(state).list.meta.pagination.totalRecords;

export const selectFetchStatus = (state) => base(state).status.fetch;
export const selectCreateStatus = (state) => base(state).status.create;
export const selectUpdateStatus = (state) => base(state).status.update;

export const selectActiveCount = (state) =>
  base(state).list.aggregates.counts.active;
export const selectAvailableCount = (state) =>
  base(state).list.aggregates.counts.available;
export const selectOnboardCount = (state) =>
  base(state).list.aggregates.counts.onboard;

export const selectStatusGroups = (state) =>
  base(state).list.aggregates.byStatus;
export const selectRankGroups = (state) =>
  base(state).list.aggregates.byRank;

export const selectPaginationModel = (state) => base(state).ui.paginationModel;
export const selectSortModel = (state) => base(state).ui.sortModel;
export const selectSearchValue = (state) => base(state).ui.searchValue;

export const selectAgency = (state) => base(state).list.context.agency;
export const selectAvailableCandidates = (state) => base(state).availableCandidates;