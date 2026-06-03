/* CPBG — Causal Partition Base Graph (Hong et al. [270]). Grounded in §4.59 (pp.284-288):
   rough "base graph" skeleton via low-order CI tests (Alg.74), path-based causal partitioner
   CPBG-Cut (Alg.75) using farthest-pair BFS + Path-degree tie-break (Def.37) + cut-node
   score / RefineCut E-S step (Def.38-39, Alg.76), distributed base-learner per part, merge
   by union over shared cut nodes; worked example Fig.180-183 with cut set C={R,L,D}. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["cpbg"] = {
  name: "CPBG (Causal Partition Base Graph)",
  oneLiner: "Build a cheap rough skeleton (the 'base graph'), cut it into independent components along a small set of 'separator' nodes chosen so the pieces are balanced, then learn each piece in a distributed way with any base learner and merge the results by gluing them back together on the shared separator nodes.",
  basedOnText: "CPBG is a data-distributed, divide-and-conquer wrapper. Its distinctive idea is to derive the partition directly from the structure of a quickly-built undirected skeleton (the base graph), using graph distances and node degrees rather than expensive independence search, so that the heavy structure learning can be split across components and run in parallel.",

  assumptions: [
    "<b>Causal sufficiency & faithfulness</b> — the standard structure-learning assumptions, inherited from whichever base learner CPBG wraps on each part.",
    "<b>The base graph is roughly right</b> — the rough skeleton from cheap low-order CI tests is a good enough scaffold to read off graph distances and degrees; the partition is only as good as this scaffold.",
    "<b>A small separating cut exists</b> — there is a small set of 'cut' nodes whose removal splits the skeleton into balanced components, so each subproblem is genuinely smaller.",
    "<b>Reliable low-order CI tests</b> — the base graph is built with conditioning sets of size ≤ 2, which keeps those tests fast and trustworthy."
  ],
  input: "A dataset 𝒟 over variables V, a CI test, a base structure learner (Learn), and a size threshold m for when a component is small enough to learn directly.",
  output: "A single graph over all of V — the merged structure. When the base learners return the P-map class, CPBG returns the P-map class PDAG / CPDAG of the true DAG (Theorem 37, correctness).",

  idea: [
    "Heavy structure learning is expensive, so CPBG first spends very little effort building a <b>base graph</b>: starting from the complete graph it runs only <i>low-order</i> CI tests (conditioning sets of size at most two) and deletes an edge whenever a small set screens the pair off. The result is a rough undirected skeleton 𝒢_skel — not the final answer, just a scaffold.",
    "The <b>causal partition</b> is then read straight off this scaffold by graph geometry, not by more independence search. CPBG looks for two nodes that are as far apart as possible in the skeleton (the farthest pair by shortest-path distance), then walks the paths between them and picks a well-placed middle node as a <i>cut node</i>. Repeating this over the farthest pairs yields a small <b>cut set C</b> of separator nodes.",
    "Where exactly to cut on a path is decided by balance. For an interior node of a path, CPBG compares the total degree of the nodes on its left versus its right (Def. 38) and scores the node highest when the two sides are balanced (Def. 39). A small greedy refinement (RefineCut) slides the candidate cut node left or right to improve this balance, so removing it produces components of comparable size.",
    "<b>Partition:</b> removing the cut set C from the skeleton breaks it into connected components 𝒢₁,…,𝒢_K. Crucially, the cut nodes are then <i>added back into every component</i> — they act as separators shared by the pieces, exactly like the bridge variables in other divide-and-conquer learners.",
    "<b>Distributed learning:</b> each component (its variables plus the cut nodes) is a smaller, self-contained subproblem. CPBG hands each to a base learner — and because the components only overlap on the cut nodes, the parts can be learned independently and in parallel across machines (this is the 'data-distributed' aspect). A component still too large is partitioned again recursively.",
    "<b>Merge:</b> the learned sub-structures are combined by taking their union over the shared cut nodes. No new cross-component edges are introduced except ones touching the cut-set variables, so the merge is clean — this is what makes CPBG a faithful partition-learn-merge, divide-and-conquer framework usable with any base learner."
  ],

  steps: [
    "<b>Build the base graph (Alg. 74, lines 1-8).</b> Start from the complete undirected graph on V. For every pair {X,Y}, run low-order CI tests conditioning on sets Z of size ≤ 2 drawn from the other variables; if some such Z makes X⫫Y, delete the edge X–Y. The surviving rough skeleton is 𝒢_skel, the base graph.",
    "<b>Check if already split.</b> CPBG-Cut (Alg. 75) first checks whether 𝒢_skel is already disconnected. If so, its connected components are returned immediately with an empty cut set.",
    "<b>Find the farthest pair.</b> Run BFS on the skeleton and pick a pair (X,Y) with the maximum shortest-path distance — the two most 'distant' variables. Ties are broken (Def. 37) by preferring the shortest connecting path with the largest <i>path degree</i> (sum of node degrees along the path), i.e. the most central route.",
    "<b>Place a cut node on each path.</b> For each simple path P = {V₁,…,V_p} between X and Y, initialise the candidate cut node at the middle, c = ⌈p/2⌉ (Alg. 75, line 7).",
    "<b>Balance the cut (RefineCut, Alg. 76 / Def. 38-39).</b> For the interior candidate V_c, compute the total degree on its left vs. its right in the skeleton. The cut-node score is highest when the two sides are balanced. A greedy one-step refinement slides V_c toward the heavier side and keeps the move only if balance (the score) improves; otherwise it reverts.",
    "<b>Collect the cut set.</b> Add the chosen V_c to the cut set C. Repeating over the farthest pairs/paths accumulates a small set of separator nodes — in the worked example C = {R, L, D}.",
    "<b>Partition the skeleton.</b> Remove the cut set C from 𝒢_skel; what remains splits into connected components 𝒢₁,…,𝒢_K (Alg. 75, line 11).",
    "<b>Re-attach the separators.</b> Add the cut nodes back into every component: 𝒢_i ← 𝒢_i ∪ C (line 12). The cut nodes are now shared by all parts so each downstream learner can recover their edges into its own part.",
    "<b>Learn each part — distributed (Alg. 74, lines 10-16).</b> For each component, restrict the data to that component's variables (its own variables together with the cut nodes) and run the base learner. If the component is still larger than the threshold m, recurse (partition it again); otherwise learn it directly. The components only overlap on C, so they are learned independently and can run in parallel.",
    "<b>Merge by union over shared nodes (Alg. 74, line 17).</b> Combine the per-component sub-structures by taking their union over the shared cut nodes. Because components meet only at the cut set, no cross-component edges appear except those incident to cut-set variables — the merge introduces no spurious links.",
    "<b>Return</b> the single merged graph over all of V. By Theorem 37, if the base learners are correct, the merged result is the P-map class PDAG/CPDAG of the true DAG."
  ],

  keyConcepts: [
    { term: "Base graph (rough skeleton 𝒢_skel)", def: "A cheap undirected scaffold built by deleting edges using only low-order CI tests (conditioning sets of size ≤ 2). It is not the final structure; it exists so the partition can be read off graph distances and degrees." },
    { term: "Causal partition", def: "A split of the variables into connected components plus a small cut set C, obtained from the base graph's geometry: cut nodes are chosen along the paths between the farthest pair of variables, then removed to disconnect the skeleton." },
    { term: "Farthest pair", def: "The two variables with the maximum shortest-path distance in the base graph (found by BFS). The cut runs along the paths between them, where a separator is most likely to split the graph." },
    { term: "Path degree (Def. 37)", def: "The sum of node degrees along a path in 𝒢_skel. When several shortest paths tie, CPBG prefers the one with the largest path degree — the most central, well-connected route." },
    { term: "Left/right degree and cut-node score (Def. 38-39)", def: "For an interior node on a path, the total skeleton degree of the nodes to its left vs. to its right. The score is highest (zero) when the two are perfectly balanced and negative otherwise; CPBG places the cut where the components come out balanced." },
    { term: "RefineCut (Alg. 76)", def: "A greedy one-step E/S refinement that slides the candidate cut node toward the heavier side of the path and keeps the move only if the balance score improves, otherwise reverting — at most half the path length is searched." },
    { term: "Cut nodes are added back to every part", def: "After removing C to disconnect the skeleton, the cut nodes are re-inserted into each component (𝒢_i ∪ C). They act as separators shared by all parts so each learner can find their edges into its own component." },
    { term: "Distributed partition-learn-merge", def: "Each component is learned independently by a base learner (recursing if still larger than the size threshold m), then the sub-structures are merged by union over the shared cut nodes — a divide-and-conquer framework that works with any base learner." }
  ],

  animation: {
    title: "CPBG on the 8-variable example {A,S,T,L,B,R,X,D} with cut set C={R,L,D} (paper Fig. 180-183).",
    nodes: [
      { id: "A", x: 0.20, y: 0.10 },
      { id: "S", x: 0.55, y: 0.10 },
      { id: "T", x: 0.16, y: 0.42 },
      { id: "L", x: 0.42, y: 0.42 },
      { id: "B", x: 0.70, y: 0.42 },
      { id: "R", x: 0.34, y: 0.66 },
      { id: "X", x: 0.18, y: 0.92 },
      { id: "D", x: 0.62, y: 0.92 }
    ],
    edges: [],
    steps: [
      { caption: "<b>The problem.</b> We want the causal structure over eight variables {A,S,T,L,B,R,X,D}. Rather than learn it all at once, CPBG first builds a cheap scaffold and uses it to split the work. (Truth: A→T, S→L, S→B, T→R, L→R, R→X, R→D, B→D — paper Fig. 180a.)", ops: [{ op: "badge", text: "partition-learn-merge", kind: "info" }] },
      { caption: "<b>Build the base graph.</b> Start complete, then run only low-order CI tests (conditioning on sets of size ≤ 2) and delete the screened-off edges. What survives is the rough skeleton 𝒢_skel — the 'base graph' scaffold (paper Fig. 180b).", ops: [
        { op: "addEdge", from: "A", to: "T" }, { op: "addEdge", from: "S", to: "L" }, { op: "addEdge", from: "S", to: "B" },
        { op: "addEdge", from: "T", to: "R" }, { op: "addEdge", from: "L", to: "R" }, { op: "addEdge", from: "R", to: "X" },
        { op: "addEdge", from: "R", to: "D" }, { op: "addEdge", from: "B", to: "D" }, { op: "addEdge", from: "L", to: "D" },
        { op: "testCI", x: "A", y: "R", z: ["T"], result: "indep" }, { op: "badge", text: "base graph 𝒢_skel", kind: "good" }
      ] },
      { caption: "<b>Find the farthest pair.</b> BFS over the base graph picks the two variables at maximum shortest-path distance. Here A and the bottom of the graph are 4 hops apart — A and D (and A,S) attain distance 4, so A–D is a candidate farthest pair.", ops: [
        { op: "highlightNodes", ids: ["A", "D"], cls: "hl" }, { op: "badge", text: "farthest pair (BFS)", kind: "info" }
      ] },
      { caption: "<b>Walk a path, pick the middle.</b> Take a path A–T–R–L–S (or A–T–R–D). Initialise the cut node at the middle, c = ⌈p/2⌉ — that lands on R, the mid node of the path.", ops: [
        { op: "highlightEdges", edges: [["A","T"],["T","R"],["R","L"],["S","L"]], cls: "hl" },
        { op: "highlightNodes", ids: ["R"], cls: "hl" }
      ] },
      { caption: "<b>Balance the cut (RefineCut).</b> Compare total degree left vs. right of the candidate. At R the right side is heavier, so the greedy step moves toward L; but moving back to balance is best, so the optimum stays at V_c = R (paper Fig. 181, Example 85).", ops: [
        { op: "highlightNodes", ids: ["R"], cls: "hl" }, { op: "badge", text: "score balanced at V_c = R", kind: "info" }
      ] },
      { caption: "<b>Collect the cut set.</b> Repeating the same evaluation over the farthest A–S paths yields the cut nodes R, L, and D. So the cut set is C = {R, L, D} (paper Example 86).", ops: [
        { op: "highlightNodes", ids: ["R", "L", "D"], cls: "hl" },
        { op: "set", name: "Cut set C", items: ["R", "L", "D"] }, { op: "badge", text: "causal partition", kind: "info" }
      ] },
      { caption: "<b>Partition the skeleton.</b> Remove the cut set C = {R,L,D} from 𝒢_skel. The base graph falls apart into separate components — the left/top part around A,T and the part around S,B,X (paper Fig. 183).", ops: [
        { op: "removeEdge", from: "T", to: "R" }, { op: "removeEdge", from: "L", to: "R" }, { op: "removeEdge", from: "S", to: "L" },
        { op: "removeEdge", from: "R", to: "X" }, { op: "removeEdge", from: "R", to: "D" }, { op: "removeEdge", from: "L", to: "D" },
        { op: "removeEdge", from: "B", to: "D" },
        { op: "highlightNodes", ids: ["R", "L", "D"], cls: "dim" }, { op: "badge", text: "remove C → components", kind: "warn" }
      ] },
      { caption: "<b>Re-attach separators to every part.</b> Add the cut nodes back into each component (𝒢_i ∪ C), so every part can recover the cut nodes' edges into its own variables. Part 1 ≈ {A,T} ∪ C, Part 2 ≈ {S,B,X} ∪ C.", ops: [
        { op: "set", name: "Part 1 (∪ C)", items: ["A", "T", "R", "L", "D"] },
        { op: "highlightNodes", ids: ["A", "T", "R", "L", "D"], cls: "hl" }, { op: "highlightNodes", ids: ["S", "B", "X"], cls: "dim" }
      ] },
      { caption: "<b>Learn Part 1 — distributed.</b> Run the base learner on Part 1's data ({A,T} plus the cut nodes). Small, local CI tests / scoring recover A→T, T→R, L→R and R's local edges. If a part were still bigger than the threshold m, CPBG would partition it again.", ops: [
        { op: "highlightNodes", ids: ["A", "T", "R", "L", "D"], cls: "hl" },
        { op: "addEdge", from: "A", to: "T" }, { op: "addEdge", from: "T", to: "R" }, { op: "addEdge", from: "L", to: "R" },
        { op: "addEdge", from: "R", to: "X" },
        { op: "highlightEdges", edges: [["A","T"],["T","R"],["L","R"],["R","X"]], cls: "add" }
      ] },
      { caption: "<b>Learn Part 2 — distributed, in parallel.</b> The other component ({S,B,X} plus the cut nodes) is an independent subproblem, so it runs in parallel. It recovers S→L, S→B, R→D, B→D, L→D. The parts overlap only on C={R,L,D}.", ops: [
        { op: "clearSet" }, { op: "set", name: "Part 2 (∪ C)", items: ["S", "B", "X", "R", "L", "D"] },
        { op: "highlightNodes", ids: ["S", "B", "X", "R", "L", "D"], cls: "hl" }, { op: "highlightNodes", ids: ["A", "T"], cls: "dim" },
        { op: "addEdge", from: "S", to: "L" }, { op: "addEdge", from: "S", to: "B" }, { op: "addEdge", from: "R", to: "D" },
        { op: "addEdge", from: "B", to: "D" }, { op: "addEdge", from: "L", to: "D" },
        { op: "highlightEdges", edges: [["S","L"],["S","B"],["R","D"],["B","D"],["L","D"]], cls: "add" }
      ] },
      { caption: "<b>Merge by union over the cut nodes.</b> Glue the two learned sub-structures together on the shared cut set C={R,L,D}. No cross-component edges appear except ones touching the cut variables, so the merge is clean (Alg. 74, line 17).", ops: [
        { op: "clearSet" }, { op: "highlightNodes", ids: ["R", "L", "D"], cls: "hl" }, { op: "badge", text: "merge ∪ over C", kind: "info" }
      ] },
      { caption: "<b>Done.</b> The merged graph over all eight variables is returned. The partition came for free from the base graph's geometry, the heavy learning ran distributed across components, and — by Theorem 37 — correct base learners give the correct P-map class.", ops: [
        { op: "highlightNodes", ids: ["A", "S", "T", "L", "B", "R", "X", "D"], cls: "hl" },
        { op: "badge", text: "global structure returned", kind: "good" }
      ] }
    ]
  },

  complexity: "The base graph is cheap: every CI test uses a conditioning set of size at most two, so building 𝒢_skel avoids the large-conditioning-set blow-up of full constraint-based learning. The partitioner is graph work — BFS for the farthest pair plus a path scan with a one-step RefineCut (at most half a path length, Alg. 76). The dominant cost, the base learner, then runs on small components rather than all of V, and the components (overlapping only on C) can be learned in parallel. The win depends on the cut set C being small and the components balanced; with no good cut, it degrades toward running the base learner on the whole set.",
  strengths: [
    "Derives the partition directly from a cheaply-built base graph using distances and degrees — no expensive independence search to find the split.",
    "Components overlap only on the small cut set, so they are genuinely independent subproblems that can be learned in parallel (data-distributed).",
    "Wrapper design: works with any base learner (constraint- or score-based) and recurses on parts that are still too large.",
    "Correctness guarantee (Theorem 37): returns the P-map class PDAG/CPDAG when the base learners do.",
    "Balanced cuts (cut-node score) keep the subproblems comparable in size, so no single part dominates the runtime."
  ],
  limitations: [
    "Only as good as the base graph: errors in the rough low-order skeleton mislead the distance/degree-based partition.",
    "Assumes a small separating cut exists; graphs without such bottlenecks give little speed-up and a large cut set C bloats every part.",
    "Enumerating simple paths between the farthest pair can be costly on dense skeletons (the partitioner considers all paths, not just the shortest).",
    "Inherits the base learner's assumptions (causal sufficiency, faithfulness) and is only as correct as the base learner on each component."
  ],
  notes: "CPBG's path-based partitioner is one way to derive separators from an undirected skeleton; related work (§4.59.2) explores alternatives: Wang et al. use A* search on the skeleton with an admissible heuristic over shortest-path distances as a similarity for HKSD/K-means-style clustering into blocks; Chaudhary et al. combine community detection with PC-stable (modularity split, then local PC and inter-community d-separators); Chen et al. use spectral clustering on the skeleton's Laplacian (L = D − W), learn within each cluster, then run a few CI tests to orient and merge cross-cluster edges.",
  figureRefs: "Paper §4.59 (pp.284-288): Algorithm 74 (CPBG recursive wrapper), Algorithm 75 (CPBG-Cut path-based partitioner), Algorithm 76 (RefineCut E/S-step), Definition 37 (path degree), Definition 38 (left/right degree on a path), Definition 39 (cut-node score), Theorem 37 (correctness), Example 85/86 (farthest pair and cut nodes), Fig. 180 (true DAG + rough base graph), Fig. 181-182 (cut-node selection / refinement), Fig. 183 (partitioning with C={R,L,D})."
};
