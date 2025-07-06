// quizRegistry.js - Central registry of all available quizzes

// Import quiz metadata from each quiz file
import { quizMetadata as cotFaithfulnessMetadata } from './quizzes/cot-faithfulness';
import { quizMetadata as emergentMisalignment } from './quizzes/emergent-misalignment';
import { quizMetadata as evalaware } from './quizzes/eval-aware';
import { quizMetadata as riskdilemmas } from './quizzes/risk-dilemmas';

// Registry of all available quizzes
export const quizRegistry = [
  cotFaithfulnessMetadata,
  emergentMisalignment,
  evalaware,
  riskdilemmas,
];

// Utility function to get quiz by ID
export const getQuizById = (id) => {
  const quiz = quizRegistry.find(quiz => quiz.id === id);
  return quiz || null;
};

// Function to dynamically import quiz data
export const loadQuizData = async (quizId) => {
  try {
    switch (quizId) {
      case 'cot-faithfulness':
        return import('./quizzes/cot-faithfulness');
      case 'emergent-misalignment':
        return import('./quizzes/emergent-misalignment');
            case 'eval-aware':
        return import('./quizzes/eval-aware');
      case 'risk-dilemmas':
        return import('./quizzes/risk-dilemmas');
default:
        throw new Error(`Quiz with ID '${quizId}' not found`);
    }
  } catch (error) {
    console.error(`Error loading quiz data for '${quizId}':`, error);
    throw error;
  }
}; 