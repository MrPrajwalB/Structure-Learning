/* NOTEARS — Non-combinatorial Optimization via Trace Exponential and Augmented
   Lagrangian for Structure learning. Grounded in §4.44 (pp.213-215):
   weighted adjacency matrix W (Eq. X=XW+N), least-squares + L1 objective F(W),
   smooth acyclicity h(W)=tr(e^{W∘W})−d, augmented-Lagrangian solver (Recalls 53-54,
   Algorithm 55 NOTEARS). 4-node example is illustrative (paper gives no node example). */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["notears"] = {
  name: "NOTEARS",
  oneLiner: "Instead of searching the huge discrete space of DAGs, write the graph as a real-valued weight matrix and 'acyclicity' as a single smooth equation, then use ordinary continuous optimization to find weights that fit the data, are sparse, and make that equation zero.",
  basedOnText: "NOTEARS reframes structure learning as a smooth continuous optimization problem rather than a combinatorial search, by encoding the whole directed graph in a weighted adjacency matrix and expressing the acyclicity requirement as one differentiable function.",

  assumptions: [
    "<b>Linear structural equation model</b> — each variable is (in the basic version) a linear combination of its parents plus noise, written compactly as X = XW + N.",
    "<b>Continuous data</b> — the method optimizes a least-squares fit over real-valued samples (extensions handle nonlinear / other cases).",
    "<b>Acyclicity is the only hard constraint</b> — the final graph must be a DAG, enforced through the smooth function h(W) rather than by combinatorial bookkeeping."
  ],
  input: "A data matrix X (n samples × d variables) and a sparsity weight λ.",
  output: "A weighted adjacency matrix W whose nonzero entries (after thresholding) define the edges of a DAG G over the variables.",

  idea: [
    "Classic structure learning fights a <i>combinatorial</i> battle: the number of possible DAGs explodes with the number of variables, so methods search or score discrete graphs one move at a time. NOTEARS changes the playing field entirely — it treats the graph as a single block of real numbers and uses smooth, continuous optimization (gradient-based) instead of discrete search.",
    "<b>The graph becomes a matrix.</b> Represent the directed graph by a <i>weighted adjacency matrix</i> W: the entry w<sub>ij</sub> is the strength of the edge from variable i to variable j, and a weight of zero means 'no edge'. The model says each variable is explained by its parents: X = XW + N. Now 'learning the structure' just means 'finding good numbers in W'.",
    "<b>Acyclicity becomes one smooth equation.</b> The hard part is keeping W a DAG (no cycles). NOTEARS' key trick is a single differentiable score h(W) = tr(e<sup>W∘W</sup>) − d that is <i>exactly zero only when the graph has no cycles</i> and grows positive when cycles are present. (W∘W squares the weights so signs don't matter; the matrix-exponential trace counts closed walks of every length — any cycle makes it bigger than d.) This converts a discrete 'is it a DAG?' check into something gradient descent can work with.",
    "<b>Solve it like an ordinary optimization.</b> The objective is data fit (least-squares reconstruction of X from XW) plus an L1 sparsity penalty λ‖W‖₁ that pushes weak weights toward zero. Minimize that objective subject to h(W) = 0. Because everything is smooth, this can be solved with a standard continuous-optimization tool — the <b>augmented Lagrangian</b> — which alternates gradient steps with gradually tightening the acyclicity constraint until it is satisfied.",
    "<b>Read off the graph.</b> When optimization converges, tiny leftover weights are <i>thresholded</i> to zero, and the surviving nonzero entries of W are the directed edges of the learned DAG."
  ],

  steps: [
    "<b>Set up the matrix model.</b> Encode the unknown graph as a weighted adjacency matrix W and assume X = XW + N. The goal is to choose W's entries from the data.",
    "<b>Define the objective F(W).</b> Combine a least-squares data-fit term — how well XW reconstructs X — with an L1 sparsity penalty λ‖W‖₁ that discourages spurious edges. Smaller F(W) means a sparser, better-fitting model.",
    "<b>Define the smooth acyclicity score.</b> Use h(W) = tr(e<sup>W∘W</sup>) − d. This is a single differentiable number that equals 0 exactly when W is acyclic and is positive whenever a cycle exists.",
    "<b>State the constrained problem.</b> Minimize F(W) subject to h(W) = 0 (and the diagonal forced to 0, so no variable is its own parent). This is now a smooth constrained optimization in W.",
    "<b>Augmented Lagrangian — initialise.</b> Add the constraint into the objective with a multiplier α and a quadratic penalty (ρ/2)·h(W)², giving a smooth function to minimize. Start with small ρ and α≈0.",
    "<b>Inner gradient step.</b> For the current penalty, minimize the augmented objective in W using gradient-based optimization — this lowers the loss while nudging W toward acyclicity.",
    "<b>Tighten the constraint.</b> Update the multiplier (α ← α + ρ·h(W)) and, if h(W) did not shrink enough, increase the penalty ρ. Tightening makes any remaining cycles increasingly costly.",
    "<b>Repeat</b> the inner-minimize / tighten loop until h(W) is below a small tolerance ε — i.e. the graph is (numerically) acyclic.",
    "<b>Threshold.</b> Set entries of W with magnitude below a small cutoff to zero, removing near-zero weights so weak/spurious edges disappear.",
    "<b>Return</b> the final weighted matrix W and the DAG G read off from its surviving nonzero entries."
  ],

  keyConcepts: [
    { term: "Weighted adjacency matrix W", def: "A d×d block of real numbers encoding the whole graph: w_ij is the strength of the edge i→j, and 0 means no edge. Learning structure = finding good values in W." },
    { term: "Linear SEM (X = XW + N)", def: "The model that each variable equals a weighted combination of its parents plus noise. It lets the data-fit be measured by least squares." },
    { term: "Acyclicity function h(W)", def: "A smooth score h(W)=tr(e^{W∘W})−d that is exactly zero only when the graph has no cycles, and positive otherwise — making 'is it a DAG?' differentiable." },
    { term: "Hadamard square W∘W", def: "Element-wise squaring of the weights so the acyclicity score depends only on edge presence/strength, not on the sign of a weight." },
    { term: "L1 sparsity penalty λ‖W‖₁", def: "A term that drives many weights toward zero, yielding a sparse graph and helping suppress spurious edges; λ controls how aggressive it is." },
    { term: "Augmented Lagrangian", def: "A standard continuous-optimization method that folds the constraint h(W)=0 into the objective via a multiplier α and a quadratic penalty ρ, alternating gradient minimization with constraint tightening." },
    { term: "Thresholding", def: "After optimization, tiny residual weights are set to zero so only meaningful edges remain in the final DAG." }
  ],

  animation: {
    title: "NOTEARS driving a weighted matrix to a sparse acyclic DAG (illustrative 4-variable example; the paper gives the formulation, not a node example).",
    nodes: [
      { id: "A", x: 0.18, y: 0.18 },
      { id: "B", x: 0.82, y: 0.18 },
      { id: "C", x: 0.82, y: 0.82 },
      { id: "D", x: 0.18, y: 0.82 }
    ],
    edges: [
      { from: "A", to: "B", type: "directed" },
      { from: "B", to: "C", type: "directed" },
      { from: "C", to: "A", type: "directed" },
      { from: "A", to: "C", type: "directed" },
      { from: "B", to: "D", type: "directed" },
      { from: "A", to: "D", type: "directed" }
    ],
    steps: [
      { caption: "<b>Start: a dense weighted matrix.</b> Every candidate edge has a nonzero weight w_ij. The current W even contains a cycle A→B→C→A, so it is NOT a DAG yet. NOTEARS will optimize the numbers in W, not search graphs.", ops: [
        { op: "highlightEdges", edges: [["A","B"],["B","C"],["C","A"]], cls: "hl" },
        { op: "score", text: "loss F(W): high   |   h(W): high (cycle!)   |   sparsity: low" },
        { op: "badge", text: "h(W) > 0 — not acyclic", kind: "bad" }
      ] },
      { caption: "<b>State the smooth problem.</b> Minimize least-squares data-fit + λ‖W‖₁ subject to the single equation h(W)=tr(e^{W∘W})−d = 0. Everything is differentiable, so gradient-based optimization applies.", ops: [
        { op: "set", name: "objective", items: ["least-squares fit", "+ λ·L1 sparsity", "subject to h(W)=0"] },
        { op: "badge", text: "continuous optimization", kind: "info" }
      ] },
      { caption: "<b>Augmented Lagrangian, ρ small.</b> Fold the constraint into the objective with multiplier α and penalty (ρ/2)·h(W)². Begin minimizing — first gradient steps mainly cut the data-fit loss.", ops: [
        { op: "badge", text: "ρ small, α ≈ 0", kind: "info" },
        { op: "score", text: "loss F(W): falling   |   h(W): still > 0   |   sparsity: rising" }
      ] },
      { caption: "<b>Gradient steps reduce the loss.</b> Weights that genuinely help reconstruct the data (A→B, B→C, B→D) strengthen; the model fits better.", ops: [
        { op: "highlightEdges", edges: [["A","B"],["B","C"],["B","D"]], cls: "strong" },
        { op: "score", text: "loss F(W): lower   |   h(W): > 0   |   sparsity: rising" }
      ] },
      { caption: "<b>Tighten the constraint.</b> Update α ← α + ρ·h(W) and raise ρ because h(W) is still too large. Cycles now carry a heavy penalty, so the optimizer must break them.", ops: [
        { op: "badge", text: "constraint tightened (ρ ↑)", kind: "info" },
        { op: "score", text: "loss F(W): low   |   h(W): shrinking   |   sparsity: rising" }
      ] },
      { caption: "<b>The cycle-closing weight collapses.</b> Edge C→A is what creates the cycle A→B→C→A; under the tightened acyclicity penalty its weight is driven toward zero.", ops: [
        { op: "highlightEdges", edges: [["C","A"]], cls: "weak" },
        { op: "score", text: "loss F(W): low   |   h(W): much smaller   |   sparsity: higher" }
      ] },
      { caption: "<b>Threshold near-zero weights.</b> The weight on C→A has shrunk below the cutoff — remove it. Breaking this edge eliminates the cycle.", ops: [
        { op: "removeEdge", from: "C", to: "A" },
        { op: "badge", text: "h(W) ≈ 0 reached", kind: "good" }
      ] },
      { caption: "<b>Sparsity keeps pruning.</b> The L1 penalty has also flattened the redundant weights A→C and A→D — they add little data-fit. They fall below the threshold.", ops: [
        { op: "highlightEdges", edges: [["A","C"],["A","D"]], cls: "weak" },
        { op: "score", text: "loss F(W): low   |   h(W) ≈ 0   |   sparsity: high" }
      ] },
      { caption: "<b>Remove the thresholded weak edges.</b> A→C and A→D are set to zero, leaving only the strong, structurally meaningful weights.", ops: [
        { op: "removeEdge", from: "A", to: "C" },
        { op: "removeEdge", from: "A", to: "D" }
      ] },
      { caption: "<b>Converged.</b> h(W) is below tolerance ε, so W is (numerically) acyclic; the loss is low and W is sparse. The surviving nonzero weights are the directed edges.", ops: [
        { op: "highlightNodes", ids: ["A","B","C","D"], cls: "hl" },
        { op: "highlightEdges", edges: [["A","B"],["B","C"],["B","D"]], cls: "strong" },
        { op: "badge", text: "h(W) < ε — acyclic", kind: "good" }
      ] },
      { caption: "<b>Result — a sparse acyclic DAG.</b> Read off the graph from the thresholded matrix W: A→B, B→C, B→D. A combinatorial search problem was solved by smooth continuous optimization.", ops: [
        { op: "badge", text: "DAG returned", kind: "good" },
        { op: "score", text: "final: loss low · h(W)=0 · sparse W" }
      ] }
    ]
  },

  complexity: "Each iteration is a smooth (gradient-based) optimization over the d² entries of W; evaluating the acyclicity score h(W) and its gradient costs about O(d³) from the matrix exponential. The augmented Lagrangian runs a handful of outer rounds, each tightening ρ. This scales very differently from combinatorial methods — no explicit search over the super-exponential space of DAGs.",
  strengths: [
    "Turns a combinatorial DAG search into a single smooth continuous-optimization problem, solvable with standard gradient-based tools.",
    "The acyclicity constraint is one differentiable equation h(W)=0 — no per-step cycle-checking bookkeeping.",
    "Built-in L1 sparsity yields compact graphs; the framework extends naturally to nonlinear models (e.g. neural-network parameterizations of the SEM)."
  ],
  limitations: [
    "The constrained problem is non-convex, so the augmented Lagrangian can land in local optima rather than the global best.",
    "The basic version assumes a (linear) SEM and continuous data; results depend on the sparsity weight λ and the final thresholding cutoff.",
    "Reported failure modes for continuous acyclicity methods (e.g. sensitivity to variable scale / noise variance) mean careful standardization and tuning are needed."
  ],
  notes: "NOTEARS launched a family of continuous-optimization structure learners. Follow-ups include NOTEARS-MLP / nonlinear variants, DAG-GNN (graph-neural-network encoder), GAE/autoencoder formulations, GAN-based and Gumbel-Sigmoid relaxations, and works analyzing or fixing failure modes of the smooth acyclicity constraint.",
  figureRefs: "Paper §4.44 (pp.213–215): model X = XW + N and objective F(W); Recall 53 (matrix norms); the acyclicity function h(W)=tr(e^{W∘W})−d; Recall 54 (constrained optimization) and the augmented-Lagrangian formulation; Algorithm 55 (NOTEARS); related-work §4.44.2."
};
