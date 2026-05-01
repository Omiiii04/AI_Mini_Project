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

  const startInterview = async (selectedDomain, selectedDifficulty, selectedLanguage) => {
    setIsLoading(true)
    try {
      setDomain(selectedDomain)
      setDifficulty(selectedDifficulty)
      const data = await api.startSession(selectedDomain, selectedDifficulty, selectedLanguage)
      
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
         
         // Robust partial JSON extraction for "next_question"
         let visibleText = "..."
         try {
            // Find the start of the next_question value
            const keySearch = '"next_question":'
            const startIndex = accumulatedJson.indexOf(keySearch)
            
            if (startIndex !== -1) {
                let valStart = accumulatedJson.indexOf('"', startIndex + keySearch.length)
                if (valStart !== -1) {
                    valStart += 1 // skip the opening quote
                    
                    // Find the end quote, taking care of escaped quotes
                    let valEnd = -1
                    for (let i = valStart; i < accumulatedJson.length; i++) {
                        if (accumulatedJson[i] === '"' && accumulatedJson[i-1] !== '\\') {
                            valEnd = i
                            break
                        }
                    }
                    
                    if (valEnd !== -1) {
                        visibleText = accumulatedJson.substring(valStart, valEnd)
                    } else {
                        // Still streaming the value
                        visibleText = accumulatedJson.substring(valStart)
                    }
                    
                    // Unescape characters
                    visibleText = visibleText
                        .replace(/\\n/g, '\n')
                        .replace(/\\"/g, '"')
                        .replace(/\\t/g, '\t')
                        .replace(/\\\\/g, '\\')
                }
            }
         } catch (e) {
            console.warn("Partial parse error", e)
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
