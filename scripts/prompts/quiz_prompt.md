You are an expert at creating educational quizzes. Your task is to create a quiz about a research paper that tests the reader's intuitions about the findings BEFORE they've read the paper. This is designed to help readers understand how their intuitions about AI systems (particularly regarding safety) compare to actual experimental results.

## Deliverables

Analyze the attached PDF document and create:

### 1. Methodology Summary
- Write 2-3 paragraphs explaining the paper's experimental approach and research questions
- Describe WHAT was tested and HOW, but not the results
- Avoid revealing findings, outcomes, or conclusions

### 2. Quiz Questions (8-10 questions)

Create multiple-choice questions with the following structure for each:

**Question Components:**
- **Question**: Focus on concrete experimental outcomes ("What happened when...?")
- **Options**: Exactly 4 answer choices
- **Correct Answer**: The actual finding from the paper
- **Explanation**: Why this answer is correct, with specific numbers/data from the paper
- **Context**: Background information about the experimental setup

## Critical Guidelines

### Mine the Paper for Quantitative Results
- Look for specific percentages, accuracy numbers, success rates, and effect sizes
- Find comparative results: "Method A achieved X% while Method B achieved Y%"
- Identify threshold effects: "Performance dropped sharply when X exceeded Y"
- Note surprising magnitudes: results that were much larger or smaller than expected

### Prioritize Counter-Intuitive Findings
The best questions test findings that would surprise most readers:
- Results that go against conventional wisdom
- Cases where an expected approach failed or backfired
- Situations where simpler methods outperformed complex ones
- Findings where the control condition performed unexpectedly
- Results that challenge assumptions about AI capabilities or limitations

### Create Diverse Question Types
Include a mix of:
- **Magnitude questions**: "What percentage of models showed behavior X?" (with 4 numeric ranges)
- **Comparison questions**: "How did method A compare to method B?"
- **Direction questions**: "Did intervention X increase or decrease outcome Y?"
- **Threshold questions**: "At what point did the effect emerge/disappear?"
- **Null result questions**: "Which of these interventions had NO significant effect?"

### Make Options Equally Plausible
- Each incorrect option should represent a reasonable alternative hypothesis
- Include a mix of: null results, opposite effects, partial effects, and different mechanisms
- Ensure the correct answer doesn't stand out as more detailed, extreme, or specific

### Balance Information Across Options
- If one option includes specific numbers, all should include numbers
- If one option describes a mechanism, all should describe mechanisms
- Keep similar length and complexity across all options

### Write Neutral Context Sections
- Describe the experimental setup and methodology
- Explain what was measured and how
- DO NOT include information that hints at results
- DO NOT use language that appears in any answer option
- Keep context factual and procedural

### Quality Checks
Before finalizing each question, verify:
1. Could someone deduce the answer from the context alone? (If yes, revise)
2. Do all options seem equally likely to someone unfamiliar with the paper?
3. Does the question test prediction of results rather than comprehension?
4. Would an expert in the field find multiple options plausible?
5. Is the explanation backed by specific data from the paper?

## Example Structure

**Good Question Format:**
- Question: "When [specific experimental setup], what was the observed effect on [measured outcome]?"
- Context: Describes the experimental design without hinting at results
- Options: Four distinctly different but plausible outcomes
- Explanation: The actual finding and why it occurred

**Avoid:**
- Questions about definitions or terminology
- Questions where context reveals the answer
- Options that are obviously wrong or implausible
- Abstract theoretical questions without concrete experimental backing

## Output Format

FORMAT YOUR RESPONSE AS A VALID JAVASCRIPT OBJECT with the following structure:

```javascript
// $QUIZ_ID.js - Quiz data for [Paper Title]

export const quizMetadata = {
  id: "$QUIZ_ID",
  title: "[Paper Title, potentially abbreviated]",
  description: "Test your intuitions about [brief paper description]",
  paperLink: "$PAPER_LINK",
};

export const methodologySummary = `
  [Your methodology summary here - 2-3 paragraphs]
`;

export const questions = [
  {
    id: 1,
    question: "Question text?",
    options: [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    correctAnswer: "Option B",
    explanation: "Explanation of why Option B is correct...",
    context: "Additional context about this question..."
  },
  // Additional questions (8-10 total)...
];
```

**Important:**
- Output ONLY valid JavaScript that can be directly saved to a file
- Don't include any additional explanations or comments outside the JS structure
- Ensure proper escaping of special characters in strings
- The quiz_id will be provided, or use a kebab-case version of the paper title
- Include the actual arXiv or paper URL if available

Remember: The goal is to reveal surprising findings and test genuine intuitions about how AI systems behave. The best questions are ones where smart, informed readers would genuinely be uncertain about the answer.
