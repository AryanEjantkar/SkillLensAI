import React, { useState, useMemo } from "react";
import { Sliders, RotateCcw } from "lucide-react";

export default function ProbabilityDistribution({ data = {}, title, description }) {
  const [mean, setMean] = useState(data.mean ?? 0);
  const [stdDev, setStdDev] = useState(data.std_dev ?? 1.5);
  const [threshold, setThreshold] = useState(data.threshold ?? 1.0);

  // Normal PDF formula
  const normalPdf = (x, mu, sigma) => {
    return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
  };

  // Cumulative probability approximation (erf based)
  const cdf = (x, mu, sigma) => {
    const z = (x - mu) / (sigma * Math.sqrt(2));
    // Abramowitz and Stegun erf approx
    const t = 1 / (1 + 0.3275911 * Math.abs(z));
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const erf = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-z * z);
    const signedErf = z >= 0 ? erf : -erf;
    return 0.5 * (1 + signedErf);
  };

  const cumulativeProb = useMemo(() => cdf(threshold, mean, stdDev), [threshold, mean, stdDev]);
  const zScore = useMemo(() => (threshold - mean) / stdDev, [threshold, mean, stdDev]);

  // SVG parameters
  const width = 600;
  const height = 320;
  const padding = 45;
  const xMin = mean - 4 * stdDev;
  const xMax = mean + 4 * stdDev;
  const yMax = normalPdf(mean, mean, stdDev) * 1.25;

  const toSvgX = (x) => padding + ((x - xMin) / (xMax - xMin)) * (width - 2 * padding);
  const toSvgY = (y) => height - padding - (y / yMax) * (height - 2 * padding);

  // Curve points
  const steps = 100;
  const dx = (xMax - xMin) / steps;
  const curvePts = [];
  const shadedPts = [`${toSvgX(xMin)},${toSvgY(0)}`];

  for (let i = 0; i <= steps; i++) {
    const x = xMin + i * dx;
    const y = normalPdf(x, mean, stdDev);
    const svgPt = `${toSvgX(x)},${toSvgY(y)}`;
    curvePts.push(svgPt);
    if (x <= threshold) {
      shadedPts.push(svgPt);
    }
  }
  shadedPts.push(`${toSvgX(Math.min(threshold, xMax))},${toSvgY(0)}`);

  return (
    <div className="vis-container prob-vis">
      <div className="vis-header">
        <div>
          <h4 className="vis-title">{title || "Continuous Probability Distribution (Gaussian Bell Curve)"}</h4>
          <p className="vis-description">
            {description || "Explore central tendency, variance dispersion, z-scores, and cumulative probability densities."}
          </p>
        </div>
        <button className="vis-btn-ghost" type="button" onClick={() => { setMean(0); setStdDev(1.5); setThreshold(1.0); }}>
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      </div>

      <div className="vis-workspace-grid">
        {/* SVG Distribution Plot */}
        <div className="vis-canvas-card">
          <svg viewBox={`0 0 ${width} ${height}`} className="prob-svg" role="img" aria-label="Gaussian distribution curve with shaded area">
            {/* Shaded Area under Curve */}
            <polygon points={shadedPts.join(" ")} fill="rgba(96, 81, 223, 0.25)" />

            {/* Base line */}
            <line x1={padding} y1={toSvgY(0)} x2={width - padding} y2={toSvgY(0)} stroke="#8c89a0" strokeWidth="2" />

            {/* Distribution Curve */}
            <path d={`M ${curvePts.join(" L ")}`} fill="none" stroke="#6051df" strokeWidth="3" />

            {/* Mean Center Line */}
            <line
              x1={toSvgX(mean)}
              y1={toSvgY(0)}
              x2={toSvgX(mean)}
              y2={toSvgY(normalPdf(mean, mean, stdDev))}
              stroke="#8c89a0"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />

            {/* Cutoff Threshold Line */}
            <line
              x1={toSvgX(threshold)}
              y1={toSvgY(0)}
              x2={toSvgX(threshold)}
              y2={toSvgY(normalPdf(threshold, mean, stdDev))}
              stroke="#e05368"
              strokeWidth="2.5"
            />
            <circle cx={toSvgX(threshold)} cy={toSvgY(normalPdf(threshold, mean, stdDev))} r="5" fill="#e05368" />
          </svg>

          {/* Badges */}
          <div className="vis-metric-badges">
            <div className="vis-badge">
              <span className="badge-label">P(X \u2264 {threshold.toFixed(2)})</span>
              <span className="badge-value">{(cumulativeProb * 100).toFixed(2)}%</span>
            </div>
            <div className="vis-badge">
              <span className="badge-label">Z-Score</span>
              <span className="badge-value">z = {zScore.toFixed(3)}</span>
            </div>
            <div className="vis-badge">
              <span className="badge-label">Mean (\u03bc)</span>
              <span className="badge-value">{mean.toFixed(1)}</span>
            </div>
            <div className="vis-badge">
              <span className="badge-label">Std Dev (\u03c3)</span>
              <span className="badge-value">{stdDev.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="vis-controls-card">
          <div className="vis-control-group">
            <span className="control-section-title"><Sliders size={14} /> Distribution Parameters</span>

            {/* Threshold Slider */}
            <label className="vis-slider-label">
              <div className="slider-header">
                <span>Threshold Value (x)</span>
                <span className="slider-num">{threshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={mean - 3 * stdDev}
                max={mean + 3 * stdDev}
                step="0.1"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
              />
            </label>

            {/* Mean Slider */}
            <label className="vis-slider-label">
              <div className="slider-header">
                <span>Mean (\u03bc)</span>
                <span className="slider-num">{mean.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="-5"
                max="5"
                step="0.5"
                value={mean}
                onChange={(e) => setMean(parseFloat(e.target.value))}
              />
            </label>

            {/* Std Dev Slider */}
            <label className="vis-slider-label">
              <div className="slider-header">
                <span>Standard Deviation (\u03c3)</span>
                <span className="slider-num">{stdDev.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.5"
                step="0.25"
                value={stdDev}
                onChange={(e) => setStdDev(parseFloat(e.target.value))}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
