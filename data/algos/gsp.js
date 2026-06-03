/* GSP — Greedy Sparsest Permutation. Grounded in §4.52 (pp.250-253), builds on SP (§4.42)
   and HC (§4.3): Algorithm 65 (GSP edge-walk), Lemma 15 (permutation→DAG / minimal I-map),
   Recall 65 (linear extension), Recall 66 (covered edge/arrow), Definition 27 (weakly
   decreasing edge-walk), Theorem 34 (covered reversals trace edges of the associahedron),
   Remark 17 (order-space vs class-space); Figs.157-164, Example 73 (reversing covered edges,
   order 321), Example 74 (a full GSP run on 𝒜₃, Fig.164: start 123 → walk to 132/312). */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["gsp"] = {
  name: "Greedy Sparsest Permutation",
  oneLiner: "A scalable, greedy version of Sparsest Permutation: instead of enumerating every ordering, start from one permutation and its minimal DAG, then repeatedly reverse a 'covered' edge — which swaps two neighbouring variables in the order — moving to sparser DAGs and stopping at a local minimum whose neighbours have no fewer edges.",
  basedOnText: "GSP searches the same permutation space as SP but does not enumerate the whole permutohedron. It performs a local edge-walk over the DAG associahedron: it reverses one covered arrow at a time (a safe move that swaps two adjacent variables in the order), rebuilds the minimal I-map, and greedily descends toward fewer edges — combining SP's sparsity criterion with HC-style local hill-climbing (here, valley-descending on edge count).",

  assumptions: [
    "<b>Restricted faithfulness</b> — the same weaker-than-faithfulness condition SP needs: adjacency faithfulness (truly adjacent variables stay dependent under any conditioning) plus orientation faithfulness (colliders are correctly revealed). GSP is consistent under weaker conditions than PC's full faithfulness.",
    "<b>Sparsest Markov Representation (SMR)</b> — the true DAG G* is the unique sparsest I-map of the distribution, so the genuinely sparsest permutation recovers the truth (up to Markov equivalence). GSP inherits this correctness target from SP.",
    "<b>Reliable CI tests / an oracle</b> — each minimal I-map is rebuilt from conditional-independence relations (or a sparsity/score proxy); correctness is stated for a perfect oracle.",
    "<b>Causal sufficiency</b> — all relevant variables are present in the ordering (no hidden common causes left out)."
  ],
  input: "A dataset 𝒟 over variables V = {X₁,…,X_p}, a conditional-independence test (to rebuild minimal I-maps), a starting permutation π₀ (and optionally a search depth d_max and number of random restarts).",
  output: "A DAG G_π that is a local minimum of the edge count: a minimal I-map whose covered-edge-reversal neighbours are no sparser. Under SMR (and from a good start / enough restarts) this is the true graph G* up to Markov equivalence.",

  idea: [
    "GSP starts from exactly the same place as SP — <b>a permutation defines a single smallest DAG</b> (its minimal I-map, Lemma 15): lay the variables in order and give each node an arrow from an earlier variable only if they remain dependent after conditioning on the node's other predecessors. But SP then tries <i>all</i> p! orderings, which is factorially expensive. GSP instead <i>walks</i> from one ordering to a neighbour, the way Hill Climbing walks from one DAG to a neighbour.",
    "The key move is the <b>covered-edge reversal</b>. An arrow A → B is <i>covered</i> when A and B have exactly the same other parents (Recall 66). Flipping a covered arrow is special: it never creates or destroys a v-structure, so it keeps you inside the same Markov-equivalence class, and it corresponds to <b>swapping two adjacent variables in the permutation</b>. These swaps are precisely the edges of the 'DAG associahedron' the search walks along (Theorem 34) — GSP never builds that polytope explicitly, it just takes one covered-edge step at a time (Algorithm 65).",
    "After reversing a covered edge, GSP <b>rebuilds the minimal I-map from a linear extension of the updated order</b> and counts the edges. The whole search is a <b>greedy descent on sparsity</b>: if a neighbour has <i>strictly fewer</i> edges, move there; keep going as long as you can find sparser graphs. Spurious edges that one ordering forced can vanish once a better ordering is reached. This is the SP idea (fewest edges = truth) pursued by local search rather than exhaustive enumeration.",
    "GSP stops at a <b>local minimum</b>: a permutation whose covered-edge-reversal neighbours are all at least as dense. A 'weakly decreasing edge-walk' (Definition 27) is allowed a small amount of lookahead — controlled by depth d_max — taking moves that don't increase the edge count to skim across a flat region of equal-edge graphs in search of a strictly sparser one further ahead. With d_max = 1 GSP reduces to pure greedy descent; larger d_max (and random restarts) trade computation for a better chance of reaching the global sparsest DAG.",
    "Contrast with its relatives: <b>SP</b> is exact but enumerates the whole permutohedron; <b>GSP</b> keeps SP's sparsity criterion and weak-faithfulness guarantee but explores the space locally, so it scales far better. Versus equivalence-class methods (GES-style CPDAG search), GSP works in <i>order space</i> — it reverses a covered edge in a DAG, takes a linear extension, and rebuilds, with MEC transitions happening implicitly rather than via explicit class jumps (Remark 17)."
  ],

  steps: [
    "<b>Initialise.</b> Pick a starting permutation π = π₀ of the variables. Build its minimal I-map G_π (Lemma 15): each node π_k gets an arrow from an earlier variable π_j only if π_j and π_k stay dependent given π_k's other predecessors. Record the current edge count |E(G_π)|.",
    "<b>Find the covered edges.</b> In the current DAG G_π, identify every <b>covered</b> arrow A → B — one where A and B share exactly the same other parents (Pa_B = Pa_A ∪ {A}). These are the only arrows that can be safely reversed without changing the v-structures, and each corresponds to swapping two adjacent variables in π (Recall 66, Theorem 34).",
    "<b>Generate neighbours.</b> For each covered arrow, form the candidate move: reverse that arrow, which produces a new order π′ (the two endpoints swap their adjacent positions). Take a linear extension of the reversed DAG to get π′ (Recall 65).",
    "<b>Re-derive and score each neighbour.</b> For each candidate π′, rebuild the minimal I-map G_{π′} from scratch and count its edges. (Equivalent to: reverse the covered arrow, then re-apply the parent rule, possibly deleting an arrow that the new order makes unnecessary.)",
    "<b>Move if sparser (greedy descent).</b> If some neighbour has <i>strictly fewer</i> edges than the current DAG, move to the sparsest such neighbour: set π ← π′, G_π ← G_{π′}, and go back to find covered edges. This is the weakly decreasing edge-walk of Definition 27 / Algorithm 65.",
    "<b>(Lookahead, optional.)</b> With search depth d_max &gt; 1, also allow covered-edge moves that keep the edge count <i>equal</i> (not strictly higher), chaining up to d_max such moves to cross a flat plateau of equal-edge DAGs in search of a strictly sparser graph further on. d_max = 1 gives pure greedy descent.",
    "<b>Stop at a local minimum.</b> When no covered-edge reversal (within the allowed depth) yields a sparser DAG, the current permutation is a local minimum. Return its DAG G_π — the learned structure.",
    "<b>(Optional) Random restarts.</b> Repeat the whole edge-walk from several random starting permutations and keep the sparsest DAG found, to reduce the chance of stopping at a poor local minimum."
  ],

  keyConcepts: [
    { term: "Permutation / variable order (π)", def: "A left-to-right arrangement of the variables. It pins down a single minimal DAG and forces edges to point forward, so any consistent DAG is automatically acyclic. GSP searches this order space." },
    { term: "Minimal I-map (G_π)", def: "For a fixed order, the smallest DAG matching the data: each node keeps an earlier variable as a parent only if they stay dependent given the node's other predecessors (Lemma 15). GSP rebuilds this after every move." },
    { term: "Covered edge / arrow", def: "An arrow A → B where A and B have exactly the same other parents (Pa_B = Pa_A ∪ {A}). Reversing a covered arrow never adds or removes a v-structure, so it stays in the same Markov-equivalence class — and it swaps two adjacent variables in the order (Recall 66)." },
    { term: "Covered-edge reversal (the move)", def: "GSP's single local operator: flip a covered arrow, take a linear extension to get the new order, and rebuild the minimal I-map. These reversals are exactly the edges of the DAG associahedron the walk traverses (Theorem 34)." },
    { term: "Linear extension", def: "Any total order of the variables consistent with the partial order of a DAG (Recall 65). After reversing a covered edge GSP takes a linear extension of the updated DAG to read off the new permutation π′." },
    { term: "Weakly decreasing edge-walk", def: "A sequence of covered-edge reversals whose edge count never increases (Definition 27). GSP follows such a walk until it can no longer strictly decrease the number of edges." },
    { term: "Search depth (d_max)", def: "How many equal-edge (non-strictly-decreasing) moves of lookahead are allowed before requiring a strict improvement. d_max = 1 is pure greedy descent; larger values skim plateaus of equal-edge DAGs at higher cost." },
    { term: "Local minimum (sparsest neighbour)", def: "A permutation whose covered-edge-reversal neighbours are all at least as dense. GSP stops here and returns its DAG; under SMR (with luck or restarts) it is the global sparsest = the true structure." }
  ],

  animation: {
    title: "A full GSP edge-walk on three variables {X1,X2,X3} (paper Example 74 / Fig. 164, with the covered-edge mechanics of Example 73 / Fig. 163). Start at order 123, reverse covered edges greedily, stop at the sparsest 132/312 DAG.",
    nodes: [
      { id: "X1", x: 0.18, y: 0.28 },
      { id: "X2", x: 0.50, y: 0.85 },
      { id: "X3", x: 0.82, y: 0.28 }
    ],
    edges: [],
    steps: [
      { caption: "<b>The task & the start.</b> Three variables {X1,X2,X3}; the truth is the collider X1 → X2 ← X3 (the sparsest, 2 edges). GSP begins from <b>order 123</b> (X1 ≺ X2 ≺ X3) and will walk to the sparsest DAG one covered-edge reversal at a time — never enumerating all orders like SP does.", ops: [
        { op: "set", name: "Permutation", items: ["X1", "X2", "X3"] },
        { op: "badge", text: "start: order 123", kind: "info" } ] },
      { caption: "<b>Build the minimal I-map of 123.</b> Apply the parent rule (Lemma 15): X2 depends on X1 → add X1 → X2; X3 still depends on both X1 and X2 given the other, so add X1 → X3 and X2 → X3. This order's minimal DAG is <b>dense — 3 edges</b> (Fig. 164, green 'Start' vertex).", ops: [
        { op: "addEdge", from: "X1", to: "X2", type: "directed" },
        { op: "addEdge", from: "X1", to: "X3", type: "directed" },
        { op: "addEdge", from: "X2", to: "X3", type: "directed" },
        { op: "score", text: "#edges = 3" },
        { op: "badge", text: "current: 3 edges", kind: "info" } ] },
      { caption: "<b>Find a covered edge.</b> The arrow X1 → X2 is <b>covered</b>: X1 and X2 share the same other parents here, so reversing it cannot add or remove a v-structure (Recall 66). Reversing it corresponds to swapping the first two variables in the order — a single edge-walk step on the associahedron (Theorem 34).", ops: [
        { op: "highlightEdges", edges: [["X1", "X2"]], cls: "hl" },
        { op: "badge", text: "covered edge X1→X2", kind: "info" } ] },
      { caption: "<b>Reverse the covered edge → order 213.</b> Flip X1 → X2 to X2 → X1. Swapping the first two positions gives the new order <b>213</b> (X2 ≺ X1 ≺ X3). Now take a linear extension and rebuild the minimal I-map (Recall 65).", ops: [
        { op: "orient", from: "X2", to: "X1", type: "directed" },
        { op: "set", name: "Permutation", items: ["X2", "X1", "X3"] },
        { op: "highlightEdges", edges: [["X2", "X1"]], cls: "hl" } ] },
      { caption: "<b>Re-derive & score 213.</b> Rebuilding the minimal I-map for order 213 still needs all three arrows (X2→X1, X2→X3, X1→X3): the edge count is unchanged at <b>3</b>. This move did not reduce edges — by pure greedy descent it is <i>not</i> accepted as an improvement, but the walk continues along the associahedron toward sparser vertices.", ops: [
        { op: "score", text: "#edges = 3 (no reduction)" },
        { op: "badge", text: "not sparser — reject", kind: "bad" } ] },
      { caption: "<b>Next covered edge on the way down.</b> Continue the edge-walk (Fig. 164 traverses 123 → 213 → 231 → 321). Reach order 321 (X3 ≺ X2 ≺ X1), whose minimal DAG is X3 → X2, X3 → X1, X2 → X1 — still 3 edges. Here arrow <b>X2 → X1 is covered</b> (Example 73, Fig. 163a): we will reverse it next.", ops: [
        { op: "removeEdge", from: "X2", to: "X1" },
        { op: "removeEdge", from: "X1", to: "X3" },
        { op: "removeEdge", from: "X2", to: "X3" },
        { op: "addEdge", from: "X3", to: "X2", type: "directed" },
        { op: "addEdge", from: "X3", to: "X1", type: "directed" },
        { op: "addEdge", from: "X2", to: "X1", type: "directed" },
        { op: "set", name: "Permutation", items: ["X3", "X2", "X1"] },
        { op: "score", text: "#edges = 3" },
        { op: "highlightEdges", edges: [["X2", "X1"]], cls: "hl" },
        { op: "badge", text: "order 321 — covered X2→X1", kind: "info" } ] },
      { caption: "<b>Reverse covered X2 → X1.</b> Flip it to X1 → X2 (Fig. 163b). The arrow X3 → X1 was also covered and is reversed/absorbed by the swap. After reversing under the new order, the edge that the order no longer needs becomes removable.", ops: [
        { op: "orient", from: "X1", to: "X2", type: "directed" },
        { op: "highlightEdges", edges: [["X1", "X2"]], cls: "hl" },
        { op: "badge", text: "reversing covered edges", kind: "info" } ] },
      { caption: "<b>Rebuild → an edge is deleted (sparser!).</b> Under the new order X1 ⫫ X3 holds, so Lemma 15 requires <b>no</b> arrow between X1 and X3 — delete X3 → X1 (Fig. 163c). The minimal I-map collapses to the collider X1 → X2 ← X3: <b>only 2 edges</b>. This neighbour is strictly sparser, so GSP <b>accepts the move</b>.", ops: [
        { op: "testCI", x: "X1", y: "X3", z: [], result: "indep" },
        { op: "removeEdge", from: "X3", to: "X1" },
        { op: "score", text: "#edges = 2" },
        { op: "highlightEdges", edges: [["X1", "X2"], ["X3", "X2"]], cls: "hl" },
        { op: "badge", text: "sparser (2 < 3) — accept", kind: "good" } ] },
      { caption: "<b>Now at the contracted 132/312 vertex.</b> This 2-edge collider is the sparsest minimal DAG (Fig. 164, red 'Less edges found!' vertex). Orders 132 and 312 induce the very same DAG, so they were contracted into one vertex of the associahedron. The current order reads as 312 (X3 ≺ X1 ≺ X2).", ops: [
        { op: "set", name: "Permutation", items: ["X3", "X1", "X2"] },
        { op: "badge", text: "vertex 132 / 312", kind: "info" } ] },
      { caption: "<b>Check the neighbours — none is sparser.</b> The only covered edge left is the one between the parents (X1, X3) of the collider, and reversing it just gives the equivalent 2-edge DAG (132 ↔ 312, same Markov class). No covered-edge reversal yields fewer than 2 edges, so the walk has reached a <b>local minimum</b>.", ops: [
        { op: "highlightEdges", edges: [["X1", "X2"], ["X3", "X2"]], cls: "hl" },
        { op: "score", text: "all neighbours: #edges ≥ 2" },
        { op: "badge", text: "local minimum", kind: "bad" } ] },
      { caption: "<b>Result.</b> GSP returns the sparsest minimal I-map it walked to: the collider X1 → X2 ← X3 (2 edges). It reached SP's answer via a short greedy edge-walk instead of enumerating all 6 orders — scalable, and consistent under restricted faithfulness + SMR (weaker than PC). Random restarts / larger d_max guard against poorer local minima.", ops: [
        { op: "highlightEdges", edges: [["X1", "X2"], ["X3", "X2"]], cls: "hl" },
        { op: "score", text: "#edges = 2" },
        { op: "badge", text: "sparsest DAG returned", kind: "good" } ] }
    ]
  },

  complexity: "Far cheaper than exact SP. GSP never enumerates the p! permutations or builds the associahedron; each step lists the covered edges of the current DAG (O(p²) candidates), rebuilds a minimal I-map per candidate, and takes one greedy step. The number of steps is the length of the edge-walk to a local minimum. Search depth d_max controls how much equal-edge lookahead is permitted (d_max = 1 = pure greedy), and random restarts add a constant factor; both trade computation for solution quality. It is a heuristic local search with no guarantee of finding the global sparsest DAG from a single start.",
  strengths: [
    "Much more scalable than SP — a local edge-walk instead of enumerating all p! orderings, so it handles far larger variable sets.",
    "Keeps SP's correctness target: consistent under restricted faithfulness + SMR, weaker assumptions than the full faithfulness PC needs.",
    "Each move is a safe covered-edge reversal that stays within a Markov-equivalence class, with sparsity (edge count) as a clean, score-equivalent objective.",
    "Tunable: search depth d_max and random restarts let it climb out of poor local minima and approach the global sparsest DAG."
  ],
  limitations: [
    "Greedy descent can stop at a local minimum that is not the global sparsest DAG; results depend on the starting permutation (mitigated by d_max and restarts).",
    "Still relies on reliable CI tests to rebuild each minimal I-map; with finite data a per-order DAG can be mis-built.",
    "Repeatedly re-deriving minimal I-maps after each reversal adds overhead compared with operating purely in DAG/CPDAG space.",
    "Like SP it needs SMR for its exactness guarantee, which is strictly stronger than restricted faithfulness — so correctness is not universal."
  ],
  notes: "GSP (Solus et al.) is the greedy, scalable counterpart of Sparsest Permutation: it performs a weakly decreasing edge-walk of covered-edge reversals over the DAG associahedron (Definition 27, Algorithm 65) rather than SP's exhaustive permutation search. Theorem 34 shows covered reversals trace the associahedron's edges, justifying the local move; with depth d_max = 1 GSP is pure greedy descent, larger d_max adds lookahead. The paper contrasts it with equivalence-class (GES-style) searches that move in CPDAG/class space via Meek's rules, whereas GSP works in order space and transitions between Markov-equivalence classes implicitly through reverse-then-rebuild (Remark 17).",
  figureRefs: "Paper §4.52 (pp.250–253): Algorithm 65 (GSP edge-walk), Lemma 15 (permutation → minimal-I-map DAG), Recall 65 (linear extension), Recall 66 (covered edge/arrow), Definition 27 (weakly decreasing edge-walk), Theorem 34 (covered reversals trace edges of the associahedron 𝒜_p(I(P))), Remark 17 (order-space vs class-space search). Figs. 157 (permutohedra 𝒜₃, 𝒜₄), 158 (order-induced parent constraints), 159–160 (permutations → minimal I-maps; contracting the hexagon), 161–163 (local moves and covered-edge reversal), 162 (covered vs noncovered arrows). Animation follows Example 73 (reversing covered edges, order 321 → 132/312, Fig. 163) and Example 74 (a full GSP run on 𝒜₃: start 123, edge-walk to the contracted 132/312 vertex, Fig. 164)."
};
