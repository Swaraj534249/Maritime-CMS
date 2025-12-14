import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { createVesselOwner, getAllVesselOwners, getVesselOwnerByUserId, updateVesselOwnerById } from './VesselOwnerApi'

const initialState = {
  status: "idle",
  vesselOwnerUpdateStatus: "idle",
  vesselOwnerFetchStatus: "idle",
  vesselOwners: [],
  totalCount: 0,
  currentVesselOwner: null,
  errors: null,
  successMessage: null
}

// Accept an object { params, signal } so component can pass AbortController.signal
export const getAllVesselOwnersAsync = createAsyncThunk(
  "vesselOwners/getAllVesselOwnersAsync",
  async ({ params = {}, signal } = {}) => {
    const res = await getAllVesselOwners(params, signal)
    return res
  }
)

export const createVesselOwnerAsync = createAsyncThunk("vesselOwners/createVesselOwnerAsync", async (vesselOwner) => {
  const createdVesselOwner = await createVesselOwner(vesselOwner)
  return createdVesselOwner
})

export const getVesselOwnerByUserIdAsync = createAsyncThunk("vesselOwners/getVesselOwnerByUserIdAsync", async (id) => {
  const selectedVesselOwners = await getVesselOwnerByUserId(id)
  return selectedVesselOwners
})

export const updateVesselOwnerByIdAsync = createAsyncThunk("vesselOwners/updateVesselOwnerByIdAsync", async (update) => {
  const updatedVesselOwner = await updateVesselOwnerById(update)
  return updatedVesselOwner
})

const vesselOwnerSlice = createSlice({
  name: 'vesselOwnerSlice',
  initialState,
  reducers: {
    resetCurrentVesselOwner: (state) => {
      state.currentVesselOwner = null
    },
    resetVesselOwnerUpdateStatus: (state) => {
      state.vesselOwnerUpdateStatus = 'idle'
    },
    resetVesselOwnerFetchStatus: (state) => {
      state.vesselOwnerFetchStatus = 'idle'
    }
  },
  extraReducers: (builder) => {
    builder
      // create...
      .addCase(createVesselOwnerAsync.pending, (state) => {
        state.status = 'pending'
      })
      .addCase(createVesselOwnerAsync.fulfilled, (state, action) => {
        state.status = 'fulfilled'
        state.vesselOwners.push(action.payload)
        state.currentVesselOwner = action.payload
      })
      .addCase(createVesselOwnerAsync.rejected, (state, action) => {
        state.status = 'rejected'
        state.errors = action.error
      })

      // getAll now uses server-side payload { data, total }
      .addCase(getAllVesselOwnersAsync.pending, (state) => {
        state.vesselOwnerFetchStatus = 'pending'
      })
      .addCase(getAllVesselOwnersAsync.fulfilled, (state, action) => {
        state.vesselOwnerFetchStatus = 'fulfilled'
        state.vesselOwners = action.payload.data
        state.totalCount = action.payload.total ?? action.payload.data.length
      })
      .addCase(getAllVesselOwnersAsync.rejected, (state, action) => {
        state.vesselOwnerFetchStatus = 'rejected'
        state.errors = action.error
      })

      // getByUser...
      .addCase(getVesselOwnerByUserIdAsync.pending, (state) => {
        state.vesselOwnerFetchStatus = 'pending'
      })
      .addCase(getVesselOwnerByUserIdAsync.fulfilled, (state, action) => {
        state.vesselOwnerFetchStatus = 'fulfilled'
        state.selectedVesselOwners = action.payload
      })
      .addCase(getVesselOwnerByUserIdAsync.rejected, (state, action) => {
        state.vesselOwnerFetchStatus = 'rejected'
        state.errors = action.error
      })

      // update...
      .addCase(updateVesselOwnerByIdAsync.pending, (state) => {
        state.vesselOwnerUpdateStatus = 'pending'
      })
      .addCase(updateVesselOwnerByIdAsync.fulfilled, (state, action) => {
        state.vesselOwnerUpdateStatus = 'fulfilled'
        const index = state.vesselOwners.findIndex((vesselOwner) => vesselOwner._id === action.payload._id)
        if (index !== -1) state.vesselOwners[index] = action.payload
      })
      .addCase(updateVesselOwnerByIdAsync.rejected, (state, action) => {
        state.vesselOwnerUpdateStatus = 'rejected'
        state.errors = action.error
      })
  }
})

// exports
export const { resetCurrentVesselOwner, resetVesselOwnerUpdateStatus, resetVesselOwnerFetchStatus } = vesselOwnerSlice.actions

export const selectVesselOwnerStatus = (state) => state.VesselOwnerSlice.status
export const selectVesselOwners = (state) => state.VesselOwnerSlice.vesselOwners
export const selectVesselOwnersErrors = (state) => state.VesselOwnerSlice.errors
export const selectVesselOwnersSuccessMessage = (state) => state.VesselOwnerSlice.successMessage
export const selectCurrentVesselOwner = (state) => state.VesselOwnerSlice.currentVesselOwner
export const selectVesselOwnerUpdateStatus = (state) => state.VesselOwnerSlice.vesselOwnerUpdateStatus
export const selectVesselOwnerFetchStatus = (state) => state.VesselOwnerSlice.vesselOwnerFetchStatus
export const selectSelectedVesselOwners = (state) => state.VesselOwnerSlice.selectedVesselOwners
export const selectVesselOwnersTotalCount = (state) => state.VesselOwnerSlice.totalCount

export default vesselOwnerSlice.reducer