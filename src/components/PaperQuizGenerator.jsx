import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, AlertCircle, Loader } from 'lucide-react';

// Shared button component for consistency
const PrimaryButton = ({ type, disabled, onClick, children, className = '', isLoading = false }) => {
  const baseClasses = "inline-block px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 font-medium transition-colors duration-200 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed";
  
  return (
    <button 
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseClasses} ${className}`}
    >
      {children}
    </button>
  );
};

const PaperQuizGenerator = () => {
  const [paperUrl, setPaperUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Generating Quiz...');
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!paperUrl.trim()) {
      setError('Please enter a URL to a PDF paper');
      return;
    }
    
    if (!apiKey.trim() && showApiKeyInput) {
      setError('Please enter your Claude API key');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setLoadingMessage('Requesting quiz generation...');
    
    try {
      console.log('Sending request to generate quiz stream for URL:', paperUrl);
      
      // Make API call to backend to start streaming
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paperUrl,
          apiKey: showApiKeyInput ? apiKey : undefined
        }),
      });
      
      if (!response.ok) {
         // Attempt to read error message from non-streaming response
         const errorData = await response.json().catch(() => ({ message: 'Failed to start generation stream.' }));
         throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Check if response body exists and is readable
      if (!response.body) {
        throw new Error('Response body is missing or not readable.');
      }

      setLoadingMessage('Receiving quiz data from Claude...');
      
      // Process the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedJson = '';
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        accumulatedJson += decoder.decode(value, { stream: true });
      }
      
      // Ensure final chunk is decoded
      accumulatedJson += decoder.decode(); 
      
      console.log('Stream finished. Received JSON string length:', accumulatedJson.length);
      
      // Parse the accumulated JSON
      let quizData;
      try {
        quizData = JSON.parse(accumulatedJson);
        console.log('Successfully parsed quiz JSON');
      } catch (parseError) {
        console.error('Failed to parse JSON from stream:', parseError);
        console.error('Received text:', accumulatedJson); // Log the problematic text
        throw new Error('Received invalid data from the generation service.');
      }
      
      if (!quizData || !quizData.questions || !quizData.title) {
        console.error('Parsed JSON is missing expected fields:', quizData);
        throw new Error('Generated quiz data is incomplete.');
      }

      // Generate a temporary ID for the quiz route
      const tempQuizId = `paper-${Date.now().toString(36)}`;
      
      // Navigate to the Quiz component, passing the data via state
      navigate(`/quiz/${tempQuizId}`, { state: { quizData } });
      
    } catch (err) {
      console.error('Error during quiz generation stream:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('Generating Quiz...'); // Reset loading message
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-md transition-colors">
      <div className="flex justify-between items-center mb-6">
        <Link to="/" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center">
          <Home className="h-4 w-4 mr-1" /> Back to Quizzes
        </Link>
        <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100">Generate Paper Quiz</h1>
        <div className="w-6"></div> {/* Empty div for flex layout balance */}
      </div>
      
      <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
        Enter the URL to a research paper PDF and we'll generate a quiz to test your understanding of the paper.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="paperUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Paper URL (PDF)
          </label>
          <input
            type="url"
            id="paperUrl"
            value={paperUrl}
            onChange={(e) => setPaperUrl(e.target.value)}
            placeholder="https://example.com/paper.pdf"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            disabled={isLoading}
            required
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Tip: Use direct links to PDFs from sources like arXiv (e.g., https://arxiv.org/pdf/1234.56789.pdf)
          </p>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="useOwnApiKey"
            checked={showApiKeyInput}
            onChange={() => setShowApiKeyInput(!showApiKeyInput)}
            className="h-4 w-4 text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 rounded bg-white dark:bg-gray-700"
            disabled={isLoading}
          />
          <label htmlFor="useOwnApiKey" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Use my own Claude API key
          </label>
        </div>

        {showApiKeyInput && (
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Claude API Key
            </label>
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Claude API key"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Your API key is only used for this request and is not stored.
            </p>
          </div>
        )}
        
        <PrimaryButton
          type="submit"
          disabled={isLoading}
          className="w-full p-3 flex justify-center items-center"
          isLoading={isLoading}
        >
          {isLoading ? (
            <>
              <Loader className="animate-spin h-5 w-5 mr-2" />
              {loadingMessage}
            </>
          ) : (
            'Generate Quiz'
          )}
        </PrimaryButton>

        {isLoading && (
          <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
            <p>Please wait, this can take a minute or more depending on the paper size and Claude's response time...</p>
          </div>
        )}
      </form>
    </div>
  );
};

export default PaperQuizGenerator; 