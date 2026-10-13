import React, { useState } from "react";
import { ChevronRight, ChevronLeft, Flame, Info } from "lucide-react";

export default function ChemistryReaction({ data = {}, title, description }) {
  const reactionName = data.reaction_name || "Chemical Reaction Mechanism";
  const equation = data.equation || "Reactants \u2192 Products";

  const defaultSteps = [
    {
      step: 1,
      title: "Reactant Proximity & Alignment",
      description: "Reactant molecules collide with sufficient kinetic energy and correct geometric orientation.",
      energy_kj: 20,
      bonds: "Intact covalent bonds in reactants",
      phase: "Reactants",
    },
    {
      step: 2,
      title: "Transition State Complex",
      description: "Bonds begin stretching and breaking; temporary high-energy activated complex forms at peak activation energy.",
      energy_kj: 85,
      bonds: "Partial breaking and forming bonds (\u2022\u2022\u2022)",
      phase: "Transition State (Activated Complex)",
    },
    {
      step: 3,
      title: "Intermediate Rearrangement",
      description: "Charge stabilization and functional group migration occur along the reaction coordinate.",
      energy_kj: 55,
      bonds: "Reorganized reactive intermediate",
      phase: "Intermediate",
    },
    {
      step: 4,
      title: "Product Release & Stabilization",
      description: "New stable chemical bonds lock into place, dissipating excess enthalpy.",
      energy_kj: 10,
      bonds: "Stable product bond configurations",
      phase: "Products",
    },
  ];

  const steps = Array.isArray(data.steps) && data.steps.length > 0 ? data.steps : defaultSteps;
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [temperature, setTemperature] = useState(298); // Kelvin

  const currentStep = steps[currentStepIdx] || steps[0];
  const totalSteps = steps.length;

  const activationEnergy = data.activation_energy ?? 85;
  const enthalpyDelta = data.enthalpy_delta ?? -15; // negative = exothermic

  // Potential energy curve coordinates
  const width = 600;
  const height = 240;
  const padding = 35;

  // Render SVG curve for energy coordinate
  const points = steps.map((s, idx) => {
    const x = padding + (idx / (totalSteps - 1)) * (width - 2 * padding);
    const maxE = Math.max(...steps.map((st) => st.energy_kj ?? 50), activationEnergy) * 1.25;
    const y = height - padding - ((s.energy_kj ?? 30) / maxE) * (height - 2 * padding);
    return { x, y, energy: s.energy_kj ?? 30, title: s.title };
  });

  const pathD = points.reduce((acc, pt, idx, arr) => {
    if (idx === 0) return `M ${pt.x},${pt.y}`;
    const prev = arr[idx - 1];
    const cpX = (prev.x + pt.x) / 2;
    return `${acc} C ${cpX},${prev.y} ${cpX},${pt.y} ${pt.x},${pt.y}`;
  }, "");

  return (
    <div className="vis-container chemistry-reaction-vis">
      <div className="vis-header">
        <div>
          <h4 className="vis-title">{title || reactionName}</h4>
          <p className="vis-description">
            {description || "Explore reaction kinetics, thermodynamic energy coordinates, and step-by-step molecular transformation."}
          </p>
        </div>
        <div className="chem-equation-pill">
          <code>{equation}</code>
        </div>
      </div>

      <div className="vis-workspace-grid">
        {/* Reaction Coordinate Energy Graph */}
        <div className="vis-canvas-card">
          <svg viewBox={`0 0 ${width} ${height}`} className="chem-svg" role="img" aria-label="Reaction energy profile">
            {/* Grid & Axis */}
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#8c89a0" strokeWidth="2" />
            <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#8c89a0" strokeWidth="2" />
            <text x={width - padding} y={height - padding + 20} fill="#75728a" fontSize="10" textAnchor="end">Reaction Progress \u2192</text>
            <text x={padding - 10} y={padding - 5} fill="#75728a" fontSize="10" textAnchor="start">Potential Energy (kJ/mol)</text>

            {/* Smooth Reaction Energy Curve */}
            <path d={pathD} fill="none" stroke="#6051df" strokeWidth="3" />

            {/* Stepper Nodes */}
            {points.map((pt, idx) => {
              const isActive = idx === currentStepIdx;
              return (
                <g key={idx} onClick={() => setCurrentStepIdx(idx)} style={{ cursor: "pointer" }}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isActive ? 8 : 5}
                    fill={isActive ? "#e05368" : "#6051df"}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  <text
                    x={pt.x}
                    y={pt.y - 14}
                    fill={isActive ? "#e05368" : "#75728a"}
                    fontSize="10"
                    fontWeight={isActive ? "bold" : "normal"}
                    textAnchor="middle"
                  >
                    Step {idx + 1}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Metrics bar */}
          <div className="vis-metric-badges">
            <div className="vis-badge">
              <span className="badge-label">Activation Energy (Ea)</span>
              <span className="badge-value">+{activationEnergy} kJ/mol</span>
            </div>
            <div className="vis-badge">
              <span className="badge-label">Enthalpy (\u0394H)</span>
              <span className="badge-value">{enthalpyDelta < 0 ? `${enthalpyDelta} kJ (Exothermic)` : `+${enthalpyDelta} kJ (Endothermic)`}</span>
            </div>
            <div className="vis-badge">
              <span className="badge-label">Temperature</span>
              <span className="badge-value">{temperature} K ({(temperature - 273.15).toFixed(0)} °C)</span>
            </div>
          </div>
        </div>

        {/* Step Breakdown & Controls */}
        <div className="vis-controls-card">
          <div className="vis-control-group">
            <div className="chem-step-tracker">
              <span className="step-counter">
                Stage {currentStepIdx + 1} of {totalSteps}
              </span>
              <div className="step-nav-buttons">
                <button
                  type="button"
                  className="vis-btn-ghost"
                  disabled={currentStepIdx === 0}
                  onClick={() => setCurrentStepIdx((i) => Math.max(0, i - 1))}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  className="vis-btn-primary"
                  disabled={currentStepIdx === totalSteps - 1}
                  onClick={() => setCurrentStepIdx((i) => Math.min(totalSteps - 1, i + 1))}
                >
                  <span>Next Step</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="chem-step-details">
              <h5 className="chem-step-title">{currentStep.title}</h5>
              <p className="chem-step-desc">{currentStep.description}</p>
              {currentStep.bonds && (
                <div className="chem-bond-note">
                  <Info size={14} />
                  <span><strong>Bond Status:</strong> {currentStep.bonds}</span>
                </div>
              )}
            </div>

            <div className="control-divider" />

            <label className="vis-slider-label">
              <div className="slider-header">
                <span>System Temperature (Arrhenius Rate)</span>
                <span className="slider-num">{temperature} K</span>
              </div>
              <input
                type="range"
                min="250"
                max="500"
                step="5"
                value={temperature}
                onChange={(e) => setTemperature(parseInt(e.target.value, 10))}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
