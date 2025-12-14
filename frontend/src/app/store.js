import {configureStore} from '@reduxjs/toolkit'
import AuthSlice from '../features/auth/AuthSlice'
import UserSlice from '../features/user/UserSlice'
import VesselOwnerSlice from '../features/vesselOwner/VesselOwnerSlice'
// import VesselManagerSlice from '../features/vesselManager/VesselManagerSlice'
// import VesselSlice from '../features/vessel/VesselSlice'
// import RankSlice from '../features/rank/RankSlice'
// import CrewSlice from '../features/crew/CrewSlice'
import CrewingAgentSlice from '../features/crewingAgent/CrewingAgentSlice'
// import ProposeSlice from '../features/propose/ProposeSlice'

export const store=configureStore({
    reducer:{
        AuthSlice,
        UserSlice,
        VesselOwnerSlice,
        // VesselManagerSlice,
        // VesselSlice,
        // RankSlice,
        // CrewSlice,
        CrewingAgentSlice,
        // ProposeSlice
    }
})