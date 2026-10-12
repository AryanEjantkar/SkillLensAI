import React, { useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw, Award, ArrowRight } from 'lucide-react';

/**
 * Person 3 integration component: QuizSet
 * Accepts prop: `quiz` (array of { question, options, correct_answer, explanation })
 */
export default function QuizSet({ quiz = [] }) {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  if (!quiz || quiz.length === 0) {
    return (
      <div className="quiz-empty-state">
        <p>No quiz questions available in this study set.</p>
      </div>
    );
  }

  const currentQ = quiz[currentQuestionIndex];
  const selectedOptionIndex = selectedAnswers[currentQuestionIndex];
  const hasAnsweredCurrent = selectedOptionIndex !== undefined;

  const handleSelectOption = (optIndex) => {
    if (hasAnsweredCurrent) return; // Prevent changing after submission
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: optIndex,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setShowSummary(true);
    }
  };

  const handleRestartQuiz = () => {
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setShowSummary(false);
  };

  // Calculate score
  const totalScore = Object.entries(selectedAnswers).reduce((acc, [qIdx, ansIdx]) => {
    return quiz[qIdx]?.correct_answer === ansIdx ? acc + 1 : acc;
  }, 0);

  if (showSummary) {
    const percentage = Math.round((totalScore / quiz.length) * 100);
    return (
      <div className="quiz-summary-card">
        <div className="summary-icon-badge">
          <Award size={48} className="award-icon" />
        </div>
        <h3>Quiz Complete!</h3>
        <p className="summary-score-headline">
          You scored <strong>{totalScore}</strong> out of <strong>{quiz.length}</strong> ({percentage}%)
        </p>

        <div className="summary-metrics">
          <div className="metric-pill">
            <span className="metric-label">Correct</span>
            <span className="metric-value correct">{totalScore}</span>
          </div>
          <div className="metric-pill">
            <span className="metric-label">Incorrect</span>
            <span className="metric-value incorrect">{quiz.length - totalScore}</span>
          </div>
        </div>

        <button onClick={handleRestartQuiz} className="btn-primary-action restart-btn">
          <RotateCcw size={16} />
          <span>Retake Quiz</span>
        </button>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      {/* Top Question Progress Header */}
      <div className="quiz-header-bar">
        <span className="quiz-progress-text">
          Question {currentQuestionIndex + 1} of {quiz.length}
        </span>
        <div className="quiz-score-badge">
          Score: {totalScore} / {quiz.length}
        </div>
      </div>

      <div className="quiz-question-card">
        <h4 className="question-title">{currentQ.question}</h4>

        {/* Options List */}
        <div className="options-list">
          {currentQ.options.map((option, optIdx) => {
            const isSelected = selectedOptionIndex === optIdx;
            const isCorrect = currentQ.correct_answer === optIdx;

            let optionClass = 'option-btn';
            if (hasAnsweredCurrent) {
              if (isCorrect) {
                optionClass += ' correct-option';
              } else if (isSelected && !isCorrect) {
                optionClass += ' incorrect-option';
              } else {
                optionClass += ' disabled-option';
              }
            } else if (isSelected) {
              optionClass += ' selected-option';
            }

            return (
              <button
                key={optIdx}
                className={optionClass}
                onClick={() => handleSelectOption(optIdx)}
                disabled={hasAnsweredCurrent}
              >
                <span className="option-index">
                  {String.fromCharCode(65 + optIdx)}
                </span>
                <span className="option-text">{option}</span>
                {hasAnsweredCurrent && isCorrect && (
                  <CheckCircle2 size={18} className="icon-state correct" />
                )}
                {hasAnsweredCurrent && isSelected && !isCorrect && (
                  <XCircle size={18} className="icon-state incorrect" />
                )}
              </button>
            );
          })}
        </div>

        {/* Answer Explanation Box */}
        {hasAnsweredCurrent && (
          <div className={`explanation-card ${selectedOptionIndex === currentQ.correct_answer ? 'success' : 'alert'}`}>
            <div className="explanation-title">
              {selectedOptionIndex === currentQ.correct_answer ? (
                <>
                  <CheckCircle2 size={16} /> Correct!
                </>
              ) : (
                <>
                  <XCircle size={16} /> Incorrect
                </>
              )}
            </div>
            <p className="explanation-body">{currentQ.explanation}</p>
          </div>
        )}

        {/* Next Question / Finish Action */}
        {hasAnsweredCurrent && (
          <div className="quiz-actions-footer">
            <button onClick={handleNextQuestion} className="btn-primary-action next-btn">
              <span>{currentQuestionIndex < quiz.length - 1 ? 'Next Question' : 'View Summary'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
