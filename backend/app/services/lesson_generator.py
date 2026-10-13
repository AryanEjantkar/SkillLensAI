"""Universal Lesson Generation Service for SkillLens AI."""

import logging
from typing import Any, Dict, Optional

from backend.app.schemas.lesson import (
    LessonPlan,
    LessonSection,
    VisualizationSpec,
    WorkedExample,
    WorkedExampleStep,
    FlashcardItem,
    QuizItem,
    QuizOption,
    LessonMetadata,
    DifficultyLevel,
    SubjectCategory,
    VisualizationType,
)
from backend.app.services.provider_router import router

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are SkillLens AI, a world-class educational technology architect, interactive pedagogue, and senior subject matter expert.
Your goal is to construct a rigorous, engaging, and universally structured lesson plan for ANY topic requested by the student.

You MUST respond strictly with a valid JSON object matching the requested schema. No code fences outside the json, no markdown preamble.

### SUBJECTS AND VISUALIZATION TYPES
Classify the subject into one of:
- mathematics (types: math_graph, calculus_graph, probability_distribution, worked_example)
- physics (types: physics_simulation, math_graph, worked_example)
- chemistry (types: chemistry_reaction, concept_map, worked_example)
- biology (types: biology_process, concept_map)
- computer_science (types: algorithm_visualizer, system_architecture, concept_map)
- economics (types: economics_market, comparison_matrix, concept_map)
- law (types: timeline_flow, comparison_matrix, concept_map)
- arts_humanities (types: timeline_flow, concept_map, comparison_matrix)
- general (types: concept_map, comparison_matrix, worked_example)

