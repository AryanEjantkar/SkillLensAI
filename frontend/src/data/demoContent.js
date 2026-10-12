/**
 * Demo content placeholder owned by Person 3.
 * Used for development preview and fallback when backend is offline.
 */
export const demoStudySet = {
  title: "Thermodynamics & Statistical Mechanics",
  summary:
    "Thermodynamics governs how energy transforms between heat and work. The Second Law introduces entropy as a measure of microscopic disorder, stating that the total entropy of an isolated system always increases over time. This dictates the natural direction of physical and chemical processes.",
  explanation:
    "### Core Concepts of Entropy\n\n1. **What is Entropy?**\nEntropy ($S$) represents the multiplicity of microscopic configurations (microstates) that correspond to a macroscopic state. Ludwig Boltzmann formalized this with the equation:\n\n$$S = k_B \\ln \\Omega$$\n\nWhere $k_B$ is the Boltzmann constant and $\\Omega$ is the number of accessible microstates.\n\n2. **The Arrow of Time**\nUnlike classical mechanics, which is time-reversible, the Second Law introduces irreversibility. An ice cube melts in warm coffee because there are vastly more ways for heat to disperse than to spontaneously concentrate back into ice.\n\n3. **Heat Engines and Efficiency**\nNo heat engine can achieve 100% thermal efficiency between two thermal reservoirs. The maximum possible efficiency is given by the Carnot limit:\n\n$$\\eta_{max} = 1 - \\frac{T_C}{T_H}$$",
  flashcards: [
    {
      question: "What is the Second Law of Thermodynamics in terms of entropy?",
      answer: "The total entropy of an isolated system always increases or remains constant in a reversible process; it never decreases."
    },
    {
      question: "What is Boltzmann's microscopic definition of entropy?",
      answer: "S = k_B * ln(Ω), where k_B is Boltzmann's constant and Ω is the number of accessible microstates."
    },
    {
      question: "What does the Carnot theorem define?",
      answer: "The theoretical maximum efficiency that any heat engine operating between two temperatures can achieve."
    },
    {
      question: "Why is natural heat transfer irreversible?",
      answer: "Heat spontaneously flows from higher to lower temperature bodies because this increases the total entropy of the system."
    }
  ],
  quiz: [
    {
      question: "Which equation defines Boltzmann's statistical entropy?",
      options: [
        "S = k_B * ln(Ω)",
        "E = mc²",
        "PV = nRT",
        "ΔU = Q - W"
      ],
      correct_answer: 0,
      explanation: "Boltzmann's entropy formula relates thermodynamic entropy to the logarithm of the number of microstates (Ω)."
    },
    {
      question: "Can the entropy of a closed subsystem decrease?",
      options: [
        "No, entropy can never decrease anywhere",
        "Yes, as long as the surrounding entropy increases by at least the same amount",
        "Only at absolute zero temperature",
        "Only in a vacuum"
      ],
      correct_answer: 1,
      explanation: "A subsystem can experience an entropy reduction provided that entropy in the surroundings increases by a greater or equal amount, ensuring the total universe entropy increases."
    },
    {
      question: "What is the maximum theoretical efficiency of a Carnot engine with T_H = 600K and T_C = 300K?",
      options: [
        "100%",
        "75%",
        "50%",
        "25%"
      ],
      correct_answer: 2,
      explanation: "Carnot efficiency is η = 1 - (T_C / T_H) = 1 - (300 / 600) = 1 - 0.5 = 50%."
    }
  ]
};
