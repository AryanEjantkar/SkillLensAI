import React, { useState } from "react";
import { GitFork, Info } from "lucide-react";

export default function ConceptMap({ data = {}, title, description }) {
  const defaultNodes = [
    { id: "n1", label: "Core Foundation", group: "core", description: "The central thesis and primary theoretical anchor of the topic." },
    { id: "n2", label: "Governing Principles", group: "sub", description: "Universal laws, formulas, and constraints that dictate behavior." },
    { id: "n3", label: "Operational Mechanism", group: "sub", description: "Dynamic transformations, reactions, or algorithmic processes." },
    { id: "n4", label: "Real-world Applications", group: "sub", description: "Practical implementations, technology, and case studies." },
  ];

  const defaultLinks = [
    { source: "n1", target: "n2", label: "governed by" },
    { source: "n1", target: "n3", label: "executes via" },
    { source: "n3", target: "n4", label: "manifests in" },
  ];

  const nodes = Array.isArray(data.nodes) && data.nodes.length > 0 ? data.nodes : defaultNodes;
  const links = Array.isArray(data.links) && data.links.length > 0 ? data.links : defaultLinks;

  const [selectedNode, setSelectedNode] = useState(nodes[0]);

  // Compute 2D node layout positions in an elliptical/cluster layout
  const width = 620;
  const height = 340;
  const cx = width / 2;
  const cy = height / 2;

  const nodePositions = {};
  const coreNode = nodes.find((n) => n.group === "core") || nodes[0];
  nodePositions[coreNode.id] = { x: cx, y: cy };

  const otherNodes = nodes.filter((n) => n.id !== coreNode.id);
  const angleStep = (2 * Math.PI) / (otherNodes.length || 1);
  const rx = 190;
  const ry = 110;

  otherNodes.forEach((n, idx) => {
    const angle = idx * angleStep - Math.PI / 2;
    nodePositions[n.id] = {
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
    };
  });

  return (
    <div className="vis-container concept-map-vis">
      <div className="vis-header">
        <div>
          <h4 className="vis-title">{title || "Interactive Concept Knowledge Graph"}</h4>
          <p className="vis-description">
            {description || "Explore ontological relationships and structural dependencies across key domains. Click any concept node to inspect its pedagogical role."}
          </p>
        </div>
      </div>

      <div className="vis-workspace-grid">
        {/* Interactive Graph Canvas */}
        <div className="vis-canvas-card">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="concept-svg"
            role="img"
            aria-label="Interactive concept map network"
            style={{ userSelect: "none", WebkitUserSelect: "none" }}
          >
            {/* Relationship Lines */}
            {links.map((link, idx) => {
              const src = nodePositions[link.source];
              const tgt = nodePositions[link.target];
              if (!src || !tgt) return null;
              const midX = (src.x + tgt.x) / 2;
              const midY = (src.y + tgt.y) / 2;

              return (
                <g key={idx}>
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke="#cbc6e8"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                  {link.label && (
                    <text
                      x={midX}
                      y={midY - 6}
                      fill="#78739a"
                      fontSize="10"
                      fontWeight="500"
                      textAnchor="middle"
                      className="link-label"
                      style={{ userSelect: "none" }}
                    >
                      {link.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Concept Nodes - Sleek Pill Badges */}
            {nodes.map((node) => {
              const pos = nodePositions[node.id];
              if (!pos) return null;
              const isSelected = selectedNode?.id === node.id;
              const isCore = node.group === "core";
              const label = node.label || "Concept";
              const pillWidth = Math.max(isCore ? 120 : 96, Math.min(190, label.length * 8 + 28));
              const pillHeight = isCore ? 38 : 32;

              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  style={{ cursor: "pointer", userSelect: "none" }}
                  className="concept-node-group"
                >
                  <rect
                    x={pos.x - pillWidth / 2}
                    y={pos.y - pillHeight / 2}
                    width={pillWidth}
                    height={pillHeight}
                    rx={pillHeight / 2}
                    ry={pillHeight / 2}
                    fill={isSelected ? "#6051df" : isCore ? "#eeebff" : "#ffffff"}
                    stroke={isSelected ? "#3f32ba" : isCore ? "#7b6cf6" : "#dedaf5"}
                    strokeWidth={isSelected ? "2.5" : "1.8"}
                  />
                  <text
                    x={pos.x}
                    y={pos.y + 4}
                    fill={isSelected ? "#ffffff" : isCore ? "#483bbd" : "#282445"}
                    fontSize={isCore ? "11.5" : "11"}
                    fontWeight={isSelected || isCore ? "700" : "600"}
                    textAnchor="middle"
                    style={{ userSelect: "none" }}
                  >
                    {label.length > 22 ? `${label.slice(0, 20)}…` : label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Node Details Card */}
        <div className="vis-controls-card">
          <div className="vis-control-group">
            <span className="control-section-title"><GitFork size={14} /> Selected Concept Details</span>
            {selectedNode ? (
              <div className="concept-node-detail-card">
                <div className="concept-node-header">
                  <span className={`node-badge ${selectedNode.group === "core" ? "core" : "sub"}`}>
                    {selectedNode.group === "core" ? "Core Anchor" : "Subtopic"}
                  </span>
                  <h5>{selectedNode.label}</h5>
                </div>
                <p className="concept-node-desc">{selectedNode.description}</p>

                {/* Direct connections */}
                <div className="concept-connections-list">
                  <span className="sub-title">Connected Relationships:</span>
                  {links
                    .filter((l) => l.source === selectedNode.id || l.target === selectedNode.id)
                    .map((l, idx) => {
                      const otherId = l.source === selectedNode.id ? l.target : l.source;
                      const other = nodes.find((n) => n.id === otherId);
                      return (
                        <div key={idx} className="conn-pill" onClick={() => other && setSelectedNode(other)}>
                          <span className="conn-rel">{l.label}</span>
                          <span className="conn-target">{other?.label || otherId}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              <div className="empty-selection-note">
                <Info size={16} />
                <span>Click any node in the graph to view deeper pedagogical explanations.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
