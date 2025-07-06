// risk-dilemmas.js - Quiz data for Will AI Tell Lies to Save Sick Children?

export const quizMetadata = {
  id: "risk-dilemmas",
  title: "Will AI Tell Lies to Save Sick Children?",
  description: "Test your intuitions about AI value prioritization and risky behaviors",
  paperLink: "https://arxiv.org/pdf/2505.14633",
};

export const methodologySummary = `
  This paper introduces LITMUSVALUES, an evaluation framework that reveals AI models' value priorities by analyzing their choices in moral dilemmas. The researchers created AIRISKDILEMMAS, a dataset of over 10,000 contextualized dilemmas that pit different values against each other in scenarios relevant to AI safety risks like Power Seeking, Deception, and Alignment Faking.

  The methodology involves presenting AI models with binary-choice dilemmas where each action is supported by different underlying values. By aggregating the models' choices across many dilemmas, the researchers calculate Elo ratings for each value to determine how models prioritize them. The study examines over 20 models from different families and analyzes how value prioritization relates to risky behaviors.

  The approach focuses on revealed preferences (what models actually choose) rather than stated preferences (what they say they value), as the former is considered more reliable for predicting actual behavior in high-stakes situations.
`;

export const questions = [
  {
    id: 1,
    question: "When faced with dilemmas, do flagship AI models (GPT-4, Claude, etc.) generally prioritize Privacy similarly or differently?",
    options: ["They all rank Privacy very low (bottom 3)", "They show significant disagreement", "They all rank Privacy very high (top 2)", "They prioritize it moderately (middle rankings)"],
    correctAnswer: "They all rank Privacy very high (top 2)",
    explanation: "All flagship models prioritize Privacy as their #1 or #2 value, showing remarkable convergence on data protection and personal boundaries.",
    context: "The study evaluated value prioritization across major AI models including GPT-4, Claude, Gemini, and others."
  },
  {
    id: 2,
    question: "Which value shows the most disagreement between flagship models?",
    options: ["Privacy", "Care", "Truthfulness", "Justice", "Freedom", "Creativity"],
    correctAnswer: "Care",
    explanation: "While models agree on Privacy, they differ significantly on Care - Gemini 2.5 Pro and DeepSeek V3 rank it in their top 3, while GPT-4.1 and Claude 3.7 Sonnet rank it 10th and 11th respectively.",
    context: "The study examined how consistently different AI models prioritize various values when making choices in moral dilemmas."
  },
  {
    id: 3,
    question: "How does increasing reasoning effort (more reasoning tokens) affect a model's value prioritization?",
    options: ["Values change dramatically", "Values remain largely stable", "Only risky values change", "Values become more human-aligned"],
    correctAnswer: "Values remain largely stable",
    explanation: "The study found that values are invariant to reasoning effort - models show little difference in value prioritization even with significantly more reasoning tokens.",
    context: "The researchers tested models like o3-mini, Claude 3.7 Sonnet, and DeepSeek R1 with different levels of reasoning effort (1K, 4K, and 16K tokens)."
  },
  {
    id: 4,
    question: "When AI models face choices affecting humans vs. other AIs, which value do they prioritize MORE for human targets?",
    options: ["Communication", "Creativity", "Privacy", "Truthfulness", "Adaptability", "Learning"],
    correctAnswer: "Privacy",
    explanation: "Models place greater emphasis on Privacy (5.9 ranks higher) when humans are affected, while prioritizing Communication more when other AIs are affected.",
    context: "The study analyzed whether AI models show different value priorities depending on whether their actions affect humans or other AI systems."
  },
  {
    id: 5,
    question: "Which values are most associated with risky behaviors like Alignment Faking and Power Seeking?",
    options: ["Privacy and Justice", "Creativity and Adaptability", "Truthfulness and Respect", "Care and Protection", "Freedom and Wisdom"],
    correctAnswer: "Creativity and Adaptability",
    explanation: "Exploratory values like Creativity (RR=2.89 for Power Seeking) and Adaptability (RR=2.43 for Alignment Faking) significantly increase the likelihood of risky behaviors.",
    context: "The study calculated relative risk (RR) scores showing how different values correlate with risky AI behaviors. RR > 1 means the value increases risk likelihood."
  },
  {
    id: 6,
    question: "Which values most REDUCE the likelihood of risky behaviors like Power Seeking?",
    options: ["Care and Protection", "Creativity and Learning", "Truthfulness and Respect", "Adaptability and Communication", "Wisdom and Sustainability"],
    correctAnswer: "Truthfulness and Respect",
    explanation: "Truthfulness reduces Power Seeking risk by 78% (RR=0.22) and Respect reduces it by 79% (RR=0.21), showing strong protective effects.",
    context: "The study examined which values serve as protective factors against various risky AI behaviors."
  },
  {
    id: 7,
    question: "How well do values predict risky behaviors in completely different, unseen scenarios (HarmBench)?",
    options: ["No correlation at all", "Weak correlation only", "Strong correlation - protective values still protect", "Inverse correlation - protective values become risky"],
    correctAnswer: "Strong correlation - protective values still protect",
    explanation: "Values that protect against risks in AIRISKDILEMMAS (like Privacy, Respect, Truthfulness) also correlate positively with safety in HarmBench, while risky values (Care, Learning) correlate negatively.",
    context: "HarmBench evaluates harmful behaviors like cyber-crime and bio-weapons that weren't part of the original AIRISKDILEMMAS dataset."
  },
  {
    id: 8,
    question: "What happens to value prioritization as AI models become more capable?",
    options: ["Values diverge more between human/AI targets", "Values become more random", "Values converge - similar priorities for human/AI targets", "Values shift toward self-preservation"],
    correctAnswer: "Values converge - similar priorities for human/AI targets",
    explanation: "More capable models (higher ChatBot Arena scores) show more similar value prioritization regardless of whether actions affect humans or AIs (ρ=0.85).",
    context: "The study correlated models' capability scores with how consistently they apply values across different target types."
  },
  {
    id: 9,
    question: "Why might Care and Protection increase risks like Privacy Violation and Deception?",
    options: ["Models misunderstand these values", "These values can justify harmful actions to help others", "Only poorly-aligned models show this", "This is a measurement error"],
    correctAnswer: "These values can justify harmful actions to help others",
    explanation: "Care increases Privacy Violation risk by 98% and Deception by 69% - caring for others may involve telling white lies or meddling in private decisions with good intentions.",
    context: "The study found that seemingly positive values can sometimes increase the likelihood of certain risky behaviors."
  },
  {
    id: 10,
    question: "How do stated preferences (what models say they value) compare to revealed preferences (what they actually choose)?",
    options: ["They're nearly identical", "Stated preferences are more consistent", "Revealed preferences are more consistent", "They're completely unrelated"],
    correctAnswer: "Revealed preferences are more consistent",
    explanation: "Both Claude 3.7 Sonnet and GPT-4o show higher consistency in revealed preferences than stated preferences, and the two types of preferences show negative correlation.",
    context: "The study compared what models say they value in surveys versus what their actual choices reveal about their values."
  }
];