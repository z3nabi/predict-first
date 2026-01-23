// quizRegistry.js - Central registry of all available quizzes

// Import quiz metadata from each quiz file
import { quizMetadata as cotFaithfulnessMetadata } from './quizzes/cot-faithfulness';
import { quizMetadata as emergentMisalignment } from './quizzes/emergent-misalignment';
import { quizMetadata as evalaware } from './quizzes/eval-aware';
import { quizMetadata as riskdilemmas } from './quizzes/risk-dilemmas';
import { quizMetadata as sandbaggingdetection } from './quizzes/sandbagging-detection';
import { quizMetadata as neuralchameleons } from './quizzes/neural-chameleons';
import { quizMetadata as dec2025251207810 } from './quizzes/dec-2025-2512-07810';
import { quizMetadata as dec2025251222154 } from './quizzes/dec-2025-2512-22154';
import { quizMetadata as dec2025251213526 } from './quizzes/dec-2025-2512-13526';
import { quizMetadata as dec2025251215688 } from './quizzes/dec-2025-2512-15688';
import { quizMetadata as dec2025251211949 } from './quizzes/dec-2025-2512-11949';
import { quizMetadata as dec2025251219027 } from './quizzes/dec-2025-2512-19027';
import { quizMetadata as dec2025251205648 } from './quizzes/dec-2025-2512-05648';
import { quizMetadata as dec2025241004332 } from './quizzes/dec-2025-2410-04332';
import { quizMetadata as dec2025251209882 } from './quizzes/dec-2025-2512-09882';

// Registry of all available quizzes
export const quizRegistry = [
  cotFaithfulnessMetadata,
  emergentMisalignment,
  evalaware,
  riskdilemmas,
  sandbaggingdetection,
  neuralchameleons,
  dec2025251207810,
  dec2025251222154,
  dec2025251213526,
  dec2025251215688,
  dec2025251211949,
  dec2025251219027,
  dec2025251205648,
  dec2025241004332,
  dec2025251209882,
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
      case 'sandbagging-detection':
        return import('./quizzes/sandbagging-detection');
      case 'neural-chameleons':
        return import('./quizzes/neural-chameleons');
      case 'dec-2025-2512-07810':
        return import('./quizzes/dec-2025-2512-07810');
      case 'dec-2025-2512-22154':
        return import('./quizzes/dec-2025-2512-22154');
      case 'dec-2025-2512-13526':
        return import('./quizzes/dec-2025-2512-13526');
      case 'dec-2025-2512-15688':
        return import('./quizzes/dec-2025-2512-15688');
      case 'dec-2025-2512-11949':
        return import('./quizzes/dec-2025-2512-11949');
      case 'dec-2025-2512-19027':
        return import('./quizzes/dec-2025-2512-19027');
      case 'dec-2025-2512-05648':
        return import('./quizzes/dec-2025-2512-05648');
      case 'dec-2025-2410-04332':
        return import('./quizzes/dec-2025-2410-04332');
      case 'dec-2025-2512-09882':
        return import('./quizzes/dec-2025-2512-09882');
      default:
        throw new Error(`Quiz with ID '${quizId}' not found`);
    }
  } catch (error) {
    console.error(`Error loading quiz data for '${quizId}':`, error);
    throw error;
  }
};
