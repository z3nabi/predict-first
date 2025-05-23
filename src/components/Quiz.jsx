import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { AlertCircle, CheckCircle2, ArrowRight, RotateCcw, ChevronDown, ChevronUp, Info, Home } from 'lucide-react';
import { loadQuizData, getQuizById } from '../data/quizRegistry';

const Quiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // Get location object

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [predictions, setPredictions] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);
  const [expandedContexts, setExpandedContexts] = useState({});
  const [questionStatus, setQuestionStatus] = useState({});
  const [isLoading, setIsLoading] = useState(true); // Start loading initially
  const [quizData, setQuizData] = useState({ questions: [], methodologySummary: '' });
  const [quizInfo, setQuizInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setError(null);
        setIsLoading(true);

        // 1. Check if quiz data was passed via navigation state (for streamed quizzes)
        if (location.state?.quizData) {
          console.log('Received quiz data via navigation state:', location.state.quizData);
          const generatedQuiz = location.state.quizData;
          setQuizInfo({
            id: quizId, // Use the ID from the URL param (e.g., paper-xyz)
            title: generatedQuiz.title,
            description: generatedQuiz.description,
            author: generatedQuiz.author,
            publishedDate: generatedQuiz.publishedDate
          });
          setQuizData({
            questions: generatedQuiz.questions,
            methodologySummary: generatedQuiz.methodologySummary
          });
          setIsLoading(false);
          return; // Data loaded from state, no need to fetch
        }

        // 2. If no state data, check if it's an old generated quiz ID (paper-)
        //    or a job ID (job-) - These are now deprecated/won't be fetched
        if (quizId.startsWith('paper-') || quizId.startsWith('job-')) {
           console.warn(`Attempted to load quiz ${quizId} by ID - generated quizzes should now be passed via state.`);
           setError(`Generated quiz data not found. Please generate the quiz again.`);
           setIsLoading(false);
           return;
        }
        
        // 3. If not generated/streamed, assume it's a predefined quiz from registry
        const quizMeta = getQuizById(quizId);
        if (!quizMeta) {
          setError(`Quiz with ID '${quizId}' not found in registry.`);
          setIsLoading(false);
          return;
        }
        
        setQuizInfo(quizMeta);
        
        // Load predefined quiz data
        console.log(`Loading predefined quiz: ${quizId}`);
        const data = await loadQuizData(quizId);
        setQuizData({
          questions: data.questions,
          methodologySummary: data.methodologySummary
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error processing quiz data:", error);
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
  }, [quizId, location.state]); // Add location.state as dependency
  
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
      <div className="flex justify-between items-center">
        <Link to="/" className="text-blue-600 hover:text-blue-800 flex items-center">
          <Home className="h-4 w-4 mr-1" /> Back to Quizzes
        </Link>
        <h1 className="text-2xl font-bold text-center text-gray-800">{quizInfo?.title}</h1>
        <div className="w-6"></div> {/* Empty div for flex layout balance */}
      </div>
      
      <p className="text-center text-gray-600">{quizInfo?.description}</p>
      
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div 
          className="flex justify-between items-center cursor-pointer" 
          onClick={() => setShowMethodology(!showMethodology)}
        >
          <h2 className="text-lg font-medium text-blue-800">Study Methodology Overview</h2>
          {showMethodology ? <ChevronUp className="h-5 w-5 text-blue-600" /> : <ChevronDown className="h-5 w-5 text-blue-600" />}
        </div>
        
        {showMethodology && (
          <div className="mt-3 text-blue-800 whitespace-pre-line">
            {quizData.methodologySummary}
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
              {currentQuestion.options.map((option, index) => (
                <div 
                  key={index}
                  onClick={() => handleOptionSelect(option)}
                  className={`quiz-option ${
                    predictions[currentQuestionIndex] === option 
                      ? 'selected' 
                      : 'default'
                  } ${
                    questionStatus[currentQuestionIndex] && option === currentQuestion.correctAnswer 
                      ? 'correct' 
                      : ''
                  } ${
                    questionStatus[currentQuestionIndex] && 
                    predictions[currentQuestionIndex] === option && 
                    option !== currentQuestion.correctAnswer 
                      ? 'incorrect' 
                      : ''
                  }`}
                >
                  {option}
                </div>
              ))}
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
            {currentQuestionIndex > 0 && (
              <button
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                className="px-4 py-2 rounded-md" 
                style={{ backgroundColor: '#e5e7eb', color: '#374151' }}
              >
                Previous
              </button>
            )}
            
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