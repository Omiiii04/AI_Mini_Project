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
      `
      document.head.appendChild(style)
    }

    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      
      recognitionRef.current.onerror = (e) => {
        console.error("Speech recognition error", e)
        setIsRecording(false)
      }
      
      recognitionRef.current.onend = () => {
        setIsRecording(false)
      }
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
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])


  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim() && !code.trim().replace('// Write your code here...\n', '')) return;
    if (isLoading) return;
    
    let answerText = input.trim();
    if (showCode && code.trim() && code !== '// Write your code here...\n') {
        answerText += (answerText ? '\n\n' : '') + `\`\`\`javascript\n${code}\n\`\`\``;
    }
    
    onSendMessage(answerText)
    setInput('')
    if (inputRef.current) {
        inputRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleInputChange = (e) => {
    const val = e.target.value
    if (val.length <= 2000) {
      setInput(val)
    }
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`
  }

  const toggleRecording = (e) => {
    e.preventDefault()
    if (!recognitionRef.current) {
        alert("Speech recognition is not supported in this browser (Use Chrome or Edge).")
        return
    }
    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    } else {
      baseInputRef.current = input + (input.length > 0 && !input.endsWith(' ') ? ' ' : '')
      
      recognitionRef.current.onresult = (event) => {
         let currentSessionTranscript = ''
         for (let i = event.resultIndex; i < event.results.length; ++i) {
           currentSessionTranscript += event.results[i][0].transcript
         }
         const newVal = baseInputRef.current + currentSessionTranscript
         if (newVal.length <= 2000) {
            setInput(newVal)
            if (inputRef.current) {
                inputRef.current.style.height = 'auto'
                inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`
            }
         }
      }

      recognitionRef.current.start()
      setIsRecording(true)
    }
  }

  return (
    <div className="chat-layout" style={showCode ? { gridTemplateColumns: 'minmax(400px, 1fr) 450px 350px' } : {}}>
      
      {showCode && (
        <div className="editor-panel" style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-color)', height: '100vh', background: '#1e1e1e' }}>
           <div className="chat-header" style={{ borderBottom: '1px solid #333', background: '#2d2d2d' }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <Code size={18}/> Code Editor
              </h3>
           </div>
           <div style={{ flex: 1 }}>
              <Editor
                 height="100%"
                 defaultLanguage="javascript"
                 theme="vs-dark"
                 value={code}
                 onChange={(value) => setCode(value)}
                 options={{ minimap: { enabled: false }, fontSize: 14 }}
              />
           </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="chat-main" style={{ animation: 'fadeIn 0.4s ease' }}>
        <div className="chat-header">
          <div>
            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '18px' }}>Interview Session</h3>
            <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              {domain} • {difficulty}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: timeLeft > 60 ? 'var(--text-main)' : 'var(--warning-color)', fontWeight: '500' }}>
               <Timer size={16} /> {formatTime(timeLeft)}
            </div>
            <button className="btn-secondary" onClick={onEndInterview} style={{ padding: '8px 16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <LogOut size={16} /> End Interview
            </button>
          </div>
        </div>

        <div className="chat-messages" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`message-bubble ${m.role}`}>
              {m.role === 'assistant' ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Interviewer</div>
              ) : m.role === 'system' ? (
                <div style={{ color: 'var(--accent-color)', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>System</div>
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

        <div style={{ padding: '0 20px 10px 20px' }}>
            <button 
                className="btn-secondary" 
                onClick={onRequestHint} 
                disabled={isLoading}
                title="Requests a hint for -1 point deduction"
                style={{ fontSize: '13px', padding: '6px 12px', borderColor: 'var(--warning-color)', color: 'var(--warning-color)', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
                <HelpCircle size={14} /> Request Hint (-1 pt)
            </button>
        </div>

        <form className="chat-input-area" onSubmit={handleSubmit} style={{ alignItems: 'flex-end', position: 'relative', marginTop: '5px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea 
              ref={inputRef}
              className="input-field" 
              placeholder="Type your answer here... (Shift+Enter for newline)" 
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={1}
              style={{ 
                resize: 'none', 
                overflowY: 'auto', 
                width: '100%', 
                minHeight: '45px',
                paddingTop: '12px',
                paddingBottom: '12px'
              }}
            />
            <div style={{ 
              position: 'absolute', 
              bottom: '-20px', 
              right: '5px', 
              fontSize: '11px', 
              color: input.length >= 1950 ? '#ff4d4f' : 'var(--text-muted)' 
            }}>
              {input.length} / 2000
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={(e) => { e.preventDefault(); setShowCode(prev => !prev); }} className="btn-secondary" style={{ padding: '0 15px', height: '45px', transition: 'all 0.3s', ...showCode ? { background: 'var(--accent-color)', color: '#fff', borderColor: 'var(--accent-color)' } : {}}} title="Toggle Code Editor">
               <Code size={18} />
            </button>
            <button onClick={toggleRecording} className={`btn-secondary ${isRecording ? 'mic-recording' : ''}`} style={{ padding: '0 15px', height: '45px', transition: 'all 0.3s' }} title="Voice Input">
               <Mic size={18} />
            </button>
            <button type="submit" className="btn-primary" disabled={(!input.trim() && !code.trim()) || isLoading} style={{ padding: '0 20px', height: '45px' }}>
              <Send size={18} />
            </button>
          </div>
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
