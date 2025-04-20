import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Server settings
const DEFAULT_API_KEY = process.env.CLAUDE_API_KEY;
console.log('API Key available:', DEFAULT_API_KEY ? 'Yes' : 'No');

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    console.log('Received request to generate quiz stream');
    const { paperUrl, apiKey } = req.body;

    if (!paperUrl) {
      return res.status(400).json({ message: 'Paper URL is required' });
    }

    // Use provided API key or fall back to environment variable
    const claudeApiKey = apiKey || DEFAULT_API_KEY;

    if (!claudeApiKey) {
      console.log('API Key not found. User provided:', !!apiKey, 'Environment variable:', !!DEFAULT_API_KEY);
      return res.status(400).json({ message: 'Claude API key is required. Please provide a key or set CLAUDE_API_KEY.' });
    }

    const anthropic = new Anthropic({ apiKey: claudeApiKey });

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

    console.log('Starting stream request to Claude API...');
    const stream = await anthropic.messages.stream({
      // NOTE TO CURSOR: DO NOT UPDATE THE MODEL VERSION.
      model: "claude-3-7-sonnet-20250219", // Using Sonnet for potential speed
      max_tokens: 4000,
      temperature: 0.2,
      system: "You are an expert at creating educational quizzes based on academic papers. Respond only with the requested JSON object.",
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
    
    // Set headers for streaming response
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'X-Content-Type-Options': 'nosniff',
    });

    // Stream chunks directly to the client
    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        res.write(event.delta.text);
      }
      // Optionally handle other event types (e.g., message_delta)
    }

    // Close the response when the stream ends
    res.end();
    console.log('Stream finished.');

  } catch (error) {
    console.error('Error generating quiz stream:', error);
    // If the stream hasn't started, send a JSON error
    if (!res.headersSent) {
        res.status(500).json({ message: 'Internal server error: ' + error.message });
    } else {
        // If headers are sent, try to end the stream abruptly or just log
        res.end(); 
    }
  }
}
