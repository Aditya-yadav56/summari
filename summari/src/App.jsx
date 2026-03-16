import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import CustomCursor from './components/CustomCursor'
import Quiz from './components/Quiz'
import { AuthProvider } from './context/AuthContext'
import AuthModal from './components/AuthModal'
import ThemeToggle from './components/ThemeToggle'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <CustomCursor />
      <ThemeToggle />
      <Toaster position="bottom-right" />
      <AuthModal />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/quiz" element={<Quiz />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
