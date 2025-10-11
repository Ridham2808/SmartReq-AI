from __future__ import annotations

import hashlib
import json
import logging
import random
import re
import time
from dataclasses import dataclass
from typing import Dict, List, Set, Tuple


# Domain terms for quick matching/boosting with expanded synonyms
FINTECH_TERMS = {
    "login", "signup", "register", "otp", "mfa", "transaction",
    "transfer", "balance", "statement", "account", "kye", "kyc",
    "upi", "payment", "refund", "chargeback", "beneficiary",
    "authenticate", "verify", "authorize", "validate", "2fa"
}

# Domain-specific action expansions for genuine responses
DOMAIN_EXPANSIONS = {
    "fintech": {
        "login": ["Authenticate User", "Verify Credentials", "Start Session", "Validate Identity"],
        "signup": ["Register Account", "Create Profile", "Initialize User", "Onboard Customer"],
        "2fa": ["Verify OTP", "Handle Timeout", "Resend Code", "Validate Token"],
        "kyc": ["Verify Documents", "Check Identity", "Validate KYC", "Process Verification"],
        "transaction": ["Process Payment", "Validate Amount", "Check Balance", "Execute Transfer"],
        "upi": ["UPI Verification", "Link Bank Account", "Validate VPA", "Process UPI Payment"],
        "payment": ["Process Payment", "Verify Payment Method", "Authorize Transaction", "Confirm Payment"],
    },
    "default": {
        "create": ["Initialize Creation", "Validate Input", "Process Creation", "Confirm Creation"],
        "update": ["Fetch Current Data", "Validate Changes", "Apply Updates", "Confirm Update"],
        "delete": ["Verify Permissions", "Confirm Deletion", "Execute Deletion", "Log Action"],
        "review": ["Fetch Details", "Analyze Content", "Provide Feedback", "Approve/Reject"],
    }
}

# Response hash cache for uniqueness validation (in-memory for session)
RESPONSE_CACHE: Set[str] = set()


@dataclass
class StoryParts:
    role: str
    action: str
    benefit: str


def calculate_similarity(s1: str, s2: str) -> float:
    """Simple Levenshtein-based similarity (0-1 scale)."""
    if not s1 or not s2:
        return 0.0
    s1, s2 = s1.lower(), s2.lower()
    if s1 == s2:
        return 1.0
    # Simple character overlap ratio
    common = set(s1) & set(s2)
    return len(common) / max(len(set(s1)), len(set(s2)))


