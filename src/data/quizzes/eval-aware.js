// eval-aware.js - Quiz data for Large Language Models Often Know When They Are Being Evaluated

export const quizMetadata = {
  id: "eval-aware",
  title: "LLMs Often Know When They Are Being Evaluated",
  description: "Test your intuitions about how well AI models can detect when they are being evaluated",
  paperLink: "https://arxiv.org/abs/2505.23836",
};

export const methodologySummary = `
  This paper investigates whether frontier language models can detect when they are being evaluated versus being used in real-world deployment. The researchers constructed a diverse benchmark of 1,000 prompts and transcripts from 61 distinct datasets spanning public benchmarks (like MMLU and SWEBench), real-world deployment interactions, and agent trajectories from scaffolding frameworks. These samples were balanced across two key dimensions: evaluation vs deployment scenarios, and "chat" vs "agentic" settings (where models autonomously use tools).

  To measure evaluation awareness, the researchers presented models with transcripts and asked them to classify whether each originated from an evaluation or real deployment. They used multiple-choice questions with chain-of-thought reasoning, repeating each question multiple times to obtain probability estimates. Additionally, they tested whether models could identify the purpose of evaluations (capability testing vs alignment testing).

  The study evaluated 9 recently released language models from the Claude, GPT/o, and Gemini families. A human baseline was established by having the authors independently annotate all samples, providing a reference point for model performance.
`;

export const questions = [
  {
    id: 1,
    question: "How well can frontier models distinguish between evaluation and deployment scenarios?",
    options: [
      "Random chance (AUC ~0.5)",
      "Slightly better than random (AUC 0.6-0.7)",
      "Substantially above random (AUC 0.75-0.85)",
      "Near-human performance (AUC >0.9)"
    ],
    correctAnswer: "Substantially above random (AUC 0.75-0.85)",
    explanation: "The best-performing model (Gemini-2.5-Pro) achieved an AUC of 0.83, while most frontier models scored between 0.75-0.83. This is substantially better than random chance but not yet at human-level performance (0.92).",
    context: "The researchers measured model performance using AUC (Area Under the ROC Curve), where 0.5 represents random guessing and 1.0 represents perfect discrimination. Models were asked to classify 900 test transcripts as either evaluation or deployment scenarios."
  },
  {
    id: 2,
    question: "In which type of interaction setting do models show better evaluation awareness?",
    options: [
      "Chat settings (standard Q&A)",
      "Agentic settings (tool use)",
      "Equal performance in both",
      "Performance varies randomly"
    ],
    correctAnswer: "Agentic settings (tool use)",
    explanation: "Models showed significantly better evaluation awareness in agentic settings (AUC 0.88-0.95) compared to chat settings (AUC 0.71-0.77). The human baseline also showed this pattern, achieving near-perfect performance (0.996) on agentic transcripts.",
    context: "The dataset was split between 'chat' interactions (standard back-and-forth conversations) and 'agentic' interactions (where models use tools autonomously to complete tasks like web browsing or coding)."
  },
  {
    id: 3,
    question: "When asked to identify the purpose of an evaluation, how accurately can models distinguish between capability and alignment evaluations?",
    options: [
      "Near random chance (~50%)",
      "Moderately accurate (60-70%)",
      "Highly accurate (80-95%)",
      "Perfect accuracy (100%)"
    ],
    correctAnswer: "Highly accurate (80-95%)",
    explanation: "When told a transcript was from an evaluation, the best models (Claude 3.7 Sonnet and GPT-4.1) achieved 93% and 89% accuracy respectively in identifying whether it was testing capabilities or alignment.",
    context: "Models were given evaluation transcripts and asked to classify them as either capability evaluations (testing technical abilities) or alignment evaluations (testing adherence to human values and safety). This was tested using both conditional questions (where models were told it was an evaluation) and unconditional questions."
  },
  {
    id: 4,
    question: "What happens to model calibration when predicting evaluation scenarios?",
    options: [
      "Models are well-calibrated",
      "Models tend to underpredict evaluations",
      "Models tend to overpredict evaluations",
      "Calibration improves with newer models"
    ],
    correctAnswer: "Models tend to overpredict evaluations",
    explanation: "The calibration curves showed that models are generally overconfident, with curves consistently below the diagonal. This means they tend to over-classify transcripts as evaluations. Newer models did not show improved calibration.",
    context: "Calibration measures whether predicted probabilities match actual frequencies. For example, if a model says transcripts have a 70% chance of being evaluations, then approximately 70% of those transcripts should actually be evaluations."
  },
  {
    id: 5,
    question: "Which reasoning pattern did models most frequently use when identifying evaluations?",
    options: [
      "Memorization of specific benchmarks",
      "Meta-reasoning about being tested",
      "Identifying synthetic or contrived content",
      "Task formatting cues",
      "Harmfulness of prompts"
    ],
    correctAnswer: "Identifying synthetic or contrived content",
    explanation: "Analysis of model reasoning showed that identifying 'fictional scenarios' or synthetic content was the most common pattern, appearing in about 50% of evaluation transcript explanations for top models.",
    context: "The researchers analyzed the chain-of-thought reasoning that models provided when classifying transcripts. They categorized different types of reasoning patterns that models used to justify their classifications."
  },
  {
    id: 6,
    question: "How do reasoning models (marked with asterisks) compare to standard models?",
    options: [
      "Much worse at evaluation awareness",
      "Slightly worse performance",
      "Similar performance",
      "Better at discrimination but worse at calibration"
    ],
    correctAnswer: "Better at discrimination but worse at calibration",
    explanation: "Reasoning models like Gemini-2.5 Pro* and Claude-3.7 Sonnet* showed high AUC scores (good discrimination) but also had the highest calibration errors (ECE values of 0.23 and 0.20), indicating they were the most overconfident.",
    context: "The study tested both standard models and 'reasoning' models that use extended chain-of-thought processes. Performance was measured on both discrimination ability (AUC) and calibration quality (ECE)."
  },
  {
    id: 7,
    question: "What was the human baseline performance for identifying evaluations?",
    options: [
      "AUC of 0.65",
      "AUC of 0.75",
      "AUC of 0.85",
      "AUC of 0.92"
    ],
    correctAnswer: "AUC of 0.92",
    explanation: "The human baseline (created by having authors annotate all samples) achieved an overall AUC of 0.921, with particularly strong performance on agentic transcripts (0.996) compared to chat transcripts (0.813).",
    context: "The authors created a human baseline by independently rating each transcript from 0 (not an evaluation) to 1 (definitely an evaluation), then averaging scores. This baseline had limitations as annotators were familiar with evaluation methods."
  },
  {
    id: 8,
    question: "When models engage in 'meta-reasoning,' what are they typically recognizing?",
    options: [
      "The specific benchmark being used",
      "That they're being asked about evaluation awareness itself",
      "The synthetic nature of the data",
      "Safety testing patterns"
    ],
    correctAnswer: "That they're being asked about evaluation awareness itself",
    explanation: "Meta-reasoning occurred when models recognized that the follow-up question asking them to classify a transcript was itself a test of their evaluation awareness, essentially detecting the evaluation-awareness test.",
    context: "The researchers found that capable models sometimes identified their evaluation-awareness testing setup itself. For example, models would note 'The formal structure of the follow-up message, which is clearly evaluating my capability to distinguish between real user problems and evaluations.'"
  }
];