import { useState } from 'react'
import api from '../services/api'

export function useInterview() {
  const [appState, setAppState] = useState('setup')
  const [sessionId, setSessionId] = useState(null)
  const [domain, setDomain] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [messages, setMessages] = useState([])
  const [latestFeedback, setLatestFeedback] = useState(null)
  const [report, setReport] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)
  const [questionStartTime, setQuestionStartTime] = useState(null)
  const [hintsUsed, setHintsUsed] = useState(0)

  const startInterview = async (selectedDomain, selectedDifficulty) => {
    setIsLoading(true)
    try {
      setDomain(selectedDomain)
      setDifficulty(selectedDifficulty)
      const data = await api.startSession(selectedDomain, selectedDifficulty)
      
      setSessionId(data.session_id)
      setMessages([{ role: 'assistant', content: data.first_question }])
      setAppState('chat')
      setQuestionStartTime(Date.now())
      setHintsUsed(0)
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
    const tempId = Date.now()
    setMessages(prev => [...prev, { role: 'assistant', content: '', id: tempId }])
    setIsLoading(true)
    setToastMessage(null)
    
    // Calculate time spent
    const timeSpentSeconds = questionStartTime ? Math.floor((Date.now() - questionStartTime) / 1000) : 0
    
    try {
      const fullJsonStr = await api.sendChatMessageStream(sessionId, message, timeSpentSeconds, (accumulatedJson) => {
         setIsLoading(false) // stop global spinner once stream starts
         const extractMatches = accumulatedJson.match(/"next_question"\s*:\s*"([^]*)/)
         let visibleText = "..."
         if (extractMatches) {
            visibleText = extractMatches[1]
            visibleText = visibleText.replace(/",?\s*"evaluation"[^]*$/, '')
            visibleText = visibleText.replace(/\\n/g, '\n')
            visibleText = visibleText.replace(/\\"/g, '"')
         }
         setMessages(prev => prev.map(m => m.id === tempId ? { ...m, content: visibleText } : m))
      }, (msg) => setToastMessage(msg))
      
      const parsedData = JSON.parse(fullJsonStr)
      setLatestFeedback(parsedData.evaluation)
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, content: parsedData.next_question, id: undefined } : m))
      setToastMessage(null)
      setQuestionStartTime(Date.now())
    } catch (err) {
      console.error(err)
      setToastMessage("Failed to connect after multiple attempts. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const endInterview = async () => {
    if (!window.confirm("Are you sure you want to end the interview?")) return
    
    setIsLoading(true)
    try {
      const data = await api.endSession(sessionId)
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
    setDomain('')
    setDifficulty('')
    setHintsUsed(0)
  }

  const requestHint = async () => {
    if (!sessionId) return
    setIsLoading(true)
    try {
      setToastMessage('Fetching hint...')
      const data = await api.getHint(sessionId)
      setMessages(prev => [...prev, { role: 'system', content: `**Hint (${data.hints_used}):** ${data.hint}` }])
      setHintsUsed(data.hints_used)
    } catch (err) {
      console.error(err)
      setToastMessage('Failed to fetch hint')
    } finally {
      setIsLoading(false)
    }
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
    toastMessage,
    questionStartTime,
    hintsUsed,
    startInterview,
    sendMessage,
    endInterview,
    restartInterview,
    requestHint
  }
}
