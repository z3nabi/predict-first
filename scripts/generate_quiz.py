#!/usr/bin/env python3
"""
Quiz Generator Script

This script generates quizzes for the Predict First app using LLM providers.
Supported providers: Anthropic (Claude), OpenAI.
It takes a paper PDF URL and creates a structured quiz with questions, options, and explanations.

Usage:
  python generate_quiz.py --pdf-url "https://example.com/paper.pdf" --quiz-id "emergent-behaviors" --provider anthropic
  python generate_quiz.py --pdf-url "https://arxiv.org/pdf/2301.12345.pdf" --quiz-id "my-quiz" --provider openai --model gpt-4o-mini
"""

import os
import json
import argparse
import time
import re
import anthropic
from pathlib import Path
from dotenv import load_dotenv
from string import Template
from typing import Optional

# Try to load environment variables from multiple possible locations
script_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(script_dir)

# Check multiple locations for .env file
env_locations = [
    os.path.join(os.getcwd(), '.env'),           # Current directory
    os.path.join(script_dir, '.env'),            # Script directory
    os.path.join(root_dir, '.env'),              # Project root
    os.path.expanduser('~/.anthropic/.env'),     # User home directory
]

env_loaded = False
for env_path in env_locations:
    if os.path.exists(env_path):
        print(f"Loading .env from: {env_path}")
        load_dotenv(env_path)
        env_loaded = True
        break

if not env_loaded:
    print("No .env file found. You can set provider API keys via environment variables or --api-key.")

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Generate a quiz from a research paper using an LLM provider")
    
    parser.add_argument("--pdf-url", required=True, help="URL to a PDF file")
    parser.add_argument("--quiz-id", required=True, help="Unique ID for the quiz (use kebab-case)")
    parser.add_argument("--quiz-title", help="Title for the quiz (if different from paper title)")
    parser.add_argument("--provider", choices=["anthropic", "openai"], default="anthropic", help="LLM provider to use")
    parser.add_argument("--model", help="Model name to use. Defaults depend on provider")
    parser.add_argument("--api-key", help="API key for the selected provider (overrides environment variable)")
    
    return parser.parse_args()

def _arxiv_pdf_to_abs(link: str) -> str:
        """Convert arXiv PDF link (e.g. https://arxiv.org/pdf/1234.5678 or .pdf) to the /abs/ page."""
        if "arxiv.org" in link and "/pdf/" in link:
            # Simple replacement
            link = link.replace("/pdf/", "/abs/")
            # Drop trailing .pdf if present
            if link.endswith(".pdf"):
                link = link[:-4]
        return link

def build_prompt_text(quiz_id: str, paper_link: str) -> str:
    """Construct the prompt text used for all providers."""
    prompt_template = Template("""
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
- **Explanation**: Why this answer is correct (revealed after answering)
- **Context**: Background information about the experimental setup

## Critical Guidelines

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

### Focus on Surprising or Non-Obvious Findings
- Prioritize results that violate common intuitions
- Choose findings where multiple outcomes were plausible
- Test predictions about experimental results, not definitions or methods

### Quality Checks
Before finalizing each question, verify:
1. Could someone deduce the answer from the context alone? (If yes, revise)
2. Do all options seem equally likely to someone unfamiliar with the paper?
3. Does the question test prediction of results rather than comprehension?
4. Would an expert in the field find multiple options plausible?

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

Remember: The goal is to reveal surprising findings and test genuine intuitions about how AI systems behave, not to trick readers with poorly constructed questions.
""")
    return prompt_template.substitute(QUIZ_ID=quiz_id, PAPER_LINK=paper_link)

def _stream_progressively(text_iter):
    collected_chunks = []
    question_ids_seen: set[int] = set()
    buffer = ""
    for text in text_iter:
        collected_chunks.append(text)
        buffer += text
        for match in re.finditer(r"\b\"?id\"?\s*:\s*(\d+)", buffer):
            qid = int(match.group(1))
            if qid not in question_ids_seen:
                question_ids_seen.add(qid)
                if len(question_ids_seen) == 1:
                    print(f"\rGenerated {len(question_ids_seen)} question", end="", flush=True)
                else:
                    print(f"\rGenerated {len(question_ids_seen)} questions", end="", flush=True)
        if len(buffer) > 2000:
            buffer = buffer[-1000:]
    print()
    return "".join(collected_chunks)

