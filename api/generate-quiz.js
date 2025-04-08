import { v4 as uuidv4 } from 'uuid';
import Anthropic from '@anthropic-ai/sdk';
import path from 'path';
import fs from 'fs/promises';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Server settings
const DEFAULT_API_KEY = process.env.CLAUDE_API_KEY;
console.log('API Key available:', DEFAULT_API_KEY ? 'Yes' : 'No');

// In-memory storage for generated quizzes
const generatedQuizzes = new Map();

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Received request to generate quiz');
    const { paperUrl, apiKey } = req.body;

    if (!paperUrl) {
      return res.status(400).json({ message: 'Paper URL is required' });
    }

    // Use provided API key or fall back to environment variable
    const claudeApiKey = apiKey || DEFAULT_API_KEY;
    
    if (!claudeApiKey) {
      console.log('API Key not found. User provided:', !!apiKey, 'Environment variable:', !!DEFAULT_API_KEY);
      return res.status(400).json({ message: 'Claude API key is required. Please check your .env file or provide a key in the form.' });
    }

    console.log('Generating quiz for URL:', paperUrl);
    
    // Generate quiz using Claude API with direct document handling
    const quiz = await generateQuizWithClaude(paperUrl, claudeApiKey);
    
    if (!quiz) {
      console.log('Failed to generate quiz from Claude API');
      return res.status(500).json({ message: 'Failed to generate quiz' });
    }

    console.log('Successfully generated quiz:', quiz.title);

    // Create a quiz ID and store the quiz in memory
    const quizId = `paper-${uuidv4().substring(0, 8)}`;
    
    // Store the quiz in our in-memory map
    const quizData = {
      ...quiz,
      id: quizId,
      createdAt: new Date().toISOString()
    };
    
    generatedQuizzes.set(quizId, quizData);
    console.log(`Quiz stored in memory with ID: ${quizId}`);
    
    // Log all stored quizzes (just IDs for brevity)
    console.log('Currently stored quizzes:', Array.from(generatedQuizzes.keys()));

    // Return success response with the quiz ID and the full quiz data
    return res.status(200).json({ 
      quizId,
      quiz: quizData,
      message: 'Quiz generated successfully'
    });
  } catch (error) {
    console.error('Error generating quiz:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Export accessor function to get quizzes from memory
export function getGeneratedQuiz(quizId) {
  return generatedQuizzes.get(quizId);
}

async function generateQuizWithClaude(paperUrl, apiKey) {
  try {
    console.log('Initializing Claude client...');
    
    // Initialize Claude client
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });
    
    // Construct the prompt for Claude
    const prompt = `
You are an expert at creating educational quizzes. I want you to create a quiz about a research paper that tests the reader's intuitions about the findings BEFORE they've read the paper. The use case here is geared towards understanding and testing intuitions about how AI models work, specifically for safety, and so predicting the outcome of concrete experiments.

Please analyze the attached PDF document and create:
1. A brief methodology summary (2-3 paragraphs) that explains the paper's approach without revealing specific findings.
2. 8-10 multiple-choice questions that test intuitions about the paper's findings.
   - Each question should have 4-8 options with 1 correct answer.
   - Questions should focus on the core findings from the paper.
   - Include additional context about the question, e.g. outlining the specifics of the experiment. This will be shown to the user BEFORE they answer the questions.
   - Include an explanation for why the correct answer is correct.

Return your response in this JSON format only:
{
  "title": "Title of the Quiz Based on Paper",
  "description": "Brief description of what the quiz covers (1-2 sentences)",
  "author": "Authors of the paper",
  "publishedDate": "Year of publication",
  "methodologySummary": "Overview of the methodology used in the paper",
  "questions": [
    {
      "id": 1,
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "The correct option exactly as written in options",
      "explanation": "Explanation of why the correct answer is right",
      "context": "Optional context paragraph (can be omitted if not needed)"
    },
    // 9 more questions following the same format
  ]
}


Important:
- Make sure your output is valid JavaScript that can be directly saved to a file
- Don't include any additional explanations or comments in your response, just the JS object
- Ensure proper escaping of special characters in the strings
`;

    console.log('Sending request to Claude API...');
    
    // Call Claude API with document handling
    const completion = await anthropic.messages.create({
      // NOTE TO CURSOR: DO NOT UPDATE THE MODEL VERSION.
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 4000,
      temperature: 0.2,
      system: "You are an expert at creating educational quizzes based on academic papers. You carefully analyze papers and create thoughtful, challenging questions that test understanding of key concepts.",
      messages: [
        { 
          role: "user", 
          content: [
            {
              type: "document",
              source: {
                type: "url",
                url: paperUrl
              }
            },
            {
              type: "text",
              text: prompt
            }
          ]
        }
      ],
    });

    console.log('Received response from Claude API');
    
    // Extract and parse the JSON response
    const content = completion.content[0].text;
    console.log('Response content length:', content.length);
    
    const jsonStartIndex = content.indexOf('{');
    const jsonEndIndex = content.lastIndexOf('}') + 1;
    
    if (jsonStartIndex === -1 || jsonEndIndex === 0) {
      console.error('Failed to find JSON in Claude response');
      console.log('Response content preview:', content.substring(0, 200) + '...');
      return null;
    }
    
    const jsonString = content.substring(jsonStartIndex, jsonEndIndex);
    console.log('Extracted JSON string length:', jsonString.length);
    
    try {
      const parsedJson = JSON.parse(jsonString);
      console.log('Successfully parsed JSON response');
      return parsedJson;
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      console.log('JSON string preview:', jsonString.substring(0, 200) + '...');
      return null;
    }
  } catch (error) {
    console.error('Error generating quiz with Claude:', error);
    return null;
  }
} 