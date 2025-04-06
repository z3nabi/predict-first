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
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-500">Question {currentQuestionIndex + 1} of {quizData.questions.length}</span>
              <span className="text-sm font-medium text-blue-600">{Object.keys(questionStatus).length} answered</span>
            </div>
            
            <h2 className="text-lg font-medium mb-2">{currentQuestion.question}</h2>
            
            {currentQuestion.context && (
              <div className="mb-4">
                <div 
                  className="flex items-center text-sm text-gray-600 cursor-pointer hover:text-gray-800"
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
                  <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700">
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
              <div className={`mt-4 p-4 rounded-md ${predictions[currentQuestionIndex] === currentQuestion.correctAnswer ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-start gap-2">
                  {predictions[currentQuestionIndex] === currentQuestion.correctAnswer ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-medium mb-1">
                      {predictions[currentQuestionIndex] === currentQuestion.correctAnswer 
                        ? "Correct!" 
                        : `Incorrect. The correct answer is: ${currentQuestion.correctAnswer}`}
                    </p>
                    <p className="text-sm">{currentQuestion.explanation}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-between">
            {currentQuestionIndex > 0 && (
              <button
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Previous
              </button>
            )}
            
            {!questionStatus[currentQuestionIndex] ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={!predictions[currentQuestionIndex]}
                className={`px-4 py-2 rounded-md ${
                  !predictions[currentQuestionIndex] 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center"
              >
                {currentQuestionIndex < quizData.questions.length - 1 ? 'Next Question' : 'See Summary'} 
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-4">Your Results</h2>
            <p className="text-lg mb-6">You scored <span className="font-bold">{calculateScore()}</span> out of {quizData.questions.length} questions.</p>
            
            <div className="space-y-6">
              {quizData.questions.map((q, idx) => (
                <div key={idx} className="border-b pb-4 last:border-b-0">
                  <div className="flex items-start gap-2 mb-2">
                    {predictions[idx] === q.correctAnswer ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <h3 className="font-medium">{q.question}</h3>
                      <p className="text-sm mt-1">
                        Your answer: <span className={`font-medium ${predictions[idx] === q.correctAnswer ? 'text-green-600' : 'text-red-600'}`}>{predictions[idx] || "No answer"}</span>
                      </p>
                      <p className="text-sm mt-1">
                        Correct answer: <span className="font-medium text-green-600">{q.correctAnswer}</span>
                      </p>
                      <p className="text-sm mt-2 text-gray-700">{q.explanation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between">
            <Link 
              to="/"
              className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              <Home className="mr-2 h-4 w-4" /> All Quizzes
            </Link>
            <button
              onClick={handleReset}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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