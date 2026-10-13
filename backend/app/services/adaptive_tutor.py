"""Adaptive AI Tutor service for contextual Socratic learning."""

import logging
from typing import List, Optional

from backend.app.schemas.lesson import (
    DifficultyLevel,
    QuizItem,
    QuizOption,
    FlashcardItem,
    TutorChatResponse,
    PracticeResponse,
    MoreFlashcardsResponse,
)
from backend.app.services.provider_router import router

logger = logging.getLogger(__name__)

TUTOR_SYSTEM_PROMPT = """You are the SkillLens Adaptive AI Tutor.
Your pedagogical principles:
1. Socratic Guidance: Provide guided hints, analogies, and questions before giving outright answers.
2. Context Awareness: Always anchor your explanations in the current lesson topic and student difficulty level.
3. Misconception Detection: Explicitly diagnose misconceptions when the student gives incorrect or partial reasoning.
4. Transparency: State that model-generated answers are fallible and encourage checking reliable sources. Never claim definitive student mastery without extensive empirical evidence.
5. Adaptive Level:
   - beginner: Use vivid analogies, simple vocabulary, step-by-step intuition, no jargon without definitions.
   - intermediate: Balance rigor, formulas, terminology, and practical examples.
   - advanced: Deep theoretical depth, edge cases, mathematical or formal derivations, and literature context.

Respond in JSON format:
{
  "response": "Detailed, encouraging Socratic explanation in markdown",
  "hints": ["Hint 1", "Hint 2"],
  "detected_misconceptions": ["Misconception notes if any, else empty"],
  "suggested_followups": ["Question 1", "Question 2"]
}
"""


