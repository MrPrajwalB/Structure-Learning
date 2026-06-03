/* TPDA — Three-Phase Dependency Analysis. Grounded in §4.10 (pp.71-76):
   Algorithm 14 (TPDA), three phases Drafting/Thickening/Thinning, Definition 8
   (Monotone DAG Faithfulness), Proposition 4 (MDF pruning rule),
   worked Example 19 on {M,D,B,C,V} (Figs. 36-42). */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["tpda"] = {
  name: "Three-Phase Dependency Algorithm (TPDA)",
  oneLiner: "Build the undirected skeleton in three passes — draft a tree from the strongest dependencies, thicken it by adding edges for pairs that stay dependent given the current separating path, thin it by deleting edges for pairs that turn independent given some conditioning set — then orient PC-style.",
  basedOnText: "TPDA is an information-theoretic constraint-based method: it uses conditional mutual information (CMI) as its quantitative test of dependence, and exploits the assumption that opening more paths never lowers dependence to prune conditioning sets and so run far fewer CI tests than an exhaustive search.",

  assumptions: [
    "<b>Monotone DAG Faithfulness (MDF)</b> — the special assumption TPDA relies on (Definition 8): opening more active trails between two variables never <i>decreases</i> their conditional mutual information. This is what lets TPDA grow and shrink conditioning sets monotonically. It is stronger than ordinary faithfulness and may fail for some graphs, so in practice TPDA is best seen as an effective approximate method.",
    "<b>Causal sufficiency</b> — every common cause is observed (no hidden confounders).",
    "<b>Reliable CMI estimates</b> — dependence is judged by conditional mutual information estimated from the data and compared to a threshold ε."
  ],
  input: "A dataset over variables V, a conditional-mutual-information estimator Î(·;·|·), and a threshold ε > 0.",
  output: "A DAG / CPDAG: the undirected skeleton found by the three phases, then oriented PC-style (v-structures from the recorded separating sets, followed by Meek's rules).",

  idea: [
    "TPDA measures dependence with <b>mutual information</b> — informally, how much knowing one variable reduces our uncertainty about another — and its conditional version <b>CMI</b>, I(X;Y|Z), which asks the same thing <i>after we already know Z</i>. A pair with high CMI is dependent; a pair whose CMI drops near zero given some set Z is (conditionally) independent and need not be directly connected.",
    "The key intuition is about <i>information flow</i> along paths. Conditioning on a non-collider on a path tends to <b>block</b> the path (reducing dependence), while conditioning on a collider or its descendants tends to <b>open</b> a path (increasing dependence). Under Monotone DAG Faithfulness this trend is monotone, which lets TPDA prune most candidate conditioning sets instead of testing every subset.",
    "It works in three phases over the undirected graph. <b>(1) Drafting:</b> compute pairwise mutual information, sort pairs from strongest to weakest, and lay down edges for the strongest pairs — skipping a pair if a path between them already exists — producing a tree-like draft. <b>(2) Thickening:</b> for pairs that are <i>not</i> yet adjacent but are still dependent once we condition on a separator drawn from the current connecting path, add the missing edge. <b>(3) Thinning:</b> revisit every existing edge and, if its endpoints become independent given some conditioning set, delete it as redundant.",
    "Finally the recorded separating sets are used to find v-structures, and Meek's rules propagate the remaining orientations — exactly as in PC."
  ],

  steps: [
    "<b>Initialise.</b> Start with an empty graph H and an empty separator map Sep. Choose threshold ε.",
    "<b>Phase 1 — Drafting (MI forest).</b> Compute the pairwise mutual information Î(X;Y) for all pairs and sort them in decreasing order.",
    "<b>Drafting, continued.</b> Walk down the sorted list. For each pair (X,Y) with Î(X;Y) > ε: if no open path already joins X and Y in H, add the edge X–Y. This greedily lays down the strongest dependencies as a tree-like draft and skips pairs whose dependence is already explained by an existing path.",
    "<b>Phase 2 — Thickening (add indispensable edges).</b> For each non-adjacent pair (X,Y) with Î(X;Y) > ε, collect the variables A that lie on the current X⇝Y paths in H as a candidate separator U.",
    "<b>Thickening test.</b> Try to shrink U: increasing |U|, test Î(X;Y|U) ≤ ε. If some subset makes them independent, record Sep(X,Y)=U and leave them disconnected; otherwise (they stay dependent however we condition) add the edge X–Y as indispensable.",
    "<b>Thickening, MDF pruning.</b> Use the monotonicity shortcut (Proposition 4): whenever Î(X;Y|U∪{Z}) ≥ Î(X;Y|U), no superset of U that contains Z can ever separate the pair, so all those supersets are pruned from the search.",
    "<b>Phase 3 — Thinning (remove redundant edges).</b> Revisit every edge X–Y already in H. Let A be the neighbours of X or Y on the current X⇝Y paths, and search subsets U ⊆ A for one with Î(X;Y|U) ≤ ε.",
    "<b>Thinning, continued.</b> If such a separator is found, the edge is redundant: remove X–Y and set Sep(X,Y)=U. What remains is the final skeleton.",
    "<b>Orient v-structures.</b> For each unshielded triple X−Z−Y (X,Y non-adjacent): if Z is NOT in Sep(X,Y), orient the collider X → Z ← Y.",
    "<b>Propagate with Meek's rules</b> until no more edges can be oriented, then return the resulting (C)PDAG."
  ],

  keyConcepts: [
    { term: "Mutual information (MI)", def: "A measure of how much knowing one variable reduces uncertainty about another. MI = 0 means independent; larger MI means a stronger dependence. TPDA's drafting phase ranks edges by MI." },
    { term: "Conditional mutual information (CMI)", def: "The same idea after conditioning on a set Z: I(X;Y|Z) asks how much X and Y still inform each other once Z is known. CMI near zero (≤ ε) is TPDA's conditional-independence test." },
    { term: "Threshold ε", def: "The cutoff below which an (conditional) MI value is treated as 'no dependence'. It plays the role of a significance level in a classic CI test." },
    { term: "Information flow / blocking vs opening", def: "Conditioning on a non-collider blocks a path and lowers CMI; conditioning on a collider or its descendants opens a path and raises CMI. TPDA reasons about edges in these terms." },
    { term: "Monotone DAG Faithfulness (MDF)", def: "TPDA's special assumption (Def. 8): opening more active trails never reduces CMI. This monotonicity is what makes the conditioning-set search prunable and the algorithm exact." },
    { term: "MDF pruning (Proposition 4)", def: "If adding Z to the conditioning set U does not lower the CMI, then no larger set containing Z can separate the pair — so those candidate separators are skipped, saving many CMI tests." },
    { term: "Separating set Sep(X,Y)", def: "The conditioning set that drove a pair's CMI below ε and kept (or made) them disconnected. As in PC, it decides whether a triple is a collider during orientation." }
  ],

  animation: {
    title: "TPDA running on the paper's five-variable example {M,D,B,C,V} (Example 19, Figs. 36-42).",
    nodes: [
      { id: "M", x: 0.22, y: 0.10 },
      { id: "D", x: 0.78, y: 0.10 },
      { id: "C", x: 0.18, y: 0.55 },
      { id: "B", x: 0.82, y: 0.55 },
      { id: "V", x: 0.50, y: 0.94 }
    ],
    edges: [],
    steps: [
      { caption: "<b>Phase 1 — Drafting.</b> Compute pairwise mutual information for every pair and sort it in decreasing order. The strongest pair is M–C (MI = 0.43); since nothing connects them yet, add that edge first.", ops: [{ op: "badge", text: "PHASE 1 · DRAFTING", kind: "info" }, { op: "score", text: "MI(M;C)=0.43 (strongest)" }, { op: "addEdge", from: "M", to: "C", type: "undirected" }] },
      { caption: "<b>Drafting.</b> Continue down the MI-ordered list. The next strong pairs with no existing connecting path get edges: C–B (MI = 0.27) and C–V (MI = 0.25).", ops: [{ op: "badge", text: "PHASE 1 · DRAFTING", kind: "info" }, { op: "score", text: "MI(C;B)=0.27, MI(C;V)=0.25" }, { op: "addEdge", from: "C", to: "B", type: "undirected" }, { op: "addEdge", from: "C", to: "V", type: "undirected" }] },
      { caption: "<b>Drafting.</b> Add the remaining strong pairs that are not yet path-connected: M–D and B–D. Pairs such as M–B and D–V are <i>skipped</i> here because a path between them already exists. The draft is now a tree-like skeleton.", ops: [{ op: "badge", text: "PHASE 1 · DRAFTING", kind: "info" }, { op: "addEdge", from: "M", to: "D", type: "undirected" }, { op: "addEdge", from: "B", to: "D", type: "undirected" }, { op: "highlightNodes", ids: ["M","B"], cls: "hl" }] },
      { caption: "<b>Phase 2 — Thickening.</b> Look at non-adjacent but still-dependent pairs. For B and V, the only relevant separator on the connecting path is C. Test the CMI conditioning on C.", ops: [{ op: "badge", text: "PHASE 2 · THICKENING", kind: "warn" }, { op: "set", name: "U", items: ["C"] }, { op: "testCI", x: "B", y: "V", z: ["C"], result: "dep" }, { op: "score", text: "I(B;V|C)=0.24 > ε" }] },
      { caption: "<b>Thickening.</b> B and V stay dependent given C (CMI 0.24 > ε) — no separator can screen them off — so the edge B–V is indispensable. Add it.", ops: [{ op: "badge", text: "PHASE 2 · THICKENING", kind: "warn" }, { op: "addEdge", from: "B", to: "V", type: "undirected" }, { op: "clearSet", name: "U" }] },
      { caption: "<b>Thickening.</b> Now test D and V. Conditioning on just C leaves them dependent, but expanding the separator to {C,M} along the path drops the CMI below ε.", ops: [{ op: "badge", text: "PHASE 2 · THICKENING", kind: "warn" }, { op: "set", name: "U", items: ["C","M"] }, { op: "testCI", x: "D", y: "V", z: ["C","M"], result: "indep" }, { op: "score", text: "I(D;V|C,M)=0.09 ≤ ε" }] },
      { caption: "<b>Thickening.</b> A separator {C,M} exists for D and V, so the pair does <i>not</i> need a direct edge. Record Sep(D,V)={C,M} and add nothing. Thickening is done.", ops: [{ op: "badge", text: "PHASE 2 · THICKENING", kind: "warn" }, { op: "clearSet", name: "U" }, { op: "highlightNodes", ids: ["D","V"], cls: "hl" }] },
      { caption: "<b>Phase 3 — Thinning.</b> Re-test every existing edge. Check M–B: condition on C, the neighbour on their path. The CMI collapses to 0.07 ≤ ε, so M and B are actually independent given C — the edge is redundant.", ops: [{ op: "badge", text: "PHASE 3 · THINNING", kind: "warn" }, { op: "set", name: "U", items: ["C"] }, { op: "testCI", x: "M", y: "B", z: ["C"], result: "indep" }, { op: "score", text: "I(M;B|C)=0.07 ≤ ε" }, { op: "removeEdge", from: "M", to: "B" }] },
      { caption: "<b>Thinning.</b> (M–B was never added, so it is simply confirmed absent.) Check C–V: conditioning on B gives CMI 0.08 ≤ ε — also redundant. Remove the edge C–V and set Sep(C,V)={B}.", ops: [{ op: "badge", text: "PHASE 3 · THINNING", kind: "warn" }, { op: "set", name: "U", items: ["B"] }, { op: "testCI", x: "C", y: "V", z: ["B"], result: "indep" }, { op: "score", text: "I(C;V|B)=0.08 ≤ ε" }, { op: "removeEdge", from: "C", to: "V" }, { op: "clearSet", name: "U" }] },
      { caption: "<b>Skeleton finished.</b> The surviving undirected edges are M–C, M–D, C–B, B–D and B–V. Now orient PC-style.", ops: [{ op: "badge", text: "skeleton done", kind: "good" }, { op: "highlightEdges", edges: [["M","C"],["M","D"],["C","B"],["B","D"],["B","V"]] }] },
      { caption: "<b>Orientation — v-structures.</b> The unshielded triple M−C−D has C ∉ Sep(M,D), so it is a collider: orient M → C ← D.", ops: [{ op: "badge", text: "ORIENTATION", kind: "info" }, { op: "highlightNodes", ids: ["M","C","D"], cls: "hl" }, { op: "orient", from: "M", to: "C", type: "directed" }, { op: "orient", from: "D", to: "C", type: "directed" }] },
      { caption: "<b>Orientation — Meek's rules.</b> Because C ∈ Sep(C,V)'s logic and B is a separator, propagation forces B → V. Apply Meek's rules until convergence.", ops: [{ op: "badge", text: "ORIENTATION", kind: "info" }, { op: "orient", from: "B", to: "V", type: "directed" }, { op: "highlightEdges", edges: [["C","B"],["B","D"]] }] },
      { caption: "<b>Result.</b> TPDA returns the oriented graph for {M,D,B,C,V}: the v-structure M → C ← D, the edge B → V, with C–B and B–D making up the rest of the recovered structure.", ops: [{ op: "badge", text: "(C)PDAG returned", kind: "good" }] }
    ]
  },

  complexity: "Designed to need far fewer CI tests than exhaustive constraint-based search: the three phases plus the MDF pruning rule (Prop. 4) keep conditioning sets to neighbours on the current connecting paths. With the MDF assumption holding it is exact; the number of CMI computations grows polynomially in the number of variables for sparse graphs.",
  strengths: [
    "Uses conditional mutual information as a single, interpretable, quantitative dependence measure.",
    "The three-phase design plus MDF pruning sharply cuts the number of CI tests versus naive constraint-based search.",
    "Exact under Monotone DAG Faithfulness; a natural conceptual bridge between pure CI methods (PC/GS) and information-theoretic scoring."
  ],
  limitations: [
    "Relies on Monotone DAG Faithfulness, which is stronger than ordinary faithfulness and can fail for some graphs — so it is often a practical heuristic rather than guaranteed exact.",
    "Results depend on the CMI estimator and the threshold ε; noisy CMI estimates can add or drop edges.",
    "Like other constraint-based methods it assumes causal sufficiency (no hidden confounders)."
  ],
  notes: "Chickering & Meek showed MDF is incompatible with standard faithfulness for most graphs; when MDF does hold together with faithfulness the structure is recoverable by simpler (essentially marginal-independence) tests. Follow-ups include Lamma et al.'s BNL-rules extension (adding mutual-information-based knowledge to drafting), parallel SLA variants, and a hybrid MapReduce implementation that prunes with TPDA-style CI tests before hill-climbing on the same pre-computed counts.",
  figureRefs: "Paper §4.10 (pp.71-76): Algorithm 14 (TPDA), Definition 8 (Monotone DAG Faithfulness), Proposition 4 (MDF pruning rule), Example 19 worked on {M,D,B,C,V} — Figs. 36-37 (drafting), 38-40 (thickening), 41 (thinning), 42 (orientation)."
};
