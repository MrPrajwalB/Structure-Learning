/* RAI — Recursive Autonomy Identification. Grounded in §4.21 (pp.126-129):
   Algorithm 28 (RAI procedure), Definition 10 (exogenous cause), Definition 11
   (autonomous sub-structure), Proposition 7, and the 7-variable worked example
   in Figures 69-71 (true DAG {X1..X7}, decomposition into ancestor groups
   {X1} and {X3,X4,X5} plus descendant group {X2,X6,X7}). RAI builds on PC. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["rai"] = {
  name: "Recursive Autonomy Identification (RAI)",
  oneLiner: "A constraint-based learner that mirrors PC but is smarter about order: it runs conditional-independence tests in increasing conditioning-set size, orients what it can, then recursively splits the graph into autonomous sub-structures (ancestor groups and a descendant group) and learns each piece on its own with higher-order tests confined to that piece.",
  basedOnText: "RAI is a constraint-based method that 'mirrors the spirit of PC but applies it incrementally as structure is uncovered.' Its central idea is to decompose the current partially-directed graph into autonomous sub-structures that can be learned independently, thereby limiting the use of unreliable high-order CI tests.",

  assumptions: [
    "<b>Causal sufficiency</b> — no hidden common causes; every common cause is observed (inherited from PC).",
    "<b>Faithfulness</b> — every independence in the data reflects a missing connection in the true graph, so CI tests recover the structure.",
    "<b>Reliable CI tests</b> — an (ideally oracle) statistical test decides X ⫫ Y | U. RAI is built precisely to lean on the <i>low-order</i> tests, which are the most reliable, and to delay or localise the high-order ones."
  ],
  input: "A dataset D over variables V and a conditional-independence test CI(X ⫫ Y | U). RAI maintains one PDAG G over V, initialised once to the complete undirected graph; the recursion then refines it in place.",
  output: "A <b>CPDAG</b> (class PDAG): a graph with directed and undirected edges representing the Markov-equivalence class of the true DAG — the same kind of output as PC, but reached with fewer and lower-order tests.",

  idea: [
    "RAI starts from the same place as PC — a fully-connected graph that it prunes with CI tests — but it makes one key observation: tests with <i>small</i> conditioning sets are far more reliable than tests with large ones, and they are also cheaper. So instead of growing the conditioning set globally (PC's order 0, then 1, then 2, … over the whole graph), RAI does as much as it can at low order, then <b>shrinks the problem</b> before moving to higher order.",
    "After low-order pruning and orientation, the graph naturally falls into pieces. Some nodes sit <i>downstream</i> of the others — their parents lie inside their own group. Such a self-contained group is called an <b>autonomous sub-structure</b>: once you also feed it its <i>exogenous causes</i> (the few outside parents pointing in), it can be learned without ever looking at the rest of the graph. This is the formal justification (Definition 11, Proposition 7) for splitting the work.",
    "RAI collects the downstream nodes into a single <b>descendant block</b> G<sub>D</sub>; removing it leaves one or more disconnected <b>ancestor blocks</b> G<sub>A1</sub>, …, G<sub>Ar</sub>. Every cross-edge between an ancestor node and a descendant node must point ancestor → descendant, so cross-links can be oriented immediately.",
    "RAI then <b>recurses</b>: each ancestor block is learned at the next order (k+1), using conditioning sets drawn only from inside that block plus its already-resolved parents; finally the descendant block is learned at order k+1 with all the ancestors as its resolved parents. Because each recursive call works on a small piece, the high-order CI tests it must run involve only a handful of variables — which is exactly why RAI is more accurate and more scalable than plain PC."
  ],

  steps: [
    "<b>Initialise once.</b> Build the complete undirected graph over V and call RAI on the whole node set as the current block W, with no resolved ancestors A and starting order k = 0.",
    "<b>Thin cross-links at order k.</b> For each Y in the current block and each already-resolved ancestor X that points into Y, test X ⫫ Y | U with U a size-k subset of Y's <i>admissible parents</i> P(Y) (neighbours of Y that are not its children, together with ancestors in A pointing into Y). If independent, delete the link.",
    "<b>Orient by propagation.</b> Apply the standard PC orientation rules — find v-structures, then propagate forced directions — without creating new colliders or cycles, giving an updated PDAG.",
    "<b>Thin within W at order k.</b> For each remaining adjacency X−Y inside W, test X ⫫ Y | U with U a size-k subset of P(Y) \\ {X} (symmetrically, also using P(X) \\ {Y}); delete X−Y if independent.",
    "<b>Orient and decompose.</b> Re-apply propagation. Identify D, the nodes of W in the <i>lowest topological order</i> (the sink layer) — the <b>descendant block</b>. Remove D from W; the remaining connected components are the <b>ancestor blocks</b> W<sub>1</sub>, …, W<sub>r</sub>. By construction every cross-edge already points from an ancestor block into D.",
    "<b>Recurse on ancestors (order k+1).</b> For each ancestor block W<sub>i</sub>, call RAI with W = W<sub>i</sub>, the same ancestor context A, and order k+1. Each call uses conditioning sets drawn from its own block plus its admissible parents.",
    "<b>Recurse on the descendant block (order k+1).</b> Call RAI with W = D and A = A ∪ W<sub>1</sub> ∪ … ∪ W<sub>r</sub> at order k+1: the descendant is now learned using its internal admissible parents together with all the (now-resolved) ancestors as context.",
    "<b>Return.</b> A call finishes when neither cross-link thinning nor within-block thinning can remove any edge at order k and the recursive calls terminate at higher orders — i.e. no admissible conditioning set of size k exists for any remaining link. The refined PDAG is the result.",
    "<b>Result.</b> Assembling the pieces yields the final CPDAG: the directed/undirected edges all the recursive calls agreed on, representing the equivalence class of the true DAG."
  ],

  keyConcepts: [
    { term: "Conditioning-set order k", def: "The size of the set U used in a CI test X ⫫ Y | U. RAI processes order 0 first, then 1, then 2, …, doing all useful work at each order before going higher, because small-U tests are the most reliable." },
    { term: "Admissible parents P(Y)", def: "At the current stage, Y's candidate parents inside the working block — its neighbours that are not children of Y — plus any resolved ancestors already pointing into Y. Conditioning sets are drawn from here, never from Y's children." },
    { term: "Exogenous cause (Definition 10)", def: "A variable outside a sub-structure that one still needs to condition on to read off the right independencies inside it. These outside parents are fed into a sub-structure when it is learned." },
    { term: "Autonomous sub-structure (Definition 11)", def: "A node set whose parents all lie inside the set itself, once its exogenous causes are supplied. Such a set can be learned independently of the rest of the graph — the basis for RAI's recursion (Proposition 7)." },
    { term: "Descendant block G_D", def: "The nodes in the lowest topological order (the sink layer) of the current block — they sit downstream of everything else and are refined last, with all ancestors as context." },
    { term: "Ancestor blocks G_A1…G_Ar", def: "The disconnected components left after the descendant block is removed. Each is autonomous and is recursed into at the next order; cross-edges from an ancestor block into the descendant block are oriented ancestor → descendant." }
  ],

  animation: {
    title: "RAI on the paper's 7-variable worked example {X1..X7} (Figures 69-71): low-order pruning, decomposition into ancestor groups {X1} and {X3,X4,X5} plus descendant group {X2,X6,X7}, then recursion.",
    nodes: [
      { id: "X1", x: 0.10, y: 0.40 },
      { id: "X3", x: 0.60, y: 0.10 },
      { id: "X4", x: 0.45, y: 0.40 },
      { id: "X5", x: 0.90, y: 0.40 },
      { id: "X2", x: 0.30, y: 0.62 },
      { id: "X6", x: 0.50, y: 0.78 },
      { id: "X7", x: 0.62, y: 0.96 }
    ],
    edges: [
      { from: "X1", to: "X3", type: "undirected" }, { from: "X1", to: "X4", type: "undirected" },
      { from: "X1", to: "X5", type: "undirected" }, { from: "X1", to: "X2", type: "undirected" },
      { from: "X1", to: "X7", type: "undirected" },
      { from: "X3", to: "X4", type: "undirected" }, { from: "X3", to: "X5", type: "undirected" },
      { from: "X3", to: "X2", type: "undirected" }, { from: "X3", to: "X6", type: "undirected" },
      { from: "X3", to: "X7", type: "undirected" },
      { from: "X4", to: "X5", type: "undirected" }, { from: "X4", to: "X2", type: "undirected" },
      { from: "X4", to: "X6", type: "undirected" }, { from: "X4", to: "X7", type: "undirected" },
      { from: "X5", to: "X7", type: "undirected" },
      { from: "X2", to: "X6", type: "undirected" }, { from: "X2", to: "X7", type: "undirected" },
      { from: "X6", to: "X7", type: "undirected" }
    ],
    steps: [
      { caption: "<b>Start.</b> Like PC, RAI begins from the complete undirected graph on {X1,…,X7} and will prune it with CI tests — but it will work order-by-order and split the problem as soon as it can. (Faithful reconstruction of the paper's running example, Fig. 69b.)", ops: [{ op: "badge", text: "order k = 0", kind: "info" }] },
      { caption: "<b>Order 0 — marginal pruning.</b> Test pairs with the empty conditioning set. X1 turns out to be marginally independent of X3, X4 and X5, so those three links are spurious and are deleted (Fig. 69c).", ops: [{ op: "badge", text: "k = 0", kind: "info" }, { op: "testCI", x: "X1", y: "X3", z: [], result: "indep" }, { op: "removeEdge", from: "X1", to: "X3" }, { op: "removeEdge", from: "X1", to: "X4" }, { op: "removeEdge", from: "X1", to: "X5" }] },
      { caption: "<b>Order 0 — more deletions.</b> A few further marginal independencies thin the graph (e.g. X1 is not directly tied to X7, and X5 only connects through X3/X4). The remaining adjacencies define the working skeleton.", ops: [{ op: "badge", text: "k = 0", kind: "info" }, { op: "removeEdge", from: "X1", to: "X7" }, { op: "removeEdge", from: "X3", to: "X6" }, { op: "removeEdge", from: "X3", to: "X7" }, { op: "removeEdge", from: "X4", to: "X7" }, { op: "removeEdge", from: "X5", to: "X7" }] },
      { caption: "<b>Orient by propagation.</b> Run PC's orientation rules on what is known so far — find v-structures and propagate forced arrows, never adding a cycle or a new collider (Fig. 70a).", ops: [{ op: "highlightNodes", ids: ["X1", "X4", "X2"], cls: "hl" }, { op: "orient", from: "X1", to: "X2", type: "directed" }, { op: "orient", from: "X4", to: "X2", type: "directed" }, { op: "orient", from: "X2", to: "X6", type: "directed" } ] },
      { caption: "<b>Decompose into autonomous sub-structures.</b> The sink layer — nodes whose influence flows only downward — forms the <b>descendant block</b> G<sub>D</sub> = {X2,X6,X7}. Removing it leaves two disconnected <b>ancestor blocks</b> G<sub>A1</sub> = {X1} and G<sub>A2</sub> = {X3,X4,X5} (Fig. 69-70).", ops: [{ op: "set", name: "G_D (descendant)", items: ["X2", "X6", "X7"] }, { op: "highlightNodes", ids: ["X2", "X6", "X7"], cls: "add" }, { op: "badge", text: "descendant block found", kind: "good" }] },
      { caption: "<b>Highlight the ancestor blocks.</b> G<sub>A1</sub> = {X1} (a single node) and G<sub>A2</sub> = {X3,X4,X5}. Each is autonomous: its parents lie inside itself, so it can be learned on its own. Every cross-edge from an ancestor into G<sub>D</sub> already points ancestor → descendant.", ops: [{ op: "set", name: "G_A2 (ancestor)", items: ["X3", "X4", "X5"] }, { op: "highlightNodes", ids: ["X1", "X3", "X4", "X5"], cls: "hl" }] },
      { caption: "<b>Recurse into ancestor block G<sub>A2</sub> at order 1.</b> Now conditioning sets of size |U| = 1 are allowed, drawn only from inside the block. Test X4 ⫫ X5 | X3 → independent, so the X4–X5 link is removed (Fig. 70c).", ops: [{ op: "clearSet" }, { op: "set", name: "recurse: G_A2, k=1", items: ["X3", "X4", "X5"] }, { op: "highlightNodes", ids: ["X3", "X4", "X5"], cls: "hl" }, { op: "badge", text: "order k = 1", kind: "info" }, { op: "testCI", x: "X4", y: "X5", z: ["X3"], result: "indep" }, { op: "removeEdge", from: "X4", to: "X5" }] },
      { caption: "<b>G<sub>A2</sub> settles.</b> No v-structure is implied (X3 is in the separating set), so X3–X4 and X3–X5 stay undirected. With every node now having fewer than two admissible non-child neighbours, the next order-2 call has no work and the block terminates (Fig. 70d).", ops: [{ op: "highlightEdges", edges: [["X3", "X4"], ["X3", "X5"]], cls: "hl" }, { op: "badge", text: "G_A2 done", kind: "good" }] },
      { caption: "<b>Resolve cross-links into G<sub>D</sub>.</b> Back in the descendant block, first re-examine links between G<sub>D</sub> and the now-resolved ancestors with low-order tests, taking U from the resolved parents; propagation then orients them (Fig. 71a-c).", ops: [{ op: "clearSet" }, { op: "set", name: "recurse: G_D, A={X1,X3,X4,X5}", items: ["X2", "X6", "X7"] }, { op: "highlightNodes", ids: ["X2", "X6", "X7"], cls: "add" }, { op: "highlightEdges", edges: [["X1", "X2"], ["X4", "X2"]], cls: "hl" }] },
      { caption: "<b>Thin within G<sub>D</sub> at order 1.</b> Using the same conditioning-set restriction, test X7 ⫫ X2 | X6 → independent, so the X2–X7 link is removed. Orient X6 → X7 to avoid introducing a new v-structure (Fig. 71d).", ops: [{ op: "badge", text: "order k = 1", kind: "info" }, { op: "testCI", x: "X7", y: "X2", z: ["X6"], result: "indep" }, { op: "removeEdge", from: "X2", to: "X7" }, { op: "orient", from: "X6", to: "X7", type: "directed" }] },
      { caption: "<b>Orient remaining cross-edges ancestor → descendant.</b> Every edge from an ancestor node into the descendant block points downstream: X1 → X2 and X4 → X2 are confirmed, and X3 → X4 / X3 → X5 remain undirected inside the ancestor group.", ops: [{ op: "orient", from: "X1", to: "X2", type: "directed" }, { op: "orient", from: "X4", to: "X2", type: "directed" }, { op: "highlightNodes", ids: ["X2"], cls: "hl" }] },
      { caption: "<b>Result — the CPDAG (Fig. 71e).</b> X1→X2, X4→X2, X2→X6, X6→X7 directed; X3–X4 and X3–X5 undirected. RAI reached the same equivalence class as PC but localised testing to one small piece at a time, keeping conditioning sets small and reducing reliance on unreliable high-order tests.", ops: [{ op: "clearSet" }, { op: "badge", text: "CPDAG returned", kind: "good" }] }
    ]
  },

  complexity: "Same worst-case character as PC (exponential in the largest node degree), but in practice it runs many fewer and lower-order CI tests: the recursive decomposition confines each high-order test to a small autonomous block rather than the whole graph. This yields better accuracy and scalability than PC on sparse structures.",
  strengths: [
    "Performs CI tests in increasing conditioning-set order and does all useful low-order work first, so it leans on the most reliable tests.",
    "Recursive split into autonomous ancestor/descendant blocks shrinks the problem, so high-order tests involve only a few variables — improving both accuracy and scalability over PC.",
    "Cross-edges between an ancestor block and the descendant block are oriented immediately (ancestor → descendant), reducing orientation ambiguity.",
    "Outputs a CPDAG (equivalence class) just like PC, with no scoring function required."
  ],
  limitations: [
    "Still constraint-based: an erroneous early CI test removes or keeps an edge and the mistake cascades into the decomposition.",
    "Relies on faithfulness and causal sufficiency (no hidden confounders).",
    "Correctness of the decomposition depends on the partial orientation reached at each order; a wrong topological split misdirects the recursion."
  ],
  notes: "RAI's distinctive contribution over PC is the autonomy-based decomposition: it formalises which sub-structures can be learned independently (Definition 11 / Proposition 7) and exploits this to order CI tests by conditioning-set size while recursing into ancestor and descendant groups. Because the sub-structures are independent, the recursive calls could in principle be run in parallel.",
  figureRefs: "Paper §4.21 (pp.126-129): Algorithm 28 (RAI procedure), Definition 10 (exogenous cause), Definition 11 (autonomous sub-structure), Proposition 7, Lemma 1; running example Fig. 69 (true DAG on {X1..X7}, initialisation, order-0 pruning), Fig. 70 (orientation and decomposition into ancestor/descendant blocks), Fig. 71 (within-block thinning and final CPDAG)."
};
