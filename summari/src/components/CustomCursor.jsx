import React, { useEffect, useState, useRef } from 'react';

export default function CustomCursor() {
    const cursorRef = useRef(null);
    const dotRef = useRef(null);
    
    // State indicators (UI only)
    const [isHoveringState, setIsHoveringState] = useState(false);
    const [isClickedState, setIsClickedState] = useState(false);
    
    // Refs for animation loop (avoiding re-renders/loop duplication)
    const mousePos = useRef({ x: -100, y: -100 });
    const isHovering = useRef(false);
    const isClicked = useRef(false);
    
    const cursorOutlinePos = useRef({ x: 0, y: 0 });
    const cursorDotPos = useRef({ x: 0, y: 0 });
    const cursorScale = useRef(1);
    const dotScale = useRef(1);
    const isFirstMove = useRef(true);

    useEffect(() => {
        const moveMouse = (e) => {
            const { clientX, clientY } = e;
            mousePos.current = { x: clientX, y: clientY };
            
            if (isFirstMove.current) {
                cursorOutlinePos.current = { x: clientX, y: clientY };
                cursorDotPos.current = { x: clientX, y: clientY };
                isFirstMove.current = false;
            }
        };

        const handleMouseDown = () => {
            isClicked.current = true;
            setIsClickedState(true);
        };
        const handleMouseUp = () => {
            isClicked.current = false;
            setIsClickedState(false);
        };

        const handleHover = (e) => {
            const target = e.target;
            const clickCheck = 
                target.tagName === 'BUTTON' || 
                target.tagName === 'A' || 
                target.closest('button') || 
                target.closest('a') ||
                window.getComputedStyle(target).cursor === 'pointer';
            
            isHovering.current = clickCheck;
            setIsHoveringState(clickCheck);
        };

        window.addEventListener('mousemove', moveMouse);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('mouseover', handleHover);

        // SINGLE Animation Loop
        let animId;
        const animate = () => {
            if (cursorRef.current && dotRef.current) {
                const posLerp = 0.22;
                const dotPosLerp = 0.45;
                const scaleLerp = 0.18;

                // 1. Interpolate Positions
                cursorOutlinePos.current.x += (mousePos.current.x - cursorOutlinePos.current.x) * posLerp;
                cursorOutlinePos.current.y += (mousePos.current.y - cursorOutlinePos.current.y) * posLerp;

                cursorDotPos.current.x += (mousePos.current.x - cursorDotPos.current.x) * dotPosLerp;
                cursorDotPos.current.y += (mousePos.current.y - cursorDotPos.current.y) * dotPosLerp;

                // 2. Interpolate Scales
                const targetScale = isClicked.current ? 0.75 : (isHovering.current ? 1.8 : 1);
                const targetDotScale = isClicked.current ? 1.6 : (isHovering.current ? 0.4 : 1);

                cursorScale.current += (targetScale - cursorScale.current) * scaleLerp;
                dotScale.current += (targetDotScale - dotScale.current) * scaleLerp;

                // 3. Apply
                cursorRef.current.style.transform = `translate3d(${cursorOutlinePos.current.x}px, ${cursorOutlinePos.current.y}px, 0) translate(-50%, -50%) scale(${cursorScale.current})`;
                dotRef.current.style.transform = `translate3d(${cursorDotPos.current.x}px, ${cursorDotPos.current.y}px, 0) translate(-50%, -50%) scale(${dotScale.current})`;
                
                cursorRef.current.style.opacity = mousePos.current.x < 0 ? '0' : '1';
                dotRef.current.style.opacity = mousePos.current.x < 0 ? '0' : '1';
            }
            animId = requestAnimationFrame(animate);
        };
        animId = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('mousemove', moveMouse);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mouseover', handleHover);
            cancelAnimationFrame(animId);
        };
    }, []);

    return (
        <>
            <div
                ref={cursorRef}
                className="custom-cursor-container"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    border: '1.5px solid rgba(0, 0, 0, 0.15)',
                    backgroundColor: 'transparent',
                    backdropFilter: 'invert(100%) grayscale(100%)',
                    WebkitBackdropFilter: 'invert(100%) grayscale(100%)',
                    mixBlendMode: 'difference',
                    pointerEvents: 'none',
                    zIndex: 9999,
                    transition: 'opacity 0.4s ease',
                    opacity: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <div style={{
                    position: 'absolute',
                    inset: '-2px',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    borderRadius: '50%',
                    opacity: isClickedState ? 1 : 0,
                    transform: `scale(${isClickedState ? 1.15 : 0.8})`,
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }} />
            </div>

            <div
                ref={dotRef}
                className="custom-cursor-dot"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    mixBlendMode: 'difference',
                    pointerEvents: 'none',
                    zIndex: 10000,
                    opacity: 0,
                }}
            />

            <style>{`
                /* Hide custom cursor on mobile/touch devices */
                @media (hover: none) and (pointer: coarse) {
                    .custom-cursor-container, .custom-cursor-dot {
                        display: none !important;
                    }
                    body, a, button, input, select, textarea {
                        cursor: auto !important;
                    }
                }

                @media (hover: hover) {
                    body, a, button, input, select, textarea {
                        cursor: none !important;
                    }
                    
                    a:hover, button:hover {
                        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                        transform: scale(1.05);
                    }
                }
            `}</style>
        </>
    );
}
