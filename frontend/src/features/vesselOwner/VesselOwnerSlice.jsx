import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {
  createVesselOwner,
  getAllVesselOwners,
  getVesselOwnerByUserId,
  updateVesselOwnerById
} from './VesselOwnerApi'

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
      sortField: '_id',
      sortOrder: 'asc',
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
    fetch: 'idle',
    create: 'idle',
    update: 'idle',
  },

  ui: {
    paginationModel: { page: 0, pageSize: 10 },
    sortModel: [],
    searchValue: '',
  },

  error: null,
}

export const getAllVesselOwnersAsync = createAsyncThunk(
  'vesselOwners/fetchAll',
  async ({ params = {}, signal } = {}, { rejectWithValue }) => {
    try {
      return await getAllVesselOwners(params, signal)
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

export const createVesselOwnerAsync = createAsyncThunk(
  'vesselOwners/create',
  async (payload, { rejectWithValue }) => {
    try {
      return await createVesselOwner(payload)
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

export const updateVesselOwnerByIdAsync = createAsyncThunk(
  'vesselOwners/update',
  async (payload, { rejectWithValue }) => {
    try {
      return await updateVesselOwnerById(payload)
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

export const getVesselOwnerByUserIdAsync = createAsyncThunk(
  'vesselOwners/getByUser',
  async (id, { rejectWithValue }) => {
    try {
      return await getVesselOwnerByUserId(id)
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message)
    }
  }
)

const vesselOwnerSlice = createSlice({
  name: 'vesselOwners',
  initialState,
  reducers: {
    resetStatuses(state) {
      state.status.fetch = 'idle'
      state.status.create = 'idle'
      state.status.update = 'idle'
      state.error = null
    },
    resetCurrentVesselOwner(state) {
      state.current = null
    },
    setPaginationModel(state, action) {
    state.ui.paginationModel = action.payload
  },

  setSortModel(state, action) {
    state.ui.sortModel = action.payload
  },

  setSearchValue(state, action) {
    state.ui.searchValue = action.payload
  },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllVesselOwnersAsync.pending, (state) => {
        state.status.fetch = 'pending'
      })
      .addCase(getAllVesselOwnersAsync.fulfilled, (state, action) => {
        state.status.fetch = 'fulfilled'

        const { data, meta, aggregates, context } = action.payload || {}

        state.list.data = data || []
        state.list.meta = meta || initialState.list.meta
        state.list.aggregates = aggregates || initialState.list.aggregates
        state.list.context = context || {}

        state.totalCount = meta?.pagination?.totalRecords || 0
      })
      .addCase(getAllVesselOwnersAsync.rejected, (state, action) => {
        state.status.fetch = 'rejected'
        state.error = action.payload
      })

      .addCase(createVesselOwnerAsync.pending, (state) => {
        state.status.create = 'pending'
      })
      .addCase(createVesselOwnerAsync.fulfilled, (state, action) => {
        state.status.create = 'fulfilled'
        state.list.data.unshift(action.payload)
        state.current = action.payload
      })
      .addCase(createVesselOwnerAsync.rejected, (state, action) => {
        state.status.create = 'rejected'
        state.error = action.payload
      })

      .addCase(updateVesselOwnerByIdAsync.pending, (state) => {
        state.status.update = 'pending'
      })
      .addCase(updateVesselOwnerByIdAsync.fulfilled, (state, action) => {
        state.status.update = 'fulfilled'
        const idx = state.list.data.findIndex(v => v._id === action.payload._id)
        if (idx !== -1) state.list.data[idx] = action.payload
      })
      .addCase(updateVesselOwnerByIdAsync.rejected, (state, action) => {
        state.status.update = 'rejected'
        state.error = action.payload
      })

      .addCase(getVesselOwnerByUserIdAsync.fulfilled, (state, action) => {
        state.selectedByUser = action.payload
      })
  }
})

export const {
  resetStatuses,
  resetCurrentVesselOwner,
  setPaginationModel,
  setSortModel,
  setSearchValue,
} = vesselOwnerSlice.actions

export default vesselOwnerSlice.reducer

const base = (state) => state.VesselOwnerSlice

export const selectVesselOwners = (state) => base(state).list.data
export const selectVesselOwnersMeta = (state) => base(state).list.meta
export const selectVesselOwnersAggregates = (state) => base(state).list.aggregates
export const selectVesselOwnersContext = (state) => base(state).list.context

export const selectTotalCount = (state) =>
  base(state).list.meta.pagination.totalRecords

export const selectFetchStatus = (state) => base(state).status.fetch
export const selectCreateStatus = (state) => base(state).status.create
export const selectUpdateStatus = (state) => base(state).status.update

export const selectActiveCount = (state) =>
  base(state).list.aggregates.counts.active

export const selectDeletedCount = (state) =>
  base(state).list.aggregates.counts.deleted

export const selectPaginationModel = (state) =>
  base(state).ui.paginationModel

export const selectSortModel = (state) =>
  base(state).ui.sortModel

export const selectSearchValue = (state) =>
  base(state).ui.searchValue
