/* OptOrd — Optimal Order, exact dynamic-programming structure learning.
   Grounded in §4.16 (pp.102-107): Lemma 2 (every DAG has a leaf), the leaf-based
   score recursion, Algorithm 22 (OptOrd), and the worked Example 24 on the
   four-variable family {B,C,M,D} with BIC family scores (Figs.56-59). Method due
   to Singh & Moore [593], 2005. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["optord"] = {
  name: "OptOrd (Optimal Order)",
  oneLiner: "An exact dynamic-programming method that finds the single globally optimal Bayesian network by building the best structure for tiny sets of variables first, then reusing those answers to solve ever-larger sets — like filling a table where each cell reuses smaller cells already computed.",
  basedOnText: "OptOrd is the archetypal <i>exact</i> score-based method: instead of searching heuristically, it guarantees the highest-scoring DAG by dynamic programming over the lattice of variable subsets. It is grounded in the idea that every acyclic graph must have a leaf (a node with no children), which lets the score of a whole network be split into the score of one leaf plus the optimal score of everything else.",

  assumptions: [
    "<b>Decomposable score</b> — the network score is the sum of independent per-node 'family scores' (e.g. BIC), one for each node given its parents. This is what makes the leaf-splitting recursion valid.",
    "<b>Modest number of variables</b> — the method is exact but its work grows like 2<sup>n</sup> (it visits every subset of variables), so it is practical only for small n (roughly a couple of dozen variables at most).",
    "<b>Full data / computable scores</b> — every candidate family score FamScore(X, U) can be evaluated from the data."
  ],
  input: "A dataset 𝒟 over variables V and a decomposable family-score function FamScore(X, U | 𝒟) giving the score of node X with parent set U.",
  output: "A single <b>globally optimal DAG</b> G* — the DAG with the highest possible total score (not just a local optimum, not an equivalence class).",

  idea: [
    "Score-based learning wants the DAG with the best total score. There are super-exponentially many DAGs, so checking them all is hopeless. OptOrd avoids that by exploiting one simple fact: <b>every acyclic graph has at least one leaf</b> — a node that has no children (Lemma 2).",
    "That fact lets us peel a network apart. Pick a leaf X. Its contribution is just its own family score FamScore(X, parents-of-X). Everything else forms a smaller network over the remaining variables. So the best score for a set of variables = (best family score for some chosen leaf X, with its parents drawn from the rest) + (best score for the rest of the set). This is a recursion that calls itself on a smaller set.",
    "<b>Two precomputed ingredients.</b> First, for every node X and every candidate parent set U, the local family score FamScore(X, U) is computed and cached. Second, dynamic programming over the <i>subset lattice</i>: start with the empty set and single variables (trivial base cases), then build the best score DP[S] for pairs, then triples, then quadruples — all the way up to the full set V. Each DP[S] reuses smaller DP values already in the table, so nothing is recomputed.",
    "Think of it as filling a table indexed by subsets of variables, from smallest to largest. To fill the cell for a set S, you try each variable in S as the 'last' (leaf) variable, give it its best parents from the others, add the already-known best score of the rest (DP[S minus that variable]), and keep the winner. When the cell for the full set V is filled, you read off the winning leaf at each level — that recovers the optimal ordering and the globally optimal DAG by backtracking.",
    "Because each subproblem is solved once and reused, OptOrd turns a super-exponential search into 'only' an exponential one (≈2<sup>n</sup>) — still exact, still the guaranteed optimum, but now feasible for small n."
  ],

  steps: [
    "<b>Precompute local family scores.</b> For every node X and every admissible candidate parent set U ⊆ V∖{X}, compute and cache FamScore(X, U | 𝒟). (Optional pruning/branch-and-bound can skip provably bad parent sets.)",
    "<b>Initialise the DP table.</b> Set DP[∅] = 0 and set DP[S] = −∞ for all other subsets. The empty set has score zero — the base case of the recursion.",
    "<b>Sweep subsets by increasing size.</b> Process subsets S of V from |S| = 1 upward (singletons, then pairs, then triples, …), so that whenever you need a smaller subset's answer it is already in the table.",
    "<b>Choose the best leaf for S.</b> For the current subset S, try each candidate X in S as the leaf. Its value is FamScore(X, U) — its best family score using parents U drawn from S∖{X} — plus DP[S∖{X}], the already-stored optimal score of the rest.",
    "<b>Store the winner.</b> DP[S] = the maximum of those candidate values over all X in S, and remember in Arg[S] which leaf X achieved that maximum (and its chosen parent set).",
    "<b>Reach the full set.</b> Continue until DP[V] is filled — this is the score of the globally optimal network over all variables.",
    "<b>Backtrack to recover G*.</b> Starting from S = V, read the winning leaf X = Arg[S], add its optimal parents into the DAG, then drop X (S = S∖{X}) and repeat down to the empty set. The orderings collected this way give the optimal variable order; the families give the globally optimal DAG G*."
  ],

  keyConcepts: [
    { term: "Decomposable / family score", def: "A total network score that splits into a sum of per-node terms FamScore(X, parents). BIC is the example used in the paper. Decomposability is what lets the score be split leaf-by-leaf." },
    { term: "Leaf (Lemma 2)", def: "A node with no children. Every acyclic directed graph has at least one. Removing a leaf leaves a smaller acyclic graph — the key that turns scoring into a recursion." },
    { term: "Subset lattice", def: "All subsets of the variables, ordered by inclusion (∅ at the bottom, V at the top). OptOrd fills a DP value for each subset, from small to large." },
    { term: "DP[S]", def: "The best achievable total score for a Bayesian network restricted to just the variables in subset S. Computed once, reused many times." },
    { term: "Arg[S]", def: "A bookkeeping table storing which leaf variable (and its best parents) achieved DP[S], so the optimal DAG can be reconstructed by backtracking." },
    { term: "Exact vs. heuristic", def: "OptOrd returns the provably highest-scoring DAG (exact). The cost is ≈2ⁿ work, so it is limited to a modest number of variables, unlike heuristic hill-climbing." }
  ],

  animation: {
    title: "OptOrd on the paper's four-variable example {B,C,M,D} with BIC family scores (Example 24, Figs.56-59).",
    nodes: [
      { id: "B", x: 0.18, y: 0.30 },
      { id: "C", x: 0.82, y: 0.30 },
      { id: "M", x: 0.50, y: 0.08 },
      { id: "D", x: 0.50, y: 0.85 }
    ],
    edges: [],
    steps: [
      { caption: "<b>Goal.</b> Find the single best-scoring DAG over {B,C,M,D}. OptOrd will fill a table of best scores for every subset, from singletons up to the full set, reusing smaller answers. No edges yet.", ops: [{ op: "badge", text: "exact DP", kind: "info" }] },
      { caption: "<b>Precompute local family scores.</b> For each node and each candidate parent set, cache FamScore(X, U). E.g. FamScore(C, {B}) and FamScore(C, ∅) are computed once and reused everywhere.", ops: [{ op: "highlightNodes", ids: ["B","C","M","D"], cls: "hl" }, { op: "score", text: "cache FamScore(X,U) for all X,U" }] },
      { caption: "<b>Base cases — |S| = 1.</b> The four singleton subsets are trivial: a lone variable has no parents, so DP[{X}] = FamScore(X, ∅). Fill DP[{B}], DP[{C}], DP[{M}], DP[{D}].", ops: [{ op: "set", name: "Subset", items: ["{B}","{C}","{M}","{D}"] }, { op: "score", text: "DP[{X}] = FamScore(X, ∅)" }, { op: "badge", text: "|S| = 1", kind: "info" }] },
      { caption: "<b>|S| = 2, subset {B,C}.</b> Try C as the leaf: its parents may be ∅ or {B}, so take the better of FamScore(C,{B}) and FamScore(C,∅), then add DP[{B}]. Candidate score for leaf C.", ops: [{ op: "set", name: "Subset", items: ["{B,C}"] }, { op: "highlightNodes", ids: ["C"], cls: "leaf" }, { op: "score", text: "leaf C: max(FamScore(C,{B}),FamScore(C,∅)) + DP[{B}]" }] },
      { caption: "<b>|S| = 2, subset {B,C} cont.</b> Now try B as the leaf instead, with C as possible parent, plus DP[{C}]. DP[{B,C}] keeps whichever leaf wins, recorded in Arg[{B,C}]. All six pairs are filled this way.", ops: [{ op: "highlightNodes", ids: ["B"], cls: "leaf" }, { op: "score", text: "DP[{B,C}] = max over leaf ∈ {B,C}" }, { op: "badge", text: "|S| = 2", kind: "info" }] },
      { caption: "<b>|S| = 3, subset {B,C,M}.</b> Try M as the leaf: best parents drawn from {B,C}, added to the already-stored DP[{B,C}]. The smaller answer is reused — no recomputation.", ops: [{ op: "set", name: "Subset", items: ["{B,C,M}"] }, { op: "highlightNodes", ids: ["M"], cls: "leaf" }, { op: "score", text: "leaf M: best parents ⊆ {B,C} + DP[{B,C}]" }] },
      { caption: "<b>|S| = 3 cont.</b> Also try C as the leaf (parents from {B,M}) and B as the leaf (parents from {C,M}). Compare the three candidates; DP[{B,C,M}] stores the maximum and Arg records the winning leaf.", ops: [{ op: "highlightNodes", ids: ["B","C"], cls: "leaf" }, { op: "score", text: "DP[{B,C,M}] = max over leaf ∈ {B,C,M}" }, { op: "badge", text: "|S| = 3", kind: "info" }] },
      { caption: "<b>All triples filled.</b> The same leaf comparison fills DP[{B,C,D}], DP[{B,M,D}], DP[{C,M,D}], each reusing pair-level results. The DP table now holds best scores for every subset below the full set.", ops: [{ op: "set", name: "Subset", items: ["{B,C,M}","{B,C,D}","{B,M,D}","{C,M,D}"] }, { op: "score", text: "every triple reuses a stored pair" }] },
      { caption: "<b>|S| = 4 — the full set {B,C,M,D}.</b> Try each variable as the final leaf: its best parents from the other three, plus that triple's stored DP value. Here D wins as the optimal leaf with parents {B,C}. Add D ← B and D ← C.", ops: [{ op: "set", name: "Subset", items: ["{B,C,M,D}"] }, { op: "highlightNodes", ids: ["D"], cls: "leaf" }, { op: "score", text: "DP[V] = max over leaf ∈ {B,C,M,D}; leaf = D, parents {B,C}" }, { op: "addEdge", from: "B", to: "D" }, { op: "addEdge", from: "C", to: "D" }, { op: "orient", from: "B", to: "D", type: "directed" }, { op: "orient", from: "C", to: "D", type: "directed" }, { op: "badge", text: "|S| = 4 · DP[V] set", kind: "good" }] },
      { caption: "<b>Backtrack — remove the leaf D.</b> With D placed, drop to the stored answer for {B,C,M}. Its winning leaf is C, whose optimal parent is B. Add C ← B.", ops: [{ op: "set", name: "Subset", items: ["{B,C,M}"] }, { op: "highlightNodes", ids: ["C"], cls: "leaf" }, { op: "addEdge", from: "B", to: "C" }, { op: "orient", from: "B", to: "C", type: "directed" }, { op: "score", text: "Arg[{B,C,M}] = leaf C, parent {B}" }] },
      { caption: "<b>Backtrack — remove C.</b> Drop to {B,M}. Its winning leaf is M with parent B. Add M ← B. Only {B} remains, a base case with no parents — backtracking is complete.", ops: [{ op: "set", name: "Subset", items: ["{B,M}"] }, { op: "highlightNodes", ids: ["M"], cls: "leaf" }, { op: "addEdge", from: "B", to: "M" }, { op: "orient", from: "B", to: "M", type: "directed" }, { op: "score", text: "Arg[{B,M}] = leaf M, parent {B}" }] },
      { caption: "<b>Result — the globally optimal DAG G*.</b> B → C, B → M, B → D, C → D. This is the provably highest-scoring network over {B,C,M,D}; every subset answer was computed once and reused. Exact, but cost ≈2ⁿ limits it to small n.", ops: [{ op: "highlightNodes", ids: ["B","C","M","D"], cls: "good" }, { op: "badge", text: "optimal G* returned", kind: "good" }] }
    ]
  },

  complexity: "Exact but exponential: the DP visits every one of the 2ⁿ variable subsets, and for each it considers each member as the leaf with its best parent set — roughly O(n·2ⁿ) subproblems plus the cost of precomputing local family scores. Memory also grows with the number of subsets stored. This confines OptOrd to a modest number of variables (typically up to a couple of dozen), in exchange for a guaranteed global optimum.",
  strengths: [
    "Returns the provably globally optimal DAG — no local optima, unlike heuristic search.",
    "Each subproblem is solved once and reused, so it is far cheaper than enumerating all DAGs.",
    "Works with any decomposable score (e.g. BIC) and supports pruning / branch-and-bound to skip hopeless parent sets."
  ],
  limitations: [
    "Scales like 2ⁿ in both time and memory, so it is feasible only for a small number of variables.",
    "Requires a decomposable score; relies on precomputing many local family scores, which itself can be costly.",
    "Returns one optimal DAG rather than the whole Markov-equivalence class (equivalence-class variants exist in related work)."
  ],
  notes: "OptOrd is the dynamic-programming method of Singh and colleagues [593] (Singh & Moore, 2005). Related work extends the idea: Ott et al. [509] used two nested DP tables (one for parent choice, one for the variable order); Tamada et al. [620] parallelised the order-search scheme by partitioning the subset lattice; Koivisto & Sood [341] and Parviainen & Koivisto [521] derived variants that work at the equivalence-class level or perform full Bayesian post-processing (edge/ancestral probabilities) on top of the DP machinery.",
  figureRefs: "Paper §4.16 (pp.102-107): Lemma 2 (leaf existence) and the leaf-based score recursion; Algorithm 22 (OptOrd); Example 24 on {B,C,M,D}; Fig.56 (leaf-based score decomposition), Fig.57 (|S|=1,2 base cases and pairs), Fig.58 (|S|=3 triple layer), Fig.59 (|S|=4 full layer, backtracking, reconstruction of optimal G*)."
};
