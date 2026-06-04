import { configureStore } from "@reduxjs/toolkit";
import AuthSlice from "../features/auth/AuthSlice";
import AgentSlice from "../features/agent/AgentSlice";
import AgencySlice from "../features/agency/AgencySlice";
import UserSlice from "../features/user/UserSlice";
import VesselOwnerSlice from "../features/vesselOwner/VesselOwnerSlice";
import VesselSlice from "../features/vessel/VesselSlice";
import CandidateSlice from "../features/candidate/CandidateSlice";
import FeedbackSlice from "../features/feedback/FeedbackSlice";

export const store = configureStore({
  reducer: {
    AuthSlice,
    AgentSlice,
    AgencySlice,
    UserSlice,
    VesselOwnerSlice,
    VesselSlice,
    CandidateSlice,
    FeedbackSlice,
  },
});