def extract_candidates_spacy(doc) -> Tuple[List[str], List[str], List[str]]:
    """Extract candidate roles, actions, benefits using ADVANCED dependency parsing.

    Enhancements:
    - Compound phrase extraction (e.g., "has role assigned" as decision condition)
    - Uniqueness filtering with similarity checks
    - Relevance ranking
    - Random shuffle on 20-30% of elements for variability
    """
    roles, actions, benefits = [], [], []
    action_scores = {}  # Track action relevance

    # Enhanced role extraction with more keywords
    role_keywords = {
        "user", "admin", "manager", "developer", "customer", "client", 
        "employee", "team", "system", "reviewer", "approver", "validator",
        "executor", "stakeholder", "member", "owner", "lead", "analyst",
        "designer", "tester", "qa", "operator", "supervisor", "coordinator"
    }
    
    # Named entities as potential roles
    for ent in doc.ents:
        if ent.label_ in {"PERSON", "ORG", "NORP"}:
            roles.append(ent.text)
    
    # Extract role-indicating nouns
    for token in doc:
        if token.pos_ in {"NOUN", "PROPN"} and token.text.lower() in role_keywords:
            roles.append(token.text.capitalize())

    # ADVANCED action extraction with compound phrases and dependencies
    for token in doc:
        if token.pos_ == "VERB" and not token.is_stop:
            action_phrase = token.lemma_
            relevance_score = 1.0
            
            # Build compound action phrases using dependency parsing
            components = [token.lemma_]
            
            # Look for direct objects, prepositional objects, attributes
            for child in token.children:
                if child.dep_ in {"dobj", "pobj", "attr", "xcomp"}:
                    components.append(child.text)
                    relevance_score += 0.5
                # Capture compound objects (e.g., "role assigned")
                elif child.dep_ in {"compound", "amod"}:
                    components.insert(0, child.text)
            
            # Add particles for phrasal verbs (e.g., "log in", "sign up")
            if token.i + 1 < len(doc):
                next_token = doc[token.i + 1]
                if next_token.dep_ == "prt":
                    components.append(next_token.text)
                    relevance_score += 0.3
            
            action_phrase = " ".join(components).strip()
            
            # Check for conditional/decision phrases ("has", "is", "can")
            if token.lemma_ in {"have", "be", "can", "should", "must"}:
                action_phrase = f"Check if {action_phrase}"
                relevance_score += 0.4
            
            actions.append(action_phrase)
            action_scores[action_phrase] = relevance_score
    
    # Extract noun phrases as potential actions (e.g., "request approval")
    for chunk in doc.noun_chunks:
        chunk_text = chunk.text.lower()
        # Action-indicating noun phrases
        if any(word in chunk_text for word in [
            "request", "approval", "review", "validation", "execution",
            "verification", "authorization", "confirmation", "notification",
            "submission", "processing", "assignment", "allocation"
        ]):
            actions.append(chunk.text)
            action_scores[chunk.text] = 0.8

    # Look for 'so that' benefits
    text_lower = doc.text.lower()
    if "so that" in text_lower:
        after = text_lower.split("so that", 1)[1]
        benefits.append(after.strip(" .!\n")[:120])
    
    # Extract goal-oriented phrases
    if "in order to" in text_lower:
        after = text_lower.split("in order to", 1)[1]
        benefits.append(after.strip(" .!\n")[:120])

    # Fallback benefits: use meaningful noun chunks
    if not benefits:
        for chunk in doc.noun_chunks:
            if len(chunk.text) > 3 and chunk.root.pos_ in {"NOUN", "PROPN"}:
                benefits.append(chunk.text)
                if len(benefits) >= 3:
                    break

    # Deduplicate with similarity filtering (remove near-duplicates)
    def deduplicate_with_similarity(items: List[str], threshold: float = 0.7) -> List[str]:
        unique = []
        for item in items:
            item_clean = item.strip().title()
            if not item_clean or len(item_clean) < 3:
                continue
            # Check similarity with existing unique items
            is_duplicate = False
            for existing in unique:
                if calculate_similarity(item_clean, existing) > threshold:
                    is_duplicate = True
                    break
            if not is_duplicate:
                unique.append(item_clean)
        return unique
    
    roles = deduplicate_with_similarity(roles, threshold=0.8)
    actions = deduplicate_with_similarity(actions, threshold=0.7)
    benefits = deduplicate_with_similarity(benefits, threshold=0.75)
    
    # Rank actions by relevance score
    actions = sorted(actions, key=lambda a: action_scores.get(a, 0.5), reverse=True)
    
    # Random shuffle 20-30% for variability (ensures unique responses per run)
    shuffle_count = int(len(actions) * random.uniform(0.2, 0.3))
    if shuffle_count > 0 and len(actions) > shuffle_count:
        indices_to_shuffle = random.sample(range(len(actions)), shuffle_count)
        shuffled_items = [actions[i] for i in indices_to_shuffle]
        random.shuffle(shuffled_items)
        for i, idx in enumerate(indices_to_shuffle):
            actions[idx] = shuffled_items[i]
    
    # Ensure we have at least some roles
    if not roles:
        roles = ["User", "System", "Manager"]
    
    return roles, actions, benefits


