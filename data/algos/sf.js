/* SF — Structure-Finder (Xu et al., ref [717]). Constraint-based, decomposition / divide-and-conquer.
   Grounded in §4.25 (pp.141-143): three-phase method — (1) build the moral graph from Markov
   blankets, (2) decompose it into PRIME BLOCKS via complete (clique) separators, (3) run CI tests
   only WITHIN each block to delete false (moral) edges, then orient. Worked example = the ASIA-like
   net {A,S,T,L,B,E,X,D}; Figs 77-78 (moralization), Fig 79 (separation), Figs 80-81 (block walk-
   through), Fig 82 (prime blocks localize the search), Fig 83 (moral graph -> skeleton -> PDAG),
   Example 35, Propositions 8-9. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["sf"] = {
  name: "Structure-Finder (SF)",
  oneLiner: "Build an undirected moral graph from each node's Markov blanket, split it into small independent 'prime blocks' using clique separators, then run conditional-independence tests only inside each block to delete spurious edges — turning one global search into many tiny local ones that are merged back together.",
  basedOnText: "SF is a constraint-based method that is organised by DECOMPOSITION. Instead of testing independence across the whole variable set, it localises the work: a global moral graph is carved into irreducible 'prime blocks' separated by cliques, the expensive CI testing runs independently within each block, and the local results are recombined into one global structure — sharply cutting the number and size of the tests.",

  assumptions: [
    "<b>Causal sufficiency</b> — no hidden common causes; every common cause of measured variables is itself measured.",
    "<b>Faithfulness</b> — every independence in the data corresponds to a missing connection in the true graph (no accidental cancellations).",
    "<b>Reliable Markov-blanket learning</b> — a standard MB learner (e.g. Grow-Shrink, GS) can recover each node's Markov blanket, which seeds the moral graph.",
    "<b>Decomposition theorem (Geng et al.)</b> — if an edge has a separating set in the whole graph, it already has one inside some prime block that contains both endpoints; so searching inside blocks is enough."
  ],
  input: "A dataset over variables V, a conditional-independence (CI) test, and a Markov-blanket learner.",
  output: "A <b>PDAG / P-map class graph</b> (CPDAG): the directed and undirected edges representing the Markov-equivalence class of the true DAG.",

  idea: [
    "SF attacks the main weakness of plain constraint-based search — that CI tests over the full variable set are many and unreliable — by <i>dividing the problem into independent regions</i>. The regions are found from the graph's own structure, then each is solved on its own and the pieces are stitched together.",
    "<b>Phase 1 — moralise from Markov blankets.</b> A standard MB learner gives each node X its Markov blanket Mb(X). Connecting X to everyone in Mb(X) (and symmetrically) yields the undirected <b>moral graph</b> G<sub>m</sub>. This graph is the true skeleton PLUS extra 'moral edges' that join the co-parents of a common child.",
    "<b>Phase 2 — decompose into prime blocks.</b> Wherever a set of nodes that forms a clique <i>separates</i> the moral graph, SF splits it there. Repeating this recursively breaks G<sub>m</sub> into <b>prime blocks</b> U₁,…,U<sub>k</sub>: small, overlapping, irreducible sub-graphs that cannot be cut any further. The shared (separator) nodes are how the blocks stay connected.",
    "<b>Phase 3 — local CI tests, then merge.</b> Inside <i>each</i> block independently, SF tries to delete every edge by finding a separating set drawn from that block's nodes (Propositions 8-9 say it only needs to look at common neighbours and clique-shaped separators). False moral edges fall away; the true edges — which sit inside triangles and are irreducible — survive. Merging the surviving edges of all blocks gives the global skeleton, which is then oriented with stored separators (v-structures) and Meek's rules."
  ],

  steps: [
    "<b>Learn Markov blankets.</b> Run a standard MB learner (e.g. GS) to get Mb(X) for every variable X.",
    "<b>Build the moral graph.</b> Connect X to every Y ∈ Mb(X) (and Y to X). The result G<sub>m</sub> = (V, E<sub>m</sub>) is the moralized graph: the true skeleton plus moral edges between co-parents of each child (Figs 77-78).",
    "<b>Find clique separators.</b> Look for a set Z that (i) is a clique and (ii) splits G<sub>m</sub> so that V = X ∪ Y ∪ Z with X and Y separated by Z (Definition 12 / Fig 79).",
    "<b>Decompose recursively.</b> Split G<sub>m</sub> at each clique separator into G<sub>X∪Z</sub> and G<sub>Y∪Z</sub>; keep splitting. Sub-graphs that admit a split are <i>reducible</i>; those that cannot be cut further are the <b>prime blocks</b> U₁,…,U<sub>k</sub> (Figs 80-81).",
    "<b>Localise the edge tests.</b> By the decomposition theorem, any edge with a global separating set has one inside a prime block containing both endpoints — so all CI testing can be confined to the (small) blocks (Fig 82).",
    "<b>Delete false edges inside each block (in parallel).</b> For each block and each candidate edge (X,Y): by Prop 8 skip it unless X and Y share a common neighbour in the block; by Prop 9 test only <i>clique-shaped</i> subsets of the smaller endpoint's block-neighbours as the separator. If X ⫫ Y | Z is found, delete the edge and store Sep(X,Y)=Z.",
    "<b>Merge the local results.</b> Combine the surviving edges from all blocks into one global undirected <b>skeleton</b>; shared separator nodes reconcile blocks at their boundaries (true edges live in triangles and survive in every block that holds them).",
    "<b>Orient v-structures.</b> For each non-adjacent pair (X,Y) with a common neighbour Z where Z ∉ Sep(X,Y), orient the collider X → Z ← Y using the stored separating sets.",
    "<b>Propagate with Meek's rules</b> until no further edge is forced, then <b>return</b> the resulting PDAG (P-map class graph)."
  ],

  keyConcepts: [
    { term: "Markov blanket Mb(X)", def: "The minimal set of variables that makes X independent of all others — its parents, children, and the other parents of its children. SF connects each node to its blanket to build the moral graph." },
    { term: "Moral graph G_m", def: "The undirected graph obtained by linking every node to its Markov blanket. It equals the true skeleton plus 'moral edges' that join the co-parents of a common child." },
    { term: "Clique separator", def: "A set of nodes that is fully connected (a clique) and whose removal splits the graph into separate parts. SF cuts the moral graph at these to form blocks (Definition 12)." },
    { term: "Prime block", def: "An irreducible induced sub-graph that has no clique separator left — it cannot be decomposed further. The decomposition produces a small set of overlapping prime blocks U₁,…,U_k." },
    { term: "Decomposition theorem (Geng et al.)", def: "If an edge (X,Y) has a separating set in the whole moral graph, then some prime block containing X and Y already contains a separating set. This licenses searching only inside blocks." },
    { term: "Common-neighbour & clique-separator rules (Props 8-9)", def: "An edge can only be removed if its endpoints share a common neighbour, and it suffices to test clique-shaped separators among the neighbours — together these shrink the search drastically." },
    { term: "Moral edge", def: "A spurious edge in G_m between two co-parents that are not directly connected in the true DAG. SF's local tests are what remove these; true edges sit in triangles and survive." }
  ],

  animation: {
    title: "SF on the running ASIA-like example {A,S,T,L,B,E,X,D} (paper Figs 78-83). Local testing inside prime blocks, then merge.",
    nodes: [
      { id: "A", x: 0.10, y: 0.12 },
      { id: "S", x: 0.45, y: 0.10 },
      { id: "T", x: 0.10, y: 0.42 },
      { id: "L", x: 0.40, y: 0.42 },
      { id: "B", x: 0.78, y: 0.42 },
      { id: "E", x: 0.32, y: 0.70 },
      { id: "X", x: 0.10, y: 0.92 },
      { id: "D", x: 0.55, y: 0.92 }
    ],
    edges: [
      { from: "A", to: "T", type: "undirected" },
      { from: "S", to: "L", type: "undirected" },
      { from: "S", to: "B", type: "undirected" },
      { from: "T", to: "L", type: "undirected" },
      { from: "T", to: "E", type: "undirected" },
      { from: "L", to: "E", type: "undirected" },
      { from: "L", to: "B", type: "undirected" },
      { from: "B", to: "E", type: "undirected" },
      { from: "E", to: "X", type: "undirected" },
      { from: "E", to: "D", type: "undirected" },
      { from: "B", to: "D", type: "undirected" }
    ],
    steps: [
      { caption: "<b>Phase 1 — moral graph.</b> A Markov-blanket learner connects each node to its blanket, giving the undirected moral graph G<sub>m</sub>. It holds the true edges PLUS spurious 'moral' edges between co-parents (e.g. T–L, B–E join parents of a common child).", ops: [{ op: "badge", text: "moral graph G_m", kind: "info" }] },
      { caption: "<b>Phase 2 — decompose.</b> SF cuts G<sub>m</sub> wherever a clique separates it, producing small overlapping <i>prime blocks</i>. Here: U₁={A,T}, U₂={T,L,E}, U₃={E,X}, U₄={S,L,B,E}, U₅={E,B,D}. Shared nodes (T,L,E,B) glue the blocks together.", ops: [{ op: "badge", text: "prime blocks U1..U5", kind: "info" }, { op: "set", name: "Prime blocks", items: ["U1 = {A,T}", "U2 = {T,L,E}", "U3 = {E,X}", "U4 = {S,L,B,E}", "U5 = {E,B,D}"] }] },
      { caption: "<b>Local site U₁ = {A,T}.</b> A single edge with no common neighbour to test — it is irreducible, so A–T survives as a true edge. (Block solved independently of the others.)", ops: [{ op: "highlightNodes", ids: ["A", "T"], cls: "hl" }, { op: "badge", text: "U1 local", kind: "info" }, { op: "set", name: "Local result", items: ["U1: keep A–T (irreducible)"] }] },
      { caption: "<b>Local site U₂ = {T,L,E}.</b> Edge T–L has empty separator: T ⫫ L | ∅ holds, so the moral edge T–L is a FALSE edge — delete it inside this block. T–E and L–E sit in a triangle and stay.", ops: [{ op: "highlightNodes", ids: ["T", "L", "E"], cls: "hl" }, { op: "badge", text: "U2 local", kind: "info" }, { op: "testCI", x: "T", y: "L", z: [], result: "indep" }, { op: "removeEdge", from: "T", to: "L" }, { op: "set", name: "Local result", items: ["U2: delete moral edge T–L", "U2: keep T–E, L–E"] }] },
      { caption: "<b>Local site U₃ = {E,X}.</b> Single irreducible edge E–X — kept. Each block is processed on its own; this is where SF's work is 'distributed' across regions.", ops: [{ op: "highlightNodes", ids: ["E", "X"], cls: "hl" }, { op: "badge", text: "U3 local", kind: "info" }, { op: "set", name: "Local result", items: ["U3: keep E–X (irreducible)"] }] },
      { caption: "<b>Local site U₄ = {S,L,B,E}.</b> Test moral edge B–E with clique separators inside the block: B ⫫ E | {L} and B ⫫ E | {S} both hold, so B–E is moral — delete it. S–L, S–B, L–B, L–E stay.", ops: [{ op: "highlightNodes", ids: ["S", "L", "B", "E"], cls: "hl" }, { op: "badge", text: "U4 local", kind: "info" }, { op: "testCI", x: "B", y: "E", z: ["L"], result: "indep" }, { op: "removeEdge", from: "B", to: "E" }, { op: "set", name: "Local result", items: ["U4: delete moral edge B–E", "U4: keep S–L, S–B, L–B, L–E"] }] },
      { caption: "<b>Local site U₅ = {E,B,D}.</b> Edge E–L would be tested here too, but no separating set exists for the triangle edges, so E–D, B–D survive. (The earlier B–E deletion is consistent across U₄ and U₅ — the shared boundary nodes reconcile.)", ops: [{ op: "highlightNodes", ids: ["E", "B", "D"], cls: "hl" }, { op: "badge", text: "U5 local", kind: "info" }, { op: "set", name: "Local result", items: ["U5: keep E–D, B–D", "U5: B–E already removed (consistent)"] }] },
      { caption: "<b>Phase 3 — MERGE.</b> Union the surviving edges from all blocks into one global skeleton; the shared separator nodes (T,L,E,B) align the blocks at their boundaries. The two false moral edges (T–L, B–E) are gone.", ops: [{ op: "clearSet" }, { op: "badge", text: "merge -> skeleton", kind: "good" }, { op: "highlightEdges", edges: [["A","T"],["S","L"],["S","B"],["T","E"],["L","E"],["L","B"],["E","X"],["E","D"],["B","D"]], cls: "add" }] },
      { caption: "<b>Orient v-structures.</b> Using the stored separators: every common neighbour Z of a deleted pair (X,Y) with Z ∉ Sep(X,Y) is a collider. E.g. B and D were co-parents of a child, giving B → D ← E.", ops: [{ op: "highlightNodes", ids: ["B", "D", "E"], cls: "hl" }, { op: "orient", from: "B", to: "D", type: "directed" }, { op: "orient", from: "E", to: "D", type: "directed" }] },
      { caption: "<b>More colliders.</b> The recovered v-structures point arrows into the shared children (e.g. into E from its parents), exactly the orientations encoded by the moral edges that were just removed.", ops: [{ op: "orient", from: "T", to: "E", type: "directed" }, { op: "orient", from: "L", to: "E", type: "directed" }] },
      { caption: "<b>Meek's rules.</b> Propagate forced orientations without creating cycles or new colliders; the rest stay undirected.", ops: [{ op: "badge", text: "Meek R1-R3", kind: "info" }, { op: "highlightEdges", edges: [["A","T"],["S","L"],["S","B"],["L","B"],["E","X"]], cls: "hl" }] },
      { caption: "<b>Result — the PDAG (P-map class).</b> Decomposing into prime blocks let SF do all the costly CI testing locally and merge the answers, recovering the same equivalence class as a global constraint-based search but with far fewer, smaller tests.", ops: [{ op: "badge", text: "PDAG returned", kind: "good" }] }
    ]
  },

  complexity: "Like all constraint-based methods, worst-case exponential in the largest block's degree, but decomposition is the win: CI tests are confined to small prime blocks rather than the whole variable set, and Propositions 8-9 (common-neighbour filter + clique-only separators) further cut the number and size of tests. Blocks can be processed independently / in parallel.",
  strengths: [
    "Localises the search: CI tests run inside small prime blocks instead of over all variables, reducing both the count and the size of conditioning sets.",
    "Blocks are independent, so the local-learning phase is naturally parallelisable and the results simply merge.",
    "Common-neighbour and clique-separator results (Props 8-9) prune the candidate edges and separators sharply.",
    "Recovers the correct equivalence class (PDAG) under faithfulness and reliable tests, like plain constraint-based search."
  ],
  limitations: [
    "Quality depends on the Markov-blanket / moralization step — a wrong blanket corrupts the moral graph and the blocks built from it.",
    "Still inherits constraint-based fragility: unreliable CI tests inside a block delete or keep wrong edges.",
    "Gains shrink when the moral graph has no good clique separators (one large prime block ≈ no decomposition).",
    "Assumes causal sufficiency — no hidden confounders."
  ],
  notes: "SF belongs to a family of decomposition methods that split an undirected representation into blocks separated by small (clique) separators before orienting edges. Related work (Zhu and Liu, ref [805]) likewise starts from the moral graph of the target network and performs maximal-prime decomposition before local recovery.",
  figureRefs: "Paper §4.25 (pp.141-143), Xu et al. [717]: Figs 77-78 (DAG -> moral graph from blankets), Fig 79 & Definition 12 (clique separation), Figs 80-81 (decomposition into prime blocks U₁..U₅, full walk-through), Fig 82 (prime blocks localize the moral-edge search), Fig 83 (moral graph -> skeleton -> P-map PDAG), Propositions 8-9 (common-neighbour & clique-separator filters), Example 35 (worked run)."
};