### CRITICAL RULES FOR VISUALIZATION DATA
1. DO NOT GENERATE EXECUTABLE CODE (no javascript, no eval, no html, no python).
2. ONLY generate safe declarative JSON properties tailored to the chosen visualization type:
   - math_graph / calculus_graph:
     {
       "function_type": "polynomial|trig|exponential|rational",
       "formula": "f(x) = x^2 - 4",
       "parameters": [{"name": "a", "label": "Coefficient a", "min": -5, "max": 5, "step": 0.5, "default": 1}],
       "x_range": [-10, 10],
       "y_range": [-10, 10],
       "tangent_point": 1.0,
       "integral_range": [0, 2],
       "riemann_n": 8,
       "annotations": [{"x": 0, "y": -4, "label": "Vertex (0, -4)"}]
     }
   - physics_simulation:
     {
       "sim_type": "projectile|harmonic_oscillator|pendulum|circuit",
       "parameters": [
         {"name": "velocity", "label": "Initial Velocity (m/s)", "min": 5, "max": 60, "step": 1, "default": 25, "unit": "m/s"},
         {"name": "angle", "label": "Launch Angle (deg)", "min": 10, "max": 85, "step": 5, "default": 45, "unit": "°"},
         {"name": "gravity", "label": "Gravity (m/s²)", "min": 1.6, "max": 25, "step": 0.1, "default": 9.8, "unit": "m/s²"}
       ],
       "readouts": ["max_height", "range", "flight_time"],
       "guidance": "Observe how changing the launch angle affects maximum range."
     }
   - chemistry_reaction:
     {
       "reaction_name": "Esterification of Acetic Acid and Ethanol",
       "equation": "CH3COOH + C2H5OH <=> CH3COOC2H5 + H2O",
       "steps": [
         {"step": 1, "title": "Protonation", "description": "Acid catalyst protonates carbonyl oxygen", "energy_kj": 45},
         {"step": 2, "title": "Nucleophilic Attack", "description": "Ethanol oxygen attacks carbonyl carbon", "energy_kj": 85},
         {"step": 3, "title": "Proton Transfer", "description": "Proton transfers to OH group forming leaving group", "energy_kj": 60},
         {"step": 4, "title": "Elimination & Deprotonation", "description": "Water leaves and ester is formed", "energy_kj": 20}
       ],
       "activation_energy": 85,
       "enthalpy_delta": -15
     }
   - biology_process:
     {
       "process_name": "Cellular Respiration - Mitochondria",
       "stages": [
         {"stage": 1, "name": "Glycolysis", "location": "Cytoplasm", "inputs": ["Glucose", "2 ATP"], "outputs": ["2 Pyruvate", "4 ATP", "2 NADH"], "description": "Breakdown of glucose into pyruvate"},
         {"stage": 2, "name": "Krebs Cycle", "location": "Mitochondrial Matrix", "inputs": ["Acetyl-CoA", "NAD+", "FAD"], "outputs": ["CO2", "NADH", "FADH2", "ATP"], "description": "Oxidation of acetyl group yielding high-energy carriers"},
         {"stage": 3, "name": "Electron Transport Chain", "location": "Inner Mitochondrial Membrane", "inputs": ["NADH", "FADH2", "O2"], "outputs": ["H2O", "30-32 ATP"], "description": "Proton gradient drives ATP synthase"}
       ],
       "hotspots": [
         {"id": "hs-1", "x": 30, "y": 40, "label": "Outer Membrane", "detail": "Permeable to small molecules"},
         {"id": "hs-2", "x": 60, "y": 55, "label": "Matrix", "detail": "Site of Krebs cycle enzymes"}
       ]
     }
   - algorithm_visualizer:
     {
       "algorithm_name": "Binary Search",
       "category": "Searching",
       "complexity": {"time": "O(log n)", "space": "O(1)"},
       "initial_array": [2, 5, 8, 12, 16, 23, 38, 56, 72, 91],
       "target_value": 23,
       "pseudocode": [
         "low = 0, high = n - 1",
         "while low <= high:",
         "    mid = (low + high) // 2",
         "    if arr[mid] == target: return mid",
         "    elif arr[mid] < target: low = mid + 1",
         "    else: high = mid - 1",
         "return -1"
       ],
       "trace_steps": [
         {"step": 1, "low": 0, "high": 9, "mid": 4, "val": 16, "explanation": "Target 23 > 16, search right half", "highlight_line": 4},
         {"step": 2, "low": 5, "high": 9, "mid": 7, "val": 56, "explanation": "Target 23 < 56, search left half", "highlight_line": 5},
         {"step": 3, "low": 5, "high": 6, "mid": 5, "val": 23, "explanation": "Target 23 found at index 5!", "highlight_line": 3}
       ]
     }
   - economics_market:
     {
       "market_title": "Market for Electric Vehicles",
       "base_equilibrium": {"price": 35000, "quantity": 1000},
       "demand_curve": {"intercept": 70000, "slope": -35},
       "supply_curve": {"intercept": 5000, "slope": 30},
       "shifters": [
         {"name": "subsidy", "label": "Government Subsidy ($)", "min": -5000, "max": 10000, "default": 0, "affects": "supply"},
         {"name": "battery_tech", "label": "Technology Advancements", "min": 0, "max": 20, "default": 0, "affects": "supply"}
       ]
     }
   - concept_map:
     {
       "nodes": [
         {"id": "n1", "label": "Central Concept", "group": "core", "description": "Core foundation"},
         {"id": "n2", "label": "Component A", "group": "sub", "description": "First pillar"},
         {"id": "n3", "label": "Component B", "group": "sub", "description": "Second pillar"}
       ],
       "links": [
         {"source": "n1", "target": "n2", "label": "regulates"},
         {"source": "n1", "target": "n3", "label": "produces"}
       ]
     }
   - timeline_flow:
     {
       "events": [
         {"date": "Era 1", "title": "Milestone A", "description": "Historical context", "significance": "Pioneering foundation"},
         {"date": "Era 2", "title": "Milestone B", "description": "Precedent established", "significance": "Transformative shift"}
       ]
     }
   - comparison_matrix:
     {
       "items": ["Approach A", "Approach B"],
       "criteria": [
         {"name": "Efficiency", "values": ["High", "Medium"], "notes": "Trade-off analysis"},
         {"name": "Cost", "values": ["Low", "High"], "notes": "Resource requirements"}
       ]
     }

3. NEVER claim every subject has a scientifically exact simulation; for non-physics/math topics, concept maps or timelines provide the most transparent educational value.
"""

import re


def sanitize_topic_title(prompt: str) -> str:
    """Clean conversational user query into a clean, focused topic title."""
    cleaned = prompt.strip()
    patterns = [
        r"^(?:can\s+you\s+)?(?:please\s+)?explain\s+(?:to\s+me\s+)?(?:about\s+)?",
        r"^(?:tell\s+me\s+(?:about\s+)?|what\s+is\s+|what\s+are\s+|how\s+does\s+|teach\s+me\s+(?:about\s+)?)",
        r"^(?:i\s+want\s+to\s+learn\s+(?:about\s+)?)",
        r"^(?:give\s+me\s+(?:a\s+lesson\s+on\s+|an\s+overview\s+of\s+))",
    ]
    for pat in patterns:
        cleaned = re.sub(pat, "", cleaned, flags=re.IGNORECASE).strip()

    if cleaned:
        cleaned = cleaned[0].upper() + cleaned[1:]
    return cleaned if cleaned else prompt.strip()


class UniversalLessonGenerator:
    """Generates structured educational lessons across any subject."""

    def __init__(self) -> None:
        pass

    def generate_lesson(
        self,
        topic: str,
        difficulty: DifficultyLevel = "intermediate",
        provider_name: Optional[str] = None,
        context_text: Optional[str] = None,
        source_type: str = "text",
    ) -> LessonPlan:
        """Create a complete validated interactive lesson plan."""
        provider = router.get_provider(provider_name)

        user_prompt = f"""Generate a comprehensive interactive lesson plan for:
Topic: {topic}
Target Difficulty: {difficulty}
Source Context Type: {source_type}
"""
        if context_text and context_text.strip():
            user_prompt += f"\nExtracted Reference Material:\n{context_text.strip()[:15000]}\n"

        user_prompt += """
Respond with a single JSON object matching this structure:
{
  "topic": string,
  "subject": "mathematics"|"physics"|"chemistry"|"biology"|"computer_science"|"economics"|"law"|"arts_humanities"|"general",
  "subtopic": string,
  "difficulty": "beginner"|"intermediate"|"advanced",
  "teaching_method": string,
  "learning_objectives": [string, ...],
  "sections": [
    {
      "title": string,
      "content": string (detailed educational breakdown with bold terms and key formulas/examples),
      "key_concepts": [string, ...],
      "analogies": [string, ...]
    }
  ],
  "visualization": {
    "type": "math_graph"|"calculus_graph"|"physics_simulation"|"chemistry_reaction"|"biology_process"|"algorithm_visualizer"|"economics_market"|"probability_distribution"|"system_architecture"|"timeline_flow"|"concept_map"|"comparison_matrix"|"worked_example",
    "title": string,
    "description": string,
    "data": object (valid declarative data)
  },
  "worked_examples": [
    {
      "problem": string,
      "steps": [
        {"step_number": 1, "instruction": string, "formula_or_code": string|null, "explanation": string}
      ],
      "final_answer": string
    }
  ],
  "flashcards": [
    {"question": string, "answer": string, "key_term": string}
  ],
  "quiz": [
    {
      "question": string,
      "options": [{"key": "A", "text": string}, {"key": "B", "text": string}, {"key": "C", "text": string}, {"key": "D", "text": string}],
      "correct_answer": "A"|"B"|"C"|"D",
      "explanation": string
    }
  ],
  "hints": [string, ...],
  "suggested_followups": [string, ...],
  "sources": [string, ...]
}
"""

        try:
            raw_json = provider.generate_json(prompt=user_prompt, system_instruction=SYSTEM_PROMPT)
            return self._validate_and_sanitize(raw_json, topic, difficulty, provider.provider_name, provider.model_name)
        except Exception as error:
            logger.warning("Dynamic lesson generation via provider failed: %s. Constructing emergency pedagogical lesson.", error)
            # Fallback to robust pedagogical template if AI provider fails or malformed
            return self._create_fallback_lesson(topic, difficulty, provider.provider_name, provider.model_name, str(error))

    def _validate_and_sanitize(
        self,
        raw_json: Dict[str, Any],
        original_topic: str,
        difficulty: DifficultyLevel,
        provider_name: str,
        model_name: str,
    ) -> LessonPlan:
        """Sanitize raw json and validate against LessonPlan schema."""
        model_topic = raw_json.get("topic")
        if not model_topic or len(str(model_topic).strip()) < 3:
            raw_json["topic"] = sanitize_topic_title(original_topic)
        raw_json.setdefault("difficulty", difficulty)

        # Ensure metadata is added
        raw_json["metadata"] = {
            "provider": provider_name,
            "model": model_name,
            "is_fallback_simulation": False,
            "disclaimer": "AI-generated educational content is designed for learning and exploration; inspect source materials to verify specialized applications.",
        }

        # Check visualization
        vis = raw_json.get("visualization")
        if not isinstance(vis, dict) or not vis.get("type"):
            clean_t = sanitize_topic_title(original_topic)
            raw_json["visualization"] = {
                "type": "concept_map",
                "title": f"Core Conceptual Structure: {clean_t}",
                "description": "Interactive conceptual hierarchy illustrating core relationships.",
                "data": {
                    "nodes": [
                        {"id": "n1", "label": clean_t[:25], "group": "core", "description": "Central topic"},
                        {"id": "n2", "label": "Key Principles", "group": "sub", "description": "Foundational rules"},
                        {"id": "n3", "label": "Applications", "group": "sub", "description": "Practical scenarios"},
                    ],
                    "links": [
                        {"source": "n1", "target": "n2", "label": "governed by"},
                        {"source": "n1", "target": "n3", "label": "applied in"},
                    ],
                },
            }
            raw_json["metadata"]["is_fallback_simulation"] = True

        return LessonPlan.model_validate(raw_json)

    def _create_fallback_lesson(
        self,
        topic: str,
        difficulty: DifficultyLevel,
        provider_name: str,
        model_name: str,
        reason: str,
    ) -> LessonPlan:
        """Emergency safe lesson generator when external API is unreachable or returns malformed response."""
        clean_topic = sanitize_topic_title(topic)
        lower_t = topic.lower()

        # Domain-aware fallback construction
        if any(w in lower_t for w in ["python", "assembly", "language", "code", "programming", "hardware", "c++", "java", "compiler"]):
            subject = "computer_science"
            subtopic = "Language Abstraction & Architecture"
            vis = VisualizationSpec(
                type="comparison_matrix",
                title=f"Comparison: High-Level vs. Low-Level Languages",
                description="Comparative matrix detailing abstraction, hardware control, speed, and development ergonomics for Python vs Assembly.",
                data={
                    "dimension": "Language Hierarchy",
                    "items": [
                        {
                            "name": "Python (High-Level)",
                            "category": "Interpreted / Abstracted",
                            "features": {
                                "Abstraction Level": "High (Human-readable, hardware independent)",
                                "Hardware Control": "Managed via OS and Python runtime",
                                "Execution Speed": "Moderate (Bytecode interpreted in VM)",
                                "Developer Speed": "Extremely Fast & Expressive",
                                "Memory Management": "Automated (Garbage collected)",
                            },
                        },
                        {
                            "name": "Assembly (Low-Level)",
                            "category": "Machine-Adjacent Mnemonics",
                            "features": {
                                "Abstraction Level": "Low (Direct 1:1 translation to CPU opcodes)",
                                "Hardware Control": "Full (Direct registers, stack & memory addressing)",
                                "Execution Speed": "Maximum native execution speed",
                                "Developer Speed": "Slow, highly verbose, architecture-specific",
                                "Memory Management": "Manual (Explicit load/store instructions)",
                            },
                        },
                    ],
                },
            )
            sections = [
                LessonSection(
                    title="Introduction to Abstraction in Programming",
                    content="In computer science, programming languages are primarily categorized by their **level of abstraction** away from raw computer hardware.\n\n* **High-Level Languages** (like **Python**) prioritize human developer productivity and clear syntax, hiding CPU registers, memory pointers, and instruction pipelines.\n* **Low-Level Languages** (like **Assembly**) provide direct, granular control over processor registers and memory, at the cost of steep complexity and lack of portability.",
                    key_concepts=["Abstraction Barrier", "Hardware Independence", "Instruction Set Architecture (ISA)"],
                    analogies=["A high-level language is like driving an automatic car with a steering wheel and pedals; assembly language is like manually adjusting fuel injectors and pistons inside the engine cylinder while driving."],
                ),
                LessonSection(
                    title="Where Python and Assembly Fall & Why",
                    content="### 1. Python is a High-Level Language\nPython code (`print('Hello')`) cannot run directly on a CPU. Instead, the **Python Interpreter** translates source code into bytecode, which runs on the Python Virtual Machine (PVM). Developers never manipulate memory addresses or hardware registers.\n\n### 2. Assembly is a Low-Level Language\nAssembly uses mnemonic instructions (such as `MOV`, `ADD`, `PUSH`, `JMP`) that represent the exact machine code instructions of a specific CPU architecture (x86, ARM, RISC-V). An **Assembler** translates these directly into binary 0s and 1s without abstraction.",
                    key_concepts=["Interpreted Bytecode vs Native Opcodes", "Direct Register Manipulation", "Cross-Platform Portability"],
                    analogies=[],
                ),
            ]
        elif any(w in lower_t for w in ["force", "newton", "gravity", "motion", "mechanics", "velocity", "friction", "acceleration"]):
            subject = "physics"
            subtopic = "Classical Mechanics"
            vis = VisualizationSpec(
                type="physics_simulation",
                title=f"Dynamic Mechanics Simulation: {clean_topic}",
                description="Interactive mechanics simulation displaying velocity, acceleration vectors, and governing forces.",
                data={
                    "type": "projectile",
                    "parameters": {"initialVelocity": 25, "launchAngle": 45, "gravity": 9.8, "mass": 1.0},
                },
            )
            sections = [
                LessonSection(
                    title=f"Core Physical Principles of {clean_topic}",
                    content=f"When analyzing **{clean_topic}**, governing conservation laws and dynamical equations dictate how physical systems evolve under active forces.",
                    key_concepts=["Vector Quantities", "Conservation Laws", "Dynamic Equilibrium"],
                    analogies=[],
                ),
            ]
        else:
            subject = "general"
            subtopic = "Fundamental Overview"
            vis = VisualizationSpec(
                type="concept_map",
                title=f"Conceptual Structure: {clean_topic}",
                description="Interactive node hierarchy showing the components and interconnections of this topic.",
                data={
                    "nodes": [
                        {"id": "n1", "label": clean_topic[:25], "group": "core", "description": f"The overarching study domain of {clean_topic}."},
                        {"id": "n2", "label": "Governing Principles", "group": "sub", "description": "First-principles definitions and governing assumptions."},
                        {"id": "n3", "label": "Operational Mechanics", "group": "sub", "description": "Operational dynamics and step-by-step transformations."},
                        {"id": "n4", "label": "Practical Applications", "group": "sub", "description": "Real-world implementations, experiments, and case studies."},
                    ],
                    "links": [
                        {"source": "n1", "target": "n2", "label": "governed by"},
                        {"source": "n1", "target": "n3", "label": "operates via"},
                        {"source": "n3", "target": "n4", "label": "manifests in"},
                    ],
                },
            )
            sections = [
                LessonSection(
                    title=f"Introduction to {clean_topic}",
                    content=f"**{clean_topic}** is an essential subject of study. Grasping how fundamental components interact helps clarify broader behaviors and theoretical dynamics.",
                    key_concepts=[f"{clean_topic} Foundations", "Core Dynamics"],
                    analogies=[],
                ),
            ]

        return LessonPlan(
            topic=clean_topic,
            subject=subject,
            subtopic=subtopic,
            difficulty=difficulty,
            teaching_method="Conceptual Exploration",
            learning_objectives=[
                f"Master core terminology and definitions of {clean_topic}",
                f"Understand underlying mechanisms and relationships",
                f"Apply theoretical insights to practical problem solving",
            ],
            sections=sections,
            visualization=vis,
            worked_examples=[
                WorkedExample(
                    problem=f"Analyze a standard scenario involving {topic}.",
                    steps=[
                        WorkedExampleStep(step_number=1, instruction="Identify given variables and system constraints.", explanation="Clear boundary conditions prevent misinterpretation."),
                        WorkedExampleStep(step_number=2, instruction="Apply governing principles to relate knowns to unknowns.", explanation="Connect theory to observed metrics."),
                        WorkedExampleStep(step_number=3, instruction="Synthesize findings and verify sanity check.", explanation="Ensure units and magnitude align with expected values."),
                    ],
                    final_answer=f"Verified theoretical conclusion for {topic}.",
                )
            ],
            flashcards=[
                FlashcardItem(
                    question=f"What is the foundational definition of {topic}?",
                    answer=f"The structured study and application of core principles governing {topic}.",
                    key_term=topic,
                ),
                FlashcardItem(
                    question=f"Why is {topic} significant?",
                    answer="It provides predictable models and frameworks for understanding complex systems.",
                    key_term="Significance",
                ),
            ],
            quiz=[
                QuizItem(
                    question=f"Which principle best describes the primary framework of {topic}?",
                    options=[
                        QuizOption(key="A", text="It follows systematic, reproducible rules and interactions"),
                        QuizOption(key="B", text="It operates purely by random chance with no governing structure"),
                        QuizOption(key="C", text="It has been proven obsolete in modern science and practice"),
                        QuizOption(key="D", text="It only applies in hypothetical, non-physical contexts"),
                    ],
                    correct_answer="A",
                    explanation=f"A systematic and structured approach forms the cornerstone of {topic}.",
                )
            ],
            hints=[
                f"Focus on the primary relationships between elements in {topic}.",
                "Break down complex steps into small, manageable stages.",
            ],
            suggested_followups=[
                f"How does {topic} behave under extreme boundary conditions?",
                f"What are the historical origins of {topic}?",
                f"Can you explain {topic} using a simpler analogy?",
            ],
            sources=["Curriculum standards", "Foundational academic literature"],
            metadata=LessonMetadata(
                provider=provider_name,
                model=model_name,
                is_fallback_simulation=True,
                disclaimer=f"Generated fallback lesson (Note: AI service response error: {reason[:100]}).",
            ),
        )


lesson_generator = UniversalLessonGenerator()