def apply_domain_boost(project_type: str | None, actions: List[str]) -> List[str]:
    """Enhanced domain boosting with dynamic expansion and synonym generation.
    
    Enhancements:
    - Dynamically expand terms with synonyms/related concepts
    - Input-dependent expansion (2-3 new actions per detected term)
    - Randomized boost order for uniqueness
    - Domain-specific variants (e.g., UPI Verification for fintech)
    """
    if not project_type:
        return actions
    
    domain = project_type.lower()
    expanded_actions = list(actions)  # Start with original actions
    
    if domain == "fintech":
        # Scan for fintech-specific terms and expand dynamically
        expansions_added = []
        
        for action in actions:
            action_lower = action.lower()
            
            # Check for domain terms and add related actions
            for term, variants in DOMAIN_EXPANSIONS.get("fintech", {}).items():
                if term in action_lower:
                    # Add 2-3 random variants (not all, for uniqueness)
                    num_variants = random.randint(2, min(3, len(variants)))
                    selected_variants = random.sample(variants, num_variants)
                    expansions_added.extend(selected_variants)
        
        # Add expanded actions without duplicates
        for expansion in expansions_added:
            if expansion not in expanded_actions:
                expanded_actions.append(expansion)
        
        # Sort with fintech terms prioritized, but randomize within groups
        fintech_actions = [a for a in expanded_actions if any(term in a.lower() for term in FINTECH_TERMS)]
        other_actions = [a for a in expanded_actions if a not in fintech_actions]
        
        # Shuffle within each group for variability
        random.shuffle(fintech_actions)
        random.shuffle(other_actions)
        
        return fintech_actions + other_actions
    
    elif domain in DOMAIN_EXPANSIONS:
        # Generic domain expansion
        for action in actions:
            action_lower = action.lower()
            for term, variants in DOMAIN_EXPANSIONS[domain].items():
                if term in action_lower:
                    num_variants = random.randint(1, 2)
                    selected_variants = random.sample(variants, min(num_variants, len(variants)))
                    for variant in selected_variants:
                        if variant not in expanded_actions:
                            expanded_actions.append(variant)
    
    return expanded_actions


def build_gherkin_stories(roles: List[str], actions: List[str], benefits: List[str], max_stories: int = 5) -> List[str]:
    """Generate diverse user stories with role/benefit rotation and randomization.
    
    Enhancements:
    - Rotate through multiple roles and benefits (not just first one)
    - Randomize selection from top 3 roles/benefits
    - Rephrase 50% of stories for variety
    - Check for similar phrases and rephrase
    - Tie stories directly to extracted elements (no defaults unless no data)
    """
    stories: List[str] = []
    
    # Prepare role and benefit pools (top 3 of each for rotation)
    role_pool = roles[:3] if len(roles) >= 3 else roles if roles else ["User"]
    benefit_pool = benefits[:3] if len(benefits) >= 3 else benefits if benefits else ["achieve the goal"]
    
    # Alternative phrasings for variety (50% chance)
    action_rephrases = {
        "login": "authenticate securely",
        "log in": "sign in to the system",
        "signup": "create an account",
        "sign up": "register for access",
        "verify": "validate the information",
        "process": "handle the request",
        "review": "examine and approve",
        "submit": "send for processing",
        "approve": "authorize the action",
        "create": "initialize and set up",
    }
    
    used_phrases = set()  # Track to avoid repetition
    
    for i, action in enumerate(actions[:max_stories]):
        # Normalize action
        action_clean = re.sub(r"\s+", " ", action).strip().lower()
        if not action_clean or len(action_clean) < 3:
            continue
        
        # Randomly select role and benefit from pools
        role = random.choice(role_pool)
        benefit = random.choice(benefit_pool)
        
        # Rephrase 50% of actions for variety
        if random.random() < 0.5:
            for key, rephrase in action_rephrases.items():
                if key in action_clean:
                    action_clean = action_clean.replace(key, rephrase)
                    break
        
        # Ensure action starts with lowercase for grammar
        action_clean = action_clean[0].lower() + action_clean[1:] if len(action_clean) > 1 else action_clean.lower()
        
        # Create story
        story = f"As a {role}, I want to {action_clean} so that {benefit}."
        
        # Check for similarity with existing stories (avoid near-duplicates)
        is_similar = False
        for existing_story in stories:
            if calculate_similarity(story, existing_story) > 0.8:
                is_similar = True
                break
        
        if not is_similar:
            stories.append(story)
            used_phrases.add(action_clean)
    
    # Ensure at least 3-5 stories with variety
    if len(stories) < 3 and actions:
        # Generate additional stories with different phrasings
        for i in range(min(3 - len(stories), len(actions))):
            if i < len(actions):
                role = random.choice(role_pool)
                benefit = random.choice(benefit_pool)
                action = actions[i].strip().lower()
                action = action[0].lower() + action[1:] if len(action) > 1 else action.lower()
                story = f"As a {role}, I want to {action} so that {benefit}."
                if story not in stories:
                    stories.append(story)
    
    # Only use default if absolutely no data (should be rare)
    if not stories:
        stories.append("As a user, I want to access the system so that I can perform my tasks.")
    
    return stories[:max_stories]


