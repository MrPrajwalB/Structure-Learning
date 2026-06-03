/* LOL — Layered Optimal Learning (Yu et al. [762]). Grounded in §4.46 (pp.219-225).
   Two phases: (1) layer the variables using m-independence / CI tests; (2) learn each
   layer with Ancestrally-Constrained Dynamic Programming (ACDP), then merge.
   Worked example = Example 65 / Fig.144 (true DAG A→C, B→C, C→D). Pseudocode = Algorithm 57. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["lol"] = {
  name: "Layered Optimal Learning (LOL)",
  oneLiner: "First slice the variables into layers using conditional-independence tests, so each node's parents always live in its own or an earlier layer; then learn each layer's edges with an exact dynamic-programming search and stitch the layers together into one DAG.",
  basedOnText: "LOL sits at the intersection of constraint-based and exact score-based learning: CI tests build a hierarchy of layers (an ancestral ordering), and within that scaffold an optimal dynamic-programming routine (ACDP) finds the best edges — the layering shrinks the search space and lets layers be learned in parallel.",

  assumptions: [
    "<b>The true graph is a DAG</b> — the layering recovers an ancestral/topological ordering, which only exists if there are no directed cycles.",
    "<b>Faithfulness</b> — the conditional independencies seen in the data faithfully reflect the missing connections in the true DAG, so m-independence tests reveal genuine layer boundaries.",
    "<b>Reliable CI tests</b> — m-independence is decided by statistical tests at significance level α; conditioning-set sizes are capped at k_max so tests stay trustworthy.",
    "<b>A decomposable score</b> — within a layer the dynamic-programming routine scores parent sets locally and adds them up (standard exact-learning assumption)."
  ],
  input: "A dataset 𝒟 over variables V, a CI test at significance level α, and a maximum conditioning-set size k_max.",
  output: "A single DAG: a priority-ordered list of layers (L₁,…,Lₗ) together with an <b>admissible-parent map</b> that says, for each node, which earlier-or-same-layer variables may be its parents — assembled by the DP routine into one optimal structure.",

  idea: [
    "LOL's insight is that a DAG has a <i>hierarchy</i>: root variables sit at the top, their children below, and so on. If we can sort variables into <b>layers</b> that respect this hierarchy, then every node's parents are guaranteed to lie in its own layer or an earlier one — which turns one huge structure search into several small, almost-independent ones.",
    "<b>Phase 1 — layering by m-independence.</b> LOL discovers the layers with CI tests, growing the conditioning set Z in <i>increasing size</i>. With Z = ∅ it finds the variables that are (marginally) m-independent of the rest — these are the roots / earliest layer. It then sets Z to size 1, size 2, … ; each larger conditioning set reveals a deeper layer. A layer sits <i>above</i> another when its defining conditioning set is a proper subset of the other's, which orders the layers by precedence.",
    "<b>m-independence across sets</b> is the formal tool: a family of disjoint blocks {X₁,…,Xₗ} where each variable is m-independent of the others given Z. The blocks satisfy <i>cohesion</i> (no block splits into two independent halves) and <i>inclusivity</i> (every pairwise independence is captured by some block). These blocks are the <b>independent learnable blocks</b> that make up a layer.",
    "<b>Phase 2 — learn each layer with ACDP.</b> Ancestrally-Constrained Dynamic Programming computes the highest-scoring sub-graph for each layer, but only allows a node's parents to be drawn from its own or earlier layers (the admissible-parent map). Because each layer is small and its parent candidates are restricted, the otherwise-exponential exact search becomes tractable, and different layers can be learned in parallel (the 'distributed' part).",
    "<b>Merge.</b> The per-layer DAGs are combined into one DAG; cross-layer arrows always point downward (from an earlier layer to a later one), so no cycles can form. Variables shared between adjacent layers tie the pieces together."
  ],

  steps: [
    "<b>Initialise.</b> Start with the whole variable set V and conditioning-set size |Z| = 0. The admissible-parent map (Allowed) is empty.",
    "<b>Find the first layer (Z = ∅).</b> Call MIndepFamilies to get a maximal family of disjoint blocks {X₁,…,Xₗ} that are m-independent with the empty conditioning set. These (the marginally independent roots) form layer L₁.",
    "<b>Grow the conditioning set.</b> Increase |Z| by one (Z of size 1, then 2, … up to k_max). For each candidate conditioning set Z, find which variables become m-independent given Z — they form the next, deeper layer. Larger Z ⇒ a layer further down the hierarchy.",
    "<b>Order layers by precedence.</b> Layer X sits above layer Y when X's defining conditioning set is a proper subset of Y's. This yields the priority order L₁ ≺ L₂ ≺ … ≺ Lₗ — an ancestral ordering.",
    "<b>Build the admissible-parent map.</b> Using Theorems 29–30, for the 'uncovered' nodes of each block work out which variables (in the same or an earlier layer) are allowed to be parents. Cross-layer parents may only come from earlier layers; within a block, allowed parents respect cohesion/inclusivity.",
    "<b>Learn the first layer with ACDP.</b> Run the exact dynamic-programming routine on L₁, choosing each node's best parent set from its allowed candidates. This produces the partial DAG for L₁.",
    "<b>Learn each subsequent layer with ACDP.</b> For each later layer, run ACDP with parents restricted to that layer or earlier ones. Layers with disjoint candidate sets can be learned in parallel.",
    "<b>Prune across layers.</b> A candidate cross-layer edge is dropped if a CI test shows the two nodes are independent given the appropriate (earlier-layer) conditioning set — false connections are screened off.",
    "<b>Merge the layers.</b> Combine the per-layer sub-graphs into one graph, with cross-layer edges directed downward (earlier layer → later layer). Shared boundary variables join the pieces.",
    "<b>Return</b> the priority-ordered layers and the admissible-parent map — equivalently, the single assembled DAG."
  ],

  keyConcepts: [
    { term: "Layer", def: "A group of variables at the same level of the DAG's hierarchy. Layers are discovered by CI tests with progressively larger conditioning sets and ordered by precedence (ancestral ordering)." },
    { term: "m-independence", def: "An independence notion (Def. 20) built on minimal blocking sets: X and Y are m-independent given Z when Z, and every subset of Z, blocks all active trails between them. It signals that two variables can be placed in separate learnable blocks." },
    { term: "m-independence across sets / independent learnable blocks", def: "A family of disjoint blocks {X₁,…,Xₗ} that are mutually m-independent given Z, satisfying cohesion (no block splits) and inclusivity (all pairwise independencies captured). Each block can be learned on its own." },
    { term: "Admissible-parent map (Allowed)", def: "For every node, the set of variables — drawn only from its own or an earlier layer — that are permitted to be its parents. It encodes the ancestral constraints that make the search tractable." },
    { term: "ACDP (Ancestrally-Constrained Dynamic Programming)", def: "An exact, score-based DP routine that finds the optimal sub-graph of a layer while obeying the admissible-parent map. Small layers + restricted parents keep the exponential DP affordable." },
    { term: "Precedence (layer ordering)", def: "Layer X is above layer Y if X's defining conditioning set is a proper subset of Y's. Cross-layer edges always point from an earlier (higher) layer to a later (lower) one, guaranteeing acyclicity." }
  ],

  animation: {
    title: "LOL on the running example (paper Example 65 / Fig. 144): true DAG A→C, B→C, C→D.",
    nodes: [
      { id: "A", x: 0.30, y: 0.16 },
      { id: "B", x: 0.70, y: 0.16 },
      { id: "C", x: 0.50, y: 0.52 },
      { id: "D", x: 0.50, y: 0.86 }
    ],
    edges: [],
    steps: [
      { caption: "<b>Goal.</b> Recover the true DAG A→C, B→C, C→D. LOL never starts from a full graph — it first sorts the four variables into layers using CI tests, then learns edges layer by layer.", ops: [{ op: "badge", text: "phase 1: layering", kind: "info" }] },
      { caption: "<b>Conditioning set Z = ∅.</b> Test marginal m-independence. A ⫫ B and A ⫫ C hold, so the roots split into blocks X₁ = {A} and X₂ = {B,C} — both m-independent with the empty set.", ops: [{ op: "badge", text: "|Z| = 0", kind: "info" }, { op: "testCI", x: "A", y: "B", z: [], result: "indep" }, { op: "testCI", x: "A", y: "C", z: [], result: "indep" }] },
      { caption: "<b>First layer L₁ = {A,B,C}.</b> The blocks found at |Z| = 0 combine into the earliest layer (Fig. 144b). These are the variables nearest the top of the hierarchy.", ops: [{ op: "set", name: "Layer 1", items: ["A", "B", "C"] }, { op: "highlightNodes", ids: ["A", "B", "C"], cls: "hl" }, { op: "badge", text: "L₁ assigned", kind: "good" }] },
      { caption: "<b>Grow the conditioning set: Z = {C} (|Z| = 1).</b> Now test the deeper variables. B ⫫ D | C holds — conditioning on C screens B off from D, exposing the next layer.", ops: [{ op: "badge", text: "|Z| = 1, Z = {C}", kind: "info" }, { op: "highlightNodes", ids: ["C"], cls: "dim" }, { op: "testCI", x: "B", y: "D", z: ["C"], result: "indep" }] },
      { caption: "<b>Second layer L₂ = {B,C,D}.</b> The m-independence B ⫫ D | C yields the next layer (Fig. 144d). C and B are shared with L₁ — these overlaps stitch adjacent layers together. L₁ precedes L₂ because ∅ ⊂ {C}.", ops: [{ op: "set", name: "Layer 2", items: ["B", "C", "D"] }, { op: "highlightNodes", ids: ["B", "C", "D"], cls: "hl" }, { op: "badge", text: "L₂ assigned", kind: "good" }] },
      { caption: "<b>Admissible-parent map.</b> Using the layer ordering, each node's parents may only come from its own or an earlier layer. So D (in L₂) may take parents from L₁; roots A,B take none. This is the scaffold ACDP will obey.", ops: [{ op: "badge", text: "parents ⊆ earlier/same layer", kind: "info" }, { op: "highlightNodes", ids: ["A", "B", "C", "D"], cls: "dim" }] },
      { caption: "<b>Phase 2 — learn L₁ with ACDP.</b> Run the exact DP search inside the first layer. The optimal sub-graph adds A→C and B→C (the partial DAG of Fig. 144c): C's best parents within L₁ are A and B.", ops: [{ op: "badge", text: "phase 2: ACDP on L₁", kind: "info" }, { op: "highlightNodes", ids: ["A", "B", "C"], cls: "hl" }, { op: "addEdge", from: "A", to: "C", type: "directed" }, { op: "addEdge", from: "B", to: "C", type: "directed" }] },
      { caption: "<b>Learn L₂ with ACDP.</b> Now search the second layer, with D allowed parents from L₁/L₂. The best parent for D is C, giving the cross-layer edge C→D, directed downward from the earlier layer.", ops: [{ op: "badge", text: "ACDP on L₂", kind: "info" }, { op: "highlightNodes", ids: ["B", "C", "D"], cls: "hl" }, { op: "addEdge", from: "C", to: "D", type: "directed" }] },
      { caption: "<b>Prune a false cross-layer edge.</b> Could B connect directly to D? The CI test B ⫫ D | C says no — C already screens B from D, so no B→D edge is added. The layering made this a single, cheap test.", ops: [{ op: "badge", text: "cross-layer pruning", kind: "info" }, { op: "testCI", x: "B", y: "D", z: ["C"], result: "indep" }, { op: "highlightNodes", ids: ["B", "D"], cls: "dim" }] },
      { caption: "<b>Merge the layers.</b> Combine the per-layer sub-graphs into one DAG. Cross-layer arrows point downward (L₁ → L₂), so the result is guaranteed acyclic. A is an ancestor of D through C; B belongs to an earlier layer.", ops: [{ op: "highlightEdges", edges: [["A", "C"], ["B", "C"], ["C", "D"]], cls: "add" }, { op: "badge", text: "layers merged", kind: "good" }] },
      { caption: "<b>Result — the recovered DAG.</b> A→C, B→C, C→D, matching the truth (Fig. 144a). Layering reduced one big structure search to two small ACDP runs whose parents were confined to earlier layers.", ops: [{ op: "highlightNodes", ids: ["A", "B", "C", "D"], cls: "hl" }, { op: "badge", text: "DAG returned", kind: "good" }] }
    ]
  },

  complexity: "Per layer the exact DP (ACDP) is exponential in the layer's size and its number of allowed parents, but both are kept small by the layering, so the overall cost is far below learning the whole graph exactly. CI tests for layering grow with conditioning-set size and are capped at k_max. Layers with disjoint candidate sets can be learned in parallel (distributed), cutting wall-clock time.",
  strengths: [
    "Combines the strengths of both paradigms: CI-based layering gives a sound ancestral ordering, and exact DP gives an optimal structure within each layer.",
    "The layered decomposition sharply reduces the CI-test burden and the size of each exact search, making optimal learning feasible on larger problems.",
    "Layers form independent learnable blocks, so learning can be distributed / parallelised across layers.",
    "Cross-layer edges are forced to point downward, so acyclicity is automatic — no separate cycle-checking needed."
  ],
  limitations: [
    "Correctness of the layers depends on reliable m-independence tests; a wrong test misplaces a variable and propagates into the wrong admissible-parent sets.",
    "Within-layer exact DP is still exponential, so very large or dense layers remain expensive.",
    "Relies on faithfulness and a true-DAG assumption; it does not handle hidden confounders.",
    "Choosing k_max trades completeness of the layering against test reliability and run time."
  ],
  notes: "LOL is related to a line of hierarchical-clustering structure learners. R-CORE (Jung et al. [307]) clusters variables by pairwise mutual information into a cluster tree, then orients cross-cluster edges and learns within clusters; H-CORE adds a score-based union step. Zhang et al. [794] use transformed variables and an acyclic precedence graph, and Feigenbaum et al. [185] frame layered structure learning as uncovering a layering — all sharing LOL's idea of learning a hierarchy and confining each node's parents to earlier groups.",
  figureRefs: "Paper §4.46 (pp.219–225): Algorithm 57 (LOL: Layering by m-independence and admissible-parent mapping), Fig.135 (active trails / minimal blocking sets), Defs.20–21 (m-independence and m-independence across sets), Theorems 29–30 (parents under Z), Fig.143 (sets for Theorem 30), Example 65 with Fig.144a–d (the A,B,C,D running example)."
};
