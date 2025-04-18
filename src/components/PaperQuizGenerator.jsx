import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, AlertCircle, Loader, CheckCircle } from 'lucide-react';

const PaperQuizGenerator = () => {
  const [paperUrl, setPaperUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  
  const navigate = useNavigate();

  // Poll for job status if we have a jobId
  useEffect(() => {
    let intervalId;
    
    if (jobId) {
      // Start with a fast polling interval (2 seconds)
      let pollingInterval = 2000;
      let pollCount = 0;
      
      intervalId = setInterval(async () => {
        try {
          pollCount++;
          
          // After 5 polls, slow down to avoid hammering the server
          if (pollCount === 5) {
            clearInterval(intervalId);
            pollingInterval = 5000; // Slow down to 5 seconds
            intervalId = setInterval(checkJobStatus, pollingInterval);
          }
          
          await checkJobStatus();
        } catch (err) {
          console.error('Error checking job status:', err);
        }
      }, pollingInterval);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [jobId]);
  
  const checkJobStatus = async () => {
    try {
      const response = await fetch(`/api/quiz-status?jobId=${jobId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to check job status');
      }
      
      setJobStatus(data.status);
      
      // Update progress percentage for visual feedback
      if (data.status === 'pending') {
        // Increment progress slowly up to 90% while pending
        setProgress(prev => Math.min(prev + 5, 90));
      } else if (data.status === 'completed') {
        setProgress(100);
        // Wait a moment to show 100% completion before navigating
        setTimeout(() => {
          // The job is complete and we have a quiz - navigate to it
          // Previous API returned quizId, now it's jobId that holds the quiz
          navigate(`/quiz/${jobId}`);
        }, 500);
      } else if (data.status === 'failed') {
        // Job failed - show error
        setError(data.error || 'Failed to generate quiz');
        setIsLoading(false);
        setJobId(null);
      }
    } catch (err) {
      console.error('Error polling job status:', err);
      setError('Lost connection while checking job status');
      setIsLoading(false);
    }
  };

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
    
    try {
      setIsLoading(true);
      setError(null);
      setProgress(10); // Start progress at 10%
      
      console.log('Sending request to generate quiz for URL:', paperUrl);
      
      // Make API call to backend to create quiz generation job
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paperUrl,
          apiKey: showApiKeyInput ? apiKey : undefined,
          debug: true // Add debug flag for local development testing
        }),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to generate quiz');
      }
      
      console.log('Quiz generation job created:', responseData);
      
      // Store the jobId for polling
      setJobId(responseData.jobId);
      setProgress(20); // Bump progress after job creation
      
      // Note: we no longer navigate here, but wait for job completion
    } catch (err) {
      console.error('Error generating quiz:', err);
      setError(err.message || 'An error occurred while generating the quiz');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-gray-50 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <Link to="/" className="text-blue-600 hover:text-blue-800 flex items-center">
          <Home className="h-4 w-4 mr-1" /> Back to Quizzes
        </Link>
        <h1 className="text-2xl font-bold text-center text-gray-800">Generate Paper Quiz</h1>
        <div className="w-6"></div> {/* Empty div for flex layout balance */}
      </div>
      
      <p className="text-center text-gray-600 mb-6">
        Enter the URL to a research paper PDF and we'll generate a quiz to test your understanding of the paper.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {jobId && jobStatus === 'pending' && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Generating quiz...</span>
            <span className="text-sm font-medium text-gray-700">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            This typically takes 30-60 seconds. Claude is analyzing the paper and creating questions.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="paperUrl" className="block text-sm font-medium text-gray-700 mb-1">
            Paper URL (PDF)
          </label>
          <input
            type="url"
            id="paperUrl"
            value={paperUrl}
            onChange={(e) => setPaperUrl(e.target.value)}
            placeholder="https://example.com/paper.pdf"
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Tip: Use direct links to PDFs from sources like arXiv (e.g., https://arxiv.org/pdf/1234.56789.pdf)
          </p>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="useOwnApiKey"
            checked={showApiKeyInput}
            onChange={() => setShowApiKeyInput(!showApiKeyInput)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
            disabled={isLoading}
          />
          <label htmlFor="useOwnApiKey" className="ml-2 block text-sm text-gray-700">
            Use my own Claude API key
          </label>
        </div>

        {showApiKeyInput && (
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
              Claude API Key
            </label>
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Claude API key"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-gray-500">
              Your API key is only used for this request and is not stored.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || jobId}
          className="w-full p-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex justify-center items-center"
        >
          {isLoading ? (
            <>
              <Loader className="animate-spin h-5 w-5 mr-2" />
              Generating Quiz...
            </>
          ) : (
            'Generate Quiz'
          )}
        </button>
      </form>
    </div>
  );
};

export default PaperQuizGenerator; 