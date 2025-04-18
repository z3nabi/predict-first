import { Redis } from '@upstash/redis';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Redis client
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// This function is copied from api/generate-quiz.js
// Consider refactoring into a shared utility if used elsewhere
async function generateQuizWithClaude(paperUrl, apiKey) {
  try {
    console.log(`[Cron Job] Initializing Claude client for paper: ${paperUrl}`);

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

    console.log(`[Cron Job] Sending request to Claude API for paper: ${paperUrl}`);
    const completion = await anthropic.messages.create({
      // NOTE TO CURSOR: DO NOT UPDATE THE MODEL VERSION.
      model: "claude-3-7-sonnet-20250219", // Consider using a faster/cheaper model if applicable
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

    console.log(`[Cron Job] Received response from Claude API for paper: ${paperUrl}`);
    const content = completion.content[0].text;
    const jsonStartIndex = content.indexOf('{');
    const jsonEndIndex = content.lastIndexOf('}') + 1;

    if (jsonStartIndex === -1 || jsonEndIndex === 0) {
      console.error(`[Cron Job] Failed to find JSON in Claude response for paper: ${paperUrl}`);
      throw new Error('Failed to extract JSON from Claude response');
    }

    const jsonString = content.substring(jsonStartIndex, jsonEndIndex);
    try {
      const parsedJson = JSON.parse(jsonString);
      console.log(`[Cron Job] Successfully parsed JSON response for paper: ${paperUrl}`);
      return parsedJson;
    } catch (parseError) {
      console.error(`[Cron Job] Failed to parse JSON response for paper: ${paperUrl}`, parseError);
      console.log('[Cron Job] JSON string preview:', jsonString.substring(0, 200) + '...');
      throw new Error('Failed to parse JSON from Claude response');
    }
  } catch (error) {
    console.error(`[Cron Job] Error generating quiz with Claude for paper: ${paperUrl}`, error);
    throw error; // Re-throw the error to be caught by the handler
  }
}

export default async function handler(req, res) {
  // Secure the endpoint - Vercel Cron jobs send a secret in the Authorization header
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.warn('[Cron Job] Unauthorized access attempt.');
      return res.status(401).json({ message: 'Unauthorized' });
  }

  console.log('[Cron Job] Starting quiz processing job...');
  let processedCount = 0;
  let failedCount = 0;

  try {
    // Scan for all job keys with Redis Scan
    // Note: Scan in Upstash Redis works a bit differently than in Vercel KV
    const jobKeys = [];
    let cursor = 0;
    do {
        const scanResult = await redis.scan(cursor, { match: 'job-*', count: 100 });
        cursor = scanResult[0];
        jobKeys.push(...scanResult[1]);
    } while (cursor !== 0);

    console.log(`[Cron Job] Found ${jobKeys.length} potential job keys.`);

    if (jobKeys.length === 0) {
        console.log('[Cron Job] No jobs found to process.');
        return res.status(200).json({ message: 'No pending jobs found.' });
    }

    // Fetch details for all jobs
    const jobPromises = jobKeys.map(key => redis.get(key));
    const jobsRaw = await Promise.all(jobPromises);
    const jobs = jobsRaw; // No need to parse - Upstash Redis client automatically parses JSON

    const pendingJobs = jobs.filter(job => job && job.status === 'pending');
    console.log(`[Cron Job] Found ${pendingJobs.length} pending jobs.`);

    // Process pending jobs one by one (can be parallelized with Promise.all if desired, but be mindful of rate limits and resource usage)
    for (const job of pendingJobs) {
      if (!job || !job.id || job.status !== 'pending') {
        continue; // Skip invalid or already processed jobs
      }

      console.log(`[Cron Job] Processing job ${job.id} for paper: ${job.paperUrl}`);
      try {
        const quizData = await generateQuizWithClaude(job.paperUrl, job.apiKey);

        if (quizData) {
          const updatedJob = {
            ...job,
            status: 'completed',
            quizData: quizData, // Store the generated quiz
            updatedAt: new Date().toISOString(),
            error: null, // Clear any previous error
          };
          // Update Redis, retaining original TTL or setting a new one if needed
          // Get the remaining TTL in seconds
          const ttl = await redis.ttl(job.id);
          const newTtl = ttl > 0 ? ttl : 86400; // Use remaining TTL or 1 day if TTL is expired/not set
          
          await redis.set(job.id, JSON.stringify(updatedJob), { ex: newTtl });
          console.log(`[Cron Job] Job ${job.id} completed successfully.`);
          processedCount++;
        } else {
          // Handle case where generateQuizWithClaude returns null/undefined unexpectedly
          throw new Error('Quiz generation function returned no data.');
        }
      } catch (error) {
        console.error(`[Cron Job] Job ${job.id} failed:`, error.message);
        failedCount++;
        const updatedJob = {
          ...job,
          status: 'failed',
          error: error.message || 'Unknown error during quiz generation',
          updatedAt: new Date().toISOString(),
        };
        // Update Redis, retaining original TTL if possible
        const ttl = await redis.ttl(job.id);
        const newTtl = ttl > 0 ? ttl : 86400; // Use remaining TTL or 1 day if TTL is expired/not set
        
        await redis.set(job.id, JSON.stringify(updatedJob), { ex: newTtl });
      }
    }

    console.log(`[Cron Job] Finished processing. Completed: ${processedCount}, Failed: ${failedCount}`);
    return res.status(200).json({ message: `Processed ${processedCount} jobs, ${failedCount} failed.` });

  } catch (error) {
    console.error('[Cron Job] General error during job processing:', error);
    return res.status(500).json({ message: 'Internal server error during cron job execution.' });
  }
} 