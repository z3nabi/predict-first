import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { quizRegistry, getQuizById } from '../data/quizRegistry';

const QuizSelector = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Check if there's a quiz ID in the URL search params
    const searchParams = new URLSearchParams(location.search);
    const quizId = searchParams.get('quizId');
    
    if (quizId) {
      const quizExists = getQuizById(quizId);
      if (quizExists) {
        // If the quiz ID is valid, navigate to that quiz
        navigate(`/quiz/${quizId}`);
      }
    }
  }, [location.search, navigate]);
  
  return (
    <div className="max-w-3xl mx-auto p-6 bg-gray-50 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Choose a Quiz</h1>
      
      <p className="text-center text-sm text-gray-600 mb-6">
        Want to contribute a new quiz? Visit the{' '}
        <a
          href="https://github.com/z3nabi/predict-first"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          GitHub repo
        </a>{' '}
        and check out the{' '}
        <a
          href="https://github.com/z3nabi/predict-first/blob/main/scripts/generate_quiz.py"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          quiz-generator script
        </a>.
      </p>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {quizRegistry.map((quiz) => (
          <div 
            key={quiz.id}
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <h2 className="text-xl font-bold mb-2 text-blue-700">{quiz.title}</h2>
            <p className="text-gray-600 mb-4">{quiz.description}</p>
            <div className="mt-4 flex flex-col sm:flex-row gap-2 items-center justify-center">
              <Link 
                to={`/quiz/${quiz.id}`}
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 text-center"
              >
                Start Quiz
              </Link>
              <button
                onClick={() => {
                  const shareUrl = `${window.location.origin}?quizId=${quiz.id}`;
                  navigator.clipboard.writeText(shareUrl);
                  alert('Share link copied to clipboard!');
                }}
                className="inline-block px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200"
              >
                Share Quiz
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuizSelector; 