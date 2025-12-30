import { axiosi } from '../../config/axios'

export const createVessel = async (payload) => {
  try {
    if (payload instanceof FormData) {
      const res = await axiosi.post('/vessels', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    }
    const res = await axiosi.post('/vessels', payload)
    return res.data
  } catch (error) {
    throw error.response?.data ?? error
  }
}

export const getAllVessels = async (params = {}, signal) => {
  try {
    const res = await axiosi.get('/vessels', { params, signal })
    const total = Number(res.headers['x-total-count'] ?? res.data.length)
    return { data: res.data, total }
  } catch (error) {
    throw error.response?.data ?? error
  }
}

export const getVesselByUserId = async (id) => {
  try {
    const res = await axiosi.get(`/vessels/user/${id}`)
    return res.data
  } catch (error) {
    throw error.response?.data ?? error
  }
}

export const fetchVesselByVesselOwnerId = async (id) => {
  try {
    const res = await axiosi.get(`/vessels/vesselOwner/${id}`)
    return res.data
  } catch (error) {
    throw error.response?.data ?? error
  }
}

export const updateVesselById = async (data) => {
  try {    
      const isFormData = data instanceof FormData
    const id = isFormData ? data.get('_id') : data._id
    //   payload.delete('_id')
      const res = await axiosi.patch(`/vessels/${id}`, data, {
      headers: isFormData ? {
        'Content-Type': 'multipart/form-data'
      } : undefined
    })
      return res.data
  } catch (error) {
    throw error.response?.data ?? error
  }
}