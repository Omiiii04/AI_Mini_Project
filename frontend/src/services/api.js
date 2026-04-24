import axios from 'axios'

const API_BASE = 'http://127.0.0.1:8000/api/session'

export const api = {
  startSession: async (domain, difficulty) => {
    const res = await axios.post(`${API_BASE}/start`, { domain, difficulty })
    return res.data
  },
  
  sendChatMessage: async (sessionId, message) => {
    const res = await axios.post(`${API_BASE}/chat`, {
      session_id: sessionId,
      message: message
    })
    return res.data
  },
  
  getReport: async (sessionId) => {
    const res = await axios.get(`${API_BASE}/${sessionId}/report`)
    return res.data
  }
}
