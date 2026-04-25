import { SetupScreen } from './components/setup/SetupScreen'
import { ChatInterface } from './components/chat/ChatInterface'
import { SummaryDashboard } from './components/summary/SummaryDashboard'
import { AuthScreen } from './components/setup/AuthScreen'
import { useInterview } from './hooks/useInterview'
import { Loader2, Activity, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'

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

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  
  const handleLogin = (newToken) => {
     localStorage.setItem('token', newToken)
     setToken(newToken)
  }
  
  const handleLogout = () => {
     localStorage.removeItem('token')
     setToken(null)
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
    <div className="app-container">
      {token && (
        <button className="btn-secondary" onClick={handleLogout} style={{ position: 'absolute', top: 20, right: 20, zIndex: 100, display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px' }}>
          <LogOut size={16} /> Sign Out
        </button>
      )}
      
      {!token && (
         <AuthScreen onLogin={handleLogin} />
      )}
      
      {toastMessage && token && (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 100, background: 'var(--accent-color)', color: '#fff', padding: '12px 24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', animation: 'fadeIn 0.3s ease', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={16} className="animate-spin" /> {toastMessage}
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
      
      {isLoading && appState !== 'chat' && token && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 50, background: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '50%' }}>
          <Loader2 className="animate-spin" size={48} color="var(--accent-color)" />
        </div>
      )}
    </div>
  )
}

export default App
