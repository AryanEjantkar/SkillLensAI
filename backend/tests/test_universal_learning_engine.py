"""Comprehensive automated unit tests for the Universal Interactive Learning Engine."""

from unittest.mock import Mock, patch
import pytest
from fastapi.testclient import TestClient

from backend.src.main import app
from backend.app.schemas.lesson import (
    LessonPlan,
    VisualizationSpec,
    LessonSection,
    WorkedExample,
    FlashcardItem,
    QuizItem,
    QuizOption,
)
from backend.app.services.lesson_generator import UniversalLessonGenerator
from backend.app.services.adaptive_tutor import AdaptiveTutorService
from backend.app.providers.base import ProviderError, ProviderUnavailableError
from backend.app.providers.ollama_provider import OllamaProvider


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def sample_lesson_dict():
    return {
        "topic": "Newton's Third Law",
        "subject": "physics",
        "subtopic": "Classical Mechanics",
        "difficulty": "intermediate",
        "teaching_method": "Interactive Exploration",
        "learning_objectives": ["Identify action-reaction force pairs"],
        "sections": [
            {
                "title": "Action and Reaction",
                "content": "For every action, there is an equal and opposite reaction.",
                "key_concepts": ["Force Pairs", "Conservation of Momentum"],
                "analogies": ["Pushing against a wall"],
            }
        ],
        "visualization": {
            "type": "physics_simulation",
            "title": "Force Pairs Simulation",
            "description": "Adjust mass and observe opposite acceleration vectors.",
            "data": {"parameters": [{"name": "mass", "default": 5}]},
        },
        "worked_examples": [
            {
                "problem": "Calculate reaction force on an astronaut pushing a spacecraft.",
                "steps": [
                    {
                        "step_number": 1,
                        "instruction": "Identify contact force.",
                        "formula_or_code": "F_astronaut = -F_craft",
                        "explanation": "Forces are equal in magnitude and opposite in direction.",
                    }
                ],
                "final_answer": "Equal and opposite force.",
            }
        ],
        "flashcards": [
            {
                "question": "What is Newton's Third Law?",
                "answer": "Forces always occur in matched action-reaction pairs.",
                "key_term": "Action-Reaction",
            }
        ],
        "quiz": [
            {
                "question": "If you push a wall with 50 N, what force does the wall exert on you?",
                "options": [
                    {"key": "A", "text": "50 N in the opposite direction"},
                    {"key": "B", "text": "0 N"},
                    {"key": "C", "text": "100 N"},
                    {"key": "D", "text": "Depends on the wall mass"},
                ],
                "correct_answer": "A",
                "explanation": "By Newton's Third Law, the normal force is exactly 50 N opposite.",
            }
        ],
        "hints": ["Always look for the two interacting objects."],
        "suggested_followups": ["Why don't action-reaction pairs cancel each other out?"],
        "sources": ["OpenStax College Physics"],
        "metadata": {
            "provider": "gemma",
            "model": "gemma-4-26b-a4b-it",
            "is_fallback_simulation": False,
        },
    }


def test_lesson_plan_schema_valid(sample_lesson_dict):
    """Verify LessonPlan Pydantic schema validation."""
    lesson = LessonPlan.model_validate(sample_lesson_dict)
    assert lesson.topic == "Newton's Third Law"
    assert lesson.subject == "physics"
    assert lesson.visualization.type == "physics_simulation"
    assert len(lesson.sections) == 1
    assert len(lesson.flashcards) == 1
    assert len(lesson.quiz) == 1


def test_visualization_type_normalization():
    """Verify registry normalizes aliases and falls back cleanly."""
    # Test valid alias
    vis1 = VisualizationSpec(
        type="simulation",
        title="Sim",
        description="Desc",
        data={},
    )
    assert vis1.type == "physics_simulation"

    # Test unknown alias falls back to concept_map
    vis2 = VisualizationSpec(
        type="unknown_exotic_component_xyz",
        title="Unknown",
        description="Desc",
        data={},
    )
    assert vis2.type == "concept_map"


def test_lesson_generator_with_mocked_provider(sample_lesson_dict):
    """Test UniversalLessonGenerator with a mocked AI provider."""
    generator = UniversalLessonGenerator()
    mock_provider = Mock()
    mock_provider.provider_name = "gemma"
    mock_provider.model_name = "gemma-4-26b-a4b-it"
    mock_provider.generate_json.return_value = sample_lesson_dict

    with patch("backend.app.services.lesson_generator.router.get_provider", return_value=mock_provider):
        lesson = generator.generate_lesson(topic="Newton's Third Law", difficulty="intermediate")

    assert lesson.topic == "Newton's Third Law"
    assert lesson.subject == "physics"
    assert lesson.metadata.provider == "gemma"
    assert lesson.metadata.is_fallback_simulation is False


def test_lesson_generator_emergency_fallback():
    """Test UniversalLessonGenerator returns safe fallback when provider fails."""
    generator = UniversalLessonGenerator()
    mock_provider = Mock()
    mock_provider.provider_name = "gemma"
    mock_provider.model_name = "gemma-4-26b-a4b-it"
    mock_provider.generate_json.side_effect = RuntimeError("API connection timeout")

    with patch("backend.app.services.lesson_generator.router.get_provider", return_value=mock_provider):
        lesson = generator.generate_lesson(topic="Photosynthesis", difficulty="beginner")

    assert lesson.topic == "Photosynthesis"
    assert lesson.visualization.type == "concept_map"
    assert lesson.metadata.is_fallback_simulation is True
    assert "fallback" in lesson.metadata.disclaimer.lower()