def generate_quiz_anthropic(pdf_url: str, quiz_id: str, model: Optional[str]) -> Optional[str]:
    print(f"Using provider 'anthropic'. Sending PDF URL to Claude: {pdf_url}")
    paper_link = _arxiv_pdf_to_abs(pdf_url)
    prompt_text = build_prompt_text(quiz_id, paper_link)
    try:
        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        model_name = model or "claude-opus-4-1-20250805"
        with client.messages.stream(
            model=model_name,
            max_tokens=4000,
            temperature=0.2,
            system="You are an expert at creating educational quizzes based on research papers.",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt_text},
                        {"type": "document", "source": {"type": "url", "url": pdf_url}},
                    ],
                }
            ],
        ) as stream:
            return _stream_progressively(stream.text_stream)
    except Exception as e:
        print(f"Error generating quiz with Anthropic: {e}")
        return None

def _download_pdf(url: str) -> Optional[bytes]:
    try:
        import requests
        r = requests.get(url, timeout=60)
        r.raise_for_status()
        return r.content
    except Exception as e:
        print(f"Error downloading PDF: {e}")
        return None

def _extract_pdf_text(pdf_bytes: bytes, max_chars: int = 120_000) -> str:
    from io import BytesIO
    from pypdf import PdfReader
    reader = PdfReader(BytesIO(pdf_bytes))
    chunks = []
    for page in reader.pages:
        try:
            chunks.append(page.extract_text() or "")
        except Exception:
            continue
        if sum(len(c) for c in chunks) > max_chars:
            break
    text = "\n\n".join(chunks)
    return text[:max_chars]

def generate_quiz_openai(pdf_url: str, quiz_id: str, model: Optional[str]) -> Optional[str]:
    print(f"Using provider 'openai'. Downloading and extracting PDF text: {pdf_url}")
    paper_link = _arxiv_pdf_to_abs(pdf_url)
    try:
        pdf_bytes = _download_pdf(pdf_url)
        if not pdf_bytes:
            return None
        pdf_text = _extract_pdf_text(pdf_bytes)
        prompt_text = build_prompt_text(quiz_id, paper_link)
        attached_text = (
            "The following is the extracted text of the paper PDF referenced above. Use it as the source material for the quiz. Ignore extraction artifacts.\n\n"+
            "```\n" + pdf_text + "\n```"
        )
        try:
            from openai import OpenAI
        except Exception as e:
            print("Missing dependency 'openai'. Please install it: pip install openai")
            return None
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        model_name = model or "gpt-5"
        stream = client.chat.completions.create(
            model=model_name,
            max_completion_tokens=10000,
            stream=True,
            messages=[
                {"role": "system", "content": "You are an expert at creating educational quizzes based on research papers."},
                {"role": "user", "content": prompt_text + "\n\n" + attached_text},
            ],
        )
        def _iter():
            for chunk in stream:
                delta = chunk.choices[0].delta
                if delta and getattr(delta, "content", None):
                    yield delta.content
        return _stream_progressively(_iter())
    except Exception as e:
        print(f"Error generating quiz with OpenAI: {e}")
        return None

