#!/usr/bin/env python3
"""
Quiz Generator Script

This script generates quizzes for the Predict First app using Anthropic's Claude API.
It takes a paper PDF URL and creates a structured quiz with questions, options, and explanations.

Usage:
  python generate_quiz.py --pdf-url "https://example.com/paper.pdf" --quiz-id "emergent-behaviors"
"""

import os
import json
import argparse
import time
import re
import anthropic
from pathlib import Path
from dotenv import load_dotenv

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
    print("No .env file found. Checking if ANTHROPIC_API_KEY is set directly in environment.")

# Check if API key is available
if not os.getenv("ANTHROPIC_API_KEY"):
    print("Error: No API key found. Please create a .env file with your ANTHROPIC_API_KEY in one of these locations:")
    for path in env_locations:
        print(f"  - {path}")
    print("\nExample .env content:\nANTHROPIC_API_KEY=sk-ant-api03-...")
    print("\nOr set it directly in your environment before running the script.")
    exit(1)

# Initialize the Anthropic client
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Generate a quiz from a research paper using Claude")
    
    parser.add_argument("--pdf-url", required=True, help="URL to a PDF file")
    parser.add_argument("--quiz-id", required=True, help="Unique ID for the quiz (use kebab-case)")
    parser.add_argument("--quiz-title", help="Title for the quiz (if different from paper title)")
    parser.add_argument("--api-key", help="Anthropic API key (overrides environment variable)")
    
    return parser.parse_args()

def generate_quiz_from_pdf_url(pdf_url, args):
    """Generate a quiz by sending the PDF URL directly to Claude API."""
    print(f"Sending PDF URL to Claude: {pdf_url}")
    
    try:
        # Construct prompt text
        prompt_text = f"""
You are an expert at creating educational quizzes. I want you to create a quiz about a research paper that tests the reader's intuitions about the findings BEFORE they've read the paper. The use case here is geared towards understanding and testing intuitions about how AI models work, specifically for safety, and so predicting the outcome of concrete experiments.

Please analyze the attached PDF document and create:
1. A brief methodology summary (2-3 paragraphs) that explains the paper's approach without revealing specific findings.
2. 8-10 multiple-choice questions that test intuitions about the paper's findings.
   - Each question should have 4-8 options with 1 correct answer.
   - Questions should focus on the core findings from the paper.
   - Include additional context about the question, e.g. outlining the specifics of the experiment. This will be shown to the user BEFORE they answer the questions.
   - Include an explanation for why the correct answer is correct.

FORMAT YOUR RESPONSE AS A VALID JAVASCRIPT OBJECT with the following structure:

```javascript
// {args.quiz_id}.js - Quiz data for [Paper Title]

export const quizMetadata = {{
  id: "{args.quiz_id}",
  title: "[Paper Title, potentially abbreviated]",
  description: "Test your intuitions about [brief paper description]",
}};

export const methodologySummary = `
  [Your methodology summary here]
`;

export const questions = [
  {{
    id: 1,
    question: "Question text?",
    options: ["Option A", "Option B", "Option C", "Option D"],
    correctAnswer: "Option B",
    explanation: "Explanation of why Option B is correct...",
    context: "Additional context about this question..."
  }},
  // Additional questions...
];
```

Important:
- Make sure your output is valid JavaScript that can be directly saved to a file
- Don't include any additional explanations or comments in your response, just the JS object
- Ensure proper escaping of special characters in the strings
"""
        
        # Create the message with the PDF URL
        response = client.messages.create(
            model="claude-opus-4-20250514",
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
            ]
        )
        
        return response.content[0].text
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
    
    # If API key is provided via command line, use it
    if args.api_key:
        os.environ["ANTHROPIC_API_KEY"] = args.api_key
        print("Using API key provided via command line")
    
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