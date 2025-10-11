# Compatibility shim to match existing PYTHON_SCRIPT_PATH
from nlp_processor import main

if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""
SmartReq AI - NLP Processing Script
Uses spaCy for requirement extraction and artifact generation
"""

import sys
import json
import re
import spacy
from typing import List, Dict, Any
import argparse

# Load spaCy model (you may need to install: python -m spacy download en_core_web_sm)
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Error: spaCy model 'en_core_web_sm' not found. Please install it with: python -m spacy download en_core_web_sm", file=sys.stderr)
    sys.exit(1)

class RequirementExtractor:
    def __init__(self):
        self.nlp = nlp
        
    def extract_entities(self, text: str) -> Dict[str, List[str]]:
        """Extract named entities from text"""
        doc = self.nlp(text)
        
        entities = {
            'PERSON': [],
            'ORG': [],
            'GPE': [],  # Geopolitical entities
            'PRODUCT': [],
            'EVENT': [],
            'WORK_OF_ART': [],
            'LAW': [],
            'LANGUAGE': []
        }
        
        for ent in doc.ents:
            if ent.label_ in entities:
                entities[ent.label_].append(ent.text)
        
        return entities
    
    def extract_verbs_and_actions(self, text: str) -> List[str]:
        """Extract action verbs from text"""
        doc = self.nlp(text)
        actions = []
        
        for token in doc:
            if token.pos_ == "VERB" and not token.is_stop:
                actions.append(token.lemma_.lower())
        
        return list(set(actions))
    
    def extract_nouns_and_objects(self, text: str) -> List[str]:
        """Extract nouns and objects from text"""
        doc = self.nlp(text)
        objects = []
        
        for token in doc:
            if token.pos_ in ["NOUN", "PROPN"] and not token.is_stop:
                objects.append(token.lemma_.lower())
        
        return list(set(objects))
    
    def identify_roles(self, text: str) -> List[str]:
        """Identify potential user roles from text"""
        doc = self.nlp(text)
        roles = []
        
        # Common role patterns
        role_patterns = [
            r'\b(?:user|admin|manager|developer|tester|analyst|stakeholder|customer|client|end.?user)\b',
            r'\b(?:system|application|platform|service|tool|interface)\b',
            r'\b(?:business|technical|functional|non.?functional)\b'
        ]
        
        for pattern in role_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            roles.extend(matches)
        
        # Also look for entities that might be roles
        for ent in doc.ents:
            if ent.label_ == "PERSON":
                roles.append(ent.text)
        
        return list(set(roles))
    
    def generate_user_stories(self, text: str) -> List[str]:
        """Generate user stories from text"""
        stories = []
        
        # Extract roles
        roles = self.identify_roles(text)
        if not roles:
            roles = ['user', 'admin', 'stakeholder']  # Default roles
        
        # Extract actions
        actions = self.extract_verbs_and_actions(text)
        
        # Extract objects
        objects = self.extract_nouns_and_objects(text)
        
        # Generate stories based on patterns found in text
        sentences = [sent.text.strip() for sent in self.nlp(text).sents if len(sent.text.strip()) > 10]
        
        for sentence in sentences[:10]:  # Limit to first 10 sentences
            doc = self.nlp(sentence)
            
            # Look for requirement patterns
            if any(word in sentence.lower() for word in ['should', 'must', 'need', 'require', 'want', 'able to']):
                # Extract the main verb and object
                verb = None
                obj = None
                
                for token in doc:
                    if token.pos_ == "VERB" and not token.is_stop:
                        verb = token.lemma_
                        break
                
                for token in doc:
                    if token.pos_ in ["NOUN", "PROPN"] and not token.is_stop:
                        obj = token.text
                        break
                
                if verb and obj:
                    # Generate story for each role
                    for role in roles[:3]:  # Limit to 3 roles
                        story = f"As a {role}, I want to {verb} {obj} so that I can achieve my goals"
                        stories.append(story)
        
        # If no stories generated from patterns, create generic ones
        if not stories:
            for role in roles[:3]:
                for action in actions[:3]:
                    for obj in objects[:3]:
                        story = f"As a {role}, I want to {action} {obj} so that I can be more efficient"
                        stories.append(story)
        
        return list(set(stories))[:10]  # Return unique stories, max 10
    
    def generate_process_flows(self, text: str) -> List[Dict[str, Any]]:
        """Generate process flows from text"""
        flows = []
        
        # Extract sentences that might represent process steps
        sentences = [sent.text.strip() for sent in self.nlp(text).sents if len(sent.text.strip()) > 5]
        
        if len(sentences) < 2:
            return flows
        
        # Create a simple linear flow
        nodes = []
        edges = []
        
        for i, sentence in enumerate(sentences[:10]):  # Limit to 10 steps
            # Clean up sentence
            clean_sentence = re.sub(r'[^\w\s]', '', sentence).strip()
            if len(clean_sentence) > 50:
                clean_sentence = clean_sentence[:50] + "..."
            
            node_id = f"step_{i+1}"
            nodes.append({
                "id": node_id,
                "label": clean_sentence,
                "type": "process"
            })
            
            if i > 0:
                edges.append({
                    "from": f"step_{i}",
                    "to": node_id,
                    "label": "next"
                })
        
        if nodes:
            flows.append({
                "id": "main_process",
                "name": "Main Process Flow",
                "nodes": nodes,
                "edges": edges
            })
        
        # Create alternative flows based on different scenarios
        if len(sentences) > 5:
            # Create a decision flow
            decision_nodes = []
            decision_edges = []
            
            decision_nodes.append({
                "id": "start",
                "label": "Start Process",
                "type": "start"
            })
            
            decision_nodes.append({
                "id": "decision",
                "label": "Evaluate Requirements",
                "type": "decision"
            })
            
            decision_nodes.append({
                "id": "success",
                "label": "Requirements Met",
                "type": "end"
            })
            
            decision_nodes.append({
                "id": "failure",
                "label": "Requirements Not Met",
                "type": "end"
            })
            
            decision_edges.extend([
                {"from": "start", "to": "decision", "label": "begin"},
                {"from": "decision", "to": "success", "label": "yes"},
                {"from": "decision", "to": "failure", "label": "no"}
            ])
            
            flows.append({
                "id": "decision_flow",
                "name": "Decision Process Flow",
                "nodes": decision_nodes,
                "edges": decision_edges
            })
        
        return flows
    
    def process_text(self, text: str) -> Dict[str, Any]:
        """Main processing function"""
        try:
            # Extract entities
            entities = self.extract_entities(text)
            
            # Generate user stories
            stories = self.generate_user_stories(text)
            
            # Generate process flows
            flows = self.generate_process_flows(text)
            
            return {
                "success": True,
                "stories": stories,
                "flows": flows,
                "entities": entities,
                "metadata": {
                    "text_length": len(text),
                    "sentences_count": len(list(self.nlp(text).sents)),
                    "words_count": len(text.split())
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "stories": [],
                "flows": [],
                "entities": {}
            }

def main():
    """Main function to process text from stdin"""
    if len(sys.argv) > 1:
        # Text provided as command line argument
        text = sys.argv[1]
    else:
        # Read from stdin
        text = sys.stdin.read()
    
    if not text.strip():
        print(json.dumps({
            "success": False,
            "error": "No text provided",
            "stories": [],
            "flows": [],
            "entities": {}
        }))
        sys.exit(1)
    
    # Process text
    extractor = RequirementExtractor()
    result = extractor.process_text(text)
    
    # Output result as JSON
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
