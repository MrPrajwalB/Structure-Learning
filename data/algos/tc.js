/* TC — Total Conditioning. Grounded in §4.20 (pp.120-125):
   Algorithm 26 (TC), Algorithm 27 (ColliderSetSearch), Theorem 12 (oracle correctness),
   Fig.65 (spouse links in the moral graph), Fig.66/67 + Example 30 (worked search),
   Fig.68 (pipeline overview). Idea: total conditioning recovers the moral graph cheaply,
   then spouse links are pruned to the skeleton and v-structures are oriented. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["tc"] = {
  name: "Total Conditioning",
  oneLiner: "Recover every variable's Markov blanket in one cheap pass by testing each pair conditioned on ALL other variables — giving the moral graph — then prune the spurious 'spouse' links to the true skeleton and orient the v-structures.",
  basedOnText: "TC is a constraint-based method that exploits a shortcut: under faithfulness, two variables stay dependent when you condition on everything else exactly when they are neighbours in the moral graph. It therefore gets Markov blankets / the moral graph in a single round of large-conditioning-set tests, then cleans up.",

  assumptions: [
    "<b>Faithfulness</b> — every independence in the data reflects a genuinely missing connection, with no accidental cancellations. This is what makes the total-conditioning test mean exactly 'moral-graph neighbour'.",
    "<b>Causal sufficiency</b> — no hidden common causes; every common cause is observed.",
    "<b>Reliable CI tests, including with large conditioning sets</b> — the first phase conditions on <i>all</i> other variables at once, so TC assumes a CI test (an oracle, or e.g. partial correlation) that stays trustworthy even with a big conditioning set."
  ],
  input: "A dataset over variables V and a conditional-independence (CI) test (TC's only source of evidence).",
  output: "A <b>PDAG / CPDAG</b> — a partially-directed graph (P-map PDAG of the true DAG) carrying the recovered v-structures plus every edge orientation that faithfulness forces.",

  idea: [
    "TC starts from a question about <i>each pair</i>: is X still dependent on Y once we have already accounted for <b>every other variable</b>? Conditioning on the whole rest of the world is the strongest possible screening — if anything else could explain the link between X and Y, this test removes it.",
    "The key fact (faithfulness) is that this strongest test leaves X and Y dependent <b>exactly when they are neighbours in the moral graph</b> G<sup>m</sup>. Moral-graph neighbours are of two kinds: variables truly adjacent in the DAG, and <b>spouses</b> — two parents of a shared child (a collider X → Z ← Y 'marries' X and Y). So one pass of total conditioning hands you the moral graph, and equivalently each variable's <b>Markov blanket</b> (its parents, children, and spouses), enforced by the symmetry X ∈ MB(Y) ⇔ Y ∈ MB(X).",
    "That moral graph is almost the skeleton — it just has extra <b>spouse links</b>. So <b>Phase 2 (refinement)</b> revisits only the candidate spouse edges (those sitting inside a triangle) and tries to break them with a <i>smaller</i> separating set drawn from their common neighbours. When such a set is found, the edge was a spouse link: delete it, and the common children that opened the dependence become the v-structures.",
    "Finally TC <b>orients</b>: it keeps the v-structures discovered while pruning, then runs Meek-style propagation rules to direct every further edge that logic forces. The headline win is cost: instead of growing conditioning sets pair by pair like PC, TC recovers the whole moral graph in one shot and only does careful local work on the few spouse links."
  ],

  steps: [
    "<b>Total conditioning (recover the moral graph).</b> For every pair (X,Y), test whether X ⫫ Y given <i>all</i> other variables V∖{X,Y}. If they stay dependent, X and Y are moral-graph neighbours — connect them; if independent, leave them apart. This builds the moral graph G<sup>m</sup> and, by symmetry, each Markov blanket MB(X).",
    "<b>Identify candidate spouse edges.</b> The moral graph contains the true skeleton plus extra spouse links from colliders (Fig. 65: a collider T → D ← B forces the moral edge T–B). Any moral edge X–Y that lies inside a triangle is a candidate to be a spouse link.",
    "<b>Set up the local search (ColliderSetSearch).</b> For a candidate edge X–Y, gather Tri(X−Y), the common neighbours that form 3-node paths X–Z–Y. Take as base set B the smaller of X's and Y's common-neighbour sets — this keeps the conditioning sets as small as possible.",
    "<b>Try to break the edge with a separating set.</b> Search subsets S drawn from the common neighbours: if conditioning on a base set plus S makes X ⫫ Y, the edge X–Y was a spurious spouse link — mark it for removal and store U(X,Y)=S, the separating set.",
    "<b>Record the v-structures.</b> Every common neighbour Z that had to be <i>left out</i> of the separating set (Z ∈ Tri(X−Y) but Z ∉ U(X,Y)) is a shared child — store the directive X → Z ← Y.",
    "<b>Remove the spouse links.</b> After all candidates are processed, delete every edge marked for removal. What remains is the true <b>skeleton</b>.",
    "<b>Orient the stored v-structures</b> X → Z ← Y on the skeleton.",
    "<b>Propagate with Meek's rules</b> until nothing more is forced, then <b>return</b> the resulting PDAG (the P-map PDAG of the true graph)."
  ],

  keyConcepts: [
    { term: "Total conditioning", def: "Testing X ⫫ Y given EVERY other variable at once. The strongest screening test — under faithfulness its outcome equals 'are X and Y neighbours in the moral graph?'." },
    { term: "Markov blanket MB(X)", def: "The smallest set that makes X independent of everything else: its parents, its children, and its children's other parents (spouses). TC reads it off the total-conditioning tests, enforcing X∈MB(Y) ⇔ Y∈MB(X)." },
    { term: "Moral graph Gᵐ", def: "The undirected graph linking every pair that shares a child, in addition to the skeleton. It is the skeleton plus the spouse links — exactly what total conditioning recovers." },
    { term: "Spouse link", def: "A moral-graph edge X–Y that exists only because X and Y are both parents of a common child Z (a collider X → Z ← Y). Not a real adjacency — it must be pruned." },
    { term: "Common neighbours Tri(X−Y)", def: "Variables Z forming a 3-node path X–Z–Y. The separating set for a spouse link is searched among these (Algorithm 27); each Z left out is a shared child / collider." },
    { term: "v-structure (collider)", def: "A pattern X → Z ← Y with X,Y non-adjacent. In TC, the common children that block separation of a spouse pair become the v-structures, fixing the first orientations." }
  ],

  animation: {
    title: "TC on a faithful 5-node example {A,B,C,D,E} with a collider (illustrative — the paper's Example 30 uses a larger graph, Fig.66/67).",
    nodes: [
      { id: "A", x: 0.06, y: 0.30 },
      { id: "B", x: 0.06, y: 0.78 },
      { id: "C", x: 0.50, y: 0.54 },
      { id: "D", x: 0.92, y: 0.30 },
      { id: "E", x: 0.92, y: 0.78 }
    ],
    edges: [],
    steps: [
      { caption: "<b>Goal.</b> The true DAG is A → C ← B and C → D, C → E. We never see it; TC must recover it from CI tests. Note A and B are parents of the same child C — they are <i>spouses</i>, so the moral graph will wrongly link them.", ops: [{ op: "badge", text: "true graph hidden", kind: "info" }] },
      { caption: "<b>Phase 1 — total conditioning.</b> Test A ⫫ B given EVERYTHING else {C,D,E}. They stay <i>dependent</i> (conditioning on their shared child C couples them). So A–B is a moral-graph edge — add it. This is a spouse link.", ops: [{ op: "badge", text: "total conditioning", kind: "info" }, { op: "testCI", x: "A", y: "B", z: ["C", "D", "E"], result: "dep" }, { op: "addEdge", from: "A", to: "B", type: "undirected" }] },
      { caption: "<b>Total conditioning:</b> A ⫫ C given {B,D,E}? Still <i>dependent</i> — A and C are truly adjacent. Add the moral edge A–C.", ops: [{ op: "testCI", x: "A", y: "C", z: ["B", "D", "E"], result: "dep" }, { op: "addEdge", from: "A", to: "C", type: "undirected" }] },
      { caption: "<b>Total conditioning:</b> B ⫫ C given {A,D,E}? <i>Dependent</i> — B and C are adjacent. Add B–C.", ops: [{ op: "testCI", x: "B", y: "C", z: ["A", "D", "E"], result: "dep" }, { op: "addEdge", from: "B", to: "C", type: "undirected" }] },
      { caption: "<b>Total conditioning:</b> C ⫫ D given {A,B,E}? <i>Dependent</i> — adjacent. Add C–D. Likewise C ⫫ E given {A,B,D}? <i>Dependent</i> — add C–E.", ops: [{ op: "testCI", x: "C", y: "D", z: ["A", "B", "E"], result: "dep" }, { op: "addEdge", from: "C", to: "D", type: "undirected" }, { op: "testCI", x: "C", y: "E", z: ["A", "B", "D"], result: "dep" }, { op: "addEdge", from: "C", to: "E", type: "undirected" }] },
      { caption: "<b>Total conditioning:</b> the remaining pairs (A–D, A–E, B–D, B–E, D–E) all turn out <i>independent</i> given the rest — no shared child, no adjacency — so no edges are added.", ops: [{ op: "testCI", x: "D", y: "E", z: ["A", "B", "C"], result: "indep" }] },
      { caption: "<b>Moral graph recovered</b> in one pass. We have A–B, A–C, B–C, C–D, C–E, and the Markov blankets: MB(A)={B,C}, MB(C)={A,B,D,E}. The triangle A–B–C signals A–B may be a spouse link.", ops: [{ op: "badge", text: "moral graph done", kind: "good" }, { op: "set", name: "MB(A)", items: ["B", "C"] }, { op: "set", name: "MB(C)", items: ["A", "B", "D", "E"] }, { op: "highlightEdges", edges: [["A", "B"], ["A", "C"], ["B", "C"]], cls: "hl" }] },
      { caption: "<b>Phase 2 — prune spouse links (ColliderSetSearch).</b> Candidate A–B sits in a triangle. Its common neighbour is C, so Tri(A−B)={C}. Search a separating set among these common neighbours.", ops: [{ op: "highlightNodes", ids: ["A", "B", "C"], cls: "hl" }, { op: "set", name: "Tri(A−B)", items: ["C"] }] },
      { caption: "<b>Break the edge.</b> Test A ⫫ B conditioning on the SMALL set ∅ (leaving the shared child C out). They are now <i>independent</i> — so A–B was a spouse link. Mark it for removal; separating set U(A,B)=∅.", ops: [{ op: "testCI", x: "A", y: "B", z: [], result: "indep" }, { op: "removeEdge", from: "A", to: "B" }, { op: "set", name: "U(A,B)", items: [] }] },
      { caption: "<b>Spouse link gone → the true skeleton remains:</b> A–C, B–C, C–D, C–E. Because the common neighbour C had to be left OUT of the separating set, C is a shared child — record the directive A → C ← B.", ops: [{ op: "badge", text: "skeleton done", kind: "good" }, { op: "highlightEdges", edges: [["A", "C"], ["B", "C"], ["C", "D"], ["C", "E"]], cls: "hl" }] },
      { caption: "<b>Orient the v-structure.</b> Apply the stored directive: A → C ← B. Both arrows point into the shared child C.", ops: [{ op: "highlightNodes", ids: ["A", "C", "B"], cls: "hl" }, { op: "orient", from: "A", to: "C", type: "directed" }, { op: "orient", from: "B", to: "C", type: "directed" }] },
      { caption: "<b>Meek propagation.</b> With A → C ← B fixed and C–D, C–E free, no new collider may be created at C, so R1 forces C → D and C → E.", ops: [{ op: "orient", from: "A", to: "C", type: "directed" }, { op: "orient", from: "B", to: "C", type: "directed" }, { op: "orient", from: "C", to: "D", type: "directed" }, { op: "orient", from: "C", to: "E", type: "directed" }] },
      { caption: "<b>Result — the PDAG.</b> A → C ← B with C → D, C → E. TC recovered the moral graph in one cheap pass, pruned the spouse link A–B, and oriented the v-structure — matching the hidden true graph.", ops: [{ op: "badge", text: "PDAG returned", kind: "good" }] }
    ]
  },

  complexity: "Phase 1 is cheap in the number of tests — one CI test per pair, O(n²) tests — but each conditions on all other variables, so individual tests are statistically demanding (high-dimensional conditioning). Phase 2 does only local subset searches over each spouse edge's common neighbours, so it stays small when the graph is sparse.",
  strengths: [
    "Recovers the whole moral graph / all Markov blankets in a single pass, avoiding PC's gradual growth of conditioning sets pair by pair.",
    "Correct under an oracle CI test and faithfulness: it returns immoralities and all spouse links removed, i.e. the P-map PDAG of the true DAG (Theorem 12).",
    "Cleanly separates the cheap global step (moral graph) from focused local cleanup (spouse-link pruning + orientation)."
  ],
  limitations: [
    "Phase 1 conditions on every other variable at once; with finite data these large-conditioning-set tests are statistically weak, needing many samples to be reliable.",
    "Like all constraint-based methods it is sensitive to CI-test errors — a wrong total-conditioning test adds or drops a moral-graph edge.",
    "Assumes causal sufficiency (no hidden confounders) and faithfulness."
  ],
  notes: "TC itself assumes the Markov blankets can be obtained; a related-work line replaces the costly total-conditioning step with dedicated Markov-blanket discovery (e.g. PSL-FS coupled with PSL), then removes spouse links and orients (Ram & Chetty). Other variants reuse the 'blanket graph' idea: GS-style growth-shrink, ADL (Adaptive DAG Learning) with adaptive edge criteria, and LC-KMB which identifies a target's boundary via an RKHS conditional-covariance operator.",
  figureRefs: "Paper §4.20 (pp.120-125): Algorithm 26 (TC), Algorithm 27 (ColliderSetSearch), Theorem 12 (oracle returns the P-map PDAG), Fig.65 (spouse links in the moral graph), Fig.66 & Fig.67 with Example 30 (worked local search), Fig.68 (pipeline overview)."
};
