import { ArrowRight, Code, Brain, Target } from 'lucide-react'

export function LandingPage({ onGetStarted }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '40px 20px',
      minHeight: 'calc(100vh - 80px)',
      animation: 'fadeIn 0.6s ease'
    }}>
      
      {/* Hero Badge */}
      <div style={{
        background: 'rgba(59, 130, 246, 0.1)',
        color: 'var(--accent-color)',
        padding: '8px 16px',
        borderRadius: '24px',
        fontSize: '14px',
        fontWeight: '600',
        marginBottom: '32px',
        border: '1px solid rgba(59, 130, 246, 0.2)'
      }}>
        ✨ The Next Generation of Technical Preparation
      </div>

      <h1 style={{
        fontSize: 'clamp(2.5rem, 5vw, 4rem)',
        fontWeight: '800',
        lineHeight: 1.1,
        color: 'var(--text-main)',
        maxWidth: '800px',
        margin: '0 0 24px 0',
        letterSpacing: '-1px'
      }}>
        Master Your Next Technical Interview with <span style={{ color: 'var(--accent-color)' }}>AI</span>
      </h1>
      
      <p style={{
        fontSize: 'clamp(1.1rem, 2vw, 1.25rem)',
        color: 'var(--text-muted)',
        maxWidth: '600px',
        margin: '0 0 48px 0',
        lineHeight: 1.6
      }}>
        Practice real-world coding questions, receive instant actionable feedback, and land your dream job with our intelligent mock interview platform.
      </p>

      <button 
        onClick={onGetStarted}
        style={{
          background: 'var(--accent-color)',
          color: 'white',
          border: 'none',
          padding: '16px 40px',
          borderRadius: '30px',
          fontSize: '1.1rem',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseOver={e => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 12px 28px rgba(59, 130, 246, 0.4)'
        }}
        onMouseOut={e => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.3)'
        }}
      >
        Get Started Free <ArrowRight size={20} />
      </button>

      {/* Feature Grid */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '24px',
        justifyContent: 'center',
        marginTop: '80px',
        maxWidth: '1000px'
      }}>
        {[
          { icon: <Brain size={24}/>, title: 'Adaptive AI', desc: 'Questions scale to your actual skill level in real-time.' },
          { icon: <Code size={24}/>, title: 'Live Coding', desc: 'Write and test your answers in a professional environment.' },
          { icon: <Target size={24}/>, title: 'Instant Feedback', desc: 'Get scored on correctness, clarity, and completeness.' }
        ].map((feat, i) => (
          <div key={i} className="glass-panel" style={{
            flex: '1 1 280px',
            maxWidth: '320px',
            textAlign: 'left',
            padding: '32px 24px'
          }}>
            <div style={{ color: 'var(--accent-color)', marginBottom: '16px' }}>{feat.icon}</div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: 'var(--text-main)' }}>{feat.title}</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.5 }}>{feat.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
