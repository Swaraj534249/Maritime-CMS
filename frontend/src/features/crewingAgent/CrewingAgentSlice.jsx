import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  createCrewingAgent,
  getAllCrewingAgents,
  getCrewingAgentByUserId,
  updateCrewingAgentById,
} from "./CrewingAgentApi";

const initialState = {
  status: "idle",
  crewingAgentUpdateStatus: "idle",
  crewingAgentFetchStatus: "idle",
  crewingAgents: [],
  currentCrewingAgent: null,
  errors: null,
  successMessage: null,
};

export const createCrewingAgentAsync = createAsyncThunk(
  "crewingAgents/createCrewingAgentAsync",
  async (crewingAgent) => {
    const createdCrewingAgent = await createCrewingAgent(crewingAgent);
    return createdCrewingAgent;
  },
);

export const getAllCrewingAgentsAsync = createAsyncThunk(
  "crewingAgents/getAllCrewingAgentsAsync",
  async () => {
    const crewingAgents = await getAllCrewingAgents();
    return crewingAgents;
  },
);

export const getCrewingAgentByUserIdAsync = createAsyncThunk(
  "crewingAgents/getCrewingAgentByUserIdAsync",
  async (id) => {
    const crewingAgents = await getCrewingAgentByUserId(id);
    return crewingAgents;
  },
);

export const updateCrewingAgentByIdAsync = createAsyncThunk(
  "crewingAgents/updateCrewingAgentByIdAsync",
  async (update) => {
    const updatedCrewingAgent = await updateCrewingAgentById(update);
    return updatedCrewingAgent;
  },
);

const crewingAgentSlice = createSlice({
  name: "crewingAgentSlice",
  initialState: initialState,
  reducers: {
    resetCurrentCrewingAgent: (state) => {
      state.currentCrewingAgent = null;
    },
    resetCrewingAgentUpdateStatus: (state) => {
      state.crewingAgentUpdateStatus = "idle";
    },
    resetCrewingAgentFetchStatus: (state) => {
      state.crewingAgentFetchStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCrewingAgentAsync.pending, (state) => {
        state.status = "pending";
      })
      .addCase(createCrewingAgentAsync.fulfilled, (state, action) => {
        state.status = "fulfilled";
        state.crewingAgents.push(action.payload);
        state.currentCrewingAgent = action.payload;
      })
      .addCase(createCrewingAgentAsync.rejected, (state, action) => {
        state.status = "rejected";
        state.errors = action.error;
      })

      .addCase(getAllCrewingAgentsAsync.pending, (state) => {
        state.crewingAgentFetchStatus = "pending";
      })
      .addCase(getAllCrewingAgentsAsync.fulfilled, (state, action) => {
        state.crewingAgentFetchStatus = "fulfilled";
        state.crewingAgents = action.payload;
      })
      .addCase(getAllCrewingAgentsAsync.rejected, (state, action) => {
        state.crewingAgentFetchStatus = "rejected";
        state.errors = action.error;
      })

      .addCase(getCrewingAgentByUserIdAsync.pending, (state) => {
        state.crewingAgentFetchStatus = "pending";
      })
      .addCase(getCrewingAgentByUserIdAsync.fulfilled, (state, action) => {
        state.crewingAgentFetchStatus = "fulfilled";
        state.crewingAgents = action.payload;
      })
      .addCase(getCrewingAgentByUserIdAsync.rejected, (state, action) => {
        state.crewingAgentFetchStatus = "rejected";
        state.errors = action.error;
      })

      .addCase(updateCrewingAgentByIdAsync.pending, (state) => {
        state.crewingAgentUpdateStatus = "pending";
      })
      .addCase(updateCrewingAgentByIdAsync.fulfilled, (state, action) => {
        state.crewingAgentUpdateStatus = "fulfilled";
        const index = state.crewingAgents.findIndex(
          (crewingAgent) => crewingAgent._id === action.payload._id,
        );
        state.crewingAgents[index] = action.payload;
      })
      .addCase(updateCrewingAgentByIdAsync.rejected, (state, action) => {
        state.crewingAgentUpdateStatus = "rejected";
        state.errors = action.error;
      });
  },
});

// exporting reducers
export const {
  resetCurrentCrewingAgent,
  resetCrewingAgentUpdateStatus,
  resetCrewingAgentFetchStatus,
} = crewingAgentSlice.actions;

// exporting selectors
export const selectCrewingAgentStatus = (state) =>
  state.CrewingAgentSlice.status;
export const selectCrewingAgents = (state) =>
  state.CrewingAgentSlice.crewingAgents;
export const selectCrewingAgentsErrors = (state) =>
  state.CrewingAgentSlice.errors;
export const selectCrewingAgentsSuccessMessage = (state) =>
  state.CrewingAgentSlice.successMessage;
export const selectCurrentCrewingAgent = (state) =>
  state.CrewingAgentSlice.currentCrewingAgent;
export const selectCrewingAgentUpdateStatus = (state) =>
  state.CrewingAgentSlice.crewingAgentUpdateStatus;
export const selectCrewingAgentFetchStatus = (state) =>
  state.CrewingAgentSlice.crewingAgentFetchStatus;

export default crewingAgentSlice.reducer;
