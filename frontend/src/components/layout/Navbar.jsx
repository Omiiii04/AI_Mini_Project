import { Sun, Moon, BrainCircuit, LogOut } from 'lucide-react'

export function Navbar({ theme, toggleTheme, token, onLogout }) {
  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 24px',
      background: 'var(--panel-bg-alpha)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ background: 'var(--accent-color)', padding: '6px', borderRadius: '8px', color: 'white', display: 'flex' }}>
          <BrainCircuit size={20} />
        </div>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text-main)' }}>AI Interviewer</h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button 
          onClick={toggleTheme} 
          style={{
            background: 'transparent',
            border: '1px solid var(--border-color)',
            color: 'var(--text-main)',
            padding: '8px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        
        {token && (
          <button
            className="btn-secondary"
            onClick={onLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              fontSize: '14px',
            }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        )}
      </div>
    </nav>
  )
}
