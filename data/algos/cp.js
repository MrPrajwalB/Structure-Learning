/* CP — Causal Partitioning (Yan & Zhou [723]). Grounded in §5.14 (pp.358-362):
   constraint-based, data-distributed divide-conquer built on PC (base learner) + the
   SADA causal-cut idea. Definition 50 (causal partition (V1,V2,C)); Claim 1 (local
   separation inside a partition) + its counterexample Fig.224 and Remark 34;
   3-phase pipeline = (1) zero/low-order pruning, (2) greedy partition by R1-R3,
   (3) bounded-order cut minimization + recurse + learn-per-part + merge + local
   refinement; Algorithm 105 (CP). Worked Example 112 on the Asia network with
   (V1,V2,C) = ({A,T},{L,B},{S,R,D,X}), Fig.225 (prune->partition->order-1 cut min),
   Fig.226 (partition construction). CPBG (§4.59) and CPA (§4.63) are descendants. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["cp"] = {
  name: "CP (Causal Partitioning)",
  oneLiner: "Prune a complete graph with cheap low-order independence tests, greedily split the variables into two blocks V₁ and V₂ joined only through a small cut set C, learn each block (V₁∪C and V₂∪C) separately with a base learner such as PC, then merge the two skeletons by union and clean up the join with a local refinement check.",
  basedOnText: "CP is a constraint-based, data-distributed divide-and-conquer wrapper. It marries the causal-cut idea of SADA with the PC algorithm as its per-block base learner. Its signature is that — unlike SADA, which starts from a high-order independence graph — CP forms the partition almost entirely from cheap low-order CI tests, raising the test order only when the cut threatens to grow too large.",

  assumptions: [
    "<b>Causal sufficiency &amp; faithfulness</b> — the standard constraint-based assumptions, inherited from the PC base learner run on each block.",
    "<b>A small cut set exists</b> — there is a relatively small set C of variables that screens the rest into two non-adjacent blocks V₁ and V₂. CP pays off when the true graph has this 'bottleneck' shape.",
    "<b>Reliable low-order CI tests</b> — CP deliberately keeps conditioning sets small (order 0, then 1, …) so each test stays fast and statistically trustworthy.",
    "<b>Local-separation claim holds 'in practice'</b> — Claim 1 (separators can be drawn from a block plus the cut) is false in general (Fig. 224 counterexample), but Remark 34 argues CP is still sound when CI tests are reliable, with a final refinement step repairing residual errors."
  ],
  input: "A dataset 𝒟 over variables V, a CI test, a recursion threshold θ (when a block is small enough to learn directly), and a base learner BaseLearn (the paper uses PC).",
  output: "A single skeleton/graph 𝒢̂ over all of V — the union of the two block subgraphs after local refinement. With PC as the base learner the per-block results are CPDAGs and the merged structure represents the equivalence class of the true DAG.",

  idea: [
    "Constraint-based learners get slow and unreliable as the variable count grows, because their independence tests need ever-larger conditioning sets. CP attacks this by never working on all of V at once: it cuts the variables into two blocks and learns each block separately, so every test is small.",
    "The key object (Definition 50) is a <b>causal partition</b> (V₁, V₂, C): three disjoint sets covering V such that <i>no</i> node in V₁ is adjacent to any node in V₂. The cut set C is the only bridge between the two sides. The two induced subproblems are then V₁∪C and V₂∪C — the cut is included in <i>both</i>, because edges between a block and the cut must be learnable on that side.",
    "CP runs in three phases: <b>(1) zero/low-order pruning</b> — start from the complete undirected graph and delete edges that fail marginal (order-0) CI tests; <b>(2) greedy partition</b> — rank variables by how often they appear in detected independences and slot each one into V₁, V₂ or C by rules R1–R3; <b>(3) bounded-order cut minimization</b> — if the cut grows too large, temporarily raise the test order and re-test adjacencies touching C to shrink it.",
    "After the partition is fixed, CP recurses on any oversized block, runs the base learner (PC) on each block, and <b>merges by skeleton union</b> — overlaying the two learned subgraphs. By construction there are no cross-side edges; the only shared edges live inside C. A final <b>local refinement</b> removes any surviving edge that a small conditioning set can now make independent, repairing the artifacts the decomposition introduced.",
    "The honest caveat (Remark 34): the local-separation Claim 1 is not true in general — Fig. 224 shows a partition where two same-side variables cannot be separated using only that side's variables, because the separator lives outside the block (a hidden-common-cause / causal-sufficiency issue). CP's refinement step is the patch that recovers the correct skeleton in practice when CI tests are reliable."
  ],

  steps: [
    "<b>Prune (order 0).</b> Initialise a complete undirected graph on V. Delete every edge X−Y for which the marginal test gives X ⫫ Y. (Algorithm 105, line 1.)",
    "<b>Build the partition — initialise.</b> Set (V₁, V₂, C) = (∅, ∅, ∅) and process the variables in decreasing frequency of detected independences (the variables involved in the most independencies are placed first).",
    "<b>Assign each variable by R1–R3.</b> For the next variable W: <i>(R1)</i> put W in V₁ if it is nonadjacent to every node currently in V₂; <i>(R2)</i> put W in V₂ if it is nonadjacent to every node currently in V₁; <i>(R3)</i> otherwise put W in the cut C. A tie-break assigns the first node nonadjacent to all of V₁ to V₂, favouring a small cut and roughly balanced sides.",
    "<b>Cut minimization (bounded order).</b> Let ℓ = 0. While |C| ≥ |V₁| + |V₂| (the cut is too large), raise ℓ ← ℓ+1 and run order-ℓ tests X ⫫ Y | Z (|Z|=ℓ) restricted to adjacencies incident to C; delete edges on independence to shrink C. (Algorithm 105, line 3.)",
    "<b>Recurse.</b> For each side i with |Vᵢ ∪ C| &gt; θ, apply CP recursively to Vᵢ ∪ C (reusing the same threshold and bounded-order policy).",
    "<b>Learn subgraphs.</b> Run the base learner (PC) separately on each induced set V₁ ∪ C and V₂ ∪ C. Because the cut is included on both sides, every block↔cut edge can be found, and all CI tests stay low-dimensional.",
    "<b>Merge (skeleton union).</b> Set 𝒢̂ ← the union of adjacencies from the two learned subgraphs. No cross-side edge can appear by construction; edges with both endpoints in C are estimated twice, so keep the edge if either run includes it. If orientations disagree on a cut edge, retain it as undirected for now. (Algorithm 105, line 6.)",
    "<b>Local refinement.</b> For every edge (Xᵢ, Xⱼ) in 𝒢̂, look for a small set Z ⊆ N(Xᵢ) ∪ N(Xⱼ) (neighbours in the merged graph) with Xᵢ ⫫ Xⱼ | Z; if one exists, delete the edge. This removes cross-side artifacts and reconciles duplicate edges on C. (Algorithm 105, line 7.)",
    "<b>Return</b> the refined graph 𝒢̂. If orientations are kept, remaining edges may be oriented by the base learner's rules; otherwise the merged skeleton is returned."
  ],

  keyConcepts: [
    { term: "Causal partition (V₁, V₂, C)", def: "Definition 50: three disjoint sets covering V such that no node in V₁ is adjacent to any node in V₂. C is the cut set — the only bridge between the two sides — and is included in both induced subproblems V₁∪C and V₂∪C." },
    { term: "Low-order partitioning", def: "CP's defining feature: it builds the partition from cheap order-0 (then order-1, …) CI tests, in contrast to SADA which starts from a high-order independence graph. The order is raised only when the cut gets too big." },
    { term: "Rules R1–R3", def: "The greedy assignment: R1 sends a variable to V₁ if it is nonadjacent to all of V₂; R2 sends it to V₂ if nonadjacent to all of V₁; R3 puts it in the cut C otherwise. A tie-break favours a small, balanced cut." },
    { term: "Bounded-order cut minimization", def: "If |C| ≥ |V₁| + |V₂|, CP temporarily increases the CI test order ℓ and re-tests only adjacencies touching C, deleting edges to shrink the cut before learning." },
    { term: "Skeleton-union merge", def: "Merging is done at the skeleton level: take the union of adjacencies from the two block subgraphs. No cross-side edge can appear by construction; shared cut edges are kept if either side has them, left undirected if orientations disagree." },
    { term: "Local refinement", def: "The final patch: delete any merged edge (Xᵢ,Xⱼ) for which a small Z ⊆ N(Xᵢ)∪N(Xⱼ) gives Xᵢ ⫫ Xⱼ | Z. It removes decomposition artifacts and is what recovers the correct skeleton despite Claim 1 being false." },
    { term: "Claim 1 counterexample (Fig. 224)", def: "The local-separation claim — that nonadjacent same-side variables can always be separated using only that side plus the cut — is false: a hidden common cause outside the block can force the separator to live elsewhere. Remark 34 explains why CP is still sound with reliable tests." }
  ],

  animation: {
    title: "CP on the Asia network (paper Example 112, Fig. 225/226): partition into V₁={A,T}, V₂={L,B}, cut C={S,R,D,X}.",
    nodes: [
      { id: "A", x: 0.10, y: 0.14 },
      { id: "T", x: 0.34, y: 0.14 },
      { id: "S", x: 0.66, y: 0.12 },
      { id: "L", x: 0.90, y: 0.14 },
      { id: "B", x: 0.92, y: 0.50 },
      { id: "R", x: 0.42, y: 0.50 },
      { id: "X", x: 0.20, y: 0.84 },
      { id: "D", x: 0.62, y: 0.84 }
    ],
    edges: [
      { from: "A", to: "T", type: "undirected" }, { from: "A", to: "S", type: "undirected" },
      { from: "A", to: "L", type: "undirected" }, { from: "A", to: "B", type: "undirected" },
      { from: "T", to: "S", type: "undirected" }, { from: "T", to: "L", type: "undirected" },
      { from: "T", to: "B", type: "undirected" }, { from: "T", to: "R", type: "undirected" },
      { from: "S", to: "L", type: "undirected" }, { from: "S", to: "B", type: "undirected" },
      { from: "S", to: "R", type: "undirected" }, { from: "S", to: "X", type: "undirected" },
      { from: "L", to: "R", type: "undirected" }, { from: "B", to: "D", type: "undirected" },
      { from: "R", to: "X", type: "undirected" }, { from: "R", to: "D", type: "undirected" }
    ],
    steps: [
      { caption: "<b>The problem.</b> Eight Asia variables {A,T,S,L,B,R,X,D}. Learning the whole structure at once needs large, unreliable conditioning sets, so CP starts from a near-complete undirected graph and will divide it before any heavy learning. (Edges shown are the pruned scaffold; ℓ=0.)", ops: [{ op: "badge", text: "ℓ = 0 · divide & conquer", kind: "info" }] },
      { caption: "<b>Phase 1 — marginal pruning (order 0).</b> Cheap marginal tests find independences such as T ⫫ L, T ⫫ B, T ⫫ S, A ⫫ S, A ⫫ B, A ⫫ L; delete those edges. This sparse skeleton is what the partition is read off (Fig. 225b).", ops: [
        { op: "testCI", x: "T", y: "L", z: [], result: "indep" },
        { op: "removeEdge", from: "T", to: "L" }, { op: "removeEdge", from: "T", to: "B" }, { op: "removeEdge", from: "T", to: "S" },
        { op: "removeEdge", from: "A", to: "S" }, { op: "removeEdge", from: "A", to: "B" }, { op: "removeEdge", from: "A", to: "L" },
        { op: "badge", text: "order-0 edges deleted", kind: "good" } ] },
      { caption: "<b>Phase 2 — greedy partition (R1–R3).</b> Process variables by decreasing frequency in the independence list. A and T are mutually adjacent and screened from the other side, so they seed V₁ = {A,T} (Fig. 226a–b).", ops: [
        { op: "set", name: "V₁", items: ["A", "T"] },
        { op: "highlightNodes", ids: ["A", "T"], cls: "hl" }, { op: "badge", text: "R1 → V₁", kind: "info" } ] },
      { caption: "<b>Grow V₂.</b> L is nonadjacent to all of V₁, so by the tie-break it opens V₂ = {L}; B is likewise nonadjacent to V₁, so V₂ = {L,B} (Fig. 226c–d).", ops: [
        { op: "set", name: "V₂", items: ["L", "B"] },
        { op: "highlightNodes", ids: ["L", "B"], cls: "add" }, { op: "badge", text: "R2 → V₂", kind: "info" } ] },
      { caption: "<b>Fill the cut C (R3).</b> S, R, D, X are each adjacent to nodes on both sides — they cannot go to V₁ or V₂, so rule R3 sends them to the cut: C = {S,R,D,X} (Fig. 226e–h).", ops: [
        { op: "set", name: "Cut C", items: ["S", "R", "D", "X"] },
        { op: "highlightNodes", ids: ["S", "R", "D", "X"], cls: "hl" }, { op: "badge", text: "R3 → cut C", kind: "warn" } ] },
      { caption: "<b>Phase 3 — bounded-order cut minimization.</b> Here |C|=4 ≥ |V₁|+|V₂|=4, so raise the order to ℓ=1 and run order-1 tests on adjacencies touching C, e.g. A ⫫ R | T, S ⫫ X | R, T ⫫ D | R. Delete the newly-independent edges to thin the cut (Fig. 225d).", ops: [
        { op: "badge", text: "ℓ = 1 · shrink cut", kind: "info" },
        { op: "testCI", x: "A", y: "R", z: ["T"], result: "indep" },
        { op: "testCI", x: "T", y: "D", z: ["R"], result: "indep" },
        { op: "highlightNodes", ids: ["S", "R", "D", "X"], cls: "hl" } ] },
      { caption: "<b>Partition fixed.</b> (V₁,V₂,C) = ({A,T},{L,B},{S,R,D,X}). The cut (highlighted) is the only bridge: no V₁ node is adjacent to any V₂ node. Now conquer each side — the cut C joins both subproblems.", ops: [
        { op: "highlightNodes", ids: ["S", "R", "D", "X"], cls: "hl" },
        { op: "highlightNodes", ids: ["A", "T", "L", "B"], cls: "dim" }, { op: "badge", text: "causal partition", kind: "good" } ] },
      { caption: "<b>Subset 1 = V₁ ∪ C = {A,T,S,R,D,X}.</b> Run the base learner (PC) here. Only these six variables enter the CI tests, so conditioning sets stay small. Recover its edges: A→T, T→R, S→R, R→X, R→D, S→X.", ops: [
        { op: "clearSet" }, { op: "set", name: "Block 1 (V₁∪C)", items: ["A", "T", "S", "R", "D", "X"] },
        { op: "highlightNodes", ids: ["A", "T", "S", "R", "D", "X"], cls: "hl" },
        { op: "highlightNodes", ids: ["L", "B"], cls: "dim" },
        { op: "orient", from: "A", to: "T", type: "directed" }, { op: "orient", from: "T", to: "R", type: "directed" },
        { op: "orient", from: "S", to: "R", type: "directed" }, { op: "orient", from: "R", to: "X", type: "directed" },
        { op: "orient", from: "R", to: "D", type: "directed" },
        { op: "highlightEdges", edges: [["A","T"],["T","R"],["S","R"],["R","X"],["R","D"],["S","X"]], cls: "hl" } ] },
      { caption: "<b>Subset 2 = V₂ ∪ C = {L,B,S,R,D,X}.</b> Run PC on the right block (independent of block 1, can run in parallel). Recover: S→L, S→B, L→R, B→D — the cut variables S,R,D,X are shared so the join edges are found on this side too.", ops: [
        { op: "clearSet" }, { op: "set", name: "Block 2 (V₂∪C)", items: ["L", "B", "S", "R", "D", "X"] },
        { op: "highlightNodes", ids: ["L", "B", "S", "R", "D", "X"], cls: "hl" },
        { op: "highlightNodes", ids: ["A", "T"], cls: "dim" },
        { op: "orient", from: "S", to: "L", type: "directed" }, { op: "orient", from: "S", to: "B", type: "directed" },
        { op: "orient", from: "L", to: "R", type: "directed" }, { op: "orient", from: "B", to: "D", type: "directed" },
        { op: "highlightEdges", edges: [["S","L"],["S","B"],["L","R"],["B","D"]], cls: "hl" } ] },
      { caption: "<b>Merge — skeleton union.</b> Overlay the two block subgraphs. No cross-side edge can appear by construction; the cut nodes S,R,D,X are where the halves meet. Edges inside C are estimated twice — keep an edge if either run has it (Algorithm 105, line 6).", ops: [
        { op: "clearSet" }, { op: "highlightNodes", ids: ["S", "R", "D", "X"], cls: "hl" },
        { op: "highlightEdges", edges: [["S","R"],["R","X"],["R","D"],["S","X"]], cls: "hl" },
        { op: "badge", text: "merge: union of skeletons", kind: "info" } ] },
      { caption: "<b>Local refinement.</b> Check each merged edge against a small Z drawn from its endpoints' neighbours. The duplicate cut edge S−X is now explained by S→R→X: testing S ⫫ X | {R} holds, so delete S−X (Algorithm 105, line 7 — this repairs the decomposition artifact Claim 1 warned about).", ops: [
        { op: "testCI", x: "S", y: "X", z: ["R"], result: "indep" },
        { op: "removeEdge", from: "S", to: "X" },
        { op: "highlightNodes", ids: ["S", "R", "X"], cls: "hl" },
        { op: "badge", text: "refine: drop S–X", kind: "warn" } ] },
      { caption: "<b>Done.</b> Return the merged, refined graph 𝒢̂ over all eight variables: A→T→R, S→R, R→X, R→D, S→L→R, S→B→D. Every CI test stayed low-dimensional — the payoff of low-order partition → PC-per-block → union-merge → refine.", ops: [
        { op: "highlightNodes", ids: ["A", "T", "S", "L", "B", "R", "X", "D"], cls: "hl" },
        { op: "badge", text: "global structure returned", kind: "good" } ] }
    ]
  },

  complexity: "When a small, balanced cut exists, CP follows a divide-and-conquer recurrence: a problem of size n splits into two blocks of about half the size (each V_i ∪ C), so the number and dimension of CI tests — the dominant cost of the PC base learner — drop sharply versus running PC on all of V. Building the partition itself uses only low-order tests (order 0, occasionally 1), which is cheap. The win depends on finding a small balanced cut; with no good cut, |C| stays large and CP degrades toward plain PC.",
  strengths: [
    "Forms the partition from cheap low-order CI tests, raising the order only to shrink an oversized cut — cheaper and more reliable than SADA's high-order independence graph.",
    "Wrapper design: any base learner (the paper uses PC) and any CI test plug in; CP only adds the partition / merge / refinement logic.",
    "The two blocks are learned independently, so the heavy structure learning can run in parallel (data-distributed).",
    "The skeleton-union merge guarantees no spurious cross-side edge appears, and the local refinement repairs duplicate cut edges and decomposition artifacts."
  ],
  limitations: [
    "Depends on the existence of a small, balanced cut; graphs without a bottleneck push too many variables into C and give little speed-up.",
    "The local-separation Claim 1 is false in general (Fig. 224): a hidden common cause outside a block can make two same-side variables impossible to separate using only that side — a causal-sufficiency violation the merge can miss.",
    "Correctness relies on the refinement step's 'small' Z; Remark 34 notes Z may need to grow up to (max merged-skeleton degree − 1) to delete every residual false edge.",
    "Inherits the base learner's assumptions and is only as accurate as PC is on each block; early CI-test errors during pruning or partitioning can cascade."
  ],
  notes: "CP combines the causal-cut idea of SADA with PC as its per-block base learner, but partitions using low-order tests rather than a high-order independence graph. Remark 34 argues CP is sound in practice despite Claim 1 failing: under reliable CI testing and a correct subgraph learner, low-order tests find a valid partition, recursion confines higher-order separations to small sides, and the final local pruning recovers the correct skeleton. Two descendants build on CP: CPBG (§4.59) derives the partition from a quickly-built rough 'base graph' using graph distances/degrees, and CPA (§4.63) reframes the cut as a spectral edge-cut in the adjoint (line) graph.",
  figureRefs: "Paper §5.14 (pp.358–362): Algorithm 105 (CP), Definition 50 (causal partition), Claim 1 (local separation) with counterexample Fig. 224, Remark 34 (guarantee/scope), Example 112 (Asia network, (V₁,V₂,C)=({A,T},{L,B},{S,R,D,X})), Fig. 225 (prune → partition → order-1 cut minimization, panels a–d), Fig. 226 (partition construction, panels a–h). Builds on PC (§4.1, Algorithm 3) and the SADA causal-cut idea (§4.33); descendants CPBG (§4.59) and CPA (§4.63)."
};
