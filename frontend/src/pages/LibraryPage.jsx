import React from 'react';
import { BookOpen, Layers, Award, ArrowUpRight } from 'lucide-react';

export default function LibraryPage({ studySets = [], onSelectStudySet }) {
  return (
    <div className="library-page-container">
      <div className="workspace-hero">
        <h1 className="workspace-title">Study Library</h1>
        <p className="workspace-subtitle">
          Browse your past study sessions, generated flashcard decks, and quiz sets.
        </p>
      </div>

      <div className="library-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {studySets.map((set, idx) => (
          <div
            key={idx}
            className="study-input-card"
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            onClick={() => onSelectStudySet?.(set)}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span className="card-badge" style={{ margin: 0 }}>STUDY SET</span>
                <ArrowUpRight size={16} color="var(--color-primary)" />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                {set.title}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '1rem' }}>
                {set.summary?.slice(0, 110)}...
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid #f1f0f8', paddingTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Layers size={13} /> {set.flashcards?.length || 0} cards
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Award size={13} /> {set.quiz?.length || 0} questions
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
