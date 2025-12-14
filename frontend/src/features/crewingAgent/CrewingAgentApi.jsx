import {axiosi} from '../../config/axios'


export const createCrewingAgent=async(order)=>{
    try {
        const res=await axiosi.post("/crewingAgents",order)
        return res.data
    } catch (error) {
        throw error.response.data
    }
}

export const getCrewingAgentByUserId=async(id)=>{
    try {
        const res=await axiosi.get(`/crewingAgents/user/${id}`)
        return res.data
    } catch (error) {
        throw error.response.data
    }
}

export const getAllCrewingAgents=async()=>{
    try {
        const res=await axiosi.get(`/crewingAgents`)               
        return res.data
    } catch (error) {
        throw error.response.data
    }
}

export const updateCrewingAgentById=async(update)=>{
    try {
        const res=await axiosi.patch(`/crewingAgents/${update._id}`,update)
        return res.data
    } catch (error) {
        throw error.response.data
    }
}