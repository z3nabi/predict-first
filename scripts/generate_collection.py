#!/usr/bin/env python3
"""
Collection Generator Script

This script generates a collection of quizzes from a Substack blog post.
It extracts arxiv paper links from the post and generates a quiz for each paper.

Usage:
  python generate_collection.py --substack-url "https://aisafetyfrontier.substack.com/p/paper-highlights-of-december-2025" --collection-id "dec-2025"
  python generate_collection.py --substack-url "..." --collection-id "..." --provider openai
"""

import os
import argparse
import re
import requests
from bs4 import BeautifulSoup
from pathlib import Path
from dotenv import load_dotenv
from typing import Optional
import subprocess
import sys

# Try to load environment variables from multiple possible locations
script_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(script_dir)

# Check multiple locations for .env file
env_locations = [
    os.path.join(os.getcwd(), '.env'),
    os.path.join(script_dir, '.env'),
    os.path.join(root_dir, '.env'),
    os.path.expanduser('~/.anthropic/.env'),
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
    parser = argparse.ArgumentParser(
        description="Generate a collection of quizzes from a Substack blog post"
    )

    parser.add_argument(
        "--substack-url",
        required=True,
        help="URL to a Substack blog post containing arxiv paper links"
    )
    parser.add_argument(
        "--collection-id",
        required=True,
        help="Unique ID for the collection (use kebab-case, e.g., 'dec-2025')"
    )
    parser.add_argument(
        "--collection-title",
        help="Title for the collection (defaults to page title)"
    )
    parser.add_argument(
        "--provider",
        choices=["anthropic", "openai"],
        default="anthropic",
        help="LLM provider to use for quiz generation"
    )
    parser.add_argument(
        "--model",
        help="Model name to use. Defaults depend on provider"
    )
    parser.add_argument(
        "--api-key",
        help="API key for the selected provider (overrides environment variable)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Extract papers but don't generate quizzes"
    )

    return parser.parse_args()


def fetch_substack_html(url: str) -> Optional[str]:
    """Fetch HTML content from a Substack post."""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        print(f"Error fetching Substack post: {e}")
        return None


def extract_arxiv_papers(html: str) -> list[dict]:
    """Extract arxiv paper links and their context from HTML.

    Returns a list of dicts with 'url' and 'slug' keys.
    """
    soup = BeautifulSoup(html, 'html.parser')
    papers = []
    seen_ids = set()

    # Find all links that point to arxiv
    for link in soup.find_all('a', href=True):
        href = link['href']

        # Match arxiv URLs (both abs and pdf)
        arxiv_match = re.search(r'arxiv\.org/(abs|pdf)/(\d+\.\d+)', href)
        if arxiv_match:
            arxiv_id = arxiv_match.group(2)

            # Skip duplicates
            if arxiv_id in seen_ids:
                continue
            seen_ids.add(arxiv_id)

            # Convert to PDF URL for consistency
            pdf_url = f"https://arxiv.org/pdf/{arxiv_id}.pdf"

            # Try to extract a meaningful slug from surrounding context
            # First, try the link text itself
            link_text = link.get_text(strip=True)
            slug = _text_to_slug(link_text) if link_text else None

            # If no good slug from link text, use arxiv ID
            if not slug or len(slug) < 3:
                slug = arxiv_id.replace('.', '-')

            papers.append({
                'url': pdf_url,
                'arxiv_id': arxiv_id,
                'slug': slug,
                'title': link_text or f"Paper {arxiv_id}"
            })

    return papers


def _text_to_slug(text: str) -> str:
    """Convert text to a URL-friendly slug."""
    # Lowercase and replace spaces/special chars with hyphens
    slug = text.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    slug = slug.strip('-')
    # Limit length
    return slug[:50]


def extract_page_title(html: str) -> str:
    """Extract the page title from HTML."""
    soup = BeautifulSoup(html, 'html.parser')

    # Try meta og:title first (usually cleaner)
    og_title = soup.find('meta', property='og:title')
    if og_title and og_title.get('content'):
        return og_title['content']

    # Fall back to title tag
    title_tag = soup.find('title')
    if title_tag:
        return title_tag.get_text(strip=True)

    return "Untitled Collection"


def extract_quiz_title(quiz_id: str) -> Optional[str]:
    """Extract the title from a generated quiz file."""
    quiz_path = Path(root_dir) / "src" / "data" / "quizzes" / f"{quiz_id}.js"

    if not quiz_path.exists():
        return None

    try:
        with open(quiz_path, 'r') as f:
            content = f.read()

        # Look for title in quizMetadata
        title_match = re.search(r'title:\s*["\']([^"\']+)["\']', content)
        if title_match:
            return title_match.group(1)
    except Exception:
        pass

    return None


def generate_quiz_for_paper(
    paper: dict,
    collection_id: str,
    provider: str,
    model: Optional[str],
    api_key: Optional[str]
) -> Optional[dict]:
    """Generate a quiz for a single paper using generate_quiz.py.

    Returns a dict with 'quiz_id' and 'title' if successful, None otherwise.
    """
    # Use arxiv ID for a clean, unique quiz ID
    quiz_id = f"{collection_id}-{paper['arxiv_id'].replace('.', '-')}"

    # Build the command
    cmd = [
        sys.executable,
        os.path.join(script_dir, 'generate_quiz.py'),
        '--pdf-url', paper['url'],
        '--quiz-id', quiz_id,
        '--provider', provider,
    ]

    if model:
        cmd.extend(['--model', model])

    if api_key:
        cmd.extend(['--api-key', api_key])

    print(f"\n{'='*60}")
    print(f"Generating quiz for: {paper['title']}")
    print(f"Quiz ID: {quiz_id}")
    print(f"PDF URL: {paper['url']}")
    print('='*60)

    try:
        result = subprocess.run(
            cmd,
            cwd=script_dir,
            check=True,
            capture_output=False
        )

        # Extract the actual title from the generated quiz
        actual_title = extract_quiz_title(quiz_id) or paper['title']

        return {'quiz_id': quiz_id, 'title': actual_title}
    except subprocess.CalledProcessError as e:
        print(f"Failed to generate quiz for {paper['title']}: {e}")
        return None


def create_collection_file(
    collection_id: str,
    title: str,
    description: str,
    source_url: str,
    quiz_ids: list[str]
) -> bool:
    """Create the collection JavaScript file."""
    output_dir = Path(root_dir) / "src" / "data" / "collections"
    output_dir.mkdir(parents=True, exist_ok=True)

    output_file = output_dir / f"{collection_id}.js"

    # Generate the JS content
    quiz_ids_formatted = ',\n    '.join(f'"{qid}"' for qid in quiz_ids)

    content = f'''// Collection: {title}
// Auto-generated by generate_collection.py

export const collectionMetadata = {{
  id: "{collection_id}",
  title: "{title}",
  description: "{description}",
  sourceUrl: "{source_url}",
  quizIds: [
    {quiz_ids_formatted}
  ]
}};
'''

    try:
        with open(output_file, 'w') as f:
            f.write(content)
        print(f"\nCollection file saved to: {output_file}")
        return True
    except Exception as e:
        print(f"Error saving collection file: {e}")
        return False


def update_collection_registry(collection_id: str, title: str) -> bool:
    """Update the collectionRegistry.js file to include the new collection."""
    registry_path = Path(root_dir) / "src" / "data" / "collectionRegistry.js"

    if not registry_path.exists():
        print(f"Collection registry file not found at: {registry_path}")
        return False

    try:
        with open(registry_path, 'r') as f:
            content = f.read()

        # Create variable name from collection ID
        var_name = collection_id.replace('-', '')

        # Check if collection is already imported
        if f"collectionMetadata as {var_name}" in content:
            print(f"Collection '{collection_id}' is already in the registry.")
            return True

        # Add import statement
        import_line = f"import {{ collectionMetadata as {var_name} }} from './collections/{collection_id}';"

        # Find where to add the import (after the comment or existing imports)
        import_marker = "// Import collection metadata from each collection file"
        if import_marker in content:
            content = content.replace(
                import_marker,
                f"{import_marker}\n{import_line}"
            )
        else:
            # Add at the top if no marker found
            content = import_line + "\n" + content

        # Add to registry array
        registry_marker = "export const collectionRegistry = ["
        if registry_marker in content:
            # Find the closing bracket of the array
            content = content.replace(
                "export const collectionRegistry = [\n  // Collection metadata objects will be added here\n];",
                f"export const collectionRegistry = [\n  {var_name},\n];"
            )
            # If the placeholder isn't there, try to add to existing array
            if var_name not in content:
                content = content.replace(
                    "export const collectionRegistry = [",
                    f"export const collectionRegistry = [\n  {var_name},"
                )

        # Add case to loadCollectionData switch
        new_case = f"case '{collection_id}':\n        return import('./collections/{collection_id}');\n      "
        default_case = "default:\n        throw new Error"
        if f"case '{collection_id}':" not in content and default_case in content:
            content = content.replace(
                default_case,
                f"{new_case}{default_case}"
            )

        with open(registry_path, 'w') as f:
            f.write(content)

        print(f"Collection registry updated to include '{collection_id}'")
        return True

    except Exception as e:
        print(f"Error updating collection registry: {e}")
        return False


def main():
    args = parse_arguments()

    print(f"Fetching Substack post: {args.substack_url}")
    html = fetch_substack_html(args.substack_url)

    if not html:
        print("Error: Failed to fetch Substack post.")
        return 1

    # Extract page title for collection
    page_title = extract_page_title(html)
    collection_title = args.collection_title or page_title

    # Extract arxiv papers
    papers = extract_arxiv_papers(html)

    if not papers:
        print("No arxiv papers found in the post.")
        return 1

    print(f"\nFound {len(papers)} arxiv papers:")
    for i, paper in enumerate(papers, 1):
        print(f"  {i}. {paper['title']} ({paper['arxiv_id']})")

    if args.dry_run:
        print("\nDry run complete. No quizzes generated.")
        return 0

    # Generate quizzes for each paper
    successful_quizzes = []
    failed_papers = []

    for paper in papers:
        result = generate_quiz_for_paper(
            paper,
            args.collection_id,
            args.provider,
            args.model,
            args.api_key
        )
        if result:
            successful_quizzes.append(result)
        else:
            failed_papers.append(paper['title'])

    print(f"\n{'='*60}")
    print("SUMMARY")
    print('='*60)
    print(f"Successfully generated: {len(successful_quizzes)}/{len(papers)} quizzes")

    if successful_quizzes:
        print(f"\nGenerated quizzes:")
        for quiz in successful_quizzes:
            print(f"  - {quiz['title']} ({quiz['quiz_id']})")

    if failed_papers:
        print(f"\nFailed papers:")
        for title in failed_papers:
            print(f"  - {title}")

    if not successful_quizzes:
        print("\nNo quizzes were generated. Collection not created.")
        return 1

    # Create collection file
    successful_quiz_ids = [q['quiz_id'] for q in successful_quizzes]
    description = f"Quizzes from: {collection_title}"
    create_collection_file(
        args.collection_id,
        collection_title,
        description,
        args.substack_url,
        successful_quiz_ids
    )

    # Update collection registry
    update_collection_registry(args.collection_id, collection_title)

    print(f"\nCollection URL: /collection/{args.collection_id}")
    print("\nNext steps:")
    print("1. Review the generated quiz files in src/data/quizzes/")
    print("2. Review the collection file in src/data/collections/")
    print("3. Run 'npm run dev' and navigate to the collection URL")

    return 0


if __name__ == "__main__":
    sys.exit(main())
