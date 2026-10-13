import React, { useState } from "react";
import { Server, Network, Database, Cpu } from "lucide-react";

export default function SystemArchitecture({ data = {}, title, description }) {
  const defaultLayers = [
    { id: "l1", name: "Application & Interface Layer", icon: "Server", protocol: "HTTP / WebSockets / GraphQL", description: "Handles user requests, authentication, and client rendering." },
    { id: "l2", name: "Service Orchestration & Logic", icon: "Cpu", protocol: "gRPC / REST / Microservices", description: "Business logic processing, caching layers, and state reconciliation." },
    { id: "l3", name: "Storage & Persistence Engine", icon: "Database", protocol: "PostgreSQL / Redis / LSM-Trees", description: "ACID transactions, indexing, durability logs, and replication clusters." },
    { id: "l4", name: "Transport & Network Infrastructure", icon: "Network", protocol: "TCP/IP / TLS 1.3 / BGP", description: "Packet routing, congestion control, socket buffers, and network interfaces." },
  ];

  const layers = Array.isArray(data.layers) && data.layers.length > 0 ? data.layers : defaultLayers;
  const [selectedLayer, setSelectedLayer] = useState(layers[0]);

  return (
    <div className="vis-container system-arch-vis">
      <div className="vis-header">
        <div>
          <h4 className="vis-title">{title || "System & Computer Architecture Hierarchy"}</h4>
          <p className="vis-description">
            {description || "Explore tiered layer abstraction, inter-component protocols, data flow pipelines, and infrastructural boundaries."}
          </p>
        </div>
      </div>

      <div className="vis-workspace-grid">
        {/* Layer Stack */}
        <div className="vis-canvas-card">
          <div className="arch-stack-container">
            {layers.map((layer, idx) => {
              const isSelected = selectedLayer?.id === layer.id;
              return (
                <div
                  key={layer.id || idx}
                  className={`arch-layer-card ${isSelected ? "active" : ""}`}
                  onClick={() => setSelectedLayer(layer)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="arch-layer-left">
                    <span className="layer-num">Tier {idx + 1}</span>
                    <h5 className="layer-title">{layer.name}</h5>
                  </div>
                  <span className="layer-protocol-pill">{layer.protocol}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Layer Details */}
        <div className="vis-controls-card">
          <div className="vis-control-group">
            <span className="control-section-title"><Server size={14} /> Layer Specification</span>
            {selectedLayer && (
              <div className="arch-detail-card">
                <span className="arch-tier-badge">{selectedLayer.protocol}</span>
                <h4>{selectedLayer.name}</h4>
                <p className="arch-desc">{selectedLayer.description}</p>
                <div className="arch-role-box">
                  <strong>Architectural Role:</strong>
                  <p>Ensures abstraction boundaries and clear contracts between upstream requests and downstream hardware/storage.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
