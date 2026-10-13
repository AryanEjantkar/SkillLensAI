import React, { useState, useEffect, useRef, useMemo } from "react";
import { Play, Pause, RotateCcw, SkipForward, Sliders } from "lucide-react";

export default function PhysicsSimulation({ data = {}, title, description }) {
  // Extract initial parameters
  const [velocity, setVelocity] = useState(data.parameters?.find((p) => p.name === "velocity")?.default ?? 28);
  const [angle, setAngle] = useState(data.parameters?.find((p) => p.name === "angle")?.default ?? 45);
  const [gravity, setGravity] = useState(data.parameters?.find((p) => p.name === "gravity")?.default ?? 9.8);

  const [isPlaying, setIsPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [trail, setTrail] = useState([]);
  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(null);

  // Physics calculations
  const rad = useMemo(() => (angle * Math.PI) / 180, [angle]);
  const vx0 = useMemo(() => velocity * Math.cos(rad), [velocity, rad]);
  const vy0 = useMemo(() => velocity * Math.sin(rad), [velocity, rad]);

  const totalFlightTime = useMemo(() => (2 * vy0) / gravity, [vy0, gravity]);
  const maxHeight = useMemo(() => (vy0 * vy0) / (2 * gravity), [vy0, gravity]);
  const totalRange = useMemo(() => (velocity * velocity * Math.sin(2 * rad)) / gravity, [velocity, rad, gravity]);

  // Current projectile coordinates
  const currentX = useMemo(() => vx0 * time, [vx0, time]);
  const currentY = useMemo(() => Math.max(0, vy0 * time - 0.5 * gravity * time * time), [vy0, gravity, time]);
  const currentVy = useMemo(() => vy0 - gravity * time, [vy0, gravity, time]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      lastTimeRef.current = null;
      return;
    }

    const animate = (timestamp) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      setTime((prevTime) => {
        const nextTime = prevTime + dt * 1.2; // slight simulation pace
        if (nextTime >= totalFlightTime) {
          setIsPlaying(false);
          return totalFlightTime;
        }
        return nextTime;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, totalFlightTime]);

  // Record trajectory trail points
  useEffect(() => {
    if (time > 0) {
      setTrail((prev) => [...prev.slice(-80), { x: currentX, y: currentY }]);
    }
  }, [time, currentX, currentY]);

  // Reset simulation
  const handleReset = () => {
    setIsPlaying(false);
    setTime(0);
    setTrail([]);
  };

  const handleStep = () => {
    setIsPlaying(false);
    setTime((prev) => Math.min(totalFlightTime, prev + 0.15));
  };

  // SVG coordinates
  const width = 640;
  const height = 360;
  const padding = 45;

  const maxExpectedRange = Math.max(80, totalRange * 1.15);
  const maxExpectedHeight = Math.max(40, maxHeight * 1.3);

  const toSvgX = (x) => padding + (x / maxExpectedRange) * (width - 2 * padding);
  const toSvgY = (y) => height - padding - (y / maxExpectedHeight) * (height - 2 * padding);

  // Theoretical full arc path
  const theoreticalArc = useMemo(() => {
    const pts = [];
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * totalFlightTime;
      const x = vx0 * t;
      const y = Math.max(0, vy0 * t - 0.5 * gravity * t * t);
      pts.push(`${toSvgX(x)},${toSvgY(y)}`);
    }
    return `M ${pts.join(" L ")}`;
  }, [vx0, vy0, gravity, totalFlightTime, maxExpectedRange, maxExpectedHeight]);

  return (
    <div className="vis-container physics-sim-vis">
      <div className="vis-header">
        <div>
          <h4 className="vis-title">{title || "Interactive Kinematics & Projectile Simulation"}</h4>
          <p className="vis-description">
            {description || "Adjust launch velocity, angle, and gravitational field to simulate Newtonian 2D projectile mechanics."}
          </p>
        </div>

        {/* Playback controls */}
        <div className="vis-playback-bar">
          <button
            type="button"
            className="vis-btn-primary"
            onClick={() => {
              if (time >= totalFlightTime) handleReset();
              setIsPlaying(!isPlaying);
            }}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            <span>{isPlaying ? "Pause" : time >= totalFlightTime ? "Replay" : "Launch"}</span>
          </button>
          <button type="button" className="vis-btn-ghost" onClick={handleStep} title="Step Forward">
            <SkipForward size={14} />
          </button>
          <button type="button" className="vis-btn-ghost" onClick={handleReset} title="Reset">
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div className="vis-workspace-grid">
        {/* Simulation Canvas */}
        <div className="vis-canvas-card">
          <svg viewBox={`0 0 ${width} ${height}`} className="sim-svg" role="img" aria-label="Projectile motion trajectory simulation">
            <defs>
              <linearGradient id="sky-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f8f7fd" />
                <stop offset="100%" stopColor="#eef0fb" />
              </linearGradient>
            </defs>

            {/* Background Sky & Ground */}
            <rect width={width} height={height} fill="url(#sky-gradient)" />
            <line
              x1={padding - 10}
              y1={height - padding}
              x2={width - padding + 10}
              y2={height - padding}
              stroke="#2e2b48"
              strokeWidth="2.5"
            />

            {/* Ground grid marks */}
            {[0, 25, 50, 75, 100].map((pct) => {
              const xVal = (pct / 100) * maxExpectedRange;
              return (
                <g key={pct}>
                  <line
                    x1={toSvgX(xVal)}
                    y1={height - padding}
                    x2={toSvgX(xVal)}
                    y2={height - padding + 6}
                    stroke="#8c89a0"
                    strokeWidth="1.5"
                  />
                  <text
                    x={toSvgX(xVal)}
                    y={height - padding + 18}
                    fill="#75728a"
                    fontSize="10"
                    textAnchor="middle"
                  >
                    {xVal.toFixed(0)}m
                  </text>
                </g>
              );
            })}

            {/* Theoretical trajectory arc */}
            <path
              d={theoreticalArc}
              fill="none"
              stroke="rgba(96, 81, 223, 0.35)"
              strokeWidth="2"
              strokeDasharray="4 4"
            />

            {/* Actual particle trail */}
            {trail.length > 1 && (
              <polyline
                points={trail.map((pt) => `${toSvgX(pt.x)},${toSvgY(pt.y)}`).join(" ")}
                fill="none"
                stroke="#6051df"
                strokeWidth="2.5"
              />
            )}

            {/* Launch Cannon Base */}
            <circle cx={toSvgX(0)} cy={toSvgY(0)} r="7" fill="#2d2850" />
            <line
              x1={toSvgX(0)}
              y1={toSvgY(0)}
              x2={toSvgX(0) + Math.cos(rad) * 22}
              y2={toSvgY(0) - Math.sin(rad) * 22}
              stroke="#2d2850"
              strokeWidth="5"
              strokeLinecap="round"
            />

            {/* Moving Projectile */}
            <circle
              cx={toSvgX(currentX)}
              cy={toSvgY(currentY)}
              r="6.5"
              fill="#e05368"
              stroke="#ffffff"
              strokeWidth="2"
            />

            {/* Velocity Vector Arrow at projectile */}
            {isPlaying && (
              <line
                x1={toSvgX(currentX)}
                y1={toSvgY(currentY)}
                x2={toSvgX(currentX) + (vx0 / 3)}
                y2={toSvgY(currentY) - (currentVy / 3)}
                stroke="#239b77"
                strokeWidth="2"
                markerEnd="url(#arrow)"
              />
            )}

            {/* Target landing marker */}
            <circle cx={toSvgX(totalRange)} cy={toSvgY(0)} r="4" fill="#239b77" />
            <text
              x={toSvgX(totalRange)}
              y={toSvgY(0) - 10}
              fill="#239b77"
              fontSize="10"
              fontWeight="bold"
              textAnchor="middle"
            >
              Impact
            </text>
          </svg>

          {/* Metrics Panel */}
          <div className="vis-metric-badges">
            <div className="vis-badge">
              <span className="badge-label">Time Elapsed</span>
              <span className="badge-value">{time.toFixed(2)}s / {totalFlightTime.toFixed(2)}s</span>
            </div>
            <div className="vis-badge">
              <span className="badge-label">Max Height (H)</span>
              <span className="badge-value">{maxHeight.toFixed(1)} m</span>
            </div>
            <div className="vis-badge">
              <span className="badge-label">Total Range (R)</span>
              <span className="badge-value">{totalRange.toFixed(1)} m</span>
            </div>
            <div className="vis-badge">
              <span className="badge-label">Current Height</span>
              <span className="badge-value">{currentY.toFixed(1)} m</span>
            </div>
          </div>
        </div>

        {/* Simulation Controls */}
        <div className="vis-controls-card">
          <div className="vis-control-group">
            <span className="control-section-title">
              <Sliders size={14} /> Physical Variables
            </span>

            {/* Velocity */}
            <label className="vis-slider-label">
              <div className="slider-header">
                <span>Launch Velocity (v₀)</span>
                <span className="slider-num">{velocity} m/s</span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="1"
                value={velocity}
                onChange={(e) => {
                  setVelocity(parseFloat(e.target.value));
                  handleReset();
                }}
              />
            </label>

            {/* Angle */}
            <label className="vis-slider-label">
              <div className="slider-header">
                <span>Launch Angle (θ)</span>
                <span className="slider-num">{angle}°</span>
              </div>
              <input
                type="range"
                min="10"
                max="85"
                step="1"
                value={angle}
                onChange={(e) => {
                  setAngle(parseFloat(e.target.value));
                  handleReset();
                }}
              />
            </label>

            {/* Gravity */}
            <label className="vis-slider-label">
              <div className="slider-header">
                <span>Gravitational Field (g)</span>
                <span className="slider-num">{gravity} m/s²</span>
              </div>
              <input
                type="range"
                min="1.6"
                max="25"
                step="0.2"
                value={gravity}
                onChange={(e) => {
                  setGravity(parseFloat(e.target.value));
                  handleReset();
                }}
              />
            </label>

            {/* Gravity Presets */}
            <div className="preset-buttons">
              <button
                type="button"
                className={`preset-btn ${gravity === 9.8 ? "active" : ""}`}
                onClick={() => { setGravity(9.8); handleReset(); }}
              >
                Earth (9.8)
              </button>
              <button
                type="button"
                className={`preset-btn ${gravity === 1.6 ? "active" : ""}`}
                onClick={() => { setGravity(1.6); handleReset(); }}
              >
                Moon (1.6)
              </button>
              <button
                type="button"
                className={`preset-btn ${gravity === 3.7 ? "active" : ""}`}
                onClick={() => { setGravity(3.7); handleReset(); }}
              >
                Mars (3.7)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
