import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Quiz from './components/Quiz'
import QuizSelector from './components/QuizSelector'
import PaperQuizGenerator from './components/PaperQuizGenerator'
import ThemeToggle from './components/ThemeToggle'
import { ThemeProvider } from './context/ThemeContext'
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen py-8 dark:bg-gray-900 transition-colors">
          <ThemeToggle />
          <Routes>
            <Route path="/" element={<QuizSelector />} />
            <Route path="/quiz/:quizId" element={<Quiz />} />
            <Route path="/generate" element={<PaperQuizGenerator />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App
