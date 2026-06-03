/* LocalDSLA — Decomposition-based Structure Learning Algorithm using Local
   topology information. Grounded in §5.16 (pp.365-368). Method due to Dai et al. [137].
   Constraint/distributed family; builds on ECOS's decompose-solve-merge idea.
   Pseudocode = Algorithm 107 (Local-DSLA). Definitions: Recall 98 (mutual information),
   Recall 99 (maximal information coefficient MIC), Def 51 (simple k-path),
   Def 52 (k-path node centrality), Example 115 (estimating centrality),
   Fig.230 (k-path node-centrality heuristic: 230a random k-paths, 230b high-centrality
   nodes A,B as good separator candidates), Remark 35 (empirical, no formal guarantees). */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["localdsla"] = {
  name: "LocalDSLA (Local Decomposition Structure Learning)",
  oneLiner: "Build a pruned undirected skeleton, find the few 'hub' variables that everything passes through, pull them out to break the skeleton into small overlapping pieces, learn a Bayesian network inside each piece with any base learner, then merge the pieces back together along those hubs.",
  basedOnText: "LocalDSLA (Decomposition-based Structure Learning using Local topology, Dai et al. [137]) is a constraint/decomposition framework. It follows the same <b>decompose → solve-each-piece → merge</b> recipe as ECOS, but where ECOS cuts a super-structure at high-betweenness <i>edges</i> and solves each cluster <b>exactly</b>, LocalDSLA splits the skeleton by removing high-centrality <i>nodes</i> (estimated cheaply via random k-paths) and learns each piece with <b>any</b> base BN learner. It trades ECOS's exactness/optimality guarantee for empirical scalability.",

  assumptions: [
    "<b>The skeleton captures the true adjacencies</b> — LocalDSLA only ever orients edges that survive its MIC + CI pruning, so a true edge thrown out early (or a spurious edge kept) cannot be repaired later.",
    "<b>Associations are detectable by MIC and CI tests</b> — the maximal information coefficient (MIC) is used so that general, possibly nonlinear, dependencies between discrete and continuous variables can be screened; thinning then uses a likelihood-ratio CI test.",
    "<b>A few high-centrality nodes act as separators</b> — the graph really does pinch through a small number of hub variables, so removing them genuinely breaks it into smaller pieces (the heuristic, not a proven property).",
    "<b>Empirical, not provably correct</b> — Remark 35: because the split uses an undirected skeleton and a sampling heuristic, LocalDSLA neither proves the skeleton is a valid independence graph (so d-separation rules need not hold) nor establishes global consistency of the merged graph."
  ],
  input: "A dataset 𝒟 over variables V, a MIC sparsity threshold α_MIC, a path length k, and a number of sampled simple k-paths T.",
  output: "A single Bayesian-network structure 𝒢 (a DAG) over V, assembled from the locally learned subgraphs.",

  idea: [
    "A score- or constraint-based learner over <i>all</i> variables is expensive and error-prone on larger problems. LocalDSLA's idea is to first carve the problem into <b>local sub-structures</b>, learn each one in isolation, and then sew them together — the same divide-and-conquer spirit as ECOS, but adapted so it can wrap <i>any</i> off-the-shelf BN learner instead of an exact solver.",
    "<b>Step A — a pruned skeleton.</b> Start from the complete undirected graph and compute the MIC between every pair (MIC, Recall 99, generalises mutual information to nonlinear and mixed associations via the best 2D grid). Drop edges that fail a 'double' α_MIC test — an edge X–Y is kept only if its association is strong <i>relative to each endpoint's strongest partner</i> (MIC(X,Y) ≮ α_MIC·MMIC(X)). Then <b>thin</b> the survivors with CI tests over current neighbour sets, and apply a stronger likelihood-ratio CI filter to delete the last weak edges. What remains is the undirected skeleton ℋ.",
    "<b>Step B — find the hubs without computing exact betweenness.</b> ECOS picks bridge <i>edges</i> by edge-betweenness; LocalDSLA instead picks separator <i>nodes</i> by <b>k-path node centrality</b> (Def 52): the probability that a randomly originated message, travelling along uniformly random simple k-paths (Def 51, a path of at most k edges with no repeated node), passes through a node v. It is estimated cheaply by sampling T random simple k-paths and counting how many cross v — no all-pairs shortest-path computation needed (Example 115: 2 of 3 paths through A gives an estimate for A).",
    "<b>Step C — decompose by removing hubs.</b> Iteratively remove the most central nodes from ℋ until the graph <b>splits</b>; re-insert each removed hub into every component it touched, and recurse on components that are still large. This yields <b>overlapping</b> subgraphs {𝒲_ℓ}: each piece is a component C_ℓ together with the separator nodes S_ℓ that border it (𝒲_ℓ = S_ℓ ∪ C_ℓ). The hubs sit in more than one piece — that overlap is what lets the pieces be stitched back consistently.",
    "<b>Step D — learn locally, then merge.</b> Run any base BN learner (e.g. a local score-based search with BIC) on each subgraph 𝒲_ℓ, restricted to that piece's local topology. Finally <b>merge</b> the per-piece DAGs along the shared separator nodes: where pieces overlap on a hub, their edges and orientations are reconciled into one global structure 𝒢. (Remark 35 stresses this merge is an empirical reconciliation, not a guaranteed-consistent one.)"
  ],

  steps: [
    "<b>MIC screen (build ℋ₀).</b> Compute MIC(X_i, X_j) for all pairs of variables and start from the complete undirected graph ℋ₀.",
    "<b>Double α_MIC prune.</b> Delete edge X_i–X_j unless its MIC is large relative to <i>each</i> endpoint's strongest association (MIC(X_i,X_j) ≮ α_MIC·MMIC(X_i) and likewise for X_j). This gives a sparser candidate graph ℋ.",
    "<b>Thin with CI tests.</b> Further prune edges of ℋ using conditional-independence tests within current neighbour sets, then a stronger likelihood-ratio CI test, to obtain the final undirected skeleton.",
    "<b>Estimate k-path node centrality.</b> Sample T random simple k-paths and, for each node v, estimate Ĉ_k(v) = the fraction of sampled paths that pass through v (Def 52, Example 115). High Ĉ_k marks hub / separator candidates.",
    "<b>Decompose.</b> Iteratively remove the top-central nodes from the skeleton until the graph splits into components; re-insert each removed hub into every component it bordered, and recurse on components that are still large. Collect the resulting overlapping subgraphs {𝒲_ℓ}, each 𝒲_ℓ = S_ℓ (separators) ∪ C_ℓ (component).",
    "<b>Learn locally.</b> Run a base BN learner on each subgraph 𝒲_ℓ under its local topology constraints, producing a small directed sub-DAG per piece.",
    "<b>Merge.</b> Combine the sub-DAGs along the shared separator nodes, reconciling overlapping edges and orientations into a single global structure, and return 𝒢."
  ],

  keyConcepts: [
    { term: "Maximal information coefficient (MIC)", def: "A normalised, grid-based generalisation of mutual information (Recall 98–99). It maximises the normalised mutual information over admissible 2D grids, so it detects general — including nonlinear — associations between discrete and continuous variables. LocalDSLA uses it to screen edges." },
    { term: "Double α_MIC test", def: "An edge X–Y is kept only if its MIC is strong relative to EACH endpoint's strongest association: MIC(X,Y) ≮ α_MIC·MMIC(X) and ≮ α_MIC·MMIC(Y). This removes edges that are weak compared to a node's best partner, yielding a sparse candidate graph." },
    { term: "Simple k-path (Def 51)", def: "A path of at most k edges that visits no vertex more than once. LocalDSLA samples these to approximate how 'central' a node is." },
    { term: "k-path node centrality Ĉ_k(v) (Def 52)", def: "The probability that a random message travelling along uniformly random simple k-paths passes through node v, estimated as Ĉ_k(v) = k·|V|·count(v)/T from T sampled paths. A cheap stand-in for betweenness used to spot separator nodes." },
    { term: "Separator nodes / subgraph 𝒲_ℓ", def: "The high-centrality nodes removed to split the skeleton are separators S_ℓ. Each local piece is 𝒲_ℓ = S_ℓ ∪ C_ℓ: a component C_ℓ plus the separators bordering it. Separators belong to several pieces, creating the overlap used to merge." },
    { term: "Local learn + merge", def: "Any base BN learner (e.g. local score search with BIC) is run inside each 𝒲_ℓ under local constraints; the resulting sub-DAGs are merged along shared separators into one global DAG — the same decompose-solve-merge shape as ECOS, but node-based and learner-agnostic." }
  ],

  animation: {
    title: "LocalDSLA on a faithful 7-node example: hub node D separates two halves (illustrative; cf. Algorithm 107, Fig.230, Def 52).",
    nodes: [
      { id: "A", x: 0.08, y: 0.20 },
      { id: "B", x: 0.08, y: 0.80 },
      { id: "C", x: 0.30, y: 0.50 },
      { id: "D", x: 0.52, y: 0.50 },
      { id: "E", x: 0.74, y: 0.50 },
      { id: "F", x: 0.94, y: 0.20 },
      { id: "G", x: 0.94, y: 0.80 }
    ],
    edges: [
      { from: "A", to: "C", type: "undirected" },
      { from: "B", to: "C", type: "undirected" },
      { from: "A", to: "B", type: "undirected" },
      { from: "C", to: "D", type: "undirected" },
      { from: "D", to: "E", type: "undirected" },
      { from: "E", to: "F", type: "undirected" },
      { from: "E", to: "G", type: "undirected" },
      { from: "F", to: "G", type: "undirected" }
    ],
    steps: [
      { caption: "<b>Start: complete graph + MIC screen.</b> Conceptually begin from the complete undirected graph and compute MIC(X,Y) for every pair (Recall 99 — a grid-based generalisation of mutual information that catches nonlinear and mixed associations). Strong pairs survive into ℋ₀.", ops: [{ op: "badge", text: "MIC screen → ℋ₀", kind: "info" }, { op: "highlightNodes", ids: ["A","B","C","D","E","F","G"], cls: "hl" }] },
      { caption: "<b>Double α_MIC prune.</b> Keep an edge only if its MIC is strong relative to EACH endpoint's strongest partner (MIC(X,Y) ≮ α_MIC·MMIC(X)). Weak-by-comparison edges are dropped, leaving the sparse candidate graph ℋ shown here.", ops: [{ op: "badge", text: "double α_MIC test", kind: "info" }, { op: "highlightEdges", edges: [["A","C"],["B","C"],["A","B"],["C","D"],["D","E"],["E","F"],["E","G"],["F","G"]], cls: "hl" }] },
      { caption: "<b>Thin with CI tests.</b> Within current neighbour sets, run CI tests and then a stronger likelihood-ratio CI test to delete the last weak edges. Here A–B is found independent given C, so it is removed — finalising the undirected skeleton.", ops: [{ op: "testCI", x: "A", y: "B", z: ["C"], result: "indep" }, { op: "removeEdge", from: "A", to: "B" }, { op: "badge", text: "skeleton ℋ finalised", kind: "good" }] },
      { caption: "<b>Estimate k-path node centrality (Def 52).</b> Instead of exact betweenness, sample T random simple k-paths (Def 51) and count how many cross each node. Most sampled paths between the two halves must pass through D, giving it the highest Ĉ_k.", ops: [{ op: "badge", text: "sample T k-paths → Ĉ_k", kind: "info" }, { op: "score", text: "Ĉ_k(D) ≈ 2|V|·(count(D)/T) — highest of all nodes" }, { op: "highlightNodes", ids: ["D"], cls: "hl" }] },
      { caption: "<b>Pick the hub / separator.</b> D has by far the largest k-path centrality (cf. Fig.230b, where high-centrality nodes are good separator candidates), so D is selected as the separator node to remove.", ops: [{ op: "highlightNodes", ids: ["D"], cls: "add" }, { op: "set", name: "Separators S", items: ["D"] }, { op: "badge", text: "separator node = D", kind: "good" }] },
      { caption: "<b>Decompose — remove the hub.</b> Temporarily remove D and its edges. The skeleton splits into two components: {A,B,C} on the left and {E,F,G} on the right. (D is dimmed to show it is pulled out.)", ops: [{ op: "highlightNodes", ids: ["D"], cls: "dim" }, { op: "highlightEdges", edges: [["C","D"],["D","E"]], cls: "dim" }, { op: "badge", text: "decompose: graph splits", kind: "info" }] },
      { caption: "<b>Re-insert the hub into each component → overlapping pieces.</b> Put D back into BOTH components it bordered. This yields two overlapping subgraphs: 𝒲₁ = {A,B,C} ∪ {D} and 𝒲₂ = {E,F,G} ∪ {D}. D is shared — that overlap is what lets the pieces merge later.", ops: [{ op: "highlightNodes", ids: ["A","B","C","D"], cls: "add" }, { op: "set", name: "Local component 𝒲₁", items: ["A","B","C","D"] }, { op: "set", name: "Local component 𝒲₂", items: ["D","E","F","G"] }, { op: "badge", text: "𝒲ℓ = Sℓ ∪ Cℓ (overlap on D)", kind: "good" }] },
      { caption: "<b>Learn locally in 𝒲₁ = {A,B,C,D}.</b> Run the base BN learner (e.g. local score search with BIC) on just this piece under its local topology. It recovers A → C, B → C and the boundary edge C → D.", ops: [{ op: "highlightNodes", ids: ["A","B","C","D"], cls: "add" }, { op: "addEdge", from: "A", to: "C", type: "directed" }, { op: "orient", from: "A", to: "C", type: "directed" }, { op: "addEdge", from: "B", to: "C", type: "directed" }, { op: "orient", from: "B", to: "C", type: "directed" }, { op: "addEdge", from: "C", to: "D", type: "directed" }, { op: "orient", from: "C", to: "D", type: "directed" }, { op: "score", text: "base learner on 𝒲₁: BIC-best local sub-DAG" }, { op: "badge", text: "local-learn 𝒲₁", kind: "good" }] },
      { caption: "<b>Learn locally in 𝒲₂ = {D,E,F,G}.</b> Independently, the base learner on this piece recovers D → E, E → F, E → G and F → G. D appears here too — its incident edges will have to agree with what 𝒲₁ said.", ops: [{ op: "highlightNodes", ids: ["D","E","F","G"], cls: "add" }, { op: "addEdge", from: "D", to: "E", type: "directed" }, { op: "orient", from: "D", to: "E", type: "directed" }, { op: "addEdge", from: "E", to: "F", type: "directed" }, { op: "orient", from: "E", to: "F", type: "directed" }, { op: "addEdge", from: "E", to: "G", type: "directed" }, { op: "orient", from: "E", to: "G", type: "directed" }, { op: "addEdge", from: "F", to: "G", type: "directed" }, { op: "orient", from: "F", to: "G", type: "directed" }, { op: "score", text: "base learner on 𝒲₂: BIC-best local sub-DAG" }, { op: "badge", text: "local-learn 𝒲₂", kind: "good" }] },
      { caption: "<b>Merge along the shared separator D.</b> The two sub-DAGs overlap only on hub D. Stitch them together at D, reconciling its incident edges (C → D from 𝒲₁ and D → E from 𝒲₂ agree — no conflict, no cycle through D).", ops: [{ op: "highlightNodes", ids: ["D"], cls: "hl" }, { op: "highlightEdges", edges: [["C","D"],["D","E"]], cls: "hl" }, { op: "badge", text: "merge along separator D", kind: "good" }] },
      { caption: "<b>Resolve any overlap conflicts.</b> If a separator's edge had been oriented differently in the two pieces, the merge step reconciles them here. (Remark 35: this is an empirical reconciliation — LocalDSLA does not prove the merged graph is globally consistent.)", ops: [{ op: "badge", text: "reconcile overlapping edges", kind: "info" }, { op: "highlightNodes", ids: ["C","D","E"], cls: "hl" }] },
      { caption: "<b>Return 𝒢.</b> The merged structure A → C ← B, C → D → E, E → F, E → G, F → G is a single global DAG — learned by decomposing at one hub, solving two small pieces, and merging, in the same decompose-solve-merge spirit as ECOS (node-based, learner-agnostic).", ops: [{ op: "highlightNodes", ids: ["A","B","C","D","E","F","G"], cls: "good" }, { op: "badge", text: "global structure 𝒢 returned", kind: "good" }] }
    ]
  },

  complexity: "No worst-case optimality guarantee (Remark 35) — LocalDSLA targets empirical scalability. The MIC screen is roughly all-pairs; centrality is estimated by sampling only T simple k-paths (avoiding the cost of exact betweenness); and the expensive structure search is paid per small subgraph 𝒲_ℓ rather than over all variables, with the merge reconciling shared separators. It pays off when a few high-centrality nodes genuinely break the skeleton into small pieces; if no good separators exist (one giant component), the gain over learning on the whole graph disappears.",
  strengths: [
    "Decomposes a global learning problem into small local pieces, so any base BN learner can scale to larger graphs.",
    "MIC-based screening captures general, possibly nonlinear, associations between discrete and continuous variables, not just linear/partial-correlation ones.",
    "Cheap node-centrality estimate via random simple k-paths avoids computing exact betweenness, and learner-agnostic merging makes it flexible."
  ],
  limitations: [
    "No formal guarantees (Remark 35): it does not prove the skeleton is a valid independence graph, so d-separation reasoning need not hold, nor that the merged DAG is globally consistent.",
    "Quality hinges on the skeleton and the heuristic separators — a missed true edge or a poor split cannot be repaired by local learning or merging.",
    "If the graph has no small set of high-centrality separators, decomposition gives little benefit and the method reduces to learning on (nearly) the whole graph."
  ],
  notes: "LocalDSLA (Dai et al. [137]) follows the same draft–refine, decompose-solve-merge pattern as ECOS: build an undirected sketch, partition it using local topology, learn a directed structure inside each piece, and reconcile overlapping subgraphs into one DAG. The key contrast with ECOS is node-based vs edge-based decomposition (k-path node centrality of separators vs edge-betweenness cutset) and heuristic local learning with any base learner vs exact COS-style search with an optimality guarantee. Related decomposition methods in §5.16 (Li et al., Chang et al.) share the sketch-then-local-learn idea, e.g. ranking nodes by k-path centrality and reconciling orientation conflicts when subgraphs overlap.",
  figureRefs: "Paper §5.16 (pp.365-368): Algorithm 107 (Local-DSLA: MIC screen, double α_MIC prune, CI/likelihood-ratio thinning, decompose by removing top-central nodes, local learning, merge); Recall 98 (mutual information), Recall 99 (MIC); Def 51 (simple k-path), Def 52 (k-path node centrality Ĉ_k); Example 115 (estimating centrality from sampled paths); Fig.230 (k-path node-centrality heuristic — 230a random k-paths, 230b high-centrality nodes A,B as good separators); Remark 35 (empirical scalability, no formal d-separation / consistency guarantees). ECOS background: §5.8 (pp.343-348), edge-betweenness cutset."
};
