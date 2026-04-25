import { Award, Target, BookOpen, RefreshCw, Download } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import html2pdf from 'html2pdf.js'
import { useRef, useState } from 'react'

export function SummaryDashboard({ report, onRestart }) {
  // Determine color based on score
  let scoreColor = 'var(--accent-color)'
  if (report.total_score >= 80) scoreColor = 'var(--success-color)'
  else if (report.total_score < 50) scoreColor = 'var(--error-color)'
  else if (report.total_score < 70) scoreColor = 'var(--warning-color)'

  const reportRef = useRef(null)
  const [isExporting, setIsExporting] = useState(false)

  const downloadPDF = () => {
    if (!reportRef.current) return
    setIsExporting(true)
    const opt = {
      margin:       10,
      filename:     'AI_Interview_Report.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }
    
    html2pdf().set(opt).from(reportRef.current).save().then(() => {
        setIsExporting(false)
    }).catch((err) => {
        console.error(err)
        setIsExporting(false)
    })
  }

  return (
    <div className="glass-panel" style={{ maxWidth: '800px', margin: 'auto', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
      <div ref={reportRef} style={{ padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '32px', margin: '0 0 8px 0' }}>Interview Complete</h2>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Here is the comprehensive evaluation of your performance.</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
        <div style={{
          width: '120px', height: '120px', borderRadius: '50%', 
          border: `6px solid ${scoreColor}`, display: 'flex', 
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 20px ${scoreColor}40`
        }}>
          <span style={{ fontSize: '36px', fontWeight: 'bold' }}>{report.total_score}</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Overall</span>
        </div>
      </div>

      <div className="summary-text" style={{ fontSize: '16px' }}>
        <h3 style={{ margin: '0 0 16px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={20} color="var(--accent-color)" /> Expert Summary
        </h3>
        <ReactMarkdown>{report.summary}</ReactMarkdown>
      </div>

      <div className="summary-grid">
        <div className="stat-card" style={{ textAlign: 'left' }}>
          <h4 style={{ margin: '0 0 12px 0', color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={18} /> Major Strengths
          </h4>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>{report.strong_areas}</p>
        </div>

        <div className="stat-card" style={{ textAlign: 'left' }}>
          <h4 style={{ margin: '0 0 12px 0', color: 'var(--warning-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={18} /> Areas for Improvement
          </h4>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>{report.weak_areas}</p>
        </div>
      </div>

      </div>

      <div style={{ marginTop: '32px', textAlign: 'center', display: 'flex', gap: '16px', justifyContent: 'center' }}>
        <button className="btn-secondary" onClick={downloadPDF} disabled={isExporting} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={18} /> {isExporting ? 'Exporting...' : 'Download PDF'}
        </button>
        <button className="btn-primary" onClick={onRestart}>
          <RefreshCw size={18} /> Start New Interview
        </button>
      </div>
    </div>
  )
}
