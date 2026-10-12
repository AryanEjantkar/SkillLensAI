import React, { useState, useRef } from 'react';
import {
  AlignLeft,
  Image as ImageIcon,
  FileText,
  Link as LinkIcon,
  X,
  Sparkles,
  BookOpen,
  HelpCircle,
  Award,
  Layers,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

import FlashcardSet from '../components/Flashcards/FlashcardSet';
import QuizSet from '../components/Quiz/QuizSet';
import { analyzeContent } from '../services/api';

export default function WorkspacePage({
  studySet,
  onStudySetGenerated,
  activeOutputTab,
  setActiveOutputTab,
}) {
  // Input Form State
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [inputMode, setInputMode] = useState('text'); // 'text', 'image', 'document', 'link'
  const [filterMode, setFilterMode] = useState('all'); // 'explain', 'flashcards', 'quiz', 'all'
  const [isDragOver, setIsDragOver] = useState(false);

  // Workflow State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const fileInputRef = useRef(null);

  // Drag and Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageSelection(e.dataTransfer.files[0]);
    }
  };

  const handleImageSelection = (file) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage(`Please select an image file (PNG, JPG, WEBP, GIF). Received: ${file.type || 'unknown'}`);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size exceeds maximum upload limit of 5 MB.');
      return;
    }
    setSelectedImage(file);
    setErrorMessage(null);
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Submit & Generate Study Set
  const handleCreateStudySet = async () => {
    const trimmedText = inputText.trim();

    if (!trimmedText && !selectedImage) {
      setErrorMessage('Please enter notes or a question to analyze.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await analyzeContent({
        text: trimmedText,
        image: selectedImage,
      });

      onStudySetGenerated?.(data);

      // Automatically switch to chosen filter tab if specific, else 'overview'
      if (filterMode === 'explain') setActiveOutputTab('explanation');
      else if (filterMode === 'flashcards') setActiveOutputTab('flashcards');
      else if (filterMode === 'quiz') setActiveOutputTab('quiz');
      else setActiveOutputTab('overview');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to generate study set. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="workspace-page-container">
      {/* 1. Header Hero Title matching Mockup */}
      <div className="workspace-hero">
        <h1 className="workspace-title">What are you studying today?</h1>
        <p className="workspace-subtitle">
          Add notes, a photo, a slide or a question. SkillLens turns it into an explanation,
          flashcards and a quiz.
        </p>
      </div>

      {/* 2. Main Input Card matching Mockup */}
      <div
        className={`study-input-card ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleImageSelection(e.target.files[0]);
            }
          }}
        />

        {/* Top Input Mode Selector Pills */}
        <div className="input-mode-tabs">
          <button
            type="button"
            className={`mode-tab-btn ${inputMode === 'text' ? 'active' : ''}`}
            onClick={() => setInputMode('text')}
          >
            <AlignLeft size={14} />
            <span>Text</span>
          </button>

          <button
            type="button"
            className={`mode-tab-btn ${inputMode === 'image' || selectedImage ? 'active' : ''}`}
            onClick={() => {
              setInputMode('image');
              fileInputRef.current?.click();
            }}
          >
            <ImageIcon size={14} />
            <span>Image</span>
          </button>

          <button
            type="button"
            className="mode-tab-btn disabled"
            title="PDF/Document support coming soon"
          >
            <FileText size={14} />
            <span>Document</span>
          </button>

          <button
            type="button"
            className="mode-tab-btn disabled"
            title="Web links coming soon"
          >
            <LinkIcon size={14} />
            <span>Link</span>
          </button>
        </div>

        <div className="input-divider" />

        {/* Textarea */}
        <textarea
          className="study-textarea"
          rows={3}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste notes or ask a question, e.g. Explain entropy like I'm new to physics"
          disabled={isLoading}
        />

        {/* Image Attachment Preview */}
        {selectedImage && (
          <div className="file-attachment-dock">
            <div className="file-info-group">
              <img
                src={URL.createObjectURL(selectedImage)}
                alt="Selected attachment preview"
                className="image-preview-thumbnail"
              />
              <div className="file-text-details">
                <span className="file-name">{selectedImage.name}</span>
                <span className="file-size">
                  {(selectedImage.size / 1024).toFixed(1)} KB
                </span>
              </div>
            </div>
            <button
              onClick={removeSelectedImage}
              className="btn-remove-attachment"
              title="Remove image"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Bottom Actions Bar */}
        <div className="card-actions-bar">
          {/* Segmented Filter Pills */}
          <div className="segmented-pills-group">
            {['explain', 'flashcards', 'quiz', 'all'].map((mode) => (
              <button
                key={mode}
                type="button"
                className={`segmented-pill-btn ${filterMode === mode ? 'active' : ''}`}
                onClick={() => setFilterMode(mode)}
              >
                {mode === 'explain' ? 'Explain' : mode === 'flashcards' ? 'Flashcards' : mode === 'quiz' ? 'Quiz' : 'All'}
              </button>
            ))}
          </div>

          {/* Submit Button */}
          <button
            type="button"
            className="btn-create-set"
            onClick={handleCreateStudySet}
            disabled={isLoading || (!inputText.trim() && !selectedImage)}
          >
            {isLoading ? (
              <>
                <Sparkles size={15} className="spinner-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <span>Create study set</span>
            )}
          </button>
        </div>
      </div>

      <p className="input-tip-caption">Tip: drag files anywhere onto the box above.</p>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="workspace-alert" role="alert">
          <div className="alert-content-group">
            <AlertCircle size={17} />
            <span>{errorMessage}</span>
          </div>
          <button
            className="btn-alert-dismiss"
            onClick={() => setErrorMessage(null)}
            title="Dismiss error"
          >
            &times;
          </button>
        </div>
      )}

      {/* 3. Output / Results Section */}
      {isLoading ? (
        <div className="loading-output-box">
          <div className="spinner-ring" />
          <h3 className="loading-headline">Analyzing with Gemma 4...</h3>
          <p className="loading-subtext">
            Synthesizing key concepts, generating structured flashcards, and crafting quiz questions.
          </p>
        </div>
      ) : !studySet ? (
        /* Empty State Box matching Mockup */
        <div className="empty-output-box">
          Your explanation, flashcards and quiz will appear here.
        </div>
      ) : (
        /* Generated Study Workspace */
        <div className="study-results-workspace">
          {/* Workspace Tabs Navigation */}
          <div className="workspace-tabs-nav">
            <button
              className={`tab-nav-btn ${activeOutputTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveOutputTab('overview')}
            >
              <BookOpen size={15} />
              <span>Overview</span>
            </button>

            <button
              className={`tab-nav-btn ${activeOutputTab === 'explanation' ? 'active' : ''}`}
              onClick={() => setActiveOutputTab('explanation')}
            >
              <FileText size={15} />
              <span>Explanation</span>
            </button>

            <button
              className={`tab-nav-btn ${activeOutputTab === 'flashcards' ? 'active' : ''}`}
              onClick={() => setActiveOutputTab('flashcards')}
            >
              <Layers size={15} />
              <span>Flashcards ({studySet.flashcards?.length || 0})</span>
            </button>

            <button
              className={`tab-nav-btn ${activeOutputTab === 'quiz' ? 'active' : ''}`}
              onClick={() => setActiveOutputTab('quiz')}
            >
              <Award size={15} />
              <span>Quiz ({studySet.quiz?.length || 0})</span>
            </button>
          </div>

          {/* Tab 1: Overview */}
          {activeOutputTab === 'overview' && (
            <div className="tab-pane-overview">
              <h2 className="overview-title">{studySet.title}</h2>
              <div className="summary-callout">
                <p>{studySet.summary}</p>
              </div>

              <div className="study-metrics-grid">
                <div className="metric-card">
                  <div className="metric-card-number">{studySet.flashcards?.length || 0}</div>
                  <div className="metric-card-label">Flashcards Generated</div>
                </div>

                <div className="metric-card">
                  <div className="metric-card-number">{studySet.quiz?.length || 0}</div>
                  <div className="metric-card-label">Quiz Questions</div>
                </div>
              </div>

              <div className="overview-cta-row">
                <button
                  className="btn-primary-action"
                  onClick={() => setActiveOutputTab('flashcards')}
                >
                  <span>Start Practice Session</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Explanation */}
          {activeOutputTab === 'explanation' && (
            <div className="tab-pane-explanation">
              <h2 className="overview-title">{studySet.title}</h2>
              <div className="explanation-content-body">
                {studySet.explanation.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Flashcards */}
          {activeOutputTab === 'flashcards' && (
            <div className="tab-pane-flashcards">
              <FlashcardSet flashcards={studySet.flashcards} />
            </div>
          )}

          {/* Tab 4: Quiz */}
          {activeOutputTab === 'quiz' && (
            <div className="tab-pane-quiz">
              <QuizSet quiz={studySet.quiz} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