def generate_quiz_from_pdf_url(pdf_url, args):
    """Dispatch to provider-specific generation."""
    if args.provider == "openai":
        return generate_quiz_openai(pdf_url, args.quiz_id, args.model)
    # default anthropic
    return generate_quiz_anthropic(pdf_url, args.quiz_id, args.model)
    
    try:
        # Construct prompt text using string.Template to avoid accidental f-string brace interpolation issues
        prompt_template = Template("""
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
- **Explanation**: Why this answer is correct (revealed after answering)
- **Context**: Background information about the experimental setup

## Critical Guidelines

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

### Focus on Surprising or Non-Obvious Findings
- Prioritize results that violate common intuitions
- Choose findings where multiple outcomes were plausible
- Test predictions about experimental results, not definitions or methods

### Quality Checks
Before finalizing each question, verify:
1. Could someone deduce the answer from the context alone? (If yes, revise)
2. Do all options seem equally likely to someone unfamiliar with the paper?
3. Does the question test prediction of results rather than comprehension?
4. Would an expert in the field find multiple options plausible?

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

Remember: The goal is to reveal surprising findings and test genuine intuitions about how AI systems behave, not to trick readers with poorly constructed questions.
""")

        prompt_text = prompt_template.substitute(QUIZ_ID=args.quiz_id, PAPER_LINK=paper_link)
        
        # Create the message with the PDF URL
        # Use streaming to avoid connection time-outs and to provide progress feedback
        collected_chunks = []  # Accumulate streamed text deltas here
        with client.messages.stream(
            model="claude-opus-4-1-20250805",
            max_tokens=4000,
            temperature=0.2,
            system="You are an expert at creating educational quizzes based on research papers.",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt_text
                        },
                        {
                            "type": "document",
                            "source": {
                                "type": "url",
                                "url": pdf_url
                            }
                        }
                    ]
                }
            ],
        ) as stream:
            # Live progress indicator: count how many unique question IDs we've seen so far
            question_ids_seen: set[int] = set()
            buffer = ""  # Sliding window of recent text to search for new question IDs

            for text in stream.text_stream:
                collected_chunks.append(text)
                buffer += text

                # Look for patterns like "id: 1," or "id: 2," (with optional quotes/spaces)
                for match in re.finditer(r"\b\"?id\"?\s*:\s*(\d+)", buffer):
                    qid = int(match.group(1))
                    if qid not in question_ids_seen:
                        question_ids_seen.add(qid)
                        # Carriage return (\r) rewrites the same line in-place
                        if len(question_ids_seen) == 1:
                            print(f"\rGenerated {len(question_ids_seen)} question", end="", flush=True)
                        else:
                            print(f"\rGenerated {len(question_ids_seen)} questions", end="", flush=True)

                # Keep the buffer from growing indefinitely (keep last ~1000 chars)
                if len(buffer) > 2000:
                    buffer = buffer[-1000:]

            # After streaming completes, ensure we move to a new line
            print()

        # Combine all the chunks into the final response text
        response_text = "".join(collected_chunks)
        print()  # Ensure a newline after streaming is complete

        return response_text
    except Exception as e:
        print(f"Error generating quiz: {e}")
        return None

def extract_js_code(text):
    """Extract JavaScript code from Claude's response."""
    # Look for code between ```javascript and ``` markers
    js_pattern = r"```javascript\s*([\s\S]*?)\s*```"
    match = re.search(js_pattern, text)
    
    if match:
        return match.group(1).strip()
    
    # Fallback if not found with javascript tag
    code_pattern = r"```\s*([\s\S]*?)\s*```"
    match = re.search(code_pattern, text)
    
    if match:
        return match.group(1).strip()
    
    # If no code blocks, return the whole text
    return text

def save_quiz_file(js_code, quiz_id):
    """Save the generated quiz to the appropriate file."""
    output_dir = Path("../src/data/quizzes")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    output_file = output_dir / f"{quiz_id}.js"
    
    with open(output_file, 'w') as f:
        f.write(js_code)
    
    print(f"✅ Quiz file saved to: {output_file}")
    
