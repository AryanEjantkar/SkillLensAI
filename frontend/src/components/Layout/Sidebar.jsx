import React from 'react';

export default function Sidebar({ activeNav = 'workspace', onSelectNav }) {
  const navItems = [
    { id: 'workspace', label: 'Workspace', badge: null },
    { id: 'library', label: 'Library', badge: 12 },
    { id: 'flashcards', label: 'Flashcards', badge: 48 },
    { id: 'quizzes', label: 'Quizzes', badge: 6 },
    { id: 'progress', label: 'Progress', badge: null },
  ];

  return (
    <aside className="app-sidebar">
      <div className="sidebar-top">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="brand-icon-concentric" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#5845d8" strokeWidth="3" />
              <circle cx="12" cy="12" r="4.5" fill="#5845d8" />
            </svg>
          </div>
          <span className="brand-name">SkillLens</span>
        </div>

        {/* Navigation list */}
        <nav className="sidebar-nav" aria-label="Main Navigation">
          {navItems.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item-btn ${isActive ? 'active' : ''}`}
                onClick={() => onSelectNav?.(item.id)}
              >
                <span>{item.label}</span>
                {item.badge !== null && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Progress Card */}
      <div className="sidebar-bottom">
        <div className="sidebar-progress-card">
          <div className="progress-card-title">Thermodynamics</div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: '64%' }}></div>
          </div>
          <div className="progress-card-caption">
            64% mastered · 3 concepts to revisit
          </div>
        </div>
      </div>
    </aside>
  );
}
