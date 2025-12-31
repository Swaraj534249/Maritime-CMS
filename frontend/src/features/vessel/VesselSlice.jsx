import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  createVessel,
  getAllVessels,
  getVesselByUserId,
  fetchVesselByVesselOwnerId,
  updateVesselById,
} from "./VesselApi";

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

/* ===================== THUNKS ===================== */

export const getAllVesselsAsync = createAsyncThunk(
  "vessels/fetchAll",
  async ({ params = {}, signal } = {}, { rejectWithValue }) => {
    try {
      return await getAllVessels(params, signal);
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  },
);

export const createVesselAsync = createAsyncThunk(
  "vessels/create",
  async (payload, { rejectWithValue }) => {
    try {
      return await createVessel(payload);
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  },
);

export const updateVesselByIdAsync = createAsyncThunk(
  "vessels/update",
  async (payload, { rejectWithValue }) => {
    try {
      return await updateVesselById(payload);
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  },
);

export const getVesselByUserIdAsync = createAsyncThunk(
  "vessels/getByUser",
  async (id, { rejectWithValue }) => {
    try {
      return await getVesselByUserId(id);
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  },
);

export const fetchVesselByVesselOwnerIdAsync = createAsyncThunk(
  "vessels/fetchByOwner",
  async (ownerId, { rejectWithValue }) => {
    try {
      const vessels = await fetchVesselByVesselOwnerId(ownerId);
      return {
        data: vessels,
        meta: {
          pagination: {
            page: 1,
            pageSize: vessels.length,
            totalRecords: vessels.length,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
      };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  },
);

const vesselSlice = createSlice({
  name: "vessels",
  initialState,
  reducers: {
    resetStatuses(state) {
      state.status.fetch = "idle";
      state.status.create = "idle";
      state.status.update = "idle";
      state.error = null;
    },
    resetCurrentVessel(state) {
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
      /* ---------- Fetch All ---------- */
      .addCase(getAllVesselsAsync.pending, (state) => {
        state.status.fetch = "pending";
      })
      .addCase(getAllVesselsAsync.fulfilled, (state, action) => {
        state.status.fetch = "fulfilled";
        const { data, meta, aggregates, context } = action.payload || {};

        state.list.data = data || [];
        state.list.meta = meta || initialState.list.meta;
        state.list.aggregates = aggregates || initialState.list.aggregates;
        state.list.context = context || {};
      })
      .addCase(getAllVesselsAsync.rejected, (state, action) => {
        state.status.fetch = "rejected";
        state.error = action.payload;
      })

      .addCase(createVesselAsync.pending, (state) => {
        state.status.create = "pending";
      })
      .addCase(createVesselAsync.fulfilled, (state, action) => {
        state.status.create = "fulfilled";
        state.list.data.unshift(action.payload);
        state.current = action.payload;
      })
      .addCase(createVesselAsync.rejected, (state, action) => {
        state.status.create = "rejected";
        state.error = action.payload;
      })

      /* ---------- Update ---------- */
      .addCase(updateVesselByIdAsync.pending, (state) => {
        state.status.update = "pending";
      })
      .addCase(updateVesselByIdAsync.fulfilled, (state, action) => {
        state.status.update = "fulfilled";
        const idx = state.list.data.findIndex(
          (v) => v._id === action.payload._id,
        );
        if (idx !== -1) state.list.data[idx] = action.payload;
      })
      .addCase(updateVesselByIdAsync.rejected, (state, action) => {
        state.status.update = "rejected";
        state.error = action.payload;
      })

      .addCase(fetchVesselByVesselOwnerIdAsync.fulfilled, (state, action) => {
        state.list.data = action.payload.data || [];
        state.list.meta = action.payload.meta || initialState.list.meta;
      })

      .addCase(getVesselByUserIdAsync.fulfilled, (state, action) => {
        state.selectedByUser = action.payload;
      });
  },
});

export const {
  resetStatuses,
  resetCurrentVessel,
  setPaginationModel,
  setSortModel,
  setSearchValue,
} = vesselSlice.actions;

export default vesselSlice.reducer;

const base = (state) => state.VesselSlice;

export const selectVessels = (state) => base(state).list.data;
export const selectVesselsMeta = (state) => base(state).list.meta;
export const selectVesselsAggregates = (state) => base(state).list.aggregates;
export const selectVesselsContext = (state) => base(state).list.context;
export const selectVesselOwnerContext = (state) =>
  base(state).list.context.vesselOwner;

export const selectTotalCount = (state) =>
  base(state).list.meta.pagination.totalRecords;

export const selectFetchStatus = (state) => base(state).status.fetch;
export const selectCreateStatus = (state) => base(state).status.create;
export const selectUpdateStatus = (state) => base(state).status.update;

export const selectPaginationModel = (state) => base(state).ui.paginationModel;

export const selectSortModel = (state) => base(state).ui.sortModel;

export const selectSearchValue = (state) => base(state).ui.searchValue;
