import { useState, useRef, useEffect } from 'react'
import { Send, LogOut, Activity, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export function ChatInterface({ messages, latestFeedback, onSendMessage, onEndInterview, isLoading, domain, difficulty }) {
  const [input, setInput] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    onSendMessage(input.trim())
    setInput('')
  }

  return (
    <div className="chat-layout">
      {/* Main Chat Area */}
      <div className="chat-main" style={{ animation: 'fadeIn 0.4s ease' }}>
        <div className="chat-header">
          <div>
            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '18px' }}>Interview Session</h3>
            <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              {domain} • {difficulty}
            </span>
          </div>
          <button className="btn-secondary" onClick={onEndInterview} style={{ padding: '8px 16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <LogOut size={16} /> End Interview
          </button>
        </div>

        <div className="chat-messages" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`message-bubble ${m.role}`}>
              {m.role === 'assistant' ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Interviewer</div>
              ) : (
                <div style={{ color: '#fff', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase', opacity: 0.8, letterSpacing: '1px' }}>You</div>
              )}
              <ReactMarkdown>{m.content}</ReactMarkdown>
            </div>
          ))}
          {isLoading && (
            <div className="message-bubble assistant">
              <Loader2 className="animate-spin" size={20} color="var(--accent-color)" />
            </div>
          )}
        </div>

        <form className="chat-input-area" onSubmit={handleSubmit}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Type your answer here..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button type="submit" className="btn-primary" disabled={!input.trim() || isLoading} style={{ padding: '0 20px' }}>
            <Send size={18} />
          </button>
        </form>
      </div>

      {/* Feedback Side Panel */}
      <div className="feedback-panel" style={{ animation: 'fadeIn 0.5s ease' }}>
        <div className="feedback-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} />
          <span>Real-time Evaluation</span>
        </div>
        
        <div className="feedback-content">
          {!latestFeedback ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>
              <Activity size={48} style={{ opacity: 0.2, margin: '0 auto 16px auto' }} />
              <p>Answer a question to receive real-time feedback on your performance.</p>
            </div>
          ) : (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div className="score-circle">
                {latestFeedback.score}<span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/10</span>
              </div>
              
              <div className="feedback-section">
                <h4>Correctness</h4>
                <p>{latestFeedback.correctness}</p>
              </div>

              <div className="feedback-section">
                <h4>Completeness</h4>
                <p>{latestFeedback.completeness}</p>
              </div>

              <div className="feedback-section">
                <h4>Clarity</h4>
                <p>{latestFeedback.clarity}</p>
              </div>

              <div className="feedback-section" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px' }}>
                <h4 style={{ color: 'var(--success-color)' }}>Strengths</h4>
                <p>{latestFeedback.strengths}</p>
              </div>

              <div className="feedback-section">
                <h4 style={{ color: 'var(--warning-color)' }}>Areas for Improvement</h4>
                <p>{latestFeedback.weaknesses}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
