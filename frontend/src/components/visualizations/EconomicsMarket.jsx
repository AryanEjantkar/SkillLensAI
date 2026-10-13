import React, { useState, useMemo } from "react";
import { Sliders, RotateCcw, TrendingUp } from "lucide-react";

export default function EconomicsMarket({ data = {}, title, description }) {
  const marketTitle = data.market_title || "Supply and Demand Market Equilibrium";

  const [demandShift, setDemandShift] = useState(0); // -30 to 30
  const [supplyShift, setSupplyShift] = useState(0); // -30 to 30
  const [priceControl, setPriceControl] = useState(0); // 0 = free market

  // Linear supply and demand equations:
  // Base Demand: P = 100 - Q + demandShift
  // Base Supply: P = 20 + Q - supplyShift
  // Equilibrium: 100 - Q + D_shift = 20 + Q - S_shift
  // 2Q = 80 + D_shift + S_shift
  // Q* = 40 + (D_shift + S_shift) / 2
  // P* = 100 - Q* + D_shift
  const eqQuantity = useMemo(() => {
    return Math.max(10, Math.min(85, 40 + (demandShift + supplyShift) / 2));
  }, [demandShift, supplyShift]);

  const eqPrice = useMemo(() => {
    return Math.max(10, Math.min(95, 100 - eqQuantity + demandShift));
  }, [eqQuantity, demandShift]);

  // Consumer Surplus ≈ 0.5 * (Max Demand P - P*) * Q*
  const maxDemandP = 100 + demandShift;
  const consumerSurplus = useMemo(() => {
    return Math.max(0, 0.5 * (maxDemandP - eqPrice) * eqQuantity);
  }, [maxDemandP, eqPrice, eqQuantity]);

  // Producer Surplus ≈ 0.5 * (P* - Min Supply P) * Q*
  const minSupplyP = 20 - supplyShift;
  const producerSurplus = useMemo(() => {
    return Math.max(0, 0.5 * (eqPrice - minSupplyP) * eqQuantity);
  }, [eqPrice, minSupplyP, eqQuantity]);

  // SVG coordinate transformation
  const width = 600;
  const height = 340;
  const padding = 45;

  const toSvgX = (q) => padding + (q / 100) * (width - 2 * padding);
  const toSvgY = (p) => height - padding - (p / 120) * (height - 2 * padding);

  // Demand line endpoints: Q=0 -> P=maxDemandP, Q=100 -> P=maxDemandP-100
  const dX1 = toSvgX(0);
  const dY1 = toSvgY(maxDemandP);
  const dX2 = toSvgX(95);
  const dY2 = toSvgY(Math.max(5, maxDemandP - 95));

  // Supply line endpoints: Q=0 -> P=minSupplyP, Q=100 -> P=minSupplyP+100
  const sX1 = toSvgX(0);
  const sY1 = toSvgY(minSupplyP);
  const sX2 = toSvgX(95);
  const sY2 = toSvgY(Math.min(115, minSupplyP + 95));

  const handleReset = () => {
    setDemandShift(0);
    setSupplyShift(0);
    setPriceControl(0);
  };

  return (
    <div className="vis-container econ-vis">
      <div className="vis-header">
        <div>
          <h4 className="vis-title">{title || marketTitle}</h4>
          <p className="vis-description">
            {description || "Explore microeconomic market equilibrium, shifts in demand and supply schedules, and welfare surplus."}
          </p>
        </div>
        <button className="vis-btn-ghost" type="button" onClick={handleReset} title="Reset sliders">
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      </div>

      <div className="vis-workspace-grid">
        {/* Market Graph */}
        <div className="vis-canvas-card">
          <svg viewBox={`0 0 ${width} ${height}`} className="econ-svg" role="img" aria-label="Supply and demand equilibrium curve">
            {/* Axes */}
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#8c89a0" strokeWidth="2" />
            <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#8c89a0" strokeWidth="2" />
            <text x={width - padding} y={height - padding + 20} fill="#75728a" fontSize="11" textAnchor="end">Quantity (Q)</text>
            <text x={padding - 10} y={padding - 5} fill="#75728a" fontSize="11" textAnchor="start">Price ($)</text>

            {/* Consumer Surplus Shaded Triangle */}
            <polygon
              points={`${toSvgX(0)},${toSvgY(eqPrice)} ${toSvgX(eqQuantity)},${toSvgY(eqPrice)} ${toSvgX(0)},${toSvgY(maxDemandP)}`}
              fill="rgba(96, 81, 223, 0.18)"
            />

            {/* Producer Surplus Shaded Triangle */}
            <polygon
              points={`${toSvgX(0)},${toSvgY(eqPrice)} ${toSvgX(eqQuantity)},${toSvgY(eqPrice)} ${toSvgX(0)},${toSvgY(minSupplyP)}`}
              fill="rgba(35, 155, 119, 0.18)"
            />

            {/* Demand Curve */}
            <line x1={dX1} y1={dY1} x2={dX2} y2={dY2} stroke="#6051df" strokeWidth="3" />
            <text x={dX2 - 10} y={dY2 - 10} fill="#6051df" fontWeight="bold" fontSize="12">Demand (D)</text>

            {/* Supply Curve */}
            <line x1={sX1} y1={sY1} x2={sX2} y2={sY2} stroke="#239b77" strokeWidth="3" />
            <text x={sX2 - 10} y={sY2 - 10} fill="#239b77" fontWeight="bold" fontSize="12">Supply (S)</text>

            {/* Equilibrium Dashed Lines */}
            <line
              x1={padding}
              y1={toSvgY(eqPrice)}
              x2={toSvgX(eqQuantity)}
              y2={toSvgY(eqPrice)}
              stroke="#8c89a0"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
            <line
              x1={toSvgX(eqQuantity)}
              y1={height - padding}
              x2={toSvgX(eqQuantity)}
              y2={toSvgY(eqPrice)}
              stroke="#8c89a0"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />

            {/* Equilibrium Point */}
            <circle cx={toSvgX(eqQuantity)} cy={toSvgY(eqPrice)} r="6" fill="#e05368" stroke="#ffffff" strokeWidth="2" />
            <text x={toSvgX(eqQuantity) + 8} y={toSvgY(eqPrice) - 8} fill="#e05368" fontWeight="bold" fontSize="11">
              E ({eqQuantity.toFixed(0)}, ${eqPrice.toFixed(0)})
            </text>
          </svg>

          {/* Badges */}
          <div className="vis-metric-badges">
            <div className="vis-badge">
              <span className="badge-label">Equilibrium Price (P*)</span>
              <span className="badge-value">${eqPrice.toFixed(2)}</span>
            </div>
            <div className="vis-badge">
              <span className="badge-label">Equilibrium Quantity (Q*)</span>
              <span className="badge-value">{eqQuantity.toFixed(1)} units</span>
            </div>
            <div className="vis-badge">
              <span className="badge-label">Consumer Surplus</span>
              <span className="badge-value">${consumerSurplus.toFixed(0)}</span>
            </div>
            <div className="vis-badge">
              <span className="badge-label">Producer Surplus</span>
              <span className="badge-value">${producerSurplus.toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="vis-controls-card">
          <div className="vis-control-group">
            <span className="control-section-title"><Sliders size={14} /> Market Shifters</span>

            {/* Demand Shifter */}
            <label className="vis-slider-label">
              <div className="slider-header">
                <span>Demand Curve Shift (\u0394D)</span>
                <span className="slider-num">{demandShift > 0 ? `+${demandShift}` : demandShift}</span>
              </div>
              <input
                type="range"
                min="-25"
                max="25"
                step="2"
                value={demandShift}
                onChange={(e) => setDemandShift(parseInt(e.target.value, 10))}
              />
              <span className="slider-hint">Higher consumer income, positive tastes, or subsidies shift D right.</span>
            </label>

            {/* Supply Shifter */}
            <label className="vis-slider-label">
              <div className="slider-header">
                <span>Supply Curve Shift (\u0394S)</span>
                <span className="slider-num">{supplyShift > 0 ? `+${supplyShift}` : supplyShift}</span>
              </div>
              <input
                type="range"
                min="-25"
                max="25"
                step="2"
                value={supplyShift}
                onChange={(e) => setSupplyShift(parseInt(e.target.value, 10))}
              />
              <span className="slider-hint">Better tech or lower production costs shift S right.</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
