import React, { useState } from "react";
import { Clock, ChevronRight, Bookmark } from "lucide-react";

export default function TimelineFlow({ data = {}, title, description }) {
  const defaultEvents = [
    {
      date: "Initial Era / Origin",
      title: "Foundational Precedent Established",
      description: "Primary statutes, seminal experiments, or historical events that formed the baseline understanding.",
      significance: "Established baseline standards and canonical vocabulary.",
    },
    {
      date: "Intermediate Period",
      title: "Evolution & Structural Reinterpretation",
      description: "Doctrinal shift or theoretical advancement prompted by edge-case challenges or technological emergence.",
      significance: "Refined boundary constraints and adapted to modern complexity.",
    },
    {
      date: "Modern Era",
      title: "Contemporary Framework & Doctrine",
      description: "Current prevailing legal standard, scientific consensus, or analytical paradigm.",
      significance: "Governs modern applications, adjudications, and system architectures.",
    },
  ];

  const events = Array.isArray(data.events) && data.events.length > 0 ? data.events : defaultEvents;
  const [selectedIdx, setSelectedIdx] = useState(0);

  const selectedEvent = events[selectedIdx] || events[0];

  return (
    <div className="vis-container timeline-flow-vis">
      <div className="vis-header">
        <div>
          <h4 className="vis-title">{title || "Chronological & Doctrinal Progression Flow"}</h4>
          <p className="vis-description">
            {description || "Trace sequential evolution, legal case precedents, and milestone developments over time."}
          </p>
        </div>
      </div>

      <div className="vis-workspace-grid">
        {/* Timeline Path Canvas */}
        <div className="vis-canvas-card">
          <div className="timeline-horizontal-scroll">
            <div className="timeline-track">
              {events.map((ev, idx) => {
                const isActive = idx === selectedIdx;
                return (
                  <div
                    key={idx}
                    className={`timeline-node-card ${isActive ? "active" : ""}`}
                    onClick={() => setSelectedIdx(idx)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="node-marker-row">
                      <span className="node-dot" />
                      <span className="node-date">{ev.date}</span>
                    </div>
                    <h5 className="node-title">{ev.title}</h5>
                    <p className="node-preview">{ev.description.slice(0, 75)}...</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Milestone Details */}
        <div className="vis-controls-card">
          <div className="vis-control-group">
            <span className="control-section-title"><Clock size={14} /> Milestone In-Depth</span>
            <div className="timeline-detail-card">
              <span className="timeline-date-badge">{selectedEvent.date}</span>
              <h4 className="timeline-detail-title">{selectedEvent.title}</h4>
              <p className="timeline-detail-desc">{selectedEvent.description}</p>
              {selectedEvent.significance && (
                <div className="timeline-significance-box">
                  <Bookmark size={15} />
                  <div>
                    <strong>Pedagogical Significance:</strong>
                    <p>{selectedEvent.significance}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
