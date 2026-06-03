/* CAMUV — Causal Additive Model with Unobserved Variables (Maeda & Shimizu).
   Grounded in §4.54 (pp.259-263). Model = Def.28 (CAMUV). UCP/UBP = Def.29/30.
   Directed-edge (parent) discovery = Algorithm 67 (sink detection + pruning, two phases).
   Unobserved-confounder detection = Algorithm 68 (UCP/UBP detection -> dashed edges).
   Worked example = Example 76 (X1=N1, X2=f2(X1)+g2(H1)+N2, X3=f3(X1)+f3(X2)+N3,
   X4=f4(X3)+g4(H1)+N4); final parent sets M1=∅, M2={X1}, M3={X1,X2}, M4={X3} with a
   dashed (latent-confounded) edge between X2 and X4; estimated output = Fig.169. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["camuv"] = {
  name: "CAMUV (Causal Additive Model with Unobserved Variables)",
  oneLiner: "Assume each observed variable is a sum of nonlinear functions of its parents plus independent noise, but allow some parents to be UNOBSERVED: regress and test residual independence to find each variable's true observed parents, and whenever two variables stay dependent in a way that no observed conditioning can remove, flag them as sharing a hidden common cause and draw a dashed (bidirected) edge.",
  basedOnText: "CAMUV extends additive-noise causal discovery (the same residual-independence engine as RESIT/CAM) to the realistic setting where some causes are never measured. It returns both the directed edges among observed variables and the pairs whose leftover dependence betrays an unobserved confounder.",

  assumptions: [
    "<b>Causal additive model (CAM)</b> — each variable is a SUM of separate nonlinear functions, one per parent, plus its own independent noise: Xᵢ = Σ fᵢ(parent) + Nᵢ. Each parent contributes through its own smooth function (a generalized additive model), which makes direction identifiable as long as the mechanisms are genuinely nonlinear.",
    "<b>Unobserved variables ALLOWED</b> — this is the key relaxation over CAM/RESIT: a parent may be a hidden variable H. So a variable can be a function of observed parents <i>and</i> latent ones plus noise. Only the observed variables X are seen; the latents H are not.",
    "<b>Mutually independent noise</b> — the noise terms Nᵢ are independent of one another (and of the parents), so a variable's residual, once its true parents are removed, is just its own noise.",
    "<b>Acyclicity</b> — the structure over observed and unobserved variables together is a DAG.",
    "<b>A nonlinear regressor and an independence test</b> — a GAM-style regressor to fit the additive mechanisms, plus a (nonparametric) independence test such as HSIC / p-HSIC to decide residual (in)dependence."
  ],
  input: "I.i.d. samples over the observed variables X = {X₁,…,X_p}, a significance level α, GAM-style regressors, and an independence test (e.g. p-HSIC).",
  output: "<b>Directed edges</b> giving each observed variable's estimated observed parent set Mᵢ, PLUS a set of <b>dashed undirected / bidirected edges</b> marking pairs of observed variables whose dependence persists after regressing on observed parents — evidence of an <b>unobserved common cause</b> (a UCP/UBP). Latents themselves are never drawn, only the pairs they confound.",

  idea: [
    "CAMUV keeps the additive-noise insight — a variable equals nonlinear functions of its parents plus independent noise, so regressing it on its <i>true</i> parents leaves a residual that is independent of those parents — but drops the comfortable assumption that every cause is measured. Some parents may be hidden. The clever part is that a hidden cause leaves a <b>signature</b>: a dependence between two observed variables that <i>no observed conditioning set can remove</i>.",
    "<b>Why latents are detectable.</b> If an unobserved variable H feeds into both Xᵢ and Xⱼ (an <i>unobserved causal path</i> or <i>unobserved backdoor path</i>, UCP/UBP), then even after you regress each on all of its observed parents, their residuals still share the influence of H and stay dependent. You cannot make them independent by conditioning on observed variables, because the thing that links them was never observed. That irreducible dependence is exactly what flags the latent.",
    "<b>Phase 1 — candidate parents by sink detection.</b> CAMUV finds, for each variable, a candidate parent set by repeatedly looking for a <b>sink</b>: a variable whose residual becomes independent of the rest once it is regressed on the others. The sink is recorded and removed, and the search recurses — the same iterative, regress-then-test-independence loop used by RESIT, but adapted to tolerate latents (Algorithm 67, Phase 1).",
    "<b>Phase 1 pruning.</b> The candidate sets over-include parents, so a pruning pass drops any candidate parent whose removal still leaves the residual independent of the kept parents — yielding each variable's minimal observed parent set Mᵢ (Algorithm 67, Phase 2).",
    "<b>Phase 2 — detect unobserved confounders.</b> With the parent sets fixed, CAMUV revisits every pair (Xᵢ, Xⱼ) that is not in each other's parent set. It regresses each on its own observed parents and tests whether the two residuals are independent. If a pair stays <i>dependent</i>, no observed structure explains it — so a hidden common cause must exist. CAMUV records the pair as confounded and draws a dashed/bidirected edge between them (Algorithm 68)."
  ],

  steps: [
    "<b>Initialise.</b> Take i.i.d. samples over the observed variables X, a significance level α, GAM regressors, and an independence test (p-HSIC). Start with empty candidate parent sets.",
    "<b>Phase 1 — candidate extraction by sink detection (Algorithm 67).</b> Among the variables still under consideration, regress each candidate on the others and measure how independent its residual is of those others; the variable whose residual is <i>most independent</i> (independence not rejected at α) is declared a sink, recorded, and removed. Recurse on the smaller set.",
    "<b>Build candidate parent sets.</b> The sink ordering yields, for each variable, an initial candidate parent set (the variables that could causally precede it).",
    "<b>Phase 1 pruning (Algorithm 67, Phase 2).</b> For each variable Xᵢ and each candidate parent Xⱼ: refit Xᵢ on its candidate parents WITHOUT Xⱼ and test the residual. If dropping Xⱼ still leaves the residual independent of the kept parents (p-HSIC &gt; α), Xⱼ was unnecessary — remove it. What survives is the minimal observed parent set Mᵢ.",
    "<b>Lay down directed edges.</b> For every surviving parent Xⱼ ∈ Mᵢ, draw Xⱼ → Xᵢ. These are the estimated observed causal relations.",
    "<b>Phase 2 — UCP/UBP detection (Algorithm 68).</b> For every unordered pair (Xᵢ, Xⱼ) where neither is in the other's parent set, regress Xᵢ on Mᵢ and Xⱼ on Mⱼ to get their residuals.",
    "<b>Test residual independence of the pair.</b> Apply the independence test to the two residuals. If they are still <b>dependent</b> (p-HSIC &lt; α) — i.e. no observed parents can account for their relationship — conclude that an <b>unobserved common cause</b> links them (a UCP/UBP).",
    "<b>Flag the latent-confounded pair.</b> Add (Xᵢ, Xⱼ) to the set of dashed undirected / bidirected edges. The hidden variable itself is not drawn; only the affected pair is marked.",
    "<b>Return</b> the directed edges (observed parent sets {Mᵢ}) together with the dashed edges for every detected unobserved-confounder pair (Fig.169)."
  ],

  keyConcepts: [
    { term: "Causal additive model (CAM)", def: "The generative form Xᵢ = Σ fᵢ(parent) + Nᵢ: each parent acts through its own separate nonlinear (GAM) function and the noises are independent. Nonlinearity of these per-parent functions is what makes edge direction identifiable." },
    { term: "Unobserved / latent variable", def: "A cause that is never measured. CAMUV allows a variable's parents to include such hidden variables — exactly the case CAM and RESIT forbid (they assume causal sufficiency)." },
    { term: "UCP / UBP", def: "Unobserved Causal Path / Unobserved Backdoor Path (Def.29/30). The two ways a hidden variable can connect two observed variables — directly through a latent on the causal path, or through a latent common cause (backdoor). Both leave a dependence that observed conditioning cannot remove." },
    { term: "Residual-independence test", def: "Regress a variable on a candidate set, then test whether the residual is independent of that set. Independence ⇒ the set explains it; leftover dependence ⇒ it does not. CAMUV's per-step decision rule, typically p-HSIC at level α." },
    { term: "Sink detection", def: "Phase 1: repeatedly find the variable whose residual is independent of the others (a sink), record and remove it, recurse. This builds candidate parent sets even with latents present (Algorithm 67)." },
    { term: "Latent-confounded pair (dashed/bidirected edge)", def: "A pair of observed variables whose residuals stay dependent after each is regressed on its observed parents. No observed structure explains them, so a hidden common cause is inferred and drawn as a dashed/bidirected edge (Algorithm 68, Fig.169)." }
  ],

  animation: {
    title: "CAMUV on Example 76 (paper §4.54): X₁=N₁, X₂=f₂(X₁)+g₂(H₁)+N₂, X₃=f₃(X₁)+f₃(X₂)+N₃, X₄=f₄(X₃)+g₄(H₁)+N₄, with a HIDDEN H₁ feeding both X₂ and X₄.",
    nodes: [
      { id: "X1", x: 0.10, y: 0.18 },
      { id: "X2", x: 0.90, y: 0.18 },
      { id: "X3", x: 0.10, y: 0.82 },
      { id: "X4", x: 0.90, y: 0.82 }
    ],
    edges: [],
    steps: [
      { caption: "<b>The data.</b> Four observed variables follow a causal additive model with independent noise — but an UNOBSERVED variable H₁ feeds into both X₂ and X₄. We only see X₁..X₄. CAMUV will recover the directed edges <i>and</i> flag the hidden-confounder pair from residual-independence asymmetry.", ops: [{ op: "badge", text: "additive model + unobserved H₁", kind: "info" }, { op: "highlightNodes", ids: ["X1", "X2", "X3", "X4"], cls: "hl" }] },
      { caption: "<b>The key idea.</b> Regress a variable on its TRUE parents and the residual is just its own noise — independent of those parents. But if a hidden variable links two variables, their residuals stay dependent no matter what observed set you condition on. Phase 1 finds parents; Phase 2 catches the latent.", ops: [{ op: "badge", text: "residual independent ⇒ parents found", kind: "good" }] },
      { caption: "<b>Phase 1 — sink detection.</b> Regress each variable on the others and test residual independence. X₄ is a sink: regressing X₄ on the rest, its residual is independent of X₃ (its observed parent explains it). Record X₄ and recurse. (X₃ similarly resolves to its parents X₁, X₂.)", ops: [{ op: "highlightNodes", ids: ["X4"], cls: "sink" }, { op: "testCI", x: "X4", y: "X3", z: ["X1", "X2"], result: "indep" }, { op: "set", name: "Sinks (Phase 1)", items: ["X4"] }, { op: "badge", text: "X₄ residual ⫫ X₃ ⇒ sink", kind: "good" }] },
      { caption: "<b>Candidate parents → directed edges (X₃).</b> After sink detection and pruning, X₃'s residual is independent of {X₁,X₂} but dependent on them individually, so both are true parents. Draw X₁ → X₃ and X₂ → X₃ (M₃ = {X₁, X₂}).", ops: [{ op: "testCI", x: "X3", y: "X1", z: ["X2"], result: "indep" }, { op: "addEdge", from: "X1", to: "X3", type: "directed" }, { op: "addEdge", from: "X2", to: "X3", type: "directed" }, { op: "set", name: "Parents M₃", items: ["X1", "X2"] }, { op: "badge", text: "M₃ = {X₁, X₂}", kind: "good" }] },
      { caption: "<b>Parent of X₂.</b> Regress X₂ on X₁: the residual is independent of X₁, so X₁ is a true observed parent. Draw X₁ → X₂ (M₂ = {X₁}). Note the residual is NOT pure noise — it still hides the g₂(H₁) term — but X₁ alone is X₂'s only observed parent.", ops: [{ op: "highlightNodes", ids: ["X2"], cls: "cand" }, { op: "testCI", x: "X2", y: "X1", z: [], result: "indep" }, { op: "addEdge", from: "X1", to: "X2", type: "directed" }, { op: "set", name: "Parents M₂", items: ["X1"] }, { op: "badge", text: "M₂ = {X₁}", kind: "good" }] },
      { caption: "<b>Parent of X₄.</b> Regress X₄ on its candidate X₃: residual independent of X₃, so X₃ is X₄'s observed parent. Draw X₃ → X₄ (M₄ = {X₃}). X₁ is the root: M₁ = ∅.", ops: [{ op: "highlightNodes", ids: ["X4"], cls: "cand" }, { op: "testCI", x: "X4", y: "X3", z: [], result: "indep" }, { op: "addEdge", from: "X3", to: "X4", type: "directed" }, { op: "set", name: "Parents M₄", items: ["X3"] }, { op: "set", name: "Parents M₁", items: [] }, { op: "badge", text: "M₄ = {X₃}, M₁ = ∅", kind: "good" }] },
      { caption: "<b>Phase 1 done.</b> Estimated observed parents: M₁=∅, M₂={X₁}, M₃={X₁,X₂}, M₄={X₃}. Directed edges X₁→X₂, X₁→X₃, X₂→X₃, X₃→X₄ are in place. Now Phase 2 checks for hidden common causes among pairs that are not parent–child.", ops: [{ op: "highlightEdges", edges: [["X1", "X2"], ["X1", "X3"], ["X2", "X3"], ["X3", "X4"]], cls: "hl" }, { op: "badge", text: "Phase 1 complete", kind: "good" }] },
      { caption: "<b>Phase 2 — UCP/UBP detection (Algorithm 68).</b> Take a non-parent–child pair, e.g. (X₁, X₄). Regress X₁ on M₁ and X₄ on M₄, then test their residuals. They are INDEPENDENT — X₁ influences X₄ only through the observed chain X₁→…→X₃→X₄, so no hidden link. No dashed edge.", ops: [{ op: "highlightNodes", ids: ["X1", "X4"], cls: "cand" }, { op: "testCI", x: "X1", y: "X4", z: [], result: "indep" }, { op: "badge", text: "(X₁,X₄) residuals ⫫ ⇒ no latent", kind: "info" }] },
      { caption: "<b>Phase 2 — the telling pair (X₂, X₄).</b> Regress X₂ on M₂={X₁} and X₄ on M₄={X₃}, then test the two residuals. They stay DEPENDENT — and no observed set can remove it, because the shared influence is the unobserved H₁ (which enters both via g₂(H₁) and g₄(H₁)).", ops: [{ op: "highlightNodes", ids: ["X2", "X4"], cls: "hl" }, { op: "testCI", x: "X2", y: "X4", z: [], result: "dep" }, { op: "badge", text: "residuals stay dependent — no observed parent explains it", kind: "bad" }] },
      { caption: "<b>Flag the unobserved confounder.</b> Irreducible residual dependence with no observed explanation means a HIDDEN common cause links X₂ and X₄. CAMUV records the pair and draws a dashed / bidirected edge X₂ ⇠⇢ X₄. The latent H₁ itself is never drawn — only the pair it confounds.", ops: [{ op: "addEdge", from: "X2", to: "X4", type: "bidirected" }, { op: "highlightEdges", edges: [["X2", "X4"]], cls: "hl" }, { op: "badge", text: "unobserved common cause: X₂ ⇠⇢ X₄", kind: "bad" }] },
      { caption: "<b>Result (Fig.169).</b> Directed edges X₁→X₂, X₁→X₃, X₂→X₃, X₃→X₄ give the observed causal structure; the dashed edge X₂ ⇠⇢ X₄ marks the pair confounded by the unobserved H₁. CAMUV reports BOTH — causal directions among observed variables and the latent-confounded pair.", ops: [{ op: "highlightEdges", edges: [["X1", "X2"], ["X1", "X3"], ["X2", "X3"], ["X3", "X4"], ["X2", "X4"]] }, { op: "badge", text: "directed edges + latent-confounded pair", kind: "good" }] }
    ]
  },

  complexity: "Phase 1 mirrors sink-detection causal discovery: at each round one GAM regression plus an independence test per remaining variable, on the order of p² regressions overall, followed by a refit-and-test per candidate parent for pruning. Phase 2 adds one regression-pair-and-test per non-parent–child pair, up to O(p²) extra tests. Cost is dominated by the GAM regressor and the kernel-based (p-HSIC) independence test, which scale with sample size.",
  strengths: [
    "Drops causal sufficiency — it learns directed edges among observed variables even when some causes are <b>unobserved</b>, the case that breaks CAM/RESIT.",
    "Explicitly <b>detects and flags hidden-confounder pairs</b> (UCP/UBP) instead of silently mis-reporting a direct cause.",
    "Handles <b>nonlinear</b> additive mechanisms through GAM regression, identifying directions rather than only an equivalence class."
  ],
  limitations: [
    "Relies on the causal additive (per-parent nonlinear) form with independent noise; if mechanisms are not additive or not genuinely nonlinear, identifiability can fail.",
    "Accuracy hinges on the GAM regressor capturing the true mechanism and on a reliable, often expensive, nonparametric independence test (p-HSIC) and a chosen significance level α.",
    "It marks <i>which pairs</i> share a hidden cause but does not reconstruct the latent variable itself or its full role; many such tests across pairs can compound errors."
  ],
  notes: "CAMUV is due to Maeda & Shimizu (paper ref [447]). It sits in the additive-noise family alongside CAM and RESIT: those assume causal sufficiency and return a fully-directed DAG, whereas CAMUV relaxes that assumption and additionally outputs dashed edges for latent-confounded pairs. The two phases are split across Algorithm 67 (directed edges via sink detection then pruning) and Algorithm 68 (UCP/UBP detection via residual-independence over parent sets). HSIC / p-HSIC (Recall 69) is the independence criterion and GAM (Recall 70) the regressor; identifiability rests on the asymmetry that an additive nonlinear mechanism cannot be inverted into another additive mechanism (CAM-UV uniqueness).",
  figureRefs: "Paper §4.54 (pp.259–263): Def.28 (CAMUV model), Def.29/30 (UCP / UBP, unobserved causal & backdoor paths), Assumptions 1–3 and Lemmas 19–21 (residual-independence detection of latents), Algorithm 67 (CAMUV directed-edge / parent discovery — sink detection then pruning), Algorithm 68 (CAMUV UCP/UBP detection — dashed edges), Example 76 (four-variable worked example with hidden H₁; parent sets M₁=∅, M₂={X₁}, M₃={X₁,X₂}, M₄={X₃}), Fig.169 (estimated CAMUV output: directed edges plus a dashed X₂–X₄ confounded pair)."
};
