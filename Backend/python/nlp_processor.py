from __future__ import annotations

"""
NLP Processor for SmartReq AI
--------------------------------
Reads JSON from stdin or --input CLI, extracts requirements and builds
user stories (Gherkin-like) and a simple process flow for React Flow.

Usage examples:
  python python/nlp_processor.py --input "User wants secure login for banking app"
  echo '{"input_text": "Process KYC and allow transaction"}' | python python/nlp_processor.py

Dependencies:
  - spaCy (en_core_web_sm)
  - transformers (optional for future summarization/classification)
  - torch (for transformers)

Note: Ensure the model is available locally:
  python -m spacy download en_core_web_sm
"""

import argparse
import asyncio
import json
import logging
import sys
from typing import Any, Dict

import spacy

try:
    # Optional import for future advanced features
    from transformers import AutoModel, AutoTokenizer  # noqa: F401
except Exception:  # pragma: no cover
    AutoModel = None
    AutoTokenizer = None

from utils import (
    apply_domain_boost,
    build_gherkin_stories,
    build_swimlane_flow,
    confidence_score,
    extract_candidates_spacy,
    validate_response_uniqueness,
)


logger = logging.getLogger("smartreq.nlp")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="SmartReq AI NLP Processor")
    parser.add_argument("--input", dest="input_text", type=str, help="Input text to process")
    parser.add_argument("--project_type", dest="project_type", type=str, default=None, help="Project type e.g., fintech")
    parser.add_argument("--stdin", action="store_true", help="Read JSON from stdin {input_text, project_type}")
    return parser.parse_args()


def read_input(args: argparse.Namespace) -> Dict[str, Any]:
    if args.stdin:
        try:
            payload = json.loads(sys.stdin.read())
            return {
                "input_text": payload.get("input_text", ""),
                "project_type": payload.get("project_type"),
            }
        except Exception as e:
            raise ValueError(f"Invalid JSON from stdin: {e}")
    if not args.input_text:
        raise ValueError("No input provided. Use --input or --stdin with JSON.")
    return {"input_text": args.input_text, "project_type": args.project_type}


def load_models():
    try:
        nlp = spacy.load("en_core_web_sm")
    except Exception as e:
        logger.error("spaCy model 'en_core_web_sm' not found. Install with: python -m spacy download en_core_web_sm")
        raise e
    return nlp


def process_text(input_text: str, project_type: str | None, nlp) -> Dict[str, Any]:
    """Process text with enhanced extraction and validation.
    
    Includes:
    - Re-extraction if confidence < 0.7
    - Uniqueness validation
    - Alternative parsing strategies
    """
    doc = nlp(input_text)
    roles, actions, benefits = extract_candidates_spacy(doc)
    actions = apply_domain_boost(project_type, actions)

    # Use roles as actors for swimlanes, fallback to default
    actors = roles[:5] if len(roles) >= 2 else None

    stories = build_gherkin_stories(roles, actions, benefits, max_stories=5)
    flow = build_swimlane_flow(actions, min_steps=20, actors=actors)
    conf = confidence_score(roles, actions, benefits)
    
    # If confidence is low, try alternative parsing (sentence-based chunking)
    if conf < 0.7 and len(input_text) > 50:
        logger.warning(f"Low confidence ({conf}), attempting alternative parsing")
        
        # Split into sentences and re-process
        sentences = [sent.text.strip() for sent in doc.sents if len(sent.text.strip()) > 10]
        
        if len(sentences) > 1:
            # Re-extract from individual sentences
            alt_roles, alt_actions, alt_benefits = [], [], []
            
            for sentence in sentences[:5]:  # Process up to 5 sentences
                sent_doc = nlp(sentence)
                r, a, b = extract_candidates_spacy(sent_doc)
                alt_roles.extend(r)
                alt_actions.extend(a)
                alt_benefits.extend(b)
            
            # Deduplicate
            alt_roles = list(dict.fromkeys(alt_roles))
            alt_actions = list(dict.fromkeys(alt_actions))
            alt_benefits = list(dict.fromkeys(alt_benefits))
            
            # Check if alternative extraction is better
            alt_conf = confidence_score(alt_roles, alt_actions, alt_benefits)
            
            if alt_conf > conf:
                logger.info(f"Alternative parsing improved confidence: {conf} -> {alt_conf}")
                roles, actions, benefits = alt_roles, alt_actions, alt_benefits
                actions = apply_domain_boost(project_type, actions)
                actors = roles[:5] if len(roles) >= 2 else None
                stories = build_gherkin_stories(roles, actions, benefits, max_stories=5)
                flow = build_swimlane_flow(actions, min_steps=20, actors=actors)
                conf = alt_conf
    
    result = {
        "stories": stories,
        "flow": flow,
        "confidence": conf,
    }
    
    # Validate uniqueness
    is_unique = validate_response_uniqueness(result)
    result["is_unique"] = is_unique
    
    if not is_unique:
        logger.warning("Response appears to be a duplicate of a previous generation")

    return result


async def main_async():
    args = parse_args()
    try:
        payload = read_input(args)
        input_text = (payload.get("input_text") or "").strip()
        project_type = payload.get("project_type")
        if not input_text:
            raise ValueError("'input_text' must be a non-empty string")

        nlp = load_models()
        result = process_text(input_text, project_type, nlp)
        print(json.dumps(result, ensure_ascii=False))
    except Exception as e:
        logger.exception("Failed to process NLP input")
        err = {"error": str(e)}
        print(json.dumps(err))
        sys.exit(1)


def main():
    # Keep sync entrypoint; allows easy child_process.spawn usage
    asyncio.run(main_async())


if __name__ == "__main__":
    main()
