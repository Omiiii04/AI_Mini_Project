import { useState, useEffect } from 'react'
import api from '../../services/api'
import { History } from 'lucide-react'

export function SetupScreen({ onStart, isLoading }) {
  const [domain, setDomain] = useState('Data Structures & Algorithms')
  const [difficulty, setDifficulty] = useState('Intermediate')
  const [language, setLanguage] = useState('English')
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    api.getHistory().then(data => setHistory(data)).catch(console.error)
  }, [])

  return (
    <div
      className="glass-panel"
      style={{
        maxWidth: showHistory ? '900px' : '500px',
        margin: 'auto',
        width: '100%',
        transition: 'max-width 0.3s ease',
        overflowY: 'auto',
        maxHeight: 'calc(100vh - 40px)',
      }}
    >
      {/* Inner wrapper: flex row on desktop, column on mobile */}
      <div style={{
        display: 'flex',
        gap: '30px',
        alignItems: 'flex-start',
        flexWrap: 'wrap',   /* wraps to column on narrow screens */
      }}>

        {/* Setup form */}
        <div style={{ flex: '1 1 300px', minWidth: 0 }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '26px' }}>AI Interview Prep</h1>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>Configure your mock interview session</p>
          </div>

          <label className="label">Interview Language</label>
          <select
            className="select-field"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={isLoading}
            style={{ marginBottom: '16px' }}
          >
            <option>English</option>
            <option>Spanish (Español)</option>
            <option>French (Français)</option>
            <option>German (Deutsch)</option>
            <option>Hindi (हिंदी)</option>
            <option>Chinese (中文)</option>
            <option>Japanese (日本語)</option>
          </select>

          <label className="label">Interview Domain</label>
          <select
            className="select-field"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            disabled={isLoading}
            style={{ marginBottom: '16px' }}
          >
            <option>Data Structures &amp; Algorithms</option>
            <option>Database Management Systems (DBMS)</option>
            <option>System Design</option>
            <option>Behavioral &amp; HR</option>
            <option>Frontend Engineering (React)</option>
          </select>

          <label className="label">Difficulty</label>
          <select
            className="select-field"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            disabled={isLoading}
          >
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
            <option>Expert</option>
          </select>

          <button
            className="btn-primary"
            style={{ width: '100%' }}
            onClick={() => onStart(domain, difficulty, language)}
            disabled={isLoading}
          >
            {isLoading ? 'Preparing Session...' : 'Start Interview'}
          </button>

          {history.length > 0 && (
            <button
              className="btn-secondary"
              style={{ width: '100%', marginTop: '12px' }}
              onClick={() => setShowHistory(!showHistory)}
              disabled={isLoading}
            >
              <History size={15} style={{ marginRight: '7px', verticalAlign: 'middle', display: 'inline-block' }} />
              {showHistory ? 'Hide Past Sessions' : 'View Past Sessions'}
            </button>
          )}
        </div>

        {/* History panel — shows below form on mobile (flex-wrap handles it) */}
        {showHistory && (
          <div style={{
            flex: '1 1 300px',
            minWidth: 0,
            borderLeft: '1px solid var(--border-color)',
            paddingLeft: '28px',
            /* On mobile the border-left becomes border-top */
          }}
            className="history-panel"
          >
            <style>{`
              @media (max-width: 640px) {
                .history-panel {
                  border-left: none !important;
                  padding-left: 0 !important;
                  border-top: 1px solid var(--border-color);
                  padding-top: 20px !important;
                }
              }
            `}</style>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-main)', fontSize: '16px' }}>History Dashboard</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '380px', overflowY: 'auto', paddingRight: '6px' }}>
              {history.map(s => (
                <div key={s.id} style={{ padding: '14px', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                    <strong style={{ color: 'var(--text-main)', fontSize: '14px' }}>{s.domain}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(s.created_at).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Difficulty: {s.difficulty} &nbsp;•&nbsp; Questions: {s.questions_answered}
                  </div>
                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ color: s.average_score >= 7 ? 'var(--success-color)' : 'var(--warning-color)', fontWeight: 'bold', fontSize: '13px' }}>
                      Avg Score: {s.average_score}/10
                    </div>
                    {s.is_completed && (
                      <span style={{ fontSize: '11px', background: 'var(--accent-color)', color: '#fff', padding: '2px 8px', borderRadius: '12px' }}>
                        Completed
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {history.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No past sessions found.</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
