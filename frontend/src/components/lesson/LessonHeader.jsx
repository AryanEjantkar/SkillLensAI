import React from "react";
import { Sparkles, Compass, ShieldAlert, BookOpen, Layers } from "lucide-react";

export default function LessonHeader({ lesson, onOpenTutor }) {
  if (!lesson) return null;

  const subjectNames = {
    mathematics: "Mathematics",
    physics: "Physics",
    chemistry: "Chemistry",
    biology: "Biology",
    computer_science: "Computer Science",
    economics: "Economics",
    law: "Law & Jurisprudence",
    arts_humanities: "Arts & Humanities",
    general: "Universal Study",
  };

  const subjectLabel = subjectNames[lesson.subject] || lesson.subject || "Universal Study";

  return (
    <div className="lesson-header-banner">
      <div className="lesson-header-top">
        <div className="lesson-tags-row">
          <span className="lesson-tag subject-tag">
            <Compass size={13} />
            <span>{subjectLabel}</span>
          </span>
          <span className="lesson-tag difficulty-tag">
            <span>{lesson.difficulty || "Intermediate"}</span>
          </span>
          {lesson.metadata?.model && (
            <span className="lesson-tag model-tag">
              <Sparkles size={12} />
              <span>{lesson.metadata.model}</span>
            </span>
          )}
        </div>

        {onOpenTutor && (
          <button type="button" className="tutor-launch-btn" onClick={onOpenTutor}>
            <Sparkles size={14} />
            <span>Ask Adaptive Tutor</span>
          </button>
        )}
      </div>

      <h2 className="lesson-main-title">{lesson.topic}</h2>
      {lesson.subtopic && <p className="lesson-subtopic-lead">{lesson.subtopic}</p>}

      {/* Learning Objectives Pills */}
      {lesson.learning_objectives && lesson.learning_objectives.length > 0 && (
        <div className="lesson-objectives-box">
          <span className="objectives-heading">
            <BookOpen size={13} /> Learning Objectives:
          </span>
          <ul className="objectives-list">
            {lesson.learning_objectives.map((obj, idx) => (
              <li key={idx} className="objective-item">
                <span className="obj-bullet" />
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
