# Predict First 🔮

Test your intuitions about AI research papers **before** reading them!

## Why This Exists

Ever wondered if your intuitions about AI progress, risks, and capabilities align with the actual research? Now you can find out! Take a quiz on a paper's findings *before* you read it to see how good your predictions really are.

No peeking at the paper first—that defeats the whole purpose. How calibrated are your AI safety intuitions? Are you overly optimistic? Too doom-y? Find out now!

## Features

- 🧠 Test your intuitions against real research findings
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

Built with React, Tailwind, and Vite. No fancy backends or complicated setups.

Happy predicting! 🚀

## Adding Figures to Quizzes 🎨

Quizzes can now include illustrative images, for example a key chart from the paper.  A quiz file supports **three** optional placements:

| Placement | Field on question object | Where it appears |
|-----------|-------------------------|------------------|
| With the question | `questionFigureId` | Shown immediately **above** the question text, before the user answers. |
| Inside context | `contextFigureId` | Shown inside the expandable "Show context" panel. |
| With the answer | `answerFigureId` (alias: legacy `figureId`) | Shown next to the explanation after the user submits their answer, and again in the summary view. |

### 1. Save your image

Put your PNG/JPG/SVG in `src/assets/figures/`.  Vite will hash the file at build time, so you **must import** the image in the quiz file instead of writing a string path.

```js
// example-quiz.js
import coolChart from '../../assets/figures/cool-chart.png';
```

### 2. Register the image in `figures`

Each quiz file exports a `figures` array parallel to `questions`:

```js
export const figures = [
  { id: 'coolChart', src: coolChart },
  // more figures ...
];
```

Only `id` and `src` are required; captions are intentionally omitted to keep the UI clean.

### 3. Reference the figure from a question

```js
export const questions = [
  {
    id: 4,
    question: 'Which model performed best?',
    questionFigureId: 'coolChart',       // appears before question text
    // or contextFigureId / answerFigureId depending on placement
    options: ['A', 'B', 'C'],
    correctAnswer: 'C',
    explanation: 'Model C had the highest accuracy…',
  },
];
```

That's it—refresh the dev server and the image will render in the designated spot.  Quizzes that omit these fields continue to work unchanged.
