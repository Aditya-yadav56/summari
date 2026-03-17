import React, { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
    ArrowLeft, Sparkles, LayoutList, Target, ChevronRight, Copy, Share2,
    Download, ThumbsUp, ThumbsDown, Edit3, Save, X, Clock, AlignLeft,
    MessageSquare, PanelRightClose, PanelRight, History, Sidebar, Eye, FileText,
    Loader2, Brain
} from 'lucide-react'
import axios from 'axios'
import LiquidBackground from '../components/LiquidBackground'
import ChatPanel from '../components/ChatPanel'
import PdfPreview from '../components/PdfPreview'
import { toast } from 'sonner'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';

export default function Dashboard() {
    const location = useLocation()
    const navigate = useNavigate()
    const summaryRef = useRef(null)

    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [sidebarTab, setSidebarTab] = useState('chat') // 'chat' | 'preview' | 'facts' | 'viz' | 'map' | 'compare'
    const [history, setHistory] = useState([])
    const [audioLoading, setAudioLoading] = useState(false);
    const [audioUrl, setAudioUrl] = useState(null);

    // Navigation and Data setup
    const isComparison = location.state?.isComparison;
    const comparisonData = location.state?.comparisonData;

    const unwrap = (obj) => {
        if (!obj) return null;
        if (typeof obj === 'string') {
            try { return unwrap(JSON.parse(obj)); } catch (e) { return { title: "Summary", overview: obj }; }
        }
        return obj;
    };

    const initialSummary = isComparison ? comparisonData : unwrap(location.state?.summary);
    const documentText = location.state?.documentText || '';
    const fileName = location.state?.fileName || 'Document';

    const [localSummary, setLocalSummary] = useState(initialSummary);
    const [isEditing, setIsEditing] = useState(false);

    // Quiz State
    const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
    const [quizConfig, setQuizConfig] = useState({ difficulty: 'Medium', numQuestions: 5 });
    const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

    // Defensive Fallbacks for Visual Features
    useEffect(() => {
        if (localSummary && (!localSummary.visualData || !localSummary.narrativeMap)) {
            setLocalSummary(prev => ({
                ...prev,
                visualData: prev?.visualData || [
                    { label: 'Complexity', value: 40 },
                    { label: 'Density', value: 70 },
                    { label: 'Sentiment', value: 85 }
                ],
                narrativeMap: prev?.narrativeMap || {
                    nodes: [{ id: prev?.title || 'Core', group: 1 }],
                    links: []
                }
            }));
        }
    }, [localSummary]);

    useEffect(() => {
        if (isComparison) {
            setSidebarTab('compare');
        }
    }, [isComparison]);

    const handleAudioBrief = async () => {
        if (audioUrl) { setAudioUrl(null); return; } // Toggle off
        setAudioLoading(true);
        try {
            const textToSpeak = `${localSummary.title}. ${localSummary.overview}`;
            const res = await axios.post('http://localhost:5000/audio', { text: textToSpeak }, { responseType: 'blob' });
            const url = URL.createObjectURL(res.data);
            setAudioUrl(url);
        } catch (err) {
            toast.error("Audio generation failed.");
        } finally {
            setAudioLoading(false);
        }
    };

    const handleJumpToPage = (citation) => {
        const page = parseInt(citation?.replace(/[^0-9]/g, ''));
        if (page && window.jumpToPdfPage) {
            window.jumpToPdfPage(page);
            setSidebarTab('preview');
            setIsSidebarOpen(true);
        }
    };

    const handleExportEditorial = async () => {
        const doc = new jsPDF('p', 'mm', 'a4');
        const element = summaryRef.current;
        const canvas = await html2canvas(element, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        
        const imgProps = doc.getImageProperties(imgData);
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        doc.save(`${fileName}_Summari_Editorial.pdf`);
        toast.success("Magazine-style PDF exported!");
    };

    const handleGenerateQuiz = async () => {
        setIsGeneratingQuiz(true);
        try {
            const response = await axios.post('http://localhost:5000/quiz', {
                documentText: documentText,
                difficultyLevel: quizConfig.difficulty,
                numQuestions: quizConfig.numQuestions
            });
            setIsQuizModalOpen(false);
            navigate('/quiz', { state: { quizData: response.data.questions, documentText, fileName, summary: localSummary } });
        } catch (err) {
            toast.error("Failed to generate quiz.");
            console.error(err);
        } finally {
            setIsGeneratingQuiz(false);
        }
    };

    const [searchTerm, setSearchTerm] = useState('');
    const filteredTopics = localSummary?.keyTopics?.filter(t => 
        t.topicName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.topicDescription.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const filteredInsights = localSummary?.actionableInsights?.filter(i => 
        (i.text || i).toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!localSummary) {
        return (
            <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LiquidBackground />
                <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', background: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
                    <p>No data found.</p>
                    <button onClick={() => navigate('/')}>Go home</button>
                </div>
            </div>
        )
    }

    return (
        <div style={{ position: 'fixed', inset: 0, height: '100vh', width: '100vw', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <style>{` ::-webkit-scrollbar { display: none; } * { scrollbar-width: none; } `}</style>
            <LiquidBackground />

            {/* Header */}
            <header style={{ height: '54px', background: 'var(--bg-glass)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border-glass)', zIndex: 100, display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => navigate('/')} style={headerBtnStyle}><ArrowLeft size={16} /></button>
                    <span style={{ fontSize: '16px', fontWeight: '900', fontFamily: 'var(--font-serif)', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>SUMMARI.</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={handleAudioBrief} style={audioBtnStyle(!!audioUrl)}>
                        {audioLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} 
                        {audioUrl ? 'Playing Brief' : 'Generate Audio Brief'}
                    </button>

                    <div style={{ display: 'flex', background: 'rgba(128, 128, 128, 0.1)', padding: '4px', borderRadius: '12px', gap: '4px' }}>
                        <button onClick={() => { setIsSidebarOpen(true); setSidebarTab('chat'); }} style={tabBtnStyle(isSidebarOpen && sidebarTab === 'chat')}>Chat</button>
                        <button onClick={() => { setIsSidebarOpen(true); setSidebarTab('preview'); }} style={tabBtnStyle(isSidebarOpen && sidebarTab === 'preview')}>Preview</button>
                        <button onClick={() => { setIsSidebarOpen(true); setSidebarTab('facts'); }} style={tabBtnStyle(isSidebarOpen && sidebarTab === 'facts')}>Facts</button>
                        <button onClick={() => { setIsSidebarOpen(true); setSidebarTab('viz'); }} style={tabBtnStyle(isSidebarOpen && sidebarTab === 'viz')}>Charts</button>
                        <button onClick={() => { setIsSidebarOpen(true); setSidebarTab('map'); }} style={tabBtnStyle(isSidebarOpen && sidebarTab === 'map')}>Map</button>
                    </div>

                    <button onClick={() => setIsQuizModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', background: '#818cf8', color: 'white', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 4px 14px rgba(129, 140, 248, 0.4)' }}>
                        <Brain size={16} /> Make Quiz
                    </button>

                    <button onClick={handleExportEditorial} style={headerBtnStyle} title="Editorial Export"><Download size={16} /></button>
                </div>
            </header>

            {/* Audio Player Bar */}
            {audioUrl && (
                <div style={{ height: '50px', background: 'black', color: 'white', display: 'flex', alignItems: 'center', padding: '0 32px', gap: '20px', zIndex: 90 }}>
                    <span className="text-xs font-bold uppercase tracking-widest opacity-60">Audio Brief</span>
                    <audio src={audioUrl} autoPlay controls style={{ height: '30px', flex: 1 }} />
                    <button onClick={() => setAudioUrl(null)} style={{ color: 'white', opacity: 0.6 }}><X size={16} /></button>
                </div>
            )}

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <main style={{ flex: 1, overflowY: 'auto', padding: '32px 24px', position: 'relative', zIndex: 10 }}>
                    <div ref={summaryRef} style={{ ...summaryCardStyle, width: '100%', maxWidth: '680px', margin: '0 auto' }}>
                        {isComparison ? (
                            <div style={{ textAlign: 'left' }}>
                                <h1 style={titleStyle}>Comparison Report</h1>
                                <p style={overviewStyle}>{localSummary.overview}</p>
                                <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {localSummary.deltas?.map((delta, i) => (
                                        <div key={i} style={topicStyle}>
                                            <h3 style={topicNameStyle}>{delta.property}</h3>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '12px' }}>
                                                <div className="p-4 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }}>
                                                    <span className="text-[10px] font-bold uppercase opacity-40" style={{ color: 'var(--text-primary)' }}>Doc 1</span>
                                                    <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>{delta.doc1}</p>
                                                </div>
                                                <div className="p-4 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }}>
                                                    <span className="text-[10px] font-bold uppercase opacity-40" style={{ color: 'var(--text-primary)' }}>Doc 2</span>
                                                    <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>{delta.doc2}</p>
                                                </div>
                                            </div>
                                            <p className="text-sm font-bold mt-4" style={{ color: 'var(--mag-gold)' }}>Significance: {delta.significance}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                <h1 style={{ ...titleStyle, fontFamily: 'var(--font-serif)', fontSize: '28px' }}>{localSummary.title}</h1>
                                
                                <div style={{ position: 'relative', marginBottom: '40px' }}>
                                    <input 
                                        type="text" 
                                        placeholder="Deep Semantic Search..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{ width: '100%', padding: '16px 24px', borderRadius: '16px', border: '1px solid var(--border-glass)', background: 'var(--bg-glass)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
                                    />
                                    <Sparkles size={16} style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                                </div>

                                <p style={overviewStyle}>{localSummary.overview}</p>

                                <div style={{ marginTop: '60px' }}>
                                    <h2 style={sectionTitleStyle}>Key Summary Topics</h2>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                                        {filteredTopics?.map((topic, i) => (
                                            <div key={i} style={topicStyle}>
                                                <div className="flex justify-between items-start">
                                                    <h3 style={topicNameStyle}>{topic.topicName}</h3>
                                                    {topic.citation && (
                                                        <button onClick={() => handleJumpToPage(topic.citation)} className="mag-subtitle text-[9px] hover:underline">
                                                            Jump to {topic.citation}
                                                        </button>
                                                    )}
                                                </div>
                                                <p style={topicDescStyle}>{topic.topicDescription}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ marginTop: '60px' }}>
                                    <h2 style={sectionTitleStyle}>Actionable Insights</h2>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {filteredInsights?.map((insight, i) => (
                                            <div key={i} style={insightRowStyle}>
                                                <div className="flex-1">
                                                    <p style={{ fontSize: '16px', lineHeight: '1.6' }}>{insight.text || insight}</p>
                                                </div>
                                                {insight.citation && (
                                                    <button onClick={() => handleJumpToPage(insight.citation)} className="mag-subtitle text-[9px] hover:underline">
                                                        {insight.citation}
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </main>

                {/* Sidebar */}
                <aside style={sidebarStyle(isSidebarOpen)}>
                    <div style={{ height: '100%', padding: '24px', display: 'flex', flexDirection: 'column' }}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="mag-subtitle text-xs">{sidebarTab} View</h3>
                            <button onClick={() => setIsSidebarOpen(false)}><X size={16} /></button>
                        </div>
                        
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {sidebarTab === 'facts' && localSummary.factSheet && (
                                <div className="flex flex-col gap-8">
                                    <section>
                                        <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-primary)' }}>Financials</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {localSummary.factSheet?.financials?.map((f, i) => <div key={i} className="p-3 rounded-xl text-sm font-semibold" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }}>{f}</div>)}
                                        </div>
                                    </section>
                                    <section>
                                        <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-primary)' }}>Critical Dates</h4>
                                        <div className="flex flex-col gap-2">
                                            {localSummary.factSheet?.dates?.map((d, i) => <div key={i} className="p-3 rounded-xl text-sm font-semibold flex items-center gap-2" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }}><Clock size={12}/> {d}</div>)}
                                        </div>
                                    </section>
                                    <section>
                                        <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-primary)' }}>Key Entities</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {localSummary.factSheet?.peopleCompanies?.map((p, i) => <div key={i} className="p-3 rounded-xl text-sm font-semibold" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }}>{p}</div>)}
                                        </div>
                                    </section>
                                </div>
                            )}

                            {sidebarTab === 'viz' && localSummary.visualData && (
                                <div style={{ height: '300px', padding: '20px', background: 'var(--bg-glass)', borderRadius: '24px', border: '1px solid var(--border-glass)' }}>
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest mb-6 opacity-40">Extracted Trends</h4>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={localSummary.visualData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-glass)" />
                                            <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={10} stroke="var(--text-primary)" />
                                            <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="var(--text-primary)" />
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                                            <Bar dataKey="value" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                                            <defs>
                                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#818cf8" />
                                                    <stop offset="100%" stopColor="#c084fc" />
                                                </linearGradient>
                                            </defs>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {sidebarTab === 'map' && localSummary.narrativeMap && (
                                <div style={{ height: '500px', background: 'var(--bg-glass)', borderRadius: '24px', border: '1px solid var(--border-glass)', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                                    <h4 className="p-6 text-[10px] font-bold uppercase tracking-widest opacity-40">Narrative Structure Map</h4>
                                    <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {/* Lightweight SVG-based Narrative Map */}
                                        <svg width="100%" height="100%" viewBox="0 0 500 500">
                                            <defs>
                                                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orientation="auto">
                                                    <polygon points="0 0, 10 3.5, 0 7" fill="var(--text-primary)" />
                                                </marker>
                                            </defs>
                                            {localSummary.narrativeMap.links?.map((link, i) => {
                                                const sourceNode = localSummary.narrativeMap.nodes.find(n => n.id === link.source);
                                                const targetNode = localSummary.narrativeMap.nodes.find(n => n.id === link.target);
                                                if (!sourceNode || !targetNode) return null;
                                                return (
                                                    <line 
                                                        key={i} 
                                                        x1={250 + (Math.cos(i) * 150)} 
                                                        y1={250 + (Math.sin(i) * 150)} 
                                                        x2={250} 
                                                        y2={250} 
                                                        stroke="var(--border-glass)" 
                                                        strokeWidth="1.5"
                                                    />
                                                );
                                            })}
                                            {localSummary.narrativeMap.nodes?.map((node, i) => {
                                                const angle = (i / localSummary.narrativeMap.nodes.length) * Math.PI * 2;
                                                const x = i === 0 ? 250 : 250 + Math.cos(angle) * 150;
                                                const y = i === 0 ? 250 : 250 + Math.sin(angle) * 150;
                                                return (
                                                    <g key={i}>
                                                        <circle cx={x} cy={y} r={i === 0 ? 40 : 25} fill={i === 0 ? "#818cf8" : "#c084fc"} style={{ cursor: 'pointer', transition: 'all 0.3s' }} onClick={() => toast.info(`Topic: ${node.id}`)} />
                                                        <text x={x} y={y + (i === 0 ? 60 : 45)} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--text-primary)" style={{ pointerEvents: 'none' }}>{node.id}</text>
                                                    </g>
                                                );
                                            })}
                                        </svg>
                                    </div>
                                </div>
                            )}

                            {sidebarTab === 'chat' && <ChatPanel documentText={documentText} />}
                            {sidebarTab === 'preview' && <PdfPreview fileName={fileName} fileUrl={location.state?.fileUrl} />}
                        </div>
                    </div>
                </aside>
            </div>

            {/* Quiz Configuration Modal */}
            {isQuizModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(10px)' }}>
                    <div style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', width: '400px', borderRadius: '24px', padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', border: '1px solid var(--border-glass)' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)' }}>Generate Quiz</h2>
                        <p style={{ color: 'var(--text-primary)', opacity: 0.6, fontSize: '14px', marginBottom: '24px' }}>Test your knowledge on this document.</p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Difficulty</label>
                                <select 
                                    value={quizConfig.difficulty}
                                    onChange={(e) => setQuizConfig({...quizConfig, difficulty: e.target.value})}
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-glass)', background: 'var(--bg-glass)', color: 'var(--text-primary)', outline: 'none', fontSize: '14px' }}
                                >
                                    <option value="Easy">Easy</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Hard">Hard</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Number of Questions: {quizConfig.numQuestions}</label>
                                <input 
                                    type="range" 
                                    min="1" max="10" 
                                    value={quizConfig.numQuestions}
                                    onChange={(e) => setQuizConfig({...quizConfig, numQuestions: parseInt(e.target.value)})}
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setIsQuizModalOpen(false)} style={{ padding: '12px 20px', borderRadius: '12px', background: 'transparent', border: 'none', fontWeight: '700', cursor: 'pointer', color: 'var(--text-primary)' }} disabled={isGeneratingQuiz}>Cancel</button>
                            <button onClick={handleGenerateQuiz} disabled={isGeneratingQuiz} style={{ padding: '12px 24px', borderRadius: '12px', background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', fontWeight: '700', cursor: isGeneratingQuiz ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {isGeneratingQuiz ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}
                                {isGeneratingQuiz ? 'Generating...' : 'Start Quiz'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

const headerBtnStyle = { width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)' }
const audioBtnStyle = (active) => ({ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px', background: active ? 'var(--text-primary)' : 'var(--bg-glass)', color: active ? 'var(--bg-primary)' : 'var(--text-primary)', border: '1px solid var(--border-glass)', fontWeight: '700', fontSize: '11px', cursor: 'pointer', transition: 'all 0.3s' })
const tabBtnStyle = (active) => ({ padding: '5px 10px', borderRadius: '6px', border: 'none', background: active ? 'var(--text-primary)' : 'transparent', color: active ? 'var(--bg-primary)' : '#94a3b8', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', boxShadow: active ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' })
const summaryCardStyle = { width: '100%', maxWidth: '680px', margin: '0 auto', background: 'var(--bg-glass)', borderRadius: '24px', padding: '40px', boxShadow: '0 40px 100px rgba(0,0,0,0.02)', border: '1px solid var(--border-glass)' }
const titleStyle = { fontSize: '28px', fontWeight: '900', letterSpacing: '-0.04em', lineHeight: '1.1', marginBottom: '16px' }
const overviewStyle = { fontSize: '15px', lineHeight: '1.7' }
const sectionTitleStyle = { fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.3em', color: 'var(--mag-gold)', marginBottom: '24px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }
const topicStyle = { padding: '24px', borderRadius: '16px', background: 'rgba(128, 128, 128, 0.05)', border: '1px solid var(--border-glass)' }
const topicNameStyle = { fontSize: '16px', fontWeight: '800', marginBottom: '8px' }
const topicDescStyle = { fontSize: '13px', lineHeight: '1.7', color: 'inherit', opacity: 0.8 }
const insightsCardStyle = { display: 'flex', flexDirection: 'column', gap: '10px' }
const insightRowStyle = { padding: '16px', borderRadius: '14px', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', display: 'flex', gap: '12px', alignItems: 'center' }
const sidebarStyle = (isOpen) => ({ width: isOpen ? '350px' : '0px', background: 'var(--bg-glass)', borderLeft: isOpen ? '1px solid var(--border-glass)' : 'none', transition: 'width 0.6s cubic-bezier(0.85, 0, 0.15, 1)', overflow: 'hidden', position: 'relative', height: '100%' })
