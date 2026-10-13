import React from "react";
import { GraduationCap, Award, Compass } from "lucide-react";

const DIFFICULTIES = [
  { id: "beginner", label: "Beginner", icon: Compass, desc: "Intuitive analogies & foundations" },
  { id: "intermediate", label: "Intermediate", icon: GraduationCap, desc: "Rigor, formulas & applications" },
  { id: "advanced", label: "Advanced", icon: Award, desc: "Theoretical depth & edge cases" },
];

export default function DifficultySelector({ value = "intermediate", onChange, disabled = false }) {
  return (
    <div className="difficulty-selector-group" role="group" aria-label="Select difficulty level">
      {DIFFICULTIES.map(({ id, label, icon: Icon, desc }) => {
        const isSelected = value === id;
        return (
          <button
            key={id}
            type="button"
            className={`difficulty-pill ${isSelected ? "selected" : ""}`}
            onClick={() => !disabled && onChange(id)}
            disabled={disabled}
            title={desc}
          >
            <Icon size={14} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
