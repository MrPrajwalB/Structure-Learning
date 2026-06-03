/* WINASOBS — Window Acyclic Selection Ordering-Based Search. Grounded in §5.12 (pp.356-357):
   the window(i,j,w) operator, the INOBS-style hybrid selection strategy, the ASOBS seed +
   topological-order initialisation, and the Iterated-Local-Search outer loop.
   Worked example = Example 110 / Fig.223 (a)-(e), five variables {A,B,C,D,E}. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["winasobs"] = {
  name: "Window Acyclic Selection Ordering-Based Search",
  oneLiner: "Extend ordering-based search with a 'window' move that relocates a whole contiguous block of variables in the order at once (not just a single swap), start the search from a high-quality ASOBS seed turned into a topological order, and wrap the whole local search in an iterated-local-search loop that periodically perturbs the order and slowly grows the window size.",
  basedOnText: "WINASOBS combines two ideas: ASOBS supplies a strong starting DAG (it lets nodes take back-arcs while keeping the graph acyclic), and INOBS supplies the larger, smarter neighbourhood. WINASOBS searches in ordering space like OBS, but its neighbours are produced by moving blocks of variables, so it can make big, targeted re-orderings cheaply.",

  assumptions: [
    "<b>Decomposable score</b> — the network score is a sum of per-node family scores (node + its parents), e.g. BIC/BDeu. This is what lets the best DAG for a fixed order be assembled one node at a time, and lets a window move re-score only the families it actually changes.",
    "<b>Consistency with an order</b> — a DAG is consistent with an order π if every edge points forward (parents precede children); restricting to such DAGs makes acyclicity automatic.",
    "<b>A good seed is available</b> — WINASOBS does not start from a random order: it runs ASOBS first to get a high-scoring DAG, then uses that DAG's topological order as the initial order.",
    "<b>A complete dataset and chosen score</b>, plus ILS control parameters: perturbation strength P_d, the no-improvement patience P_b, the iterations-per-window-size P_c, and a maximum window size cap."
  ],
  input: "A dataset over variables V, a decomposable score(G | D), an ASOBS seed DAG, and ILS settings: perturbation size P_d, patience P_b, iterations-per-window-increase P_c, and a window-size cap w_max.",
  output: "A single DAG G — the highest-scoring network found across the iterated-local-search run — together with the variable order that produced it.",

  idea: [
    "WINASOBS keeps OBS's core bargain: <b>fix an order and the best DAG is easy</b>. For a fixed left-to-right order, each node independently picks its highest-scoring parent set from the variables before it; because the score is decomposable there is no cycle risk and no global edge search. So, as in OBS, the real search is over <i>orders</i>, each order standing for the best DAG consistent with it (Fig. 223 draws orders as super-nodes carrying that score).",
    "Plain OBS only moves between orders by swapping two <i>adjacent</i> variables. That is a tiny step: relocating a variable far across the order needs many swaps and the search can get stuck before it gets there. WINASOBS replaces the single-swap move with a <b>window operator</b>, written <i>window(i, j, w)</i>: take the contiguous block of <i>w</i> variables starting at position <i>i</i> and move it to a new position <i>j</i>. A single window move can re-order a large chunk at once.",
    "The window subsumes the old moves: <i>w = 1</i> with j = i±1 is exactly an adjacent swap, and <i>w = 1</i> with an arbitrary j is a single-variable 'insert'. Bigger w relocates whole blocks. The catch is cost: the number of candidate moves grows roughly as (|V| − (w−1))·(|V| − w), so WINASOBS keeps <i>w bounded</i> and uses a <b>selective evaluation strategy</b> rather than scoring every candidate.",
    "That selective strategy comes from <b>INOBS</b> and is a <i>hybrid</i>: pick a variable at random; enumerate its window successors starting from w = 1 up to the current maximum window size; apply the <b>first improving</b> move found. If no window move improves that variable, pick another variable at random and try again. If every variable fails at the current maximum w, <b>increment w</b> (up to the cap) and continue — only widening the window when the narrow one is exhausted.",
    "To avoid getting trapped, the local search lives inside an <b>Iterated Local Search (ILS)</b> loop. When local search reaches a local optimum, WINASOBS applies a <b>perturbation</b> — P_d random swaps in the order — and re-optimises from there. It keeps the best result seen (the <i>incumbent</i>) and stops perturbing once P_b consecutive perturbations fail to improve. After every P_c ILS iterations it raises the maximum window size by one, so the search starts with cautious, local re-orderings and gradually allows broader relocations as it progresses.",
    "Net effect versus OBS: same automatic acyclicity and same cheap re-scoring (only the families touched by a move are recomputed), but a richer neighbourhood (block moves), a strong warm start (ASOBS seed), and an escape mechanism (ILS perturbations) — making the search both more thorough and more scalable."
  ],

  steps: [
    "<b>Seed with ASOBS.</b> Run ASOBS to learn a high-scoring DAG. ASOBS is happy to add 'back-arcs' relative to the current order while still keeping the graph acyclic, so the seed is genuinely good rather than random.",
    "<b>Initialise the order.</b> Take a <b>topological order</b> of the seed DAG and use it as WINASOBS's starting order. The DAG is unchanged; only the ordering is read off from it so that all edges point forward.",
    "<b>Best DAG given the order (inner step).</b> For each variable, look only at its predecessors and choose the parent set maximising its family score; summing over nodes gives the order's best DAG and its score.",
    "<b>Window local search — pick a variable.</b> Choose a variable at random and enumerate its <i>window(i, j, w)</i> successors, growing w from 1 up to the current maximum window size. Apply the <b>first improving</b> move (re-scoring only the families the move actually changes).",
    "<b>If a variable can't improve, try another.</b> If no window move improves the chosen variable, pick a different variable at random and repeat step 4. The local search continues as long as some variable yields an improving window move.",
    "<b>Grow the window when stuck.</b> If at the current maximum window size <i>every</i> variable fails to improve, increment the maximum window size (up to the cap w_max) and keep searching; when even that yields nothing, the order is a <b>local optimum</b>.",
    "<b>Perturb (ILS step).</b> From the local optimum, apply a perturbation of <b>P_d random swaps</b> to the order, then re-run the window local search from the perturbed order.",
    "<b>Accept / track incumbent.</b> If the re-optimised order beats the incumbent, adopt it; otherwise count a non-improving perturbation. Stop the ILS loop once <b>P_b consecutive perturbations</b> fail to improve.",
    "<b>Widen the search over time.</b> After every <b>P_c</b> ILS iterations, increase the maximum window size by one, allowing broader relocations as the search matures.",
    "<b>Return</b> the incumbent: the best (order, DAG, score) found across the whole run."
  ],

  keyConcepts: [
    { term: "Window operator window(i, j, w)", def: "The signature move: relocate the contiguous block of w variables that starts at position i to a new position j in the order. One move can re-order a whole block at once." },
    { term: "Swap / insert as special cases", def: "With w = 1 and j adjacent to i it is an ordinary adjacent swap; with w = 1 and any j it is a single-variable insert. Larger w generalises both to block moves." },
    { term: "ASOBS seed", def: "A high-quality starting DAG produced by ASOBS, which permits back-arcs relative to the current order while keeping the graph acyclic. WINASOBS warm-starts from it rather than from a random order." },
    { term: "Topological-order initialisation", def: "The seed DAG's topological order becomes WINASOBS's initial order, guaranteeing all edges point forward without changing the DAG itself." },
    { term: "Hybrid selection (from INOBS)", def: "Pick a variable at random, try its window successors from w = 1 upward, and take the first improving move; if none, try another variable; if all fail, increase the window size. This avoids scoring every candidate move." },
    { term: "Bounded window + selective evaluation", def: "Because the number of window candidates grows about (|V|−(w−1))·(|V|−w), w is kept bounded and only selected candidates are scored — keeping the larger neighbourhood affordable." },
    { term: "Iterated Local Search (ILS)", def: "The outer loop: on reaching a local optimum, perturb the order with P_d random swaps and re-optimise; stop after P_b consecutive failures; every P_c iterations grow the maximum window size." }
  ],

  animation: {
    title: "WINASOBS on {A,B,C,D,E} (paper Example 110, Fig. 223 (a)-(e)).",
    nodes: [
      { id: "A", x: 0.10, y: 0.32 },
      { id: "B", x: 0.32, y: 0.32 },
      { id: "C", x: 0.54, y: 0.32 },
      { id: "D", x: 0.76, y: 0.32 },
      { id: "E", x: 0.92, y: 0.74 }
    ],
    edges: [],
    steps: [
      { caption: "<b>Step 1 — ASOBS seed.</b> WINASOBS does not start from scratch: ASOBS first learns a high-scoring DAG on {A,B,C,D,E}, with <b>score 5</b>. This seed is the warm start for the whole search (Fig. 223a).", ops: [
        { op: "set", name: "Order / Window", items: ["A", "B", "C", "D", "E"] },
        { op: "addEdge", from: "A", to: "B" }, { op: "addEdge", from: "B", to: "C" }, { op: "addEdge", from: "D", to: "C" }, { op: "addEdge", from: "D", to: "E" }, { op: "addEdge", from: "A", to: "C" },
        { op: "score", text: "ASOBS seed score = 5" },
        { op: "badge", text: "ASOBS seed", kind: "info" } ] },
      { caption: "<b>Step 2 — topological order.</b> Read a topological order off the seed DAG and use it to initialise WINASOBS: <b>A ≺ B ≺ D ≺ C ≺ E</b>. The DAG is unchanged; only the order is rearranged so every edge points forward (Fig. 223b).", ops: [
        { op: "set", name: "Order / Window", items: ["A", "B", "D", "C", "E"] },
        { op: "score", text: "score = 5 (DAG unchanged)" },
        { op: "badge", text: "topological order", kind: "info" } ] },
      { caption: "<b>Step 3 — window local search begins (w = 1).</b> Pick a variable and enumerate its window(i, j, w) successors starting from w = 1. Here the search examines moving <b>C</b> to an earlier position. The window contents are highlighted.", ops: [
        { op: "highlightNodes", ids: ["C"], cls: "hl" },
        { op: "badge", text: "window w = 1, examine C", kind: "info" } ] },
      { caption: "<b>Step 3 — first improving move.</b> Inserting C earlier — window(4, 2, 1) — gives order <b>A ≺ C ≺ B ≺ D ≺ E</b> with <b>score 6.2</b>. Only the families that changed are re-scored. It improves, so it is applied immediately (Fig. 223c).", ops: [
        { op: "highlightNodes", ids: ["A", "C"], cls: "add" },
        { op: "set", name: "Order / Window", items: ["A", "C", "B", "D", "E"] },
        { op: "removeEdge", from: "A", to: "B" }, { op: "removeEdge", from: "B", to: "C" }, { op: "removeEdge", from: "D", to: "C" }, { op: "removeEdge", from: "A", to: "C" },
        { op: "addEdge", from: "A", to: "C" }, { op: "addEdge", from: "C", to: "B" }, { op: "addEdge", from: "C", to: "D" },
        { op: "score", text: "score = 6.2" },
        { op: "badge", text: "window(4,2,1) accepted, Δ=+1.2", kind: "good" } ] },
      { caption: "<b>Step 4 — slide the window / try other variables.</b> No further w = 1 window move on any variable improves on 6.2, so the local search at this window size stops. The order A ≺ C ≺ B ≺ D ≺ E (score 6.2) is the local optimum (Fig. 223d).", ops: [
        { op: "set", name: "Order / Window", items: ["A", "C", "B", "D", "E"] },
        { op: "score", text: "score = 6.2" },
        { op: "badge", text: "local optimum (w = 1)", kind: "good" } ] },
      { caption: "<b>Step 5 — ILS perturbation (P_d = 2 swaps).</b> To escape the local optimum, apply two random swaps to the order, obtaining <b>A ≺ C ≺ E ≺ B ≺ D</b>. Re-optimising gives <b>score 6.4</b> — an improvement, so the incumbent is updated (Fig. 223e).", ops: [
        { op: "highlightNodes", ids: ["E", "B", "D"], cls: "hl" },
        { op: "set", name: "Order / Window", items: ["A", "C", "E", "B", "D"] },
        { op: "removeEdge", from: "C", to: "D" }, { op: "addEdge", from: "C", to: "E" }, { op: "addEdge", from: "B", to: "D" },
        { op: "score", text: "score = 6.4" },
        { op: "badge", text: "perturb +2 swaps, Δ=+0.2", kind: "good" } ] },
      { caption: "<b>Step 6 — perturb again, no gain.</b> Another perturbation is tried but the next perturbed solution A ≺ C ≺ E ≺ B ≺ D re-optimises to <b>score 5.5</b>, below the incumbent — one non-improvement counted (P_b = 1 reached). The first ILS iteration ends.", ops: [
        { op: "set", name: "Order / Window", items: ["A", "C", "E", "B", "D"] },
        { op: "score", text: "perturbed score = 5.5" },
        { op: "badge", text: "non-improving (P_b reached)", kind: "bad" } ] },
      { caption: "<b>Step 7 — grow the window (P_c = 1 ⇒ w → 2).</b> After P_c iterations the maximum window size is increased to <b>w = 2</b>, allowing larger block relocations. A new ILS iteration starts from a fresh seed; its initial order is <b>A ≺ B ≺ C ≺ D ≺ E</b> with score 4.9.", ops: [
        { op: "set", name: "Order / Window", items: ["A", "B", "C", "D", "E"] },
        { op: "score", text: "fresh seed score = 4.9" },
        { op: "badge", text: "max window grown to w = 2", kind: "info" } ] },
      { caption: "<b>Step 8 — a block (w = 2) move.</b> With w ∈ {1,2}, local search finds that moving the block <b>B ≺ A</b> to position j = 3 — a genuine window-w=2 relocation impossible with a single swap — yields <b>E ≺ D ≺ B ≺ A ≺ C</b> with <b>score 6.1</b>.", ops: [
        { op: "highlightNodes", ids: ["B", "A"], cls: "add" },
        { op: "set", name: "Order / Window", items: ["E", "D", "B", "A", "C"] },
        { op: "removeEdge", from: "A", to: "C" }, { op: "removeEdge", from: "C", to: "B" }, { op: "removeEdge", from: "C", to: "E" }, { op: "removeEdge", from: "B", to: "D" }, { op: "removeEdge", from: "D", to: "E" }, { op: "removeEdge", from: "C", to: "D" },
        { op: "addEdge", from: "E", to: "D" }, { op: "addEdge", from: "D", to: "B" }, { op: "addEdge", from: "B", to: "A" }, { op: "addEdge", from: "A", to: "C" },
        { op: "score", text: "score = 6.1" },
        { op: "badge", text: "window w = 2 block move", kind: "good" } ] },
      { caption: "<b>Step 9 — second iteration ends.</b> Perturbations do not improve beyond 6.1, so this ILS iteration ends at <b>6.1</b>. It is below the global incumbent, which therefore stays at <b>7.8</b> from the best order found so far.", ops: [
        { op: "set", name: "Order / Window", items: ["E", "D", "B", "A", "C"] },
        { op: "score", text: "iteration best = 6.1" },
        { op: "badge", text: "incumbent stays 7.8", kind: "info" } ] },
      { caption: "<b>Result.</b> WINASOBS returns the global incumbent — the best (order, DAG, score) seen across all ILS iterations. The window operator (block moves), the ASOBS warm start, and the perturbation-and-grow loop together let it re-order broadly while keeping every step acyclic and cheap to score.", ops: [
        { op: "set", name: "Order / Window", items: ["E", "D", "B", "A", "C"] },
        { op: "highlightEdges", edges: [["E","D"],["D","B"],["B","A"],["A","C"]] },
        { op: "score", text: "global incumbent = 7.8" },
        { op: "badge", text: "best DAG returned", kind: "good" } ] }
    ]
  },

  complexity: "Each order still costs one parent search per variable over its predecessors (bounded by the parent-cap), and a window move re-scores only the families it changes. The window neighbourhood is far larger than OBS's n−1 swaps — the number of window(i, j, w) candidates grows about (|V|−(w−1))·(|V|−w) — so WINASOBS bounds w and uses INOBS's selective 'first-improving' evaluation instead of scoring all candidates. The ILS outer loop multiplies cost by the number of perturbations but is what makes the larger neighbourhood pay off.",
  strengths: [
    "Richer moves than OBS: a single window operator relocates a whole block of variables, reaching re-orderings that would need many adjacent swaps.",
    "Strong warm start: initialising from an ASOBS seed (which allows acyclic back-arcs) begins the search from a high-quality order.",
    "Acyclicity stays automatic and re-scoring stays cheap — only the families touched by a move are recomputed.",
    "ILS perturbations plus a gradually growing window escape local optima and broaden the search as it matures."
  ],
  limitations: [
    "Still a local search with no global-optimum guarantee; quality depends on the seed and on the ILS parameters P_d, P_b, P_c and the window cap.",
    "The window neighbourhood is large, so without the bounded-w + selective-evaluation strategy it would be too expensive to explore.",
    "Inherits OBS's requirements: a decomposable score and a sensible parent-cap.",
    "More moving parts (seed, window growth schedule, perturbation strength) means more tuning than plain OBS."
  ],
  notes: "WINASOBS sits in the OBS family alongside INOBS (which contributes the window/insert neighbourhood and the hybrid first-improving selection) and ASOBS (which contributes the acyclic, back-arc-tolerant seed). It generalises the adjacent swap of OBS — swap and single-variable insert are just window moves with w = 1 — and wraps everything in iterated local search with a window size that grows over time.",
  figureRefs: "Paper §5.12 (pp.356–357): the window(i, j, w) operator and its swap/insert special cases; the INOBS hybrid selection strategy; the ASOBS-seed + topological-order initialisation; Example 110 and Fig. 223 (a)-(e), the five-variable {A,B,C,D,E} walk-through used in this animation."
};
