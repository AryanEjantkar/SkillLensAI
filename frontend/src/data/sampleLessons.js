/**
 * Polished, high-fidelity sample interactive lessons representing distinct academic disciplines.
 * Used for instant interactive exploration without requiring an initial API call.
 */

export const sampleLessons = [
  {
    id: "lesson-calculus",
    topic: "Calculus: Derivatives, Tangents, and Definite Integrals",
    subject: "mathematics",
    subtopic: "Differential & Integral Calculus",
    difficulty: "intermediate",
    teaching_method: "Dynamic Geometric Discovery",
    learning_objectives: [
      "Understand the derivative f'(x) as the instantaneous rate of change and slope of the tangent line",
      "Connect definite integration to the limit of Riemann sums as subintervals N approach infinity",
      "Manipulate quadratic coefficients and observe curvature, extrema, and area under the curve",
    ],
    sections: [
      {
        title: "1. The Tangent Line and Instantaneous Rate of Change",
        content:
          "In differential calculus, the **derivative** of a function at a point $x_0$ represents its instantaneous rate of change. Geometrically, it is the exact slope $m = f'(x_0)$ of the **tangent line** grazing the curve at $(x_0, f(x_0))$.\n\n* **Secant to Tangent**: As the interval $\\Delta x \\to 0$, the secant line approaches the tangent line.\n* **Power Rule**: For $f(x) = a x^2 + b x + c$, the derivative is $f'(x) = 2 a x + b$.\n* **Critical Points**: Where $f'(x) = 0$, the curve reaches local extrema (peaks or valleys).",
        key_concepts: ["Instantaneous Rate of Change", "Slope of Tangent Line", "Limit Definition"],
        analogies: ["Like checking your car's speedometer at an exact millisecond rather than calculating average speed over an hour."],
      },
      {
        title: "2. The Definite Integral and Riemann Accumulation",
        content:
          "The **Fundamental Theorem of Calculus** connects differentiation and integration. A definite integral $\\int_a^b f(x) dx$ calculates the accumulated area beneath the curve.\n\n* **Riemann Rectangles**: We approximate the area by partitioning $[a, b]$ into $N$ rectangles of width $\\Delta x = \\frac{b - a}{N}$.\n* **Convergence**: As $N \\to \\infty$, the Riemann sum $\\sum f(x_i^*) \\Delta x$ converges to the exact definite integral.",
        key_concepts: ["Definite Integral", "Riemann Sum", "Accumulation Function"],
        analogies: ["Like slicing a loaf of bread into thousands of ultra-thin slices to calculate the exact volume."],
      },
    ],
    visualization: {
      type: "calculus_graph",
      title: "Interactive Curve, Tangent Slope, and Riemann Integral",
      description: "Adjust coefficients a, b, c to shift curvature. Move the tangent point x₀ to trace slope f'(x₀), and increase N to observe Riemann sum convergence.",
      data: {
        function_type: "polynomial",
        parameters: [
          { name: "a", label: "Coefficient a", min: -3, max: 3, step: 0.25, default: 0.75 },
          { name: "b", label: "Coefficient b", min: -4, max: 4, step: 0.5, default: -0.5 },
          { name: "c", label: "Constant c", min: -6, max: 6, step: 0.5, default: -2.0 },
        ],
        x_range: [-5, 5],
        y_range: [-6, 10],
        tangent_point: 1.5,
        integral_range: [0, 3],
        riemann_n: 8,
      },
    },
    worked_examples: [
      {
        problem: "Find the equation of the tangent line to f(x) = x^2 - 4 at x_0 = 2.",
        steps: [
          {
            step_number: 1,
            instruction: "Calculate the y-coordinate at x_0 = 2",
            formula_or_code: "f(2) = 2^2 - 4 = 0",
            explanation: "The tangent line touches the curve at the coordinate point (2, 0).",
          },
          {
            step_number: 2,
            instruction: "Compute the derivative f'(x) using the power rule",
            formula_or_code: "f'(x) = \\frac{d}{dx}(x^2 - 4) = 2x",
            explanation: "The derivative gives the general slope formula for any x.",
          },
          {
            step_number: 3,
            instruction: "Evaluate slope m = f'(2) and construct the point-slope equation",
            formula_or_code: "m = f'(2) = 2(2) = 4 \\implies y - 0 = 4(x - 2) \\implies y = 4x - 8",
            explanation: "Using point-slope form yields the final tangent line equation.",
          },
        ],
        final_answer: "The tangent line equation is y = 4x - 8, with slope m = 4.",
      },
    ],
    flashcards: [
      {
        id: "fc-c1",
        question: "What does the derivative f'(x₀) represent geometrically?",
        answer: "The exact slope of the tangent line to the curve at the point (x₀, f(x₀)).",
        key_term: "Derivative",
      },
      {
        id: "fc-c2",
        question: "What happens to a Riemann sum approximation as N → ∞?",
        answer: "The width of each subinterval Δx approaches 0, and the sum converges to the exact definite integral ∫ f(x) dx.",
        key_term: "Riemann Sum",
      },
      {
        id: "fc-c3",
        question: "What is the Fundamental Theorem of Calculus?",
        answer: "It establishes that differentiation and definite integration are inverse operations: ∫ₐᵇ f(x) dx = F(b) - F(a) where F'(x) = f(x).",
        key_term: "FTC",
      },
    ],
    quiz: [
      {
        id: "qz-c1",
        question: "For f(x) = 3x² - 5x + 2, what is the slope of the tangent line at x = 2?",
        options: [
          { key: "A", text: "7" },
          { key: "B", text: "12" },
          { key: "C", text: "4" },
          { key: "D", text: "1" },
        ],
        correct_answer: "A",
        explanation: "f'(x) = 6x - 5. At x = 2: f'(2) = 6(2) - 5 = 12 - 5 = 7.",
      },
      {
        id: "qz-c2",
        question: "Which of the following guarantees that increasing the number of Riemann rectangles N improves accuracy?",
        options: [
          { key: "A", text: "The function is continuous on the closed interval [a, b]" },
          { key: "B", text: "The function has a constant derivative" },
          { key: "C", text: "The area under the curve is negative" },
          { key: "D", text: "The interval length is less than 1" },
        ],
        correct_answer: "A",
        explanation: "Continuous functions on closed intervals are Riemann integrable, meaning upper and lower Darboux sums converge to the integral as partition norm approaches 0.",
      },
    ],
    hints: [
      "Remember that derivative tells you how steep the curve is at a single point.",
      "Integration sums up infinitely many infinitesimally narrow rectangles.",
    ],
    suggested_followups: [
      "How does the Mean Value Theorem relate to the tangent slope?",
      "Can we calculate integrals for functions that cross below the x-axis?",
    ],
    sources: ["Stewart Calculus (8th Edition)", "MIT OpenCourseWare 18.01 Single Variable Calculus"],
    metadata: {
      provider: "gemma",
      model: "gemma-4-26b-a4b-it",
      is_fallback_simulation: false,
      disclaimer: "Curated pedagogical model for mathematics exploration.",
    },
  },
  {
    id: "lesson-physics",
    topic: "Newtonian Projectile Motion & 2D Kinematics",
    subject: "physics",
    subtopic: "Classical Mechanics",
    difficulty: "intermediate",
    teaching_method: "Vector Decomposition & Simulation",
    learning_objectives: [
      "Decompose 2D projectile motion into independent horizontal and vertical vectors",
      "Derive formulas for maximum height H, flight time T, and maximum horizontal range R",
      "Simulate how gravitational field strength (Earth vs Moon vs Mars) alters ballistic trajectories",
    ],
    sections: [
      {
        title: "1. Independence of Horizontal and Vertical Motion",
        content:
          "Galileo proved that 2D projectile motion under gravity consists of two independent 1D motions:\n\n* **Horizontal (x-axis)**: No horizontal acceleration ($a_x = 0$), so velocity remains constant: $v_x(t) = v_0 \\cos\\theta$.\n* **Vertical (y-axis)**: Constant downward gravitational acceleration ($a_y = -g$), so velocity changes linearly: $v_y(t) = v_0 \\sin\\theta - g t$.\n* **Trajectory Shape**: Eliminating time $t$ yields the parabolic equation $y(x) = x\\tan\\theta - \\frac{g x^2}{2 v_0^2 \\cos^2\\theta}$.",
        key_concepts: ["Vector Independence", "Constant Velocity vs Acceleration", "Parabolic Trajectory"],
        analogies: ["A bullet dropped from a table hits the ground at the exact same instant as a bullet fired horizontally from the same height."],
      },
      {
        title: "2. Key Kinematic Metrics: Max Height and Range",
        content:
          "By setting $v_y = 0$ at the apex, we deduce:\n\n* **Time to Apex**: $t_{\\text{apex}} = \\frac{v_0 \\sin\\theta}{g}$\n* **Total Flight Time**: $T = 2 t_{\\text{apex}} = \\frac{2 v_0 \\sin\\theta}{g}$\n* **Maximum Height**: $H = \\frac{v_0^2 \\sin^2\\theta}{2g}$\n* **Total Range**: $R = v_x \\cdot T = \\frac{v_0^2 \\sin(2\\theta)}{g}$. Range is maximized when $\\sin(2\\theta) = 1$, which occurs at launch angle $\\theta = 45^\\circ$.",
        key_concepts: ["Apex Condition", "Optimal 45° Launch Angle", "Range Equation"],
        analogies: ["Throwing a ball straight up gives maximum hang-time, throwing it flat gives fast speed, but 45° balances both for maximum distance."],
      },
    ],
    visualization: {
      type: "physics_simulation",
      title: "Interactive 2D Ballistic Kinematics Canvas",
      description: "Launch the projectile, inspect live velocity vectors, and adjust velocity, angle, and gravitational acceleration (Earth 9.8, Moon 1.6, Mars 3.7).",
      data: {
        sim_type: "projectile",
        parameters: [
          { name: "velocity", label: "Initial Velocity", min: 10, max: 50, step: 1, default: 28 },
          { name: "angle", label: "Launch Angle", min: 15, max: 75, step: 1, default: 45 },
          { name: "gravity", label: "Gravity", min: 1.6, max: 20, step: 0.2, default: 9.8 },
        ],
      },
    },
    worked_examples: [
      {
        problem: "A ball is launched at v_0 = 20 m/s at an angle of 30° above horizontal on Earth (g = 9.8 m/s²). Calculate its maximum height and total flight time.",
        steps: [
          {
            step_number: 1,
            instruction: "Find initial vertical velocity component v_y0",
            formula_or_code: "v_{y0} = v_0 \\sin(30^\\circ) = 20 \\times 0.5 = 10\\text{ m/s}",
            explanation: "Only the vertical velocity determines flight time and height.",
          },
          {
            step_number: 2,
            instruction: "Calculate maximum height H using apex formula",
            formula_or_code: "H = \\frac{v_{y0}^2}{2g} = \\frac{10^2}{2(9.8)} = \\frac{100}{19.6} \\approx 5.10\\text{ m}",
            explanation: "At the peak, vertical velocity drops to zero momentarily.",
          },
          {
            step_number: 3,
            instruction: "Calculate total flight time T",
            formula_or_code: "T = \\frac{2 v_{y0}}{g} = \\frac{2(10)}{9.8} \\approx 2.04\\text{ s}",
            explanation: "Time of ascent equals time of descent in level terrain.",
          },
        ],
        final_answer: "Max Height H = 5.10 meters; Total Flight Time T = 2.04 seconds.",
      },
    ],
    flashcards: [
      {
        id: "fc-p1",
        question: "Why does the horizontal velocity of a projectile remain constant in vacuum?",
        answer: "Because gravity acts solely downwards along the y-axis, meaning horizontal acceleration a_x is strictly zero.",
        key_term: "Zero Horizontal Acceleration",
      },
      {
        id: "fc-p2",
        question: "At what launch angle is horizontal range maximized on flat ground (ignoring air drag)?",
        answer: "45 degrees, because sin(2θ) reaches its maximum value of 1.0 when 2θ = 90°.",
        key_term: "Optimal Angle",
      },
      {
        id: "fc-p3",
        question: "What is the projectile's vertical velocity at the highest point of its trajectory?",
        answer: "Zero (v_y = 0 m/s); however, its vertical acceleration remains -g throughout.",
        key_term: "Apex Kinematics",
      },
    ],
    quiz: [
      {
        id: "qz-p1",
        question: "If two projectiles are launched with the same speed at complementary angles (e.g., 30° and 60°), what is true of their horizontal ranges?",
        options: [
          { key: "A", text: "They achieve identical horizontal ranges" },
          { key: "B", text: "The 60° projectile travels twice as far" },
          { key: "C", text: "The 30° projectile travels twice as far" },
          { key: "D", text: "Their ranges cannot be compared without mass" },
        ],
        correct_answer: "A",
        explanation: "Because sin(2 × 30°) = sin(60°) and sin(2 × 60°) = sin(120°) = sin(60°), complementary angles yield identical theoretical horizontal ranges.",
      },
      {
        id: "qz-p2",
        question: "How does reducing gravity to the Moon's level (g = 1.6 m/s²) affect maximum height and range?",
        options: [
          { key: "A", text: "Both height and range increase by a factor of ~6" },
          { key: "B", text: "Range decreases while height increases" },
          { key: "C", text: "Height decreases by a factor of 6" },
          { key: "D", text: "Neither changes because velocity is constant" },
        ],
        correct_answer: "A",
        explanation: "Both H = v₀²sin²θ/(2g) and R = v₀²sin(2θ)/g are inversely proportional to gravity g. Lower g directly increases both.",
      },
    ],
    hints: [
      "Always split initial velocity into v_x = v₀ cos(θ) and v_y = v₀ sin(θ) first.",
      "The vertical motion dictates how long the object stays in the air.",
    ],
    suggested_followups: [
      "How does quadratic aerodynamic drag alter the optimal launch angle from 45°?",
      "What happens when the landing elevation differs from the launch elevation?",
    ],
    sources: ["Halliday, Resnick, Walker: Fundamentals of Physics", "Feynman Lectures on Physics, Vol 1"],
    metadata: {
      provider: "gemma",
      model: "gemma-4-26b-a4b-it",
      is_fallback_simulation: false,
      disclaimer: "Curated pedagogical model for physics simulation.",
    },
  },
  {
    id: "lesson-chemistry",
    topic: "Esterification Mechanism & Reaction Thermodynamics",
    subject: "chemistry",
    subtopic: "Organic Chemistry & Chemical Kinetics",
    difficulty: "intermediate",
    teaching_method: "Multi-Step Reaction Coordinate",
    learning_objectives: [
      "Understand Fischer esterification as an acid-catalyzed nucleophilic acyl substitution",
      "Trace the reaction coordinate across protonation, tetrahedral intermediate, and water departure",
      "Analyze the role of activation energy Ea and equilibrium position ΔH in reaction feasibility",
    ],
    sections: [
      {
        title: "1. Fischer Esterification Overview",
        content:
          "**Fischer esterification** converts a carboxylic acid and an alcohol into an ester and water in the presence of an acid catalyst ($H^+$):\n\n$$\\text{R-COOH} + \\text{R'-OH} \\xrightleftharpoons[\\Delta]{\\text{H}^+} \\text{R-COOR'} + \\text{H}_2\\text{O}$$\n\n* **Reversibility**: The reaction is an equilibrium process governed by Le Chatelier's principle.\n* **Catalyst Role**: The acid protonates the carbonyl oxygen, making the carbonyl carbon vastly more electrophilic for alcohol attack.",
        key_concepts: ["Nucleophilic Acyl Substitution", "Acid Catalysis", "Equilibrium Displacement"],
        analogies: ["The acid catalyst is like an open door holder: it lowers the effort needed to get in, but doesn't change the final room layout."],
      },
      {
        title: "2. The Four-Stage Mechanism & Potential Energy Profile",
        content:
          "The reaction advances through four distinct stages along the potential energy coordinate:\n\n1. **Protonation of Carbonyl**: Oxygen draws proton; resonance forms carbocation.\n2. **Nucleophilic Addition**: Alcohol oxygen attacks carbonyl carbon, forming a tetrahedral intermediate.\n3. **Proton Transfer**: Proton shifts to an -OH group, converting it into a good leaving group ($-OH_2^+$).\n4. **Elimination of Water**: Water departs, and deprotonation yields the stable ester product.",
        key_concepts: ["Tetrahedral Intermediate", "Good Leaving Group", "Activation Barrier"],
        analogies: ["Passing over a mountain pass: you must climb the activation peak before rolling down into the product valley."],
      },
    ],
    visualization: {
      type: "chemistry_reaction",
      title: "Interactive Reaction Coordinate & Transition State Profile",
      description: "Step through the 4-phase molecular transformation and observe the potential energy curve (Ea and ΔH) alongside temperature kinetics.",
      data: {
        reaction_name: "Fischer Esterification (Acetic Acid + Ethanol \u2194 Ethyl Acetate + Water)",
        equation: "CH3COOH + C2H5OH \u21c4 CH3COOC2H5 + H2O",
        activation_energy: 85,
        enthalpy_delta: -12,
        steps: [
          {
            step: 1,
            title: "Protonation of Carbonyl Oxygen",
            description: "Acid catalyst transfers H+ to carbonyl oxygen. Resonance-stabilized carbocation makes carbonyl carbon highly electrophilic.",
            energy_kj: 35,
            bonds: "O-H bond forms on carbonyl oxygen; C=O bond weakens",
          },
          {
            step: 2,
            title: "Nucleophilic Attack by Alcohol",
            description: "Ethanol oxygen donates lone pair to electrophilic carbon, forming tetrahedral intermediate complex.",
            energy_kj: 85,
            bonds: "New C-O bond forms between carboxyl carbon and alcohol oxygen",
          },
          {
            step: 3,
            title: "Intramolecular Proton Transfer",
            description: "Proton migrates from alcohol oxygen to one of the -OH groups, turning a poor leaving group into water (H2O+).",
            energy_kj: 58,
            bonds: "Proton exchange creates stable departing water molecule",
          },
          {
            step: 4,
            title: "Water Elimination & Deprotonation",
            description: "Water leaves as a neutral molecule. Reform of C=O double bond followed by deprotonation yields ethyl acetate ester.",
            energy_kj: 12,
            bonds: "C=O bond fully restored; ester C-O-C backbone locked",
          },
        ],
      },
    },
    worked_examples: [
      {
        problem: "How can a chemist drive the Fischer esterification to >95% yield despite an equilibrium constant K_eq ≈ 4?",
        steps: [
          {
            step_number: 1,
            instruction: "Identify the equilibrium expression",
            formula_or_code: "K_{eq} = \\frac{[\\text{Ester}][\\text{H}_2\\text{O}]}{[\\text{Acid}][\\text{Alcohol}]} \\approx 4",
            explanation: "At standard equimolar concentrations, equilibrium yields roughly 67% ester.",
          },
          {
            step_number: 2,
            instruction: "Apply Le Chatelier's principle via excess reactant",
            formula_or_code: "[\\text{Alcohol}] \\gg [\\text{Acid}]",
            explanation: "Using ethanol as both reactant and solvent shifts equilibrium strongly toward ester formation.",
          },
          {
            step_number: 3,
            instruction: "Remove water byproduct continuously (Dean-Stark trap or molecular sieves)",
            formula_or_code: "[\\text{H}_2\\text{O}] \\to 0 \\implies Q < K_{eq}",
            explanation: "Continuously sequestering water prevents the reverse hydrolysis reaction.",
          },
        ],
        final_answer: "Use excess alcohol as solvent and continuously remove water via Dean-Stark distillation to drive yield >95%.",
      },
    ],
    flashcards: [
      {
        id: "fc-ch1",
        question: "Why cannot esterification proceed at a useful rate without an acid catalyst?",
        answer: "Neutral carboxylic acid carbonyl carbon is not sufficiently electrophilic to be attacked by weak neutral alcohol nucleophiles.",
        key_term: "Acid Catalysis",
      },
      {
        id: "fc-ch2",
        question: "What intermediate geometry is formed during Fischer esterification?",
        answer: "A tetrahedral sp3-hybridized intermediate with two hydroxyl groups and an alkoxy group attached to the central carbon.",
        key_term: "Tetrahedral Intermediate",
      },
      {
        id: "fc-ch3",
        question: "Is Fischer esterification exothermic or endothermic?",
        answer: "Nearly thermoneutral or slightly exothermic (ΔH ≈ -10 to -15 kJ/mol), with ΔS close to zero since 2 molecules yield 2 molecules.",
        key_term: "Thermodynamics",
      },
    ],
    quiz: [
      {
        id: "qz-ch1",
        question: "If oxygen-18 (¹⁸O) isotopic labeling is used in the alcohol (R-¹⁸O-H), where does the ¹⁸O atom end up?",
        options: [
          { key: "A", text: "In the ester product (R-C(=O)-¹⁸O-R')" },
          { key: "B", text: "In the water byproduct (H₂¹⁸O)" },
          { key: "C", text: "Equally scrambled between ester and water" },
          { key: "D", text: "Lost as gaseous carbon dioxide" },
        ],
        correct_answer: "A",
        explanation: "Isotopic tracer experiments confirm that the C-OH bond of the acid breaks, not the C-OR bond of the alcohol. The labeled oxygen stays in the ester.",
      },
      {
        id: "qz-ch2",
        question: "What is the primary role of the proton transfer step in the mechanism?",
        options: [
          { key: "A", text: "Converting poor leaving group -OH into excellent leaving group -OH₂⁺" },
          { key: "B", text: "Oxidizing the carbon atom from +2 to +4" },
          { key: "C", text: "Preventing nucleophilic attack by the alcohol" },
          { key: "D", text: "Increasing the reaction entropy" },
        ],
        correct_answer: "A",
        explanation: "Hydroxide (-OH) is a strong base and poor leaving group; protonation converts it into neutral water (H₂O), which readily departs.",
      },
    ],
    hints: [
      "Track the formal charges on oxygen atoms through each step.",
      "The catalyst H+ is regenerated in the final deprotonation step.",
    ],
    suggested_followups: [
      "How does steric hindrance in bulky alcohols (like tert-butanol) affect esterification rate?",
      "How does base-catalyzed saponification differ from acid-catalyzed esterification?",
    ],
    sources: ["Wade: Organic Chemistry", "Carey & Sundberg: Advanced Organic Chemistry"],
    metadata: {
      provider: "gemma",
      model: "gemma-4-26b-a4b-it",
      is_fallback_simulation: false,
      disclaimer: "Curated pedagogical model for chemistry exploration.",
    },
  },
];
