import { useState } from 'react'
import { api } from '../services/api'

export function useInterview() {
  const [appState, setAppState] = useState('setup')
  const [sessionId, setSessionId] = useState(null)
  const [domain, setDomain] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [messages, setMessages] = useState([])
  const [latestFeedback, setLatestFeedback] = useState(null)
  const [report, setReport] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const startInterview = async (selectedDomain, selectedDifficulty) => {
    setIsLoading(true)
    try {
      setDomain(selectedDomain)
      setDifficulty(selectedDifficulty)
      const data = await api.startSession(selectedDomain, selectedDifficulty)
      
      setSessionId(data.session_id)
      setMessages([{ role: 'assistant', content: data.first_question }])
      setAppState('chat')
    } catch(err) {
      alert("Failed to start session. Ensure backend is running.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async (message) => {
    const userMsg = { role: 'user', content: message }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)
    
    try {
      const data = await api.sendChatMessage(sessionId, message)
      setLatestFeedback(data.evaluation)
      setMessages(prev => [...prev, { role: 'assistant', content: data.next_question }])
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { role: 'assistant', content: "Error communicating with the backend." }])
    } finally {
      setIsLoading(false)
    }
  }

  const endInterview = async () => {
    if (!window.confirm("Are you sure you want to end the interview?")) return
    
    setIsLoading(true)
    try {
      const data = await api.getReport(sessionId)
      setReport(data)
      setAppState('summary')
    } catch (err) {
      console.error(err)
      alert("Failed to generate report.")
    } finally {
      setIsLoading(false)
    }
  }

  const restartInterview = () => {
    setAppState('setup')
    setSessionId(null)
    setMessages([])
    setLatestFeedback(null)
    setReport(null)
  }

  return {
    appState,
    sessionId,
    domain,
    difficulty,
    messages,
    latestFeedback,
    report,
    isLoading,
    startInterview,
    sendMessage,
    endInterview,
    restartInterview
  }
}
