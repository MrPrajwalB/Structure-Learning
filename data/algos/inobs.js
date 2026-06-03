/* INOBS — Neighborhood Ordering-Based Search (Lee & van Beek). Grounded in §5.11
   (pp.354-355): the algorithm description in §5.11.1, Example 109 (four-variable
   walk-through), and Fig.232 (the insert-move neighborhood with two improving
   insertions interleaved with two non-improving attempts, reaching a local optimum). */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["inobs"] = {
  name: "Neighborhood Ordering-Based Search (INOBS)",
  oneLiner: "An improvement on Ordering-Based Search (OBS): instead of OBS's swap-adjacent move, INOBS uses an INSERT move — pull one variable out of the order and reinsert it at any other index — together with tailored neighbour-selection rules, so it can make long-range order changes in a single step and escape the local optima and plateaus that trap OBS.",
  basedOnText: "INOBS keeps OBS's core idea — search over variable orderings, where each order's value is the score of its best DAG — but enlarges the neighbourhood. The paper states it 'modifies OBS by replacing the swap-adjacent neighborhood with an insert move and by using tailored neighbor-selection rules to mitigate local optima and plateaus.'",

  assumptions: [
    "<b>Decomposable score</b> — the network score is a sum of per-node family scores (each node plus its parents), e.g. BIC/BDeu. As in OBS, this is what lets the best DAG for a given order be found one node at a time, and lets a move re-score only the families that actually changed.",
    "<b>Consistency with an order</b> — a state is a total order π over V, scored by the best DAG whose edges all point forward in π. Because every edge respects the order, the DAG is acyclic by construction — even after an insert move.",
    "<b>A complete dataset and a chosen scoring function</b>; an optional cap on the number of parents keeps the per-node parent search tractable."
  ],
  input: "A dataset over variables V and a decomposable score(G | D) (plus an optional parent-cap). Like OBS, the search is launched from one or more starting orders.",
  output: "A single DAG G — the highest-scoring network found — together with the variable order π that produced it (a local optimum under the insert neighbourhood).",

  idea: [
    "INOBS starts from exactly the OBS setup: a <b>state is a total order π over V</b>, and its score is the score of the best DAG consistent with that order (each node independently picks its best parents from the variables before it). The only thing INOBS changes is <i>how it moves between orders</i>.",
    "OBS's move is the <b>swap-adjacent</b> step: exchange two neighbouring variables. That is cheap, but it can only nudge the order by one position at a time, so getting a variable from one end of the order to the other needs many swaps — and the intermediate orders may all score worse, forming a plateau or local optimum that OBS cannot cross.",
    "INOBS's move is the <b>insert</b> move: <i>remove one variable from its current position and reinsert it at another index</i>. A single insert can move a variable many positions at once, making 'longer-range changes to the precedence constraints' (the paper's words). This reaches promising orders that would require multiple swaps — orders that are simply not in OBS's one-step neighbourhood.",
    "On top of the bigger neighbourhood, INOBS uses <b>tailored neighbour-selection rules</b> to traverse it without examining every insertion: <b>best improvement</b> (pick the highest-scoring neighbour), <b>first improvement</b> (scan neighbours in random order and take the first that improves), and a <b>hybrid rule</b> that first <i>samples</i> a variable and then tests all of <i>its</i> insertion positions, taking the best improving placement if one exists.",
    "Contrast with OBS: same ordering space and same automatic acyclicity, but a richer move operator. Where OBS can stall because no single adjacent swap helps, INOBS can jump — via one insert — to a better order, so it tends to find higher-scoring structures."
  ],

  steps: [
    "<b>Start from an order.</b> Pick a starting total order π over V. Compute its best DAG (each node takes its best parents from its predecessors) and the order's score s.",
    "<b>Define the neighbourhood = insert moves.</b> A neighbour of π is obtained by removing one variable from its position and reinserting it at some other index j. This is the key change from OBS, whose neighbourhood was only the adjacent swaps.",
    "<b>Score a candidate insert cheaply.</b> Reinserting a variable only changes which predecessors are available to it (and to the variables it passes over), so only those families need re-scoring to get the neighbour's score s′ and its delta Δ = s′ − s.",
    "<b>Choose a neighbour with a selection rule.</b> Use one of: <i>best improvement</i> (evaluate insertions and take the highest-scoring one), <i>first improvement</i> (random scan, take the first improving insertion), or the <i>hybrid rule</i> (sample one variable, evaluate all of its insertion positions, take its best improving placement).",
    "<b>Move if it improves.</b> If the chosen insert has Δ > 0, apply it: update the order, rebuild its best DAG, and continue from there. A single such move can change the order by several positions — something OBS would need many swaps to achieve.",
    "<b>Handle plateaus / no-improvement steps.</b> If a sampled variable admits no improving insertion (Δ ≤ 0 everywhere for it), resample another variable rather than stopping immediately. The wider insert neighbourhood gives more chances to find an improving move and to step off a plateau.",
    "<b>Stop at a local optimum.</b> When no insertion of any variable improves the score, the current order is a local optimum under the insert neighbourhood. Return its best DAG (over restarts, keep the best such optimum)."
  ],

  keyConcepts: [
    { term: "Total order π (state)", def: "A left-to-right arrangement of the variables. Its value is the score of the best DAG whose edges all point forward in π — identical to OBS's notion of a state." },
    { term: "Best DAG given the order", def: "The inner routine inherited from OBS: for the fixed order, every variable independently picks its highest-scoring parent set from its predecessors, giving the optimal acyclic DAG for that order." },
    { term: "Insert move (INOBS's neighbourhood)", def: "Remove one variable from its index and reinsert it at another index. This replaces OBS's swap-adjacent move and lets a single step make a long-range precedence change." },
    { term: "Swap-adjacent move (OBS's neighbourhood)", def: "Exchanging two neighbouring variables — OBS's only operator. It changes the order by one position at a time, so it cannot reach in one step the orders an insert can." },
    { term: "Best improvement", def: "A selection rule: evaluate candidate neighbours and move to the highest-scoring one." },
    { term: "First improvement", def: "A selection rule: scan neighbours in random order and take the first one that improves the score." },
    { term: "Hybrid rule", def: "INOBS's combined rule: sample a single variable, then test all of that variable's insertion positions and take its best improving placement if one exists." },
    { term: "Plateau / local optimum", def: "A region where adjacent swaps do not help. Insert moves and resampling let INOBS cross plateaus that would stop OBS." }
  ],

  animation: {
    title: "INOBS on the four-variable example {X1,X2,X3,X4} (paper Example 109, Fig. 232).",
    nodes: [
      { id: "X1", x: 0.18, y: 0.30 },
      { id: "X2", x: 0.50, y: 0.30 },
      { id: "X3", x: 0.82, y: 0.30 },
      { id: "X4", x: 0.50, y: 0.78 }
    ],
    edges: [],
    steps: [
      { caption: "<b>Start.</b> Initial order X1 ≺ X2 ≺ X3 ≺ X4. The inner step (same as OBS) builds the best DAG consistent with this order — each node takes its best parents from the variables before it. This order scores <b>3</b>.", ops: [
        { op: "set", name: "Order", items: ["X1", "X2", "X3", "X4"] },
        { op: "addEdge", from: "X1", to: "X2" }, { op: "addEdge", from: "X2", to: "X3" }, { op: "addEdge", from: "X1", to: "X4" },
        { op: "score", text: "score = 3" },
        { op: "badge", text: "start order, score 3", kind: "info" } ] },
      { caption: "<b>OBS's move: swap-adjacent.</b> OBS could only swap two neighbours. Swapping X3 ↔ X4 gives X1 ≺ X2 ≺ X4 ≺ X3, scoring only <b>2.1</b> (Δ = −0.9). The adjacent swaps around this order do not improve — OBS would stall here on a plateau.", ops: [
        { op: "highlightNodes", ids: ["X3", "X4"], cls: "hl" },
        { op: "set", name: "Order", items: ["X1", "X2", "X4", "X3"] },
        { op: "score", text: "score = 2.1" },
        { op: "badge", text: "OBS swap: Δ = −0.9 (no improvement)", kind: "bad" } ] },
      { caption: "<b>INOBS's move: the INSERT neighbourhood.</b> Instead of swaps, INOBS may pull a variable out and reinsert it at any index. Using the <i>hybrid rule</i>, it samples a variable to try — here X3 — and tests all of X3's insertion positions.", ops: [
        { op: "set", name: "Order", items: ["X1", "X2", "X3", "X4"] },
        { op: "removeEdge", from: "X1", to: "X2" }, { op: "addEdge", from: "X1", to: "X2" },
        { op: "highlightNodes", ids: ["X3"], cls: "hl" },
        { op: "score", text: "score = 3" },
        { op: "badge", text: "INSERT move — sample X3 (hybrid rule)", kind: "info" } ] },
      { caption: "<b>Insert X3 at index j = 1.</b> Move X3 to the front: new order X3 ≺ X1 ≺ X2 ≺ X4. Re-scoring only the changed families gives <b>5</b>, an improvement of Δ = +2 — the best of X3's insertions.", ops: [
        { op: "set", name: "Order", items: ["X3", "X1", "X2", "X4"] },
        { op: "removeEdge", from: "X1", to: "X4" }, { op: "addEdge", from: "X3", to: "X1" },
        { op: "highlightNodes", ids: ["X3"], cls: "good" },
        { op: "score", text: "score = 5" },
        { op: "badge", text: "Δ = +2 (best insertion of X3)", kind: "good" } ] },
      { caption: "<b>Why this beats OBS.</b> The order X3 ≺ X1 ≺ X2 ≺ X4 is <b>not</b> reachable from the start in a single swap-adjacent step — OBS's neighbourhood does not contain it. One insert move makes the long-range precedence change that OBS would need several swaps (through worse orders) to reach.", ops: [
        { op: "set", name: "Order", items: ["X3", "X1", "X2", "X4"] },
        { op: "score", text: "score = 5" },
        { op: "badge", text: "out of reach for OBS's swap move", kind: "good" } ] },
      { caption: "<b>Continue — sample X2.</b> From X3 ≺ X1 ≺ X2 ≺ X4, the hybrid rule next samples X2 and tests all of its insertion positions. None of them raises the score (every Δ ≤ 0).", ops: [
        { op: "set", name: "Order", items: ["X3", "X1", "X2", "X4"] },
        { op: "highlightNodes", ids: ["X2"], cls: "hl" },
        { op: "score", text: "score = 5" },
        { op: "badge", text: "no insertion of X2 improves — resample", kind: "bad" } ] },
      { caption: "<b>Resample — sample X1.</b> Rather than stopping at this non-improving step, INOBS resamples a different variable. It now tries X1 and evaluates all of X1's insertion positions.", ops: [
        { op: "set", name: "Order", items: ["X3", "X1", "X2", "X4"] },
        { op: "highlightNodes", ids: ["X1"], cls: "hl" },
        { op: "score", text: "score = 5" },
        { op: "badge", text: "INSERT move — sample X1", kind: "info" } ] },
      { caption: "<b>Insert X1 at index j = 4.</b> Move X1 to the end: new order X3 ≺ X2 ≺ X4 ≺ X1. This is X1's best placement and it improves the score to <b>6</b> (Δ = +1). Apply it. (X1's other insertions, j = 2 and j = 3, gave 5 and 2.5 — non-improving.)", ops: [
        { op: "set", name: "Order", items: ["X3", "X2", "X4", "X1"] },
        { op: "removeEdge", from: "X3", to: "X1" }, { op: "addEdge", from: "X2", to: "X3" },
        { op: "removeEdge", from: "X2", to: "X3" }, { op: "addEdge", from: "X3", to: "X2" },
        { op: "addEdge", from: "X2", to: "X4" },
        { op: "highlightNodes", ids: ["X1"], cls: "good" },
        { op: "score", text: "score = 6" },
        { op: "badge", text: "Δ = +1 (best insertion of X1)", kind: "good" } ] },
      { caption: "<b>Sample X3 again.</b> From X3 ≺ X2 ≺ X4 ≺ X1, test all insertions of X3 — none improves the score. Two improving insertions (X3, then X1) have now been interleaved with two non-improving sampling steps (X2, X3).", ops: [
        { op: "set", name: "Order", items: ["X3", "X2", "X4", "X1"] },
        { op: "highlightNodes", ids: ["X3"], cls: "hl" },
        { op: "score", text: "score = 6" },
        { op: "badge", text: "no insertion of X3 improves", kind: "bad" } ] },
      { caption: "<b>Local optimum.</b> The remaining variables also admit no improving insertion: no insert of any variable raises the score. INOBS stops at order X3 ≺ X2 ≺ X4 ≺ X1 (score 6) — a higher-scoring order than OBS's swap-only search could reach from this start.", ops: [
        { op: "set", name: "Order", items: ["X3", "X2", "X4", "X1"] },
        { op: "score", text: "score = 6" },
        { op: "badge", text: "local optimum (insert neighbourhood)", kind: "good" } ] },
      { caption: "<b>Result.</b> INOBS returns the best DAG found — the highest-scoring network consistent with the order X3 ≺ X2 ≺ X4 ≺ X1. The insert move plus the hybrid selection rule found a structure OBS's adjacent-swap move would have missed.", ops: [
        { op: "set", name: "Order", items: ["X3", "X2", "X4", "X1"] },
        { op: "highlightEdges", edges: [["X3","X2"],["X2","X4"],["X1","X2"]] },
        { op: "score", text: "score = 6" },
        { op: "badge", text: "best DAG returned", kind: "good" } ] }
    ]
  },

  complexity: "Same inner cost as OBS (one parent search per variable over its predecessors). The neighbourhood is larger than OBS's: an insert can place a variable at any of O(n) positions, and there are n variables, so the full insert neighbourhood is O(n²) versus OBS's O(n) adjacent swaps — but the tailored selection rules (first improvement / hybrid sampling) avoid enumerating it all, and each insert re-scores only the families that changed. The bigger neighbourhood costs more per step but mitigates local optima and plateaus.",
  strengths: [
    "Insert moves make long-range precedence changes in one step, reaching orders OBS's adjacent swaps cannot reach in a single move — so it tends to find higher-scoring structures.",
    "Better at escaping local optima and crossing plateaus than OBS, because the neighbourhood is larger and resampling continues past a non-improving variable.",
    "Keeps OBS's advantages: acyclicity is automatic (edges respect the order), and moves only re-score the affected families.",
    "Flexible traversal via three selection rules (best improvement, first improvement, hybrid sampling) trading thoroughness against speed."
  ],
  limitations: [
    "Still a greedy local search — it returns a local optimum, not a global guarantee.",
    "The insert neighbourhood is larger (O(n²) placements), so each step can cost more to explore than an OBS swap step.",
    "Quality still depends on a decomposable score and an adequate parent-cap, and on the chosen selection rule and starting order."
  ],
  notes: "INOBS (Lee & van Beek) is a direct refinement of OBS (§4.15): identical ordering-space framing and inner best-DAG-given-order routine, but the swap-adjacent neighbourhood is replaced by the insert neighbourhood with best-/first-improvement and hybrid sampling rules to mitigate local optima and plateaus.",
  figureRefs: "Paper §5.11 (pp.354–355): §5.11.1 (the algorithm), Example 109 (four-variable walk-through used in this animation), and Fig.232 (insert-move neighbourhood; two improving insertions interleaved with two non-improving attempts reaching a local optimum)."
};
