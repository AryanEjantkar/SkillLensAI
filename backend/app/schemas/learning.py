# backend/app/schemas/learning.py
from typing import List
from pydantic import BaseModel, Field, model_validator


class Flashcard(BaseModel):
    """A single flashcard with a question and answer."""
    question: str = Field(min_length=1, max_length=1000, description="Concept or prompt question")
    answer: str = Field(min_length=1, max_length=2000, description="Concise explanation or answer")


class QuizQuestion(BaseModel):
    """A multiple-choice quiz question with options and a zero-based correct answer index."""
    question: str = Field(min_length=1, max_length=1000, description="Multiple-choice question text")
    options: List[str] = Field(min_length=2, max_length=8, description="List of possible answers (at least 2 options)")
    correct_answer: int = Field(description="Zero-based integer index pointing to the correct option in options")
    explanation: str = Field(min_length=1, max_length=2000, description="Clear explanation of why this answer is correct")

    @model_validator(mode="after")
    def validate_correct_answer_index(self) -> "QuizQuestion":
        """Ensures that the correct_answer index is within the valid range of options."""
        if not (0 <= self.correct_answer < len(self.options)):
            raise ValueError(
                f"correct_answer index {self.correct_answer} is out of bounds for options length {len(self.options)}. "
                f"Must be between 0 and {len(self.options) - 1}."
            )
        return self


class AnalysisResponse(BaseModel):
    """Complete structured learning material generated from text/notes/diagrams."""
    title: str = Field(min_length=1, max_length=200, description="Short title describing the topic")
    summary: str = Field(min_length=1, max_length=5000, description="Concise overview of the material")
    explanation: str = Field(min_length=1, max_length=10000, description="Beginner-friendly conceptual breakdown")
    flashcards: List[Flashcard] = Field(default_factory=list, description="Collection of study flashcards")
    quiz: List[QuizQuestion] = Field(default_factory=list, description="Collection of multiple-choice quiz questions")


class FlashcardsResponse(BaseModel):
    """Dedicated response containing generated flashcards."""
    flashcards: List[Flashcard] = Field(default_factory=list, description="Collection of study flashcards")


class QuizResponse(BaseModel):
    """Dedicated response containing generated quiz questions."""
    quiz: List[QuizQuestion] = Field(default_factory=list, description="Collection of multiple-choice quiz questions")


class TextGenerationRequest(BaseModel):
    """Request payload for text-based flashcard and quiz generation endpoints."""
    text: str = Field(min_length=5, max_length=20000, description="Educational source text, notes, or topic description")
