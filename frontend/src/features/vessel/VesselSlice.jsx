import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { createVessel, getAllVessels, getVesselByUserId, fetchVesselByVesselOwnerId, updateVesselById } from './VesselApi'


const initialState = {
  status: "idle",
  vesselUpdateStatus: "idle",
  vesselFetchStatus: "idle",
  vessels: [],
  totalCount: 0,
  currentVessel: null,
  errors: null,
  successMessage: null
}

export const getAllVesselsAsync = createAsyncThunk(
  "vessels/getAllVesselsAsync",
  async ({ params = {}, signal } = {}) => {
    const res = await getAllVessels(params, signal)
    return res
  }
)

export const createVesselAsync = createAsyncThunk("vessels/createVesselAsync", async (vessel) => {
  const createdVessel = await createVessel(vessel)
  return createdVessel
})

export const fetchVesselByVesselOwnerIdAsync = createAsyncThunk("vessels/fetchVesselByVesselOwnerIdAsync", async (id) => {
  const vessels = await fetchVesselByVesselOwnerId(id)
  return { data: vessels, total: vessels.length }
})

export const getVesselByUserIdAsync = createAsyncThunk("vessels/getVesselByUserIdAsync", async (id) => {
  const selectedVessels = await getVesselByUserId(id)
  return selectedVessels
})

export const updateVesselByIdAsync = createAsyncThunk("vessels/updateVesselByIdAsync", async (update) => {
  const updatedVessel = await updateVesselById(update)
  return updatedVessel
})

const vesselSlice = createSlice({
  name: 'vesselSlice',
  initialState,
  reducers: {
    resetVesselUpdateStatus: (state) => {
      state.vesselUpdateStatus = 'idle'
    },
    resetVesselFetchStatus: (state) => {
      state.vesselFetchStatus = 'idle'
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllVesselsAsync.pending, (state) => {
        state.vesselFetchStatus = 'pending'
      })
      .addCase(getAllVesselsAsync.fulfilled, (state, action) => {
        state.vesselFetchStatus = 'fulfilled'
        state.vessels = action.payload.data
        state.totalCount = action.payload.total ?? action.payload.data.length
      })
      .addCase(getAllVesselsAsync.rejected, (state, action) => {
        state.vesselFetchStatus = 'rejected'
        state.errors = action.error
      })

      .addCase(createVesselAsync.pending, (state) => {
        state.status = 'pending'
      })
      .addCase(createVesselAsync.fulfilled, (state, action) => {
        state.status = 'fulfilled'
        state.vesselUpdateStatus = 'fulfilled'
        state.vessels.push(action.payload)
      })
      .addCase(createVesselAsync.rejected, (state, action) => {
        state.status = 'rejected'
        state.vesselUpdateStatus = 'rejected'
        state.errors = action.error
      })

      .addCase(fetchVesselByVesselOwnerIdAsync.pending, (state) => {
        state.vesselFetchStatus = 'pending'
      })
      .addCase(fetchVesselByVesselOwnerIdAsync.fulfilled, (state, action) => {
        state.vesselFetchStatus = 'fulfilled'
        state.vessels = action.payload.data
        state.totalCount = action.payload.total
      })
      .addCase(fetchVesselByVesselOwnerIdAsync.rejected, (state, action) => {
        state.vesselFetchStatus = 'rejected'
        state.errors = action.error
      })

      .addCase(getVesselByUserIdAsync.pending, (state) => {
        state.vesselFetchStatus = 'pending'
      })
      .addCase(getVesselByUserIdAsync.fulfilled, (state, action) => {
        state.vesselFetchStatus = 'fulfilled'
        state.currentVessel = action.payload
      })
      .addCase(getVesselByUserIdAsync.rejected, (state, action) => {
        state.vesselFetchStatus = 'rejected'
        state.errors = action.error
      })

      .addCase(updateVesselByIdAsync.pending, (state) => {
        state.vesselUpdateStatus = 'pending'
      })
      .addCase(updateVesselByIdAsync.fulfilled, (state, action) => {
        state.vesselUpdateStatus = 'fulfilled'
        const index = state.vessels.findIndex((v) => v._id === action.payload._id)
        if (index !== -1) state.vessels[index] = action.payload
      })
      .addCase(updateVesselByIdAsync.rejected, (state, action) => {
        state.vesselUpdateStatus = 'rejected'
        state.errors = action.error
      })
  }
})

export const { resetVesselUpdateStatus, resetVesselFetchStatus } = vesselSlice.actions

export const selectVessels = (state) => state.VesselSlice.vessels
export const selectVesselUpdateStatus = (state) => state.VesselSlice.vesselUpdateStatus
export const selectVesselFetchStatus = (state) => state.VesselSlice.vesselFetchStatus
export const selectCurrentVessel = (state) => state.VesselSlice.currentVessel
export const selectVesselsTotalCount = (state) => state.VesselSlice.totalCount

export default vesselSlice.reducer