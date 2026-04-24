import { SetupScreen } from './components/setup/SetupScreen'
import { ChatInterface } from './components/chat/ChatInterface'
import { SummaryDashboard } from './components/summary/SummaryDashboard'
import { useInterview } from './hooks/useInterview'
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

function App() {
  const {
    appState,
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
  } = useInterview()

  return (
    <div className="app-container">
      {appState === 'setup' && (
        <SetupScreen onStart={startInterview} isLoading={isLoading} />
      )}
      
      {appState === 'chat' && (
        <ChatInterface 
          messages={messages} 
          latestFeedback={latestFeedback}
          onSendMessage={sendMessage}
          onEndInterview={endInterview}
          isLoading={isLoading}
          domain={domain}
          difficulty={difficulty}
        />
      )}
      
      {appState === 'summary' && report && (
        <SummaryDashboard report={report} onRestart={restartInterview} />
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
