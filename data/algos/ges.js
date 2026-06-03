/* GES — Greedy Equivalence Search. Grounded in §4.12 (pp.80-84):
   Algorithm 17 (GES), Fig.46 (the six GES operators Insert/Delete/Make/Reverse over CPDAGs),
   Fig.47 + Example 21 (toy worked example on {M,C,D} with the BDeu score, forward phase). */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["ges"] = {
  name: "Greedy Equivalence Search",
  oneLiner: "A score-based greedy search that moves through the space of equivalence classes (CPDAGs) rather than single DAGs: a forward phase keeps adding the single edge that most improves the score, then a backward phase keeps removing the single edge that most improves it, re-forming the CPDAG after every move.",
  basedOnText: "GES is a two-phase score-based method that searches over Markov-equivalence classes. Under faithfulness it is asymptotically optimal — with enough data it recovers the equivalence class of the true DAG.",

  assumptions: [
    "<b>A decomposable, score-equivalent score</b> — e.g. BDeu or BIC. 'Decomposable' means the total score is a sum of per-node local scores, so a single edge change only affects a few terms; 'score-equivalent' means all DAGs in the same equivalence class get the same score.",
    "<b>Faithfulness</b> — every (in)dependence in the data is reflected by the true graph's structure, with no accidental cancellations.",
    "<b>Causal sufficiency</b> — no hidden common causes; all relevant variables are observed.",
    "<b>Large-sample (consistency)</b> — the optimality guarantee is asymptotic: it holds as the dataset grows large."
  ],
  input: "A dataset over variables V and a decomposable, score-equivalent scoring function (e.g. BDeu / BIC).",
  output: "A <b>CPDAG</b> (completed PDAG) — the highest-scoring equivalence class found, with directed and undirected edges representing a whole class of DAGs.",

  idea: [
    "GES asks a different question from constraint-based methods like PC: instead of testing independencies, it gives every candidate structure a <i>score</i> measuring how well it fits the data (while penalising complexity), and it greedily climbs toward higher scores.",
    "Its key trick is the search space. Rather than searching over individual DAGs, GES searches over <b>equivalence classes</b>, each drawn as a <b>CPDAG</b> (a graph mixing directed and undirected edges). Because DAGs that encode the same independencies score identically, working at the class level avoids wasting moves on structures that are really the same model.",
    "<b>Forward phase (insertions).</b> Starting from the empty graph, GES considers every legal single-edge <i>insertion</i>, scores the improvement each would bring, applies the single best one, then <b>re-forms the CPDAG</b> (some edges become directed, some undirected to reflect the new equivalence class). It repeats until no insertion improves the score — a local peak.",
    "<b>Backward phase (deletions).</b> From that peak, GES considers every legal single-edge <i>deletion</i>, applies the best-scoring one, re-forms the CPDAG, and repeats until no deletion helps. This phase prunes edges that the greedy forward phase added but that are not really needed.",
    "Each candidate change is realised by one of a small set of <b>operators</b> defined directly on the CPDAG (Insert, Delete, and variants like Make/Reverse), each with conditions guaranteeing the result is still a valid equivalence class. Because the score is decomposable, the gain of each operator is cheap to compute locally."
  ],

  steps: [
    "<b>Initialise.</b> Start from the empty CPDAG over all variables (no edges) and compute its score.",
    "<b>Forward — list candidates.</b> Enumerate every valid edge-<b>Insert</b> operator (and its CPDAG-level conditions). For each, compute the change in score Δ it would produce — cheap, because the score is decomposable so only a few local terms change.",
    "<b>Forward — apply the best.</b> Pick the insertion with the largest positive Δ and apply it. Re-form the CPDAG so it correctly represents the new equivalence class (edges may flip between directed and undirected).",
    "<b>Forward — repeat.</b> Re-list candidate insertions on the new CPDAG and apply the best each time. Stop when no insertion has a positive Δ — the forward local maximum.",
    "<b>Backward — list candidates.</b> Now enumerate every valid edge-<b>Delete</b> operator on the current CPDAG and compute each Δ.",
    "<b>Backward — apply the best.</b> Apply the deletion with the largest positive Δ and re-form the CPDAG.",
    "<b>Backward — repeat.</b> Continue deleting the best edge until no deletion improves the score.",
    "<b>Return</b> the final CPDAG — the highest-scoring equivalence class reached. Under faithfulness and large samples this is the equivalence class of the true DAG."
  ],

  keyConcepts: [
    { term: "Equivalence class / CPDAG", def: "A set of DAGs that encode exactly the same independencies (and hence get the same score), drawn as one CPDAG with directed edges where all members agree and undirected edges where they differ. GES searches over these classes." },
    { term: "Decomposable score", def: "A score (BDeu, BIC, …) that is a sum of per-node local terms. A single edge change touches only a few terms, so the gain Δ of each operator is computed cheaply and locally." },
    { term: "Score equivalence", def: "The property that two DAGs in the same equivalence class receive the same score. It is what makes searching over CPDAGs (instead of DAGs) well-defined." },
    { term: "Insert / Delete operators", def: "The moves GES makes on a CPDAG: an Insert adds one edge (forward phase), a Delete removes one (backward phase), each with conditions ensuring the result is a valid CPDAG (see Fig. 46)." },
    { term: "Forward then backward", def: "Two greedy hill-climbing phases: first add edges to a peak, then remove edges to a peak. Splitting growth and pruning is what gives GES its consistency guarantee." },
    { term: "Asymptotic optimality", def: "Under faithfulness and with enough data, GES is guaranteed to return the equivalence class of the true DAG — a property most greedy searches lack." }
  ],

  animation: {
    title: "GES forward then backward on a faithful 4-variable example {A,B,C,D} with a BDeu/BIC-style score (paper's worked example, Fig. 47 / Example 21, is the same procedure on 3 nodes; extended here so the backward phase and the directed/undirected CPDAG nature are both visible).",
    nodes: [
      { id: "A", x: 0.18, y: 0.20 },
      { id: "B", x: 0.78, y: 0.20 },
      { id: "C", x: 0.18, y: 0.82 },
      { id: "D", x: 0.78, y: 0.82 }
    ],
    edges: [],
    steps: [
      { caption: "<b>Start (empty CPDAG).</b> GES begins from the empty graph on {A,B,C,D} — no edges. It will greedily add the edge that most improves the score, then later prune.", ops: [{ op: "badge", text: "forward phase", kind: "info" }] },
      { caption: "<b>Forward, iteration 1 — score the candidate insertions.</b> Each possible single edge is scored by how much it would improve fit (minus a complexity penalty). Add A–C: +0.0012, Add C–D: +0.0017, Add A–B: +0.0003. The best is C–D.", ops: [{ op: "highlightNodes", ids: ["C", "D"], cls: "hl" }, { op: "score", text: "best insert C–D: score +0.0017" }] },
      { caption: "<b>Apply the best insertion (C–D).</b> The edge is added and the CPDAG is re-formed. With a single edge, both directions are equivalent, so it is drawn <i>undirected</i> — a one-edge equivalence class.", ops: [{ op: "addEdge", from: "C", to: "D", type: "undirected" }, { op: "highlightEdges", edges: [["C", "D"]], cls: "add" }, { op: "score", text: "score +0.0017" }] },
      { caption: "<b>Forward, iteration 2 — re-score insertions on the new CPDAG.</b> Add B–D: +0.0004 (best), Add A–C: -0.0002, Add A–B: +0.0001. Apply B–D.", ops: [{ op: "highlightNodes", ids: ["B", "D"], cls: "hl" }, { op: "addEdge", from: "B", to: "D", type: "undirected" }, { op: "highlightEdges", edges: [["B", "D"]], cls: "add" }, { op: "score", text: "best insert B–D: score +0.0004" }] },
      { caption: "<b>Forward, iteration 3 — apply A–C.</b> The next best insertion (+0.0006) connects A to C. The CPDAG is the chain/star A–C–D–B, still all undirected (no collider is forced yet).", ops: [{ op: "highlightNodes", ids: ["A", "C"], cls: "hl" }, { op: "addEdge", from: "A", to: "C", type: "undirected" }, { op: "highlightEdges", edges: [["A", "C"]], cls: "add" }, { op: "score", text: "best insert A–C: score +0.0006" }] },
      { caption: "<b>Forward, iteration 4 — apply A–D, which re-forms the CPDAG.</b> Adding A–D (+0.0005) creates the pattern where C and B are both parents of D with C,B non-adjacent → a v-structure C → D ← B is forced. GES re-forms the CPDAG, orienting those edges.", ops: [{ op: "highlightNodes", ids: ["A", "D"], cls: "hl" }, { op: "addEdge", from: "A", to: "D", type: "undirected" }, { op: "orient", from: "C", to: "D", type: "directed" }, { op: "orient", from: "B", to: "D", type: "directed" }, { op: "highlightEdges", edges: [["C", "D"], ["B", "D"]], cls: "add" }, { op: "score", text: "score +0.0005 → CPDAG re-formed" }] },
      { caption: "<b>Forward peak reached.</b> Every remaining insertion now has Δ ≤ 0 (e.g. Add B–C: -0.0004, Add A–B: -0.0002). No insertion improves the score, so the forward phase stops at this local maximum.", ops: [{ op: "badge", text: "no insertion helps — forward done", kind: "good" }, { op: "highlightEdges", edges: [["A", "C"], ["A", "D"], ["C", "D"], ["B", "D"]], cls: "dim" }] },
      { caption: "<b>Backward phase begins.</b> Now GES tries the reverse: score every single-edge <i>deletion</i> on the current CPDAG. Greedy growth often over-connects, so this phase prunes.", ops: [{ op: "badge", text: "backward phase", kind: "info" }] },
      { caption: "<b>Backward — score the deletions.</b> Delete A–D: +0.0009 (best — A–D was spurious, explained through C), Delete C–D: -0.0017, Delete B–D: -0.0011. The only positive move is removing A–D.", ops: [{ op: "highlightEdges", edges: [["A", "D"]], cls: "hl" }, { op: "score", text: "best delete A–D: score +0.0009" }] },
      { caption: "<b>Apply the best deletion (remove A–D).</b> The edge is deleted and the CPDAG is re-formed. The v-structure into D is preserved (C → D ← B), while A–C stays undirected.", ops: [{ op: "removeEdge", from: "A", to: "D" }, { op: "highlightEdges", edges: [["A", "C"]], cls: "add" }, { op: "score", text: "score +0.0009" }] },
      { caption: "<b>Backward — no deletion helps.</b> Removing any remaining edge now lowers the score (Delete A–C: -0.0006, Delete C–D: -0.0017, Delete B–D: -0.0011). The backward phase stops.", ops: [{ op: "badge", text: "no deletion helps — backward done", kind: "good" }] },
      { caption: "<b>Result — the final CPDAG.</b> A–C undirected, with the recovered v-structure C → D ← B. This single mixed (directed + undirected) graph represents the whole equivalence class GES learned. Under faithfulness and enough data, this is the true DAG's class.", ops: [{ op: "highlightEdges", edges: [["A", "C"], ["C", "D"], ["B", "D"]], cls: "add" }, { op: "badge", text: "CPDAG returned", kind: "good" }] }
    ]
  },

  complexity: "Each greedy step enumerates and scores candidate operators over the current CPDAG; with a decomposable score each operator's gain is a cheap local computation. The number of candidates grows with the number of variables and current edges, so per-step cost is polynomial in the number of variables, while the total depends on how many edges are added/removed. In practice it is heavier than constraint-based search but benefits from local score caching.",
  strengths: [
    "Asymptotically optimal: under faithfulness and large samples it provably recovers the true equivalence class — rare for a greedy method.",
    "Searches over equivalence classes (CPDAGs), avoiding redundant moves among score-equal DAGs.",
    "Uses a global score, so it weighs overall fit-vs-complexity rather than relying on many independent CI tests.",
    "Decomposable scores make each candidate move's gain cheap to evaluate and cache."
  ],
  limitations: [
    "Greedy: between its two phases it can still settle on a suboptimal class on finite data, despite the asymptotic guarantee.",
    "Needs a decomposable, score-equivalent score and a chosen distributional form / prior (e.g. BDeu hyperparameter).",
    "Assumes causal sufficiency (no hidden confounders) and faithfulness.",
    "Enumerating and re-forming CPDAGs after every move can be costly on dense or high-dimensional problems."
  ],
  notes: "GES operators are defined directly on the CPDAG (Fig. 46): Insert and Delete drive the two phases, with Make/Reverse-style variants for re-orienting edges; each operator has validity conditions so the result stays a legitimate equivalence class. Related work extends the idea: Schulte et al. and Zhang et al. combine GES-style equivalence-class search with discovered conditional dependencies, and an I-GREEDY-E variant ranks candidate edges (e.g. by the Maximal Information Coefficient) before the greedy search.",
  figureRefs: "Paper §4.12 (pp.80–84): Algorithm 17 (GES, forward + backward loops), Fig. 46 (the six GES operators Insert/Delete/Make/Reverse on CPDAGs), Fig. 47 with Example 21 (toy BDeu worked example showing the forward-phase iterations and re-formed CPDAGs)."
};
