import React from 'react';
import { Home, ChevronDown, MessageSquare, Sparkles, Download, Maximize2 } from 'lucide-react';

export default function Header({ currentStudyTitle, onExport }) {
  return (
    <header className="top-header">
      <div className="top-header-left">
        <button className="btn-header-home" title="Home">
          <Home size={17} />
        </button>
        <button className="header-dropdown-trigger" title="Workspace options">
          <span>SkillLens AI</span>
          <ChevronDown size={14} />
        </button>
      </div>

      <div className="top-header-right">
        {/* User avatar */}
        <div className="user-avatar-circle" title="Account (Alex)">
          A
        </div>

        {/* Chat / Notifications */}
        <button className="btn-header-icon" title="Feedback / Comments">
          <MessageSquare size={16} />
        </button>

        {/* Chat Assistant */}
        <button className="btn-header-action" title="AI Tutor Chat">
          <Sparkles size={14} className="sparkle-icon" />
          <span>Chat</span>
        </button>

        {/* Export study set */}
        <button
          className="btn-header-action"
          title="Export Flashcards & Notes"
          onClick={onExport}
        >
          <Download size={14} />
          <span>Export</span>
        </button>

        {/* Maximize */}
        <button className="btn-header-icon" title="Full screen">
          <Maximize2 size={15} />
        </button>
      </div>
    </header>
  );
}
