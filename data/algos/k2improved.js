/* K2Improved — K2 with a data-driven variable order. Grounded in §5.15 (pp.363-364):
   the algorithm description (p.363), Lemma 26 (pruning by family scores), Example 113
   (Asia case: optimal families → K2 order), Recall 97 (strongly connected component),
   and the worked Asia example in Fig.227 (true DAG and the directed optimal-family graph
   that can contain cycles) and Fig.228 (SCC meta-graph G^SCC = {A, X, SBD, hypernode
   LTE={L,T,E}}, an example topological order, and the structure K2 learns from the
   concatenated data-driven order). K2Improved = K2 (§4.2) + an RAI/score-derived order. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["k2improved"] = {
  name: "K2Improved",
  oneLiner: "Removes K2's biggest weakness — its need for a hand-supplied variable order — by first deriving a good order automatically from the data (best-scoring parent sets → an optimal-family graph → collapse its cycles into strongly-connected hypernodes → topologically order the resulting DAG), then handing that order to ordinary K2.",
  basedOnText: "K2Improved (Behjati & Beigy) keeps K2's fast, order-driven greedy parent search but replaces the assumption of a known order with a data-driven order-construction stage, so the search is 'guided by empirical dependencies rather than chance.'",

  assumptions: [
    "<b>Discrete data + a decomposable family score</b> — like K2, variables are categorical and each node's fit is rated by a local, decomposable score (the paper uses BIC FamScore for the order-derivation stage).",
    "<b>No order supplied by the user</b> — unlike plain K2, the variable order is <i>not</i> given; it is computed from the data. This is the whole point of the method.",
    "<b>Optimal local families are computable</b> — for each variable the single best-scoring parent set can be found (efficiently, via sparse-parent-graph constructions plus informed search such as A*).",
    "<b>Inherited K2 assumptions</b> — Dirichlet priors and decomposability for the final K2 pass, so each node's parents can still be optimised independently once the order is fixed."
  ],
  input: "A discrete dataset D over variables V and a decomposable score. (No variable ordering is required — it is derived.)",
  output: "A <b>single DAG</b> over V, produced by K2 run on the automatically derived order; each node annotated with its chosen parent set.",

  idea: [
    "Plain K2 is fast and simple, but it must be <i>handed a correct topological order</i>: a node may only take parents from variables before it. If the order is wrong, K2 learns a wrong-direction or poor network. K2Improved's entire contribution is to <b>build that order from the data</b> first, then run K2 unchanged.",
    "Stage 1 asks a purely local question for every variable X on its own: <i>which single parent set scores best?</i> Call it Pa*<sub>X</sub>. Dominated parent sets are pruned away — Lemma 26 says a family that is beaten under the score can never be part of a score-optimal DAG, so it is safe to discard. This is cheap and only looks at one variable at a time.",
    "Stage 2 wires these best families into a directed <b>optimal-family graph</b>: draw Y → X whenever Y ∈ Pa*<sub>X</sub>. Because each variable picked its family independently, this graph <i>can contain directed cycles</i> (in the Asia example T's best family is {E,L}, and that creates cycles among T, L, E). The cycles are not noise — they carry ordering information: variables locked in a cycle have no clear precedence among themselves, but external edges still order whole cycles relative to one another.",
    "Stage 3 turns that intuition into an order. Each <b>strongly connected component</b> (SCC) — a maximal group where every node can reach every other — is collapsed into one <b>hypernode</b>, giving the meta-graph G<sup>SCC</sup>. Collapsing all cycles always yields a DAG, so G<sup>SCC</sup> can be <b>topologically ordered</b>. Inside each hypernode a small local order is found (a restricted/exact learner on just those few variables). Concatenating the intra-hypernode orders in the topological order of G<sup>SCC</sup> produces a single total order on V.",
    "Stage 4 simply <b>runs K2 with this derived order</b>. The expensive, error-prone guesswork (which order?) is now answered by the data; K2's familiar greedy 'add the best earlier-ordered parent' loop does the rest and returns one DAG."
  ],

  steps: [
    "<b>Stage 1 — best family per node.</b> For every variable X ∈ V, compute the highest-scoring parent set Pa*<sub>X</sub> under a decomposable score (e.g. BIC FamScore), <b>pruning dominated families</b>: if FamScore(X, Pa<sub>X</sub>) > FamScore(X, Pa'<sub>X</sub>) then Pa'<sub>X</sub> cannot be optimal and is discarded (Lemma 26).",
    "<b>Stage 1 (cont.) — efficient enumeration.</b> Find these optimal families with sparse-parent-graph constructions plus informed search (e.g. A*), so each X keeps only its single optimal parent set Pa*<sub>X</sub>.",
    "<b>Stage 2 — optimal-family graph.</b> Build a directed graph by adding Y → X whenever Y ∈ Pa*<sub>X</sub>. Because families were chosen independently, this graph <b>may contain directed cycles</b>.",
    "<b>Stage 3 — find strongly connected components.</b> Compute the SCCs of the optimal-family graph (a maximal set where every node reaches every other; a single node is its own SCC). Each SCC becomes a <b>hypernode</b>.",
    "<b>Stage 3 (cont.) — contract to the meta-graph G<sup>SCC</sup>.</b> Collapse each SCC to its hypernode. The contracted meta-graph is <b>always acyclic</b>, so it admits a topological order over hypernodes.",
    "<b>Stage 3 (cont.) — topologically order the hypernodes.</b> Read off a topological order of G<sup>SCC</sup>; this orders whole cycles/groups relative to each other.",
    "<b>Stage 3 (cont.) — order within each hypernode.</b> Inside each hypernode (each SCC) obtain a local order over its variables with a restricted structure learner (or an exact method when the SCC is small, e.g. by reusing the optimal-family construction), then read a node order from that local DAG.",
    "<b>Stage 3 (cont.) — concatenate into a total order.</b> Concatenate the intra-hypernode orders following the topological order of G<sup>SCC</sup>, producing a single total order on V — the data-driven order.",
    "<b>Stage 4 — run K2.</b> Pass the derived total order to ordinary K2: for each node in order, greedily add the earlier-ordered parent that most improves its local K2 score, stopping when no parent helps (or a parent cap is hit).",
    "<b>Return</b> the single DAG K2 produces from the data-driven order."
  ],

  keyConcepts: [
    { term: "Optimal family Pa*ₓ", def: "For a variable X, the single highest-scoring parent set under a decomposable score. K2Improved keeps only this best family per node after pruning dominated ones." },
    { term: "Pruning by family scores (Lemma 26)", def: "If one parent set for X scores strictly higher than another, the lower one can never appear in a score-optimal DAG, so it is safely discarded — making the search over families cheap." },
    { term: "Optimal-family graph", def: "The directed graph with Y → X whenever Y is in X's optimal family. Because families are chosen independently, it can contain directed cycles, which carry ordering information." },
    { term: "Strongly connected component (SCC) (Recall 97)", def: "A maximal set of nodes in which every node is reachable from every other. A single node is an SCC; a graph is acyclic exactly when it has no SCC with more than one vertex." },
    { term: "Meta-graph G^SCC / hypernode", def: "Collapsing each SCC to one hypernode yields the contracted meta-graph G^SCC, which is always a DAG and therefore admits a topological order over the hypernodes." },
    { term: "Concatenated data-driven order", def: "A total order on V built by ordering hypernodes topologically and stringing together a local order inside each hypernode — exactly the input plain K2 was missing." }
  ],

  animation: {
    title: "K2Improved on the paper's Asia example (Figs. 227-228): derive an order from optimal families, then run K2. Variables A=Asia, S=Smoking, T=Tuberculosis, L=Lung, B=Bronchitis, E=Either(tub./lung), X=X-ray, D=Dyspnea.",
    nodes: [
      { id: "A", x: 0.10, y: 0.12 },
      { id: "S", x: 0.55, y: 0.12 },
      { id: "T", x: 0.10, y: 0.40 },
      { id: "L", x: 0.40, y: 0.40 },
      { id: "B", x: 0.78, y: 0.40 },
      { id: "E", x: 0.30, y: 0.66 },
      { id: "X", x: 0.18, y: 0.92 },
      { id: "D", x: 0.55, y: 0.92 }
    ],
    edges: [],
    steps: [
      { caption: "<b>Start — no order given.</b> Unlike plain K2 (which must be handed a variable order), K2Improved starts with the raw Asia dataset on {A,S,T,L,B,E,X,D} and will <b>derive</b> the order from the data before any K2 search runs.", ops: [{ op: "badge", text: "PHASE 1: derive the order", kind: "info" }, { op: "highlightNodes", ids: ["A", "S", "T", "L", "B", "E", "X", "D"], cls: "hl" }] },
      { caption: "<b>Stage 1 — best family per node.</b> For every variable, compute its single highest-scoring parent set Pa*ₓ under BIC FamScore. Lemma 26 lets us <b>prune</b> any family that is beaten, since it can never be part of a score-optimal DAG.", ops: [{ op: "score", text: "FamScore_BIC(X, Paₓ) > FamScore_BIC(X, Pa'ₓ)  ⇒  Pa'ₓ pruned (Lemma 26)" }, { op: "badge", text: "optimal families Pa*ₓ", kind: "info" }] },
      { caption: "<b>Stage 2 — optimal-family graph (Fig.227b).</b> Draw Y → X whenever Y ∈ Pa*ₓ. Some families point at each other: e.g. T's best family is {E,L}, so we get T⇄L and links among T, L, E. Because families were chosen independently, this directed graph <b>can contain cycles</b>.", ops: [{ op: "addEdge", from: "S", to: "L", type: "directed" }, { op: "addEdge", from: "S", to: "B", type: "directed" }, { op: "addEdge", from: "T", to: "E", type: "directed" }, { op: "addEdge", from: "L", to: "E", type: "directed" }, { op: "addEdge", from: "E", to: "X", type: "directed" }, { op: "addEdge", from: "E", to: "D", type: "directed" }, { op: "addEdge", from: "B", to: "D", type: "directed" }, { op: "addEdge", from: "E", to: "T", type: "directed" }, { op: "addEdge", from: "E", to: "L", type: "directed" }] },
      { caption: "<b>Cycles carry ordering information.</b> Highlight the tangle among T, L and E: there is no clear precedence <i>within</i> the cycle, but external edges still order this whole group relative to the rest. The cycles must be resolved before we can read off an order.", ops: [{ op: "highlightNodes", ids: ["T", "L", "E"], cls: "add" }, { op: "highlightEdges", edges: [["T", "E"], ["E", "T"], ["L", "E"], ["E", "L"]], cls: "hl" }, { op: "badge", text: "cycle T–L–E", kind: "info" }] },
      { caption: "<b>Stage 3 — strongly connected components (Recall 97).</b> Find maximal groups where every node reaches every other. Here {T,L,E} form one SCC; A, S, B, X, D are singletons. Each SCC will become a single hypernode.", ops: [{ op: "set", name: "SCC", items: ["{T,L,E}", "{A}", "{S}", "{B}", "{X}", "{D}"] }, { op: "highlightNodes", ids: ["T", "L", "E"], cls: "add" }, { op: "badge", text: "SCCs found", kind: "good" }] },
      { caption: "<b>Contract to the meta-graph G^SCC (Fig.228b).</b> Collapse {T,L,E} into one hypernode (the paper labels it LTE), leaving hypernodes A, S, B, X, D. Collapsing every cycle <b>always yields a DAG</b>, so G^SCC has no cycles left.", ops: [{ op: "set", name: "Hypernodes", items: ["LTE = {T,L,E}", "A", "S", "B", "X", "D"] }, { op: "highlightNodes", ids: ["T", "L", "E"], cls: "add" }, { op: "badge", text: "G^SCC is a DAG", kind: "good" }] },
      { caption: "<b>Topologically order the hypernodes.</b> Since G^SCC is acyclic it admits a topological order, e.g. A, S before LTE, then B, then the sinks X and D. This orders whole groups relative to one another.", ops: [{ op: "set", name: "Hypernode order", items: ["A", "S", "LTE", "B", "X", "D"] }, { op: "badge", text: "topological order", kind: "info" }] },
      { caption: "<b>Order within the hypernode.</b> Inside the LTE hypernode (a small SCC) run a restricted/exact learner over just {T,L,E} to get a local order, e.g. L ≺ T ≺ E. Singleton hypernodes need no internal order.", ops: [{ op: "set", name: "Inside LTE", items: ["L", "T", "E"] }, { op: "highlightNodes", ids: ["L", "T", "E"], cls: "hl" }] },
      { caption: "<b>Concatenate → derived total order.</b> String the intra-hypernode orders together following the topological order of G^SCC: A ≺ S ≺ L ≺ T ≺ E ≺ B ≺ X ≺ D. This data-driven order is exactly the input plain K2 was missing.", ops: [{ op: "clearSet" }, { op: "set", name: "Derived order", items: ["A", "S", "L", "T", "E", "B", "X", "D"] }, { op: "badge", text: "order derived", kind: "good" }] },
      { caption: "<b>PHASE 2 — run K2 on the derived order.</b> Clear the optimal-family graph; K2 now starts from the empty DAG and adds, for each node in order, the earlier-ordered parent that most improves its local K2 score. Node E: try its predecessors and pick the best — add T → E.", ops: [{ op: "removeEdge", from: "S", to: "L" }, { op: "removeEdge", from: "S", to: "B" }, { op: "removeEdge", from: "T", to: "E" }, { op: "removeEdge", from: "L", to: "E" }, { op: "removeEdge", from: "E", to: "X" }, { op: "removeEdge", from: "E", to: "D" }, { op: "removeEdge", from: "B", to: "D" }, { op: "removeEdge", from: "E", to: "T" }, { op: "removeEdge", from: "E", to: "L" }, { op: "badge", text: "PHASE 2: K2 with derived order", kind: "info" }, { op: "score", text: "Node E: try A→E / S→E / L→E / T→E ⇒ pick highest = T→E" }, { op: "addEdge", from: "T", to: "E", type: "directed" }, { op: "addEdge", from: "L", to: "E", type: "directed" }] },
      { caption: "<b>K2 greedy parent addition continues.</b> Using only earlier-ordered candidates, K2 adds the best-scoring parents node by node: S → L, S → B, E → X, and E → D and B → D, each kept because it raises the local K2 score.", ops: [{ op: "score", text: "Node L: S→L raises score ⇒ add. Node B: S→B raises score ⇒ add." }, { op: "addEdge", from: "S", to: "L", type: "directed" }, { op: "addEdge", from: "S", to: "B", type: "directed" }, { op: "addEdge", from: "E", to: "X", type: "directed" }, { op: "addEdge", from: "E", to: "D", type: "directed" }, { op: "addEdge", from: "B", to: "D", type: "directed" }] },
      { caption: "<b>Final DAG (Fig.228c).</b> K2, run on the automatically derived order A ≺ S ≺ L ≺ T ≺ E ≺ B ≺ X ≺ D, returns a single acyclic Asia network — no user-supplied order needed. The order-derivation stage is what makes this possible.", ops: [{ op: "clearSet" }, { op: "highlightEdges", edges: [["T", "E"], ["L", "E"], ["S", "L"], ["S", "B"], ["E", "X"], ["E", "D"], ["B", "D"]], cls: "hl" }, { op: "badge", text: "DAG returned", kind: "good" }] }
    ]
  },

  complexity: "Stage 1 must find each variable's optimal family — the costly part — but pruning (Lemma 26) and sparse-parent-graph + informed search (A*) keep it tractable, and it is done per variable. SCC detection and topological sorting are linear in the optimal-family graph. The final K2 pass keeps K2's cost: roughly O(n²·d) local-score evaluations for n variables and parent cap d. Overall the added cost buys an automatically derived order in place of K2's assumed one.",
  strengths: [
    "Removes K2's central limitation: the variable order is learned from the data instead of being supplied by the user.",
    "The derived order is 'guided by empirical dependencies rather than chance', so K2's greedy search starts from a well-justified order.",
    "Reuses K2 wholesale for the final pass — keeping its speed, decomposable scoring and lack of cycle checks.",
    "Cycles in the optimal-family graph are handled cleanly by SCC contraction, which provably yields an acyclic meta-graph that can always be ordered."
  ],
  limitations: [
    "Still returns a single DAG (not the equivalence class) and inherits K2's greedy, no-backtracking parent search and discrete-data/Dirichlet assumptions.",
    "Quality of the final network depends on the derived order, which in turn depends on the score and the optimal-family estimates — a poor score still misleads it.",
    "Finding optimal families and ordering large strongly-connected components can be expensive when SCCs are big (exact methods are only cheap for small components).",
    "Like K2, it does not guarantee the global score-optimal DAG."
  ],
  notes: "K2Improved is the bridge between constraint/score ideas and K2: it answers 'where does K2's order come from?' by deriving it from best-scoring families. It sits in the same family of order-search wrappers around K2 (genetic, swarm, or greedy order search), but here the order comes from an optimal-family graph collapsed by strongly connected components rather than a black-box meta-search.",
  figureRefs: "Paper §5.15 (pp.363-364): the K2Improved algorithm description (p.363); Lemma 26 (pruning by family scores); Example 113 (Asia case — optimal families to a K2 order); Recall 97 (strongly connected component); Fig.227 (the true Asia DAG and the directed optimal-family graph that can contain cycles); Fig.228 (the contracted meta-graph G^SCC with hypernode LTE={L,T,E} plus A, X, SBD, an example topological order, and the structure K2 learns from the concatenated data-driven order)."
};
