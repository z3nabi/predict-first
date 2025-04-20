import { Receiver } from "@upstash/qstash";
import { Redis } from "@upstash/redis";
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Redis client
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// Initialize QStash Receiver for signature verification
const qstashReceiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
});

// --- Quiz Generation Logic (Copied/Adapted from generate-quiz.js) ---
// Ideally, refactor this into a shared utility file
async function generateQuizWithClaude(paperUrl, apiKey) {
  try {
    console.log(`[QStash Worker] Initializing Claude client for paper: ${paperUrl}`);
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
    console.log(`[QStash Worker] Sending request to Claude API for paper: ${paperUrl}`);
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
    console.log(`[QStash Worker] Received response from Claude API for paper: ${paperUrl}`);
    const content = completion.content[0].text;
    const jsonStartIndex = content.indexOf('{');
    const jsonEndIndex = content.lastIndexOf('}') + 1;
    if (jsonStartIndex === -1 || jsonEndIndex === 0) {
      console.error(`[QStash Worker] Failed to find JSON in Claude response for paper: ${paperUrl}`);
      throw new Error('Failed to extract JSON from Claude response');
    }
    const jsonString = content.substring(jsonStartIndex, jsonEndIndex);
    try {
      const parsedJson = JSON.parse(jsonString);
      console.log(`[QStash Worker] Successfully parsed JSON response for paper: ${paperUrl}`);
      return parsedJson;
    } catch (parseError) {
      console.error(`[QStash Worker] Failed to parse JSON response for paper: ${paperUrl}`, parseError);
      console.log('[QStash Worker] JSON string preview:', jsonString.substring(0, 200) + '...');
      throw new Error('Failed to parse JSON from Claude response');
    }
  } catch (error) {
    console.error(`[QStash Worker] Error generating quiz with Claude for paper: ${paperUrl}`, error);
    throw error; // Re-throw to be caught by the main handler
  }
}
// --- End Quiz Generation Logic ---

// Handler function for the Vercel Serverless Function
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  let jobId = "unknown"; // Initialize jobId for logging
  let isValid = false;
  let jobPayload = {};

  try {
    // Verify the signature
    const signature = req.headers["upstash-signature"];
    if (!signature) {
      console.warn('[QStash Webhook] Missing upstash-signature header');
      return res.status(401).json({ message: 'Missing signature' });
    }
    
    // Read the raw body for verification
    const rawBody = await getRawBody(req);
    
    isValid = await qstashReceiver.verify({ signature, body: rawBody });
    
    if (!isValid) {
      console.warn('[QStash Webhook] Invalid signature');
      return res.status(401).json({ message: 'Invalid signature' });
    }
    
    console.log('[QStash Webhook] Signature verified successfully.');
    
    // Parse the verified body
    jobPayload = JSON.parse(rawBody);
    jobId = jobPayload.jobId; // Update jobId for logging

    if (!jobId || !jobPayload.paperUrl || !jobPayload.apiKey) {
      console.error(`[QStash Webhook] Invalid payload received for job ${jobId}:`, jobPayload);
      return res.status(400).json({ message: 'Invalid payload' });
    }

    console.log(`[QStash Webhook] Processing job ${jobId} for paper: ${jobPayload.paperUrl}`);

    // Fetch the current job data from Redis to avoid race conditions (optional but good practice)
    const currentJobData = await redis.get(jobId);
    if (!currentJobData) {
        console.warn(`[QStash Webhook] Job ${jobId} not found in Redis. Maybe expired or deleted?`);
        // Still proceed? Or return error? Depends on desired behavior. Let's proceed for now.
    }
    if (currentJobData && currentJobData.status !== 'pending') {
        console.log(`[QStash Webhook] Job ${jobId} already processed or failed. Status: ${currentJobData.status}. Skipping.`);
        return res.status(200).json({ message: 'Job already processed' });
    }

    // Call the actual quiz generation function
    const quizData = await generateQuizWithClaude(jobPayload.paperUrl, jobPayload.apiKey);

    if (quizData) {
      // Update job status to completed in Redis
      const updatedJob = {
        ...(currentJobData || { id: jobId, paperUrl: jobPayload.paperUrl }), // Use existing or reconstruct
        status: 'completed',
        quizData: quizData,
        updatedAt: new Date().toISOString(),
        error: null,
      };
      const ttl = await redis.ttl(jobId);
      const newTtl = ttl > 0 ? ttl : 86400;
      await redis.set(jobId, JSON.stringify(updatedJob), { ex: newTtl });
      console.log(`[QStash Webhook] Job ${jobId} completed successfully.`);
      return res.status(200).json({ message: `Job ${jobId} processed successfully` });
    } else {
      // Handle case where generation returns no data
      throw new Error('Quiz generation function returned no data.');
    }

  } catch (error) {
    console.error(`[QStash Webhook] Error processing job ${jobId}:`, error);

    // Update job status to failed in Redis
    try {
      const currentJobData = await redis.get(jobId);
      const updatedJob = {
         ...(currentJobData || { id: jobId, paperUrl: jobPayload?.paperUrl }), // Use existing or reconstruct if possible
        status: 'failed',
        error: error.message || 'Unknown error during quiz generation',
        updatedAt: new Date().toISOString(),
      };
      const ttl = await redis.ttl(jobId);
      const newTtl = ttl > 0 ? ttl : 86400;
      await redis.set(jobId, JSON.stringify(updatedJob), { ex: newTtl });
    } catch (redisError) {
      console.error(`[QStash Webhook] CRITICAL: Failed to update job ${jobId} status to FAILED in Redis:`, redisError);
    }

    // Return error response
    // QStash will retry based on its configuration if it receives a 5xx error
    return res.status(500).json({ message: `Failed to process job ${jobId}` });
  }
}

// Helper to read raw body (needed for QStash verification)
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
} 