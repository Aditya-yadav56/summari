import React, { useEffect, useRef, useState } from 'react'
import UploadBox from './UploadBox'

const FULL_TEXT = 'Time to summarize it'
const TYPEWRITER_SPEED = 65     // ms per character
const START_DELAY = 700      // ms before typing starts (let blur-in settle)
const UNDERLINE_DELAY = 400     // ms after typing finishes before underline draws

export default function HeroSection() {
    const [displayed, setDisplayed] = useState('')
    const [showUnderline, setShowUnderline] = useState(false)
    const [visible, setVisible] = useState(false)
    const indexRef = useRef(0)

    useEffect(() => {
        // Trigger the container fade-blur-in
        const visTimer = setTimeout(() => setVisible(true), 100)

        // Start typewriter after delay
        const startTimer = setTimeout(() => {
            const interval = setInterval(() => {
                indexRef.current += 1
                setDisplayed(FULL_TEXT.slice(0, indexRef.current))
                if (indexRef.current >= FULL_TEXT.length) {
                    clearInterval(interval)
                    // After typing finishes, trigger underline
                    setTimeout(() => setShowUnderline(true), UNDERLINE_DELAY)
                }
            }, TYPEWRITER_SPEED)
            return () => clearInterval(interval)
        }, START_DELAY)

        return () => {
            clearTimeout(visTimer)
            clearTimeout(startTimer)
        }
    }, [])

    return (
        <section className="hero-section" style={{ minHeight: '100vh', padding: '0.75rem' }}>
            {/* Magazine Background Title */}
            <div 
                className={`absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden ${visible ? 'opacity-10' : 'opacity-0'}`}
                style={{ transition: 'opacity 2s ease' }}
            >
                <h1 className="mag-display-l mag-stroke-text scale-110">
                    SUMMARI
                </h1>
            </div>

            <div className={`relative z-10 w-full max-w-4xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-between gap-6 ${visible ? 'hero-visible' : 'opacity-0'}`} style={{ transition: 'all 1s ease' }}>
                
                {/* Left Side: Headline & Metadata */}
                <div className="flex flex-col gap-4 md:w-1/2">
                    <div className="flex flex-col gap-2">
                        <span className="mag-subtitle animate-blur-in-up" style={{ animationDelay: '0.2s' }}>
                            The Art of Compression — Vol. 01
                        </span>
                        <h2 className="mag-display-m leading-tight">
                            {displayed}
                            <span className="hero-cursor" aria-hidden="true">|</span>
                        </h2>
                    </div>

                    <div className="mag-border-box max-w-sm animate-blur-in-up" style={{ animationDelay: '0.5s' }}>
                        <p className="text-sm font-medium uppercase tracking-widest opacity-60 mb-2">Editor's Note</p>
                        <p className="leading-relaxed italic" style={{ color: 'var(--text-primary)', opacity: 0.8 }}>
                            In an era of information overload, clarity is the ultimate luxury. 
                            Our algorithms distill the essence of your documents, 
                            leaving only the most potent insights.
                        </p>
                    </div>

                    <div className="flex gap-12 mt-4 animate-blur-in-up" style={{ animationDelay: '0.8s' }}>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold uppercase tracking-tighter">Edition</span>
                            <span className="font-serif italic text-lg">2026 / MAR</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold uppercase tracking-tighter">Typeface</span>
                            <span className="font-serif italic text-lg">Display Serif</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Upload Box */}
                <div className={`md:w-1/2 flex justify-center items-center ub-container ${showUnderline ? 'ub-container--visible' : ''}`}>
                    <div className="relative">
                        {/* Decorative vertical text next to upload box */}
                        <div className="absolute -left-12 top-0 bottom-0 mag-vertical-text hidden lg:flex">
                            Secure • Instant • Intelligent
                        </div>
                        <UploadBox />
                    </div>
                </div>
            </div>

            {/* Bottom Magazine Bar */}
            <div 
                className="absolute bottom-12 left-12 right-12 flex justify-between items-end border-t pt-6 z-10 hidden md:flex"
                style={{ borderColor: 'var(--border-glass)' }}
            >
                <div className="flex gap-8 text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: 'var(--text-primary)', opacity: 0.6 }}>
                    <span>Research Paper</span>
                    <span>Executive Summary</span>
                    <span>Legal Review</span>
                </div>
                <div className="mag-subtitle text-[10px]" style={{ color: 'var(--text-primary)', opacity: 0.6 }}>
                    Summari © 2026
                </div>
            </div>
        </section>
    )
}
