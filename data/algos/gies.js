/* GIES — Greedy Interventional Equivalence Search. Grounded in §4.32 (pp.163-165):
   Algorithm 38 (GIES, repeat-loop over Insert/Delete/Turn operators on I-essential graphs),
   Theorem 15 (I-essential-graph characterisation), Fig.94 (DAG vs observational p-map PDAG vs
   I-essential graph), Fig.95 (combined observational+interventional dataset, N=12, I={∅,{M}}),
   Fig.96 + Example 41 (toy worked example on {M,C,D} with I={∅,{M}}, the three greedy iterations
   with local score deltas and the returned I-essential graph). GIES generalises GES (§4.12). */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["gies"] = {
  name: "Greedy Interventional Equivalence Search",
  oneLiner: "An extension of GES to data that mixes passive observation with experiments: it greedily searches over interventional equivalence classes (I-essential graphs) — which are more finely oriented than ordinary CPDAGs because interventions resolve directions — using a score that knows which variables were intervened on, alternating insert, delete and edge-turning moves.",
  basedOnText: "GIES generalises GES to a collection of datasets gathered under different interventions. Because interventions break the incoming edges of the variables they set, they reveal causal directions that observation alone leaves ambiguous, so GIES can search a finer space of equivalence classes than the observational CPDAGs GES uses.",

  assumptions: [
    "<b>A decomposable, score-equivalent <i>interventional</i> score</b> — e.g. BDeu/BIC adapted to interventions. As in GES the total score is a sum of per-node local terms (so a single move is cheap to evaluate), but each term is computed only over the data regimes in which that variable was <i>not</i> set by an intervention.",
    "<b>Known intervention targets</b> — the data is partitioned into regimes, and for each regime we know which variables were experimentally set (the target family I = {I⁽¹⁾, …, I⁽ᴷ⁾}).",
    "<b>Faithfulness</b> — every (in)dependence in the data is reflected by the graph's structure, with no accidental cancellations.",
    "<b>Causal sufficiency</b> — no hidden common causes; all relevant variables are observed.",
    "<b>Large-sample (consistency)</b> — like GES, its optimality guarantee is asymptotic, holding as the combined dataset grows large."
  ],
  input: "A dataset D over variables V partitioned by intervention targets I = {I⁽¹⁾, …, I⁽ᴷ⁾} (which variables were set in each regime), plus a decomposable interventional scoring function. An initial I-essential graph (often empty).",
  output: "A locally optimal <b>I-essential graph</b> 𝒢ᵢ — a PDAG (directed + undirected edges) representing the whole <i>interventional</i> Markov equivalence class. It has no undirected edge touching an intervened node, so it is generally more directed than the observational CPDAG of the same data.",

  idea: [
    "GIES answers the same scoring question as GES, but with a richer kind of data. Besides passively <i>observed</i> samples, we also have samples where some variables were experimentally <b>set / forced</b> — interventions. Forcing a variable breaks its incoming edges (its value no longer depends on its usual causes), so comparing regimes reveals which way an arrow really points. This lets GIES distinguish graphs that observation alone cannot tell apart.",
    "Its search space reflects this. GES searches over observational equivalence classes (CPDAGs). GIES searches over <b>interventional equivalence classes</b>, each drawn as an <b>I-essential graph</b>. Two DAGs are interventionally equivalent only if they agree under <i>every</i> intervention regime, which is a stricter requirement — so I-essential graphs are <b>finer</b> (more edges oriented) than the corresponding CPDAGs. In particular (Theorem 15) an I-essential graph never leaves an undirected edge touching a variable that was intervened on: those directions are pinned down by the experiment.",
    "The score is <i>interventional</i>: a node's local term is scored only over the regimes in which it was passively observed, because in a regime where it was set its value carries no information about its parents. This is the only change to the GES machinery that the data partition forces.",
    "GIES is greedy and uses three families of operators on the current I-essential graph. <b>Insert</b> adds an edge (grow), <b>Delete</b> removes one (prune), and the <b>Turn</b> phase <i>reverses</i> an existing edge — turning moves are needed because, with directions partly fixed by interventions, a single reversal can now improve the score in ways a pure insert/delete pass could not. At each step it scores every valid operator and applies the single best one.",
    "After applying an operator, GIES re-forms the result into a legal I-essential graph using <b>I-aware Meek (orientation) rules</b>: it propagates forced directions while honouring the I-constraints (no undirected edge next to an intervened node) and keeping the graph acyclic. It stops when no operator yields a positive gain."
  ],

  steps: [
    "<b>Initialise.</b> Take the input I-essential graph 𝒢ᵢ (often empty) over all variables, with the data partitioned by its intervention targets I, and compute its interventional score.",
    "<b>Enumerate valid operators.</b> On the current 𝒢ᵢ, list every valid <b>Insert</b>, <b>Delete</b> and edge-<b>Turn</b> (reverse) operator. Validity requires the result to stay acyclic and to respect the <i>I-constraints</i> — no undirected edge may end up adjacent to an intervened node.",
    "<b>Score each move locally.</b> For every operator o, compute the change Δscore(o) = score(o(𝒢ᵢ) | D, I) − score(𝒢ᵢ | D, I). Because the interventional score is decomposable, only a few local terms change, so each Δ is cheap — and a node's term is taken only over the regimes where that node was observed, not set.",
    "<b>Apply the best move.</b> If the largest Δscore is positive, apply that operator to get a PDAG, then re-form it into a valid I-essential graph by applying the <b>I-Meek orientation rules</b> (propagating forced directions, enforcing the I-constraints, preserving acyclicity).",
    "<b>Repeat.</b> Re-list and re-score operators on the new 𝒢ᵢ and apply the best each time. The Insert moves grow the graph, the Delete moves prune it, and the Turn moves reverse edges — all interleaved in one greedy loop.",
    "<b>Stop and return.</b> When no operator yields a positive gain, terminate and return the current I-essential graph 𝒢ᵢ — a locally optimal interventional equivalence class, more directed than the observational CPDAG because the interventions have resolved extra edge directions."
  ],

  keyConcepts: [
    { term: "Intervention", def: "A data regime in which some variables are experimentally set/forced rather than passively observed. Setting a variable breaks its incoming edges, so it no longer depends on its usual causes — which exposes the true direction of arrows around it." },
    { term: "Intervention targets I", def: "The family I = {I⁽¹⁾, …, I⁽ᴷ⁾} listing, for each data regime, which variables were intervened on. The observational regime is the target ∅ (nothing set). GIES needs these to score and orient correctly." },
    { term: "Interventional equivalence class", def: "A set of DAGs that agree under every intervention regime, not just observationally. It is a stricter notion than Markov equivalence, so these classes are smaller and better oriented." },
    { term: "I-essential graph 𝒢ᵢ", def: "The PDAG that represents an interventional equivalence class. By Theorem 15 it is the observational p-map PDAG with the extra property that no undirected edge is adjacent to an intervened node — hence finer (more directed) than a CPDAG." },
    { term: "Interventional score", def: "A decomposable, score-equivalent score (BDeu/BIC-style) adapted to interventions: each node's local term is computed only over the regimes where it was observed, since in a regime where it is set it tells us nothing about its parents." },
    { term: "Insert / Delete / Turn operators", def: "The greedy moves on the I-essential graph: Insert adds an edge, Delete removes one, and Turn reverses an existing edge. The turning phase is what lets reversals improve the score once interventions have fixed some directions." },
    { term: "I-Meek orientation rules", def: "Meek-style propagation rules made intervention-aware: after a move they orient all forced edges while enforcing the I-constraint that intervened nodes carry no undirected edges, keeping the graph a valid I-essential graph." }
  ],

  animation: {
    title: "GIES on the paper's toy example {M,C,D} with intervention targets I = {∅, {M}} (Fig. 96 / Example 41): an observational regime plus a regime where M is experimentally set. The intervention on M forces every edge touching M to be directed — orientations observation alone could not give.",
    nodes: [
      { id: "M", x: 0.50, y: 0.16 },
      { id: "C", x: 0.20, y: 0.82 },
      { id: "D", x: 0.80, y: 0.82 }
    ],
    edges: [],
    steps: [
      { caption: "<b>Start (empty I-essential graph).</b> GIES begins from the empty graph on {M,C,D}. The data has two regimes: passive observation (target ∅) and an experiment where M is set (target {M}). GIES will greedily add, delete and turn edges to maximise the interventional score.", ops: [{ op: "set", name: "Intervention targets", items: ["∅ (observational)", "{M} — M is set"] }, { op: "badge", text: "greedy loop", kind: "info" }] },
      { caption: "<b>Iteration 1 — score candidate inserts.</b> On the empty graph the admissible moves are Add M→C (Δ = −0.0015) and Add M→D (Δ = +0.0025). Note the I-constraint: because M was intervened on, any edge incident to M must be <i>directed</i>, never left undirected.", ops: [{ op: "highlightNodes", ids: ["M"], cls: "hl" }, { op: "score", text: "Add M→C: −0.0015   |   Add M→D: +0.0025 (best)" }] },
      { caption: "<b>Apply the best insert (M→D).</b> The edge with the largest positive Δ is added. Crucially it is drawn <i>directed</i> M→D, not undirected: GES on observation alone would have left an M–D edge undirected, but the intervention on M pins its direction. This is the orientation observation cannot give.", ops: [{ op: "addEdge", from: "M", to: "D", type: "directed" }, { op: "highlightNodes", ids: ["M"], cls: "intervened" }, { op: "highlightEdges", edges: [["M", "D"]], cls: "add" }, { op: "score", text: "score +0.0025 — directed by the M-intervention" }] },
      { caption: "<b>Iteration 2 — re-score moves on the new graph.</b> Candidates now include Add M→C (Δ = +0.0007), Add M→D again (already present, +0.0004), and Add D→C (Δ = +0.0014). The best is the new edge D→C.", ops: [{ op: "highlightNodes", ids: ["C", "D"], cls: "hl" }, { op: "score", text: "Add M→C: +0.0007   |   Add D→C: +0.0014 (best)" }] },
      { caption: "<b>Apply D→C, then re-form with I-Meek rules.</b> The edge C–D is added. Because it does not touch the intervened node M, it could in principle be undirected — but the score and acyclicity favour C→D, so the I-aware orientation rules direct it. The graph is now M→D and C→D.", ops: [{ op: "addEdge", from: "C", to: "D", type: "directed" }, { op: "highlightEdges", edges: [["C", "D"]], cls: "add" }, { op: "score", text: "score +0.0014 → I-essential graph re-formed" }] },
      { caption: "<b>Turning phase — try reversing an edge.</b> GIES also considers <i>turning</i> (reversing) existing edges. Reversing C→D to D→C is tested, but its Δ is negative (it would clash with the M→D orientation and the I-constraints), so no turn is applied here.", ops: [{ op: "highlightEdges", edges: [["C", "D"]], cls: "hl" }, { op: "score", text: "Turn C→D ⇒ D→C: −0.0010 — rejected" }] },
      { caption: "<b>Backward check — try a deletion.</b> GIES also scores single-edge deletions. Delete M→D: −0.0025 and Delete C→D: −0.0014 are both negative — every edge is earning its place — so nothing is pruned.", ops: [{ op: "highlightEdges", edges: [["M", "D"], ["C", "D"]], cls: "dim" }, { op: "score", text: "Delete M→D: −0.0025   |   Delete C→D: −0.0014 — none help" }] },
      { caption: "<b>Iteration 3 — no positive-gain operator remains.</b> The only remaining insert is Add M→C (Δ = −0.0002), and all deletes and turns are negative too. No operator improves the score, so the greedy search terminates.", ops: [{ op: "highlightNodes", ids: ["M", "C"], cls: "hl" }, { op: "score", text: "Add M→C: −0.0002 — best move is non-positive" }, { op: "badge", text: "no positive gain — stop", kind: "good" }] },
      { caption: "<b>Result — the I-essential graph 𝒢ᵢ.</b> The returned graph M→D ← C is <i>fully directed</i>. Compare this with plain GES: on the observational data alone the edge touching M would stay undirected (an ambiguous CPDAG). The intervention on M resolved that direction, so GIES recovers a finer, more oriented equivalence class than observation could.", ops: [{ op: "highlightNodes", ids: ["M"], cls: "intervened" }, { op: "highlightEdges", edges: [["M", "D"], ["C", "D"]], cls: "add" }, { op: "badge", text: "I-essential graph returned", kind: "good" }] }
    ]
  },

  complexity: "Like GES, each greedy step enumerates and scores candidate operators (Insert, Delete, Turn) over the current I-essential graph; with a decomposable interventional score every operator's gain is a cheap local computation, and only the regimes where a node is observed enter its term. Per-step cost is polynomial in the number of variables and current edges; the total depends on how many moves are made. Re-forming the I-essential graph after each move (I-Meek propagation) adds overhead but keeps directions consistent with the interventions.",
  strengths: [
    "Uses interventional data: experiments break incoming edges, resolving edge directions that observation alone leaves undirected, so GIES learns finer, better-oriented structures than observational GES.",
    "Searches over interventional equivalence classes (I-essential graphs), which are strictly finer than CPDAGs — fewer ambiguous edges in the output.",
    "Inherits GES's asymptotic consistency: under faithfulness and large samples it recovers the true interventional equivalence class.",
    "Decomposable interventional score makes each candidate move's gain cheap to evaluate and cache; the added Turn phase improves the greedy search once directions are partly fixed."
  ],
  limitations: [
    "Requires interventional data with <i>known</i> intervention targets (which variables were set in each regime) — not just observation.",
    "Greedy: on finite data it can still settle on a locally optimal class despite the asymptotic guarantee.",
    "Needs a decomposable, score-equivalent interventional score and a chosen distributional form / prior (e.g. a BDeu hyperparameter).",
    "Assumes causal sufficiency and faithfulness; re-forming I-essential graphs after every move can be costly on dense or high-dimensional problems."
  ],
  notes: "Related work extends interventional search in several directions: Shah et al. propose SP-GIES (Skeleton-Primed GIES), which first extracts a skeleton from observational data and then runs GIES on that restricted edge set, supporting an active-learning experiment-design loop. Yang et al. formalised an interventional Markov notion and a graphical criterion for interventional equivalence (including soft/imperfect interventions) and introduced the permutation-based IGSP, which reverses only intervention-covered edges and uses CI/invariance tests. Qiu and Yang's Bloom casts learning from observational + interventional data as a bilevel optimisation / polynomial program.",
  figureRefs: "Paper §4.32 (pp.163–165): Algorithm 38 (GIES, the repeat-loop over Insert/Delete/Turn operators with I-aware Meek orientation), Theorem 15 (I-essential-graph characterisation — no undirected edge adjacent to an intervened node), Fig. 94 (DAG vs observational p-map PDAG vs I-essential graph for I={∅,{4}}), Fig. 95 (combined observational+interventional dataset, N=12, I={∅,{M}}), Fig. 96 with Example 41 (the toy {M,C,D} worked example: three greedy iterations with local score deltas and the returned I-essential graph)."
};
