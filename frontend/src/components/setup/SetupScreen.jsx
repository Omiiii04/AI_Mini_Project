import { useState } from 'react'

export function SetupScreen({ onStart, isLoading }) {
  const [domain, setDomain] = useState('Data Structures & Algorithms')
  const [difficulty, setDifficulty] = useState('Intermediate')

  return (
    <div className="glass-panel" style={{ maxWidth: '500px', margin: 'auto', width: '100%' }}>
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
    </div>
  )
}
