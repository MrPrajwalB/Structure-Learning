/* ASOBS — Acyclic Selection Ordering-Based Search. Grounded in §5.10 (pp.351-353):
   the algorithm text (5.10.1), Algorithm 103 (BestDAGGivenOrder inner routine),
   Example 108 (Figs.220a-e neighbour order, Figs.221a-d outer search), Proposition 13.
   Builds on OBS (§4.15). Scanagatta et al. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["asobs"] = {
  name: "Acyclic Selection OBS (ASOBS)",
  oneLiner: "An ordering-based search that drops OBS's strict 'parents must come earlier' rule: for each order it builds the best DAG by visiting nodes in reverse and greedily giving each node its highest-scoring parent set that does not create a cycle — even if that set contains later (back-arc) variables — then swaps adjacent variables in the order just like OBS.",
  basedOnText: "ASOBS extends OBS so that an ordering no longer rigidly fixes the parent–child direction. By scoring candidate parent sets cheaply and then 'acyclically selecting' the best ones that keep the graph a DAG, it builds richer networks per order while still scaling the ordering search to very many variables.",

  assumptions: [
    "<b>Decomposable score</b> — the network score is a sum of per-node family scores (e.g. BIC/BDeu), so each node's candidate parent sets can be scored and ranked independently. This is the property ASOBS exploits to make per-node selection cheap.",
    "<b>Pre-computed / approximately-scored candidate parent sets</b> — for each node a list of promising parent sets (typically capped in size and pruned by score bounds) is prepared in advance, so the inner routine only has to scan a short ranked list rather than all 2ⁿ subsets. This approximate-scoring step is what lets ASOBS handle thousands of variables.",
    "<b>An ordering as a search point</b> — like OBS, ASOBS searches the space of variable orderings, but an order now only biases (not dictates) edge directions: back-arcs against the order are permitted as long as the graph stays acyclic."
  ],
  input: "A dataset over variables V, a decomposable score(G | D), and for each variable a ranked list of candidate parent sets (built with approximate / bounded scoring). Optional OBS-style settings: a tabu tenure and random restarts.",
  output: "A single DAG G — the best acyclic network found — together with the order π that produced it. By Proposition 13 its score is at least as high as the DAG OBS would return for the same order.",

  idea: [
    "OBS uses an order as a hard 'only-predecessors' constraint: a node may only take parents from variables before it. That guarantees acyclicity for free, but it can lock the search out of high-scoring networks just because a good parent happens to sit later in the order. <b>ASOBS relaxes this constraint</b>: an order still guides the search, but a node is allowed to take a parent that comes <i>after</i> it — a <b>back-arc</b> — provided the overall graph stays a DAG.",
    "The first ingredient is <b>cheap (approximate) scoring of candidate parent sets</b>. For every node, ASOBS prepares a short list of promising parent sets, each with its family score, ranked best-first. Independence-style bounds let it prune sets that cannot beat what is already found, so the list stays small even when there are thousands of variables — this is what makes the per-node search affordable at scale.",
    "The second ingredient is the <b>acyclic selection</b> routine (Algorithm 103, <i>BestDAGGivenOrder</i>). It walks the nodes in <b>reverse order</b> and, for each node, scans its ranked candidate parent sets from best to worst, <b>adding the first one whose edges do not create a directed cycle</b> in the graph built so far. A top-scoring set that would close a cycle is skipped in favour of the next feasible (lower-scoring) set. Because acyclicity is checked greedily as edges are added, the result is always a valid DAG.",
    "The <b>outer search mirrors OBS</b>. Each ordering is one point in the search space; its value is the score of the acyclic network the selection routine builds for it. ASOBS lists the adjacent-swap neighbours of the current order, builds the best acyclic network for each (re-using the reverse-selection routine), and greedily takes the swap with the largest positive Δscore — using a tabu list to avoid immediately reversing a move, and stopping at a local optimum when no swap improves.",
    "Why it scales and why it wins: the short, pre-scored candidate lists keep per-node work tiny (handling huge variable counts), while the back-arc freedom means that for any fixed order ASOBS never does worse than OBS and often does better — Proposition 13 states its per-order score is always at least OBS's."
  ],

  steps: [
    "<b>Prepare candidate parent sets (approximate scoring).</b> For each variable, compute family scores for promising parent sets, prune with score bounds, and store a short list ranked best-first. This pre-computation is shared across all orders and is what keeps ASOBS tractable on thousands of variables.",
    "<b>Pick a starting order π.</b> Begin (each restart) from an order — random or informed by prior knowledge.",
    "<b>Build the best acyclic network for π — acyclic selection (Algorithm 103).</b> Start from an empty DAG and process the nodes <b>in reverse order of π</b>.",
    "<b>For each node, greedily select.</b> Scan that node's ranked candidate parent sets from best to worst and <b>add the first set whose edges create no directed cycle</b> in the graph so far. This set may include variables that come later in π (a back-arc) — allowed as long as acyclicity holds.",
    "<b>Reject cycle-forming choices.</b> If the top-scoring parent set would close a cycle, skip it and move on to the next-best feasible set (possibly the empty set). Record the chosen edges and the order's total score.",
    "<b>List the neighbours.</b> The neighbours of π are the orders reached by swapping one pair of <i>adjacent</i> variables (n−1 of them) — exactly the OBS move.",
    "<b>Score each swap.</b> For every adjacent swap, rebuild the best acyclic network with the reverse-selection routine and read off its score s′ and delta Δ = s′ − s.",
    "<b>Greedy move + tabu.</b> Among admissible swaps (not blocked by the tabu list) take the one with the largest <i>positive</i> Δ; apply it, update the order and its network, and add the swap to the tabu list so it cannot be immediately undone.",
    "<b>Repeat</b> the swap-and-rebuild loop until <b>no admissible swap improves the score</b> — a local optimum. Optionally restart from other orders and keep the best (order, DAG, score) found."
  ],

  keyConcepts: [
    { term: "Back-arc", def: "An edge that points 'backwards' relative to the order — i.e. a node taking a parent that appears after it in π. OBS forbids these; ASOBS allows them whenever they keep the graph acyclic, which is the source of its higher scores." },
    { term: "Approximate / bounded parent-set scoring", def: "Pre-computing a short, score-ranked list of promising parent sets per node and pruning the rest with score bounds, instead of evaluating every subset. This cheap scoring is what lets ASOBS handle thousands of variables." },
    { term: "Acyclic selection (BestDAGGivenOrder, Alg. 103)", def: "The inner routine: process nodes in reverse order of π and give each node the first (highest-scoring) candidate parent set whose edges introduce no directed cycle — guaranteeing the result is a DAG." },
    { term: "Reverse processing", def: "Nodes are visited from the end of the order toward the start. Combined with the cycle check, this ordering of the greedy selection is what makes the back-arc relaxation safe and well-defined." },
    { term: "Cycle check", def: "Before committing a candidate parent set, ASOBS verifies that adding its edges to the partially-built DAG creates no directed cycle; if it would, the set is rejected for the next-best feasible one." },
    { term: "Adjacent swap (outer move)", def: "Exchanging two neighbouring variables in the order — the same local move as OBS. Each swap is evaluated by rebuilding the best acyclic network for the new order." },
    { term: "Tabu list", def: "A short memory of recent swaps that forbids immediately reversing a move, preventing the outer search from cycling between two orders (inherited from OBS)." }
  ],

  animation: {
    title: "ASOBS on the four-variable example {X1,X2,X3,X4} (paper Example 108, Figs. 220–221).",
    nodes: [
      { id: "X1", x: 0.16, y: 0.32 },
      { id: "X2", x: 0.44, y: 0.32 },
      { id: "X3", x: 0.84, y: 0.32 },
      { id: "X4", x: 0.62, y: 0.78 }
    ],
    edges: [],
    steps: [
      { caption: "<b>Start.</b> Current order X1 ≺ X2 ≺ X3 ≺ X4 scores <b>5</b>. ASOBS will explore its adjacent-swap neighbours; we follow one of them, the right neighbour obtained by swapping X3 ↔ X4 (Fig. 220a).", ops: [
        { op: "set", name: "Order", items: ["X1", "X2", "X3", "X4"] },
        { op: "score", text: "current order score = 5" },
        { op: "badge", text: "neighbour: swap X3 ↔ X4", kind: "info" } ] },
      { caption: "<b>Neighbour order.</b> After the swap the order is X1 ≺ X2 ≺ X4 ≺ X3. To score it, ASOBS builds the best acyclic DAG using the inner routine (Algorithm 103), which processes nodes in <b>reverse order</b>: X3, then X4, then X2, then X1.", ops: [
        { op: "set", name: "Order", items: ["X1", "X2", "X4", "X3"] },
        { op: "badge", text: "acyclic selection (reverse)", kind: "info" } ] },
      { caption: "<b>Reverse step 1 — process X3.</b> Scan X3's ranked candidate parent sets. The best is Pa(X3) = {X4}; adding X4 → X3 creates no cycle, so it is selected (Fig. 220b).", ops: [
        { op: "highlightNodes", ids: ["X3"], cls: "hl" },
        { op: "score", text: "best candidate Pa(X3) = {X4}" },
        { op: "addEdge", from: "X4", to: "X3" },
        { op: "badge", text: "X4 → X3 added (acyclic)", kind: "good" } ] },
      { caption: "<b>Reverse step 2 — process X4.</b> X4's best candidate parent set is empty, so no edge is added for X4 (Fig. 220b).", ops: [
        { op: "highlightNodes", ids: ["X4"], cls: "hl" },
        { op: "score", text: "best candidate Pa(X4) = ∅" },
        { op: "badge", text: "no parents for X4", kind: "info" } ] },
      { caption: "<b>Reverse step 3 — process X2.</b> X2's top-scoring candidate is {X1, X3}. Both edges X1 → X2 and the <b>back-arc</b> X3 → X2 are added — X3 comes later in the order, but the edge is allowed because it forms no cycle (Fig. 220c).", ops: [
        { op: "highlightNodes", ids: ["X2"], cls: "hl" },
        { op: "score", text: "best candidate Pa(X2) = {X1, X3}" },
        { op: "addEdge", from: "X1", to: "X2" },
        { op: "addEdge", from: "X3", to: "X2" },
        { op: "badge", text: "back-arc X3 → X2 allowed (no cycle)", kind: "good" } ] },
      { caption: "<b>Reverse step 4 — process X1, cycle rejected.</b> X1's top candidate is {X2, X3}. Adding X2 → X1 would create a cycle X1 → X2 → X1, so this set is <b>rejected</b> (Fig. 220d).", ops: [
        { op: "highlightNodes", ids: ["X1"], cls: "hl" },
        { op: "score", text: "top candidate Pa(X1) = {X2, X3} ✗" },
        { op: "badge", text: "would create cycle X1→X2→X1 — rejected", kind: "bad" } ] },
      { caption: "<b>Next feasible set for X1.</b> ASOBS moves to X1's next-best candidate that stays acyclic, e.g. {X3}; the edge X3 → X1 is added (Fig. 220d).", ops: [
        { op: "highlightNodes", ids: ["X1"], cls: "hl" },
        { op: "score", text: "next feasible Pa(X1) = {X3}" },
        { op: "addEdge", from: "X3", to: "X1" },
        { op: "badge", text: "X3 → X1 added (acyclic)", kind: "good" } ] },
      { caption: "<b>Best acyclic network for this order.</b> The selection routine returns a valid DAG that contains back-arcs (X3 → X2, X3 → X1) — something OBS could never build for this order. Its score is <b>8</b>, an improvement of Δ = +3 over the current order (Fig. 220e / 221a).", ops: [
        { op: "highlightEdges", edges: [["X4","X3"],["X1","X2"],["X3","X2"],["X3","X1"]] },
        { op: "score", text: "score = 8" },
        { op: "badge", text: "Δscore = +3", kind: "good" } ] },
      { caption: "<b>Greedy step (outer search, like OBS).</b> Across all adjacent swaps of the current order, X3 ↔ X4 yields the largest positive Δscore, so ASOBS performs it and updates the order to X1 ≺ X2 ≺ X4 ≺ X3. The swap is recorded in the tabu list (Fig. 221b).", ops: [
        { op: "set", name: "Order", items: ["X1", "X2", "X4", "X3"] },
        { op: "set", name: "Tabu", items: ["X3↔X4"] },
        { op: "score", text: "accepted swap, score = 8" },
        { op: "badge", text: "accept X3 ↔ X4 (Δ = +3)", kind: "good" } ] },
      { caption: "<b>Next iteration.</b> From the new order ASOBS lists the admissible adjacent swaps (respecting the tabu constraint) and, for each, rebuilds the best acyclic network with the reverse-selection routine to get its score (Fig. 221c).", ops: [
        { op: "set", name: "Order", items: ["X1", "X2", "X4", "X3"] },
        { op: "highlightNodes", ids: ["X2", "X4"], cls: "hl" },
        { op: "score", text: "re-score each swap's acyclic network" },
        { op: "badge", text: "admissible swaps only (tabu blocks X3↔X4)", kind: "info" } ] },
      { caption: "<b>Termination — local optimum.</b> Every admissible swap now has a non-positive Δscore, so no move improves the network. The search stops at this order (Fig. 221d).", ops: [
        { op: "set", name: "Order", items: ["X1", "X2", "X4", "X3"] },
        { op: "highlightEdges", edges: [["X4","X3"],["X1","X2"],["X3","X2"],["X3","X1"]] },
        { op: "score", text: "score = 8" },
        { op: "badge", text: "local optimum reached", kind: "good" } ] },
      { caption: "<b>Result & scaling.</b> ASOBS returns this acyclic network. Because parent sets are pre-scored and pruned into short ranked lists, the per-node selection stays cheap even with thousands of variables; and by allowing back-arcs the result is never worse than OBS for the same order (Proposition 13).", ops: [
        { op: "clearSet", name: "Tabu" },
        { op: "highlightEdges", edges: [["X4","X3"],["X1","X2"],["X3","X2"],["X3","X1"]] },
        { op: "score", text: "best DAG returned (score = 8)" },
        { op: "badge", text: "scales to thousands of variables", kind: "good" } ] }
    ]
  },

  complexity: "The expensive part — scoring candidate parent sets — is pre-computed once and pruned into short ranked lists, so the inner acyclic-selection routine only scans a few candidates per node and runs a cycle check before each addition. The outer search has O(n) adjacent-swap neighbours per step (as in OBS), each evaluated by one reverse-selection pass. Together this keeps ASOBS practical on problems with thousands of variables; restarts multiply cost but improve robustness.",
  strengths: [
    "Scales to very large numbers of variables: approximate, bounded parent-set scoring keeps per-node candidate lists short.",
    "Never worse than OBS for a given order (Proposition 13) — back-arcs let it reach networks OBS's order constraint forbids.",
    "Always returns a valid DAG: the greedy cycle check during selection guarantees acyclicity without a separate repair step.",
    "Reuses OBS's lightweight ordering search (adjacent swaps, tabu, restarts)."
  ],
  limitations: [
    "Still a greedy local search over orderings — it can stop at a local optimum (mitigated by tabu and restarts).",
    "Quality depends on the candidate parent-set lists: if approximate scoring/pruning discards a good set, the selection can never pick it.",
    "The per-node selection is greedy (best feasible set first), so it is not guaranteed to find the globally optimal acyclic network for an order.",
    "Requires a decomposable score so parent sets can be scored independently."
  ],
  notes: "ASOBS (Scanagatta et al.) is the engine behind very-large-scale Bayesian-network learning: it combines OBS's ordering search with an acyclic-selection inner routine that permits back-arcs. Its defining contrast with OBS is exactly that relaxation — OBS treats the order as a hard 'only earlier variables may be parents' rule, whereas ASOBS treats it only as a bias and selects the best acyclic parent sets, which Proposition 13 shows can only help.",
  figureRefs: "Paper §5.10 (pp.351–353): 5.10.1 (the algorithm), Algorithm 103 (BestDAGGivenOrder inner routine), Example 108 with Figs. 220a–e (acyclic selection for a neighbour order, incl. back-arcs) and Figs. 221a–d (outer swap search and local optimum), Proposition 13 (ASOBS ≥ OBS for any fixed order)."
};
