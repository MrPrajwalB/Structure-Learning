/* B&B — Branch-and-Bound. Grounded in §4.23 (pp.133-136), ref [145] (de Campos et al.).
   Parent-set pruning = Lemmas 3 & 4. Pseudocode = Algorithm 30 (B&B with constraints).
   Optimality = Theorem 11. Worked example = Example 33 over {C,M,D}: caches Fig.12a,
   search tree Fig.74a-h. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["bb"] = {
  name: "Branch-and-Bound (B&B)",
  oneLiner: "An exact, score-based method that explores a tree of partial structures and skips (prunes) any whole branch whose most optimistic possible completion still cannot beat the best complete network found so far — and so is guaranteed to return the globally optimal DAG.",
  basedOnText: "B&B is an exact score-based search: it organises the space of structures as a search tree and uses a cheap-to-compute upper bound to discard branches that provably cannot contain the optimum, rather than enumerating every network.",

  assumptions: [
    "<b>Decomposable score</b> — the network score is a sum of per-node <i>family scores</i> FamScore(X, Pa<sub>X</sub>) (e.g. BIC/MDL/AIC). This is what lets B&B bound a branch by summing the best family score available to each node.",
    "<b>Local scores are precomputable / cacheable</b> — for each variable the family scores of its candidate parent sets can be computed and stored in a cache up front.",
    "<b>Optional indegree limit d</b> — each node may be restricted to at most d parents, shrinking the candidate families per node.",
    "<b>Goal is the true optimum</b> — unlike greedy search, B&B is willing to do more work to <i>prove</i> the network it returns is globally optimal."
  ],
  input: "A dataset 𝒟 over variables V, a decomposable family-scoring function FamScore, and (optionally) a maximum indegree d.",
  output: "The <b>globally optimal DAG</b> under the given constraints — the acyclic structure with the highest total decomposable score (Theorem 11).",

  idea: [
    "Greedy methods can get stuck in local optima; B&B instead searches the structure space <i>systematically</i> but avoids enumerating all of it. Picture a tree whose root allows every variable to take its best parents, and whose branches progressively add constraints (which arcs are forbidden / required). A leaf is a fully-decided, valid DAG.",
    "The trick is the <b>bound</b>. For any partial node in the tree we compute an <i>optimistic</i> score: give every variable the best-scoring parent set still allowed, <b>ignoring the acyclicity requirement</b>. Because we relaxed a constraint, no real DAG inside that branch can ever score higher than this number — it is an upper bound.",
    "We also remember the best complete (acyclic) DAG found so far — the <b>incumbent</b>. Now comes the pruning rule: if a branch's optimistic bound is already ≤ the incumbent, then even its most generous completion loses, so the entire branch is discarded without exploring it (a 'branch cut').",
    "If a partial solution is already a valid DAG, its optimistic bound is exact, so it can directly update the incumbent. If it still contains a directed cycle, B&B <b>branches</b>: it picks a cycle and creates children that each prohibit one arc of that cycle, breaking it different ways. The search ends when the queue is empty; the surviving incumbent is provably optimal.",
    "Before any search, B&B <b>prunes parent sets</b> (Lemmas 3 & 4): a candidate parent set can be deleted from a node's cache if some subset of it already scores at least as well, because the superset can never appear in an optimal network. This dramatically shrinks the tree."
  ],

  steps: [
    "<b>Preprocess — build & prune caches.</b> For each variable X compute FamScore(X, Pa) for its candidate parent sets (respecting any indegree limit d). Then prune by Lemmas 3 & 4: drop any parent set that has a subset scoring as high or higher. The surviving entries are X's cache.",
    "<b>Best feasible family per node.</b> For the root, give each variable its single best-scoring cached parent set, ignoring acyclicity. Score this optimistic graph 𝒢₀ by summing those family scores — an admissible upper bound.",
    "<b>Initialise the queue and incumbent.</b> Push the root state ⟨𝒢₀, no constraints, bound U(𝒢₀)⟩. Set the incumbent (best DAG so far) to −∞ (none yet).",
    "<b>Pop a state.</b> Remove a state ⟨𝒢, constraints, bound⟩ from the queue.",
    "<b>Bound test (the prune step).</b> If the state's bound ≤ the current incumbent, even the best completion of this branch cannot win — <b>prune</b> it and continue. Otherwise keep exploring.",
    "<b>Leaf test.</b> If 𝒢 is already acyclic (a DAG), its bound is exact: update the incumbent to this DAG and continue.",
    "<b>Branch on a cycle.</b> If 𝒢 still has a directed cycle X₁→X₂→…→Xₖ→X₁, create one child per arc of that cycle in which that arc is <b>prohibited</b> (plus a symmetric sibling decision that forbids immediate reversal, to avoid duplicate states). Recompute each child's optimistic bound from the caches and push it.",
    "<b>Repeat</b> popping, bounding, branching until the queue is empty.",
    "<b>Return</b> the incumbent — the proven globally optimal DAG under the constraints (Theorem 11)."
  ],

  keyConcepts: [
    { term: "Family score FamScore(X, Pa_X)", def: "The decomposable per-node contribution of giving X the parent set Pa_X. The total network score is the sum of family scores over all nodes, which is what makes bounding possible." },
    { term: "Cache & parent-set pruning", def: "The stored candidate parent sets and their scores for each node. Lemmas 3 & 4 let B&B delete any parent set whose subset already scores as well, shrinking the search before it begins." },
    { term: "Optimistic upper bound", def: "Give every node its best allowed family score and ignore acyclicity. No real DAG in that branch can beat this number — so it safely upper-bounds the branch." },
    { term: "Incumbent", def: "The best complete (acyclic) DAG found so far. New states are only worth exploring if their bound exceeds it." },
    { term: "Pruning (branch cut)", def: "Discarding a whole branch when its optimistic bound ≤ the incumbent: the most generous completion still loses, so nothing inside can be optimal." },
    { term: "Branching on a cycle", def: "When a partial graph is cyclic, B&B splits it into children that each prohibit one arc of the cycle, breaking the cycle in every possible way and tightening the constraints." },
    { term: "Optimality (Theorem 11)", def: "Because bounds are admissible (never underestimate), every discarded branch is truly hopeless — so the returned incumbent is the global optimum, not just a local one." }
  ],

  animation: {
    title: "B&B on the three-variable example {C, M, D} (paper Example 33; caches Fig. 12a, search tree Fig. 74). Edges show parent → child; numbers are family scores (AIC).",
    nodes: [
      { id: "C", x: 0.18, y: 0.5 },
      { id: "M", x: 0.62, y: 0.5 },
      { id: "D", x: 0.9, y: 0.5 }
    ],
    edges: [
      { from: "M", to: "C", type: "directed" },
      { from: "C", to: "M", type: "directed" }
    ],
    steps: [
      { caption: "<b>Preprocess & prune caches.</b> For each node we keep only the best non-dominated parent sets (Lemmas 3 & 4). cache(C)={∅:−8.64, {M}:−4.50}; cache(M)={∅:−9.15, {C}:−5.01}; cache(D)={∅:−9.15}. The dominated sets {D} and {M,D} for C were pruned away.", ops: [{ op: "set", name: "Incumbent (best DAG)", items: ["none"] }, { op: "badge", text: "caches pruned", kind: "info" }] },
      { caption: "<b>Root state 𝒢₀ — optimistic upper bound.</b> Give each node its best family: C←{M} (−4.50), M←{C} (−5.01), D←∅ (−9.15). Bound = −4.50 + −5.01 + −9.15 = −18.66. But C⇆M is a directed cycle, so 𝒢₀ is NOT a valid DAG.", ops: [{ op: "highlightEdges", edges: [["M", "C"], ["C", "M"]], cls: "hl" }, { op: "score", text: "bound=-18.66  incumbent=-∞" }, { op: "badge", text: "cyclic — not a DAG", kind: "bad" }] },
      { caption: "<b>Pop 𝒢₀ and bound-test.</b> No incumbent yet (−∞), so −18.66 > −∞: the branch is worth exploring. Keep it.", ops: [{ op: "highlightEdges", edges: [["M", "C"], ["C", "M"]], cls: "hl" }, { op: "score", text: "bound=-18.66 > incumbent=-∞" }, { op: "badge", text: "keep branch", kind: "good" }] },
      { caption: "<b>Branch on the cycle C→M→C.</b> Child A: prohibit C→M, so M loses {C} and falls back to ∅ (−9.15); C keeps {M} (−4.50); D ∅ (−9.15). New optimistic bound = −4.50 + −9.15 + −9.15 = −22.80.", ops: [{ op: "removeEdge", from: "C", to: "M" }, { op: "highlightEdges", edges: [["M", "C"]], cls: "hl" }, { op: "score", text: "child A bound=-22.80" }, { op: "badge", text: "prohibit C→M", kind: "info" }] },
      { caption: "<b>Branch on the cycle, other arc.</b> Child B: prohibit M→C, so C loses {M} and falls back to ∅ (−8.64); M keeps {C} (−5.01); D ∅ (−9.15). Optimistic bound = −8.64 + −5.01 + −9.15 = −22.80.", ops: [{ op: "addEdge", from: "C", to: "M", type: "directed" }, { op: "removeEdge", from: "M", to: "C" }, { op: "highlightEdges", edges: [["C", "M"]], cls: "hl" }, { op: "score", text: "child B bound=-22.80" }, { op: "badge", text: "prohibit M→C", kind: "info" }] },
      { caption: "<b>Pop child B — it is acyclic, a real DAG.</b> Its bound is therefore exact. With no incumbent yet, it becomes the new incumbent: C←∅, M←{C}, D←∅, total −22.80.", ops: [{ op: "highlightNodes", ids: ["C", "M", "D"], cls: "hl" }, { op: "score", text: "exact=-22.80 > incumbent=-∞" }, { op: "set", name: "Incumbent (best DAG)", items: ["C←∅", "M←{C}", "D←∅", "score=-22.80"] }, { op: "badge", text: "new incumbent (DAG)", kind: "good" }] },
      { caption: "<b>Pop child A.</b> It is also acyclic (C←{M}, M←∅, D←∅), score −22.80. This is not <i>higher</i> than the incumbent −22.80, so it does not improve the best — discard it.", ops: [{ op: "removeEdge", from: "M", to: "C" }, { op: "addEdge", from: "M", to: "C", type: "directed" }, { op: "removeEdge", from: "C", to: "M" }, { op: "highlightEdges", edges: [["M", "C"]], cls: "hl" }, { op: "score", text: "bound=-22.80 ≤ incumbent=-22.80" }, { op: "badge", text: "no improvement — prune", kind: "bad" }] },
      { caption: "<b>Pruning in action.</b> Any remaining state inherits the prohibitions, so its optimistic bound is at most −22.80 ≤ incumbent. Even the most generous completion cannot beat the incumbent, so the whole branch is cut without expanding it.", ops: [{ op: "score", text: "bound ≤ -22.80 = incumbent" }, { op: "badge", text: "branch cut (pruned)", kind: "bad" }] },
      { caption: "<b>Queue empty → terminate.</b> No state can beat the incumbent, so it is proven globally optimal (Theorem 11). Return the DAG C←∅, M←{C}, D←∅ — i.e. C → M, with D independent.", ops: [{ op: "removeEdge", from: "M", to: "C" }, { op: "addEdge", from: "C", to: "M", type: "directed" }, { op: "highlightNodes", ids: ["C", "M", "D"], cls: "hl" }, { op: "highlightEdges", edges: [["C", "M"]], cls: "hl" }, { op: "set", name: "Incumbent (best DAG)", items: ["C←∅", "M←{C}", "D←∅", "score=-22.80"] }, { op: "badge", text: "proven optimal", kind: "good" }] }
    ]
  },

  complexity: "Worst case is exponential in the number of variables (the structure space is super-exponential), but the bounding function and parent-set pruning prune large parts of the tree, so in practice B&B solves far larger problems than naive enumeration. Quality of the bound and tightness of the indegree limit d drive efficiency; an admissible bound keeps the result exact.",
  strengths: [
    "Exact: returns the globally optimal DAG, with a proof of optimality (Theorem 11), not a local optimum.",
    "The optimistic-bound pruning skips whole branches that provably cannot beat the incumbent, avoiding full enumeration.",
    "Parent-set pruning (Lemmas 3 & 4) shrinks the per-node candidate caches before search even starts.",
    "Works with any decomposable score (BIC/MDL/AIC) and can enforce constraints (forbidden/required arcs, indegree d)."
  ],
  limitations: [
    "Still exponential in the worst case — it can be slow or infeasible on many-variable problems where bounds are loose.",
    "Requires a decomposable score so families can be bounded independently; non-decomposable objectives don't fit.",
    "Memory and runtime depend on the search-tree queue, which can grow large before pruning takes effect.",
    "Effectiveness hinges on how tight the optimistic bound is; a weak bound prunes little."
  ],
  notes: "Related work: Suzuki applied node-by-node parent-set B&B under a fixed ordering for the MDL-optimal network; Malone & Yuan proposed a depth-first B&B that, given a fixed ordering, explores all admissible parent-set choices per variable up to an indegree limit, pruning any partial network whose bound cannot beat the best found. The de Campos et al. formulation searched the space of structures/orderings with admissible bounds for guaranteed optimality.",
  figureRefs: "Paper §4.23 (pp.133–136): Algorithm 30 (B&B with constraints), Lemmas 3 & 4 (parent-set pruning), Theorem 11 (optimality), Example 33 with caches Fig. 12a and search tree Fig. 74a–h."
};