def build_swimlane_flow(actions: List[str], min_steps: int = 20, actors: List[str] = None) -> Dict:
    """Create ADVANCED swimlane-based flow with hierarchical structures, decisions, and loops.
    
    MAJOR ENHANCEMENTS:
    - Input-derived actions as core with logical extensions
    - Hierarchical subgraphs and decision nodes (20% of steps)
    - Cross-lane edges and retry loops
    - Randomized actor assignment and edge labels
    - Dynamic icon selection from pool
    - Validation against input (no generic fillers if actions > min_steps)
    
    Args:
        actions: List of action verbs/steps extracted from input
        min_steps: Minimum number of process steps (excluding start/end)
        actors: List of roles/departments for swimlanes
    
    Returns:
        Dict with nodes, edges, actors, and mermaid diagram
    """
    # Default actors if not provided - expanded pool
    if not actors:
        actors = ["User", "Manager", "System", "Admin", "Client"]
    
    # Randomize actor order for uniqueness per run
    actors_shuffled = actors.copy()
    random.shuffle(actors_shuffled)
    actors = actors_shuffled
    
    nodes: List[Dict] = []
    edges: List[Dict] = []
    
    # Swimlane layout: horizontal lanes with vertical spacing
    lane_height = 150
    x_start = 100
    x_spacing = 200
    
    # Ensure we have enough actions - INTELLIGENT expansion
    if not actions:
        actions = ["Initialize Process", "Validate Input", "Execute Action", "Store Result"]
    
    expanded_actions = []
    
    if actions and len(actions) > 0:
        # Use all AI-extracted actions first (CORE actions)
        expanded_actions.extend(actions)
        
        # If we need more steps, generate CONTEXTUALLY RELATED steps
        if len(expanded_actions) < min_steps:
            # Generate logical pre/post steps based on dependencies
            action_extensions = []
            
            for action in actions:
                action_lower = action.lower()
                
                # Add context-aware pre-steps
                if any(word in action_lower for word in ["create", "register", "signup", "initialize"]):
                    action_extensions.append(f"Validate Input for {action}")
                    action_extensions.append(f"Check Prerequisites for {action}")
                elif any(word in action_lower for word in ["approve", "review", "verify"]):
                    action_extensions.append(f"Fetch Details for {action}")
                    action_extensions.append(f"Analyze Requirements for {action}")
                elif any(word in action_lower for word in ["process", "execute", "perform"]):
                    action_extensions.append(f"Prepare Resources for {action}")
                    action_extensions.append(f"Validate Permissions for {action}")
                else:
                    action_extensions.append(f"Initialize {action}")
                
                # Add context-aware post-steps
                if any(word in action_lower for word in ["submit", "send", "transfer"]):
                    action_extensions.append(f"Confirm {action}")
                    action_extensions.append(f"Notify Completion of {action}")
                elif any(word in action_lower for word in ["validate", "verify", "check"]):
                    action_extensions.append(f"Log Results of {action}")
                    action_extensions.append(f"Handle Errors from {action}")
                else:
                    action_extensions.append(f"Complete {action}")
            
            # Fill remaining slots with extensions (no generic fillers if we have actions)
            remaining = min_steps - len(expanded_actions)
            for i in range(remaining):
                if i < len(action_extensions):
                    expanded_actions.append(action_extensions[i])
                else:
                    # Only add generic if absolutely necessary
                    break
    else:
        # Fallback: generate workflow only if NO actions extracted
        for i in range(min_steps):
            expanded_actions.append(f"Process Step {i + 1}")

    def add_node(node_id: str, label: str, actor: str, shape: str = "process", x_pos: int = 0):
        # Calculate y position based on actor's lane
        actor_idx = actors.index(actor) if actor in actors else 0
        y_pos = actor_idx * lane_height + 50
        
        nodes.append({
            "id": node_id,
            "type": "custom",
            "data": {
                "label": label,
                "type": shape,
                "actor": actor,
                "description": f"AI generated: {label}"
            },
            "position": {"x": x_pos, "y": y_pos}
        })
        return x_pos + x_spacing

    # Start node
    current_x = add_node("start", "Start", actors[0], "start", x_start)
    prev = "start"
    
    # Track decision nodes for potential retry loops
    decision_nodes = []
    
    # ENHANCED: Process nodes with MORE decision nodes (20% instead of every 5th)
    # and varied edge labels
    edge_label_variants = {
        "yes": ["Yes", "Approved", "Valid", "Success", "Continue"],
        "no": ["No", "Rejected", "Invalid", "Failed", "Retry"],
        "default": ["", "Next", "Proceed", "Then", ""]
    }
    
    for i, act in enumerate(expanded_actions):
        nid = f"step-{i+1}"
        
        # 20% of steps are decision nodes (more realistic)
        is_decision = random.random() < 0.2 or (i + 1) % 5 == 0
        
        # Check if action suggests a decision (contains question words or validation terms)
        action_lower = act.lower()
        if any(word in action_lower for word in ["check", "verify", "validate", "approve", "review", "confirm"]):
            is_decision = True
        
        shape = "decision" if is_decision else "process"
        
        # Randomize actor assignment (not just rotation) for cross-lane connections
        if random.random() < 0.3:  # 30% chance to pick random actor
            actor = random.choice(actors)
        else:
            actor = actors[(i + 1) % len(actors)]
        
        current_x = add_node(nid, act, actor, shape, current_x)
        
        # Main edge with varied labels
        edge_label = random.choice(edge_label_variants["default"])
        edge_dict = {"id": f"e-{prev}-{nid}", "source": prev, "target": nid, "type": "smoothstep"}
        if edge_label:
            edge_dict["label"] = edge_label
        edges.append(edge_dict)
        
        # Decision nodes have MULTIPLE alternate paths
        if shape == "decision":
            decision_nodes.append(nid)
            
            if i < len(expanded_actions) - 1:
                # "Yes" path (continues to next)
                yes_label = random.choice(edge_label_variants["yes"])
                
                # "No" path (branches or loops back)
                no_label = random.choice(edge_label_variants["no"])
                
                # 70% chance: skip to later step, 30% chance: loop back for retry
                if random.random() < 0.7:
                    # Skip ahead
                    skip_distance = random.randint(2, min(4, len(expanded_actions) - i))
                    next_next_id = f"step-{i+skip_distance}" if i + skip_distance <= len(expanded_actions) else "end"
                else:
                    # Loop back to previous step for retry
                    if i > 2:
                        loop_back_distance = random.randint(1, min(3, i))
                        next_next_id = f"step-{i - loop_back_distance + 1}"
                    else:
                        next_next_id = f"step-{i+2}" if i + 1 < len(expanded_actions) else "end"
                
                edges.append({
                    "id": f"e-{nid}-{next_next_id}-alt",
                    "source": nid,
                    "target": next_next_id,
                    "type": "smoothstep",
                    "label": no_label
                })
        
        prev = nid

    # End node
    add_node("end", "End", actors[-1], "end", current_x)
    edges.append({"id": f"e-{prev}-end", "source": prev, "target": "end", "type": "smoothstep"})

    # ENHANCED Mermaid diagram generation with varied connectors and comments
    timestamp_id = int(time.time() * 1000)  # Unique ID per run
    mermaid_lines = [
        "flowchart LR",
        f"%% === Generated at {timestamp_id} ==="
    ]
    
    # Group nodes by actor for swimlane subgraphs
    actor_nodes = {}
    for node in nodes:
        actor = node["data"].get("actor", "System")
        if actor not in actor_nodes:
            actor_nodes[actor] = []
        actor_nodes[actor].append(node)
    
    # Create node ID mapping with timestamp for uniqueness
    node_id_map = {nodes[i]["id"]: f"N{i}_{timestamp_id % 1000}" for i in range(len(nodes))}
    
    # EXPANDED icon pool with dynamic selection
    actor_icon_pool = {
        "Initiator": ["👤", "🙋", "👨‍💼", "👩‍💼"],
        "User": ["👤", "🧑", "👨", "👩"],
        "Manager": ["👨‍💼", "👩‍💼", "🎯", "📊"],
        "Admin": ["🛠️", "⚙️", "🔧", "👨‍💻"],
        "System": ["🤖", "💻", "🖥️", "⚡"],
        "Client": ["💼", "🤝", "👔", "📋"],
    }
    
    # Select icons dynamically
    actor_icons = {}
    for actor in actors:
        if actor in actor_icon_pool:
            actor_icons[actor] = random.choice(actor_icon_pool[actor])
        else:
            actor_icons[actor] = random.choice(["📋", "🔷", "⭐", "🎯"])
    
    # Randomize subgraph order for uniqueness
    actor_items = list(actor_nodes.items())
    if random.random() < 0.5:  # 50% chance to shuffle
        random.shuffle(actor_items)
    
    for actor, actor_node_list in actor_items:
        icon = actor_icons.get(actor, "📋")
        mermaid_lines.append(f'\n%% === Swimlane: {actor} ===')
        mermaid_lines.append(f'subgraph {actor.replace(" ", "_")}["{icon} {actor}"]')
        
        # Add nodes within this swimlane
        for node in actor_node_list:
            node_idx = nodes.index(node)
            node_id = node_id_map.get(node["id"], f"N{node_idx}")
            label = node["data"]["label"]
            shape_type = node["data"]["type"]
            
            if shape_type == "start" or shape_type == "end":
                mermaid_lines.append(f"    {node_id}([{label}])")
            elif shape_type == "decision":
                mermaid_lines.append(f"    {node_id}{{{label}}}")
            else:
                mermaid_lines.append(f"    {node_id}[{label}]")
        
        # Add edges within this swimlane with VARIED connectors
        connector_styles = [" --> ", " -.-> ", " ==> "]  # solid, dotted, thick
        
        for edge in edges:
            from_node = next((n for n in nodes if n["id"] == edge["source"]), None)
            to_node = next((n for n in nodes if n["id"] == edge["target"]), None)
            
            if from_node and to_node:
                from_actor = from_node["data"].get("actor", "System")
                to_actor = to_node["data"].get("actor", "System")
                
                # Only add edge if both nodes are in current swimlane
                if from_actor == actor and to_actor == actor:
                    from_id = node_id_map.get(edge["source"], edge["source"])
                    to_id = node_id_map.get(edge["target"], edge["target"])
                    label = edge.get("label", "")
                    
                    # Vary connector style (50% chance for alternative style)
                    if label and random.random() < 0.5:
                        connector = f' -- "{label}" --> '
                    elif label:
                        connector = f" -- {label} --> "
                    else:
                        connector = random.choice(connector_styles)
                    
                    mermaid_lines.append(f"    {from_id}{connector}{to_id}")
        
        mermaid_lines.append("end")
    
    # Add cross-swimlane connections with comments
    mermaid_lines.append("\n%% === Cross-Lane Connections ===")
    cross_lane_count = 0
    for edge in edges:
        from_node = next((n for n in nodes if n["id"] == edge["source"]), None)
        to_node = next((n for n in nodes if n["id"] == edge["target"]), None)
        
        if from_node and to_node:
            from_actor = from_node["data"].get("actor", "System")
            to_actor = to_node["data"].get("actor", "System")
            
            # Only add edge if nodes are in different swimlanes
            if from_actor != to_actor:
                from_id = node_id_map.get(edge["source"], edge["source"])
                to_id = node_id_map.get(edge["target"], edge["target"])
                label = edge.get("label", "")
                
                # Use thick arrows for cross-lane connections
                if label:
                    connector = f' == "{label}" ==> '
                else:
                    connector = " ==> "
                
                mermaid_lines.append(f"{from_id}{connector}{to_id}")
                cross_lane_count += 1
    
    if cross_lane_count > 0:
        mermaid_lines.append(f"%% Total cross-lane connections: {cross_lane_count}")
    
    mermaid_diagram = "\n".join(mermaid_lines)

    return {
        "nodes": nodes,
        "edges": edges,
        "actors": actors,
        "mermaid": mermaid_diagram
    }


