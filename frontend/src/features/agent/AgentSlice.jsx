import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  createAgent,
  fetchAgents,
  getAgentById,
  toggleAgentStatus,
  updateAgentById,
  resetAgentPassword,
} from "./AgentApi";

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
        verified: 0,
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

export const fetchAgentsAsync = createAsyncThunk(
  "agents/fetch",
  async ({ params = {}, signal } = {}, { rejectWithValue }) => {
    try {
      return await fetchAgents(params, signal);
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const createAgentAsync = createAsyncThunk(
  "agents/create",
  async (payload, { rejectWithValue }) => {
    try {
      return await createAgent(payload);
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const updateAgentByIdAsync = createAsyncThunk(
  "agents/update",
  async (payload, { rejectWithValue }) => {
    try {
      return await updateAgentById(payload);
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchAgentByIdAsync = createAsyncThunk(
  "agents/getById",
  async (id, { rejectWithValue }) => {
    try {
      return await getAgentById(id);
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const toggleAgentStatusAsync = createAsyncThunk(
  "agents/toggleStatus",
  async (payload, { rejectWithValue }) => {
    try {
      return await toggleAgentStatus(payload);
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const resetAgentPasswordAsync = createAsyncThunk(
  "agents/resetPassword",
  async (payload, { rejectWithValue }) => {
    try {
      return await resetAgentPassword(payload);
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const agentSlice = createSlice({
  name: "agents",
  initialState,
  reducers: {
    resetStatuses(state) {
      state.status.fetch = "idle";
      state.status.create = "idle";
      state.status.update = "idle";
      state.error = null;
    },
    resetCurrentAgent(state) {
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
    resetAgentTableState: (state) => {
      state.ui.paginationModel = { page: 0, pageSize: 10 };
      state.ui.sortModel = [];
      state.ui.searchValue = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Agents
      .addCase(fetchAgentsAsync.pending, (state) => {
        state.status.fetch = "pending";
      })
      .addCase(fetchAgentsAsync.fulfilled, (state, action) => {
        state.status.fetch = "fulfilled";

        const { data, meta, aggregates, context } = action.payload || {};

        state.list.data = data || [];
        state.list.meta = meta || initialState.list.meta;
        state.list.aggregates = aggregates || initialState.list.aggregates;
        state.list.context = context || {};

        state.totalCount = meta?.pagination?.totalRecords || 0;
      })
      .addCase(fetchAgentsAsync.rejected, (state, action) => {
        state.status.fetch = "rejected";
        state.error = action.payload;
      })

      // Create Agent
      .addCase(createAgentAsync.pending, (state) => {
        state.status.create = "pending";
      })
      .addCase(createAgentAsync.fulfilled, (state, action) => {
        state.status.create = "fulfilled";
        state.list.data.unshift(action.payload);
        state.current = action.payload;
      })
      .addCase(createAgentAsync.rejected, (state, action) => {
        state.status.create = "rejected";
        state.error = action.payload;
      })

      // Update Agent
      .addCase(updateAgentByIdAsync.pending, (state) => {
        state.status.update = "pending";
      })
      .addCase(updateAgentByIdAsync.fulfilled, (state, action) => {
        state.status.update = "fulfilled";
        const idx = state.list.data.findIndex(
          (v) => v._id === action.payload._id
        );
        if (idx !== -1) state.list.data[idx] = action.payload;
      })
      .addCase(updateAgentByIdAsync.rejected, (state, action) => {
        state.status.update = "rejected";
        state.error = action.payload;
      })

      // Get Agent By ID
      .addCase(fetchAgentByIdAsync.fulfilled, (state, action) => {
        state.selectedByUser = action.payload;
      })

      // Toggle Agent Status
      .addCase(toggleAgentStatusAsync.pending, (state) => {
        state.status.update = "pending";
      })
      .addCase(toggleAgentStatusAsync.fulfilled, (state, action) => {
        state.status.update = "fulfilled";
        const updated = action.payload;
        const idx = state.list.data.findIndex((v) => v._id === updated._id);
        if (idx !== -1) {
          state.list.data[idx] = updated;
        }
      })
      .addCase(toggleAgentStatusAsync.rejected, (state, action) => {
        state.status.update = "rejected";
        state.error = action.payload;
      })

      // Reset Password
      .addCase(resetAgentPasswordAsync.pending, (state) => {
        state.status.update = "pending";
      })
      .addCase(resetAgentPasswordAsync.fulfilled, (state) => {
        state.status.update = "fulfilled";
      })
      .addCase(resetAgentPasswordAsync.rejected, (state, action) => {
        state.status.update = "rejected";
        state.error = action.payload;
      });
  },
});

export const {
  resetStatuses,
  resetCurrentAgent,
  setPaginationModel,
  setSortModel,
  setSearchValue,
  resetAgentTableState,
} = agentSlice.actions;

export default agentSlice.reducer;

// Selectors
const base = (state) => state.AgentSlice;

export const selectAgents = (state) => base(state).list.data;
export const selectAgentsMeta = (state) => base(state).list.meta;
export const selectAgentsAggregates = (state) => base(state).list.aggregates;
export const selectAgentsContext = (state) => base(state).list.context;

export const selectTotalCount = (state) =>
  base(state).list.meta.pagination.totalRecords;

export const selectFetchStatus = (state) => base(state).status.fetch;
export const selectCreateStatus = (state) => base(state).status.create;
export const selectUpdateStatus = (state) => base(state).status.update;

export const selectActiveCount = (state) =>
  base(state).list.aggregates.counts.active;

export const selectInactiveCount = (state) =>
  base(state).list.aggregates.counts.inactive;

export const selectVerifiedCount = (state) =>
  base(state).list.aggregates.counts.verified;

export const selectPaginationModel = (state) => base(state).ui.paginationModel;

export const selectSortModel = (state) => base(state).ui.sortModel;

export const selectSearchValue = (state) => base(state).ui.searchValue;

export const selectAgency = (state) => base(state).list.context.agency;