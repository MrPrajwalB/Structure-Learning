/* LIIDM — Linear structural equation model with IID noise Model. Grounded in §4.48 (pp.230-232, ref [711]).
   Identifiability = Lemma 12 (minimum-entropy exogenous variable) + Lemma 13 (regression removal),
   built on the Entropy Power Inequality (EPI, Recall 61); pseudocode = Algorithm 60;
   worked example = Example 67 (three-variable SEM). LIIDM-ME = measurement-error variant. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["liidm"] = {
  name: "LIIDM (Linear structural equation model with IID noise Model)",
  oneLiner: "Model each variable as a linear mix of its parents plus its own independent noise; then repeatedly find the exogenous variable as the one with the smallest differential entropy, regress its effect out of the others, and peel off variables one by one to recover the full causal order and edge weights.",
  basedOnText: "LIIDM is a tagged SCM + constraint method (linear SEM, identifiability via an information-theoretic independence criterion). Its distinctive idea: among the current variables an exogenous one is a single independent noise, whereas every non-exogenous variable is a linear mixture of several independent noises — and by the Entropy Power Inequality a mixture has strictly larger differential entropy. So minimum entropy pinpoints the next exogenous variable.",

  assumptions: [
    "<b>Linear SEM</b> — each variable equals a weighted sum of its parents plus its own noise: X = B X + N, with B the coefficient matrix.",
    "<b>Acyclicity</b> — the true graph is a DAG, so the variables admit a causal order under which B is strictly lower-triangular.",
    "<b>Mutually independent noises</b> — the disturbances N = (N₁,…,N_p) are independent of one another (they act as the independent 'sources').",
    "<b>Nondegenerate, absolutely-continuous noise</b> — each noise term has a density (finite differential entropy), so the Entropy Power Inequality applies with strict inequality for genuine mixtures.",
    "<b>Optional measurement error (LIIDM-ME)</b> — the observed measurements may be the true variables plus i.i.d. additive noise, X̂ = X + E, with E independent of X. The same procedure applies."
  ],
  input: "A dataset 𝒟 over variables V = {X₁,…,X_p} (or noisy measurements X̂ in the LIIDM-ME variant) and a differential-entropy estimator.",
  output: "A <b>fully-directed DAG</b>: a causal order K = (k₁,…,k_p) and an estimated strictly-lower-triangular coefficient matrix B̂ giving every edge direction and weight — not just an equivalence class.",

  idea: [
    "LIIDM assumes a <b>linear structural equation model with i.i.d. noise</b>: <b>X = B X + N</b>, where B holds the connection strengths and N is a vector of mutually independent noise terms. Because the graph is acyclic, the variables can be put in a causal order under which B is strictly lower-triangular — each variable is then a linear mixture of its parents plus its own private noise.",
    "The identifying insight is information-theoretic. An <b>exogenous</b> variable (one with no parents) equals a <i>single</i> noise term, up to scaling. Any <b>non-exogenous</b> variable is a linear combination of <i>several</i> independent noises. The <b>Entropy Power Inequality (EPI)</b> says that mixing independent components strictly increases differential entropy. Hence (Lemma 12) the variable with the <b>minimum differential entropy</b> among the current set is the exogenous one — this is the criterion that breaks Markov equivalence and orients edges.",
    "Once the exogenous variable X_e is found, LIIDM removes its influence by <b>linear regression</b> (Lemma 13): for every other variable it subtracts the part explained by X_e, forming residuals X_k − cov(X_k,X_e)/Var(X_e)·X_e. The residuals follow a linear SEM <i>of the same form</i> on the remaining variables, with the causal order unchanged — so the same minimum-entropy test can be applied again.",
    "Alternating these two operations — <i>identify the exogenous variable by minimum entropy</i>, then <i>regress it out</i> — peels the variables off one at a time and builds the causal order K. Finally, each variable is regressed on its predecessors in K to estimate the coefficients of B. The measurement-error version (LIIDM-ME) works identically when the observations are corrupted by independent i.i.d. additive noise."
  ],

  steps: [
    "<b>Initialise.</b> Set the working set R to all variables {X₁,…,X_p} (the noisy measurements X̂ in the LIIDM-ME case) and the causal order K to empty.",
    "<b>Estimate entropies.</b> For every variable still in R, estimate its differential entropy h(R_j).",
    "<b>Identify the exogenous variable (the key step).</b> Pick e = argminⱼ h(R_j): the variable with the smallest differential entropy. By the Entropy Power Inequality it must be a single noise — i.e. exogenous — because any mixture of independent noises would have strictly larger entropy. Append e to the causal order K.",
    "<b>Regression removal.</b> For each remaining variable X_k (k ≠ e), subtract the part explained by the exogenous variable: X_k ← X_k − (cov(X_k,X_e)/Var(X_e))·X_e. The residuals obey a linear SEM of the same form, with the causal order preserved.",
    "<b>Remove and repeat.</b> Drop the exogenous variable from R and return to step 2. Each pass appends one more variable to K, until all p variables are ordered.",
    "<b>Recover the coefficient matrix.</b> Following the learned order K, regress each variable on its predecessors only (X_{kᵢ} on {X_{k₁},…,X_{kᵢ₋₁}}); the regression coefficients fill the strictly-lower-triangular B̂ (entries for non-predecessors are 0).",
    "<b>Return</b> the causal order K and the coefficient matrix B̂ — a fully-oriented, weighted DAG."
  ],

  keyConcepts: [
    { term: "Linear SEM with i.i.d. noise", def: "The generative model X = B X + N: every variable is a weighted sum of its parents plus its own mutually-independent noise. Acyclicity makes B strictly lower-triangular under the causal order." },
    { term: "Exogenous variable", def: "A variable with no parents (Pa = ∅). It equals a single noise term up to scaling, so it is the 'source' LIIDM peels off first at each iteration." },
    { term: "Differential entropy h(X)", def: "The continuous analogue of Shannon entropy, h(X) = −∫ f(x) log f(x) dx. It is the score LIIDM minimises to find the exogenous variable; it obeys the affine rule h(aX) = h(X) + log|a|." },
    { term: "Entropy Power Inequality (EPI)", def: "For independent U,V, exp(2h(U+V)/d) ≥ exp(2h(U)/d) + exp(2h(V)/d), so h(U+V) ≥ max{h(U),h(V)} with strict inequality unless degenerate. This is why a mixture of noises has strictly larger entropy than a single noise — the engine of identifiability." },
    { term: "Minimum-entropy criterion (Lemma 12)", def: "Among the current variables, the exogenous one has strictly smaller differential entropy than any non-exogenous (mixture) variable. Minimum entropy therefore identifies the next exogenous variable." },
    { term: "Regression removal (Lemma 13)", def: "Replacing each X_k by the residual X_k − cov(X_k,X_e)/Var(X_e)·X_e removes the exogenous variable's influence; the residuals form a smaller linear SEM of the same type with the causal order unchanged." },
    { term: "LIIDM-ME (measurement error)", def: "The variant for observations corrupted by independent i.i.d. additive noise, X̂ = X + E. The same minimum-entropy ordering property holds, so the same algorithm recovers the structure." }
  ],

  animation: {
    title: "LIIDM on Example 67 (paper §4.48): X₁ = N₁, X₂ = 0.8 X₁ + N₂, X₃ = 0.5 X₁ + 0.6 X₂ + N₃ (Var N₁ = 1).",
    nodes: [
      { id: "X1", x: 0.12, y: 0.5 },
      { id: "X2", x: 0.5, y: 0.14 },
      { id: "X3", x: 0.88, y: 0.5 }
    ],
    edges: [],
    steps: [
      { caption: "<b>The model.</b> Three variables follow a linear SEM with mutually independent noise: X₁ = N₁ (pure noise), X₂ = 0.8 X₁ + N₂, X₃ = 0.5 X₁ + 0.6 X₂ + N₃. We only see samples; the structure and order are hidden.", ops: [{ op: "badge", text: "linear SEM, X = B X + N", kind: "info" }, { op: "highlightNodes", ids: ["X1", "X2", "X3"], cls: "hl" }] },
      { caption: "<b>The identifiability idea (EPI).</b> An exogenous variable is a single independent noise; a non-exogenous one is a <i>mixture</i> of several noises. By the Entropy Power Inequality, mixing strictly raises differential entropy — so the minimum-entropy variable must be exogenous.", ops: [{ op: "badge", text: "min entropy ⇒ exogenous", kind: "good" }] },
      { caption: "<b>Iteration 1 — score entropies.</b> X₁ = N₁ is pure noise, so it has the smallest differential entropy. X₂ and X₃ are mixtures (they contain X₁'s contribution), so their entropy is strictly larger.", ops: [{ op: "set", name: "Working set R", items: ["X1", "X2", "X3"] }, { op: "score", text: "h(X1) < h(X2), h(X3)" }, { op: "highlightNodes", ids: ["X1"], cls: "test" }] },
      { caption: "<b>Iteration 1 — pick exogenous.</b> e = argmin h = X₁. It has no parents, so append it to the causal order: K = [1, …].", ops: [{ op: "set", name: "Causal order K", items: ["X1"] }, { op: "badge", text: "exogenous = X1", kind: "good" }, { op: "highlightNodes", ids: ["X1"], cls: "hl" }] },
      { caption: "<b>Iteration 1 — regression removal.</b> Subtract X₁'s influence from the rest using cov/Var. With cov(X₂,X₁)=0.8 and cov(X₃,X₁)=0.98 (Var X₁ = 1): X₂′ = X₂ − 0.8 X₁ = N₂, and X₃′ = X₃ − 0.98 X₁ = 0.6 X₂′ + N₃.", ops: [{ op: "badge", text: "X_k ← X_k − cov(X_k,X1)/Var(X1)·X1", kind: "info" }, { op: "highlightNodes", ids: ["X2", "X3"], cls: "test" }] },
      { caption: "<b>Iteration 2 — score the residuals.</b> Remove X₁ from R. Now X₂′ = N₂ is pure noise (minimum entropy) while X₃′ = 0.6 X₂′ + N₃ is still a mixture. So X₂ is the next exogenous variable.", ops: [{ op: "set", name: "Working set R", items: ["X2", "X3"] }, { op: "score", text: "h(X2′) < h(X3′)" }, { op: "highlightNodes", ids: ["X2"], cls: "test" }] },
      { caption: "<b>Iteration 2 — append and remove.</b> Append X₂ to the order: K = [1, 2, …]. Regress X₂'s effect out of X₃′: X₃″ = X₃′ − (cov(X₃′,X₂′)/Var X₂′)·X₂′ = N₃. Then drop X₂.", ops: [{ op: "set", name: "Causal order K", items: ["X1", "X2"] }, { op: "badge", text: "exogenous = X2", kind: "good" }, { op: "highlightNodes", ids: ["X2"], cls: "hl" }] },
      { caption: "<b>Iteration 3 — last variable.</b> Only X₃ remains; it is appended last. The full causal order is recovered: K = [1, 2, 3].", ops: [{ op: "set", name: "Causal order K", items: ["X1", "X2", "X3"] }, { op: "badge", text: "order K = [1, 2, 3]", kind: "good" }, { op: "highlightNodes", ids: ["X3"], cls: "hl" }] },
      { caption: "<b>Recover B — regress on predecessors (X₂).</b> Following K, regress X₂ on its only predecessor {X₁}: the coefficient is β̂₂₁ = 0.8 → add the edge X₁ → X₂ with weight 0.8.", ops: [{ op: "addEdge", from: "X1", to: "X2", type: "directed" }, { op: "highlightNodes", ids: ["X1", "X2"], cls: "hl" }, { op: "score", text: "β̂₂₁ = 0.8" }] },
      { caption: "<b>Recover B — regress X₃ on {X₁, X₂}.</b> The fitted coefficients are β̂₃₁ = 0.5 and β̂₃₂ = 0.6 → add X₁ → X₃ (weight 0.5) and X₂ → X₃ (weight 0.6).", ops: [{ op: "addEdge", from: "X1", to: "X3", type: "directed" }, { op: "addEdge", from: "X2", to: "X3", type: "directed" }, { op: "highlightNodes", ids: ["X1", "X2", "X3"], cls: "hl" }, { op: "score", text: "β̂₃₁ = 0.5,  β̂₃₂ = 0.6" }] },
      { caption: "<b>The estimated matrix.</b> Collecting the coefficients gives B̂ with rows [0,0,0], [0.8,0,0], [0.5,0.6,0] — strictly lower-triangular under K and coinciding with the true B in the model.", ops: [{ op: "badge", text: "B̂ = true B (lower-triangular)", kind: "good" }, { op: "highlightEdges", edges: [["X1", "X2"], ["X1", "X3"], ["X2", "X3"]] }] },
      { caption: "<b>Result — the full DAG.</b> X₁ → X₂, X₁ → X₃, X₂ → X₃, every edge directed and weighted. LIIDM returns a <i>unique</i> oriented, weighted DAG, recovered purely from the minimum-entropy + regression-removal procedure.", ops: [{ op: "badge", text: "fully-directed weighted DAG", kind: "good" }, { op: "highlightEdges", edges: [["X1", "X2"], ["X1", "X3"], ["X2", "X3"]] }] }
    ]
  },

  complexity: "Each of the p iterations estimates a differential entropy for every remaining variable and then performs simple regressions to remove the exogenous variable, so the cost is roughly quadratic in p times the entropy-estimation cost; the final pass fits p regressions on predecessors. Practical on moderate numbers of variables; accuracy hinges on reliable differential-entropy estimation.",
  strengths: [
    "Identifies the <b>full DAG</b> — a unique causal order plus a weighted, strictly-lower-triangular B — not merely an equivalence class.",
    "The identifiability rests on a clean information-theoretic principle (the Entropy Power Inequality): mixtures of independent noises have strictly larger entropy, so minimum entropy reveals the exogenous variable.",
    "Robust to additive measurement error: the LIIDM-ME variant recovers the same structure when observations are corrupted by independent i.i.d. noise."
  ],
  limitations: [
    "Relies on linearity, acyclicity, and mutually-independent, nondegenerate noises; violations can break the strict-entropy ordering and hence identifiability.",
    "Requires estimating differential entropy from finite samples, which is statistically delicate — errors in the entropy ranking propagate to the wrong exogenous pick and cascade through the order.",
    "Assumes the noise terms (and any measurement error) are i.i.d. and independent of the variables; hidden non-additive confounding is outside the model."
  ],
  notes: "Lemma 12 (minimum-entropy exogenous variable): under a linear SEM X = B X + N with acyclic B and i.i.d. noises, an exogenous variable has strictly smaller differential entropy than any non-exogenous (mixture) variable; the same ordering also holds for noisy measurements X̂ = X + E when the E_j are i.i.d. and independent of X. Lemma 13 (regression removal): replacing each X_k by its residual after regressing out an exogenous X_e yields a linear SEM of the same form on the remaining variables with the causal order unchanged. Together these justify the greedy two-phase peel-off in Algorithm 60. The noise-free variant is LIIDM and the measurement-error variant is LIIDM-ME (labels are the survey's shorthand, not author-given).",
  figureRefs: "Paper §4.48 (pp.230–232, ref [711]): Algorithm 60 (LIIDM / LIIDM-ME), Lemma 12 (minimum-entropy exogenous variable), Lemma 13 (regression removal), Recall 61 (differential entropy & the Entropy Power Inequality), Example 67 (three-variable worked example)."
};
