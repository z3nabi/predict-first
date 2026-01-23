import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Quiz from './components/Quiz'
import QuizSelector from './components/QuizSelector'
import CollectionView from './components/CollectionView'
import './App.css'

function App() {
  return (
    <Router>
      <div className="min-h-screen py-8">
        <Routes>
          <Route path="/" element={<QuizSelector />} />
          <Route path="/quiz/:quizId" element={<Quiz />} />
          <Route path="/collection/:collectionId" element={<CollectionView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
