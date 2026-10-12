import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCw, Shuffle, CheckCircle, HelpCircle } from 'lucide-react';

/**
 * Person 3 integration component: FlashcardSet
 * Accepts prop: `flashcards` (array of { question, answer })
 */
export default function FlashcardSet({ flashcards = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState(new Set());

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="flashcard-empty-state">
        <HelpCircle size={40} className="empty-icon" />
        <p>No flashcards available in this study set.</p>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];
  const isMastered = masteredIds.has(currentIndex);

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const toggleMastery = () => {
    setMasteredIds((prev) => {
      const next = new Set(prev);
      if (next.has(currentIndex)) {
        next.delete(currentIndex);
      } else {
        next.add(currentIndex);
      }
      return next;
    });
  };

  return (
    <div className="flashcard-container">
      <div className="flashcard-topbar">
        <span className="card-counter">
          Card {currentIndex + 1} of {flashcards.length}
        </span>
        <div className="card-actions-row">
          <button
            onClick={toggleMastery}
            className={`btn-pill-action ${isMastered ? 'mastered' : ''}`}
            title="Mark as understood"
          >
            <CheckCircle size={15} />
            {isMastered ? 'Mastered' : 'Mark Mastered'}
          </button>
        </div>
      </div>

      {/* 3D Flip Card */}
      <div
        className={`flip-card ${isFlipped ? 'flipped' : ''}`}
        onClick={() => setIsFlipped(!isFlipped)}
        tabIndex={0}
        role="button"
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            setIsFlipped(!isFlipped);
          }
        }}
        aria-label="Click to flip card"
      >
        <div className="flip-card-inner">
          <div className="flip-card-front">
            <span className="card-badge">QUESTION</span>
            <p className="card-text">{currentCard.question}</p>
            <span className="flip-hint">Click or press Space to flip</span>
          </div>
          <div className="flip-card-back">
            <span className="card-badge answer-badge">ANSWER</span>
            <p className="card-text">{currentCard.answer}</p>
            <span className="flip-hint">Click to flip back</span>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flashcard-controls">
        <button
          onClick={handlePrev}
          className="btn-control-nav"
          disabled={flashcards.length <= 1}
          aria-label="Previous card"
        >
          <ChevronLeft size={20} />
          <span>Previous</span>
        </button>

        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="btn-control-flip"
          title="Flip card"
        >
          <RotateCw size={17} />
          <span>Flip</span>
        </button>

        <button
          onClick={handleNext}
          className="btn-control-nav"
          disabled={flashcards.length <= 1}
          aria-label="Next card"
        >
          <span>Next</span>
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Progress Dots */}
      <div className="card-progress-dots">
        {flashcards.map((_, i) => (
          <span
            key={i}
            className={`dot ${i === currentIndex ? 'active' : ''} ${masteredIds.has(i) ? 'mastered-dot' : ''}`}
            onClick={() => {
              setIsFlipped(false);
              setCurrentIndex(i);
            }}
          />
        ))}
      </div>
    </div>
  );
}
