import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { quizRegistry, getQuizById } from '../data/quizRegistry';
import { Sparkles } from 'lucide-react';

// Shared button component for consistency
const PrimaryButton = ({ to, onClick, children, className = '' }) => {
  const baseClasses = "inline-block px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 font-medium transition-colors duration-200 text-center";
  
  if (to) {
    return (
      <Link to={to} className={`${baseClasses} ${className}`}>
        {children}
      </Link>
    );
  }
  
  return (
    <button onClick={onClick} className={`${baseClasses} ${className}`}>
      {children}
    </button>
  );
};

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
    <div className="max-w-3xl mx-auto p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-md transition-colors">
      <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100 mb-6">Choose a Quiz</h1>
      
      <div className="mb-8">
        <Link
          to="/generate"
          className="block w-full p-6 bg-blue-100 dark:bg-blue-900 border-2 border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors duration-200"
        >
          <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-blue-200 dark:bg-blue-800 rounded-full mb-3">
              <Sparkles className="h-6 w-6 text-blue-700 dark:text-blue-300" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-blue-700 dark:text-blue-300">✨ Generate a Quiz BEFORE reading the paper ✨</h2>
            <p className="text-blue-700 dark:text-blue-300 mb-2">
              Enter a URL to a research paper PDF and we'll generate a quiz on demand
            </p>
            <PrimaryButton className="mt-2">
              Create Custom Quiz
            </PrimaryButton>
          </div>
        </Link>
      </div>
      
      <h2 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-4">Existing Quizzes</h2>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {quizRegistry.map((quiz) => (
          <div 
            key={quiz.id}
            className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <h2 className="text-xl font-bold mb-2 text-blue-700 dark:text-blue-300">{quiz.title}</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{quiz.description}</p>
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <PrimaryButton to={`/quiz/${quiz.id}`}>
                Start Quiz
              </PrimaryButton>
              <button
                onClick={() => {
                  const shareUrl = `${window.location.origin}?quizId=${quiz.id}`;
                  navigator.clipboard.writeText(shareUrl);
                  alert('Share link copied to clipboard!');
                }}
                className="inline-block px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
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