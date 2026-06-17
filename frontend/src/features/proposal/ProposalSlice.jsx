import { createSlice } from "@reduxjs/toolkit";
import { createApiThunk } from "../../config/thunkHelpers";
import {
  fetchProposals,
  proposeCandidates,
  selectProposal,
  rejectProposal,
  updateProposalChecklist,
} from "./ProposalApi";

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
  status: {
    fetch: "idle",
    propose: "idle",
    decide: "idle",
  },
  ui: {
    paginationModel: { page: 0, pageSize: 10 },
    sortModel: [{ field: "createdAt", sort: "desc" }],
    searchValue: "",
    statusFilter: "",
  },
  error: null,
};

export const fetchProposalsAsync = createApiThunk(
  "proposal/fetch",
  ({ params = {}, signal } = {}) => fetchProposals(params, signal),
);

export const proposeCandidatesAsync = createApiThunk(
  "proposal/propose",
  (payload) => proposeCandidates(payload),
);

export const selectProposalAsync = createApiThunk(
  "proposal/select",
  ({ id, documentationAgentId }) =>
    selectProposal({ id, documentationAgentId }),
);

export const rejectProposalAsync = createApiThunk(
  "proposal/reject",
  (id) => rejectProposal(id),
);

export const updateProposalChecklistAsync = createApiThunk(
  "proposal/updateChecklist",
  ({ id, ...checklist }) => updateProposalChecklist({ id, ...checklist }),
);

const proposalSlice = createSlice({
  name: "proposalSlice",
  initialState,
  reducers: {
    resetProposalStatuses(state) {
      state.status.propose = "idle";
      state.status.decide = "idle";
      state.error = null;
    },
    setProposalPaginationModel(state, action) {
      state.ui.paginationModel = action.payload;
    },
    setProposalSortModel(state, action) {
      state.ui.sortModel = action.payload;
    },
    setProposalSearchValue(state, action) {
      state.ui.searchValue = action.payload;
    },
    setProposalStatusFilter(state, action) {
      state.ui.statusFilter = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProposalsAsync.pending, (state) => {
        state.status.fetch = "pending";
      })
      .addCase(fetchProposalsAsync.fulfilled, (state, action) => {
        state.status.fetch = "fulfilled";
        const { data, meta, aggregates } = action.payload || {};
        state.list.data = data || [];
        state.list.meta = meta || initialState.list.meta;
        state.list.statusCounts = aggregates?.statusCounts || {
          total: 0,
          byStatus: {},
        };
      })
      .addCase(fetchProposalsAsync.rejected, (state, action) => {
        state.status.fetch = "rejected";
        state.error = action.payload;
      })
      .addCase(proposeCandidatesAsync.pending, (state) => {
        state.status.propose = "pending";
      })
      .addCase(proposeCandidatesAsync.fulfilled, (state) => {
        state.status.propose = "fulfilled";
      })
      .addCase(proposeCandidatesAsync.rejected, (state, action) => {
        state.status.propose = "rejected";
        state.error = action.payload;
      })
      .addCase(selectProposalAsync.pending, (state) => {
        state.status.decide = "pending";
      })
      .addCase(selectProposalAsync.fulfilled, (state) => {
        state.status.decide = "fulfilled";
      })
      .addCase(selectProposalAsync.rejected, (state, action) => {
        state.status.decide = "rejected";
        state.error = action.payload;
      })
      .addCase(rejectProposalAsync.pending, (state) => {
        state.status.decide = "pending";
      })
      .addCase(rejectProposalAsync.fulfilled, (state) => {
        state.status.decide = "fulfilled";
      })
      .addCase(rejectProposalAsync.rejected, (state, action) => {
        state.status.decide = "rejected";
        state.error = action.payload;
      })
      .addCase(updateProposalChecklistAsync.fulfilled, (state, action) => {
        const idx = state.list.data.findIndex(
          (p) => p._id === action.payload._id,
        );
        if (idx !== -1) state.list.data[idx] = action.payload;
      });
  },
});

export const CHECKLIST_STEPS = [
  { key: "shortlisted", label: "Shortlisted" },
  { key: "verified", label: "Verified" },
  { key: "interviewDone", label: "Interview done" },
];

export const {
  resetProposalStatuses,
  setProposalPaginationModel,
  setProposalSortModel,
  setProposalSearchValue,
  setProposalStatusFilter,
} = proposalSlice.actions;

export default proposalSlice.reducer;

const base = (state) => state.ProposalSlice;

export const selectProposals = (state) => base(state).list.data;
export const selectProposalsTotalCount = (state) =>
  base(state).list.meta.pagination?.totalRecords ?? 0;
export const selectProposalStatusCounts = (state) =>
  base(state).list.statusCounts || { total: 0, byStatus: {} };
export const selectProposalFetchStatus = (state) => base(state).status.fetch;
export const selectProposalProposeStatus = (state) =>
  base(state).status.propose;
export const selectProposalDecideStatus = (state) => base(state).status.decide;
export const selectProposalPaginationModel = (state) =>
  base(state).ui.paginationModel;
export const selectProposalSortModel = (state) => base(state).ui.sortModel;
export const selectProposalSearchValue = (state) => base(state).ui.searchValue;
export const selectProposalStatusFilter = (state) =>
  base(state).ui.statusFilter;
