import React, { useState } from 'react';
import AppLayout from './components/Layout/AppLayout';
import WorkspacePage from './pages/WorkspacePage';
import LibraryPage from './pages/LibraryPage';
import ProgressPage from './pages/ProgressPage';
import FlashcardSet from './components/Flashcards/FlashcardSet';
import QuizSet from './components/Quiz/QuizSet';
import { demoStudySet } from './data/demoContent';

import './styles/index.css';
import './styles/layout.css';
import './styles/workspace.css';

export default function App() {
  const [activeNav, setActiveNav] = useState('workspace');
  const [currentStudySet, setCurrentStudySet] = useState(null);
  const [savedStudySets, setSavedStudySets] = useState([demoStudySet]);
  const [activeOutputTab, setActiveOutputTab] = useState('overview');

  // Handle new study set generated from the Workspace
  const handleStudySetGenerated = (newSet) => {
    setCurrentStudySet(newSet);
    setSavedStudySets((prev) => [newSet, ...prev.filter((s) => s.title !== newSet.title)]);
  };

  // Export study set
  const handleExport = () => {
    const setToExport = currentStudySet || demoStudySet;
    const blob = new Blob([JSON.stringify(setToExport, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(setToExport.title || 'study-set').toLowerCase().replace(/\s+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Switch to study set from Library
  const handleSelectFromLibrary = (selectedSet) => {
    setCurrentStudySet(selectedSet);
    setActiveNav('workspace');
    setActiveOutputTab('overview');
  };

  return (
    <AppLayout
      activeNav={activeNav}
      onSelectNav={(navId) => setActiveNav(navId)}
      onExport={handleExport}
    >
      {/* 1. Workspace View (Mockup UI) */}
      {activeNav === 'workspace' && (
        <WorkspacePage
          studySet={currentStudySet}
          onStudySetGenerated={handleStudySetGenerated}
          activeOutputTab={activeOutputTab}
          setActiveOutputTab={setActiveOutputTab}
        />
      )}

      {/* 2. Library View */}
      {activeNav === 'library' && (
        <LibraryPage
          studySets={savedStudySets}
          onSelectStudySet={handleSelectFromLibrary}
        />
      )}

      {/* 3. Direct Flashcards View */}
      {activeNav === 'flashcards' && (
        <div>
          <div className="workspace-hero">
            <h1 className="workspace-title">Flashcards Practice</h1>
            <p className="workspace-subtitle">
              Active Set: <strong>{currentStudySet?.title || demoStudySet.title}</strong>
            </p>
          </div>
          <div className="study-results-workspace" style={{ marginTop: '1rem' }}>
            <FlashcardSet flashcards={currentStudySet?.flashcards || demoStudySet.flashcards} />
          </div>
        </div>
      )}

      {/* 4. Direct Quizzes View */}
      {activeNav === 'quizzes' && (
        <div>
          <div className="workspace-hero">
            <h1 className="workspace-title">Quizzes Assessment</h1>
            <p className="workspace-subtitle">
              Active Set: <strong>{currentStudySet?.title || demoStudySet.title}</strong>
            </p>
          </div>
          <div className="study-results-workspace" style={{ marginTop: '1rem' }}>
            <QuizSet quiz={currentStudySet?.quiz || demoStudySet.quiz} />
          </div>
        </div>
      )}

      {/* 5. Progress View */}
      {activeNav === 'progress' && (
        <ProgressPage currentStudySet={currentStudySet || demoStudySet} />
      )}
    </AppLayout>
  );
}