def update_quiz_registry(quiz_id, quiz_title, registry_path=None):
    """Update the quizRegistry.js file to include the new quiz.
    
    Args:
        quiz_id (str): The ID of the quiz to add
        quiz_title (str): The title of the quiz
        registry_path (str or Path, optional): Path to the registry file.
                                              Defaults to "../src/data/quizRegistry.js"
    
    Returns:
        bool: True if the registry was updated successfully, False otherwise
    """
    if registry_path is None:
        registry_path = Path("../src/data/quizRegistry.js")
    else:
        registry_path = Path(registry_path)
    
    if not registry_path.exists():
        print(f"⚠️ Quiz registry file not found at: {registry_path}")
        print("You will need to manually update the quiz registry.")
        return False
    
    try:
        # Read the current registry file
        with open(registry_path, 'r') as f:
            content = f.read()
        
        # Extract the import section
        import_section_match = re.search(r'(// Import quiz metadata.*?)(\n\n// Registry)', content, re.DOTALL)
        if not import_section_match:
            raise ValueError("Could not identify import section in quizRegistry.js")
        
        import_section = import_section_match.group(1)
        
        # Check if quiz is already imported
        if f"import {{ quizMetadata as {quiz_id.replace('-', '')} }}" in import_section:
            print(f"ℹ️ Quiz '{quiz_id}' is already imported in the registry.")
        else:
            # Add new import
            new_import = f"import {{ quizMetadata as {quiz_id.replace('-', '')} }} from './quizzes/{quiz_id}';"
            updated_import_section = import_section + f"\n{new_import}"
            content = content.replace(import_section, updated_import_section)
        
        # Extract the registry array
        registry_match = re.search(r'export const quizRegistry = \[\n(.*?)\n\];', content, re.DOTALL)
        if not registry_match:
            raise ValueError("Could not identify quiz registry array in quizRegistry.js")
        
        registry_items = registry_match.group(1)
        
        # Check if quiz is already in registry
        if quiz_id.replace('-', '') in registry_items:
            print(f"ℹ️ Quiz '{quiz_id}' is already registered in the registry.")
        else:
            # Add to registry array
            new_registry_items = registry_items.rstrip() + f"\n  {quiz_id.replace('-', '')},"
            updated_registry = f"export const quizRegistry = [\n{new_registry_items}\n];"
            content = content.replace(f"export const quizRegistry = [\n{registry_items}\n];", updated_registry)
        
        # Extract the switch case in loadQuizData function
        switch_match = re.search(r'switch \(quizId\) {\n(.*?)default:', content, re.DOTALL)
        if not switch_match:
            raise ValueError("Could not identify switch statement in loadQuizData function")
        
        switch_content = switch_match.group(1)
        
        # Check if quiz is already in switch case
        if f"case '{quiz_id}':" in switch_content:
            print(f"ℹ️ Quiz '{quiz_id}' is already in the loadQuizData function.")
        else:
            # Add to switch case
            new_case = f"case '{quiz_id}':\n        return import('./quizzes/{quiz_id}');\n"
            updated_switch = f"switch (quizId) {{\n{switch_content}      {new_case}default:"
            content = content.replace(f"switch (quizId) {{\n{switch_content}default:", updated_switch)
        
        # Write the updated content back to the file
        with open(registry_path, 'w') as f:
            f.write(content)
            
        print(f"✅ Quiz registry updated to include '{quiz_id}'")
        return True
            
    except Exception as e:
        print(f"⚠️ Error updating quiz registry: {e}")
        print("You may need to manually update the registry file.")
        return False

def main():
    args = parse_arguments()
    
    # If API key is provided via command line, use it for the selected provider
    if args.api_key:
        if args.provider == "anthropic":
            os.environ["ANTHROPIC_API_KEY"] = args.api_key
        elif args.provider == "openai":
            os.environ["OPENAI_API_KEY"] = args.api_key
        print("Using API key provided via command line for", args.provider)
    else:
        # Validate that the appropriate environment variable is present
        if args.provider == "anthropic" and not os.getenv("ANTHROPIC_API_KEY"):
            print("Error: ANTHROPIC_API_KEY not set. Provide --api-key or set env var.")
            return
        if args.provider == "openai" and not os.getenv("OPENAI_API_KEY"):
            print("Error: OPENAI_API_KEY not set. Provide --api-key or set env var.")
            return
    
    response = generate_quiz_from_pdf_url(args.pdf_url, args)
    
    if not response:
        print("Error: Failed to generate quiz.")
        return
    
    js_code = extract_js_code(response)
    save_quiz_file(js_code, args.quiz_id)
    
    # Update the quiz registry with the new quiz
    quiz_title = args.quiz_title or f"Quiz for {args.quiz_id}"
    update_quiz_registry(args.quiz_id, quiz_title)
    
    print("\nNext steps:")
    print("1. Review the generated quiz file to ensure quality")
    print("2. Run the app to verify the quiz appears in the list")

if __name__ == "__main__":
    main() 