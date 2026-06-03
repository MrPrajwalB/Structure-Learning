/* LiNGAM — Linear Non-Gaussian Acyclic Model. Grounded in §4.19 (pp.118-119).
   Worked example = Example 29 (X1=n1, X2=-0.5 X3 + X1 + n2, X3=2 X1 + n3);
   pseudocode = Algorithm 25 (lingam); identifiability = Theorem 11. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["lingam"] = {
  name: "LiNGAM (Linear Non-Gaussian Acyclic Model)",
  oneLiner: "Assume each variable is a linear function of its parents plus independent non-Gaussian noise; then Independent Component Analysis recovers the mixing matrix, which is permuted to lower-triangular form to read off a causal order and the edge weights — yielding the full DAG, not just an equivalence class.",
  basedOnText: "LiNGAM breaks Markov equivalence: where a linear-Gaussian SEM is identifiable only up to its CPDAG, making the disturbances non-Gaussian makes the causal mixing matrix identifiable (up to permutation and scaling), which in turn yields a unique causal ordering and edge weights.",

  assumptions: [
    "<b>Linearity</b> — each variable is a linear (weighted-sum) function of its direct causes.",
    "<b>Acyclicity</b> — the true graph is a DAG, so the variables can be put in a causal order (the connection matrix B is strictly lower-triangular under that ordering).",
    "<b>Non-Gaussian disturbances</b> — the noise terms are non-Gaussian; <i>at most one</i> may be Gaussian. This is exactly what makes the direction of causation identifiable.",
    "<b>Mutual independence of disturbances</b> — the noise terms are independent of one another (so they can act as ICA's independent sources).",
    "<b>No latent confounding</b> — every common cause is observed (causal sufficiency)."
  ],
  input: "A dataset 𝒟 over variables V = {X₁,…,X_p} and an ICA routine.",
  output: "A <b>fully-directed DAG</b>: an estimated weighted adjacency matrix B̂ together with a single causal order π. Unlike PC's CPDAG, every edge direction is determined.",

  idea: [
    "LiNGAM models the data as a <b>linear non-Gaussian structural equation model (SEM)</b>: <b>X = B X + N</b>. Here B holds the connection strengths (B_ij is the weight of the edge from X_j into X_i), and N is a vector of mutually independent, non-Gaussian noise terms — one per variable. Because the graph is acyclic, the variables can be ordered so that B is strictly lower-triangular.",
    "Why non-Gaussianity matters. With <i>Gaussian</i> noise, the data look the same whether X causes Y or Y causes X — only the undirected/equivalence-class structure (a CPDAG) is recoverable. When the noise is <b>non-Gaussian</b>, that symmetry breaks: the direction of causation becomes identifiable, so you can tell X→Y apart from Y→X from observational data alone.",
    "The bridge to ICA. Solving the SEM for X gives <b>X = A N</b> with <b>A = (I − B)⁻¹</b>. This is exactly the <b>Independent Component Analysis (ICA)</b> setup: the independent, non-Gaussian noises N are the hidden 'sources', the observed X are their linear mixtures, and A is the mixing matrix. ICA recovers an unmixing matrix Ŵ ≈ A⁻¹ = I − B — but only up to permuting and rescaling its rows.",
    "Resolving ICA's ambiguities. ICA cannot tell which recovered row matches which observed variable, nor how each is scaled. LiNGAM fixes this with two reorderings: (1) permute Ŵ's rows so its diagonal is nonzero and rescale each row so the diagonal equals one — giving W̄ with B̄ = I − W̄; (2) find the variable permutation that makes B̄ <b>strictly lower-triangular</b>. That triangular form simultaneously enforces acyclicity and reveals the causal order π. Small residual weights are then pruned to leave the DAG."
  ],

  steps: [
    "<b>Center and run ICA.</b> Center the data 𝒟 and run an ICA routine on X to obtain an unmixing matrix Ŵ (so that the recovered sources are N̂ = Ŵ X). ICA returns Ŵ only up to row permutation and row scaling.",
    "<b>Resolve the row permutation.</b> Permute the rows of Ŵ so that the diagonal entries are all nonzero — this aligns each recovered component with the observed variable it explains.",
    "<b>Resolve the row scaling.</b> Divide each row of Ŵ by its diagonal entry so the diagonal becomes all-ones, yielding W̄ (matching the LiNGAM normalization in which the diagonal of I − B equals one).",
    "<b>Read the connection matrix.</b> Set B̄ ← I − W̄. The entries of B̄ are the estimated edge weights, but the variables are not yet in causal order.",
    "<b>Find the causal order.</b> Find a variable permutation P such that P B̄ Pᵀ is <b>strictly lower-triangular</b>. This single reordering enforces acyclicity and yields the causal order π = the corresponding variable order; set B̄ ← P B̄ Pᵀ.",
    "<b>Build and prune the DAG.</b> Add a directed edge X_j → X_i for each surviving (sufficiently large) weight B̄_ij; prune near-zero weights. Return the weighted adjacency B̄ and the order π — a fully-directed DAG."
  ],

  keyConcepts: [
    { term: "Linear non-Gaussian SEM", def: "The generative model X = B X + N: every variable is a weighted sum of its parents plus its own independent, non-Gaussian noise. Acyclicity lets the variables be ordered so B is strictly lower-triangular." },
    { term: "Non-Gaussianity → identifiability", def: "With Gaussian noise only an equivalence class (CPDAG) is recoverable; with non-Gaussian noise the full direction of every edge is identifiable, so X→Y is distinguishable from Y→X." },
    { term: "Mixing / unmixing matrix", def: "Rewriting the SEM as X = A N with A = (I − B)⁻¹ makes A the ICA mixing matrix; ICA estimates the unmixing Ŵ ≈ A⁻¹ = I − B." },
    { term: "ICA indeterminacies", def: "ICA recovers the independent sources only up to permuting and scaling them, so Ŵ is correct only up to row permutation and row scaling — which LiNGAM must undo." },
    { term: "Permutation to lower-triangular", def: "The variable reordering P that makes P B̄ Pᵀ strictly lower-triangular. It enforces acyclicity and reveals the unique causal order π." },
    { term: "Full DAG vs. equivalence class", def: "LiNGAM's payoff: a single, fully-oriented DAG with edge weights — not the partially-directed CPDAG returned by constraint-based methods like PC." }
  ],

  animation: {
    title: "LiNGAM on Example 29 (paper §4.19): X₁ = n₁, X₂ = −0.5 X₃ + X₁ + n₂, X₃ = 2 X₁ + n₃.",
    nodes: [
      { id: "X1", x: 0.12, y: 0.5 },
      { id: "X2", x: 0.88, y: 0.5 },
      { id: "X3", x: 0.5, y: 0.12 }
    ],
    edges: [],
    steps: [
      { caption: "<b>The data.</b> Three variables are generated by a linear, acyclic SEM with mutually independent, <i>non-Gaussian</i> noise: X₁ = n₁, X₂ = −0.5 X₃ + X₁ + n₂, X₃ = 2 X₁ + n₃. We only observe samples of X₁, X₂, X₃ — the structure is hidden.", ops: [{ op: "badge", text: "linear non-Gaussian SEM", kind: "info" }, { op: "highlightNodes", ids: ["X1", "X2", "X3"], cls: "hl" }] },
      { caption: "<b>Why non-Gaussian?</b> If the noise were Gaussian, X→Y and Y→X would look identical and only an equivalence class (CPDAG) could be found. Because the noise is non-Gaussian, the direction of every edge becomes identifiable.", ops: [{ op: "badge", text: "non-Gaussian ⇒ direction identifiable", kind: "good" }] },
      { caption: "<b>Rewrite as a mixture.</b> Solving X = B X + N for X gives X = A N with A = (I − B)⁻¹. The independent noises N are the hidden 'sources', the observed X are their linear mixtures — exactly the ICA setup.", ops: [{ op: "badge", text: "X = A N,  A = (I − B)⁻¹", kind: "info" }] },
      { caption: "<b>Run ICA.</b> Center the data and apply an ICA routine on X to estimate the unmixing matrix Ŵ ≈ A⁻¹ = I − B. ICA recovers it only up to permuting and rescaling its rows: Ŵ = [[−1,1,0.5],[1,0,0],[−1,0,0.5]].", ops: [{ op: "badge", text: "ICA → Ŵ (up to perm & scale)", kind: "info" }] },
      { caption: "<b>Resolve the row permutation.</b> Permute the first two rows of Ŵ so the diagonal is nonzero — aligning each recovered component with the variable it explains.", ops: [{ op: "badge", text: "rows permuted → nonzero diagonal", kind: "info" }] },
      { caption: "<b>Resolve the row scaling.</b> Scale each row so the diagonal entries equal one, giving W̄ = [[1,0,0],[−1,1,0.5],[−2,0,1]]. Then B̄ = I − W̄ = [[0,0,0],[1,0,−0.5],[2,0,0]] holds the estimated edge weights.", ops: [{ op: "badge", text: "B̄ = I − W̄", kind: "info" }] },
      { caption: "<b>Permute to lower-triangular → read the causal order.</b> A variable permutation P makes P B̄ Pᵀ strictly lower-triangular, which enforces acyclicity and reveals the causal order X₁ → X₃ → X₂.", ops: [{ op: "set", name: "Causal order", items: ["X1", "X3", "X2"] }, { op: "badge", text: "P B̄ Pᵀ strictly lower-triangular", kind: "good" }] },
      { caption: "<b>Add edges by order — first cause.</b> X₁ comes first. From the triangular B̄, X₁ drives X₃ with weight 2: add the directed edge X₁ → X₃.", ops: [{ op: "addEdge", from: "X1", to: "X3", type: "directed" }, { op: "highlightNodes", ids: ["X1", "X3"], cls: "hl" }, { op: "score", text: "weight = 2.0" }] },
      { caption: "<b>Add edges by order — X₁ into X₂.</b> Next, X₁ also drives X₂ with weight 1: add the directed edge X₁ → X₂.", ops: [{ op: "addEdge", from: "X1", to: "X2", type: "directed" }, { op: "highlightNodes", ids: ["X1", "X2"], cls: "hl" }, { op: "score", text: "weight = 1.0" }] },
      { caption: "<b>Add edges by order — X₃ into X₂.</b> X₃ precedes X₂ and drives it with weight −0.5: add the directed edge X₃ → X₂. All arrows respect the recovered order.", ops: [{ op: "addEdge", from: "X3", to: "X2", type: "directed" }, { op: "highlightNodes", ids: ["X3", "X2"], cls: "hl" }, { op: "score", text: "weight = −0.5" }] },
      { caption: "<b>Prune near-zero weights.</b> Any estimated weight close to zero is treated as no edge and removed. (Illustrative: a spurious tiny X₂ → X₁ weight would be pruned here, keeping the graph acyclic.)", ops: [{ op: "badge", text: "prune |weight| ≈ 0", kind: "warn" }] },
      { caption: "<b>Result — the full DAG.</b> X₁ → X₃ → X₂ with X₁ → X₂, every edge directed and weighted, matching the generating model. LiNGAM returns a <i>unique</i> oriented DAG, not an equivalence class like PC's CPDAG.", ops: [{ op: "badge", text: "fully-directed DAG (not a CPDAG)", kind: "good" }, { op: "highlightEdges", edges: [["X1", "X3"], ["X1", "X2"], ["X3", "X2"]] }] }
    ]
  },

  complexity: "Dominated by the ICA estimation plus the search for a row permutation giving a nonzero diagonal and a variable permutation giving strict lower-triangularity. Practical on moderate numbers of variables; the permutation searches grow with the variable count.",
  strengths: [
    "Identifies the <b>full DAG</b> — a unique graph with edge directions and weights — rather than only an equivalence class (CPDAG).",
    "Direction of causation is identifiable from purely observational data, thanks to non-Gaussianity.",
    "Recovers quantitative connection strengths, not just which edges exist."
  ],
  limitations: [
    "Relies on linearity, acyclicity, and non-Gaussian, mutually independent disturbances (at most one Gaussian); violations can invalidate identifiability.",
    "Hidden confounding (no causal sufficiency) breaks the guarantees.",
    "In practice, sampling variability, near-Gaussian errors, or model misspecification can complicate the row permutation and normalization steps and the search for a clean lower-triangular form."
  ],
  notes: "Theorem 11 (identifiability): under a linear acyclic SEM X = B X + N with mutually independent, non-Gaussian disturbances and no latent confounding, the causal mixing matrix is identifiable up to permutation and scaling, and LiNGAM recovers the unique causal order and edge weights in the large-sample limit. The two reorderings undo ICA's row-permutation and row-scaling indeterminacies; the final variable permutation enforces acyclicity explicitly.",
  figureRefs: "Paper §4.19 (pp.118–119): Algorithm 25 (lingam, ICA-based estimation of a linear non-Gaussian DAG), Theorem 11 (identifiability), Example 29 (three-variable worked example)."
};
