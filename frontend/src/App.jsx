import { SetupScreen } from './components/setup/SetupScreen'
import { ChatInterface } from './components/chat/ChatInterface'
import { SummaryDashboard } from './components/summary/SummaryDashboard'
import { AuthScreen } from './components/setup/AuthScreen'
import { Navbar } from './components/layout/Navbar'
import { LandingPage } from './components/layout/LandingPage'
import { useInterview } from './hooks/useInterview'
import { Loader2, Activity } from 'lucide-react'
import { useState, useEffect } from 'react'

const injectSpinStyles = () => {
  if (document.getElementById('spin-style')) return
  const style = document.createElement('style')
  style.id = 'spin-style'
  style.innerHTML = `
    @keyframes spin { to { transform: rotate(360deg); } }
    .animate-spin { animation: spin 1s linear infinite; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  `
  document.head.appendChild(style)
}
injectSpinStyles()

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [showAuth, setShowAuth] = useState(false)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')

  useEffect(() => {
    localStorage.setItem('theme', theme)
    if (theme === 'dark') {
      document.body.classList.add('dark-theme')
    } else {
      document.body.classList.remove('dark-theme')
    }
  }, [theme])

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light')

  const handleLogin = (newToken) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
    setShowAuth(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setShowAuth(false)
  }

  const {
    appState,
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
  } = useInterview()

  return (
    <>
      <Navbar theme={theme} toggleTheme={toggleTheme} token={token} onLogout={handleLogout} />
      
      <div className={`app-container ${appState === 'chat' ? 'app-container-fluid' : ''}`}>
        {/* Toast notification */}
        {toastMessage && token && (
          <div style={{
            position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 300, background: 'var(--accent-color)', color: '#fff',
            padding: '10px 20px', borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            animation: 'fadeIn 0.3s ease',
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '14px', whiteSpace: 'nowrap',
            maxWidth: 'calc(100vw - 40px)',
          }}>
            <Activity size={14} className="animate-spin" /> {toastMessage}
          </div>
        )}

        {!token && !showAuth && <LandingPage onGetStarted={() => setShowAuth(true)} />}
        
        {!token && showAuth && (
           <div style={{ marginTop: '40px' }}>
             <AuthScreen onLogin={handleLogin} onBack={() => setShowAuth(false)} />
           </div>
        )}

        {appState === 'setup' && token && (
          <SetupScreen onStart={startInterview} isLoading={isLoading} />
        )}

        {appState === 'chat' && token && (
          <ChatInterface
            messages={messages}
            latestFeedback={latestFeedback}
            onSendMessage={sendMessage}
            onEndInterview={endInterview}
            isLoading={isLoading}
            domain={domain}
            difficulty={difficulty}
            questionStartTime={questionStartTime}
            onRequestHint={requestHint}
            hintsUsed={hintsUsed}
          />
        )}

        {appState === 'summary' && report && token && (
          <SummaryDashboard report={report} onRestart={restartInterview} />
        )}

        {isLoading && appState !== 'chat' && (
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 400, background: 'var(--panel-bg-alpha)',
            backdropFilter: 'blur(4px)',
            padding: '24px', borderRadius: '50%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }}>
            <Loader2 className="animate-spin" size={44} color="var(--accent-color)" />
          </div>
        )}
      </div>
    </>
  )
}

export default App
