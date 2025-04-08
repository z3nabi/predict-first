# Predict First 🔮

Test your intuitions about AI research papers **before** reading them!

## Why This Exists

Ever wondered if your intuitions about AI progress, risks, and capabilities align with the actual research? Now you can find out! Take a quiz on a paper's findings *before* you read it to see how good your predictions really are.

No peeking at the paper first—that defeats the whole purpose. How calibrated are your AI safety intuitions? Are you overly optimistic? Too doom-y? Find out now!

## Features

- 🧠 Test your intuitions against real research findings
- 🤖 Generate quizzes on-demand for any paper with Claude 3.7
- 📊 Multiple quizzes covering different papers and topics
- 🔄 Share quizzes with your AI-curious friends
- 📱 Works on mobile (great for reading on the go!)


## Generate Quizzes with Claude

Want to add a quiz for a new paper? We've included a script to auto-generate quizzes using Claude:

```bash
# First, install dependencies
cd scripts
pip install -r requirements.txt

# Set up your API key in one of these ways:
# 1. Create a .env file (in project root, scripts dir, or current dir)
cp .env.example .env
# Edit .env with your API key

# 2. Or provide the API key directly via command line:
./generate_quiz.py --url "..." --quiz-id "..." --api-key "sk-ant-..."

# Generate a quiz from a paper URL
./generate_quiz.py --pdf-url "https://arxiv.org/pdf/2502.04675" --quiz-id "recursive-self-critique"
```

Once generated, you'll need to add the quiz to the registry in `src/data/quizRegistry.js`.

## Development

For the nerds who want to tinker:

```bash
# Get it running
npm install
npm run dev

# That's it! The rest is just standard React stuff.
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```
# Claude API key for paper quiz generation (optional)
CLAUDE_API_KEY=your-claude-api-key

# Server port (default is 3000)
PORT=3000
```

If no API key is provided, users will need to enter their own keys for on-demand quiz generation.

Built with React, Tailwind, and Vite. No fancy backends or complicated setups.

Happy predicting! 🚀