def test_api_generate_lesson_endpoint(client, sample_lesson_dict):
    """Test POST /api/lesson/generate."""
    with patch("backend.app.services.lesson_generator.lesson_generator.generate_lesson") as mock_gen:
        mock_gen.return_value = LessonPlan.model_validate(sample_lesson_dict)

        response = client.post(
            "/api/lesson/generate",
            json={"topic": "Newton's Third Law", "difficulty": "intermediate", "provider": "gemma"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["topic"] == "Newton's Third Law"
        assert data["visualization"]["type"] == "physics_simulation"


def test_api_generate_lesson_upload_document(client, sample_lesson_dict):
    """Test POST /api/lesson/generate/upload with document."""
    with patch("backend.app.services.lesson_generator.lesson_generator.generate_lesson") as mock_gen:
        mock_gen.return_value = LessonPlan.model_validate(sample_lesson_dict)

        response = client.post(
            "/api/lesson/generate/upload",
            data={"topic": "Calculus Notes", "difficulty": "intermediate", "provider": "gemma"},
            files={"file": ("notes.txt", b"Derivative f'(x) represents slope.", "text/plain")},
        )

        assert response.status_code == 200
        assert response.json()["topic"] == "Newton's Third Law"


def test_api_generate_lesson_upload_unsupported_file(client):
    """Test rejection of unsupported file types."""
    response = client.post(
        "/api/lesson/generate/upload",
        data={"topic": "Test"},
        files={"file": ("script.exe", b"binary", "application/x-msdownload")},
    )
    assert response.status_code == 415


def test_adaptive_tutor_chat(client):
    """Test POST /api/tutor/chat with mock."""
    mock_resp = {
        "response": "Consider Newton's Third Law: action equals opposite reaction.",
        "hints": ["Check the force vectors."],
        "detected_misconceptions": ["Believing forces can act without a counterforce"],
        "suggested_followups": ["What happens in free fall?"],
    }
    with patch("backend.app.providers.gemma_provider.GemmaProvider.generate_json", return_value=mock_resp):
        response = client.post(
            "/api/tutor/chat",
            json={
                "topic": "Forces",
                "difficulty": "intermediate",
                "user_message": "Why doesn't the wall move when I push it?",
                "provider": "gemma",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "Newton's Third Law" in data["response"]
        assert len(data["hints"]) == 1
        assert len(data["detected_misconceptions"]) == 1


def test_adaptive_tutor_practice(client):
    """Test POST /api/tutor/practice."""
    mock_resp = {
        "practice_questions": [
            {
                "question": "What is the unit of force in SI?",
                "options": [
                    {"key": "A", "text": "Newton (N)"},
                    {"key": "B", "text": "Joule (J)"},
                    {"key": "C", "text": "Watt (W)"},
                    {"key": "D", "text": "Pascal (Pa)"},
                ],
                "correct_answer": "A",
                "explanation": "Force is measured in Newtons.",
            }
        ]
    }
    with patch("backend.app.providers.gemma_provider.GemmaProvider.generate_json", return_value=mock_resp):
        response = client.post(
            "/api/tutor/practice",
            json={"topic": "Forces", "difficulty": "intermediate", "provider": "gemma"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["practice_questions"]) == 1
        assert data["practice_questions"][0]["correct_answer"] == "A"


def test_ollama_offline_mode_no_cloud_leak():
    """Verify Ollama provider never makes cloud requests when offline."""
    ollama = OllamaProvider(base_url="http://127.0.0.1:9999", model_name="gemma2:9b", timeout=1.0)
    assert ollama.provider_name == "ollama"
    assert ollama.is_available() is False

    # Calling generate on offline Ollama must raise ProviderUnavailableError without calling Google AI
    with pytest.raises(ProviderUnavailableError) as exc_info:
        ollama.generate("Test prompt")

    assert "Local Ollama server is unreachable" in str(exc_info.value)


def test_providers_status_endpoint(client):
    """Test GET /api/providers/status."""
    response = client.get("/api/providers/status")
    assert response.status_code == 200
    data = response.json()
    assert "providers" in data
    assert "gemma" in data["providers"]
    assert "gemini" in data["providers"]
    assert "ollama" in data["providers"]
    assert data["providers"]["ollama"]["local_only"] is True


def test_api_tutor_flashcards_endpoint(client):
    """Test POST /api/tutor/flashcards for on-demand flashcard generation."""
    mock_resp = {
        "flashcards": [
            {
                "question": "What is the unit of force in SI?",
                "answer": "The Newton (N), equal to 1 kg·m/s².",
                "key_term": "Newton",
            },
            {
                "question": "What is inertia?",
                "answer": "The resistance of any physical object to any change in its velocity.",
                "key_term": "Inertia",
            },
        ]
    }
    with patch("backend.app.providers.gemma_provider.GemmaProvider.generate_json", return_value=mock_resp):
        response = client.post(
            "/api/tutor/flashcards",
            json={"topic": "Newtonian Mechanics", "difficulty": "intermediate", "count": 2, "provider": "gemma"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["flashcards"]) == 2
        assert "Newton" in data["flashcards"][0]["answer"]
        assert data["provider"] == "gemma"

