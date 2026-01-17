import axios from 'axios'

const API_BASE = '/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Vendors
export const getVendors = () => api.get('/vendors')
export const getVendor = (id) => api.get(`/vendors/${id}`)
export const createVendor = (data) => api.post('/vendors', data)
export const updateVendor = (id, data) => api.put(`/vendors/${id}`, data)
export const deleteVendor = (id) => api.delete(`/vendors/${id}`)

// RFPs
export const getRFPs = () => api.get('/rfps')
export const getRFP = (id) => api.get(`/rfps/${id}`)
export const createRFP = (rawInput) => api.post('/rfps', { rawInput })
export const deleteRFP = (id) => api.delete(`/rfps/${id}`)
export const sendRFP = (id, vendorIds) => api.post(`/rfps/${id}/send`, { vendorIds })

// Proposals
export const getProposals = (rfpId) => api.get('/proposals', { params: { rfpId } })
export const compareProposals = (rfpId) => api.get(`/proposals/compare/${rfpId}`)
export const awardProposal = (rfpId, vendorId) => api.post(`/proposals/${rfpId}/award/${vendorId}`)

// Simulate vendor response (for testing)
export const simulateResponse = (rfpId, vendorId, emailContent) => 
  api.post('/webhooks/simulate-response', { rfpId, vendorId, emailContent })

export default api
