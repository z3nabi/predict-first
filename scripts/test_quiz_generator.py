#!/usr/bin/env python3
"""
Unit tests for the quiz generator script.
"""

import os
import unittest
import tempfile
import shutil
from pathlib import Path
from generate_quiz import update_quiz_registry

class TestQuizRegistry(unittest.TestCase):
    """Test the quiz registry update functionality."""
    
    def setUp(self):
        """Set up test environment with a temporary directory and sample registry file."""
        # Create a temporary directory
        self.temp_dir = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.temp_dir)
        
        # Create a mock registry file
        self.registry_file = Path(self.temp_dir) / "quizRegistry.js"
        
        # Sample content mimicking the real registry file
        sample_content = """// quizRegistry.js - Central registry of all available quizzes

// Import quiz metadata from each quiz file
import { quizMetadata as cotFaithfulnessMetadata } from './quizzes/cot-faithfulness';
import { quizMetadata as emergentMisalignment } from './quizzes/emergent-misalignment';

// Registry of all available quizzes
export const quizRegistry = [
  cotFaithfulnessMetadata,
  emergentMisalignment,
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
      default:
        throw new Error(`Quiz with ID '${quizId}' not found`);
    }
  } catch (error) {
    console.error(`Error loading quiz data for '${quizId}':`, error);
    throw error;
  }
};
"""
        with open(self.registry_file, "w") as f:
            f.write(sample_content)
    
    def test_add_new_quiz(self):
        """Test adding a completely new quiz to the registry."""
        # Call the function with a new quiz ID and explicit registry path
        quiz_id = "new-test-quiz"
        quiz_title = "New Test Quiz"
        
        result = update_quiz_registry(quiz_id, quiz_title, self.registry_file)
        
        # Check that the operation was successful
        self.assertTrue(result, "Registry update should return True on success")
        
        # Read the updated file
        with open(self.registry_file, "r") as f:
            updated_content = f.read()
        
        # Verify the import was added
        self.assertIn("import { quizMetadata as newtestquiz } from './quizzes/new-test-quiz';", updated_content)
        
        # Verify the quiz was added to the registry array
        self.assertIn("newtestquiz,", updated_content)
        
        # Verify the case was added to the switch statement
        self.assertIn("case 'new-test-quiz':", updated_content)
        self.assertIn("return import('./quizzes/new-test-quiz');", updated_content)
    
    def test_duplicate_quiz(self):
        """Test adding a quiz that already exists in the registry."""
        # Call the function with an existing quiz ID
        quiz_id = "cot-faithfulness"
        quiz_title = "CoT Faithfulness"
        
        result = update_quiz_registry(quiz_id, quiz_title, self.registry_file)
        
        # Check that the operation was successful (should still return True even for duplicates)
        self.assertTrue(result, "Registry update should return True even for duplicate entries")
        
        # Read the updated file
        with open(self.registry_file, "r") as f:
            updated_content = f.read()
        
        # Verify no duplicate import was added
        imports = [line for line in updated_content.split('\n') if "import" in line and "cotFaithfulnessMetadata" in line]
        self.assertEqual(len(imports), 1, "Should not duplicate import statements")
        
        # Verify no duplicate entry in registry array
        registry_entries = updated_content.count("cotFaithfulnessMetadata")
        self.assertEqual(registry_entries, 2, "Should not duplicate registry entries")  # 1 in import, 1 in array
        
        # Verify no duplicate case in switch statement
        case_entries = updated_content.count("case 'cot-faithfulness':")
        self.assertEqual(case_entries, 1, "Should not duplicate case statements")
    
    def test_handle_missing_sections(self):
        """Test handling of malformed registry files."""
        # Create an incomplete registry file
        incomplete_content = """// quizRegistry.js - Incomplete for testing
// Some content but missing the key sections
export const somethingElse = [];
"""
        with open(self.registry_file, "w") as f:
            f.write(incomplete_content)
        
        # Call the function and expect an exception to be handled
        quiz_id = "test-quiz"
        quiz_title = "Test Quiz"
        
        result = update_quiz_registry(quiz_id, quiz_title, self.registry_file)
        
        # Check that the operation failed but didn't crash
        self.assertFalse(result, "Registry update should return False on failure")
    
    def test_nonexistent_file(self):
        """Test behavior with a non-existent registry file."""
        # Use a path that doesn't exist
        nonexistent_path = Path(self.temp_dir) / "does_not_exist.js"
        
        quiz_id = "test-quiz"
        quiz_title = "Test Quiz"
        
        result = update_quiz_registry(quiz_id, quiz_title, nonexistent_path)
        
        # Check that the operation failed gracefully
        self.assertFalse(result, "Registry update should return False when file doesn't exist")

if __name__ == "__main__":
    unittest.main() 