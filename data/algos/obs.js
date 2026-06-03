/* OBS — Ordering-Based Search. Grounded in §4.15 (pp.98-101):
   Algorithm 21 (OBS), Fig.54 (search over orderings as super-nodes),
   Fig.55 + Example 23 (four-variable walk-through). */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["obs"] = {
  name: "Ordering-Based Search",
  oneLiner: "Search over variable orderings instead of over DAGs: for a fixed order the best network is found cheaply (each node independently picks its best parents from earlier variables), then a greedy local search swaps adjacent variables in the order, keeping each swap that improves the score until no swap helps.",
  basedOnText: "OBS reframes score-based structure learning. Rather than editing one edge at a time in DAG space, it works in the much smaller space of variable orderings — each ordering acts as a 'super-node' whose value is the score of the best DAG consistent with it.",

  assumptions: [
    "<b>Decomposable score</b> — the network score is a sum of per-node 'family' scores (each node plus its parents), e.g. BIC/BDeu. This is what lets the best DAG for an order be found one node at a time.",
    "<b>Consistency with an order</b> — a DAG is consistent with an order π if every edge points forward (a parent always comes before its child). Restricting to such DAGs automatically guarantees acyclicity.",
    "<b>A complete dataset and a chosen scoring function</b>; an optional cap d on the number of parents keeps the parent search tractable."
  ],
  input: "A dataset over variables V, a decomposable score(G | D), and optional settings: a parent-cap d, a tabu tenure K, and a number of random restarts R.",
  output: "A single DAG G — the highest-scoring network found — together with the variable order π that produced it.",

  idea: [
    "The trick behind OBS is that <b>fixing an order makes the best DAG easy to find</b>. If the variables are laid out left-to-right, each node may only take parents from variables to its <i>left</i> (its predecessors). Because the score is decomposable, every node can pick its own best-scoring parent set <i>independently</i> of the others — there is no risk of creating a cycle, so no global search over edges is needed.",
    "So the hard part is no longer 'which edges?' but 'which order?'. OBS treats each ordering as one point in a search space (Fig. 54 draws each order as a 'super-node' whose score is the score of its best DAG) and does an ordinary <b>greedy local search</b> over that space.",
    "The local move is simple: <b>swap two adjacent variables in the order</b>. Each swap only changes which predecessors are available to those two variables, so only their two families have to be re-scored — everything else is untouched, making each neighbour cheap to evaluate.",
    "At every step OBS computes the score change Δ for each admissible adjacent swap, moves to the best <i>improving</i> neighbour, and repeats. When no adjacent swap improves the score, the current order is a <b>local optimum</b> and the search stops. A short <b>tabu list</b> blocks immediately undoing a swap, and <b>random restarts</b> launch the search from several starting orders to escape poor local optima.",
    "Contrast: Hill-Climbing edits one edge of the DAG at a time and must constantly check for cycles; Order-MCMC <i>samples</i> orderings to estimate a posterior. OBS is a <i>greedy</i> (not sampling) search over orderings — it reduces the branching factor from O(n²) single-edge edits in DAG space to O(n) adjacent swaps in order space."
  ],

  steps: [
    "<b>Pick a starting order.</b> Begin each restart from an order π (random or informed by prior knowledge).",
    "<b>Best DAG given the order (inner step).</b> For each variable X, look only at its predecessors in π. Choose the parent set (optionally of size ≤ d) that maximises X's family score. Doing this for every node gives the best DAG consistent with π and its total score s.",
    "<b>List the neighbours.</b> The neighbours of π are the orders reached by swapping one pair of <i>adjacent</i> variables. With n variables there are n−1 such swaps.",
    "<b>Score each swap cheaply.</b> Applying a swap only changes the predecessor sets of the two swapped variables, so re-score just those two families to get the neighbour's score s′ and its delta Δ = s′ − s.",
    "<b>Greedy move (outer step).</b> Among admissible swaps (those not blocked by the tabu list), take the one with the largest <i>positive</i> Δ. Apply it, update the order and its DAG, and add the swap to the tabu list with tenure K so it cannot be immediately reversed.",
    "<b>Repeat</b> steps 3–5 from the new order, decreasing tabu tenures over time, until <b>no admissible swap has a positive Δ</b> — the current order is a local optimum.",
    "<b>Restart and keep the best.</b> Run the whole search R times from different starting orders to diversify, and return the best (order, DAG, score) found across all restarts."
  ],

  keyConcepts: [
    { term: "Variable ordering (π)", def: "A left-to-right arrangement of the variables. It restricts each node to take parents only from variables that come before it, so any consistent DAG is automatically acyclic." },
    { term: "Consistent DAG", def: "A DAG whose every edge points forward in the order. OBS only ever considers DAGs consistent with the current order." },
    { term: "Decomposable score", def: "A score that is the sum of independent per-node family scores. This is the property that lets each node choose its best parents on its own — and lets a single swap re-use all but two of those scores." },
    { term: "Best-DAG-given-order", def: "The inner routine: for the fixed order, each variable independently picks the highest-scoring parent set from its predecessors. The result is the optimal DAG for that order." },
    { term: "Adjacent swap (the local move)", def: "Exchanging two neighbouring variables in the order. It is the only operator OBS uses, and it changes only the two affected families' scores." },
    { term: "Tabu list", def: "A short memory of recent swaps (with tenure K) that forbids immediately undoing a move, preventing the search from cycling between two orders." },
    { term: "Random restarts", def: "Re-launching the search from several starting orders so a single poor local optimum does not determine the final answer." }
  ],

  animation: {
    title: "OBS on the four-variable example {X1,X2,X3,X4} (paper Example 23, Fig. 55).",
    nodes: [
      { id: "X1", x: 0.18, y: 0.30 },
      { id: "X2", x: 0.50, y: 0.30 },
      { id: "X3", x: 0.82, y: 0.30 },
      { id: "X4", x: 0.50, y: 0.78 }
    ],
    edges: [],
    steps: [
      { caption: "<b>Start.</b> Initial order X1 ≺ X2 ≺ X3 ≺ X4. The inner step finds the best DAG consistent with this order — each node takes its best parents from the variables before it. This order scores <b>5</b>.", ops: [
        { op: "set", name: "Order", items: ["X1", "X2", "X3", "X4"] },
        { op: "addEdge", from: "X1", to: "X2" }, { op: "addEdge", from: "X2", to: "X3" }, { op: "addEdge", from: "X1", to: "X3" },
        { op: "score", text: "score = 5" } ] },
      { caption: "<b>Neighbours = adjacent swaps.</b> This order has three neighbours: swap X1↔X2, swap X2↔X3, and swap X3↔X4. We will evaluate the score change Δ for each, re-scoring only the two affected families.", ops: [
        { op: "set", name: "Order", items: ["X1", "X2", "X3", "X4"] },
        { op: "score", text: "score = 5" },
        { op: "badge", text: "3 adjacent swaps to try", kind: "info" } ] },
      { caption: "<b>Try swap X1 ↔ X2.</b> Highlight the adjacent pair, then exchange them. The two affected families are re-scored: the best DAG for X2 ≺ X1 ≺ X3 ≺ X4 scores <b>7</b>, an improvement of Δ = +2.", ops: [
        { op: "highlightNodes", ids: ["X1", "X2"], cls: "hl" },
        { op: "set", name: "Order", items: ["X2", "X1", "X3", "X4"] },
        { op: "removeEdge", from: "X1", to: "X2" }, { op: "addEdge", from: "X2", to: "X1" },
        { op: "removeEdge", from: "X1", to: "X3" }, { op: "addEdge", from: "X2", to: "X4" },
        { op: "score", text: "score = 7" },
        { op: "badge", text: "Δ = +2", kind: "good" } ] },
      { caption: "<b>Try swap X3 ↔ X4</b> (from the original order). Re-scoring its two families gives best score <b>6.5</b>, so Δ = +1.5 — also improving, but smaller than the X1↔X2 swap.", ops: [
        { op: "set", name: "Order", items: ["X1", "X2", "X3", "X4"] },
        { op: "removeEdge", from: "X2", to: "X1" }, { op: "addEdge", from: "X1", to: "X2" },
        { op: "removeEdge", from: "X2", to: "X4" }, { op: "addEdge", from: "X1", to: "X3" },
        { op: "highlightNodes", ids: ["X3", "X4"], cls: "hl" },
        { op: "score", text: "score = 6.5" },
        { op: "badge", text: "Δ = +1.5", kind: "info" } ] },
      { caption: "<b>Try swap X2 ↔ X3</b> (from the original order). Its best DAG scores only <b>2</b>, a delta of Δ = −3 — a non-improving move, so it is rejected.", ops: [
        { op: "highlightNodes", ids: ["X2", "X3"], cls: "hl" },
        { op: "score", text: "score = 2" },
        { op: "badge", text: "Δ = −3 (rejected)", kind: "bad" } ] },
      { caption: "<b>Greedy step.</b> Among the three swaps, X1↔X2 has the largest positive Δ (+2). Accept it: move to order X2 ≺ X1 ≺ X3 ≺ X4 and rebuild its best DAG (score 7). The swap is added to the tabu list.", ops: [
        { op: "highlightNodes", ids: ["X1", "X2"], cls: "hl" },
        { op: "set", name: "Order", items: ["X2", "X1", "X3", "X4"] },
        { op: "removeEdge", from: "X1", to: "X2" }, { op: "addEdge", from: "X2", to: "X1" },
        { op: "removeEdge", from: "X1", to: "X3" }, { op: "addEdge", from: "X2", to: "X4" },
        { op: "score", text: "score = 7" },
        { op: "badge", text: "accept X1↔X2 (Δ=+2)", kind: "good" } ] },
      { caption: "<b>Tabu recorded.</b> The reverse of X1↔X2 is now tabu (tenure K), so the search will not immediately swap back. From this new order we again look at the admissible adjacent swaps.", ops: [
        { op: "set", name: "Order", items: ["X2", "X1", "X3", "X4"] },
        { op: "set", name: "Tabu", items: ["X1↔X2"] },
        { op: "score", text: "score = 7" } ] },
      { caption: "<b>Iterate — try swap X1 ↔ X3.</b> Re-score only the two affected families. The resulting best DAG scores below 7 (Δ < 0), so this swap does not improve and is rejected.", ops: [
        { op: "highlightNodes", ids: ["X1", "X3"], cls: "hl" },
        { op: "score", text: "Δ < 0" },
        { op: "badge", text: "rejected", kind: "bad" } ] },
      { caption: "<b>Iterate — try swap X3 ↔ X4.</b> Again re-score its two families; the delta is non-positive, so this neighbour is rejected too.", ops: [
        { op: "set", name: "Order", items: ["X2", "X1", "X3", "X4"] },
        { op: "highlightNodes", ids: ["X3", "X4"], cls: "hl" },
        { op: "score", text: "Δ < 0" },
        { op: "badge", text: "rejected", kind: "bad" } ] },
      { caption: "<b>Local optimum.</b> Every admissible adjacent swap from X2 ≺ X1 ≺ X3 ≺ X4 has a non-positive Δ, so no move improves the score. The search terminates at this order.", ops: [
        { op: "set", name: "Order", items: ["X2", "X1", "X3", "X4"] },
        { op: "score", text: "score = 7" },
        { op: "badge", text: "local optimum", kind: "good" } ] },
      { caption: "<b>Result.</b> OBS returns the best DAG found — the optimal network consistent with the order X2 ≺ X1 ≺ X3 ≺ X4 (across restarts, the best of all such local optima is kept).", ops: [
        { op: "set", name: "Order", items: ["X2", "X1", "X3", "X4"] },
        { op: "clearSet", name: "Tabu" },
        { op: "highlightEdges", edges: [["X2","X1"],["X1","X3"],["X2","X4"],["X3","X4"]] },
        { op: "score", text: "score = 7" },
        { op: "badge", text: "best DAG returned", kind: "good" } ] }
    ]
  },

  complexity: "The inner step costs one parent search per variable over its predecessors (bounded by the parent-cap d); each adjacent swap then re-scores only the two affected families, so neighbour evaluation is cheap. The local search has O(n) neighbours per step (versus O(n²) single-edge edits in DAG space). Random restarts multiply the cost by R but improve the chance of escaping poor local optima.",
  strengths: [
    "Acyclicity is automatic — restricting edges to point forward in the order means no cycle checks are ever needed.",
    "Cheap moves: a swap only re-scores two families, so the per-step cost is low.",
    "Smaller, smoother search space (orderings) reduces the branching factor and tends to avoid some of the local optima that trap edge-based hill-climbing."
  ],
  limitations: [
    "Still a greedy local search — it can stop at a local optimum, which is why tabu and restarts are needed.",
    "Quality depends on the chosen score being decomposable and on the parent-cap d being large enough.",
    "It searches orderings, not DAGs directly, so the final network is only the best consistent with the order reached, not a global optimum guarantee."
  ],
  notes: "OBS is closely related to Order-MCMC: both work in ordering space, but OBS does greedy deterministic search to find a single high-scoring order, whereas Order-MCMC samples orders to approximate a posterior. Related work (Wang et al.) replaces the greedy outer loop with simulated annealing plus an ensemble-based restart mechanism over orderings.",
  figureRefs: "Paper §4.15 (pp.98–101): Algorithm 21 (OBS), Fig.54 (local search over orderings, each order a super-node), Fig.55 + Example 23 (four-variable walk-through used in this animation)."
};
