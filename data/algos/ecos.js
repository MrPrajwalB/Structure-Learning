/* ECOS — Extended Constrained Optimal Search. Grounded in §5.8 (pp.343-348),
   which builds on COS (§5.7, pp.343-344). Method due to Kojima et al. [342].
   Key extension over COS: DECOMPOSE the super-structure into clusters (components
   left after removing a small cutset), solve each cluster's optimal sub-DAG EXACTLY
   under cut-edge forbiddances, then MERGE the clusters at the cut edges keeping the
   acyclic, highest-scoring global combination. High-level pseudocode = Algorithm 101;
   partition/merge = Fig.216; cluster solve forbiddances = Fig.217; merge = Fig.218. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["ecos"] = {
  name: "ECOS (Extended Constrained Optimal Search)",
  oneLiner: "An exact score-based method that takes a sparse super-structure restricting which edges are allowed, cuts it into a few smaller clusters, solves the provably best sub-network inside each cluster, and then stitches the clusters back together along the cut edges — so an exact optimum can be found on networks too large for plain exact search.",
  basedOnText: "ECOS extends COS (Constrained Optimal Search). COS already restricts the search to edges allowed by an undirected <i>super-structure</i> H and finds the globally optimal DAG inside it. ECOS goes further: it <b>decomposes</b> the super-structure into clusters, solves each cluster <b>exactly and independently</b>, and <b>merges</b> the cluster solutions consistently across the cut — a decompose-solve-merge wrapper that lets exact learning reach larger problems than COS alone.",

  assumptions: [
    "<b>Reliable super-structure H</b> — an undirected graph (from a fast skeleton learner, e.g. a constraint-based pre-pass) that contains every true edge as an adjacency. The optimal DAG is searched only among edges of H, so a missed adjacency cannot be recovered.",
    "<b>Decomposable score</b> — the network score is a sum of per-node family scores score(X | parents). This is what lets each cluster be scored on its own and the cluster scores be added up.",
    "<b>H decomposes well</b> — H must split into clusters by removing only a <i>small</i> cutset of edges. The fewer the cut edges, the fewer joint orientation assignments ECOS must enumerate, and the more it gains over COS.",
    "<b>Modest cluster size</b> — each cluster is still solved by exact (exponential) search, so individual clusters must stay small enough for an exact solver, even if the whole network is large."
  ],
  input: "A dataset 𝒟 over variables V, an undirected super-structure H restricting allowed adjacencies, and a decomposable family-score function score(X | parents).",
  output: "A single <b>globally optimal DAG</b> G* consistent with H — the highest-scoring acyclic network whose edges all lie in the super-structure (an exact optimum, not a local one).",

  idea: [
    "Plain exact search is too expensive on many variables. COS makes it cheaper by only allowing edges that appear in a sparse undirected super-structure H, so it never considers a parent that H rules out. But COS still solves the whole constrained problem as one piece.",
    "ECOS's insight: a sparse H usually has a few 'bridge' edges that, if cut, break it into nearly-independent <b>clusters</b>. Pick a small <b>cutset</b> E⁻ of edges (the paper suggests choosing high edge-betweenness edges — the bridges that the most shortest paths cross). Removing E⁻ leaves connected <b>components</b> of H; those components are the clusters {C}.",
    "<b>Decompose → solve each cluster exactly → merge.</b> The cut edges are the only places clusters interact. ECOS fixes a direction assignment δ for every cut edge, which tells each cluster which of its boundary nodes have an incoming cross-cluster arrow (V_in) and which have an outgoing one (V_out). With δ fixed, each cluster becomes a self-contained exact problem: find the best sub-DAG inside the cluster that respects those boundary <b>forbiddances</b> (e.g. an external arrow into a node may forbid certain internal orientations to avoid cycles).",
    "Each cluster is solved with COS-style exact dynamic programming, and — crucially — solutions are cached and reused: a sub-DAG already computed that also satisfies extra forbiddances can be reused, and dominated (provably worse) entries are discarded. Because clusters are solved independently for a given δ, the per-cluster work is far smaller than solving all of V at once.",
    "<b>Merge.</b> For each cut-edge assignment δ, ECOS combines one optimal sub-DAG per cluster, joining them along the cut edges, and keeps the combination only if the global graph is <b>acyclic</b> (a cycle could sneak in through several cut edges even though each cluster is acyclic). The total score is the sum of the cluster scores. Sweeping over all δ and taking the best acyclic merge yields the provably globally optimal DAG — exactly what COS would have returned, but obtained piece by piece."
  ],

  steps: [
    "<b>Precompute local scores.</b> For each variable X, compute the best parent subset Fp(X, Z) and its score Fs(X, Z) drawn from candidate parents Z ⊆ neighbours of X in H, and cache them. (Optionally shrink small leaf blocks of the super-structure to simplify it first.)",
    "<b>Choose a small cutset E⁻ ⊆ E(H).</b> Score edges by <i>betweenness</i> (how many shortest paths cross each edge) and select a small set of high-betweenness 'bridge' edges. Removing them yields the clusters {C} = the connected components of (V, E(H) ∖ E⁻).",
    "<b>Enumerate cut-edge orientations.</b> For each assignment δ of directions to the cut edges in E⁻: this fixes, for every cluster, the boundary sets V_in(C) (nodes with an incoming cross-cluster arrow) and V_out(C) (nodes with an outgoing one).",
    "<b>Solve each cluster exactly.</b> For each cluster C, run COS-style exact DP to find its best sub-DAG that respects the cut-edge <b>forbiddance</b> implied by δ (a forbidden orientation V ↛ U on boundary nodes), with pruning. Store the result in the cluster's solution table S_{C,δ}.",
    "<b>Reuse and prune.</b> If a sub-DAG already computed for this cluster also satisfies the new forbiddances, reuse it instead of recomputing; discard dominated entries (those that are no better than another already kept) so each table stays small.",
    "<b>Merge the clusters.</b> While more than one cluster remains, repeatedly pick a pair of clusters joined by cut edges and form their acyclic, non-dominated union — combining the boundary nodes shared across the cut and keeping only combinations that stay acyclic. Record the merged sub-DAG and its summed score.",
    "<b>Return the best.</b> Across all cut-edge assignments δ, return the merged DAG with the maximum total score — the globally optimal G* consistent with the super-structure H."
  ],

  keyConcepts: [
    { term: "Super-structure H", def: "An undirected graph restricting which adjacencies are even allowed in the result. ECOS (like COS) only searches DAGs whose edges lie in H, which shrinks the search dramatically." },
    { term: "Cutset E⁻", def: "A small set of super-structure edges whose removal disconnects H into clusters. ECOS picks high edge-betweenness 'bridge' edges so the cutset stays small." },
    { term: "Cluster / component {C}", def: "A connected component of the super-structure after the cutset is removed. Each cluster is solved exactly and on its own — this decomposition is ECOS's core extension over COS." },
    { term: "Cut-edge assignment δ", def: "A choice of direction for every cut edge. Fixing δ tells each cluster which boundary nodes receive (V_in) or send (V_out) a cross-cluster arrow, turning each cluster into a self-contained exact problem." },
    { term: "Forbiddance (V ↛ U)", def: "A constraint on a boundary node's internal orientations forced by an external cut-edge arrow, used so that combining clusters cannot create a cycle. Each cluster is solved subject to its forbiddances." },
    { term: "Merge (acyclic union)", def: "Joining cluster solutions along the cut edges, keeping only acyclic, non-dominated combinations and summing their scores. The best merge over all δ is the global optimum." }
  ],

  animation: {
    title: "ECOS on a faithful 6-node example whose super-structure splits into 2 clusters via one cut edge (illustrative; cf. Algorithm 101, Figs.216-218).",
    nodes: [
      { id: "A", x: 0.10, y: 0.20 },
      { id: "B", x: 0.10, y: 0.80 },
      { id: "C", x: 0.38, y: 0.50 },
      { id: "D", x: 0.62, y: 0.50 },
      { id: "E", x: 0.90, y: 0.20 },
      { id: "F", x: 0.90, y: 0.80 }
    ],
    edges: [
      { from: "A", to: "C", type: "undirected" },
      { from: "B", to: "C", type: "undirected" },
      { from: "A", to: "B", type: "undirected" },
      { from: "C", to: "D", type: "undirected" },
      { from: "D", to: "E", type: "undirected" },
      { from: "D", to: "F", type: "undirected" },
      { from: "E", to: "F", type: "undirected" }
    ],
    steps: [
      { caption: "<b>Super-structure H.</b> Start from the undirected super-structure on {A,B,C,D,E,F}: it allows only these adjacencies. ECOS will find the best DAG whose edges all lie inside H — but without solving all six variables at once.", ops: [{ op: "badge", text: "input: super-structure H", kind: "info" }, { op: "highlightNodes", ids: ["A","B","C","D","E","F"], cls: "hl" }] },
      { caption: "<b>Precompute local scores.</b> For each node, cache the best parent subset and its score using only candidate parents allowed by H — e.g. Fp(D,·), Fs(D,·) drawn from {C,E,F}. These are reused throughout.", ops: [{ op: "score", text: "cache Fp(X,Z), Fs(X,Z) for all X, Z ⊆ neighbours in H" }] },
      { caption: "<b>Find the cutset E⁻.</b> Rank edges by betweenness — how many shortest paths cross them. The edge C–D is the bridge between the two halves (highest betweenness), so it becomes the single cut edge.", ops: [{ op: "highlightEdges", edges: [["C","D"]], cls: "cut" }, { op: "badge", text: "decompose · cutset E⁻ = {C–D}", kind: "info" }] },
      { caption: "<b>Decompose into clusters.</b> Removing C–D splits H into two connected components: cluster C₁ = {A,B,C} and cluster C₂ = {D,E,F}. Each will be solved exactly on its own.", ops: [{ op: "set", name: "Cluster C1", items: ["A","B","C"] }, { op: "set", name: "Cluster C2", items: ["D","E","F"] }, { op: "highlightNodes", ids: ["A","B","C"], cls: "add" }, { op: "badge", text: "2 clusters from 1 cut", kind: "good" }] },
      { caption: "<b>Fix a cut-edge orientation δ.</b> Try directing the cut edge C → D. This makes D a boundary node with an incoming cross-cluster arrow: D ∈ V_in(C₂), C ∈ V_out(C₁). Each cluster is now a self-contained exact problem under this forbiddance.", ops: [{ op: "highlightEdges", edges: [["C","D"]], cls: "cut" }, { op: "badge", text: "δ: orient cut edge C → D", kind: "info" }, { op: "highlightNodes", ids: ["C","D"], cls: "hl" }] },
      { caption: "<b>Solve cluster C₁ = {A,B,C} exactly.</b> Run COS-style exact DP over only these three nodes (parents restricted to H). The best sub-DAG is A → C, B → C with A → B. C is the cut node sending the arrow out, so its internal orientations respect the forbiddance.", ops: [{ op: "highlightNodes", ids: ["A","B","C"], cls: "add" }, { op: "addEdge", from: "A", to: "C", type: "directed" }, { op: "orient", from: "A", to: "C", type: "directed" }, { op: "addEdge", from: "B", to: "C", type: "directed" }, { op: "orient", from: "B", to: "C", type: "directed" }, { op: "addEdge", from: "A", to: "B", type: "directed" }, { op: "orient", from: "A", to: "B", type: "directed" }, { op: "score", text: "best S_{C1,δ} score = -41.2" }, { op: "badge", text: "solve C1 exactly", kind: "good" }] },
      { caption: "<b>Solve cluster C₂ = {D,E,F} exactly.</b> Independently, exact DP over {D,E,F} finds the best sub-DAG D → E, D → F, E → F. D must respect the incoming cut arrow (D ∈ V_in), forbidding any internal orientation that would later close a cycle through the cut.", ops: [{ op: "highlightNodes", ids: ["D","E","F"], cls: "add" }, { op: "addEdge", from: "D", to: "E", type: "directed" }, { op: "orient", from: "D", to: "E", type: "directed" }, { op: "addEdge", from: "D", to: "F", type: "directed" }, { op: "orient", from: "D", to: "F", type: "directed" }, { op: "addEdge", from: "E", to: "F", type: "directed" }, { op: "orient", from: "E", to: "F", type: "directed" }, { op: "score", text: "best S_{C2,δ} score = -38.7" }, { op: "badge", text: "solve C2 exactly", kind: "good" }] },
      { caption: "<b>Reuse & prune.</b> Cluster sub-DAGs are cached: any already-computed solution that also satisfies the current forbiddances is reused instead of recomputed, and dominated (provably-worse) entries are discarded — keeping each cluster table small.", ops: [{ op: "badge", text: "reuse cached sub-DAGs · drop dominated", kind: "info" }] },
      { caption: "<b>Merge along the cut edge.</b> Add back the oriented cut edge C → D to join the two cluster solutions. Check the global graph is ACYCLIC — here the only path between halves runs C → D, so no cycle is created. Total score = sum of cluster scores.", ops: [{ op: "addEdge", from: "C", to: "D", type: "directed" }, { op: "orient", from: "C", to: "D", type: "directed" }, { op: "highlightEdges", edges: [["C","D"]], cls: "cut" }, { op: "score", text: "merged score = -41.2 + -38.7 + score(D|C) = -82.6 (acyclic ✓)" }, { op: "badge", text: "merge clusters (acyclic union)", kind: "good" }] },
      { caption: "<b>Try the other cut orientation δ.</b> ECOS also evaluates D → C: re-solve each cluster under the flipped forbiddance and merge again. Its best acyclic merge scores -85.9 — worse than C → D — so it is discarded.", ops: [{ op: "badge", text: "δ: cut edge D → C → merged score -85.9 (rejected)", kind: "info" }, { op: "highlightEdges", edges: [["C","D"]], cls: "cut" }] },
      { caption: "<b>Return the best over all δ.</b> The winning assignment is C → D. Its merged DAG is the provably globally optimal network consistent with the super-structure — found by solving two small clusters exactly and stitching them together rather than searching all six variables jointly.", ops: [{ op: "highlightNodes", ids: ["A","B","C","D","E","F"], cls: "good" }, { op: "badge", text: "optimal G* returned (exact)", kind: "good" }] }
    ]
  },

  complexity: "Exact, so still exponential in the worst case — but the cost is paid per cluster, not over all variables. Work scales with the number of cut-edge assignments (2 per cut edge, hence exponential in the cutset size) times the exact-solve cost of the largest cluster, plus the merge over clusters. ECOS therefore wins over COS exactly when the super-structure splits into clusters by removing only a few high-betweenness bridge edges; a poor decomposition (large cutset or one giant cluster) reduces it to plain COS.",
  strengths: [
    "Returns the provably globally optimal DAG consistent with the super-structure — no local optima.",
    "Decomposes the problem so exact learning can reach networks too large for monolithic exact search (COS).",
    "Cluster solutions are cached, reused across cut-edge assignments, and pruned by dominance, avoiding repeated work."
  ],
  limitations: [
    "Only as good as the super-structure: any true adjacency missing from H can never appear in the output.",
    "Gains vanish if H does not decompose well — a large cutset means exponentially many cut-edge assignments, and a single large cluster is still an exact (exponential) solve.",
    "Requires a decomposable score and the up-front cost of precomputing many local family scores."
  ],
  notes: "ECOS is the decomposition-and-merge extension of COS due to Kojima et al. [342]: choose a cluster boundary, solve sub-problems with directions and merge cluster-dominated sub-solutions, all while guaranteeing global optimality under the imposed constraints. The intermediate construction during a cluster solve uses COS-style dynamic programming and must avoid creating an internal directed path that would violate the active cut-edge forbiddances. The paper frames ECOS as a general decompose-then-merge wrapper around an exact constrained solver; related work pushes the same idea further (Gao & Wei, ancestral-constraint and restricted-candidate variants).",
  figureRefs: "Paper §5.8 (pp.343-348): Algorithm 101 (ECOS high-level, with cutset choice, per-δ cluster solve, and the merge loop); Fig.216 (partition the super-structure by removing the cutset, and acyclicity at a cluster boundary); Fig.217 (forbiddance/interface sets V_in, V_out for a cluster solve); Fig.218 (merging two clusters by enumerating cut-edge orientations and keeping acyclic unions). COS background: §5.7 (pp.343-344), edge-betweenness cutset c(e)."
};