class AdaptiveTutorService:
    """Provides adaptive Socratic tutoring, diagnostic feedback, and dynamic practice."""

    def chat(
        self,
        topic: str,
        user_message: str,
        difficulty: DifficultyLevel = "intermediate",
        lesson_summary: Optional[str] = None,
        history: Optional[List[dict]] = None,
        provider_name: Optional[str] = None,
    ) -> TutorChatResponse:
        """Handle student question or answer evaluation."""
        provider = router.get_provider(provider_name)

        formatted_history = ""
        if history:
            formatted_history = "\nRecent Conversation:\n" + "\n".join(
                f"{msg.get('role', 'user')}: {msg.get('content', '')}" for msg in history[-6:]
            )

        prompt = f"""Topic: {topic}
Difficulty: {difficulty}
Lesson Context: {lesson_summary or 'General subject study'}
{formatted_history}

Student: {user_message}

Provide adaptive tutoring feedback. Detect any misconceptions and give progressive hints.
"""

        try:
            raw_json = provider.generate_json(prompt=prompt, system_instruction=TUTOR_SYSTEM_PROMPT)
            return TutorChatResponse(
                response=raw_json.get("response", "Let's explore this together!"),
                hints=raw_json.get("hints", []),
                detected_misconceptions=raw_json.get("detected_misconceptions", []),
                suggested_followups=raw_json.get("suggested_followups", []),
                provider=provider.provider_name,
                model=provider.model_name,
            )
        except Exception as error:
            logger.warning("Adaptive tutor generation failed: %s. Using pedagogical fallback.", error)
            return TutorChatResponse(
                response=f"Great question regarding **{topic}**! To think through this systematically at an **{difficulty}** level: consider the core definition and what governing rule applies directly here. How would you state the relationship between the primary variables?",
                hints=[
                    f"Review the primary governing rule of {topic}.",
                    "Check if any variables or conditions are held constant.",
                ],
                detected_misconceptions=[],
                suggested_followups=[
                    f"Can you explain this with a simpler analogy?",
                    f"What happens in extreme cases of {topic}?",
                ],
                provider=provider.provider_name,
                model=provider.model_name,
            )

    def generate_practice(
        self,
        topic: str,
        difficulty: DifficultyLevel = "intermediate",
        current_focus: Optional[str] = None,
        provider_name: Optional[str] = None,
    ) -> PracticeResponse:
        """Generate targeted diagnostic practice questions."""
        provider = router.get_provider(provider_name)

        prompt = f"""Topic: {topic}
Difficulty: {difficulty}
Target Area: {current_focus or 'Core concepts and application'}

Generate 2 targeted diagnostic multiple-choice questions for the student.
Respond strictly in JSON:
{{
  "practice_questions": [
    {{
      "question": "Question text",
      "options": [
        {{"key": "A", "text": "Option A"}},
        {{"key": "B", "text": "Option B"}},
        {{"key": "C", "text": "Option C"}},
        {{"key": "D", "text": "Option D"}}
      ],
      "correct_answer": "A",
      "explanation": "Detailed explanation of correct answer and why wrong options are incorrect."
    }}
  ]
}}
"""
        try:
            raw_json = provider.generate_json(prompt=prompt, system_instruction=TUTOR_SYSTEM_PROMPT)
            questions: List[QuizItem] = []
            for item in raw_json.get("practice_questions", []):
                opts = [QuizOption(**opt) for opt in item.get("options", [])]
                questions.append(
                    QuizItem(
                        question=item.get("question", f"Question on {topic}"),
                        options=opts,
                        correct_answer=item.get("correct_answer", "A"),
                        explanation=item.get("explanation", "Verified based on key principles."),
                    )
                )
            if not questions:
                raise ValueError("No questions returned")
            return PracticeResponse(
                practice_questions=questions,
                provider=provider.provider_name,
                model=provider.model_name,
            )
        except Exception as error:
            logger.warning("Practice generator failed: %s. Using pedagogical fallback questions.", error)
            fallback_q = QuizItem(
                question=f"Which condition is most critical when analyzing {topic} at an {difficulty} level?",
                options=[
                    QuizOption(key="A", text="Verifying baseline constraints and governing laws"),
                    QuizOption(key="B", text="Ignoring conservation principles and boundary conditions"),
                    QuizOption(key="C", text="Assuming static behavior under all dynamic forces"),
                    QuizOption(key="D", text="Treating empirical observations as purely theoretical"),
                ],
                correct_answer="A",
                explanation=f"Establishing boundary constraints and governing assumptions is fundamental to solving problems in {topic}.",
            )
            return PracticeResponse(
                practice_questions=[fallback_q],
                provider=provider.provider_name,
                model=provider.model_name,
            )

    def generate_more_flashcards(
        self,
        topic: str,
        difficulty: DifficultyLevel = "intermediate",
        count: int = 4,
        provider_name: Optional[str] = None,
    ) -> MoreFlashcardsResponse:
        """Generate additional focused study flashcards for active deck."""
        provider = router.get_provider(provider_name)

        prompt = f"""Topic: {topic}
Difficulty: {difficulty}

Generate {count} new, high-yield study flashcards for this topic.
Respond strictly in JSON matching:
{{
  "flashcards": [
    {{
      "question": "Clear, concise inquiry or conceptual question",
      "answer": "Accurate, comprehensive explanation",
      "key_term": "Core terminology or vocabulary"
    }}
  ]
}}
"""
        try:
            raw_json = provider.generate_json(prompt=prompt, system_instruction=TUTOR_SYSTEM_PROMPT)
            cards: List[FlashcardItem] = []
            for item in raw_json.get("flashcards", []):
                cards.append(
                    FlashcardItem(
                        question=item.get("question", f"Key concept of {topic}?"),
                        answer=item.get("answer", "Comprehensive concept explanation."),
                        key_term=item.get("key_term", topic),
                    )
                )
            if not cards:
                raise ValueError("No flashcards returned")
            return MoreFlashcardsResponse(
                flashcards=cards,
                provider=provider.provider_name,
                model=provider.model_name,
            )
        except Exception as error:
            logger.warning("Flashcard generator failed: %s. Using pedagogical fallbacks.", error)
            fallback_cards = [
                FlashcardItem(
                    question=f"What is a critical nuance or constraint in {topic} at an {difficulty} level?",
                    answer=f"Analyzing boundary assumptions and how system dynamics react under non-standard conditions in {topic}.",
                    key_term="System Boundary",
                ),
                FlashcardItem(
                    question=f"How can you verify that your conclusions regarding {topic} are sound?",
                    answer="By performing dimensional sanity checks, unit analysis, and comparing against first principles.",
                    key_term="Verification Check",
                ),
            ]
            return MoreFlashcardsResponse(
                flashcards=fallback_cards,
                provider=provider.provider_name,
                model=provider.model_name,
            )


adaptive_tutor = AdaptiveTutorService()

