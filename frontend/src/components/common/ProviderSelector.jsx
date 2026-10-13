import React, { useState, useEffect } from "react";
import { Cpu, Cloud, HardDrive, CheckCircle2, AlertCircle } from "lucide-react";

export default function ProviderSelector({ value = "gemma", onChange, disabled = false }) {
  const [providerStatus, setProviderStatus] = useState(null);

  useEffect(() => {
    fetch("/api/providers/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.providers) {
          setProviderStatus(data.providers);
        }
      })
      .catch(() => {});
  }, []);

  const providers = [
    {
      id: "gemma",
      label: "Gemma (Official)",
      icon: Cpu,
      badge: "Primary Planner",
      model: providerStatus?.gemma?.model || "gemma-4-26b-a4b-it",
    },
    {
      id: "gemini",
      label: "Gemini",
      icon: Cloud,
      badge: "Multimodal",
      model: providerStatus?.gemini?.model || "gemini-2.5-flash",
    },
    {
      id: "ollama",
      label: "Ollama (Offline)",
      icon: HardDrive,
      badge: "Local",
      model: providerStatus?.ollama?.model || "gemma2:9b",
    },
  ];

  return (
    <div className="provider-selector-bar" role="group" aria-label="Select AI Inference Provider">
      <span className="provider-bar-label">AI Engine:</span>
      <div className="provider-buttons-wrap">
        {providers.map(({ id, label, icon: Icon, badge, model }) => {
          const isSelected = value === id;
          const statusInfo = providerStatus?.[id];
          const isAvail = statusInfo ? statusInfo.available : true;

          return (
            <button
              key={id}
              type="button"
              className={`provider-pill ${isSelected ? "selected" : ""} ${!isAvail ? "unreachable" : ""}`}
              onClick={() => !disabled && onChange(id)}
              disabled={disabled}
              title={`Provider: ${label} (${model}). ${isAvail ? "Available" : "Currently offline"}`}
            >
              <Icon size={13} />
              <span>{label}</span>
              <span className="provider-badge-tag">{badge}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
