# backend/app/services/prompt_builder.py
"""
Prompt Builder Service.
Single Responsibility: Formulates structured, deterministic prompts for learning material generation.
"""


class PromptBuilder:
    """Builds structured prompts instructing the AI model to return valid JSON learning content."""

    @staticmethod
    def build_analysis_prompt(content: str) -> str:
        """Constructs a prompt requesting a full learning breakdown: title, summary, explanation, flashcards, quiz."""
        return f"""You are SkillLens AI, an expert educational tutor.
Analyze the following educational content and produce comprehensive, high-quality learning material.

SOURCE CONTENT:
\"\"\"
{content}
\"\"\"

RESPONSE REQUIREMENTS:
You MUST respond with valid JSON only. Do not include markdown code fences, commentary, or text outside the JSON object.
The JSON must adhere strictly to this schema:
{{
  "title": "A concise, engaging title for this topic",
  "summary": "A concise summary highlighting the core takeaways (2-4 paragraphs)",
  "explanation": "A beginner-friendly, detailed explanation breaking down complex concepts step-by-step",
  "flashcards": [
    {{
      "question": "Clear, specific question testing a key concept",
      "answer": "Direct, informative answer"
    }}
  ],
  "quiz": [
    {{
      "question": "Challenging multiple-choice question testing understanding",
      "options": [
        "First option",
        "Second option",
        "Third option",
        "Fourth option"
      ],
      "correct_answer": 0,
      "explanation": "Detailed explanation of why this option is correct and others are not"
    }}
  ]
}}

CRITICAL CONSTRAINTS:
1. Provide between 3 and 8 high-yield flashcards.
2. Provide between 2 and 5 multiple-choice questions with 4 options each.
3. "correct_answer" MUST be a zero-based integer index (0, 1, 2, or 3) referencing the correct item in "options".
4. Ensure valid JSON syntax without trailing commas.
"""

    @staticmethod
    def build_flashcards_prompt(content: str) -> str:
        """Constructs a prompt specifically for flashcard extraction."""
        return f"""You are SkillLens AI, an expert educational tutor.
Extract key learning flashcards from the provided source text.

SOURCE CONTENT:
\"\"\"
{content}
\"\"\"

RESPONSE REQUIREMENTS:
Respond with valid JSON only conforming to:
{{
  "flashcards": [
    {{
      "question": "Clear question testing a key term or concept",
      "answer": "Precise, accurate answer"
    }}
  ]
}}

Generate 4 to 10 relevant flashcards.
"""

    @staticmethod
    def build_quiz_prompt(content: str) -> str:
        """Constructs a prompt specifically for multiple-choice quiz generation."""
        return f"""You are SkillLens AI, an expert educational tutor.
Create multiple-choice assessment questions based on the provided text.

SOURCE CONTENT:
\"\"\"
{content}
\"\"\"

RESPONSE REQUIREMENTS:
Respond with valid JSON only conforming to:
{{
  "quiz": [
    {{
      "question": "Question testing conceptual understanding",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correct_answer": 0,
      "explanation": "Why this answer is correct"
    }}
  ]
}}

Generate 3 to 6 questions. "correct_answer" must be a zero-based integer index pointing to the correct option.
"""
