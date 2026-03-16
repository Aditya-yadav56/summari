import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ArrowLeft, CheckCircle2, XCircle, Trophy, RefreshCcw, Sparkles, BrainCircuit } from 'lucide-react';
import LiquidBackground from './LiquidBackground';

export default function Quiz() {
    const location = useLocation();
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const headerRef = useRef(null);

    const quizData = location.state?.quizData || [];
    
    const [answers, setAnswers] = useState({});
    const [isFinished, setIsFinished] = useState(false);
    const [score, setScore] = useState(0);

    const questionRefs = useRef([]);

    // Entrance Animation setup
    useEffect(() => {
        if (!quizData.length) return;
        
        const ctx = gsap.context(() => {
            gsap.from(headerRef.current, { y: -50, opacity: 0, duration: 1, ease: 'power3.out' });
            
            // Stagger questions based on visibility / initial load
            questionRefs.current.forEach((el, index) => {
                if (el) {
                    gsap.fromTo(el, 
                        { opacity: 0, y: 100, scale: 0.95 }, 
                        { 
                            opacity: 1, y: 0, scale: 1, 
                            duration: 1, 
                            ease: 'expo.out', 
                            delay: index * 0.15 + 0.5 
                        }
                    );
                }
            });
        }, containerRef);

        return () => ctx.revert();
    }, [quizData]);

    // Handle scroll-based animations manually since ScrollTrigger wasn't explicitly imported
    useEffect(() => {
        const handleScroll = () => {
            const viewHeight = window.innerHeight;
            questionRefs.current.forEach((el) => {
                if (!el) return;
                const rect = el.getBoundingClientRect();
                
                // If element is somewhat visible, subtly parallax it or fade it
                if (rect.top <= viewHeight && rect.bottom >= 0) {
                    const progress = 1 - (rect.top / viewHeight);
                    // Slight floating effect based on scroll
                    gsap.to(el, {
                        y: Math.max(0, 30 - (progress * 30)),
                        duration: 0.5,
                        overwrite: 'auto'
                    });
                }
            });
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
        }
        return () => {
            if (container) container.removeEventListener('scroll', handleScroll);
        }
    }, []);

    const handleOptionClick = (qIndex, oIndex, correctIndex) => {
        if (answers[qIndex] !== undefined) return; // already answered

        const isCorrect = oIndex === correctIndex;
        if (isCorrect) setScore(s => s + 1);

        setAnswers(prev => ({ ...prev, [qIndex]: oIndex }));

        // Animation for the selected option card
        const qCard = questionRefs.current[qIndex];
        
        gsap.to(qCard, {
            scale: 1.02,
            duration: 0.2,
            yoyo: true,
            repeat: 1,
            ease: 'power2.inOut'
        });

        // Flash screen background slightly
        gsap.fromTo(containerRef.current, 
            { backgroundColor: isCorrect ? 'rgba(110, 231, 183, 0.2)' : 'rgba(252, 165, 165, 0.2)' },
            { backgroundColor: 'transparent', duration: 1, ease: 'power2.out' }
        );

        // Auto-scroll to next question
        if (qIndex < quizData.length - 1) {
            setTimeout(() => {
                const nextQ = questionRefs.current[qIndex + 1];
                if (nextQ) {
                    const y = nextQ.offsetTop - 100;
                    containerRef.current.scrollTo({ top: y, behavior: 'smooth' });
                }
            }, 1200);
        } else {
            // If it was the last question, show finish button
            setTimeout(() => {
                containerRef.current.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
            }, 1000);
        }
    };

    const handleFinish = () => {
        setIsFinished(true);
        containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        
        setTimeout(() => {
            gsap.fromTo('.review-card', 
                { opacity: 0, y: 50, rotationX: -10 },
                { opacity: 1, y: 0, rotationX: 0, duration: 0.8, stagger: 0.1, ease: 'back.out(1.7)' }
            );
        }, 100);
    };

    if (!quizData || !quizData.length) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LiquidBackground />
                <div style={{ position: 'relative', zIndex: 10, background: 'white', padding: '40px', borderRadius: '24px', textAlign: 'center' }}>
                    <p>No quiz data found.</p>
                    <button onClick={() => navigate('/dashboard')} style={{ marginTop: '20px', padding: '10px 20px', background: 'black', color: 'white', borderRadius: '12px' }}>Go Back</button>
                </div>
            </div>
        );
    }

    const allAnswered = Object.keys(answers).length === quizData.length;

    return (
        <div ref={containerRef} style={{ height: '100vh', position: 'relative', overflowX: 'hidden', overflowY: 'auto', paddingBottom: '100px', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)', background: 'var(--bg-primary)' }}>
            <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.3 }}>
                <LiquidBackground />
            </div>

            {/* Header */}
            <header ref={headerRef} style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '80px', background: 'var(--bg-glass)', backdropFilter: 'blur(20px)', zIndex: 100, display: 'flex', alignItems: 'center', padding: '0 40px', borderBottom: '1px solid var(--border-glass)', justifyContent: 'space-between' }}>
                <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', padding: '10px 16px', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', color: 'var(--text-primary)' }}>
                    <ArrowLeft size={16} /> Exit Quiz
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <BrainCircuit className="text-indigo-500" />
                    <span style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '-0.02em' }}>Intelligence Check</span>
                </div>
                <div style={{ fontWeight: '800', background: 'var(--bg-glass)', padding: '8px 16px', borderRadius: '12px', color: 'var(--text-primary)', opacity: 0.7 }}>
                    Answered: {Object.keys(answers).length} / {quizData.length}
                </div>
            </header>

            <main style={{ position: 'relative', zIndex: 10, maxWidth: '800px', margin: '0 auto', paddingTop: '140px' }}>
                
                {!isFinished ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '80px' }}>
                        {quizData.map((q, qIndex) => {
                            const isAnswered = answers[qIndex] !== undefined;
                            
                            return (
                                <div 
                                    key={qIndex} 
                                    ref={el => questionRefs.current[qIndex] = el}
                                    style={{ 
                                        background: 'var(--bg-glass)', 
                                        backdropFilter: 'blur(20px)',
                                        borderRadius: '32px', 
                                        padding: '48px', 
                                        boxShadow: '0 20px 40px rgba(0,0,0,0.03)',
                                        border: '1px solid var(--border-glass)',
                                        opacity: isAnswered ? 0.6 : 1,
                                        transform: isAnswered ? 'scale(0.98)' : 'scale(1)',
                                        transition: 'opacity 0.5s, transform 0.5s',
                                        color: 'var(--text-primary)'
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: '#818cf8', color: 'white', fontWeight: '900', fontSize: '14px' }}>
                                            {qIndex + 1}
                                        </span>
                                        <h3 style={{ fontSize: '24px', fontWeight: '800', lineHeight: '1.4' }}>{q.question}</h3>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {q.options.map((opt, oIndex) => {
                                            const isSelected = answers[qIndex] === oIndex;
                                            const isCorrect = oIndex === q.correctIndex;
                                            
                                            // Determine styling based on state
                                            let bg = 'var(--bg-glass)';
                                            let border = '1px solid var(--border-glass)';
                                            let color = 'var(--text-primary)';
                                            let icon = null;

                                            if (isAnswered) {
                                                if (isCorrect) {
                                                    bg = 'rgba(16, 185, 129, 0.1)';
                                                    border = '1px solid #10b981';
                                                    color = '#10b981';
                                                    icon = <CheckCircle2 size={18} className="text-emerald-500" />;
                                                } else if (isSelected && !isCorrect) {
                                                    bg = 'rgba(239, 68, 68, 0.1)';
                                                    border = '1px solid #ef4444';
                                                    color = '#ef4444';
                                                    icon = <XCircle size={18} className="text-red-500" />;
                                                }
                                            }

                                            return (
                                                <button
                                                    key={oIndex}
                                                    onClick={() => handleOptionClick(qIndex, oIndex, q.correctIndex)}
                                                    disabled={isAnswered}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        width: '100%',
                                                        padding: '20px 24px',
                                                        borderRadius: '16px',
                                                        background: bg,
                                                        border: border,
                                                        color: color,
                                                        fontSize: '16px',
                                                        fontWeight: '600',
                                                        textAlign: 'left',
                                                        cursor: isAnswered ? 'default' : 'pointer',
                                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        transform: isSelected ? 'scale(1.02)' : 'scale(1)'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (!isAnswered) {
                                                            e.currentTarget.style.transform = 'scale(1.02)';
                                                            e.currentTarget.style.borderColor = 'var(--text-primary)';
                                                            e.currentTarget.style.background = 'var(--bg-glass)';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!isAnswered) {
                                                            e.currentTarget.style.transform = 'scale(1)';
                                                            e.currentTarget.style.borderColor = border;
                                                            e.currentTarget.style.background = bg;
                                                        }
                                                    }}
                                                >
                                                    <span style={{ flex: 1 }}>{opt}</span>
                                                    {icon}
                                                </button>
                                            )
                                        })}
                                    </div>
                                    
                                    {isAnswered && (
                                        <div style={{ marginTop: '24px', padding: '20px', borderRadius: '16px', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', display: 'flex', gap: '12px' }}>
                                            <Sparkles size={20} className={answers[qIndex] === q.correctIndex ? "text-emerald-500" : "text-orange-400"} style={{ flexShrink: 0, marginTop: '2px' }} />
                                            <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-primary)', opacity: 0.8, fontWeight: '500' }}>
                                                <span style={{ fontWeight: '800', color: answers[qIndex] === q.correctIndex ? '#10b981' : '#f59e0b' }}>Explanation: </span> 
                                                {q.explanation}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )
                        })}

                        {allAnswered && (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <button 
                                    onClick={handleFinish}
                                    style={{ padding: '20px 48px', fontSize: '18px', fontWeight: '900', background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)', color: 'white', border: 'none', borderRadius: '24px', cursor: 'pointer', boxShadow: '0 20px 40px rgba(139, 92, 246, 0.3)', transition: 'all 0.3s' }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                                >
                                    Finish & View Report
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    // Review Screen
                    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                        <div style={{ background: 'var(--bg-glass)', borderRadius: '40px', padding: '60px', textAlign: 'center', boxShadow: '0 40px 100px rgba(0,0,0,0.05)', marginBottom: '40px', position: 'relative', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
                            <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(129,140,248,0.2) 0%, transparent 70%)', borderRadius: '50%' }}></div>
                            <div style={{ position: 'absolute', bottom: '-100px', right: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(192,132,252,0.2) 0%, transparent 70%)', borderRadius: '50%' }}></div>
                            
                            <Trophy size={80} className="text-yellow-400 mx-auto mb-6 drop-shadow-lg" />
                            <h1 style={{ fontSize: '48px', fontWeight: '900', letterSpacing: '-0.04em', marginBottom: '12px' }}>Quiz Complete!</h1>
                            <p style={{ fontSize: '20px', color: 'var(--text-primary)', opacity: 0.6, fontWeight: '600' }}>You scored {score} out of {quizData.length}</p>
                            
                            <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
                                <button onClick={() => window.location.reload()} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: '16px', fontWeight: '700', cursor: 'pointer', color: 'var(--text-primary)' }}>
                                    <RefreshCcw size={16} /> Retake Quiz
                                </button>
                                <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'var(--text-primary)', color: 'var(--bg-primary)', borderRadius: '16px', fontWeight: '700', border: 'none', cursor: 'pointer' }}>
                                    Return to Dashboard
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: '800', paddingLeft: '20px' }}>Detailed Review</h2>
                            {quizData.map((q, i) => {
                                const didGetRight = answers[i] === q.correctIndex;
                                return (
                                <div key={i} className="review-card" style={{ background: 'var(--bg-glass)', padding: '32px', borderRadius: '24px', border: '1px solid var(--border-glass)', position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: '32px', right: '32px' }}>
                                            {didGetRight ? <CheckCircle2 size={32} className="text-emerald-500" /> : <XCircle size={32} className="text-red-500" />}
                                        </div>
                                        <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', paddingRight: '40px' }}>{i + 1}. {q.question}</h3>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                                            <div>
                                                <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-primary)', opacity: 0.4, letterSpacing: '0.05em' }}>Your Answer:</span>
                                                <p style={{ fontWeight: '600', color: didGetRight ? '#10b981' : '#ef4444', marginTop: '4px' }}>{q.options[answers[i]]}</p>
                                            </div>
                                            {!didGetRight && (
                                                <div>
                                                    <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-primary)', opacity: 0.4, letterSpacing: '0.05em' }}>Correct Answer:</span>
                                                    <p style={{ fontWeight: '600', color: '#10b981', marginTop: '4px' }}>{q.options[q.correctIndex]}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                                            <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-primary)', opacity: 0.8 }}>
                                                <span style={{ fontWeight: '700' }}>Explanation:</span> {q.explanation}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
