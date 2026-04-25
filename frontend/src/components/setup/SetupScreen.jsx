import { useState, useEffect } from 'react'
import api from '../../services/api'
import { History } from 'lucide-react'

export function SetupScreen({ onStart, isLoading }) {
  const [domain, setDomain] = useState('Data Structures & Algorithms')
  const [difficulty, setDifficulty] = useState('Intermediate')
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    api.getHistory().then(data => setHistory(data)).catch(console.error)
  }, [])

  return (
    <div className="glass-panel" style={{ maxWidth: showHistory ? '900px' : '500px', margin: 'auto', width: '100%', display: 'flex', gap: '30px', transition: 'max-width 0.3s ease', alignItems: 'flex-start' }}>
      
      <div style={{ flex: '1 1 350px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '28px' }}>AI Interview Prep</h1>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>Configure your mock interview session</p>
      </div>

      <label className="label">Interview Domain</label>
      <select 
        className="select-field" 
        value={domain} 
        onChange={(e) => setDomain(e.target.value)}
        disabled={isLoading}
      >
        <option>Data Structures & Algorithms</option>
        <option>Database Management Systems (DBMS)</option>
        <option>System Design</option>
        <option>Behavioral & HR</option>
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
        onClick={() => onStart(domain, difficulty)}
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
          <History size={16} style={{marginRight: '8px', verticalAlign: 'middle', display: 'inline-block'}} />
          {showHistory ? 'Hide Past Sessions' : 'View Past Sessions'}
        </button>
      )}
      </div>

      {showHistory && (
         <div style={{ flex: '1 1 400px', borderLeft: '1px solid var(--border-color)', paddingLeft: '30px' }}>
            <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-main)' }}>History Dashboard</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '420px', overflowY: 'auto', paddingRight: '10px' }}>
               {history.map(s => (
                  <div key={s.id} style={{ padding: '15px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <strong style={{ color: 'var(--text-main)', fontSize: '15px' }}>{s.domain}</strong>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(s.created_at).toLocaleDateString()}</span>
                     </div>
                     <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        Difficulty: {s.difficulty}  •  Questions: {s.questions_answered}
                     </div>
                     <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ color: s.average_score >= 7 ? 'var(--success-color)' : 'var(--warning-color)', fontWeight: 'bold' }}>
                           Avg Score: {s.average_score}/10
                        </div>
                        {s.is_completed && <span style={{ fontSize: '11px', background: 'var(--accent-color)', color: '#fff', padding: '2px 8px', borderRadius: '12px' }}>Completed</span>}
                     </div>
                  </div>
               ))}
               {history.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No past sessions found.</div>}
            </div>
         </div>
      )}
      
    </div>
  )
}
