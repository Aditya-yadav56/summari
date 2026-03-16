import React, { useRef, useState, useCallback, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { Settings, FileText, LayoutList } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'

/* ─── states ─────────────────────────────────────── */
const S = { IDLE: 'idle', DRAG: 'drag', OPTIONS: 'options', PROCESSING: 'processing', ERROR: 'error' }
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_PAGES = 50;

/* ─── helpers ─────────────────────────────────────── */
function fmtSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/* ─── Animated dashed ring ───────────────────────── */
function IdleRing() {
  return (
    <svg className="ub-ring" viewBox="0 0 260 260" aria-hidden="true">
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#818cf8" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <circle cx="130" cy="130" r="120" fill="none"
        stroke="url(#ringGrad)" strokeWidth="1.5"
        strokeDasharray="9 7" strokeLinecap="round" />
    </svg>
  )
}

/* ─── Orbital spinner ────────────────────────────── */
function Spinner({ pct }) {
  const r = 34
  const circ = 2 * Math.PI * r
  return (
    <svg className="ub-spinner" viewBox="0 0 80 80" aria-hidden="true">
      <circle cx="40" cy="40" r={r} fill="none" stroke="#e2e8f0" strokeWidth="3.5" />
      <circle cx="40" cy="40" r={r} fill="none"
        stroke="url(#spinGrad)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * circ} ${circ}`}
        transform="rotate(-90 40 40)"
        style={{ transition: 'stroke-dasharray 0.2s ease' }}
      />
      <defs>
        <linearGradient id="spinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/* ─── PDF icon ───────────────────────────────────── */
function PdfIcon({ small = false }) {
  const w = small ? 38 : 54, h = small ? 44 : 62
  return (
    <svg className="ub-pdf-icon" width={w} height={h} viewBox="0 0 54 62" fill="none" aria-hidden="true">
      <rect x="3" y="2" width="38" height="50" rx="5" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />
      <path d="M33 2 L33 10 L41 10" stroke="#e2e8f0" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <path d="M33 2 L41 10" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="0" y="32" width="40" height="20" rx="5" fill="url(#pdfFill)" />
      <defs>
        <linearGradient id="pdfFill" x1="0" y1="0" x2="40" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7c3aed" />
          <stop offset="1" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      <text x="7" y="46.5" fontFamily="var(--font-sans),system-ui,sans-serif" fontWeight="800"
        fontSize="10" fill="white" letterSpacing="1">PDF</text>
    </svg>
  )
}

/* ─── Error icon ─────────────────────────────────── */
function ErrorXIcon() {
  return (
    <svg className="ub-error-icon" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="#fef2f2" />
      <path d="M21 21 L43 43 M43 21 L21 43"
        stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  )
}

/* ─── Particles ──────────────────────────────────── */
function Particles({ active }) {
  return (
    <div className={`ub-particles${active ? ' ub-particles--on' : ''}`} aria-hidden="true">
      {Array.from({ length: 14 }, (_, i) => (
        <span key={i} className="ub-particle" style={{ '--i': i }} />
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════ */
export default function UploadBox() {
  const [state, setState] = useState(S.IDLE)
  const [comparisonMode, setComparisonMode] = useState(false);
  const [files, setFiles] = useState([]); // Support multiple files
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [progress, setProgress] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const { currentUser, openAuthModal } = useAuth()

  // Customization Options
  const [summaryLevel, setSummaryLevel] = useState('Detailed')
  const [outputStyle, setOutputStyle] = useState('Paragraph')

  const inputRef = useRef(null)
  const dragCounter = useRef(0)
  const navigate = useNavigate()

  const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Arabic'];

  // Entrance blur-in
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 400)
    return () => clearTimeout(t)
  }, [])

  /* Upload logic */
  const uploadToAPI = useCallback(async () => {
    if (files.length === 0) return;
    setState(S.PROCESSING)
    setProgress(0)

    try {
      let res;
      if (comparisonMode && files.length === 2) {
        const formData = new FormData()
        formData.append('files', files[0])
        formData.append('files', files[1])
        res = await axios.post('http://localhost:5000/compare', formData)
        
        // Navigate to special comparison dashboard (or handle in Dashboard)
        navigate('/dashboard', { 
            state: { 
                isComparison: true, 
                comparisonData: res.data,
                fileName: `${files[0].name} vs ${files[1].name}`
            } 
        });
      } else {
        const formData = new FormData()
        formData.append('file', files[0])
        formData.append('summaryLevel', summaryLevel)
        formData.append('outputStyle', outputStyle)
        formData.append('targetLanguage', selectedLanguage)

        res = await axios.post('http://localhost:5000/upload', formData)
        
        const fileUrl = URL.createObjectURL(files[0]);
        navigate('/dashboard', {
          state: {
            summary: res.data.summary,
            documentText: res.data.documentText,
            fileName: files[0].name,
            fileUrl: fileUrl,
            pageCount: res.data.pageCount
          }
        })
      }
    } catch (err) {
      setProgress(0)
      setErrorMsg(err.response?.data?.error || 'Processing failed.')
      setState(S.ERROR)
      setTimeout(() => { setState(S.IDLE); setErrorMsg('') }, 6000)
    }
  }, [files, summaryLevel, outputStyle, selectedLanguage, comparisonMode, navigate])

  const accept = useCallback((f) => {
    if (!currentUser) {
      toast.info("Please sign in to upload files.");
      openAuthModal();
      return;
    }

    if (!f) return
    const isPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      toast.error("PDF only please.");
      return;
    }

    if (comparisonMode) {
        if (files.length < 2) {
            setFiles(prev => [...prev, f]);
            if (files.length === 1) setState(S.OPTIONS); // Move to options once we have 2
        }
    } else {
        setFiles([f]);
        setState(S.OPTIONS);
    }
  }, [comparisonMode, files])

  /* drag handlers */
  const onDragEnter = (e) => {
    e.preventDefault()
    dragCounter.current++
    if (state !== S.PROCESSING && state !== S.OPTIONS) setState(S.DRAG)
  }
  const onDragOver = (e) => { e.preventDefault() }
  const onDragLeave = (e) => {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current === 0 && state === S.DRAG) setState(S.IDLE)
  }
  const onDrop = (e) => {
    e.preventDefault()
    dragCounter.current = 0
    accept(e.dataTransfer.files[0])
  }

  const openPicker = () => {
    if (state === S.PROCESSING || state === S.OPTIONS) return;
    if (!currentUser) {
      toast.info("Please sign in to upload files.");
      openAuthModal();
      return;
    }
    inputRef.current?.click()
  }

  const reset = (e) => {
    e?.stopPropagation()
    setState(S.IDLE)
    setFiles([])
    setProgress(0)
    setErrorMsg('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const isDrag = state === S.DRAG
  const isProc = state === S.PROCESSING
  const isOpts = state === S.OPTIONS
  const isErr = state === S.ERROR

  // Styling for the options box slightly differs to fit the form
  const isExpanded = isOpts || isProc;

  return (
    <div
      className={['ub-root', mounted && 'ub-mounted', isDrag && 'ub-drag',
        isProc && 'ub-processing', isOpts && 'ub-options', isErr && 'ub-error']
        .filter(Boolean).join(' ')}
      style={{ minHeight: isExpanded ? '400px' : '320px', transition: 'all 0.5s ease-in-out' }}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={openPicker}
      role="button"
      tabIndex={0}
      aria-label="Upload PDF file"
      onKeyDown={e => e.key === 'Enter' && openPicker()}
    >
      <input ref={inputRef} type="file" accept="application/pdf,.pdf"
        className="ub-hidden-input" onChange={e => accept(e.target.files[0])}
        aria-hidden="true" tabIndex={-1} />

      <Particles active={isDrag} />

      {/* Dashed orbital ring */}
      {(state === S.IDLE || isDrag) && <IdleRing />}

      {/* ── IDLE ──────────────────────────────── */}
      {state === S.IDLE && (
        <div className="ub-content ub-fade-in">
          <div className="ub-icon-wrap">
            <PdfIcon />
            <div className="ub-glow" />
          </div>
          <p className="ub-title" style={{ color: 'var(--text-primary)' }}>{comparisonMode ? 'Drop two PDFs to compare' : 'Drop your PDF here'}</p>
          <p className="ub-hint">or <span className="ub-link">browse files</span></p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button 
                onClick={(e) => { e.stopPropagation(); setComparisonMode(!comparisonMode); }} 
                className={`text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full border transition-all`}
                style={{
                  background: comparisonMode ? 'var(--text-primary)' : 'transparent',
                  color: comparisonMode ? 'var(--bg-primary)' : 'var(--text-primary)',
                  borderColor: comparisonMode ? 'var(--text-primary)' : 'var(--border-glass)',
                  opacity: comparisonMode ? 1 : 0.6
                }}
              >
                {comparisonMode ? 'Comparison Active' : 'Enable Comparison'}
              </button>
          </div>
        </div>
      )}

      {/* ── DRAG ──────────────────────────────── */}
      {isDrag && (
        <div className="ub-content ub-fade-in">
          <div className="ub-drop-ring">
            <svg viewBox="0 0 60 60" width="60" height="60" fill="none">
              <circle cx="30" cy="30" r="28" stroke="url(#dragRingG)" strokeWidth="2" />
              <path d="M30 18 L30 42 M18 34 L30 42 L42 34"
                stroke="url(#dragRingG)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="dragRingG" x1="0" y1="0" x2="60" y2="60" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#a78bfa" /><stop offset="1" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <p className="ub-title ub-title--drag">Release to upload</p>
        </div>
      )}

      {/* ── OPTIONS ───────────────────────────── */}
      {isOpts && (
        <div className="ub-content ub-fade-in" style={{ width: '100%', padding: '0 24px' }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', width: '100%' }}>
            {files.map((f, i) => (
                <div key={i} className="ub-file-card" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', width: '100%' }}>
                    <PdfIcon small />
                    <div className="ub-file-meta" style={{ textAlign: 'left' }}>
                        <span className="ub-file-name" style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{f.name}</span>
                        <span className="ub-file-size" style={{ color: 'inherit', opacity: 0.6 }}>{fmtSize(f.size)}</span>
                    </div>
                </div>
            ))}
            {comparisonMode && files.length < 2 && (
                <button onClick={openPicker} className="dashed-placeholder" style={{ padding: '12px', border: '1px dashed var(--border-glass)', borderRadius: '12px', fontSize: '12px', color: 'var(--text-primary)', opacity: 0.8 }}>
                    + Add second document
                </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', textAlign: 'left' }}>
            {!comparisonMode && (
                <>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <Settings size={12} /> Target Language
                  </label>
                  <select 
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-glass)', fontSize: '13px', background: 'var(--bg-glass)', color: 'var(--text-primary)' }}
                  >
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <LayoutList size={12} /> Summary Depth
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {['Brief', 'Detailed', 'ELI5'].map(level => (
                      <button key={level} onClick={() => setSummaryLevel(level)}
                        style={{
                          padding: '8px', fontSize: '12px', borderRadius: '8px', fontWeight: '600', transition: 'all 0.2s',
                          background: summaryLevel === level ? 'var(--text-primary)' : 'var(--bg-glass)',
                          border: `1px solid var(--border-glass)`,
                          color: summaryLevel === level ? 'var(--bg-primary)' : 'var(--text-primary)'
                        }}>
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
                </>
            )}
          </div>

          <button className="ub-cta" onClick={uploadToAPI} style={{ marginTop: '24px', width: '100%', justifyContent: 'center', fontFamily: 'var(--font-sans)' }} disabled={comparisonMode && files.length < 2}>
            {comparisonMode ? 'Compare Documents' : 'Summarize Now'}
            <svg viewBox="0 0 20 20" width="17" height="17" fill="none" style={{ marginLeft: 6 }}>
              <path d="M4 10h12M12 6l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          
          <button onClick={reset} style={{ marginTop: '12px', background: 'none', border: 'none', color: '#94a3b8', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}>
            Start Over
          </button>
        </div>
      )}

      {/* ── PROCESSING ────────────────────────── */}
      {isProc && (
        <div className="ub-content ub-fade-in" onClick={e => e.stopPropagation()}>
          <div className="ub-spinner-wrap">
            <Spinner pct={progress} />
            <span className="ub-pct">{progress}%</span>
          </div>
          <p className="ub-title" style={{ color: 'var(--text-primary)' }}>Analyzing & Summarizing…</p>
          <p className="ub-fname">Reading {files[0]?.name}</p>
          <div className="ub-track" style={{ marginTop: '16px', background: 'var(--border-glass)' }}><div className="ub-fill" style={{ width: `${progress}%` }} /></div>
        </div>
      )}

      {/* ── ERROR ─────────────────────────────── */}
      {isErr && (
        <div className="ub-content ub-fade-in" onClick={e => e.stopPropagation()}>
          <ErrorXIcon />
          <p className="ub-title ub-title--err">
            {errorMsg.includes('Upload failed') ? 'Analysis Error' : 'Invalid file type'}
          </p>
          <p className="ub-hint ub-hint--err">{errorMsg || 'Only .pdf files are accepted.'}</p>
          <button className="ub-cta" onClick={reset} style={{ marginTop: '16px', background: 'white', color: '#0f172a', border: '1px solid #e2e8f0' }}>
            Try again
          </button>
        </div>
      )}
    </div>
  )
}