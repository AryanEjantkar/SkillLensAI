import React from 'react';
import { Award, CheckCircle, Flame, Clock, BookOpen } from 'lucide-react';

export default function ProgressPage({ currentStudySet }) {
  return (
    <div className="progress-page-container">
      <div className="workspace-hero">
        <h1 className="workspace-title">Learning Progress</h1>
        <p className="workspace-subtitle">
          Track your concept retention, flashcard mastery, and quiz accuracy across topics.
        </p>
      </div>

      <div className="study-metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="metric-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', marginBottom: '4px' }}>
            <Award size={18} />
            <span className="metric-card-number" style={{ fontSize: '1.5rem', margin: 0 }}>88%</span>
          </div>
          <div className="metric-card-label">Overall Quiz Accuracy</div>
        </div>

        <div className="metric-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', marginBottom: '4px' }}>
            <CheckCircle size={18} />
            <span className="metric-card-number" style={{ fontSize: '1.5rem', margin: 0, color: 'var(--success)' }}>52</span>
          </div>
          <div className="metric-card-label">Flashcards Mastered</div>
        </div>

        <div className="metric-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', marginBottom: '4px' }}>
            <Flame size={18} />
            <span className="metric-card-number" style={{ fontSize: '1.5rem', margin: 0, color: '#f59e0b' }}>7 Days</span>
          </div>
          <div className="metric-card-label">Study Streak</div>
        </div>

        <div className="metric-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6366f1', marginBottom: '4px' }}>
            <Clock size={18} />
            <span className="metric-card-number" style={{ fontSize: '1.5rem', margin: 0, color: '#6366f1' }}>3.5 hrs</span>
          </div>
          <div className="metric-card-label">Time Studied</div>
        </div>
      </div>

      <div className="study-input-card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.85rem' }}>Active Focus: Thermodynamics</h3>
        <div className="progress-bar-track" style={{ height: '8px' }}>
          <div className="progress-bar-fill" style={{ width: '64%' }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
          <span>64% completed</span>
          <span>Target: 100% mastery</span>
        </div>
      </div>
    </div>
  );
}
