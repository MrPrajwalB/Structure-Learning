/* CPA — Causal Partitioning of the Adjoint graph (Zhang et al. [776]). Grounded in §4.63
   (pp.300-303): rough super-structure G via low-order CI (Recall 76, k_par=1) → adjoint/line
   graph G_A (Recall 77) → spectral edge-cut on G_A via Fiedler vector of L=D-A (Recall 79) →
   map edge-cut back to a vertex cut in G (Recall 78, Def.44 cut ratios) → two blocks A∪C, B∪C
   + separator C → learn each block → reunite with the same-reunion rule. High-level Alg. 82.
   Worked Example 90 + Fig.191 (adjoint transform), Fig.192 (running 6-node example,
   C_A={E2..E6}, λ2=1.27), Fig.193 (partition into A∪C and B∪C with C={V1,V4,V5,V6}). */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["cpa"] = {
  name: "CPA (Causal Partitioning of the Adjoint graph)",
  oneLiner: "Build a cheap rough skeleton, turn it into its 'adjoint' (line) graph where every edge of the skeleton becomes a vertex, find a good edge-cut there with a spectral (Fiedler-vector) split, then map that edge-cut back to a small vertex separator in the original graph — yielding two overlapping blocks that are learned independently and reunited.",
  basedOnText: "CPA is a data-distributed, divide-and-conquer wrapper built on the causal-partitioning (CP) idea. Its distinctive twist is to do the partitioning in the adjoint (line) graph: it reframes the hard problem of 'find a separator set of nodes' as the more tractable problem of 'find an edge-cut', which spectral methods solve with principled objectives and relaxations.",

  assumptions: [
    "<b>Causal sufficiency & faithfulness</b> — the standard structure-learning assumptions, inherited from whichever base learner CPA wraps on each block.",
    "<b>The super-structure is a valid super-graph</b> — the rough skeleton G, built from low-order CI tests, contains every true edge (it may have extras). The partition is only as good as this scaffold.",
    "<b>A small separator exists</b> — there is a small set of nodes whose removal splits the variables into two roughly independent blocks, equivalently a small edge-cut in the adjoint graph. CPA pays off when the graph has such bottleneck structure.",
    "<b>Reliable low-order CI tests</b> — the super-structure is built with conditioning sets capped at k_par (the paper takes k_par = 1), keeping those tests fast and trustworthy."
  ],
  input: "A dataset 𝒟 over variables V, a CI test, a cut-cap k_par for the rough skeleton, and a base structure learner for each block.",
  output: "A node partition — two blocks A∪C and B∪C together with the separator C — and, after learning and reuniting, a single graph (DAG / CPDAG) over all of V.",

  idea: [
    "Many divide-and-conquer learners must <i>find a separator set of nodes</i> whose removal splits the variables — a combinatorially hard search. CPA's key insight is that a small <b>vertex cut</b> in a graph corresponds to a small <b>edge cut</b> in its adjoint (line) graph, and edge-cuts are exactly what spectral graph partitioning solves well. So CPA moves the problem into the adjoint space: rough skeleton → adjoint graph → edge cut in the adjoint → vertex cut back in the original.",
    "First it spends very little effort building a <b>super-structure</b> G: starting from the complete undirected graph it runs only <i>low-order</i> CI tests (conditioning sets up to k_par, taken as 1) and drops every edge judged absent. The surviving rough skeleton is a super-graph of the true structure — a scaffold, not the answer.",
    "Then it forms the <b>adjoint graph</b> G_A (Recall 77): every edge of G becomes a <i>vertex</i> of G_A, and two such vertices are adjacent in G_A exactly when their corresponding edges in G share an endpoint. Edge-adjacency in G has become vertex-adjacency in G_A.",
    "Now it computes a <b>two-way partition of G_A</b> with a spectral method (Recall 79). It builds the Laplacian L = D − A of G_A and takes the <i>Fiedler vector</i> e₂ (the eigenvector of the second-smallest eigenvalue λ₂). Thresholding e₂ by sign groups the adjoint vertices — i.e. the edges of G — into two clusters whose few cross-adjacencies form a candidate <b>edge cut</b>. Cheeger-type bounds tie this minimum edge-cut ratio to λ₂, so a small λ₂ promises a clean split.",
    "<b>Map back to a vertex cut.</b> Each adjoint vertex in the cut is an edge of G, so it has two endpoints. Collecting and de-duplicating the endpoints of all cut edges gives the separator C in the original node space. By construction, deleting C from G disconnects it into components that, with C, define the two blocks A∪C and B∪C.",
    "<b>Learn each block, then reunite.</b> Each block (a side plus the shared separator C) is a smaller, self-contained subproblem handed to a base learner; the two run independently / in parallel. Their results are stitched with a <b>separator–reunion rule</b>: keep edges lying wholly inside one block, include edges inside C only when both blocks learned them, and re-orient near C so no v-structure is destroyed or invented."
  ],

  steps: [
    "<b>Build the super-structure (Alg. 82, line 1; Recall 76).</b> Start from the fully connected undirected graph on V. Run only low-order CI tests — singly-conditioned, i.e. conditioning sets up to k_par (the paper takes k_par = 1) — and drop every edge X–Y that some such test screens off. The surviving rough skeleton G is a super-graph of the true structure.",
    "<b>Form the adjoint (line) graph (Alg. 82, line 2; Recall 77).</b> Create one vertex of G_A for every edge of G. Connect two G_A vertices with an edge whenever their corresponding G-edges share an endpoint. Edge-adjacency in G is now vertex-adjacency in G_A.",
    "<b>Build the Laplacian.</b> For G_A compute the adjacency matrix A, the degree matrix D, and the Laplacian L = D − A. Its eigenvalues are 0 = λ₁ ≤ λ₂ ≤ ⋯ .",
    "<b>Spectral 2-way partition (Alg. 82, line 3; Recall 79).</b> Take the Fiedler vector e₂, the eigenvector of the second-smallest eigenvalue λ₂. Threshold e₂ by sign: adjoint vertices with non-negative entries go to one group, the rest to the other. This groups the <i>edges</i> of G into two clusters.",
    "<b>Read off the edge cut.</b> The G_A vertices whose neighbours fall on the opposite side of the threshold are the cross-adjacencies; the corresponding edges of G form the candidate edge-cut set C_A. (A small minimum edge-cut ratio ψ here corresponds, by Cheeger-type bounds, to a small λ₂.)",
    "<b>Map the edge cut to a vertex cut (Alg. 82, line 4; Recall 78).</b> Each adjoint vertex in C_A is an edge of G, so it has two endpoints. Take the union of all those endpoints and remove duplicates: C ← ⋃_{e∈C_A} endpoints(e). This node set C is the separator.",
    "<b>Split into blocks (Alg. 82, lines 5-6).</b> Deleting C from G disconnects it into components; gather them into two sides A and B (the parts of G ∖ C). Output the two overlapping blocks A∪C and B∪C together with the separator C.",
    "<b>Learn block 1.</b> Restrict the data to the variables of A∪C and run the base learner. Because the separator C is included, this block can recover the separator's edges into the A side. The CI tests here range only over this smaller block.",
    "<b>Learn block 2 — in parallel.</b> Do the same on B∪C. The two blocks overlap only on the separator C, so the two learning runs are independent and can be distributed across machines (the 'data-distributed' aspect).",
    "<b>Reunite — keep the safe edges (same-reunion rule).</b> Keep every edge whose endpoints both lie inside A∪C, and every edge whose endpoints both lie inside B∪C. For an edge whose endpoints are <i>both</i> inside C, include it only if it appears in <i>both</i> learned graphs; allow no edge directly between A and B (they are separated by C).",
    "<b>Reunite — repair orientations.</b> Where the two blocks disagree on direction within C, re-orient as needed so that no existing v-structure is destroyed and no new v-structure is introduced. This is the separator–reunion rule, ensuring the reunited graph respects the independences implied by the decomposition.",
    "<b>Return</b> the reunited graph over all of V (and the partition A∪C, B∪C, C)."
  ],

  keyConcepts: [
    { term: "Super-structure (rough skeleton G)", def: "A cheap undirected super-graph of the true structure, built by deleting edges using only low-order (singly-conditioned, up to k_par) CI tests. It exists so the partition can be computed on it; it is not the final answer." },
    { term: "Adjoint / line graph G_A (Recall 77)", def: "Built from G by turning every edge of G into a vertex of G_A, with two G_A vertices adjacent iff their corresponding G-edges share an endpoint. Edge-adjacency in G becomes vertex-adjacency in G_A — the move that lets a vertex-cut become an edge-cut." },
    { term: "Edge cut → vertex cut", def: "CPA's central trick: a small edge-cut in the adjoint graph G_A maps back to a small vertex separator in G. Each cut edge of G_A is a G-edge; the union of those edges' endpoints is the node separator C (Recall 78)." },
    { term: "Cut ratios ψ and φ (Def. 44)", def: "ψ is the edge-cut ratio on G_A (|C_E| over the smaller side); φ is the vertex-cut ratio on G (|V₁∩V₂| over the smaller side). A small ψ(G_A) usually corresponds to a small φ(G), which is what CPA minimises." },
    { term: "Spectral objective / Fiedler vector (Recall 79)", def: "For the Laplacian L = D − A of G_A, λ₂ is the second-smallest eigenvalue (Cheeger bound ψ_min(G_A) ≥ ½λ₂) and its eigenvector e₂ — the Fiedler vector — indicates a natural edge-based split: thresholding e₂ by sign groups the edges of G into two clusters with few cross-adjacencies." },
    { term: "Separator C and blocks A∪C, B∪C", def: "Deleting the separator C from G splits it into two sides A and B; the learned subproblems are A∪C and B∪C, which overlap exactly on C. C is the bridge whose edges to each side must be recovered." },
    { term: "Separator–reunion rule", def: "How CPA stitches the two learned block-graphs: keep edges wholly inside one block; include an edge inside C only if both blocks learned it; allow no direct A–B edge; and re-orient near C so no v-structure is destroyed or created — preserving the independences implied by the decomposition." }
  ],

  animation: {
    title: "CPA on the 6-node running example (paper Example 90, Fig. 191-193): adjoint edge-cut → vertex separator C={V1,V4,V5,V6}.",
    nodes: [
      { id: "V1", x: 0.16, y: 0.18 },
      { id: "V5", x: 0.50, y: 0.18 },
      { id: "V4", x: 0.84, y: 0.18 },
      { id: "V2", x: 0.16, y: 0.82 },
      { id: "V6", x: 0.50, y: 0.82 },
      { id: "V3", x: 0.84, y: 0.82 }
    ],
    edges: [],
    steps: [
      { caption: "<b>The problem.</b> We want the causal structure over six variables {V1..V6}. Instead of searching directly for a separator set of nodes, CPA will recast that as an edge-cut in the adjoint graph. First it needs a cheap scaffold.", ops: [{ op: "badge", text: "partition via adjoint graph", kind: "info" }] },
      { caption: "<b>Build the super-structure G.</b> Start complete, then run only low-order CI tests (singly-conditioned, k_par = 1) and drop the screened-off edges. The surviving rough skeleton has 7 edges E1..E7: E1=V1–V2, E2=V1–V5, E3=V1–V6, E4=V5–V6, E5=V5–V4, E6=V4–V6, E7=V4–V3 (paper Fig. 192a).", ops: [
        { op: "addEdge", from: "V1", to: "V2" }, { op: "addEdge", from: "V1", to: "V5" }, { op: "addEdge", from: "V1", to: "V6" },
        { op: "addEdge", from: "V5", to: "V6" }, { op: "addEdge", from: "V5", to: "V4" }, { op: "addEdge", from: "V4", to: "V6" },
        { op: "addEdge", from: "V4", to: "V3" },
        { op: "testCI", x: "V2", y: "V3", z: ["V1"], result: "indep" }, { op: "badge", text: "super-structure G (7 edges)", kind: "good" }
      ] },
      { caption: "<b>Form the adjoint graph G_A (Recall 77).</b> Every edge of G becomes a vertex E1..E7, and two of them are adjacent iff the original edges share an endpoint. E.g. E2 (V1–V5) and E4 (V5–V6) both touch V5, so E2–E4 is an adjoint edge; E1 (V1–V2) and E5 (V5–V4) share no endpoint, so they are non-adjacent (paper Fig. 191/192b).", ops: [
        { op: "badge", text: "edges of G → vertices of G_A", kind: "info" }
      ] },
      { caption: "<b>Spectral split of G_A (Recall 79).</b> Build the Laplacian L = D − A of the 7-vertex adjoint graph and take the Fiedler vector e₂ of the second-smallest eigenvalue λ₂ = 1.27. Cheeger bounds (ψ_min ≥ ½λ₂) say a small λ₂ promises a clean edge-cut.", ops: [
        { op: "badge", text: "Fiedler vector, λ₂ = 1.27", kind: "info" }
      ] },
      { caption: "<b>Threshold e₂ by sign.</b> e₂ = (0.63, 0.23, 0.23, 0.00, −0.23, −0.23, −0.63) over E1..E7. Non-negative entries (E1,E2,E3,E4) form one group of edges; negative entries (E5,E6,E7) the other. The cross-adjacencies between the groups are the candidate edge-cut.", ops: [
        { op: "set", name: "non-neg group (edges)", items: ["E1", "E2", "E3", "E4"] },
        { op: "badge", text: "sign split of e₂", kind: "info" }
      ] },
      { caption: "<b>Read off the edge cut C_A.</b> The adjoint edges that cross the sign boundary are E4↔E5, E3↔E6, E4↔E6, E2↔E5 (paper Fig. 192c). Their endpoints in G_A give the candidate edge-cut set C_A = {E2, E3, E4, E5, E6} — the edges of G that straddle the split.", ops: [
        { op: "clearSet" }, { op: "set", name: "edge cut C_A", items: ["E2", "E3", "E4", "E5", "E6"] },
        { op: "highlightEdges", edges: [["V1","V5"],["V1","V6"],["V5","V6"],["V5","V4"],["V4","V6"]], cls: "hl" },
        { op: "badge", text: "C_A = {E2,E3,E4,E5,E6}", kind: "info" }
      ] },
      { caption: "<b>Map the edge cut to a vertex separator (Recall 78).</b> Each cut edge is a pair of nodes: E2=(V1,V5), E3=(V1,V6), E4=(V5,V6), E5=(V5,V4), E6=(V4,V6). Take the union of all endpoints and drop duplicates → separator C = {V1, V4, V5, V6}.", ops: [
        { op: "highlightNodes", ids: ["V1", "V4", "V5", "V6"], cls: "hl" },
        { op: "set", name: "separator C", items: ["V1", "V4", "V5", "V6"] }, { op: "badge", text: "C = {V1,V4,V5,V6}", kind: "good" }
      ] },
      { caption: "<b>Delete C → two sides.</b> Removing the separator C from G disconnects what is left into A = {V2} and B = {V3}. The two overlapping blocks are therefore A∪C = {V1,V2,V4,V5,V6} and B∪C = {V1,V3,V4,V5,V6} (paper Fig. 193).", ops: [
        { op: "highlightNodes", ids: ["V1", "V4", "V5", "V6"], cls: "dim" },
        { op: "highlightNodes", ids: ["V2"], cls: "hl" }, { op: "highlightNodes", ids: ["V3"], cls: "hl" },
        { op: "badge", text: "A={V2}, B={V3}", kind: "info" }
      ] },
      { caption: "<b>Learn block 1 = A∪C.</b> Run the base learner on {V1,V2,V4,V5,V6}. The separator nodes are included, so this block recovers V2's edge to the separator plus the separator's internal edges. CI tests range only over these five variables.", ops: [
        { op: "clearSet" }, { op: "set", name: "block A∪C", items: ["V1", "V2", "V4", "V5", "V6"] },
        { op: "highlightNodes", ids: ["V1", "V2", "V4", "V5", "V6"], cls: "hl" }, { op: "highlightNodes", ids: ["V3"], cls: "dim" },
        { op: "testCI", x: "V2", y: "V1", z: [], result: "dep" },
        { op: "highlightEdges", edges: [["V1","V2"],["V1","V5"],["V5","V6"],["V5","V4"],["V4","V6"]], cls: "add" }
      ] },
      { caption: "<b>Learn block 2 = B∪C — in parallel.</b> The other block {V1,V3,V4,V5,V6} is an independent subproblem and runs in parallel. It recovers V3's edge to the separator and the separator's internal edges. The two blocks overlap only on C = {V1,V4,V5,V6}.", ops: [
        { op: "clearSet" }, { op: "set", name: "block B∪C", items: ["V1", "V3", "V4", "V5", "V6"] },
        { op: "highlightNodes", ids: ["V1", "V3", "V4", "V5", "V6"], cls: "hl" }, { op: "highlightNodes", ids: ["V2"], cls: "dim" },
        { op: "testCI", x: "V3", y: "V4", z: [], result: "dep" },
        { op: "highlightEdges", edges: [["V4","V3"],["V1","V6"],["V5","V4"],["V4","V6"]], cls: "add" }
      ] },
      { caption: "<b>Reunite (separator–reunion rule).</b> Keep edges lying wholly inside one block (V1–V2 from block 1, V4–V3 from block 2); include an edge inside the separator C only if BOTH blocks learned it; allow no direct V2–V3 edge. Then re-orient near C so no v-structure is destroyed or created.", ops: [
        { op: "clearSet" }, { op: "highlightNodes", ids: ["V1", "V4", "V5", "V6"], cls: "hl" },
        { op: "badge", text: "reunite over separator C", kind: "info" }
      ] },
      { caption: "<b>Done.</b> The reunited graph over all six variables is returned with its partition A∪C, B∪C, C. The hard 'find a separator of nodes' became an easy 'find an edge-cut' in the adjoint graph, the heavy learning ran distributed across two small blocks, and the reunion respected the decomposition's independences.", ops: [
        { op: "highlightNodes", ids: ["V1", "V2", "V3", "V4", "V5", "V6"], cls: "hl" },
        { op: "badge", text: "global structure returned", kind: "good" }
      ] }
    ]
  },

  complexity: "The super-structure is cheap: every CI test is singly-conditioned (k_par = 1), avoiding the large-conditioning-set blow-up of full constraint-based learning. The partitioning is linear-algebra work on the adjoint graph G_A — build L = D − A and extract the Fiedler vector (second eigenpair) — plus a sign-threshold to read the edge-cut, far cheaper than searching node subsets for a separator. The dominant cost, the base learner, then runs on the two small blocks (which overlap only on C) and can be parallelised. The payoff depends on a small λ₂ / small cut C; with no good cut, it degrades toward learning on the whole set.",
  strengths: [
    "Reframes 'find a node separator' (combinatorial, hard) as 'find an edge-cut' (spectral, principled) by working in the adjoint graph — its defining idea.",
    "Spectral partitioning comes with objectives and Cheeger-type guarantees (λ₂) and a fast Fiedler-vector relaxation, instead of heuristic node search.",
    "Blocks overlap only on the separator C, so they are genuine independent subproblems learnable in parallel (data-distributed).",
    "Wrapper design: works with any base learner on each block; the reunion rule is independent of the learner.",
    "The separator–reunion rule preserves the independences implied by the decomposition (no destroyed or invented v-structures)."
  ],
  limitations: [
    "Only as good as the super-structure: errors in the rough low-order skeleton mislead both the adjoint graph and the spectral cut.",
    "The adjoint graph G_A can be much larger than G (it has one vertex per edge), so for dense skeletons forming and decomposing its Laplacian is costly.",
    "A sign-threshold of the Fiedler vector gives only a 2-way split; very unbalanced or multi-way structures need repeated / recursive cutting.",
    "Assumes a small separator (small λ₂) exists; graphs without such a bottleneck give little speed-up and a large C bloats both blocks.",
    "Inherits the base learner's assumptions (causal sufficiency, faithfulness) and is only as correct as the base learner on each block."
  ],
  notes: "CPA belongs to a broader line of causal-partitioning methods that reduce high-dimensional discovery to smaller subproblems using only low-order CI information (paper §4.63.2). Yan and Zhou's CP (the method CPA is built on) greedily constructed a triple (V₁,V₂,C) where the cut C separated the two sides in the skeleton, showed d-separations stayed valid inside each block, and ran constraint-based search on the leaves with a refinement step. Mai et al.'s CDF derived a partition from a pair whose dependence was broken by a minimal separator, recursing until blocks were small. CAPA (Zhang et al.) refined this partitioning further: it still used low-order CI to build partitions preserving d-separations but applied more expensive regression-based tests within each block, revisiting independences across blocks at merge. Hong et al. (CPBG) inserted a heuristic causal-partitioning layer (a small vertex cut on a rough skeleton) before learning partial graphs on each side and stitching through the cut.",
  figureRefs: "Paper §4.63 (pp.300-303): Algorithm 82 (CPA high level: skeleton → adjoint graph → edge cut → vertex cut → blocks + separator); Recall 76 (super-structure from low-order CI, k_par=1); Recall 77 (adjoint/line graph); Recall 78 (two-way partitions, edge cuts, cut ratios); Recall 79 (spectral objective, Fiedler vector, Cheeger bound); Definition 44 (vertex-cut ratio φ); Example 90 with Fig. 191 (adjoint transform E1,E2 meet at V1), Fig. 192 (running 6-node example: super-skeleton G, adjoint G_A, Fiedler partition; A matrix, L, λ₂=1.27, e₂; C_A={E2..E6}), Fig. 193 (partition into A∪C and B∪C with C={V1,V4,V5,V6})."
};
