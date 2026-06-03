/* SAR — Separation And Reunion (Liu et al., ref [813]). Constraint-based, distributed /
   divide-and-conquer. BUILDS ON SF (§4.25). Grounded in §4.39 (pp.192-196): SAR starts from an
   undirected independence graph Ḡ over V, recursively DECOMPOSES it with NODE SEPARATORS into a
   binary "separation tree" of overlapping subgraphs (SEPARATE), learns a DAG inside each leaf with a
   base learner (LOCAL LEARN), then REUNITES sibling DAGs bottom-up into one global DAG, re-learning
   only the edges among separator nodes and reorienting minimally so no v-structure is created or
   destroyed (REUNION). Worked example = the 9-variable running example {X1..X9} with separator
   Z={X2,X4}: Fig 116 (independence graph + min edge-cut / node separator), Fig 117 (separation tree),
   Fig 118 & Lemma 6 (only separator-node edges are re-learned), Fig 119 (decompose-learn-reunite
   workflow), Algorithm 48 (SAR: SEPARATE / REUNION), GC(X,Y) cut score Eq.(36), Theorems 22-23
   (parents-in-one-subgraph + reunion theorem). */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["sar"] = {
  name: "Separation And Reunion (SAR)",
  oneLiner: "Split the variables into two roughly balanced, overlapping parts by cutting the undirected independence graph at a small set of 'separator' nodes, recurse until the pieces are tiny, learn a DAG inside each piece on its own, then reunite the pieces bottom-up into one global DAG — re-learning only the edges among the shared separator nodes and gently reorienting so no collider is created or lost.",
  basedOnText: "SAR is a constraint-based method organised by DIVIDE-AND-CONQUER, in the same decomposition family as SF. Where SF cuts a moral graph at CLIQUE (edge) separators into prime blocks, SAR cuts an undirected independence graph at NODE separators into a binary SEPARATION tree, learns each leaf independently with any base learner, and then REUNITES the local DAGs — the crucial twist being that only the edges touching the shared separator nodes have to be reconsidered when two pieces are merged.",

  assumptions: [
    "<b>Causal sufficiency</b> — no hidden common causes; every common cause of measured variables is itself measured.",
    "<b>Faithfulness</b> — every independence in the data corresponds to a missing connection in the true graph, so the undirected independence graph and the node separators are meaningful.",
    "<b>A reliable undirected independence graph</b> — an initial graph Ḡ over V (e.g. a moral graph or other independence graph) can be built, whose node cuts are true d-separating sets.",
    "<b>A base structure learner</b> — any BN structure learner (constraint-based or score-based) can recover a DAG / P-map on a small leaf subgraph.",
    "<b>Decomposition / reunion theorems</b> — each node and its parents lie in a single leaf subgraph (Thm 22), and two sibling P-maps can be merged into an I-equivalent DAG by re-learning only separator edges and minimally reorienting (Thm 23, Lemma 6)."
  ],
  input: "A dataset 𝒟 over variables V, a base structure learner Learn, and (built from 𝒟) an undirected independence graph Ḡ over V.",
  output: "A single global <b>DAG</b> (the top DAG of the separation tree) that is I-equivalent to the structure a global learner would have found.",

  idea: [
    "SAR tackles the cost and fragility of learning one big structure by <i>cutting the problem in half, again and again</i>, along places where the variables barely interact — then solving the small pieces and sewing them back together.",
    "<b>Separation (divide).</b> SAR starts from an undirected independence graph Ḡ over all variables. It finds a bipartition (X,Y) that minimises a graph-cut score GC(X,Y) — i.e. a split that crosses as few edges as possible — and then picks the <i>smallest</i> set of nodes Z, taken entirely from one side, that touches every edge in that cut. This Z is a <b>node separator</b>: removing it disconnects X from Y. SAR replaces Ḡ by the two overlapping subgraphs on X∪Z and Y∪Z and recurses on each, building a binary <b>separation tree</b>. It stops splitting a piece K once the separator would be too big relative to the piece (|Z| > log|K|).",
    "<b>Local learning.</b> At each leaf of the separation tree, SAR runs an ordinary base learner to recover a small DAG over just that piece. Because each node together with all of its parents is guaranteed to live inside a single subgraph (Theorem 22), these local families are correct — the pieces are learned completely independently and can be done in parallel.",
    "<b>Reunion (conquer).</b> Walking the tree bottom-up, SAR merges each pair of sibling DAGs into their parent. The merge is cheap because of a key fact (Lemma 6): the only edges whose existence could differ between the two pieces are those <i>among the separator nodes</i> — every other edge is settled by the side that 'owns' it. So SAR re-tests just the separator-node edges (an edge in Z is kept only if it appears in <i>both</i> pieces), unions the rest, and then performs the minimal reorientations needed so that no v-structure is created or destroyed. The result is one global DAG, I-equivalent to a global search."
  ],

  steps: [
    "<b>Build the independence graph.</b> From the data 𝒟, construct an initial undirected independence graph Ḡ over V (e.g. a moral graph) whose edges capture direct dependencies.",
    "<b>SEPARATE — find the best cut.</b> Compute a bipartition (X,Y) of the current piece's nodes that minimises the graph-cut score GC(X,Y) = |E(X,Y)|/|X| + |E(X,Y)|/|Y| (Eq. 36), where E(X,Y) is the set of edges crossing the cut — a balanced split that severs few edges.",
    "<b>SEPARATE — choose the node separator Z.</b> From the minimum edge-cut E*(X,Y), select the smallest set Z ⊆ X or Z ⊆ Y that <i>touches every edge</i> in E*(X,Y). Z is a node separator: deleting it disconnects the two sides. (If no proper separator exists — Z is empty or one side is empty — this piece is a leaf.)",
    "<b>SEPARATE — recurse.</b> Replace the piece by the two overlapping subgraphs Ḡ<sub>L</sub> = Ḡ(X∪Z) and Ḡ<sub>R</sub> = Ḡ(Y∪Z) and call SEPARATE on each, building a binary <b>separation tree</b> 𝒯. Stop subdividing a piece K when the separator gets too large, |Z| > log|K|.",
    "<b>LOCAL LEARN — learn each leaf.</b> For every leaf subgraph Ḡ<sub>i</sub> of 𝒯, run the base learner Learn(Ḡ<sub>i</sub>, 𝒟) to obtain a small local DAG 𝒢<sub>i</sub>. Each node and all its parents lie in one leaf (Theorem 22), so the local families are correct; leaves are independent and can be learned in parallel.",
    "<b>REUNION — merge sibling DAGs (bottom-up).</b> For each internal node of 𝒯, take its two children's DAGs 𝒢<sub>1</sub> (over X∪Z) and 𝒢<sub>2</sub> (over Y∪Z) and call REUNION(𝒢<sub>1</sub>, 𝒢<sub>2</sub>).",
    "<b>REUNION — reconcile separator edges.</b> Set the node set to V<sub>𝒢₁</sub> ∪ V<sub>𝒢₂</sub>. By Lemma 6 only edges <i>among separator nodes</i> can disagree, so re-learn just those: union all non-separator edges, but keep an edge (X<sub>i</sub>,X<sub>j</sub>) with both endpoints in Z only if it appears in <b>both</b> 𝒢<sub>1</sub> and 𝒢<sub>2</sub> (Theorem 23). This deletes redundant cross-piece edges and resolves boundary edges.",
    "<b>REUNION — minimal reorientation.</b> Preserve all existing directions except for the smallest set of reorientations required so that <b>no v-structure is destroyed and none is introduced</b>. The merged graph is a DAG I-equivalent to 𝒢 over those nodes.",
    "<b>Return.</b> Continue merging up the tree until a single graph remains; <b>return</b> the top DAG of the separation tree — the global structure, I-equivalent to what a global learner would produce."
  ],

  keyConcepts: [
    { term: "Undirected independence graph Ḡ", def: "The starting point of SAR: an undirected graph over all variables (e.g. a moral graph) whose edges mark direct dependencies. Its node cuts are where SAR splits the problem." },
    { term: "Graph-cut score GC(X,Y)", def: "GC(X,Y) = |E(X,Y)|/|X| + |E(X,Y)|/|Y|, where E(X,Y) is the set of edges crossing the (X,Y) split (Eq. 36). SAR minimises it to find a balanced bipartition that cuts as few edges as possible." },
    { term: "Node separator Z", def: "The smallest set of nodes, drawn entirely from one side, that touches every edge in the minimum edge-cut. Removing Z disconnects X from Y; Z is shared by both resulting subgraphs (the overlap)." },
    { term: "Separation tree 𝒯", def: "The binary tree produced by recursively splitting Ḡ at node separators. Leaves are small overlapping subgraphs; internal nodes record how children must be reunited. Splitting stops when |Z| > log|K|." },
    { term: "Parents-in-one-subgraph (Theorem 22)", def: "Each variable together with all of its parents falls inside a single leaf subgraph, so locally learned families are correct — this is what makes independent local learning sound." },
    { term: "Lemma 6 (only separator edges need re-learning)", def: "When merging two pieces, the only edges that can differ between them are those among the separator nodes Z; every other edge is decided by the piece that contains it. This makes reunion cheap." },
    { term: "Reunion theorem (Theorem 23)", def: "To merge two sibling P-maps: union their nodes, keep a separator-node edge only if it is in BOTH pieces, and reorient minimally so no v-structure is created or destroyed. The result is I-equivalent to a global learner's DAG." }
  ],

  animation: {
    title: "SAR on the paper's 9-variable running example {X1..X9} (Figs 116-119). Node separator Z = {X2,X4}; SEPARATE → learn each piece → REUNITE.",
    nodes: [
      { id: "X1", x: 0.06, y: 0.20 },
      { id: "X3", x: 0.06, y: 0.78 },
      { id: "X2", x: 0.34, y: 0.30 },
      { id: "X4", x: 0.34, y: 0.70 },
      { id: "X5", x: 0.62, y: 0.16 },
      { id: "X7", x: 0.62, y: 0.50 },
      { id: "X6", x: 0.94, y: 0.16 },
      { id: "X8", x: 0.62, y: 0.84 },
      { id: "X9", x: 0.94, y: 0.62 }
    ],
    edges: [
      { from: "X1", to: "X2", type: "undirected" },
      { from: "X1", to: "X4", type: "undirected" },
      { from: "X3", to: "X2", type: "undirected" },
      { from: "X3", to: "X4", type: "undirected" },
      { from: "X2", to: "X4", type: "undirected" },
      { from: "X2", to: "X5", type: "undirected" },
      { from: "X4", to: "X7", type: "undirected" },
      { from: "X5", to: "X7", type: "undirected" },
      { from: "X5", to: "X6", type: "undirected" },
      { from: "X7", to: "X8", type: "undirected" },
      { from: "X7", to: "X9", type: "undirected" },
      { from: "X6", to: "X9", type: "undirected" },
      { from: "X8", to: "X9", type: "undirected" }
    ],
    steps: [
      { caption: "<b>Start — undirected independence graph Ḡ.</b> SAR begins from an undirected independence graph over all variables {X1..X9} (Fig 116a). Its edges capture direct dependencies; SAR will split it where the two halves barely interact.", ops: [{ op: "badge", text: "independence graph Ḡ", kind: "info" }] },
      { caption: "<b>SEPARATE — find the cut.</b> SAR searches for a balanced bipartition that crosses few edges, minimising GC(X,Y)=|E(X,Y)|/|X|+|E(X,Y)|/|Y| (Eq. 36). The minimum edge-cut here is the bundle of edges leaving X2 and X4 into the right side.", ops: [{ op: "badge", text: "minimise GC(X,Y)", kind: "info" }, { op: "score", value: "min edge-cut E*(X,Y)" }, { op: "highlightEdges", edges: [["X2","X5"],["X4","X7"]], cls: "hl" }] },
      { caption: "<b>SEPARATE — pick the node separator.</b> The smallest set of nodes that touches every cut edge is Z = {X2, X4} (Fig 116b). Removing Z disconnects the left part from the right part — Z is the shared boundary the two pieces will overlap on.", ops: [{ op: "highlightNodes", ids: ["X2", "X4"], cls: "hl" }, { op: "badge", text: "separator Z = {X2,X4}", kind: "good" }, { op: "set", name: "Separator Z", items: ["Z = {X2, X4}"] }] },
      { caption: "<b>SEPARATE — two overlapping subgraphs.</b> Ḡ is replaced by the LEFT piece on X∪Z = {X1,X3,X2,X4} and the RIGHT piece on Y∪Z = {X5,X6,X7,X8,X9,X2,X4}. Both contain the separator nodes X2,X4 (the overlap). SAR recurses, building a binary separation tree (Fig 117).", ops: [{ op: "badge", text: "separation tree 𝒯", kind: "info" }, { op: "set", name: "Subsets", items: ["Left = {X1,X3,X2,X4}", "Right = {X5,X6,X7,X8,X9,X2,X4}", "shared Z = {X2,X4}"] }] },
      { caption: "<b>LOCAL LEARN — left leaf {X1,X3,X2,X4}.</b> Run the base learner on just this piece. CI tests confirm X1 and X3 are independent given {X2,X4}, so no X1–X3 edge; the learner orients the family. Local DAG: X1→X2, X3→X2, X1→X4, X3→X4, X2→X4.", ops: [{ op: "highlightNodes", ids: ["X1", "X3", "X2", "X4"], cls: "hl" }, { op: "badge", text: "learn LEFT leaf", kind: "info" }, { op: "testCI", x: "X1", y: "X3", z: ["X2", "X4"], result: "indep" }, { op: "orient", from: "X1", to: "X2", type: "directed" }, { op: "orient", from: "X3", to: "X2", type: "directed" }, { op: "orient", from: "X1", to: "X4", type: "directed" }, { op: "orient", from: "X3", to: "X4", type: "directed" }, { op: "orient", from: "X2", to: "X4", type: "directed" }, { op: "set", name: "Local DAGs", items: ["𝒢_L over {X1,X3,X2,X4}"] }] },
      { caption: "<b>LOCAL LEARN — right leaf {X5,X6,X7,X8,X9,X2,X4}.</b> Learned independently (in parallel). The base learner finds X6 ⫫ X8 | {X7,X9}, so no X6–X8 edge, and orients the families that hang off the separator nodes X2,X4.", ops: [{ op: "highlightNodes", ids: ["X5", "X6", "X7", "X8", "X9", "X2", "X4"], cls: "hl" }, { op: "badge", text: "learn RIGHT leaf", kind: "info" }, { op: "testCI", x: "X6", y: "X8", z: ["X7", "X9"], result: "indep" }, { op: "orient", from: "X2", to: "X5", type: "directed" }, { op: "orient", from: "X4", to: "X7", type: "directed" }, { op: "orient", from: "X5", to: "X7", type: "directed" }, { op: "orient", from: "X5", to: "X6", type: "directed" }, { op: "orient", from: "X7", to: "X8", type: "directed" }, { op: "orient", from: "X7", to: "X9", type: "directed" }, { op: "orient", from: "X6", to: "X9", type: "directed" }, { op: "orient", from: "X8", to: "X9", type: "directed" }, { op: "set", name: "Local DAGs", items: ["𝒢_L over {X1,X3,X2,X4}", "𝒢_R over {X5..X9,X2,X4}"] }] },
      { caption: "<b>REUNION — only separator edges can disagree (Lemma 6).</b> Merging the two pieces, every edge OUTSIDE the separator is owned by one piece and simply kept. The only edge to re-examine is among the separator nodes themselves: X2–X4. SAR re-learns just that boundary.", ops: [{ op: "clearSet" }, { op: "badge", text: "REUNION (bottom-up)", kind: "info" }, { op: "highlightNodes", ids: ["X2", "X4"], cls: "hl" }, { op: "highlightEdges", edges: [["X2","X4"]], cls: "hl" }, { op: "set", name: "Re-learn", items: ["only separator-node edges", "candidate: X2–X4"] }] },
      { caption: "<b>REUNION — keep boundary edge if it is in BOTH pieces (Thm 23).</b> The separator edge X2→X4 was found in the LEFT piece and is consistent with the RIGHT piece, so it is kept. (Had it appeared in only one piece, it would be dropped.)", ops: [{ op: "orient", from: "X2", to: "X4", type: "directed" }, { op: "badge", text: "X2→X4 kept (in both)", kind: "good" }] },
      { caption: "<b>REUNION — remove a redundant cross edge.</b> Suppose local learning had left a spurious X4–X5 edge bridging the two pieces; it is NOT an edge owned by either side's interior and is not supported in both, so reunion deletes it. This is how conflicting/redundant boundary edges are cleaned up.", ops: [{ op: "highlightEdges", edges: [["X4","X7"],["X2","X5"]], cls: "dim" }, { op: "badge", text: "drop redundant boundary edges", kind: "info" }] },
      { caption: "<b>REUNION — minimal reorientation.</b> SAR keeps all directions except the fewest needed so that NO v-structure is created or destroyed. Here the colliders at X2 (X1→X2←X3) and at X9 (X7→X9←X6, X8→X9) are preserved across the merge; nothing new is introduced.", ops: [{ op: "highlightNodes", ids: ["X2", "X9"], cls: "hl" }, { op: "badge", text: "preserve v-structures", kind: "info" }] },
      { caption: "<b>Reunite up the tree.</b> The two leaf DAGs are now one DAG over all nine variables, glued at the separator nodes X2,X4. In a deeper tree, SAR keeps merging siblings bottom-up until a single graph remains (Fig 119).", ops: [{ op: "badge", text: "one DAG over V", kind: "good" }, { op: "highlightEdges", edges: [["X1","X2"],["X3","X2"],["X1","X4"],["X3","X4"],["X2","X4"],["X2","X5"],["X4","X7"],["X5","X7"],["X5","X6"],["X7","X8"],["X7","X9"],["X6","X9"],["X8","X9"]], cls: "add" }] },
      { caption: "<b>Result — the global DAG.</b> By SEPARATING at a small node cut, learning each overlapping piece on its own, and REUNITING with only the separator edges re-learned and minimal reorientation, SAR returns the top DAG of the separation tree — I-equivalent to what a single global learner would have produced, but from much smaller subproblems.", ops: [{ op: "badge", text: "DAG returned (I-equivalent)", kind: "good" }] }
    ]
  },

  complexity: "The win is divide-and-conquer: instead of learning one structure over all variables, SAR learns DAGs on small overlapping leaf subgraphs and merges them. Finding the minimum-cut bipartition / node separator and recursing builds a separation tree of size related to log|K| (splitting stops at |Z| > log|K|); each leaf's learning cost is bounded by the (small) base-learner cost on that piece, and reunion only re-learns separator-node edges. Leaves are independent and parallelisable. Worst case still inherits the base learner's complexity when the graph does not decompose well (one large leaf ≈ no speed-up).",
  strengths: [
    "Divide-and-conquer: turns one global structure search into many small independent ones, learned in parallel and then merged.",
    "Reunion is cheap — by Lemma 6 only the edges among separator nodes have to be reconsidered when two pieces are combined.",
    "Works with ANY base structure learner on the leaves (constraint-based or score-based), so it is a wrapper that inherits the base learner's strengths.",
    "Recovers a global DAG I-equivalent to a global search under faithfulness (Theorems 22-23), with smaller, more reliable subproblems."
  ],
  limitations: [
    "Quality depends on the initial undirected independence graph — a wrong Ḡ produces wrong cuts and wrong separators.",
    "Gains shrink when the graph does not decompose well: if no small node separator exists, one large leaf gives little speed-up.",
    "The reunion reorientation must be done carefully — a mishandled boundary can create or destroy a v-structure and break I-equivalence.",
    "Inherits constraint-based fragility (unreliable CI tests inside leaves) and assumes causal sufficiency — no hidden confounders."
  ],
  notes: "SAR (Liu et al., ref [813]) is built on Structure-Finder (SF) and belongs to the same DECOMPOSITION family: both split an undirected representation and learn locally before recombining. The difference is the cut and the merge — SF uses CLIQUE (edge) separators to form prime blocks and tests CI within them, whereas SAR uses NODE separators to form a binary separation tree of overlapping subgraphs, learns each leaf with a generic base learner, and reunites by re-learning only separator edges with minimal reorientation. The animation uses the paper's 9-variable running example (Figs 116-119) with separator Z={X2,X4}; the spurious X4–X5 boundary edge in the reunion step is illustrative of how redundant cross-piece edges are removed.",
  figureRefs: "Paper §4.39 (pp.192-196), Liu et al. [813]: Algorithm 48 (SAR — SEPARATE & REUNION functions), Eq. (36) (graph-cut score GC(X,Y)), Fig 116 (running example: independence graph Ḡ and node separator Z={X2,X4} from a minimum edge-cut), Fig 117 (separation tree by recursive node-separator decomposition), Fig 118 & Lemma 6 (only separator-node edges are re-learned on reunion), Fig 119 (decomposition–relearning–reunion workflow), Theorem 22 (each node's parents lie in one subgraph), Theorem 23 (reunion theorem: keep separator edge only if in both, minimal reorientation, I-equivalence)."
};
