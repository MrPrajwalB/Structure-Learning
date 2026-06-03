/* JT — Junction Tree (decompose–learn–append), distributed structure learning.
   Grounded in §4.31 (pp.159-162): Algorithm 37 (JT decompose–learn–append),
   Definition 37 (undirected independence graph), the clique-cover theorem, and
   Fig. 93 — the eight-stage Asia-network worked example (True DAG → moral graph →
   triangulation → maximal cliques → junction tree). Tagged distributed; Zhu et al. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["jt"] = {
  name: "Junction Tree (decompose–learn–append)",
  oneLiner: "Split the variables into overlapping clusters (the maximal cliques of a triangulated independence graph), arrange those clusters in a tree linked by shared 'separator' variables, learn a small Bayesian network inside each cluster independently, then append all the local results into one global structure.",
  basedOnText: "JT is a divide-and-conquer / distributed method: instead of searching the whole structure at once, it decomposes the problem along a junction tree so each clique can be learned locally and the pieces combined. Zhu et al. used a relative-average-entropy (RAE) global order plus K2 inside each clique; the survey's Algorithm 37 keeps only the decompose-and-local-learn skeleton.",

  assumptions: [
    "<b>An undirected independence graph is available or estimable</b> — a graph whose separations imply d-separations in the true DAG. The standard choice is the <b>moral graph</b> G<sup>m</sup> (connect co-parents, drop arrow directions); when the DAG is unknown it can be estimated from data (e.g. Markov-blanket estimation, or delete-edges-from-complete).",
    "<b>The true family of every node fits inside one clique</b> — each node together with its parents (F<sub>X</sub> = {X} ∪ Pa<sub>X</sub>) forms a clique of the moral graph, so after triangulation it sits inside some maximal clique C*. This is what guarantees the decomposition can recover every parent set locally.",
    "<b>A local structure learner is given</b> — LocalLearn can be any preferred routine restricted to a clique's variables (e.g. constraint-based PC, or a score-based search using BIC restricted to the clique)."
  ],
  input: "A dataset D over variables V, a way to obtain an undirected independence graph Ḡ (e.g. the moral graph), and a local structure learner LocalLearn that operates on any variable subset C ⊆ V.",
  output: "A global DAG G whose edge set is the union of the locally learned clique structures: E(G) ← ⋃<sub>C∈C</sub> E(G[C]), with V(G) ← V.",

  idea: [
    "Learning a Bayesian network over many variables is expensive because the search space explodes with the number of variables. JT's insight is that the dependence structure is <i>local</i>: each variable interacts directly only with a small neighbourhood. So instead of searching globally, group the variables into overlapping clusters and solve each cluster on its own.",
    "The clusters are not arbitrary — they are the <b>maximal cliques</b> of a <i>triangulated</i> (chordal) version of the independence graph. Triangulation guarantees these cliques can be arranged in a <b>junction tree</b>: a tree of clusters where any variable shared by two clusters also appears in every cluster on the path between them (the <i>running-intersection property</i>). The variables shared between adjacent clusters are the <b>separators</b>.",
    "Because each node's true family (the node plus its parents) is contained in some clique, a learner run <i>inside</i> a clique already sees all the information it needs to recover that node's local edges. That is the key fact that makes the decomposition correct: <b>local learning loses nothing</b>.",
    "What is distributed is the <b>structure search itself</b>: each clique can be learned independently and in parallel, communicating only through the variables they share on the separators. The separators are how overlapping clusters agree on the variables they have in common; the junction tree is the communication backbone. Finally the local edge sets are simply <b>appended</b> into one global graph.",
    "Zhu et al.'s original version first estimated a global variable ordering with relative average entropy (RAE) and then ran K2 inside each clique restricted to that order — the global order guaranteeing the combined graph is acyclic. The survey's Algorithm 37 removes the ordering step and keeps the decompose → learn-locally → append core, letting any local learner fill in each clique."
  ],

  steps: [
    "<b>Build the independence graph.</b> Obtain an undirected independence graph Ḡ on V from the data D — typically the moral graph (connect every pair of co-parents, then drop edge directions).",
    "<b>Triangulate.</b> Add 'fill-in' edges to Ḡ until it is chordal (every cycle of length ≥ 4 has a chord). Triangulation only adds edges, so every original clique is preserved. In the Asia example the single chord L–B makes the graph chordal.",
    "<b>Extract maximal cliques and build the junction tree.</b> Find all maximal cliques of the chordal graph and connect them with separators (their shared variables) so that the result is a tree satisfying the running-intersection property.",
    "<b>For each clique C: learn locally.</b> Run LocalLearn on C alone to obtain a local BN G[C]. Each node X ∈ C must pick its parents only from inside C. This is the distributed step — every clique is an independent sub-problem and can run in parallel.",
    "<b>Communicate over separators.</b> Adjacent cliques overlap exactly on their separator variables; those shared variables are how the local pieces stay consistent and how edges touching a separator are reconciled between clusters.",
    "<b>Append into the global structure.</b> Form G by taking V(G) ← V and E(G) ← ⋃<sub>C∈C</sub> E(G[C]) — the union of all the locally learned edges. (In Zhu et al.'s original method a precomputed global order keeps this union acyclic.)",
    "<b>Output</b> the global DAG G."
  ],

  keyConcepts: [
    { term: "Undirected independence graph Ḡ", def: "An undirected graph whose separations are sound: if Z separates X and Y in Ḡ, then X and Y are d-separated given Z in the true DAG. The standard choice is the moral graph." },
    { term: "Moral graph Gᵐ", def: "Built from a DAG by 'marrying' co-parents (joining every pair of nodes that share a child) and then dropping all arrow directions. It captures the undirected dependence structure." },
    { term: "Triangulation (chordal cover)", def: "Adding fill-in edges until every cycle of length four or more has a chord. It only adds edges, so existing cliques survive, and it makes a valid junction tree possible." },
    { term: "Maximal clique", def: "A fully-connected set of variables not contained in any larger fully-connected set. These become the clusters (the nodes of the junction tree). Each node's family lands inside one of them." },
    { term: "Junction tree", def: "A tree whose nodes are the maximal cliques, satisfying the running-intersection property: any variable in two cliques is also in every clique on the path between them." },
    { term: "Separator", def: "The set of variables shared by two adjacent cliques (drawn as rectangles between clique ellipses). Separators are the channel through which overlapping clusters stay consistent." },
    { term: "Local learner (LocalLearn)", def: "Any structure-learning routine restricted to one clique's variables — e.g. PC (constraint-based) or a BIC-scored search — used to obtain each G[C]." }
  ],

  animation: {
    title: "JT on the Asia network (paper Fig. 93): moral graph → triangulate → cliques → junction tree → learn locally → append.",
    nodes: [
      { id: "A", x: 0.10, y: 0.12 },
      { id: "S", x: 0.62, y: 0.12 },
      { id: "T", x: 0.26, y: 0.40 },
      { id: "L", x: 0.50, y: 0.40 },
      { id: "B", x: 0.78, y: 0.40 },
      { id: "R", x: 0.44, y: 0.66 },
      { id: "X", x: 0.12, y: 0.90 },
      { id: "D", x: 0.66, y: 0.90 }
    ],
    edges: [
      { from: "A", to: "T", type: "undirected" },
      { from: "S", to: "L", type: "undirected" },
      { from: "S", to: "B", type: "undirected" },
      { from: "T", to: "L", type: "undirected" },
      { from: "T", to: "R", type: "undirected" },
      { from: "L", to: "R", type: "undirected" },
      { from: "R", to: "B", type: "undirected" },
      { from: "R", to: "X", type: "undirected" },
      { from: "R", to: "D", type: "undirected" },
      { from: "B", to: "D", type: "undirected" }
    ],
    steps: [
      { caption: "<b>Start from the independence graph.</b> JT does not search the whole network at once. We begin with the undirected <b>moral graph</b> of the Asia variables {A,S,T,L,B,R,X,D} — co-parents joined, directions dropped (Fig. 93b).", ops: [{ op: "badge", text: "moral graph Ḡ", kind: "info" }] },
      { caption: "<b>Triangulate.</b> The graph is not yet chordal: the cycle L–B–R–T–L has no chord. Add the single fill-in edge <b>L–B</b> to make it chordal (Fig. 93c). Triangulation only adds edges, so no clique is lost.", ops: [{ op: "addEdge", from: "L", to: "B", type: "undirected" }, { op: "highlightEdges", edges: [["L","B"]], cls: "add" }, { op: "badge", text: "fill-in L–B", kind: "info" }] },
      { caption: "<b>Find the first maximal clique.</b> {B,L,S} is fully connected and not contained in a larger clique — a maximal clique of the triangulated graph (Fig. 93d). It becomes the first cluster of the junction tree.", ops: [{ op: "highlightNodes", ids: ["B", "L", "S"], cls: "hl" }, { op: "set", name: "Clique 1", items: ["B", "L", "S"] }] },
      { caption: "<b>Find the remaining clusters.</b> The other maximal cliques are {B,L,R}, {B,R,D}, {L,R,T}, {R,X} and {A,T}. Together these overlapping clusters cover every variable and every edge.", ops: [{ op: "highlightNodes", ids: ["B", "L", "R"], cls: "hl" }, { op: "set", name: "Clique 2", items: ["B", "L", "R"] }, { op: "set", name: "Clique 3", items: ["B", "R", "D"] }, { op: "set", name: "Clique 4", items: ["L", "R", "T"] }, { op: "set", name: "Clique 5", items: ["R", "X"] }, { op: "set", name: "Clique 6", items: ["A", "T"] }] },
      { caption: "<b>Connect cliques by separators.</b> Adjacent clusters share variables: {B,L,S} and {B,L,R} share the <b>separator {B,L}</b>, {B,L,R} branches to {B,R,D} via {B,R} and to {L,R,T} via {L,R}. The separators link the clusters into a junction tree with the running-intersection property (Fig. 93h).", ops: [{ op: "set", name: "Separator (1–2)", items: ["B", "L"] }, { op: "set", name: "Separator (2–3)", items: ["B", "R"] }, { op: "set", name: "Separator (2–4)", items: ["L", "R"] }, { op: "highlightNodes", ids: ["B", "L"], cls: "hl" }, { op: "badge", text: "junction tree built", kind: "good" }] },
      { caption: "<b>Learn cluster {B,L,S} locally.</b> Run the local learner on these three variables alone — each node picks parents only from inside the clique. It recovers S→L and S→B. This sub-problem is independent of every other clique.", ops: [{ op: "highlightNodes", ids: ["B", "L", "S"], cls: "hl" }, { op: "orient", from: "S", to: "L", type: "directed" }, { op: "orient", from: "S", to: "B", type: "directed" }, { op: "badge", text: "local-learn C1", kind: "info" }] },
      { caption: "<b>Learn cluster {B,L,R} locally — in parallel.</b> A separate local search over {B,L,R} recovers the edges among R and its clique-mates (here T→R and L→R, B→R). Distributed: this clique runs at the same time as the others.", ops: [{ op: "highlightNodes", ids: ["B", "L", "R"], cls: "hl" }, { op: "orient", from: "L", to: "R", type: "directed" }, { op: "orient", from: "B", to: "R", type: "directed" }, { op: "badge", text: "local-learn C2", kind: "info" }] },
      { caption: "<b>Communicate over the separator {B,L}.</b> Clusters {B,L,S} and {B,L,R} overlap exactly on {B,L}. The shared variables are how the two independently-learned pieces agree on B and L before being combined.", ops: [{ op: "highlightNodes", ids: ["B", "L"], cls: "hl" }, { op: "highlightEdges", edges: [["L","B"]], cls: "hl" }, { op: "badge", text: "separator {B,L}", kind: "info" }] },
      { caption: "<b>Learn the leaf clusters locally.</b> {B,R,D} gives R→D and B→D; {L,R,T} gives T→L and T→R; {R,X} gives R→X; {A,T} gives A→T. Every clique is a small, independent sub-problem.", ops: [{ op: "highlightNodes", ids: ["B", "R", "D", "L", "T", "X", "A"], cls: "hl" }, { op: "orient", from: "R", to: "D", type: "directed" }, { op: "orient", from: "B", to: "D", type: "directed" }, { op: "orient", from: "T", to: "L", type: "directed" }, { op: "orient", from: "T", to: "R", type: "directed" }, { op: "orient", from: "R", to: "X", type: "directed" }, { op: "orient", from: "A", to: "T", type: "directed" }, { op: "badge", text: "local-learn leaves", kind: "info" }] },
      { caption: "<b>Append into the global structure.</b> Take the union of all the local edge sets: E(G) ← ⋃<sub>C</sub> E(G[C]), keeping all variables V. The pieces, reconciled over their separators, snap together into one network.", ops: [{ op: "highlightEdges", edges: [["A","T"],["S","L"],["S","B"],["T","L"],["T","R"],["L","R"],["R","B"],["R","X"],["R","D"],["B","D"]], cls: "add" }, { op: "badge", text: "merge: E(G) = ⋃ E(G[C])", kind: "good" }] },
      { caption: "<b>Output the global DAG G.</b> The appended clique structures reproduce the Asia network — recovered by learning small clusters locally and combining them along the junction tree instead of searching all eight variables at once.", ops: [{ op: "badge", text: "global DAG G returned", kind: "good" }] }
    ]
  },

  complexity: "Cost is dominated by the largest clique, not by the total number of variables: each clique is a sub-problem of size = clique width, and the cliques can be learned in parallel. Triangulation/clique extraction is polynomial once a chordal cover is fixed, but finding a minimum-fill triangulation is NP-hard, so the achievable clique size (treewidth) controls overall efficiency.",
  strengths: [
    "Divide-and-conquer: large global search is replaced by many small, local clique searches.",
    "Naturally distributed/parallel — cliques are independent sub-problems communicating only via separators.",
    "Provably loses no parents: each node's family sits inside a clique, so local learning can recover it.",
    "Agnostic to the local learner — PC, K2, or BIC-scored search all plug in."
  ],
  limitations: [
    "Quality and acyclicity depend on the independence graph and the triangulation; a poor moral-graph estimate or a bad triangulation yields large cliques and weak results.",
    "Without Zhu et al.'s global ordering, naively unioning local edge sets can create conflicts or cycles that must be reconciled.",
    "Treewidth-bound: if the triangulated graph has a large clique, the 'local' sub-problem is no longer small.",
    "Reconciliation across separators is non-trivial when independent cliques disagree on shared edges."
  ],
  notes: "Zhu et al. originally estimated a global variable order via relative average entropy (RAE) and then applied K2 within each clique restricted to its vertices and that order, the global order guaranteeing acyclicity; the survey's Algorithm 37 drops the ordering step and keeps the decompose–learn-locally–append core with any local learner. Related work (Martínez et al.) focuses less on finding good separators and more on combining several locally learned structures — e.g. an incremental merge by importing structure region-by-region, or a consensus/majority-voting scheme (Colace et al.) over candidate networks from multiple learners.",
  figureRefs: "Paper §4.31 (pp.159–162): Algorithm 37 (JT decompose–learn–append), Definition 37 (undirected independence graph), the clique-cover theorem (each family F_X lies in a maximal clique C*), and Fig. 93 — the eight-stage Asia-network example (a) True DAG, (b) moral graph, (c) triangulation by L–B, (d) maximal clique {B,L,S}, (e)–(h) building the junction tree of cliques and separators."
};
