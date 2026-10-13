import React, { useState, useMemo } from "react";
import { RotateCcw, Sliders, Eye, EyeOff } from "lucide-react";
import FormulaRenderer from "../common/FormulaRenderer";

export default function MathGraph({ data = {}, title, description }) {
  // Extract parameters or defaults
  const initialParams = useMemo(() => {
    const map = {};
    if (Array.isArray(data.parameters)) {
      data.parameters.forEach((p) => {
        map[p.name] = p.default ?? (p.min + p.max) / 2;
      });
    } else {
      map.a = 1;
      map.b = 0;
      map.c = -4;
    }
    return map;
  }, [data.parameters]);

  const [params, setParams] = useState(initialParams);
  const [tangentX, setTangentX] = useState(data.tangent_point ?? 1.0);
  const [showTangent, setShowTangent] = useState(true);
  const [showIntegral, setShowIntegral] = useState(true);
  const [riemannN, setRiemannN] = useState(data.riemann_n ?? 8);
  const [fnType, setFnType] = useState(data.function_type || "polynomial"); // polynomial, trig, exponential

  const xMin = data.x_range?.[0] ?? -5;
  const xMax = data.x_range?.[1] ?? 5;
  const yMin = data.y_range?.[0] ?? -8;
  const yMax = data.y_range?.[1] ?? 10;

  const integralA = data.integral_range?.[0] ?? 0;
  const integralB = data.integral_range?.[1] ?? 2.5;

  // Function evaluation
  const evaluateF = (x, p = params) => {
    const a = p.a ?? 1;
    const b = p.b ?? 0;
    const c = p.c ?? 0;
    if (fnType === "trig") {
      return a * Math.sin(b * x + c);
    } else if (fnType === "exponential") {
      return a * Math.exp(0.5 * x) + c;
    } else {
      // polynomial: a*x^2 + b*x + c
      return a * x * x + b * x + c;
    }
  };

  // Derivative approximation
  const evaluateDeriv = (x) => {
    const h = 0.001;
    return (evaluateF(x + h) - evaluateF(x - h)) / (2 * h);
  };

  // SVG coordinate transformation
  const width = 640;
  const height = 360;
  const padding = 40;

  const toSvgX = (x) => padding + ((x - xMin) / (xMax - xMin)) * (width - 2 * padding);
  const toSvgY = (y) => height - padding - ((y - yMin) / (yMax - yMin)) * (height - 2 * padding);

  // Generate curve path
  const curvePath = useMemo(() => {
    const points = [];
    const steps = 150;
    const dx = (xMax - xMin) / steps;
    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * dx;
      const y = evaluateF(x);
      const clampedY = Math.max(yMin - 5, Math.min(yMax + 5, y));
      points.push(`${toSvgX(x)},${toSvgY(clampedY)}`);
    }
    return `M ${points.join(" L ")}`;
  }, [params, fnType, xMin, xMax, yMin, yMax]);

  // Riemann rectangles
  const riemannRects = useMemo(() => {
    if (!showIntegral) return [];
    const rects = [];
    const dx = (integralB - integralA) / riemannN;
    for (let i = 0; i < riemannN; i++) {
      const xLeft = integralA + i * dx;
      const xMid = xLeft + dx / 2;
      const yVal = evaluateF(xMid);
      const svgX = toSvgX(xLeft);
      const svgW = toSvgX(xLeft + dx) - svgX;
      const svgZeroY = toSvgY(0);
      const svgCurveY = toSvgY(yVal);
      const rectY = Math.min(svgZeroY, svgCurveY);
      const rectH = Math.abs(svgZeroY - svgCurveY);

      rects.push({
        x: svgX,
        y: rectY,
        width: svgW,
        height: rectH,
        val: yVal,
      });
    }
    return rects;
  }, [params, fnType, showIntegral, riemannN, integralA, integralB]);

  // Riemann sum & exact integral calculation
  const riemannSumValue = useMemo(() => {
    const dx = (integralB - integralA) / riemannN;
    let sum = 0;
    for (let i = 0; i < riemannN; i++) {
      const xMid = integralA + (i + 0.5) * dx;
      sum += evaluateF(xMid) * dx;
    }
    return sum;
  }, [params, fnType, riemannN, integralA, integralB]);

  // Tangent line endpoints
  const tangentData = useMemo(() => {
    const y0 = evaluateF(tangentX);
    const m = evaluateDeriv(tangentX);
    const span = 2.0;
    const x1 = tangentX - span;
    const y1 = y0 - m * span;
    const x2 = tangentX + span;
    const y2 = y0 + m * span;

    return {
      x0: tangentX,
      y0,
      slope: m,
      svgX0: toSvgX(tangentX),
      svgY0: toSvgY(y0),
      svgX1: toSvgX(x1),
      svgY1: toSvgY(y1),
      svgX2: toSvgX(x2),
      svgY2: toSvgY(y2),
    };
  }, [tangentX, params, fnType]);

  const handleReset = () => {
    setParams(initialParams);
    setTangentX(data.tangent_point ?? 1.0);
    setRiemannN(8);
  };

  return (
    <div className="vis-container math-graph-vis">
      <div className="vis-header">
        <div>
          <h4 className="vis-title">{title || "Interactive Mathematical Function & Calculus Engine"}</h4>
          <p className="vis-description">
            {description || "Explore function curvature, tangent slope (derivative), and area under the curve (integral/Riemann sum)."}
          </p>
        </div>
        <button className="vis-btn-ghost" type="button" onClick={handleReset} title="Reset variables">
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      </div>

      <div className="vis-workspace-grid">
        {/* Interactive SVG Display */}
        <div className="vis-canvas-card">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="math-svg"
            role="img"
            aria-label="Mathematical graph plotting function, tangent line, and Riemann rectangles"
          >
            <defs>
              <pattern id="math-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#edeaf5" strokeWidth="1" />
              </pattern>
            </defs>

            {/* Grid */}
            <rect width={width} height={height} fill="url(#math-grid)" />

            {/* Axes */}
            <line
              x1={toSvgX(xMin)}
              y1={toSvgY(0)}
              x2={toSvgX(xMax)}
              y2={toSvgY(0)}
              stroke="#8c89a0"
              strokeWidth="2"
            />
            <line
              x1={toSvgX(0)}
              y1={toSvgY(yMin)}
              x2={toSvgX(0)}
              y2={toSvgY(yMax)}
              stroke="#8c89a0"
              strokeWidth="2"
            />

            {/* Riemann rectangles */}
            {riemannRects.map((r, idx) => (
              <rect
                key={idx}
                x={r.x}
                y={r.y}
                width={r.width}
                height={r.height}
                fill="rgba(96, 81, 223, 0.22)"
                stroke="#6051df"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
            ))}

            {/* Main function curve */}
            <path d={curvePath} fill="none" stroke="#6051df" strokeWidth="3.2" strokeLinecap="round" />

            {/* Tangent line */}
            {showTangent && (
              <>
                <line
                  x1={tangentData.svgX1}
                  y1={tangentData.svgY1}
                  x2={tangentData.svgX2}
                  y2={tangentData.svgY2}
                  stroke="#e05368"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                />
                <circle
                  cx={tangentData.svgX0}
                  cy={tangentData.svgY0}
                  r="5"
                  fill="#e05368"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              </>
            )}

            {/* Axis labels */}
            <text x={toSvgX(xMax) - 15} y={toSvgY(0) - 8} fill="#75728a" fontSize="11" fontWeight="600">x</text>
            <text x={toSvgX(0) + 8} y={toSvgY(yMax) + 15} fill="#75728a" fontSize="11" fontWeight="600">y</text>
          </svg>

          {/* Live Metric Badges */}
          <div className="vis-metric-badges">
            <div className="vis-badge">
              <span className="badge-label">Tangent at x = {tangentData.x0.toFixed(2)}</span>
              <span className="badge-value">f'({tangentData.x0.toFixed(1)}) = {tangentData.slope.toFixed(3)}</span>
            </div>
            {showIntegral && (
              <div className="vis-badge">
                <span className="badge-label">Riemann Area ({riemannN} rects)</span>
                <span className="badge-value">≈ {riemannSumValue.toFixed(3)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Controls Panel */}
        <div className="vis-controls-card">
          <div className="vis-control-group">
            <span className="control-section-title">
              <Sliders size={14} /> Function Parameters
            </span>

            {/* Parameter sliders */}
            {Object.keys(params).map((k) => (
              <label key={k} className="vis-slider-label">
                <div className="slider-header">
                  <span>Parameter <strong>{k}</strong></span>
                  <span className="slider-num">{Number(params[k]).toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-4"
                  max="4"
                  step="0.25"
                  value={params[k]}
                  onChange={(e) => setParams({ ...params, [k]: parseFloat(e.target.value) })}
                />
              </label>
            ))}

            <div className="control-divider" />

            <span className="control-section-title">Calculus Explorations</span>

            {/* Tangent point slider */}
            <label className="vis-slider-label">
              <div className="slider-header">
                <span>Tangent Point (x₀)</span>
                <span className="slider-num">{tangentX.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={xMin}
                max={xMax}
                step="0.1"
                value={tangentX}
                onChange={(e) => setTangentX(parseFloat(e.target.value))}
              />
            </label>

            <button
              type="button"
              className={`vis-toggle-btn ${showTangent ? "active" : ""}`}
              onClick={() => setShowTangent(!showTangent)}
            >
              {showTangent ? <Eye size={14} /> : <EyeOff size={14} />}
              <span>{showTangent ? "Hide Tangent Line" : "Show Tangent Line"}</span>
            </button>

            {/* Riemann Subintervals */}
            <label className="vis-slider-label">
              <div className="slider-header">
                <span>Riemann Subintervals (N)</span>
                <span className="slider-num">{riemannN}</span>
              </div>
              <input
                type="range"
                min="2"
                max="32"
                step="2"
                value={riemannN}
                onChange={(e) => setRiemannN(parseInt(e.target.value, 10))}
              />
            </label>

            <button
              type="button"
              className={`vis-toggle-btn ${showIntegral ? "active" : ""}`}
              onClick={() => setShowIntegral(!showIntegral)}
            >
              {showIntegral ? <Eye size={14} /> : <EyeOff size={14} />}
              <span>{showIntegral ? "Hide Integral Area" : "Show Integral Area"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
