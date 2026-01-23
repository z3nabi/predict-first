# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Predict First is a React-based quiz app that tests users' intuitions about AI research papers before they read them. Users predict experimental outcomes, then see how their intuitions compare to actual findings.

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

## Quiz Generation

Generate quizzes from research papers using Claude or OpenAI:

```bash
cd scripts
pip install -r requirements.txt

# Using Anthropic (default)
./generate_quiz.py --pdf-url "https://arxiv.org/pdf/2502.04675" --quiz-id "my-quiz"

# Using OpenAI
./generate_quiz.py --pdf-url "..." --quiz-id "..." --provider openai
```

The script reads the prompt template from `scripts/prompts/quiz_prompt.md`, generates the quiz JS file to `src/data/quizzes/`, and automatically updates `src/data/quizRegistry.js`.

## Architecture

### Quiz Data Flow

1. **Registry** (`src/data/quizRegistry.js`): Central registry that imports all quiz metadata and provides `loadQuizData()` for dynamic imports
2. **Quiz Files** (`src/data/quizzes/*.js`): Each quiz exports `quizMetadata`, `methodologySummary`, `questions`, and optionally `figures`
3. **Components**: `QuizSelector` displays available quizzes; `Quiz` handles question flow, answer validation, and results

### Adding a New Quiz Manually

1. Create `src/data/quizzes/{quiz-id}.js` with exports: `quizMetadata`, `methodologySummary`, `questions`
2. Update `src/data/quizRegistry.js`:
   - Add import statement
   - Add to `quizRegistry` array
   - Add case to `loadQuizData()` switch statement

### Quiz File Structure

```javascript
export const quizMetadata = {
  id: "quiz-id",
  title: "Quiz Title",
  description: "Brief description",
  paperLink: "https://arxiv.org/abs/..."
};

export const methodologySummary = `...`;

export const questions = [
  {
    id: 1,
    question: "Question text?",
    options: ["A", "B", "C", "D"],
    correctAnswer: "B",
    explanation: "Why B is correct...",
    context: "Optional background info"
  }
];

// Optional: figures array for images
export const figures = [
  { id: "chartId", src: importedImage }
];
```

### Figure Placements

Questions can reference figures in three positions via optional fields:
- `questionFigureId`: Shows above question text
- `contextFigureId`: Shows in expandable context panel
- `answerFigureId` (or `figureId`): Shows with explanation after answering

Images go in `src/assets/figures/` and must be imported in the quiz file.
