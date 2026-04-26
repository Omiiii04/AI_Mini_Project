import { Award, Target, BookOpen, RefreshCw, Download } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import html2pdf from 'html2pdf.js'
import { useRef, useState } from 'react'

export function SummaryDashboard({ report, onRestart }) {
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
      margin: 10,
      filename: 'AI_Interview_Report.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }
    html2pdf().set(opt).from(reportRef.current).save()
      .then(() => setIsExporting(false))
      .catch((err) => { console.error(err); setIsExporting(false) })
  }

  return (
    <div
      className="glass-panel"
      style={{
        maxWidth: '800px',
        margin: 'auto',
        width: '100%',
        /* Use viewport-aware max-height instead of fixed 90vh so it doesn't
           clip on smaller screens; overflowY lets it scroll if needed */
        maxHeight: 'calc(100vh - 40px)',
        overflowY: 'auto',
      }}
    >
      <div ref={reportRef} style={{ padding: '4px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '28px', margin: '0 0 8px 0' }}>Interview Complete</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px' }}>
            Here is the comprehensive evaluation of your performance.
          </p>
        </div>

        {/* Score circle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '110px', height: '110px', borderRadius: '50%',
            border: `6px solid ${scoreColor}`,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 20px ${scoreColor}40`
          }}>
            <span style={{ fontSize: '32px', fontWeight: 'bold' }}>{report.total_score}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Overall</span>
          </div>
        </div>

        {/* Expert summary */}
        <div className="summary-text" style={{ fontSize: '15px' }}>
          <h3 style={{ margin: '0 0 14px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
            <Award size={18} color="var(--accent-color)" /> Expert Summary
          </h3>
          <ReactMarkdown>{report.summary}</ReactMarkdown>
        </div>

        {/* Stat grid */}
        <div className="summary-grid">
          <div className="stat-card" style={{ textAlign: 'left' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              <Target size={16} /> Major Strengths
            </h4>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.5 }}>{report.strong_areas}</p>
          </div>

          <div className="stat-card" style={{ textAlign: 'left' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--warning-color)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              <BookOpen size={16} /> Areas for Improvement
            </h4>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.5 }}>{report.weak_areas}</p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{
        marginTop: '28px', display: 'flex', gap: '12px',
        justifyContent: 'center', flexWrap: 'wrap'
      }}>
        <button
          className="btn-secondary"
          onClick={downloadPDF}
          disabled={isExporting}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <Download size={16} /> {isExporting ? 'Exporting...' : 'Download PDF'}
        </button>
        <button
          className="btn-primary"
          onClick={onRestart}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={16} /> Start New Interview
        </button>
      </div>
    </div>
  )
}
