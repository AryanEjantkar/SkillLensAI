import React from "react";
import MathGraph from "./MathGraph";
import PhysicsSimulation from "./PhysicsSimulation";
import ChemistryReaction from "./ChemistryReaction";
import BiologyProcess from "./BiologyProcess";
import AlgorithmVisualizer from "./AlgorithmVisualizer";
import EconomicsMarket from "./EconomicsMarket";
import ProbabilityDistribution from "./ProbabilityDistribution";
import SystemArchitecture from "./SystemArchitecture";
import TimelineFlow from "./TimelineFlow";
import ConceptMap from "./ConceptMap";
import ComparisonMatrix from "./ComparisonMatrix";
import WorkedExampleStepper from "./WorkedExampleStepper";
import { Sparkles, AlertCircle } from "lucide-react";

const REGISTRY = {
  math_graph: MathGraph,
  calculus_graph: MathGraph,
  physics_simulation: PhysicsSimulation,
  chemistry_reaction: ChemistryReaction,
  biology_process: BiologyProcess,
  algorithm_visualizer: AlgorithmVisualizer,
  economics_market: EconomicsMarket,
  probability_distribution: ProbabilityDistribution,
  system_architecture: SystemArchitecture,
  timeline_flow: TimelineFlow,
  concept_map: ConceptMap,
  comparison_matrix: ComparisonMatrix,
  worked_example: WorkedExampleStepper,
};

/**
 * Safe Dynamic Visualization Dispatcher.
 * Matches validated registry keys to declarative React components.
 * Falls back safely to ConceptMap if component key is unknown.
 */
export default function VisualizationRegistry({ visualization, topic, difficulty }) {
  if (!visualization) {
    return (
      <div className="vis-empty-state">
        <Sparkles size={24} />
        <p>No interactive simulation specified for this topic. Generate a study set to load interactive models.</p>
      </div>
    );
  }

  const { type, title, description, data } = visualization;
  const Component = REGISTRY[type];

  if (!Component) {
    return (
      <div className="vis-fallback-wrapper">
        <div className="vis-fallback-banner">
          <AlertCircle size={15} />
          <span>Interactive model type &ldquo;{type}&rdquo; not recognized. Rendering structured concept map fallback.</span>
        </div>
        <ConceptMap
          data={data}
          title={title || `Conceptual Structure of ${topic}`}
          description={description || "Interactive concept map mapping core principles and relationships."}
        />
      </div>
    );
  }

  return (
    <Component
      data={data || {}}
      title={title}
      description={description}
      topic={topic}
      difficulty={difficulty}
    />
  );
}
