"""Pydantic schemas for the Universal Interactive Learning Engine."""

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field, field_validator


DifficultyLevel = Literal["beginner", "intermediate", "advanced"]

SubjectCategory = Literal[
    "mathematics",
    "physics",
    "chemistry",
    "biology",
    "computer_science",
    "economics",
    "law",
    "arts_humanities",
    "general",
]

VisualizationType = Literal[
    "math_graph",
    "calculus_graph",
    "physics_simulation",
    "chemistry_reaction",
    "biology_process",
    "algorithm_visualizer",
    "economics_market",
    "probability_distribution",
    "system_architecture",
    "timeline_flow",
    "concept_map",
    "comparison_matrix",
    "worked_example",
]


class LessonSection(BaseModel):
    title: str = Field(description="Section heading")
    content: str = Field(description="Explanatory text in Markdown with bold key terms and bullet points")
    key_concepts: List[str] = Field(default_factory=list, description="Key concepts or definitions in this section")
    analogies: List[str] = Field(default_factory=list, description="Intuitive real-world analogies")


class VisualizationSpec(BaseModel):
    type: VisualizationType = Field(description="Registry key for safe React interactive component")
    title: str = Field(description="Title for the interactive component")
    description: str = Field(description="Short guidance explaining what the visualization represents and what controls to adjust")
    data: Dict[str, Any] = Field(default_factory=dict, description="Validated declarative data parameters for the component")

    @field_validator("type", mode="before")
    @classmethod
    def normalize_type(cls, val: Any) -> str:
        valid_types = {
            "math_graph",
            "calculus_graph",
            "physics_simulation",
            "chemistry_reaction",
            "biology_process",
            "algorithm_visualizer",
            "economics_market",
            "probability_distribution",
            "system_architecture",
            "timeline_flow",
            "concept_map",
            "comparison_matrix",
            "worked_example",
        }
        val_str = str(val).lower().strip()
        if val_str in valid_types:
            return val_str
        # Intelligent fallback mapping for slightly varying names
        mapping = {
            "graph": "math_graph",
            "calculus": "calculus_graph",
            "physics": "physics_simulation",
            "simulation": "physics_simulation",
            "chemistry": "chemistry_reaction",
            "reaction": "chemistry_reaction",
            "biology": "biology_process",
            "anatomy": "biology_process",
            "algorithm": "algorithm_visualizer",
            "data_structure": "algorithm_visualizer",
            "market": "economics_market",
            "economics": "economics_market",
            "probability": "probability_distribution",
            "statistics": "probability_distribution",
            "architecture": "system_architecture",
            "system": "system_architecture",
            "network": "system_architecture",
            "timeline": "timeline_flow",
            "flowchart": "timeline_flow",
            "case_flow": "timeline_flow",
            "comparison": "comparison_matrix",
            "matrix": "comparison_matrix",
            "example": "worked_example",
        }
        return mapping.get(val_str, "concept_map")


class WorkedExampleStep(BaseModel):
    step_number: int = Field(default=1)
    instruction: str = Field(description="Step action or phase explanation")
    formula_or_code: Optional[str] = Field(default=None, description="Mathematical formula, pseudocode, or citation")
    explanation: str = Field(description="Why this step is taken")


class WorkedExample(BaseModel):
    problem: str = Field(description="Problem statement or hypothetical scenario")
    steps: List[WorkedExampleStep] = Field(default_factory=list, description="Step-by-step solution breakdown")
    final_answer: str = Field(description="Final verified solution or conclusion")


class FlashcardItem(BaseModel):
    id: Optional[str] = None
    question: str = Field(description="Prompt or inquiry on card front")
    answer: str = Field(description="Clear explanation on card back")
    key_term: Optional[str] = Field(default=None, description="Core vocabulary or formula")


class QuizOption(BaseModel):
    key: str = Field(description="A, B, C, or D")
    text: str = Field(description="Option text")


class QuizItem(BaseModel):
    id: Optional[str] = None
    question: str = Field(description="Question text")
    options: List[QuizOption] = Field(description="Answer choices")
    correct_answer: str = Field(description="Key of correct option (A, B, C, or D)")
    explanation: str = Field(description="Pedagogical explanation of why this option is correct and others are not")


