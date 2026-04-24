import { useState } from 'react'
import axios from 'axios'
import { SetupScreen } from './components/SetupScreen'
import { ChatInterface } from './components/ChatInterface'
import { SummaryDashboard } from './components/SummaryDashboard'
import { Loader2 } from 'lucide-react'

// Adjust standard styles for spin
const injectSpinStyles = () => {
  if (document.getElementById('spin-style')) return;
  const style = document.createElement('style');
  style.id = 'spin-style';
  style.innerHTML = `
    @keyframes spin { to { transform: rotate(360deg); } }
    .animate-spin { animation: spin 1s linear infinite; }
  `;
  document.head.appendChild(style);
};
injectSpinStyles();

const API_BASE = 'http://127.0.0.1:8000/api/session'

function App() {
  const [appState, setAppState] = useState('setup') // 'setup', 'chat', 'summary'
  const [sessionId, setSessionId] = useState(null)
  const [domain, setDomain] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [messages, setMessages] = useState([])
  const [latestFeedback, setLatestFeedback] = useState(null)
  const [report, setReport] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleStart = async (selectedDomain, selectedDifficulty) => {
    setIsLoading(true)
    try {
      setDomain(selectedDomain)
      setDifficulty(selectedDifficulty)
      const res = await axios.post(`${API_BASE}/start`, {
        domain: selectedDomain,
        difficulty: selectedDifficulty
      })
      
      setSessionId(res.data.session_id)
      setMessages([{ role: 'assistant', content: res.data.first_question }])
      setAppState('chat')
    } catch(err) {
      alert("Failed to start session. Ensure backend is running and API key is set.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async (message) => {
    const userMsg = { role: 'user', content: message }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)
    
    try {
      const res = await axios.post(`${API_BASE}/chat`, {
        session_id: sessionId,
        message: message
      })
      
      setLatestFeedback(res.data.evaluation)
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.next_question }])
      
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { role: 'assistant', content: "Error communicating with the backend." }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleEndInterview = async () => {
    if (!window.confirm("Are you sure you want to end the interview?")) return
    
    setIsLoading(true)
    try {
      const res = await axios.get(`${API_BASE}/${sessionId}/report`)
      setReport(res.data)
      setAppState('summary')
    } catch (err) {
      console.error(err)
      alert("Failed to generate report.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestart = () => {
    setAppState('setup')
    setSessionId(null)
    setMessages([])
    setLatestFeedback(null)
    setReport(null)
  }

  return (
    <div className="app-container">
      {appState === 'setup' && (
        <SetupScreen onStart={handleStart} isLoading={isLoading} />
      )}
      
      {appState === 'chat' && (
        <ChatInterface 
          messages={messages} 
          latestFeedback={latestFeedback}
          onSendMessage={handleSendMessage}
          onEndInterview={handleEndInterview}
          isLoading={isLoading}
          domain={domain}
          difficulty={difficulty}
        />
      )}
      
      {appState === 'summary' && report && (
        <SummaryDashboard report={report} onRestart={handleRestart} />
      )}
      
      {isLoading && appState !== 'chat' && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 50, background: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '50%' }}>
          <Loader2 className="animate-spin" size={48} color="var(--accent-color)" />
        </div>
      )}
    </div>
  )
}

export default App
