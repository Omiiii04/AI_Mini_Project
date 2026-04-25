import axios from 'axios'

const API_BASE = 'http://127.0.0.1:8000/api/session'

const getHeaders = () => {
  const token = localStorage.getItem('token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

const api = {
  startSession: async (domain, difficulty) => {
    const res = await axios.post(`${API_BASE}/start`, { domain, difficulty }, { headers: getHeaders() })
    return res.data
  },
  
  sendChatMessageStream: async (sessionId, message, timeSpentSeconds, onChunk, onRetry = null) => {
    let retries = 3
    let delay = 1000
    while (retries > 0) {
      try {
        const response = await fetch(`${API_BASE}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getHeaders() },
          body: JSON.stringify({ session_id: sessionId, message: message, time_spent: timeSpentSeconds })
        })
        if (!response.ok) throw new Error("Network error")
        
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        
        let fullText = ""
        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          const chunkStr = decoder.decode(value, { stream: true })
          const lines = chunkStr.split('\n')
          for (let line of lines) {
            if (line.startsWith('data: [DONE]')) return fullText
            if (line.startsWith('data: ')) {
               try {
                 const j = JSON.parse(line.substring(6))
                 fullText += j.chunk
                 onChunk(fullText)
               } catch (e) {
                 // partial line chunk parsing failure safe ignore
               }
            }
          }
        }
        return fullText
      } catch (err) {
        retries--
        if (retries === 0) throw err
        if (onRetry) onRetry(`AI is busy — retrying (${3 - retries}/3)...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        delay *= 2 // exponential backoff
      }
    }
  },
  
  endSession: async (sessionId) => {
    const res = await fetch(`${API_BASE}/${sessionId}/report`, { headers: getHeaders() })
    if (!res.ok) throw new Error("Failed to end session")
    return res.json()
  },
  
  getHistory: async () => {
    const res = await fetch(`${API_BASE}/user/history`, { headers: getHeaders() })
    if (!res.ok) throw new Error("Failed to fetch history")
    return res.json()
  },
  
  getHint: async (sessionId) => {
    const res = await fetch(`${API_BASE}/${sessionId}/hint`, { headers: getHeaders() })
    if (!res.ok) throw new Error("Failed to get hint")
    return res.json()
  }
}

export default api;