class LessonMetadata(BaseModel):
    provider: str = Field(default="gemma", description="AI provider that planned the lesson (gemma, gemini, ollama)")
    model: str = Field(default="gemma-4-26b-a4b-it", description="Model ID")
    is_fallback_simulation: bool = Field(default=False, description="Flag indicating if generic fallback visualization was selected")
    disclaimer: str = Field(
        default="AI-generated educational content is designed for learning and exploration; inspect source materials to verify specialized applications.",
        description="Factual fallibility disclaimer",
    )


class LessonPlan(BaseModel):
    topic: str = Field(description="Learning topic title")
    subject: SubjectCategory = Field(default="general", description="Identified subject category")
    subtopic: str = Field(default="", description="Identified subfield or specialty")
    difficulty: DifficultyLevel = Field(default="intermediate", description="Target difficulty")
    teaching_method: str = Field(default="Interactive Guided Discovery", description="Pedagogical strategy applied")
    learning_objectives: List[str] = Field(default_factory=list, description="Observable learning outcomes")
    sections: List[LessonSection] = Field(default_factory=list, description="Explanatory modules")
    visualization: VisualizationSpec = Field(description="Interactive component specification")
    worked_examples: List[WorkedExample] = Field(default_factory=list, description="Step-by-step worked exercises")
    flashcards: List[FlashcardItem] = Field(default_factory=list, description="Study flashcards")
    quiz: List[QuizItem] = Field(default_factory=list, description="Diagnostic and reinforcement questions")
    hints: List[str] = Field(default_factory=list, description="Progressive hints for students tackling this topic")
    suggested_followups: List[str] = Field(default_factory=list, description="Curated questions student might ask next")
    sources: List[str] = Field(default_factory=list, description="Academic references or curriculum context")
    metadata: LessonMetadata = Field(default_factory=LessonMetadata)


class LessonGenerateRequest(BaseModel):
    topic: str = Field(min_length=1, max_length=10_000)
    difficulty: DifficultyLevel = Field(default="intermediate")
    provider: Optional[Literal["gemma", "gemini", "ollama"]] = Field(default="gemma")
    context_text: Optional[str] = Field(default=None, description="Optional extracted text from notes, documents, or links")
    source_type: Literal["text", "image", "document", "link"] = Field(default="text")


class TutorChatRequest(BaseModel):
    topic: str
    difficulty: DifficultyLevel = Field(default="intermediate")
    lesson_summary: Optional[str] = None
    user_message: str = Field(min_length=1, max_length=5000)
    history: List[Dict[str, str]] = Field(default_factory=list, description="Past messages with role and content")
    provider: Optional[Literal["gemma", "gemini", "ollama"]] = Field(default="gemma")


class TutorChatResponse(BaseModel):
    response: str
    hints: List[str] = Field(default_factory=list)
    detected_misconceptions: List[str] = Field(default_factory=list)
    suggested_followups: List[str] = Field(default_factory=list)
    provider: str
    model: str


class PracticeRequest(BaseModel):
    topic: str
    difficulty: DifficultyLevel = Field(default="intermediate")
    current_focus: Optional[str] = None
    provider: Optional[Literal["gemma", "gemini", "ollama"]] = Field(default="gemma")


class PracticeResponse(BaseModel):
    practice_questions: List[QuizItem] = Field(default_factory=list)
    provider: str
    model: str


class MoreFlashcardsRequest(BaseModel):
    topic: str
    difficulty: DifficultyLevel = Field(default="intermediate")
    count: int = Field(default=4, ge=1, le=10)
    provider: Optional[Literal["gemma", "gemini", "ollama"]] = Field(default="gemma")


class MoreFlashcardsResponse(BaseModel):
    flashcards: List[FlashcardItem] = Field(default_factory=list)
    provider: str
    model: str


class ProviderStatusItem(BaseModel):
    available: bool
    model: str
    details: str
    local_only: bool = False


class ProvidersStatusResponse(BaseModel):
    default_provider: str
    providers: Dict[str, ProviderStatusItem]
