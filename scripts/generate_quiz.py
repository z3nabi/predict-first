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
import argparse
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

# Shared system prompt for all providers
SYSTEM_PROMPT = "You are an expert at creating educational quizzes based on research papers."

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
    """Construct the prompt text used for all providers by loading a template file."""
    prompt_path = Path(script_dir) / "prompts" / "quiz_prompt.md"
    with open(prompt_path, "r", encoding="utf-8") as f:
        template_str = f.read()
    prompt_template = Template(template_str)
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
        model_name = model or "claude-opus-4-5-20251101"
        with client.messages.stream(
            model=model_name,
            max_tokens=8000,
            temperature=0.2,
            system=SYSTEM_PROMPT,
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

def generate_quiz_openai(pdf_url: str, quiz_id: str, model: Optional[str]) -> Optional[str]:
    print(f"Using provider 'openai'. Passing file URL directly: {pdf_url}")
    paper_link = _arxiv_pdf_to_abs(pdf_url)
    try:
        prompt_text = build_prompt_text(quiz_id, paper_link)
        try:
            from openai import OpenAI
        except Exception as e:
            print("Missing dependency 'openai'. Please install it: pip install openai")
            return None
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        model_name = model or "gpt-5"
        response = client.responses.create(
            model=model_name,
            input=[
                {
                    "role": "user",
                    "content": [
                        {"type": "input_text", "text": prompt_text},
                        {"type": "input_file", "file_url": pdf_url},
                    ],
                }
            ],
        )
        return getattr(response, "output_text", None) or str(response)
    except Exception as e:
        print(f"Error generating quiz with OpenAI: {e}")
        return None

def generate_quiz_from_pdf_url(pdf_url, args):
    """Dispatch to provider-specific generation."""
    if args.provider == "openai":
        return generate_quiz_openai(pdf_url, args.quiz_id, args.model)
    # default anthropic
    return generate_quiz_anthropic(pdf_url, args.quiz_id, args.model)

def extract_js_code(text):
    """Extract JavaScript code from the model's response."""
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