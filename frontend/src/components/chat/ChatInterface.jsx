import { useState, useRef, useEffect } from 'react'
import { Send, LogOut, Activity, Loader2, Mic, Timer, Code, HelpCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import Editor from '@monaco-editor/react'

export function ChatInterface({ messages, latestFeedback, onSendMessage, onEndInterview, isLoading, domain, difficulty, questionStartTime, onRequestHint }) {
  const [input, setInput] = useState('')
  const [showCode, setShowCode] = useState(domain && (domain.includes('Software') || domain.includes('Data') || domain.includes('Web')))
  const [code, setCode] = useState('// Write your code here...\n')
  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const baseInputRef = useRef('')
  const recognitionRef = useRef(null)
  const [isRecording, setIsRecording] = useState(false)

  useEffect(() => {
    if (!document.getElementById('mic-pulse')) {
      const style = document.createElement('style')
      style.id = 'mic-pulse'
      style.innerHTML = `
        @keyframes pulse-red { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
        .mic-recording { animation: pulse-red 2s infinite !important; background: #ef4444 !important; border-color: #ef4444 !important; color: white !important; }
        @media (max-width: 480px) { .hide-xs { display: none; } }
      `
      document.head.appendChild(style)
    }

    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.onerror = (e) => { console.error('Speech error', e); setIsRecording(false) }
      recognitionRef.current.onend = () => setIsRecording(false)
    }
  }, [])

  const [timeSpent, setTimeSpent] = useState(0)

  useEffect(() => {
    if (!questionStartTime) return
    const interval = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - questionStartTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [questionStartTime])

  const timeLeft = Math.max(0, 300 - timeSpent)
  const formatTime = (secs) => `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim() && !code.trim().replace('// Write your code here...\n', '')) return
    if (isLoading) return
    let answerText = input.trim()
    if (showCode && code.trim() && code !== '// Write your code here...\n') {
      answerText += (answerText ? '\n\n' : '') + `\`\`\`javascript\n${code}\n\`\`\``
    }
    onSendMessage(answerText)
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e) }
  }

  const handleInputChange = (e) => {
    if (e.target.value.length <= 2000) setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`
  }

  const toggleRecording = (e) => {
    e.preventDefault()
    if (!recognitionRef.current) { alert('Speech recognition not supported (use Chrome/Edge).'); return }
    if (isRecording) {
      recognitionRef.current.stop(); setIsRecording(false)
    } else {
      baseInputRef.current = input + (input.length > 0 && !input.endsWith(' ') ? ' ' : '')
      recognitionRef.current.onresult = (event) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i)
          transcript += event.results[i][0].transcript
        const newVal = baseInputRef.current + transcript
        if (newVal.length <= 2000) {
          setInput(newVal)
          if (inputRef.current) {
            inputRef.current.style.height = 'auto'
            inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`
          }
        }
      }
      recognitionRef.current.start(); setIsRecording(true)
    }
  }

  return (
    <div className={`chat-layout${showCode ? ' with-editor' : ''}`}>

      {/* Code Editor Panel */}
      {showCode && (
        <div className="editor-panel">
          <div className="chat-header" style={{ borderBottom: '1px solid #333', background: '#2d2d2d' }}>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Code size={15} /> Code Editor
            </h3>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Editor
              height="100%"
              defaultLanguage="javascript"
              theme="vs-dark"
              value={code}
              onChange={(v) => setCode(v)}
              options={{ minimap: { enabled: false }, fontSize: 13 }}
            />
          </div>
        </div>
      )}

      {/* Main Chat */}
      <div className="chat-main" style={{ animation: 'fadeIn 0.4s ease' }}>
        <div className="chat-header">
          <div>
            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '16px' }}>Interview Session</h3>
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{domain} • {difficulty}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 500,
              color: timeLeft > 60 ? 'var(--text-main)' : 'var(--warning-color)'
            }}>
              <Timer size={14} /> {formatTime(timeLeft)}
            </div>
            <button
              className="btn-secondary"
              onClick={onEndInterview}
              style={{ padding: '6px 10px', display: 'flex', gap: '5px', alignItems: 'center', fontSize: '12px' }}
            >
              <LogOut size={13} /> <span className="hide-xs">End</span>
            </button>
          </div>
        </div>

        <div className="chat-messages" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`message-bubble ${m.role}`}>
              {m.role === 'assistant' ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Interviewer</div>
              ) : m.role === 'system' ? (
                <div style={{ color: 'var(--accent-color)', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>System</div>
              ) : (
                <div style={{ color: '#fff', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', opacity: 0.8, letterSpacing: '1px' }}>You</div>
              )}
              <ReactMarkdown>{m.content}</ReactMarkdown>
            </div>
          ))}
          {isLoading && (
            <div className="message-bubble assistant">
              <Loader2 className="animate-spin" size={18} color="var(--accent-color)" />
            </div>
          )}
        </div>

        {/* Hint row */}
        <div style={{ padding: '0 12px 6px', flexShrink: 0 }}>
          <button
            className="btn-secondary"
            onClick={onRequestHint}
            disabled={isLoading}
            title="Request hint for -1 point"
            style={{
              fontSize: '12px', padding: '4px 10px',
              borderColor: 'var(--warning-color)', color: 'var(--warning-color)',
              display: 'inline-flex', alignItems: 'center', gap: '5px'
            }}
          >
            <HelpCircle size={12} /> Request Hint (-1 pt)
          </button>
        </div>

        {/* Input area */}
        <form className="chat-input-area" onSubmit={handleSubmit}>
          <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
            <textarea
              ref={inputRef}
              className="input-field"
              placeholder="Type your answer... (Shift+Enter for newline)"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={1}
              style={{ resize: 'none', overflowY: 'auto', width: '100%', minHeight: '42px', paddingTop: '11px', paddingBottom: '11px' }}
            />
            <div style={{ position: 'absolute', bottom: '-17px', right: '4px', fontSize: '10px', color: input.length >= 1950 ? '#ff4d4f' : 'var(--text-muted)' }}>
              {input.length}/2000
            </div>
          </div>
          <div className="chat-input-buttons">
            <button
              onClick={(e) => { e.preventDefault(); setShowCode(p => !p) }}
              className="btn-secondary"
              title="Toggle Code Editor"
              style={{ padding: '0 11px', height: '42px', ...(showCode ? { background: 'var(--accent-color)', color: '#fff', borderColor: 'var(--accent-color)' } : {}) }}
            >
              <Code size={16} />
            </button>
            <button
              onClick={toggleRecording}
              className={`btn-secondary ${isRecording ? 'mic-recording' : ''}`}
              style={{ padding: '0 11px', height: '42px' }}
              title="Voice Input"
            >
              <Mic size={16} />
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={(!input.trim() && !code.trim()) || isLoading}
              style={{ padding: '0 14px', height: '42px' }}
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>

      {/* Feedback Panel */}
      <div className="feedback-panel" style={{ animation: 'fadeIn 0.5s ease' }}>
        <div className="feedback-header">
          <Activity size={15} />
          <span>Real-time Evaluation</span>
        </div>
        <div className="feedback-content">
          {!latestFeedback ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '28px' }}>
              <Activity size={36} style={{ opacity: 0.2, display: 'block', margin: '0 auto 10px auto' }} />
              <p style={{ fontSize: '13px', lineHeight: 1.5 }}>Answer a question to receive real-time feedback.</p>
            </div>
          ) : (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div className="score-circle">
                {latestFeedback.score}<span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/10</span>
              </div>
              <div className="feedback-section"><h4>Correctness</h4><p>{latestFeedback.correctness}</p></div>
              <div className="feedback-section"><h4>Completeness</h4><p>{latestFeedback.completeness}</p></div>
              <div className="feedback-section"><h4>Clarity</h4><p>{latestFeedback.clarity}</p></div>
              <div className="feedback-section" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '12px' }}>
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
