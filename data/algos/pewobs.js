/* PEWOBS — Permutation and Extensible Ordering-Based Search. Grounded in §5.17
   (pp.369-370): Algorithm 108 (PEWOBS), Example 116 (eight-variable walk-through
   with w=2, ex=1 on order A≺T≺E≺L≺B≺S≺P≺D, full-score vars L and P). Builds on
   WINASOBS (ref [718], Xu et al.). */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["pewobs"] = {
  name: "Permutation and Extensible Ordering-Based Search",
  oneLiner: "An ordering-based search that upgrades WINASOBS's fixed-size window move into an <i>extensible</i> window — one that swallows the full-score variables sitting just after it — and then refines short blocks of the order with a full permutation operator, scoring the best DAG consistent with each candidate order and keeping improvements.",
  basedOnText: "PEWOBS (Xu et al.) extends WINASOBS, which itself extends plain OBS. WINASOBS searches orderings by sliding a window of variables; PEWOBS keeps that window move but lets the window stretch to absorb easy-to-place variables, and adds a second, complementary move that fully permutes short sub-orders. The two moves alternate to escape local optima that the single window move alone gets stuck in.",

  assumptions: [
    "<b>Decomposable score</b> — the network score is a sum of per-node family scores (node + its parents), e.g. BIC/BDeu. This lets the best DAG for any order be built one node at a time and lets each candidate order be evaluated cheaply.",
    "<b>Consistency with an order</b> — only DAGs whose edges all point forward in the order π are considered, so acyclicity is guaranteed for free (inherited from OBS / WINASOBS).",
    "<b>Full-score variables exist</b> — some variables score best with <i>no</i> extra parents (their 'loss' from being placed early is zero). PEWOBS detects these and treats them specially, both at initialisation and inside the extensible window.",
    "<b>A complete dataset and chosen score</b>; the search is parameterised by a window size w, an extension cap ex, and an optional parent-cap d."
  ],
  input: "A dataset over variables V, a decomposable score(G | D), a window size w, an extension cap ex, and an optional parent-cap d.",
  output: "A single DAG G* consistent with the final order — obtained by letting each variable choose its best parents among its predecessors — together with that order.",

  idea: [
    "PEWOBS lives in <b>ordering space</b> like OBS: fix an order and the best DAG is found by letting each variable independently pick its best parents from the variables before it (decomposability makes this exact and cycle-free). The whole game is therefore finding a good order.",
    "WINASOBS searches orders with a <b>window move</b>: take a contiguous block of variables and try relocating / reordering it. PEWOBS keeps this but tackles two weaknesses of plain OBS that WINASOBS still partly inherits — sensitivity to the <i>initial</i> order and a <i>limited neighbourhood</i> — using two complementary moves.",
    "<b>Enhancement 1 — the extensible window.</b> When PEWOBS moves a block of w variables, it does not stop at a rigid size-w window. If full-score variables (those that want no parents, so they can sit anywhere cheaply) immediately follow the block, the window <i>extends</i> to absorb up to <b>ex</b> of them before being relocated. This lets a single move reposition a larger, more meaningful chunk of the order — a richer neighbourhood than WINASOBS's fixed window.",
    "<b>Enhancement 2 — the permutation operator.</b> After the window search settles, PEWOBS sweeps a length-w block across the order and tries <i>every permutation</i> of that short block, scoring the best DAG for each. A full reordering of a few adjacent variables can fix mistakes that no slide of a rigid window could. If any block permutation improves the score, PEWOBS adopts it and restarts the extensible-window search — the two moves alternate until neither improves.",
    "PEWOBS also starts smarter: the <b>initial order</b> is built by greedy insertion that balances each variable's immediate loss against the gain of enabling parents for others, and full-score variables are inserted immediately. A good start plus a wider, two-operator neighbourhood is what separates PEWOBS from WINASOBS."
  ],

  steps: [
    "<b>Step 1 — Construct the initial order.</b> Insert variables one at a time using a score-based heuristic that weighs a variable's immediate loss against the benefit of enabling parents for later variables. Variables whose loss is zero are <i>full-score</i> and are inserted immediately.",
    "<b>Step 2 — Extensible-window search.</b> Take a contiguous block of w variables. If full-score variables immediately follow it, extend the window to include up to ex of them (backward insertion of the block is also allowed). Try the moves of this extended window.",
    "<b>Best-DAG-given-order (inner step).</b> For each candidate order produced by a move, build its best DAG: every variable picks the highest-scoring parent set (size ≤ d) from its predecessors, giving the order's total score.",
    "<b>Take the best window move.</b> Move the (possibly extended) window to the position that most improves the score. Repeat the window search until no extended-window move improves the order.",
    "<b>Step 3 — Permutation refinement.</b> Slide a length-w block from position 1 to n−w+1. At each position, try <i>all</i> permutations of that block and score the best DAG for each; keep the best permutation found.",
    "<b>Alternate the two moves.</b> If a block permutation changes the order (π′ ≠ π), adopt it and <b>restart</b> the extensible-window search from the beginning. Repeat until a full pass of permutation refinement yields no improvement.",
    "<b>Step 4 — Return the DAG.</b> For the final order, choose each variable's best parents among its predecessors and return the resulting DAG G* consistent with that order."
  ],

  keyConcepts: [
    { term: "Variable ordering (π)", def: "A left-to-right arrangement of the variables; each node may take parents only from earlier variables, so any consistent DAG is automatically acyclic." },
    { term: "Full-score variable", def: "A variable that scores best with no extra parents — its placement 'loss' is zero. PEWOBS inserts these immediately and lets the window absorb them, because they can be moved almost for free." },
    { term: "Window move (from WINASOBS)", def: "Relocating / reordering a contiguous block of variables in the order. PEWOBS inherits this operator but no longer keeps it a fixed size." },
    { term: "Extensible window (Enhancement 1)", def: "A window that grows beyond its w base variables to swallow up to ex full-score variables that immediately follow it, so a single move repositions a larger, more useful block — a wider neighbourhood than WINASOBS." },
    { term: "Permutation operator (Enhancement 2)", def: "A second move that takes a short length-w block and tries every permutation of it, scoring each. It can fix orderings the window slide cannot, and on success it restarts the window search." },
    { term: "Best-DAG-given-order", def: "The inner routine shared with OBS/WINASOBS: for a fixed order, each variable independently picks its best parents from its predecessors, yielding the optimal DAG for that order and its score." },
    { term: "Alternation / restart", def: "PEWOBS interleaves extensible-window search and permutation refinement; whenever the permutation move improves the order it restarts the window search, so the two operators keep helping each other." }
  ],

  animation: {
    title: "PEWOBS on the eight-variable example {A,T,E,L,B,S,P,D} (paper Example 116, w=2, ex=1; full-score variables L and P).",
    nodes: [
      { id: "A", x: 0.06, y: 0.30 },
      { id: "T", x: 0.20, y: 0.30 },
      { id: "E", x: 0.34, y: 0.30 },
      { id: "L", x: 0.48, y: 0.30 },
      { id: "B", x: 0.62, y: 0.30 },
      { id: "S", x: 0.76, y: 0.30 },
      { id: "P", x: 0.90, y: 0.30 },
      { id: "D", x: 0.48, y: 0.82 }
    ],
    edges: [],
    steps: [
      { caption: "<b>Step 1 — initial order.</b> Greedy insertion builds the starting order A ≺ T ≺ E ≺ L ≺ B ≺ S ≺ P ≺ D. The two full-score variables <b>L</b> and <b>P</b> (they want no parents) were inserted immediately. The inner step scores the best DAG for this order.", ops: [
        { op: "set", name: "Order", items: ["A","T","E","L","B","S","P","D"] },
        { op: "set", name: "Full-score vars", items: ["L","P"] },
        { op: "highlightNodes", ids: ["L","P"], cls: "add" },
        { op: "addEdge", from: "A", to: "E" }, { op: "addEdge", from: "T", to: "E" },
        { op: "addEdge", from: "E", to: "D" }, { op: "addEdge", from: "B", to: "D" },
        { op: "score", text: "score = 100" } ] },
      { caption: "<b>Step 2 — base window (w = 2).</b> Take the contiguous block {E, L} at position i=2. This is the rigid window WINASOBS would use — just two variables.", ops: [
        { op: "set", name: "Order", items: ["A","T","E","L","B","S","P","D"] },
        { op: "highlightNodes", ids: ["E","L"], cls: "hl" },
        { op: "badge", text: "window = {E,L} (w=2)", kind: "info" },
        { op: "score", text: "score = 100" } ] },
      { caption: "<b>Enhancement 1 — extend the window.</b> The variable immediately after the block is <b>L</b>, a full-score variable. Because ex=1, the window stretches to absorb it: the extended block becomes {T, E, L} reaching to position j=7. PEWOBS can now relocate this larger chunk in one move.", ops: [
        { op: "set", name: "Order", items: ["A","T","E","L","B","S","P","D"] },
        { op: "highlightNodes", ids: ["T","E","L"], cls: "hl" },
        { op: "badge", text: "extensible window absorbs full-score L", kind: "good" },
        { op: "score", text: "score = 100" } ] },
      { caption: "<b>Relocate the extended block.</b> Insert {T, E, L} before position j=7, yielding A ≺ B ≺ S ≺ T ≺ E ≺ L ≺ P ≺ D. Re-score the affected families: the best DAG for the new order improves.", ops: [
        { op: "set", name: "Order", items: ["A","B","S","T","E","L","P","D"] },
        { op: "highlightNodes", ids: ["T","E","L"], cls: "hl" },
        { op: "removeEdge", from: "A", to: "E" },
        { op: "addEdge", from: "B", to: "E" },
        { op: "score", text: "score = 112" },
        { op: "badge", text: "Δ = +12 (extended move accepted)", kind: "good" } ] },
      { caption: "<b>Iterate the window search.</b> Keep applying extended-window moves where they help. The local search reaches a nearby optimum: A ≺ B ≺ S ≺ T ≺ E ≺ L ≺ P ≺ D. No further extensible-window move improves the score.", ops: [
        { op: "set", name: "Order", items: ["A","B","S","T","E","L","P","D"] },
        { op: "score", text: "score = 112" },
        { op: "badge", text: "window search settled", kind: "info" } ] },
      { caption: "<b>Step 3 — Enhancement 2: permutation operator.</b> Switch moves. Slide a length-w block across the order; at each position try every permutation of that short block. Here the block {L, P} is selected for full reordering.", ops: [
        { op: "set", name: "Order", items: ["A","B","S","T","E","L","P","D"] },
        { op: "highlightNodes", ids: ["L","P"], cls: "hl" },
        { op: "badge", text: "permute block {L,P}", kind: "info" },
        { op: "score", text: "score = 112" } ] },
      { caption: "<b>Try the permutation.</b> Swapping B ↔ S (a block permutation reached during the sweep) is the move that improves: the order becomes A ≺ S ≺ B ≺ T ≺ E ≺ L ≺ P ≺ D. Score the best DAG for it.", ops: [
        { op: "set", name: "Order", items: ["A","S","B","T","E","L","P","D"] },
        { op: "highlightNodes", ids: ["S","B"], cls: "hl" },
        { op: "addEdge", from: "S", to: "B" },
        { op: "score", text: "score = 118" },
        { op: "badge", text: "Δ = +6 (permutation improves)", kind: "good" } ] },
      { caption: "<b>Alternation — restart the window search.</b> Because the permutation changed the order (π′ ≠ π), PEWOBS adopts it and restarts the extensible-window search from idx = 1. The two operators take turns improving the order.", ops: [
        { op: "set", name: "Order", items: ["A","S","B","T","E","L","P","D"] },
        { op: "badge", text: "π′ ≠ π → restart window search", kind: "info" },
        { op: "score", text: "score = 118" } ] },
      { caption: "<b>Second window pass.</b> Re-run the extensible-window search on the new order. A small refinement adds the edge S → D, tightening the network further.", ops: [
        { op: "set", name: "Order", items: ["A","S","B","T","E","L","P","D"] },
        { op: "highlightNodes", ids: ["S","D"], cls: "hl" },
        { op: "addEdge", from: "S", to: "D" },
        { op: "score", text: "score = 121" },
        { op: "badge", text: "Δ = +3", kind: "good" } ] },
      { caption: "<b>Convergence.</b> A full pass of permutation refinement now yields no further improvement, and the window search is also settled. The order A ≺ S ≺ B ≺ T ≺ E ≺ L ≺ P ≺ D is final.", ops: [
        { op: "set", name: "Order", items: ["A","S","B","T","E","L","P","D"] },
        { op: "score", text: "score = 121" },
        { op: "badge", text: "no operator improves — converged", kind: "good" } ] },
      { caption: "<b>Step 4 — return the DAG.</b> For the final order, each variable picks its best parents among its predecessors. PEWOBS returns G* — the best DAG consistent with the order.", ops: [
        { op: "set", name: "Order", items: ["A","S","B","T","E","L","P","D"] },
        { op: "clearSet", name: "Full-score vars" },
        { op: "highlightEdges", edges: [["S","B"],["S","D"],["B","E"],["T","E"],["E","D"],["B","D"]] },
        { op: "score", text: "score = 121" },
        { op: "badge", text: "G* returned", kind: "good" } ] }
    ]
  },

  complexity: "Each candidate order is scored by the OBS inner step (one parent search per variable over its predecessors, bounded by the parent-cap d). The extensible window enlarges the per-move neighbourhood (base w plus up to ex full-score variables), and the permutation operator tries up to w! orderings per length-w block across n−w+1 positions, so w is kept small. Alternating the two operators with restarts costs more per iteration than WINASOBS's single window move but explores a strictly larger neighbourhood, trading compute for solution quality.",
  strengths: [
    "Wider neighbourhood than WINASOBS: the extensible window repositions a larger, more meaningful chunk in one move, and the permutation operator reorders short blocks the window slide cannot.",
    "Smarter start: the greedy initial order with immediate insertion of full-score variables reduces sensitivity to the initial ordering — one of plain OBS's weaknesses.",
    "Acyclicity is automatic (inherited from ordering-based search), and exploiting full-score variables makes the extended moves cheap.",
    "Alternating two complementary operators with restarts helps escape local optima that a single move type gets trapped in."
  ],
  limitations: [
    "Still a local search over orderings — no global optimality guarantee; it can converge to a local optimum.",
    "Richer moves cost more: the permutation operator is exponential in the (small) block size w, so w and ex must be kept modest.",
    "Quality depends on a decomposable score and an adequate parent-cap d, and on enough variables genuinely being full-score for the extension to pay off."
  ],
  notes: "PEWOBS sits in the OBS → WINASOBS → PEWOBS lineage. WINASOBS introduced the window move over orderings; PEWOBS keeps it but (1) makes the window extensible so it absorbs immediately-following full-score variables, and (2) adds a full permutation operator over short blocks, alternating the two moves with restarts. The animation follows the paper's own Example 116 (w=2, ex=1) on the eight-variable order A≺T≺E≺L≺B≺S≺P≺D with full-score variables L and P; the numeric scores are illustrative, the order transformations follow the example.",
  figureRefs: "Paper §5.17 (pp.369–370): Algorithm 108 (PEWOBS) and Example 116 (the eight-variable walk-through with w=2, ex=1 reproduced in this animation). Builds on WINASOBS (ref [718])."
};
