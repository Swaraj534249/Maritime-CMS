import { configureStore } from "@reduxjs/toolkit";
import AuthSlice from "../features/auth/AuthSlice";
import AgentSlice from "../features/agent/AgentSlice";
import AgencySlice from "../features/agency/AgencySlice";
import UserSlice from "../features/user/UserSlice";
import VesselOwnerSlice from "../features/vesselOwner/VesselOwnerSlice";
import VesselSlice from "../features/vessel/VesselSlice";
import CandidateSlice from "../features/candidate/CandidateSlice";
import FeedbackSlice from "../features/feedback/FeedbackSlice";
import RankSlice from "../features/assets/rank/RankSlice";
import VesselTypeSlice from "../features/assets/vesselType/VesselTypeSlice";
import VacancySlice from "../features/vacancy/VacancySlice";
import ProposalSlice from "../features/proposal/ProposalSlice";
import DocumentationSlice from "../features/documentation/DocumentationSlice";
import SailingSlice from "../features/sailing/SailingSlice";

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
    RankSlice,
    VesselTypeSlice,
    VacancySlice,
    ProposalSlice,
    DocumentationSlice,
    SailingSlice,
  },
});
