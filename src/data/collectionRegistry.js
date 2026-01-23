// collectionRegistry.js - Central registry of all available quiz collections

// Import collection metadata from each collection file
import { collectionMetadata as dec2025 } from './collections/dec-2025';
// (imports will be added here as collections are created)

// Registry of all available collections
export const collectionRegistry = [
  dec2025,
];

// Utility function to get collection by ID
export const getCollectionById = (id) => {
  const collection = collectionRegistry.find(collection => collection.id === id);
  return collection || null;
};

// Function to dynamically import collection data
export const loadCollectionData = async (collectionId) => {
  try {
    switch (collectionId) {
      // Cases will be added here as collections are created
      case 'dec-2025':
        return import('./collections/dec-2025');
      default:
        throw new Error(`Collection with ID '${collectionId}' not found`);
    }
  } catch (error) {
    console.error(`Error loading collection data for '${collectionId}':`, error);
    throw error;
  }
};
