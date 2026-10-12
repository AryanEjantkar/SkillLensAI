# backend/tests/test_output_validator.py
import json
import pytest

from app.core.exceptions import InvalidModelOutputError
from app.services.output_validator import OutputValidator


def test_extract_json_from_direct_valid_json():
    raw = '{"title": "Test Topic", "summary": "Short summary", "explanation": "Detailed explanation"}'
    data = OutputValidator.extract_json(raw)
    assert data["title"] == "Test Topic"


def test_extract_json_from_markdown_fenced_block():
    raw = """Here is the structured learning material:
```json
{
  "title": "Machine Learning",
  "summary": "Overview",
  "explanation": "Explanation",
  "flashcards": [],
  "quiz": []
}
```
Hope this helps!"""
    data = OutputValidator.extract_json(raw)
    assert data["title"] == "Machine Learning"


def test_extract_json_from_generic_code_block():
    raw = """```
{
  "title": "Generic Fences",
  "summary": "Overview",
  "explanation": "Explanation",
  "flashcards": [],
  "quiz": []
}
```"""
    data = OutputValidator.extract_json(raw)
    assert data["title"] == "Generic Fences"


def test_extract_json_raises_on_empty_text():
    with pytest.raises(InvalidModelOutputError):
        OutputValidator.extract_json("")


def test_extract_json_raises_on_invalid_json():
    with pytest.raises(InvalidModelOutputError):
        OutputValidator.extract_json("This is purely plain text with no json structure at all.")


def test_validate_analysis_success():
    raw = json.dumps({
        "title": "Data Structures",
        "summary": "Summary of lists and trees.",
        "explanation": "Detailed breakdown.",
        "flashcards": [
            {"question": "What is an array?", "answer": "A contiguous block of memory."}
        ],
        "quiz": [
            {
                "question": "What is time complexity of array lookup by index?",
                "options": ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
                "correct_answer": 0,
                "explanation": "Array lookup by index is constant time."
            }
        ]
    })
    result = OutputValidator.validate_analysis(raw)
    assert result.title == "Data Structures"
    assert len(result.flashcards) == 1
    assert len(result.quiz) == 1
    assert result.quiz[0].correct_answer == 0


def test_validate_quiz_rejects_out_of_bounds_index():
    raw = json.dumps({
        "quiz": [
            {
                "question": "Sample Question",
                "options": ["Option A", "Option B", "Option C"],
                "correct_answer": 99,  # Out of bounds!
                "explanation": "Explanation"
            }
        ]
    })
    with pytest.raises(InvalidModelOutputError):
        OutputValidator.validate_quiz(raw)


def test_validate_quiz_rejects_negative_index():
    raw = json.dumps({
        "quiz": [
            {
                "question": "Sample Question",
                "options": ["Option A", "Option B"],
                "correct_answer": -1,  # Negative index!
                "explanation": "Explanation"
            }
        ]
    })
    with pytest.raises(InvalidModelOutputError):
        OutputValidator.validate_quiz(raw)
