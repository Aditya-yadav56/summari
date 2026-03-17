import React from 'react'
import LiquidBackground from '../components/LiquidBackground'
import HeroSection from '../components/HeroSection'

import { useAuth } from '../context/AuthContext'
import { LogOut, User } from 'lucide-react'

const Home = () => {
  const { currentUser, openAuthModal, logout } = useAuth();

  return (
    <div className="relative min-h-screen selection:bg-black selection:text-white">
      {/* Liquid cloth background — fixed, blurred, behind everything */}
      <LiquidBackground />

      {/* Magazine Header / Logo */}
      <header className="fixed top-0 left-0 right-0 z-50 p-3 flex justify-between items-start pointer-events-none">
        <span
          className="animate-blur-in-up text-xl font-black tracking-tighter select-none cursor-pointer pointer-events-auto"
          style={{ fontFamily: "var(--font-serif)", animationDelay: '0.1s', color: 'var(--text-primary)' }}
        >
          SUMMARI.
        </span>
        
        <div className="animate-blur-in-up flex flex-col items-end pointer-events-auto gap-2" style={{ animationDelay: '0.3s' }}>
          <div className="flex flex-col items-end" style={{ color: 'var(--text-primary)' }}>
            <span className="text-[10px] font-bold tracking-[0.4em] uppercase opacity-40">Privacy First</span>
            <span className="text-[10px] font-bold tracking-[0.4em] uppercase opacity-40">AI Powered</span>
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            {currentUser ? (
              <div className="flex items-center gap-4 backdrop-blur-md px-4 py-2 rounded-full border shadow-sm" style={{ background: 'var(--bg-glass)', borderColor: 'var(--border-glass)', color: 'var(--text-primary)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-linear-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white shadow-inner">
                    <User size={12} />
                  </div>
                  <span className="text-xs font-semibold tracking-wide truncate max-w-[120px]">
                    {currentUser.email?.split('@')[0]}
                  </span>
                </div>
                <div className="w-px h-4" style={{ background: 'var(--border-glass)' }}></div>
                <button 
                  onClick={logout}
                  className="p-1 rounded-full transition-colors opacity-60 hover:opacity-100"
                  style={{ color: 'var(--text-primary)' }}
                  title="Log out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 backdrop-blur-md p-1 pl-4 rounded-full border shadow-sm" style={{ background: 'var(--bg-glass)', borderColor: 'var(--border-glass)' }}>
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-60" style={{ color: 'var(--text-primary)' }}>Account</span>
                <button 
                  onClick={openAuthModal}
                  className="px-5 py-2 rounded-full text-xs font-bold tracking-wide transition-colors shadow-md"
                  style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
 
      {/* Hero */}
      <main>
        <HeroSection />
      </main>
    </div>
  )
}

export default Home
