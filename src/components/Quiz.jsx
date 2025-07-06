import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, ArrowRight, RotateCcw, ChevronDown, ChevronUp, Info, Home } from 'lucide-react';
import { loadQuizData, getQuizById } from '../data/quizRegistry';

const Quiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [predictions, setPredictions] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);
  const [expandedContexts, setExpandedContexts] = useState({});
  const [questionStatus, setQuestionStatus] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [quizData, setQuizData] = useState({ questions: [], methodologySummary: '' });
  const [quizInfo, setQuizInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setIsLoading(true);
        
        // Validate quiz ID exists in registry
        const quizMeta = getQuizById(quizId);
        if (!quizMeta) {
          setError(`Quiz with ID '${quizId}' not found`);
          setIsLoading(false);
          return;
        }
        
        setQuizInfo(quizMeta);
        
        // Load quiz data
        const data = await loadQuizData(quizId);
        setQuizData({
          questions: data.questions,
          methodologySummary: data.methodologySummary
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading quiz data:", error);
        setError(`Failed to load quiz: ${error.message}`);
        setIsLoading(false);
      }
    };

    // Reset state when quiz ID changes
    setCurrentQuestionIndex(0);
    setPredictions({});
    setShowResults(false);
    setCompleted(false);
    setQuestionStatus({});
    setExpandedContexts({});
    setError(null);
    
    fetchQuizData();
  }, [quizId]);
  
  const handleOptionSelect = (option) => {
    if (questionStatus[currentQuestionIndex]) return; // Prevent changing answer after submission
    
    setPredictions({
      ...predictions,
      [currentQuestionIndex]: option
    });
  };
  
  const handleSubmitAnswer = () => {
    if (!predictions[currentQuestionIndex]) return;
    
    setQuestionStatus({
      ...questionStatus,
      [currentQuestionIndex]: true // Mark question as answered
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowResults(true);
      setCompleted(true);
    }
  };

  const handleReset = () => {
    setCurrentQuestionIndex(0);
    setPredictions({});
    setShowResults(false);
    setCompleted(false);
    setQuestionStatus({});
  };
  
  const calculateScore = () => {
    let score = 0;
    Object.keys(predictions).forEach(idx => {
      if (predictions[idx] === quizData.questions[idx].correctAnswer) {
        score++;
      }
    });
    return score;
  };

  const toggleContext = (index) => {
    setExpandedContexts({
      ...expandedContexts,
      [index]: !expandedContexts[index]
    });
  };

  // Helper to render the plain-text methodology summary with proper bullet lists
  const renderMethodologySummary = (summary) => {
    if (!summary) return null;

    const lines = summary.trim().split('\n');
    const elements = [];
    let listItems = [];

    const flushList = (keyPrefix) => {
      if (listItems.length) {
        elements.push(
          <ul
            key={`list-${keyPrefix}`}
            className="list-disc pl-6 space-y-1 text-left"
          >
            {listItems.map((item, idx) => (
              <li key={`${keyPrefix}-${idx}`}>{item}</li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('- ')) {
        // Accumulate list items
        listItems.push(trimmed.slice(2).trim());
      } else {
        // Before handling a normal line, flush any pending list items
        flushList(idx);

        if (trimmed.length === 0) {
          // Preserve paragraph breaks
          elements.push(<div key={`br-${idx}`} className="h-2" />);
        } else {
          elements.push(
            <p key={`p-${idx}`} className="text-left mb-2">
              {trimmed}
            </p>
          );
        }
      }
    });

    // Flush any remaining list items
    flushList('last');

    return elements;
  };

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center max-w-3xl mx-auto p-6 bg-red-50 rounded-lg shadow-md">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Quiz</h2>
        <p className="text-red-700 mb-6">{error}</p>
        <Link to="/" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
          <Home className="h-4 w-4 mr-2" /> Back to Quiz Selection
        </Link>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 max-w-3xl mx-auto p-6 bg-gray-50 rounded-lg shadow-md">
        <div className="w-12 h-12 border-4 border-t-blue-600 border-r-gray-200 border-b-gray-200 border-l-gray-200 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading quiz data...</p>
      </div>
    );
  }

  // If data is loaded
  const currentQuestion = quizData.questions[currentQuestionIndex];

  return (
    <div className="flex flex-col space-y-6 max-w-3xl mx-auto p-6 bg-gray-50 rounded-lg shadow-md">
      {/* Header: Back button on its own line (left-aligned) and title centered below */}
      <div className="mb-2">
        <Link to="/" className="text-blue-600 hover:text-blue-800 flex items-center">
          <Home className="h-4 w-4 mr-1" /> Back to Quizzes
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-center text-gray-800">{quizInfo?.title}</h1>
      
      <p className="text-center text-gray-600 mt-1">{quizInfo?.description}</p>
      
      {quizInfo?.paperLink && (
        <a
          href={quizInfo.paperLink}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-blue-600 hover:text-blue-800 underline mt-1"
        >
          Read the paper ↗
        </a>
      )}
      
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div 
          className="flex justify-between items-center cursor-pointer" 
          onClick={() => setShowMethodology(!showMethodology)}
        >
          <h2 className="text-lg font-medium text-blue-800">Study Methodology Overview</h2>
          {showMethodology ? <ChevronUp className="h-5 w-5 text-blue-600" /> : <ChevronDown className="h-5 w-5 text-blue-600" />}
        </div>
        
        {showMethodology && (
          <div className="mt-3 text-blue-800 space-y-2">
            {renderMethodologySummary(quizData.methodologySummary)}
          </div>
        )}
      </div>
      
      {!showResults ? (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm" style={{ backgroundColor: '#ffffff', color: '#213547' }}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm" style={{ color: '#6b7280' }}>Question {currentQuestionIndex + 1} of {quizData.questions.length}</span>
              <span className="text-sm font-medium" style={{ color: '#2563eb' }}>{Object.keys(questionStatus).length} answered</span>
            </div>
            
            <h2 className="text-lg font-medium mb-2" style={{ color: '#213547' }}>{currentQuestion.question}</h2>
            
            {currentQuestion.context && (
              <div className="mb-4">
                <div 
                  className="flex items-center text-sm cursor-pointer" 
                  style={{ color: '#6b7280' }}
                  onClick={() => toggleContext(currentQuestionIndex)}
                >
                  <Info className="h-4 w-4 mr-1" /> 
                  {expandedContexts[currentQuestionIndex] ? "Hide context" : "Show context"}
                  {expandedContexts[currentQuestionIndex] ? 
                    <ChevronUp className="h-4 w-4 ml-1" /> : 
                    <ChevronDown className="h-4 w-4 ml-1" />
                  }
                </div>
                
                {expandedContexts[currentQuestionIndex] && (
                  <div className="mt-2 p-3 rounded-md text-sm" style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb', color: '#374151', border: '1px solid #e5e7eb' }}>
                    {currentQuestion.context}
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              {currentQuestion.options.map((option, index) => {
                const isSelected = predictions[currentQuestionIndex] === option;
                const isQuestionAnswered = questionStatus[currentQuestionIndex];
                const isCorrectAnswer = option === currentQuestion.correctAnswer;
                const isIncorrectSelection = isSelected && !isCorrectAnswer && isQuestionAnswered;
                
                let className = "quiz-option ";
                
                if (isQuestionAnswered) {
                  // Question has been answered
                  if (isCorrectAnswer) {
                    // This is the correct answer - always highlight it
                    className += "correct ";
                  } else if (isSelected) {
                    // This is an incorrect answer that was selected
                    className += "incorrect ";
                  } else {
                    // This is just a regular unselected option
                    className += "default ";
                  }
                } else {
                  // Question hasn't been answered yet
                  className += isSelected ? "selected " : "default ";
                }
                
                return (
                  <div 
                    key={index}
                    onClick={() => handleOptionSelect(option)}
                    className={className.trim()}
                  >
                    {option}
                  </div>
                );
              })}
            </div>
            
            {questionStatus[currentQuestionIndex] && (
              <div style={{ 
                marginTop: '1rem', 
                padding: '1rem', 
                borderRadius: '0.375rem', 
                backgroundColor: predictions[currentQuestionIndex] === currentQuestion.correctAnswer ? '#dcfce7' : '#fee2e2',
                borderColor: predictions[currentQuestionIndex] === currentQuestion.correctAnswer ? '#86efac' : '#fecaca',
                borderWidth: '1px',
                color: '#213547'
              }}>
                <div className="flex items-start gap-2">
                  {predictions[currentQuestionIndex] === currentQuestion.correctAnswer ? (
                    <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: '#22c55e' }} />
                  ) : (
                    <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: '#ef4444' }} />
                  )}
                  <div>
                    <p className="font-medium mb-1" style={{ color: '#213547' }}>
                      {predictions[currentQuestionIndex] === currentQuestion.correctAnswer 
                        ? "Correct!" 
                        : `Incorrect. The correct answer is: ${currentQuestion.correctAnswer}`}
                    </p>
                    <p className="text-sm" style={{ color: '#213547' }}>{currentQuestion.explanation}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-between">
            <div>
              {currentQuestionIndex > 0 && (
                <button
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  className="px-4 py-2 rounded-md" 
                  style={{ backgroundColor: '#e5e7eb', color: '#374151' }}
                >
                  Previous
                </button>
              )}
            </div>
            
            <div>
              {!questionStatus[currentQuestionIndex] ? (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!predictions[currentQuestionIndex]}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    backgroundColor: !predictions[currentQuestionIndex] ? '#e5e7eb' : '#2563eb',
                    color: !predictions[currentQuestionIndex] ? '#9ca3af' : '#ffffff',
                    cursor: !predictions[currentQuestionIndex] ? 'not-allowed' : 'pointer'
                  }}
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-4 py-2 rounded-md flex items-center"
                  style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                >
                  {currentQuestionIndex < quizData.questions.length - 1 ? 'Next Question' : 'See Summary'} 
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-6 rounded-lg shadow-sm" style={{ backgroundColor: '#ffffff', color: '#213547' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#213547' }}>Your Results</h2>
            <p className="text-lg mb-6" style={{ color: '#213547' }}>You scored <span className="font-bold">{calculateScore()}</span> out of {quizData.questions.length} questions.</p>
            
            <div className="space-y-6">
              {quizData.questions.map((q, idx) => (
                <div key={idx} className="border-b pb-4 last:border-b-0" style={{ borderColor: '#e5e7eb' }}>
                  <div className="flex items-start gap-2 mb-2">
                    {predictions[idx] === q.correctAnswer ? (
                      <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: '#22c55e' }} />
                    ) : (
                      <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: '#ef4444' }} />
                    )}
                    <div>
                      <h3 className="font-medium" style={{ color: '#213547' }}>{q.question}</h3>
                      <p className="text-sm mt-1" style={{ color: '#213547' }}>
                        Your answer: <span className="font-medium" style={{ color: predictions[idx] === q.correctAnswer ? '#16a34a' : '#dc2626' }}>{predictions[idx] || "No answer"}</span>
                      </p>
                      <p className="text-sm mt-1" style={{ color: '#213547' }}>
                        Correct answer: <span className="font-medium" style={{ color: '#16a34a' }}>{q.correctAnswer}</span>
                      </p>
                      <p className="text-sm mt-2" style={{ color: '#374151' }}>{q.explanation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between">
            <Link 
              to="/"
              className="flex items-center px-4 py-2 rounded-md"
              style={{ backgroundColor: '#e5e7eb', color: '#374151' }}
            >
              <Home className="mr-2 h-4 w-4" /> All Quizzes
            </Link>
            <button
              onClick={handleReset}
              className="flex items-center px-4 py-2 rounded-md"
              style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quiz; 