import { configureStore } from "@reduxjs/toolkit";
import AuthSlice from "../features/auth/AuthSlice";
import AgentSlice from "../features/agent/AgentSlice";
import AgencySlice from "../features/agency/AgencySlice";
import UserSlice from "../features/user/UserSlice";
import VesselOwnerSlice from "../features/vesselOwner/VesselOwnerSlice";
// import VesselManagerSlice from '../features/vesselManager/VesselManagerSlice'
import VesselSlice from "../features/vessel/VesselSlice";
// import RankSlice from '../features/rank/RankSlice'
// import CrewSlice from '../features/crew/CrewSlice'
import CandidateSlice from "../features/candidate/CandidateSlice";
import FeedbackSlice from "../features/feedback/FeedbackSlice";
// import ProposeSlice from '../features/propose/ProposeSlice'

export const store = configureStore({
  reducer: {
    AuthSlice,
    AgentSlice,
    AgencySlice,
    UserSlice,
    VesselOwnerSlice,
    // VesselManagerSlice,
    VesselSlice,
    // RankSlice,
    // CrewSlice,
    CandidateSlice,
    FeedbackSlice,
  },
});