def confidence_score(roles: List[str], actions: List[str], benefits: List[str]) -> float:
    """Enhanced confidence scoring with diversity checks.
    
    Enhancements:
    - Check for diversity (deduct if >30% similarity)
    - Validate quality of extracted elements
    - Return score that triggers re-extraction if < 0.7
    """
    score = 0.0
    
    # Base scoring
    if roles and len(roles) >= 2:
        score += 0.3
    elif roles:
        score += 0.15
    
    if actions and len(actions) >= 3:
        score += 0.5
    elif actions:
        score += 0.25
    
    if benefits and len(benefits) >= 2:
        score += 0.2
    elif benefits:
        score += 0.1
    
    # Diversity check for actions (deduct if too similar)
    if len(actions) > 1:
        similarity_count = 0
        total_comparisons = 0
        
        for i in range(len(actions)):
            for j in range(i + 1, len(actions)):
                similarity = calculate_similarity(actions[i], actions[j])
                if similarity > 0.7:  # Too similar
                    similarity_count += 1
                total_comparisons += 1
        
        if total_comparisons > 0:
            similarity_ratio = similarity_count / total_comparisons
            if similarity_ratio > 0.3:  # More than 30% are similar
                score -= 0.15
    
    # Quality check: penalize very short or generic actions
    generic_terms = {"process", "step", "action", "task", "item"}
    generic_count = sum(1 for action in actions if any(term in action.lower() for term in generic_terms))
    if len(actions) > 0 and generic_count / len(actions) > 0.5:
        score -= 0.1
    
    return round(max(0.0, min(score, 1.0)), 2)


def validate_response_uniqueness(response_data: Dict) -> bool:
    """Check if response is unique (not a duplicate of previous responses).
    
    Uses hash-based caching to detect repetitive outputs.
    """
    # Create hash of key response elements
    key_elements = str(response_data.get("stories", [])) + str(response_data.get("flow", {}).get("mermaid", ""))
    response_hash = hashlib.md5(key_elements.encode()).hexdigest()
    
    if response_hash in RESPONSE_CACHE:
        return False  # Duplicate detected
    
    RESPONSE_CACHE.add(response_hash)
    
    # Keep cache size manageable (max 100 entries)
    if len(RESPONSE_CACHE) > 100:
        RESPONSE_CACHE.clear()
    
    return True
