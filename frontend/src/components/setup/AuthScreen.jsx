import { useState } from 'react'

export function AuthScreen({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
      
      let response;
      if (isLogin) {
          const formData = new URLSearchParams()
          formData.append('username', username)
          formData.append('password', password)
          
          response = await fetch(`http://127.0.0.1:8000${endpoint}`, {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
          })
      } else {
          response = await fetch(`http://127.0.0.1:8000${endpoint}`, {
            method: 'POST',
            body: JSON.stringify({ username, password }),
            headers: {
              'Content-Type': 'application/json'
            }
          })
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed')
      }

      onLogin(data.access_token)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="glass-panel" style={{ maxWidth: '400px', margin: 'auto', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '28px' }}>AI Interview Prep</h1>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
          {isLogin ? 'Sign in to access your dashboard' : 'Create an account to track your progress'}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label className="label">Username</label>
          <input 
            type="text" 
            className="input-field" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required 
          />
        </div>
        
        <div>
          <label className="label">Password</label>
          <input 
            type="password" 
            className="input-field" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
        </div>

        {error && <div style={{ color: 'var(--warning-color)', fontSize: '13px' }}>{error}</div>}

        <button 
          type="submit" 
          className="btn-primary" 
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Register')}
        </button>

        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <button 
             type="button" 
             onClick={() => { setIsLogin(!isLogin); setError(null); }}
             style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '14px' }}
          >
            {isLogin ? "Don't have an account? Register" : "Already have an account? Sign In"}
          </button>
        </div>
      </form>
    </div>
  )
}
