import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Initial theme setup
        const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedTheme = localStorage.getItem('theme');
        const initialDark = savedTheme === 'dark' || (!savedTheme && isSystemDark);
        
        setIsDark(initialDark);
        if (initialDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleTheme = (e) => {
        const willBeDark = !isDark;
        
        // Use View Transitions API if supported
        if (!document.startViewTransition) {
            applyTheme(willBeDark);
            return;
        }

        const x = e.clientX;
        const y = e.clientY;
        
        const endRadius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
        );

        const transition = document.startViewTransition(() => {
            applyTheme(willBeDark);
        });

        transition.ready.then(() => {
            const clipPath = [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`
            ];

            // Animate only the new state (the incoming view)
            document.documentElement.animate(
                {
                    clipPath: willBeDark ? clipPath : [...clipPath].reverse(),
                },
                {
                    duration: 600,
                    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                    pseudoElement: willBeDark ? '::view-transition-new(root)' : '::view-transition-old(root)',
                }
            );
        });
    };

    const applyTheme = (dark) => {
        setIsDark(dark);
        localStorage.setItem('theme', dark ? 'dark' : 'light');
        if (dark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    return (
        <button
            onClick={toggleTheme}
            style={{
                position: 'fixed',
                top: '24px',
                right: '32px',
                zIndex: 9999,
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(167, 139, 250, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isDark ? '#fff' : '#1a1a1a',
                cursor: 'pointer',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                transition: 'transform 0.3s, background 0.3s'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)';
                e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0,0,0,0.05)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            aria-label="Toggle theme"
            title="Toggle Theme"
        >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
    );
}
