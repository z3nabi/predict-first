import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getCollectionById } from '../data/collectionRegistry';
import { getQuizById } from '../data/quizRegistry';

const CollectionView = () => {
  const { collectionId } = useParams();
  const navigate = useNavigate();
  const [collection, setCollection] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCollection = async () => {
      try {
        const collectionData = getCollectionById(collectionId);

        if (!collectionData) {
          setError(`Collection '${collectionId}' not found`);
          setLoading(false);
          return;
        }

        setCollection(collectionData);

        // Load quiz metadata for each quiz in the collection
        const quizData = collectionData.quizIds
          .map(quizId => getQuizById(quizId))
          .filter(quiz => quiz !== null);

        setQuizzes(quizData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadCollection();
  }, [collectionId]);

  const handleShareCollection = () => {
    const shareUrl = `${window.location.origin}/collection/${collectionId}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Collection link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-gray-50 rounded-lg shadow-md">
        <p className="text-center text-gray-600">Loading collection...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-gray-50 rounded-lg shadow-md">
        <p className="text-center text-red-600 mb-4">{error}</p>
        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-gray-50 rounded-lg shadow-md">
      <div className="mb-6">
        <Link
          to="/"
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          &larr; Back to all quizzes
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
        {collection.title}
      </h1>

      {collection.description && (
        <p className="text-center text-gray-600 mb-4">
          {collection.description}
        </p>
      )}

      {collection.sourceUrl && (
        <p className="text-center text-sm text-gray-500 mb-4">
          Source:{' '}
          <a
            href={collection.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            View original post
          </a>
        </p>
      )}

      <div className="text-center mb-6">
        <button
          onClick={handleShareCollection}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200"
        >
          Share Collection
        </button>
      </div>

      {quizzes.length === 0 ? (
        <p className="text-center text-gray-600">
          No quizzes found in this collection.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <h2 className="text-xl font-bold mb-2 text-blue-700">{quiz.title}</h2>
              <p className="text-gray-600 mb-4">{quiz.description}</p>
              <div className="mt-4 flex flex-col sm:flex-row gap-2 items-center justify-center">
                <Link
                  to={`/quiz/${quiz.id}`}
                  state={{ fromCollection: collectionId, collectionTitle: collection.title }}
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
      )}
    </div>
  );
};

export default CollectionView;
