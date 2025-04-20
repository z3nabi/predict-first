import { v4 as uuidv4 } from 'uuid';
import Anthropic from '@anthropic-ai/sdk';
import path from 'path';
import fs from 'fs/promises';
import dotenv from 'dotenv';
import { Redis } from '@upstash/redis';
import { Client } from "@upstash/qstash"; // Import QStash client

// Load environment variables
dotenv.config();

// Initialize Redis client
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// Initialize QStash client
const qstashClient = new Client({
  token: process.env.QSTASH_TOKEN,
});

// Server settings
const DEFAULT_API_KEY = process.env.CLAUDE_API_KEY;
console.log('API Key available:', DEFAULT_API_KEY ? 'Yes' : 'No');

// Remove in-memory storage
// const generatedQuizzes = new Map();

// Keep the Claude generation logic, it will be moved/used by the webhook handler
// Consider refactoring this into a shared lib/utils file
async function generateQuizWithClaude(paperUrl, apiKey) {
  try {
    console.log('Initializing Claude client...');
    const anthropic = new Anthropic({ apiKey });
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
    }
    // ... more questions
  ]
}

Important:
- Make sure your output is valid JSON.
- Don't include any additional explanations or comments in your response, just the JSON object.
- Ensure proper escaping of special characters in the strings.
`;
    console.log('Sending request to Claude API...');
    const completion = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 4000,
      temperature: 0.2,
      system: "You are an expert at creating educational quizzes based on academic papers.",
      messages: [
        {
          role: "user",
          content: [
            { type: "document", source: { type: "url", url: paperUrl } },
            { type: "text", text: prompt }
          ]
        }
      ],
    });
    console.log('Received response from Claude API');
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

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Received request to generate quiz job');
    // Remove debug flag logic
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

    // Generate a unique job ID
    const jobId = `job-${uuidv4()}`;
    console.log(`Generated Job ID: ${jobId}`);

    // Store initial job details in Redis
    const jobData = {
      id: jobId,
      paperUrl,
      apiKey: claudeApiKey, // Store the API key (consider security)
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Set expiration for the job data (e.g., 1 day)
    await redis.set(jobId, JSON.stringify(jobData), { ex: 86400 });
    console.log(`Job ${jobId} stored in Redis.`);

    // --- Publish job to QStash --- 
    // Determine the target URL for the webhook
    // Use VERCEL_URL in production/preview, or a tunnelled URL like ngrok for local dev
    const webhookUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}/api/webhooks/process-quiz`
      : process.env.QSTASH_WEBHOOK_URL; // Fallback for local dev (set this in .env)

    if (!webhookUrl) {
        console.error('Webhook URL not configured. Set VERCEL_URL (deployment) or QSTASH_WEBHOOK_URL (local dev).');
        // Don't throw error here, just log, as job is already in Redis for potential manual processing
    } else {
        console.log(`Publishing job ${jobId} to QStash, target: ${webhookUrl}`);
        try {
            await qstashClient.publishJSON({
                url: webhookUrl,
                // Send necessary job details in the body
                body: {
                    jobId: jobId,
                    paperUrl: paperUrl,
                    apiKey: claudeApiKey
                },
                // Optional: Add delay or retries if needed
                // delay: "5s",
                // retries: 3,
            });
            console.log(`Job ${jobId} successfully published to QStash.`);
        } catch (qstashError) {
            console.error(`Error publishing job ${jobId} to QStash:`, qstashError);
            // Handle error - maybe log or set a specific job status in Redis
        }
    }
    // --- End QStash publish ---

    // Remove the immediate processing logic
    // if (debug === true) { ... }

    // Return 202 Accepted with the Job ID
    return res.status(202).json({
      jobId,
      message: 'Quiz generation job accepted and queued.',
    });

  } catch (error) {
    console.error('Error creating quiz job:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Remove the synchronous quiz generation and in-memory storage logic
// async function generateQuizWithClaude(paperUrl, apiKey) { ... }
// export function getGeneratedQuiz(quizId) { ... }

// Keep the Claude generation logic, but it will be moved/used by the cron job
// async function generateQuizWithClaude(paperUrl, apiKey) { ... }
// export function getGeneratedQuiz(quizId) { ... } 