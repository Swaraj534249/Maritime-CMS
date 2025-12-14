import { axiosi } from '../../config/axios'

export const createVesselOwner = async (data) => {
  try {
    // Check if data is FormData (has files) or regular object
    const isFormData = data instanceof FormData
    
    const res = await axiosi.post("/vesselOwners", data, {
      headers: isFormData ? {
        'Content-Type': 'multipart/form-data'
      } : undefined
    })
    return res.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const getVesselOwnerByUserId = async (id) => {
  try {
    const res = await axiosi.get(`/vesselOwners/user/${id}`)
    return res.data
  } catch (error) {
    throw error.response?.data || error
  }
}

export const getAllVesselOwners = async (params = {}, signal) => {
  try {
    const res = await axiosi.get('/vesselOwners', { params, signal })
    const total = Number(res.headers['x-total-count'] ?? res.data.length)
    return { data: res.data, total }
  } catch (error) {
    throw error.response?.data ?? error
  }
}

export const updateVesselOwnerById = async (data) => {
  try {
    
    const isFormData = data instanceof FormData
    const id = isFormData ? data.get('_id') : data._id
    
    const res = await axiosi.patch(`/vesselOwners/${id}`, data, {
      headers: isFormData ? {
        'Content-Type': 'multipart/form-data'
      } : undefined
    })
    return res.data
  } catch (error) {
    throw error.response?.data || error
  }
}

// NEW: Delete a specific document
export const deleteVesselOwnerDocument = async (vesselOwnerId, documentId) => {
  try {
    const res = await axiosi.delete(`/vesselOwners/${vesselOwnerId}/documents/${documentId}`)
    return res.data
  } catch (error) {
    throw error.response?.data || error
  }
}