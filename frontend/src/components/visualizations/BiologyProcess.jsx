import React, { useState } from "react";
import { Layers, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";

export default function BiologyProcess({ data = {}, title, description }) {
  const processName = data.process_name || "Biological Process & Cellular Architecture";

  const defaultStages = [
    {
      stage: 1,
      name: "Phase 1: Reception & Substrate Influx",
      location: "Cellular Membrane / Cytoplasm",
      inputs: ["Primary Substrates", "Signal Ligands"],
      outputs: ["Activated Complexes", "Early Intermediates"],
      description: "Substrates enter the cellular compartment via specialized transporters or receptor binding.",
    },
    {
      stage: 2,
      name: "Phase 2: Enzymatic Processing & Cycle",
      location: "Organelle Matrix / Nucleus",
      inputs: ["Precursors", "Cofactors (ATP/NADH)"],
      outputs: ["Synthesized Molecules", "Byproducts (CO2/H2O)"],
      description: "A cascade of enzyme-mediated redox or catalytic reactions transforms substrates into functional units.",
    },
    {
      stage: 3,
      name: "Phase 3: Energy Coupling & Efflux",
      location: "Inner Mitochondrial Membrane / Vesicles",
      inputs: ["Proton Gradient", "ADP + Pi"],
      outputs: ["High-Energy ATP", "Exported Metabolites"],
      description: "Chemiosmotic potential or vesicular trafficking completes the physiological cycle.",
    },
  ];

  const stages = Array.isArray(data.stages) && data.stages.length > 0 ? data.stages : defaultStages;
  const hotspots = Array.isArray(data.hotspots) && data.hotspots.length > 0 ? data.hotspots : [
    { id: "hs-1", x: 28, y: 35, label: "Outer Membrane", detail: "Lipid bilayer providing selective permeability." },
    { id: "hs-2", x: 50, y: 55, label: "Enzymatic Active Zone", detail: "Site where catalytic subunits dock with substrates." },
    { id: "hs-3", x: 74, y: 65, label: "Transport Channel", detail: "Transmembrane pore driving directional molecular flux." },
  ];

  const [activeStageIdx, setActiveStageIdx] = useState(0);
  const [selectedHotspot, setSelectedHotspot] = useState(hotspots[0]);

  const currentStage = stages[activeStageIdx] || stages[0];

  return (
    <div className="vis-container bio-process-vis">
      <div className="vis-header">
        <div>
          <h4 className="vis-title">{title || processName}</h4>
          <p className="vis-description">
            {description || "Explore physiological stages, cellular compartments, and interactive molecular hotspots."}
          </p>
        </div>
      </div>

      <div className="vis-workspace-grid">
        {/* Interactive Diagram Canvas */}
        <div className="vis-canvas-card">
          <div className="bio-diagram-wrapper">
            <svg viewBox="0 0 540 320" className="bio-svg" role="img" aria-label="Cellular anatomical diagram">
              <defs>
                <radialGradient id="organelle-gradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f0eeff" />
                  <stop offset="70%" stopColor="#e3dffc" />
                  <stop offset="100%" stopColor="#cdc5f7" />
                </radialGradient>
              </defs>

              {/* Organelle Outer Hull */}
              <ellipse cx="270" cy="160" rx="230" ry="120" fill="url(#organelle-gradient)" stroke="#6051df" strokeWidth="2.5" />

              {/* Inner Cristae / Compartment folds */}
              <path
                d="M 120 160 Q 180 110, 240 160 T 360 160 T 420 160"
                fill="none"
                stroke="#6051df"
                strokeWidth="2.5"
                strokeDasharray="6 4"
              />
              <path
                d="M 160 190 Q 220 140, 280 190 T 380 190"
                fill="none"
                stroke="#8c7cf0"
                strokeWidth="2"
              />

              {/* Hotspots */}
              {hotspots.map((hs) => {
                const isSelected = selectedHotspot?.id === hs.id;
                const px = (hs.x / 100) * 540;
                const py = (hs.y / 100) * 320;
                return (
                  <g key={hs.id} onClick={() => setSelectedHotspot(hs)} style={{ cursor: "pointer" }}>
                    <circle
                      cx={px}
                      cy={py}
                      r={isSelected ? 14 : 9}
                      fill={isSelected ? "rgba(224, 83, 104, 0.25)" : "rgba(96, 81, 223, 0.2)"}
                    />
                    <circle
                      cx={px}
                      cy={py}
                      r={isSelected ? 6 : 5}
                      fill={isSelected ? "#e05368" : "#6051df"}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <text
                      x={px}
                      y={py - 12}
                      fill={isSelected ? "#e05368" : "#282445"}
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {hs.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Hotspot Info Popup Card */}
            {selectedHotspot && (
              <div className="bio-hotspot-info">
                <h6>{selectedHotspot.label}</h6>
                <p>{selectedHotspot.detail}</p>
              </div>
            )}
          </div>

          {/* Location & Phase Badges */}
          <div className="vis-metric-badges">
            <div className="vis-badge">
              <span className="badge-label">Active Site</span>
              <span className="badge-value">{currentStage.location}</span>
            </div>
            <div className="vis-badge">
              <span className="badge-label">Inputs</span>
              <span className="badge-value">{currentStage.inputs?.join(", ") || "Substrates"}</span>
            </div>
            <div className="vis-badge">
              <span className="badge-label">Key Yield</span>
              <span className="badge-value">{currentStage.outputs?.join(", ") || "Products"}</span>
            </div>
          </div>
        </div>

        {/* Stepper Controls & Stage Breakdown */}
        <div className="vis-controls-card">
          <div className="vis-control-group">
            <div className="chem-step-tracker">
              <span className="step-counter">
                Stage {activeStageIdx + 1} of {stages.length}
              </span>
              <div className="step-nav-buttons">
                <button
                  type="button"
                  className="vis-btn-ghost"
                  disabled={activeStageIdx === 0}
                  onClick={() => setActiveStageIdx((i) => Math.max(0, i - 1))}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  className="vis-btn-primary"
                  disabled={activeStageIdx === stages.length - 1}
                  onClick={() => setActiveStageIdx((i) => Math.min(stages.length - 1, i + 1))}
                >
                  <span>Next Phase</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="chem-step-details">
              <h5 className="chem-step-title">{currentStage.name}</h5>
              <p className="chem-step-desc">{currentStage.description}</p>
            </div>

            <div className="bio-stages-list">
              <span className="control-section-title"><Layers size={14} /> Pathway Progression</span>
              {stages.map((stg, idx) => (
                <div
                  key={idx}
                  className={`bio-stage-pill ${idx === activeStageIdx ? "active" : ""}`}
                  onClick={() => setActiveStageIdx(idx)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="pill-indicator">
                    {idx === activeStageIdx ? <span className="active-dot" /> : <CheckCircle2 size={13} />}
                  </div>
                  <span>{stg.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
