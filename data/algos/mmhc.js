/* MMHC — Max-Min Hill-Climbing. Grounded in §5.3 (pp.327-328):
   Algorithm 94 (MMHC: Max-Min Hill-Climbing), §5.3.1 (the algorithm: two-stage
   hybrid = MMPC neighbourhoods + restricted hill-climbing), §5.3.2 (related work).
   MMHC = MMPC (skeleton / candidate neighbours) + HC (scored orientation), so this
   page reuses the structure of pc.js and combines the mmpc.js and hc.js building blocks.
   The paper gives no dedicated worked figure for MMHC, so the animation uses a faithful
   5-node example (stated in the animation title). */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["mmhc"] = {
  name: "Max-Min Hill-Climbing (MMHC)",
  oneLiner: "Learn the structure in two stages: first use MMPC to find each variable's candidate neighbours (an undirected skeleton from independence tests), then run score-based hill-climbing that may only add edges allowed by that skeleton — so the constraint phase shrinks and guides the score search.",
  basedOnText: "MMHC is the archetypal HYBRID method (Tsamardinos et al.): it marries a constraint-based skeleton learner (MMPC) with a score-based search (hill-climbing). The skeleton restricts which edges the score search is even allowed to add, making the search smaller, faster and often more accurate than unconstrained hill-climbing.",

  assumptions: [
    "<b>Faithfulness and reliable CI tests</b> — the MMPC stage needs the data's (in)dependences to reflect the true graph so that genuine neighbours are never screened off; errors here can omit a true edge from the candidate set.",
    "<b>A decomposable score</b> (e.g. BIC, BDeu) for the hill-climbing stage — the total score is a sum of per-variable local terms, so a single edge change only re-scores one or two families.",
    "<b>Acyclicity is enforced</b> — every graph the search visits must stay a valid DAG; any add/reverse that would create a cycle is rejected.",
    "<b>Causal sufficiency</b> — the usual no-hidden-confounders backdrop inherited from the constraint-based component."
  ],
  input: "A dataset 𝒟 over variables V, a CI test (for MMPC), a decomposable score(𝒢 | 𝒟) (e.g. BIC), the operator set {add, delete, reverse}, and an initial DAG 𝒢₀ (usually empty).",
  output: "A single <b>DAG 𝒢</b> — the highest-scoring graph encountered by the restricted hill-climbing search.",

  idea: [
    "MMHC splits structure learning into a cheap pruning stage and a focused scoring stage. <b>Stage 1 (constraint, MMPC):</b> for every variable X it runs the MMPC routine, which uses conditional-independence tests to return PC<sub>X</sub> — X's candidate parents and children, i.e. its direct neighbours in the undirected skeleton. This stage decides <i>which edges are even possible</i>.",
    "<b>Stage 2 (score, hill-climbing):</b> starting from the empty DAG, MMHC greedily applies the single add / delete / reverse move that most improves a decomposable score (e.g. BIC), exactly like ordinary hill-climbing — with one crucial twist. An edge addition Y → X is only considered if Y ∈ PC<sub>X</sub>. The skeleton from Stage 1 is a whitelist of allowed additions.",
    "This is the centrepiece of the method: <b>the skeleton restricts the score search</b>. Unconstrained hill-climbing must weigh adding any of the ~n² possible edges at every step; MMHC only weighs the handful that MMPC marked as plausible neighbours. The search space collapses, so the scored phase is far faster and tends to be more accurate because obviously-spurious edges are never even scored.",
    "Deletions and reversals are <i>not</i> restricted — they work on edges already present, so they let the score phase correct false positives that MMPC's tests may have let through. The trade-off (noted in the paper): if a true neighbour is wrongly omitted from some PC<sub>X</sub>, the addition Y → X will never be proposed, so that edge can never be recovered. The constraint stage can only ever remove possibilities, never restore them."
  ],

  steps: [
    "<b>Stage 1 — local neighbourhoods.</b> For each variable X ∈ V, run MMPC on 𝒟 to obtain PC<sub>X</sub>, the candidate set of parents and children of X (its direct neighbours in the undirected skeleton). Together the PC<sub>X</sub> sets form the candidate skeleton.",
    "<b>Initialise the search.</b> Set the current graph 𝒢 ← 𝒢₀ (commonly the empty DAG) and cache the sufficient statistics so decomposable family-score updates are cheap.",
    "<b>Build the admissible moves (restricted neighbourhood).</b> Generate every single-edge change that keeps the graph acyclic, but <b>restrict additions using the MMPC skeleton</b>: an edge add Y → X is admissible only if Y ∈ PC<sub>X</sub>. Edge <i>delete</i> Y → X and <i>reverse</i> Y → X are admissible for any present edge (unrestricted).",
    "<b>Score every admissible move.</b> For each admissible operator o, compute the local score gain Δscore(𝒢; o) using decomposability — only the families (parent sets) actually changed need re-scoring; the rest are cached.",
    "<b>Pick the best move.</b> Let o* be the admissible move with maximal positive gain (break ties arbitrarily).",
    "<b>Move or stop.</b> If no admissible move improves the score, <b>terminate</b>. Otherwise apply o*: set 𝒢 ← o*(𝒢) and return to building the admissible moves.",
    "<b>Output 𝒢</b> — the highest-scoring DAG encountered by the search."
  ],

  keyConcepts: [
    { term: "Hybrid method", def: "An algorithm that combines a constraint-based stage (independence tests) with a score-based stage (graph scoring). MMHC is the classic example: MMPC supplies the skeleton, hill-climbing orients and finalises it." },
    { term: "Candidate neighbours PCₓ", def: "The Parents-and-Children set of X returned by MMPC — X's direct neighbours in the undirected skeleton, learned from CI tests, left unoriented. They define which edges the score search may add." },
    { term: "Skeleton restriction (the whitelist)", def: "The rule that an edge addition Y → X is allowed only if Y ∈ PCₓ. This is what shrinks the score search: instead of all ~n² possible edges, only the MMPC-approved ones are ever scored." },
    { term: "Decomposable score (BIC/BDeu)", def: "A score that is a sum of per-variable local terms. A single edge change touches only one or two families, so each candidate move is re-scored by recomputing just those terms — making the many evaluations cheap." },
    { term: "Local operators (add / delete / reverse)", def: "The three single-edge moves the hill-climbing stage uses. Additions are restricted to skeleton edges; deletions and reversals are unrestricted, which lets the score phase undo MMPC's false positives." },
    { term: "False positive / false negative trade-off", def: "Deletions/reversals can correct edges MMPC wrongly admitted (false positives). But an edge MMPC wrongly omitted (false negative) can never be added back — the constraint stage only removes possibilities." }
  ],

  animation: {
    title: "MMHC on a faithful 5-node example {A,B,C,D,E} (no dedicated figure in the paper). Stage 1: MMPC skeleton; Stage 2: hill-climbing restricted to skeleton edges.",
    nodes: [
      { id: "A", x: 0.06, y: 0.5 },
      { id: "B", x: 0.34, y: 0.5 },
      { id: "C", x: 0.62, y: 0.14 },
      { id: "D", x: 0.62, y: 0.86 },
      { id: "E", x: 0.95, y: 0.5 }
    ],
    edges: [],
    steps: [
      { caption: "<b>Goal.</b> MMHC is a two-stage hybrid. <b>Stage 1</b> runs MMPC for every variable to learn an undirected <i>skeleton</i> of candidate neighbours; <b>Stage 2</b> runs scored hill-climbing that may only add edges from that skeleton. We start with no edges.", ops: [{ op: "badge", text: "Stage 1: MMPC", kind: "info" }, { op: "highlightNodes", ids: ["A","B","C","D","E"], cls: "dim" }] },
      { caption: "<b>MMPC — neighbours of B.</b> Running MMPC with target B keeps the variables that stay associated with B under every conditioning subset: A, C and D resist screening. Add undirected skeleton edges A–B, B–C, B–D. PC<sub>B</sub> = {A, C, D}.", ops: [{ op: "testCI", x: "A", y: "B", z: [], result: "dep" }, { op: "addEdge", from: "A", to: "B", type: "undirected" }, { op: "addEdge", from: "B", to: "C", type: "undirected" }, { op: "addEdge", from: "B", to: "D", type: "undirected" }, { op: "set", name: "PC_B", items: ["A","C","D"] }, { op: "highlightNodes", ids: ["B"], cls: "target" }] },
      { caption: "<b>MMPC — neighbours of E.</b> Running MMPC with target E retains C and D (neither can be screened off from E), but B can: B ⫫ E given {C,D}, so B is not a neighbour of E. Add skeleton edges C–E, D–E. PC<sub>E</sub> = {C, D}.", ops: [{ op: "testCI", x: "B", y: "E", z: ["C","D"], result: "indep" }, { op: "addEdge", from: "C", to: "E", type: "undirected" }, { op: "addEdge", from: "D", to: "E", type: "undirected" }, { op: "set", name: "PC_E", items: ["C","D"] }, { op: "highlightNodes", ids: ["E"], cls: "target" }] },
      { caption: "<b>Skeleton complete.</b> Repeating MMPC for every node (with symmetry correction) gives the candidate skeleton: A–B, B–C, B–D, C–E, D–E. These five undirected edges are the <i>only</i> additions the score search will be allowed to make.", ops: [{ op: "badge", text: "MMPC skeleton", kind: "good" }, { op: "highlightEdges", edges: [["A","B"],["B","C"],["B","D"],["C","E"],["D","E"]], cls: "good" }] },
      { caption: "<b>Stage 2 — hill-climbing starts.</b> Begin from the empty DAG and score single-edge moves with a decomposable score (BIC). The search space is tiny: only the 5 skeleton edges may be ADDED (each in either direction). Edges A–C, A–D, A–E, B–E, C–D are off the table.", ops: [{ op: "clearSet", name: "PC_B" }, { op: "clearSet", name: "PC_E" }, { op: "removeEdge", from: "A", to: "B" }, { op: "removeEdge", from: "B", to: "C" }, { op: "removeEdge", from: "B", to: "D" }, { op: "removeEdge", from: "C", to: "E" }, { op: "removeEdge", from: "D", to: "E" }, { op: "badge", text: "Stage 2: restricted HC", kind: "info" }, { op: "set", name: "Allowed adds", items: ["A–B","B–C","B–D","C–E","D–E"] }] },
      { caption: "<b>Best move: add A → B.</b> Among the allowed skeleton additions, orienting A → B gives the largest score gain, so apply it. Note the search never even scored A–C, A–E etc. — the skeleton restricted them away.", ops: [{ op: "score", text: "add A→B : ΔBIC = +7.4 (best allowed)" }, { op: "addEdge", from: "A", to: "B", type: "directed" }, { op: "highlightEdges", edges: [["A","B"]], cls: "hl" }, { op: "badge", text: "added A→B", kind: "good" }] },
      { caption: "<b>Best move: add B → C.</b> Next the highest-scoring allowed addition is B → C. Apply it. Only skeleton edges compete at each step, so each iteration weighs a handful of moves, not ~n².", ops: [{ op: "score", text: "add B→C : ΔBIC = +5.1 (best allowed)" }, { op: "addEdge", from: "B", to: "C", type: "directed" }, { op: "highlightEdges", edges: [["B","C"]], cls: "hl" }, { op: "badge", text: "added B→C", kind: "good" }] },
      { caption: "<b>Best move: add B → D.</b> Apply the next-best allowed addition, B → D. The graph so far is A→B, B→C, B→D — all drawn from skeleton edges.", ops: [{ op: "score", text: "add B→D : ΔBIC = +4.3 (best allowed)" }, { op: "addEdge", from: "B", to: "D", type: "directed" }, { op: "highlightEdges", edges: [["B","D"]], cls: "hl" }, { op: "badge", text: "added B→D", kind: "good" }] },
      { caption: "<b>Add C → E, then D → E — a collider forms.</b> The two remaining skeleton edges both improve the score pointing into E, giving C → E ← D. Every added edge came from the MMPC skeleton.", ops: [{ op: "score", text: "add C→E (+3.8), add D→E (+3.6)" }, { op: "addEdge", from: "C", to: "E", type: "directed" }, { op: "addEdge", from: "D", to: "E", type: "directed" }, { op: "highlightEdges", edges: [["C","E"],["D","E"]], cls: "hl" }, { op: "badge", text: "collider C→E←D", kind: "good" }] },
      { caption: "<b>Reversal corrects a false positive.</b> Reversals are NOT restricted to the skeleton. Here flipping B → C to C → B raises the score (it fits the data better), so the search applies it — using a move the constraint stage could not have chosen.", ops: [{ op: "score", text: "reverse B→C ⇒ C→B : ΔBIC = +1.2" }, { op: "removeEdge", from: "B", to: "C" }, { op: "addEdge", from: "C", to: "B", type: "directed" }, { op: "highlightEdges", edges: [["C","B"]], cls: "hl" }, { op: "badge", text: "reverse (unrestricted)", kind: "info" }] },
      { caption: "<b>Local optimum reached.</b> No allowed addition, deletion or reversal improves the BIC. Because additions were confined to the small MMPC skeleton, the search examined far fewer graphs than unconstrained hill-climbing would have.", ops: [{ op: "score", text: "all admissible moves: Δ ≤ 0" }, { op: "badge", text: "local optimum", kind: "bad" }, { op: "clearSet", name: "Allowed adds" }] },
      { caption: "<b>Output — the highest-scoring DAG.</b> MMHC returns A→B, C→B, B→D, C→E, D→E. The constraint stage (MMPC) decided what edges were possible; the score stage (HC) decided their directions and pruned the rest — the skeleton restricting the search throughout.", ops: [{ op: "highlightEdges", edges: [["A","B"],["C","B"],["B","D"],["C","E"],["D","E"]], cls: "good" }, { op: "highlightNodes", ids: ["A","B","C","D","E"], cls: "good" }, { op: "badge", text: "return best DAG", kind: "good" }] }
    ]
  },

  complexity: "Stage 1 runs MMPC once per variable; each MMPC call is local and stays cheap on sparse problems (the c_max cap on conditioning-set size keeps the CI tests tractable). Stage 2 is hill-climbing, but each iteration only scores additions allowed by the skeleton — roughly O(total skeleton edges) candidate adds instead of O(n²) — and decomposability re-scores just the changed families. The skeleton restriction is exactly what makes the score search small and fast; the method is a heuristic with no global-optimum guarantee.",
  strengths: [
    "<b>Best of both worlds:</b> CI tests cheaply prune the space (MMPC) and a score then orients/refines within it (HC), often more precise than unconstrained hill-climbing.",
    "The skeleton restriction dramatically shrinks the score search — only candidate-neighbour edges are ever scored — so MMHC scales to many variables.",
    "Deletions and reversals are unrestricted, so the score phase can correct false-positive edges that the CI tests admitted.",
    "Built from two proven components (MMPC + hill-climbing), making it a well-understood, widely-used hybrid baseline."
  ],
  limitations: [
    "A true neighbour wrongly omitted from some PC<sub>X</sub> can never be added — the constraint stage only removes possibilities, so Stage-1 false negatives are unrecoverable.",
    "Inherits both components' weaknesses: sensitivity to CI-test errors (MMPC) and getting stuck at a local optimum (hill-climbing).",
    "Quality depends on the chosen CI test/level α and the decomposable score; poor choices in either stage degrade the result.",
    "Like all greedy search, it returns a single DAG with no guarantee of being the global score maximum."
  ],
  notes: "MMHC (Algorithm 94, §5.3.1) launched a whole family of hybrids that share its motif — a constraint-based skeleton followed by a score-based search confined to that skeleton (§5.3.2 lists many: Dash &amp; Druzdzel, van Dijk et al., Jia et al., PCHC, the VTH method, and others). Variants differ in how the skeleton is built, whether orientation is done by collider rules or scoring, and whether the final refinement uses tabu or equivalence-class search. The defining idea throughout is letting the cheap constraint stage <i>restrict</i> the expensive score stage.",
  figureRefs: "Paper §5.3 (pp.327–328): Algorithm 94 (MMHC: Max-Min Hill-Climbing), §5.3.1 (the two-stage hybrid — MMPC neighbourhoods PC_X then restricted hill-climbing), §5.3.2 (related hybrid work). Builds on §4.11 (MMPC) and §4.3 (Hill Climbing). The paper gives no dedicated worked figure for MMHC, so the animation uses a faithful 5-node example."
};
