/* GGSL — Graph Growing Structure Learning. Grounded in §4.38 (pp.190-191), ref [201],
   built on OrderedGS / the local-to-global (LocalLearn) family. Worked examples:
   Example 54 + Fig.112 (LocalLearn around B) and Example 55 + Figs.113-114 (growing to D,
   with the global graph updated on the fly). True DAG (Fig.112a): A→B, A→C, B→D, C→D, D→E. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["ggsl"] = {
  name: "Graph Growing Structure Learning (GGSL)",
  oneLiner: "Grow the whole network outward from one seed variable: learn the seed's local neighbourhood (its parents-children, then its spouses), put the newly discovered variables on a frontier, then learn the local structure of each frontier variable in turn — expanding until every variable is reached and the single global graph is complete.",
  basedOnText: "GGSL is a local-to-global method, but instead of learning every node's local structure independently and merging them afterwards, it grows ONE global graph sequentially: a target's local neighbourhood is discovered, the graph is updated immediately, and the already-learned part is reused to shrink the candidate set for the next target.",

  assumptions: [
    "<b>Faithfulness</b> — every (in)dependence in the data reflects the true graph, so each variable's local neighbourhood (parents-children and spouses) is recoverable from CI tests.",
    "<b>Causal sufficiency</b> — no hidden common causes; all relevant variables are observed.",
    "<b>Reliable CI tests</b> — independence is decided by a statistical test (e.g. χ²/G², partial correlation); ideally a perfect 'oracle'.",
    "Each variable has a well-defined set of parents-children PC(X) and spouses Sp(X) (the other parents of its children) that locally characterise it."
  ],
  input: "A dataset over variables V and a conditional-independence (CI) test (the LocalLearn / OrderedGS local-discovery subroutine).",
  output: "A single global <b>Bayesian-network structure</b> (DAG / partially-directed graph), grown incrementally and then oriented.",

  idea: [
    "Plain local-to-global methods (the <b>LocalLearn</b> idea) learn each node's local neighbourhood — its <b>parents-children</b> PC(X) and <b>spouses</b> Sp(X) — completely independently, then glue all those local pieces together (e.g. with AND/OR reconciliation rules) into one global skeleton. The weakness is that the same edges get rediscovered from both ends, and nothing learned about one node helps when working on the next.",
    "GGSL keeps the local-learning engine but changes the bookkeeping: it <b>grows a single global graph G</b>. Pick a <b>seed</b> variable, learn its local structure, and immediately commit those edges to G. Each newly discovered neighbour becomes part of a <b>frontier</b> — a queue of variables whose local structure has not yet been learned.",
    "It then repeatedly takes a variable from the frontier, learns <i>its</i> local structure, and adds any brand-new variables it discovers to the frontier. Because parts of the graph are already known, the candidate set for the current target can be <b>restricted</b> — variables already placed (and the target's own known neighbours and spouses) are excluded — so each local problem is smaller and cheaper than learning it from scratch.",
    "The local engine is <b>OrderedGS</b>, run in two steps around a target T. <b>Step 1</b> uses a conditioning set Z = {T, X} ∪ PC(T) to settle the parents-children of T. <b>Step 2</b> uses Z = {T, X} ∪ PC(T) ∪ Sp(T) to pick up the spouses (extra co-parents). The graph G is updated on the fly after each target.",
    "This 'discover a node, add its neighbours to the frontier, walk outward' loop is what makes GGSL <i>grow</i> the graph from a seed rather than test things globally. When the frontier empties, every variable has been reached; the assembled global structure is then oriented (v-structures first, then rule propagation)."
  ],

  steps: [
    "<b>Initialise.</b> Start with an empty global graph G and pick a <b>seed</b> target T. Create an empty Frontier.",
    "<b>LocalLearn the seed — Step 1 (parents-children).</b> Using OrderedGS with conditioning set Z = {T, X} ∪ PC(T), test each candidate X: keep the ones that stay dependent on T (they enter PC(T)) and drop those screened off. Add the PC(T) edges to G.",
    "<b>LocalLearn the seed — Step 2 (spouses).</b> With Z = {T, X} ∪ PC(T) ∪ Sp(T), look for spouses — variables that become <i>dependent</i> on T only when a shared child is in the conditioning set (a co-parent through a collider). Record Sp(T) and update G.",
    "<b>Seed the frontier.</b> Put every newly discovered neighbour of T (its PC and spouses) onto the Frontier — these are the next places to grow from.",
    "<b>Take the next frontier variable.</b> Pop a variable T′ from the Frontier and make it the current target.",
    "<b>Restrict the candidate set.</b> Exclude variables already accounted for — T′ itself, its known PC(T′) and Sp(T′), and any nodes already placed in G — so the local search for T′ ranges only over the still-open candidates O.",
    "<b>LocalLearn T′ (Step 1 then Step 2).</b> Run the same two-step OrderedGS local discovery on T′ over the restricted candidates, commit its edges to G, and add any <b>brand-new</b> variables it discovers to the Frontier.",
    "<b>Grow until the frontier is empty.</b> Repeat: each iteration reaches one more region of the graph, so the network grows outward from the seed until every variable has been visited and G is connected.",
    "<b>Orient.</b> With the global skeleton complete, orient v-structures (colliders) and propagate the forced orientations with Meek-style rules, returning the Bayesian-network structure."
  ],

  keyConcepts: [
    { term: "Local-to-global (LocalLearn)", def: "The family GGSL belongs to: learn each variable's local neighbourhood (parents-children and spouses) from CI tests, then combine the local pieces into one global graph." },
    { term: "Parents-children PC(X)", def: "The variables directly connected to X (its parents and its children). Step 1 of the local engine recovers these for the current target." },
    { term: "Spouses Sp(X)", def: "Co-parents of X's children — variables that are only revealed when a shared child is conditioned on (a collider). Step 2 recovers these." },
    { term: "Seed / current target", def: "GGSL starts from one seed variable and learns local structure target-by-target. The 'current target' is whichever variable is being expanded right now." },
    { term: "Frontier", def: "The queue of newly discovered neighbours whose own local structure has not yet been learned. Growing the graph means repeatedly pulling from the frontier and expanding." },
    { term: "Restricted candidate set", def: "Because parts of G are already known, the candidates for the next target exclude already-placed nodes (and the target's known neighbours/spouses) — making each local problem smaller." },
    { term: "On-the-fly graph update", def: "Unlike independent LocalLearn-then-merge, GGSL commits each target's edges to the single global graph immediately, so earlier work feeds the next step." }
  ],

  animation: {
    title: "GGSL growing the global graph from seed B (paper Examples 54-55, Figs. 112-114). True DAG: A→B, A→C, B→D, C→D, D→E.",
    nodes: [
      { id: "A", x: 0.50, y: 0.06 },
      { id: "B", x: 0.20, y: 0.34 },
      { id: "C", x: 0.80, y: 0.34 },
      { id: "D", x: 0.50, y: 0.64 },
      { id: "E", x: 0.50, y: 0.94 }
    ],
    edges: [
      { from: "A", to: "B", type: "directed" },
      { from: "A", to: "C", type: "directed" },
      { from: "B", to: "D", type: "directed" },
      { from: "C", to: "D", type: "directed" },
      { from: "D", to: "E", type: "directed" }
    ],
    steps: [
      { caption: "<b>Pick a seed.</b> GGSL grows one global graph from a single starting variable. We seed with <b>B</b> and will learn its local neighbourhood, then walk outward. The graph G is empty; the Frontier is empty; every other node is still unreached.", ops: [{ op: "highlightNodes", ids: ["B"], cls: "hl" }, { op: "highlightNodes", ids: ["A", "C", "D", "E"], cls: "dim" }, { op: "set", name: "Frontier", items: [] }, { op: "badge", text: "seed = B", kind: "info" }] },
      { caption: "<b>LocalLearn B — Step 1 (parents-children).</b> Test A with conditioning set Z = {A,B}: A stays <i>dependent</i> on B, so A ∈ PC(B). Commit the edge A–B to G. (Fig. 112b)", ops: [{ op: "highlightNodes", ids: ["B"], cls: "hl" }, { op: "testCI", x: "B", y: "A", z: ["A", "B"], result: "dep" }, { op: "addEdge", from: "A", to: "B", type: "undirected" }, { op: "highlightNodes", ids: ["A"], cls: "add" }] },
      { caption: "<b>LocalLearn B — Step 1.</b> Test C with Z = {A,B,C}: C is <i>independent</i> of B given A, so C ∉ PC(B) — no direct B–C edge. (Fig. 112c)", ops: [{ op: "highlightNodes", ids: ["B"], cls: "hl" }, { op: "testCI", x: "B", y: "C", z: ["A", "B", "C"], result: "indep" }, { op: "highlightNodes", ids: ["C"], cls: "dim" }] },
      { caption: "<b>LocalLearn B — Step 1.</b> Test D with Z = {A,B,D}: D stays <i>dependent</i> on B (B is a parent of D), so D ∈ PC(B). Commit B–D to G. Now PC(B) = {A, D}. (E was tried temporarily, Fig. 112d, but Z = {A,B,D,E} shows E ∉ PC(B), Fig. 112e.)", ops: [{ op: "highlightNodes", ids: ["B"], cls: "hl" }, { op: "testCI", x: "B", y: "D", z: ["A", "B", "D"], result: "dep" }, { op: "addEdge", from: "B", to: "D", type: "undirected" }, { op: "highlightNodes", ids: ["D"], cls: "add" }, { op: "badge", text: "PC(B) = {A, D}", kind: "good" }] },
      { caption: "<b>LocalLearn B — Step 2 (spouses).</b> With Z = {T,X} ∪ PC(B) ∪ Sp(B), test C through the shared child D: C becomes <i>dependent</i> on B once D is conditioned on, so C is a <b>spouse</b> of B (co-parent of D). Commit C–D to G. (Fig. 113b) Sp(B) = {C}.", ops: [{ op: "highlightNodes", ids: ["B"], cls: "hl" }, { op: "testCI", x: "B", y: "C", z: ["D"], result: "dep" }, { op: "addEdge", from: "C", to: "D", type: "undirected" }, { op: "highlightNodes", ids: ["C"], cls: "add" }, { op: "badge", text: "Sp(B) = {C}", kind: "good" }] },
      { caption: "<b>Update G and seed the Frontier.</b> B's local structure is committed to the single global graph. Its newly discovered neighbours — A, D and the spouse C — go onto the Frontier as the next places to grow from. (Global G after finishing B, Fig. 113c.)", ops: [{ op: "highlightEdges", edges: [["A", "B"], ["B", "D"], ["C", "D"]], cls: "hl" }, { op: "set", name: "Frontier", items: ["A", "D", "C"] }, { op: "badge", text: "graph grown around B", kind: "good" }] },
      { caption: "<b>Take the next target: D.</b> Pop D from the Frontier and make it the current target. We will learn D's local structure, reusing what G already knows about B and C.", ops: [{ op: "highlightNodes", ids: ["D"], cls: "hl" }, { op: "set", name: "Frontier", items: ["A", "C"] }, { op: "badge", text: "current = D", kind: "info" }] },
      { caption: "<b>Restrict the candidate set.</b> From G we already know PC(D) includes B and C and Sp(D) = ∅. GGSL excludes {D} ∪ PC(D) ∪ Sp(D) ∪ {A}, leaving only the open candidates O = {E}. The local problem for D is now tiny. (Example 55)", ops: [{ op: "highlightNodes", ids: ["D"], cls: "hl" }, { op: "highlightNodes", ids: ["B", "C"], cls: "add" }, { op: "highlightNodes", ids: ["E"], cls: "dim" }, { op: "badge", text: "candidates O = {E}", kind: "info" }] },
      { caption: "<b>LocalLearn D — Step 1.</b> Querying with A on Z = {A,B,C,D} confirms A <i>independent</i> of D given its neighbours, so A is eliminated from PC(D) — no A–D edge. (Fig. 114a)", ops: [{ op: "highlightNodes", ids: ["D"], cls: "hl" }, { op: "testCI", x: "D", y: "A", z: ["A", "B", "C", "D"], result: "indep" }, { op: "highlightNodes", ids: ["A"], cls: "dim" }] },
      { caption: "<b>LocalLearn D — Step 1.</b> Querying with E on Z = {E,B,C,D}: E stays <i>dependent</i> on D, so E ∈ PC(D) — E is a child of D. Commit D–E to G and add the brand-new node <b>E</b> to the Frontier. (Fig. 114b)", ops: [{ op: "highlightNodes", ids: ["D"], cls: "hl" }, { op: "testCI", x: "D", y: "E", z: ["E", "B", "C", "D"], result: "dep" }, { op: "addEdge", from: "D", to: "E", type: "undirected" }, { op: "highlightNodes", ids: ["E"], cls: "add" }, { op: "set", name: "Frontier", items: ["A", "C", "E"] }] },
      { caption: "<b>Finish D and keep growing.</b> Step 2 finds no spouses for D, so PC(D) = {B, C, E}, Pa(D) = {B, C}, Ch(D) = {E}. The graph has now grown outward to reach E. Remaining frontier nodes (A, C, E) are expanded the same way; their local searches find no new variables, so the frontier drains and the skeleton is complete. (Fig. 114c)", ops: [{ op: "highlightEdges", edges: [["A", "B"], ["B", "D"], ["C", "D"], ["D", "E"]], cls: "hl" }, { op: "set", name: "Frontier", items: ["A", "C", "E"] }, { op: "badge", text: "all nodes reached", kind: "good" }] },
      { caption: "<b>Orient.</b> The grown global skeleton matches the true DAG. B → D ← C is a collider (B and C are non-adjacent, D not in their separating set), so both point into D; orientations propagate to give A → B, A → C and D → E. GGSL returns the Bayesian-network structure.", ops: [{ op: "orient", from: "A", to: "B", type: "directed" }, { op: "orient", from: "A", to: "C", type: "directed" }, { op: "orient", from: "B", to: "D", type: "directed" }, { op: "orient", from: "C", to: "D", type: "directed" }, { op: "orient", from: "D", to: "E", type: "directed" }, { op: "badge", text: "structure returned", kind: "good" }] }
    ]
  },

  complexity: "Cost is dominated by the local-discovery (OrderedGS) calls. Each target costs a local pass of CI tests over its candidates, but because the candidate set is restricted using the already-grown graph G, later targets are progressively cheaper and edges are not rediscovered from both ends — typically far fewer tests than independent LocalLearn-then-merge. Conditioning sets stay local and small.",
  strengths: [
    "Grows a single coherent global graph instead of merging independently learned local pieces — avoids rediscovering the same edge from both endpoints.",
    "Reuses what is already learned: the restricted candidate set makes each successive local problem smaller and cheaper.",
    "Inherits the locality of Markov-blanket / PC-set methods, so conditioning sets stay small and the work scales on sparse, high-dimensional data.",
    "Constraint-based: needs only CI tests, no scoring function or assumed parametric form."
  ],
  limitations: [
    "Sequential and order-sensitive: the seed choice and the order in which frontier nodes are processed can affect the result.",
    "Sensitive to CI-test errors — an early mistake committed to G propagates as the graph grows.",
    "Restricting candidates from a partially-grown graph can occasionally exclude a genuine candidate if an earlier local result was wrong.",
    "Assumes faithfulness and causal sufficiency (no hidden confounders)."
  ],
  notes: "GGSL (Gao et al., ref [201]) is built on OrderedGS, the two-step local engine that first settles parents-children (Step 1) and then spouses (Step 2). It contrasts with the classic local-to-global pipeline (Fig. 111), where independently learned Markov blankets are merged with AND/OR rules into a global skeleton — GGSL instead grows the global graph incrementally and updates it on the fly.",
  figureRefs: "Paper §4.38 (pp.190-191): the GGSL algorithm (ref [201]) and OrderedGS local engine; Fig.111 (classic independent-local-then-merge pipeline); Example 54 + Fig.112 (LocalLearn around B: incremental PC_B discovery and temporary inclusion of E); Example 55 + Figs.113-114 (Step-2 spouse discovery for B, first global update, and growing to target D with restricted candidates)."
};
