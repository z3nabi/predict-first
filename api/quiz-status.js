import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Redis client - using read-only token for better security 
// since this endpoint only needs to read data
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_READ_ONLY_TOKEN || process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { jobId } = req.query;

  if (!jobId) {
    return res.status(400).json({ message: 'Job ID is required' });
  }

  try {
    console.log(`Checking status for job: ${jobId}`);

    // Retrieve job data from Redis
    const jobData = await redis.get(jobId);

    if (!jobData) {
      console.log(`Job ${jobId} not found in Redis.`);
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // No need to parse - Upstash Redis client automatically parses JSON
    console.log(`Job ${jobId} status: ${jobData.status}`);

    // Return the current status and data
    if (jobData.status === 'completed') {
      return res.status(200).json({
        jobId: jobData.id,
        status: jobData.status,
        quizData: jobData.quizData, // Include the quiz data
        createdAt: jobData.createdAt,
        updatedAt: jobData.updatedAt,
      });
    } else if (jobData.status === 'failed') {
      return res.status(200).json({ // Return 200, but indicate failure in status
        jobId: jobData.id,
        status: jobData.status,
        error: jobData.error, // Include the error message
        createdAt: jobData.createdAt,
        updatedAt: jobData.updatedAt,
      });
    } else {
      // Status is likely 'pending' or some other intermediate state
      return res.status(200).json({ 
        jobId: jobData.id,
        status: jobData.status,
        createdAt: jobData.createdAt,
        updatedAt: jobData.updatedAt,
      });
    }

  } catch (error) {
    console.error(`Error checking status for job ${jobId}:`, error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 