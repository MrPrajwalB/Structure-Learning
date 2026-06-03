/* RESIT — Regression with Subsequent Independence Test. Grounded in §4.35 (pp.175-177).
   Worked example = Example 45 (X1=N1, X3=N3, X2=X1+X3+N2, X4=2X2+N4; true DAG X1→X2, X3→X2, X2→X4);
   pseudocode = Algorithm 26 (RESIT); consistency = Theorem 18; oracle correctness = Theorem 19. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["resit"] = {
  name: "RESIT (Regression with Subsequent Independence Test)",
  oneLiner: "Assume each variable is a (possibly nonlinear) function of its parents plus independent additive noise; then repeatedly find the SINK — the variable whose residuals, after regressing it on all the others, are independent of those others — record it, remove it, and recurse to get a full causal order, then prune unnecessary parents.",
  basedOnText: "RESIT exploits the asymmetry of additive-noise models: regressing a true sink on everything else leaves residuals independent of the inputs, but regressing the wrong way around leaves a tell-tale dependence. That asymmetry reveals edge direction, so RESIT identifies the full DAG — not just an equivalence class.",

  assumptions: [
    "<b>Additive-noise model (ANM)</b> — each variable is a (possibly nonlinear) function of its parents plus its own noise: if Y = f(X) + N describes the true mechanism, that structure is identifiable; restricted/nonlinear forms rule out the symmetric cases where direction cannot be told apart.",
    "<b>Mutually independent noise</b> — the noise terms are independent of one another (and a variable's noise is independent of its parents), so a true sink's residual carries no leftover dependence.",
    "<b>Acyclicity</b> — the true graph is a DAG, so a causal order exists and a sink (a variable with no children among those remaining) can always be found.",
    "<b>Causal sufficiency</b> — no hidden common causes; every common cause is observed.",
    "<b>A flexible regressor and an independence test</b> — a regression routine able to fit nonlinear mechanisms, plus a (typically nonparametric) independence test such as HSIC."
  ],
  input: "A dataset 𝒟 over variables V = {X₁,…,X_p}, a regression routine Regress, and an independence test Indep.",
  output: "A <b>fully-directed DAG</b>: a causal order π over the variables together with a pruned parent set Pa(X_k) for each variable. Unlike PC's CPDAG, every edge direction is determined.",

  idea: [
    "RESIT turns direction-finding into a residual-independence question. In an additive-noise model a variable equals some function of its parents plus independent noise. If you take a <b>true sink</b> (a variable that causes nothing else among those left) and regress it on all the other variables, the leftover residual is essentially its own noise — which is <i>independent</i> of everything you regressed on. Regress in the wrong direction (a non-sink on the others) and the residual still carries a dependence on the inputs. That asymmetry is the whole engine.",
    "<b>Phase 1 — find a causal order by iterative sink selection.</b> Among the remaining variables, regress <i>each</i> candidate on all the others and test whether its residual is independent of those others. The candidate whose residual <i>is</i> independent is declared the current sink: it is appended to the front of the causal order (it goes <i>last</i> causally) and removed from the pool. Repeat on the smaller set to find the next sink, and so on, until the order is complete.",
    "<b>Phase 2 — prune unnecessary parents.</b> The order from Phase 1 over-includes parents: at first every earlier variable is a candidate parent of each X_k. For each variable, try dropping each candidate parent; if the regression residual stays independent of the kept parents, that parent was not needed, so the edge is removed. What survives is the true, minimal parent set.",
    "Because direction comes from residual independence rather than from independencies alone, RESIT breaks Markov equivalence: it returns a single oriented DAG. The price is that it leans on the additive-noise assumption and on a regressor flexible enough to capture the real (nonlinear) mechanisms."
  ],

  steps: [
    "<b>Initialise.</b> Set the causal order π ← empty list and the working set V to all variables.",
    "<b>Phase 1 — score each candidate as a possible sink.</b> While V still has more than one variable: for each X_k in V, regress X_k on the rest V∖{X_k} to get residual N̂_k = X_k − f̂_k(V∖{X_k}), and score how <i>independent</i> N̂_k is of V∖{X_k} (larger score = more independent).",
    "<b>Pick the sink.</b> Choose X* = the variable with the most-independent residual — that is the current sink. Prepend X* to π (it is causally last) and remove X* from V.",
    "<b>Recurse.</b> Repeat the regress-and-test step on the remaining smaller set to find the next sink, then the next, until one variable is left; it is the source (first in π).",
    "<b>Phase 2 — set tentative parents.</b> Using the order π, give each X_k the candidate parents Pa(X_k) = all variables that come before it in π.",
    "<b>Prune.</b> For each X_k and each candidate parent X_j in Pa(X_k): refit X_k on Pa(X_k)∖{X_j} and test whether the residual is still independent of that reduced set. If independence holds, X_j was unnecessary — remove it from Pa(X_k); otherwise keep it.",
    "<b>Return</b> the DAG given by the surviving parent sets {Pa(X_k)} — a fully-directed graph."
  ],

  keyConcepts: [
    { term: "Additive-noise model (ANM)", def: "The generative assumption Y = f(X) + N: each variable is a (possibly nonlinear) function of its parents plus its own independent noise. Restricting f away from the symmetric (e.g. fully linear-Gaussian) cases is what makes edge direction identifiable." },
    { term: "Sink", def: "A variable with no children among those still under consideration — causally last. Its residual, after regressing it on all the others, is just its own noise, hence independent of those others." },
    { term: "Residual-independence test", def: "Regress a candidate on the rest, then test whether the residual is independent of the regressors. Independence ⇒ candidate is a sink; leftover dependence ⇒ it is not. This is the per-step decision rule (often via HSIC)." },
    { term: "Iterative sink selection", def: "Phase 1: find a sink, record it, remove it, recurse on the smaller set. Building the order from the back (sinks first) yields a full causal ordering of all variables." },
    { term: "Parent pruning", def: "Phase 2: the order makes every earlier variable a candidate parent; drop any whose removal still leaves the residual independent of the kept parents, leaving the minimal true parent set." },
    { term: "Full DAG vs. equivalence class", def: "RESIT's payoff: residual asymmetry breaks Markov equivalence, so it returns one fully-oriented DAG with edge directions — not the partially-directed CPDAG of constraint-based methods like PC." }
  ],

  animation: {
    title: "RESIT on Example 45 (paper §4.35): X₁ = N₁, X₃ = N₃, X₂ = X₁ + X₃ + N₂, X₄ = 2X₂ + N₄ (true DAG X₁→X₂, X₃→X₂, X₂→X₄).",
    nodes: [
      { id: "X1", x: 0.10, y: 0.20 },
      { id: "X3", x: 0.10, y: 0.80 },
      { id: "X2", x: 0.55, y: 0.50 },
      { id: "X4", x: 0.92, y: 0.50 }
    ],
    edges: [],
    steps: [
      { caption: "<b>The data.</b> Four variables follow an additive-noise model with mutually independent noise: X₁ = N₁, X₃ = N₃, X₂ = X₁ + X₃ + N₂, X₄ = 2X₂ + N₄. We only observe samples — the structure is hidden. RESIT will recover it from residual-independence asymmetry.", ops: [{ op: "badge", text: "additive-noise model", kind: "info" }, { op: "highlightNodes", ids: ["X1", "X2", "X3", "X4"], cls: "hl" }] },
      { caption: "<b>The key idea.</b> Regress a true SINK on everything else and the residual is just its own noise — independent of the inputs. Regress the wrong way and a tell-tale dependence remains. That asymmetry reveals direction. <b>Phase 1</b> uses it to find a causal order.", ops: [{ op: "badge", text: "residual independent ⇒ sink", kind: "good" }] },
      { caption: "<b>Phase 1, test X₁ as sink.</b> Regress X₁ on the others; e.g. regressing X₁ on X₂ leaves residual X₁ − ⅓X₂, which is still <i>dependent</i> on X₂ (it contains X₁). The test below reads as: residual of X₁ vs regressor X₂ → dependent. X₁ is not the sink.", ops: [{ op: "highlightNodes", ids: ["X1"], cls: "cand" }, { op: "testCI", x: "X1", y: "X2", z: ["X3", "X4"], result: "dep" }, { op: "badge", text: "X₁ residual: dependent", kind: "warn" }] },
      { caption: "<b>Test X₂ as sink.</b> Regressing X₂ on X₄ leaves residual X₂ − 6⁄13·X₄, dependent on X₄ (X₄ is X₂'s child, not a clean predictor). Test: residual of X₂ vs regressor X₄ → dependent. X₂ is not the sink.", ops: [{ op: "highlightNodes", ids: ["X2"], cls: "cand" }, { op: "testCI", x: "X2", y: "X4", z: ["X1", "X3"], result: "dep" }, { op: "badge", text: "X₂ residual: dependent", kind: "warn" }] },
      { caption: "<b>Test X₃ as sink.</b> Regressing X₃ on X₄ leaves residual X₃ − 2⁄13·X₄, dependent on X₄. Test: residual of X₃ vs regressor X₄ → dependent. X₃ is not the sink.", ops: [{ op: "highlightNodes", ids: ["X3"], cls: "cand" }, { op: "testCI", x: "X3", y: "X4", z: ["X1", "X2"], result: "dep" }, { op: "badge", text: "X₃ residual: dependent", kind: "warn" }] },
      { caption: "<b>Test X₄ as sink.</b> Regress X₄ on the rest: residual X₄ − 2X₂ = N₄, independent of X₂ (N₄ is exogenous), and X₄−2X₁, X₄−2X₃ are independent of X₁, X₃. Test: residual of X₄ vs regressor X₂ → independent. X₄'s residual is independent of <i>all</i> regressors — X₄ is the SINK.", ops: [{ op: "highlightNodes", ids: ["X4"], cls: "sink" }, { op: "testCI", x: "X4", y: "X2", z: ["X1", "X3"], result: "indep" }, { op: "score", text: "X₄ residual = N₄ ⫫ inputs" }, { op: "badge", text: "X₄ is a sink (last)", kind: "good" }] },
      { caption: "<b>Record and remove X₄.</b> Prepend X₄ to the causal order (it is causally last) and drop it from the pool. Recurse on {X₁, X₂, X₃} to find the next sink.", ops: [{ op: "set", name: "Causal order (sinks)", items: ["X4"] }, { op: "highlightNodes", ids: ["X4"], cls: "removed" }] },
      { caption: "<b>Recurse on {X₁,X₂,X₃}.</b> Now regress each remaining variable on the other two. X₂ is the sink of this subset: regressing X₂ on X₁ and X₃ leaves residual N₂, independent of X₁ and X₃; X₁ and X₃ still show leftover dependence. Record X₂.", ops: [{ op: "highlightNodes", ids: ["X2"], cls: "sink" }, { op: "testCI", x: "X2", y: "X1", z: ["X3"], result: "indep" }, { op: "set", name: "Causal order (sinks)", items: ["X2", "X4"] }, { op: "badge", text: "X₂ is next sink", kind: "good" }] },
      { caption: "<b>Recurse on {X₁,X₃}.</b> Both are independent sources (X₁ = N₁, X₃ = N₃), so each regressed on the other gives an independent residual. RESIT records the order among them (here X₁ ≺ X₃), completing the full causal order X₁ ≺ X₃ ≺ X₂ ≺ X₄.", ops: [{ op: "set", name: "Causal order (sinks)", items: ["X3", "X2", "X4"] }, { op: "set", name: "Causal order (sinks)", items: ["X1", "X3", "X2", "X4"] }, { op: "badge", text: "order: X₁ ≺ X₃ ≺ X₂ ≺ X₄", kind: "good" }] },
      { caption: "<b>Phase 2 — tentative parents from the order.</b> Each variable gets every earlier variable as a candidate parent: X₂ ← {X₁,X₃}, X₄ ← {X₁,X₃,X₂}. Draw these directed edges respecting the order.", ops: [{ op: "addEdge", from: "X1", to: "X2", type: "directed" }, { op: "addEdge", from: "X3", to: "X2", type: "directed" }, { op: "addEdge", from: "X1", to: "X4", type: "directed" }, { op: "addEdge", from: "X3", to: "X4", type: "directed" }, { op: "addEdge", from: "X2", to: "X4", type: "directed" }, { op: "badge", text: "candidate parents = earlier in π", kind: "info" }] },
      { caption: "<b>Prune unnecessary parents.</b> For X₄, drop candidate parent X₁: refit X₄ on {X₃,X₂}; the residual stays independent (X₄ depends on X₁ only through X₂). So X₁→X₄ is unneeded — remove it. By the same test X₃→X₄ is also dropped.", ops: [{ op: "highlightEdges", edges: [["X1", "X4"], ["X3", "X4"]], cls: "prune" }, { op: "testCI", x: "X4", y: "X1", z: ["X2", "X3"], result: "indep" }, { op: "removeEdge", from: "X1", to: "X4" }, { op: "removeEdge", from: "X3", to: "X4" }, { op: "badge", text: "prune redundant parents", kind: "warn" }] },
      { caption: "<b>Result — the full DAG.</b> X₁ → X₂, X₃ → X₂, X₂ → X₄, every edge directed, matching the generating mechanism. RESIT returns a <i>unique</i> oriented DAG (not a CPDAG) under the additive-noise assumption.", ops: [{ op: "highlightEdges", edges: [["X1", "X2"], ["X3", "X2"], ["X2", "X4"]] }, { op: "badge", text: "fully-directed DAG (not a CPDAG)", kind: "good" }] }
    ]
  },

  complexity: "Phase 1 does, at each of p rounds, one regression-plus-independence-test per remaining variable — on the order of p² regressions overall — and Phase 2 does one refit-and-test per candidate parent. Cost is dominated by the chosen regressor and the (often kernel-based, e.g. HSIC) independence test, which scale with sample size.",
  strengths: [
    "Identifies the <b>full DAG</b> — a single oriented graph — rather than only an equivalence class (CPDAG).",
    "Handles <b>nonlinear</b> mechanisms through a flexible regressor (e.g. Gaussian-process or nonparametric regression).",
    "Conceptually clean: direction comes from a single, interpretable signal — residual independence."
  ],
  limitations: [
    "Relies on the additive-noise assumption; if mechanisms are not of the form f(parents)+independent noise, identifiability can fail.",
    "Accuracy hinges on the regressor (must capture the true nonlinear mechanism) and on a reliable, often expensive, nonparametric independence test.",
    "Assumes causal sufficiency (no hidden confounders) and acyclicity; errors in early sink choices can propagate through the order."
  ],
  notes: "Theorem 18 (consistency): under a restricted additive-noise model with i.i.d. data, RESIT with consistent regression and independence test recovers the true DAG in probability. Theorem 19 (oracle correctness): with an oracle regressor and an oracle independence test, RESIT returns exactly the true DAG. For independence testing the Hilbert–Schmidt Independence Criterion (HSIC) is a common nonparametric choice; Gaussian-process regression is a common flexible regressor. Related work (Peters et al. and others) extends RESIT to discrete data, streaming features, divide-and-conquer partitioning, and score-Jacobian variants.",
  figureRefs: "Paper §4.35 (pp.175–177): Algorithm 26 (RESIT — iterative sink selection then parent pruning), Theorem 18 (consistency), Theorem 19 (oracle correctness), Example 45 (four-variable worked example X₁=N₁, X₃=N₃, X₂=X₁+X₃+N₂, X₄=2X₂+N₄)."
};
