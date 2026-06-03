/* COS — Constrained Optimal Search. Grounded in §5.5 (pp.333-334):
   the algorithm description (OptOrd recurrence (51); constrained recurrences
   (52)-(53)); Theorem 49 (connected-subset decomposition); Algorithm 97 (COS
   pseudocode); Example 100 (two-component super-structure {C,M},{D} worked with
   BIC family scores, Fig.211a/b). Hybrid method due to Perrier et al. [532],
   built on OptOrd (exact DP) + an MMPC-style super-structure. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["cos"] = {
  name: "Constrained Optimal Search (COS)",
  oneLiner: "First build an undirected 'super-structure' of all edges that are even allowed (using an MMPC-style neighbour search), then run an exact optimal-search dynamic program that is forbidden from using any edge outside it — guaranteeing the best-scoring DAG within the allowed edges, but far faster than unrestricted exact search.",
  basedOnText: "COS is a <i>hybrid</i> exact method: it combines a constraint-based first phase (an MMPC-style undirected super-structure of permissible edges) with a score-based second phase (the OptOrd exact dynamic program), restricting the DP so it only ever considers parents that the super-structure allows. The smaller the super-structure, the more tractable the exact search — while optimality is still guaranteed within it.",

  assumptions: [
    "<b>Decomposable score</b> — the network score is a sum of per-node family scores FamScore(X, parents) (e.g. BIC). This is what lets the exact DP split the problem leaf-by-leaf, exactly as in OptOrd.",
    "<b>A trustworthy super-structure</b> — the undirected graph S of allowed edges should contain the skeleton of an optimal DAG. To play safe, S is built with a <i>liberal</i> significance level so edge deletions are conservative (it errs towards keeping edges).",
    "<b>Faithfulness + reliable CI tests</b> for the constraint phase that builds S (the same backdrop as MMPC), so true neighbours are not wrongly dropped.",
    "<b>Modest density</b> — COS is exact, so its cost still grows with the number of variables; its practicality comes from S being sparse enough that each node has few allowed parents."
  ],
  input: "A dataset 𝒟 over variables V, a decomposable family-score FamScore(X, U | 𝒟), and a CI test (with a liberal level α) used to build the super-structure.",
  output: "A single <b>globally optimal DAG</b> within the super-structure — the highest-scoring DAG whose skeleton is a subgraph of S. If S contains the optimal skeleton, this is the true global optimum.",

  idea: [
    "Exact optimal search (OptOrd) is guaranteed to return the single highest-scoring DAG, but it pays for that guarantee: it considers, for every node, <i>every</i> possible parent set, and its work grows like 2<sup>n</sup>. That becomes infeasible as the number of variables grows.",
    "COS's insight is that most of those candidate parent sets are hopeless anyway — they use edges that obviously should not exist. So before the exact search begins, COS draws a <b>super-structure</b> S: an undirected graph listing the only edges that will ever be allowed. Any edge missing from S is simply off-limits, for good.",
    "<b>How S is built.</b> COS runs an MMPC-style parents-and-children discovery for each node to find its likely direct neighbours, then <i>symmetrizes</i>: an undirected edge {X,Y} is added to S whenever X is in PC(Y) <b>or</b> Y is in PC(X). To avoid throwing away real edges, a liberal significance level is used so deletions are conservative — it would rather keep a doubtful edge than lose a true one.",
    "<b>Constrained exact search.</b> Now the same OptOrd dynamic program runs, but with one change: when it chooses parents for a node X, the candidates are restricted to N<sub>S</sub>(X), X's neighbours <i>in the super-structure</i>. Every parent set the DP considers is therefore a subset of allowed edges. Because each node has far fewer allowed parents, there are far fewer parent sets to score, so the exact search runs much faster — yet it is still exact: it returns the best DAG that lives inside S.",
    "<b>A bonus from sparsity (Theorem 49).</b> If a set of variables splits into disconnected pieces within S, the best score for the whole set is just the sum of the best scores of those pieces. So the DP only has to be solved on <i>connected</i> chunks of S and the answers added up — disconnected parts are handled for free. This is what makes COS scale on sparse super-structures.",
    "The trade-off: COS is optimal <i>within</i> S. If S accidentally omits a needed edge, COS returns the best DAG it can build inside S (its skeleton ⊆ S); an optional short hill-climbing post-processing (COS+) can then add back edges missing from an overly sparse S."
  ],

  steps: [
    "<b>Build the super-structure S.</b> Run an MMPC-style parents-and-children discovery for every variable to find its candidate direct neighbours. Use a liberal significance level so edge deletions stay conservative (better to keep a doubtful edge than lose a true one).",
    "<b>Symmetrize.</b> Add the undirected edge {X,Y} to S whenever X ∈ PC(Y) <i>or</i> Y ∈ PC(X). S is now the fixed undirected graph of all permissible edges; it is learned once and never changes during the search.",
    "<b>Precompute constrained family scores.</b> For each node X, compute FamScore(X, U) only for parent sets U ⊆ N<sub>S</sub>(X) — its neighbours in S. Parent sets that use a forbidden edge are never even formed, which is the source of the speed-up.",
    "<b>Set up the constrained DP.</b> Define the restricted recurrences: the best constrained family score F<sub>S</sub>(X, A) maximises FamScore(X, U) over U ⊆ A ∩ N<sub>S</sub>(X); and the best subset score M<sub>S</sub>(A) peels off one sink (leaf) X and adds M<sub>S</sub>(A∖{X}), with M<sub>S</sub>(∅)=0.",
    "<b>Exploit disconnection (Theorem 49).</b> For any variable set A, look at the subgraph S[A] it induces. If S[A] splits into connected components A₁,…,A_ℓ, then M<sub>S</sub>(A) = Σ M<sub>S</sub>(A_j) — disconnected pieces are scored independently and summed, so the DP only does real work on connected chunks.",
    "<b>Run the constrained exact DP.</b> Fill M<sub>S</sub>(A) for connected subsets A from small to large, each time trying every member as the sink with its best allowed parents and reusing the stored M<sub>S</sub> of the rest, until M<sub>S</sub>(V) — the optimal score of the whole network within S — is reached.",
    "<b>Backtrack to recover the DAG.</b> From M<sub>S</sub>(V), read off the optimal elimination order w* (the sequence of sinks removed). For each variable X, its optimal parents are Pred<sub>w*</sub>(X) ∩ N<sub>S</sub>(X) — the earlier variables that are also allowed neighbours. These families form the optimal DAG within S.",
    "<b>(Optional) COS+ post-processing.</b> If S may have been too sparse, run a short hill climb to recover edges missing from an overly aggressive super-structure."
  ],

  keyConcepts: [
    { term: "Super-structure S", def: "An undirected graph fixed before the search that lists every edge the DAG is allowed to use. Any edge not in S is forbidden. Built once via MMPC-style neighbour discovery, then symmetrized." },
    { term: "Symmetrization", def: "The rule that puts edge {X,Y} into S when X ∈ PC(Y) OR Y ∈ PC(X). The 'or' is conservative — it keeps an edge if either node's neighbour search found the other." },
    { term: "Liberal significance level", def: "A loose threshold for the CI tests that build S, so edges are deleted cautiously. This protects against dropping a true edge, which would put a ceiling on COS's optimality." },
    { term: "Allowed parents N_S(X)", def: "The neighbours of X in the super-structure — the only variables that may ever be chosen as parents of X. Restricting candidate parents to this small set is what makes the exact search fast." },
    { term: "Constrained recurrence M_S(A)", def: "The best score over the variable set A using only edges in S: peel off one sink X with its best allowed parents and add the stored best score of the rest, with M_S(∅)=0." },
    { term: "Connected-subset decomposition (Theorem 49)", def: "If S[A] (the part of S over A) breaks into disconnected components, the best score of A is the sum of the best scores of those components — so the DP only works on connected pieces." },
    { term: "Optimal within S", def: "COS returns the highest-scoring DAG whose skeleton is a subgraph of S. If S contains an optimal skeleton this equals the true global optimum; otherwise COS+ hill-climbing can repair an overly sparse S." }
  ],

  animation: {
    title: "COS on a faithful five-variable example {A,B,C,M,D}: build the super-structure, then run exact search restricted to it. (Illustrative; the BIC numbers and the {C,M}/{D} component split echo the paper's Example 100, Fig.211.)",
    nodes: [
      { id: "A", x: 0.10, y: 0.22 },
      { id: "B", x: 0.10, y: 0.78 },
      { id: "C", x: 0.45, y: 0.30 },
      { id: "M", x: 0.45, y: 0.80 },
      { id: "D", x: 0.88, y: 0.50 }
    ],
    edges: [],
    steps: [
      { caption: "<b>Goal.</b> Find the single best-scoring DAG over {A,B,C,M,D}. Unrestricted exact search would weigh every possible parent set (cost ≈2ⁿ). COS first limits which edges are even allowed, then runs exact search only inside that limit.", ops: [{ op: "badge", text: "hybrid: MMPC + exact OptOrd", kind: "info" }] },
      { caption: "<b>Phase 1 — build the super-structure S.</b> Run an MMPC-style parents-and-children search per node to find likely neighbours. A liberal significance level keeps edge deletions conservative — better to keep a doubtful edge than lose a real one.", ops: [{ op: "highlightNodes", ids: ["A","B","C","M","D"], cls: "hl" }, { op: "badge", text: "constraint phase (liberal α)", kind: "info" }] },
      { caption: "<b>Symmetrize → add allowed edge A–C.</b> A appears in PC(C) (or C in PC(A)), so the undirected edge {A,C} enters S. This edge is now permitted for the exact search.", ops: [{ op: "addEdge", from: "A", to: "C", type: "undirected" }, { op: "highlightEdges", edges: [["A","C"]], cls: "good" }, { op: "badge", text: "allowed edge {A,C}", kind: "good" }, { op: "set", name: "Super-structure", items: ["A–C"] }] },
      { caption: "<b>Add allowed edges B–C and C–M.</b> Both pairs survive the neighbour search, so {B,C} and {C,M} join S. C is shaping up as a hub of allowed edges.", ops: [{ op: "addEdge", from: "B", to: "C", type: "undirected" }, { op: "addEdge", from: "C", to: "M", type: "undirected" }, { op: "highlightEdges", edges: [["B","C"],["C","M"]], cls: "good" }, { op: "badge", text: "allowed edges {B,C},{C,M}", kind: "good" }, { op: "set", name: "Super-structure", items: ["A–C","B–C","C–M"] }] },
      { caption: "<b>D is isolated in S.</b> No conditioning ever kept an edge incident to D, so D gets no allowed edges. The super-structure is now fixed: S = { A–C, B–C, C–M } and D on its own. Every edge NOT in S is forbidden forever.", ops: [{ op: "highlightNodes", ids: ["D"], cls: "pick" }, { op: "badge", text: "S fixed · D isolated", kind: "info" }, { op: "set", name: "Super-structure", items: ["A–C","B–C","C–M","D (isolated)"] }] },
      { caption: "<b>Phase 2 — constrained exact search.</b> Now OptOrd's dynamic program runs, but parents of each node X are restricted to its allowed neighbours N_S(X): N_S(A)={C}, N_S(B)={C}, N_S(M)={C}, N_S(C)={A,B,M}, N_S(D)=∅. Far fewer parent sets to score.", ops: [{ op: "badge", text: "exact DP restricted to N_S(X)", kind: "info" }, { op: "score", text: "candidate parents only from S — not all of V" }] },
      { caption: "<b>Theorem 49 — split by connectivity.</b> Inside S the variables fall into two disconnected pieces: the connected component {A,B,C,M} and the lone {D}. The best total score is just the sum of the two pieces' best scores — D is handled for free.", ops: [{ op: "highlightNodes", ids: ["A","B","C","M"], cls: "hl" }, { op: "score", text: "M_S(V) = M_S({A,B,C,M}) + M_S({D})" }, { op: "badge", text: "connected-subset decomposition", kind: "good" }] },
      { caption: "<b>Score the lone component {D}.</b> D has no allowed parents (N_S(D)=∅), so its only family is the empty one. M_S({D}) = FamScore(D,∅) = −9.4. Nothing to search here.", ops: [{ op: "highlightNodes", ids: ["D"], cls: "leaf" }, { op: "score", text: "M_S({D}) = FamScore(D,∅) = −9.4" }] },
      { caption: "<b>Constrained DP on {A,B,C,M}: choose best allowed parents.</b> For each node only N_S options are tried — e.g. compare F_S(C,·) using parents from {A,B,M}, and F_S(A,·), F_S(B,·), F_S(M,·) each using only C. The DP peels one sink at a time, reusing stored sub-scores.", ops: [{ op: "highlightNodes", ids: ["A","B","C","M"], cls: "leaf" }, { op: "score", text: "F_S(C,{A,B,M})=−6.3 · F_S(A,{C})=−7.2 · F_S(B,{C}) · F_S(M,{C})" }, { op: "badge", text: "best parents ⊆ N_S(X)", kind: "info" }] },
      { caption: "<b>Optimal peel found.</b> Within S the best families are: C takes parents {A,B,M} (the hub), while A, B, M each take only C as parent. The DP reaches M_S(V) — the proven-optimal score within the super-structure.", ops: [{ op: "score", text: "M_S(V) = M_S({A,B,C,M}) + M_S({D}) — optimum within S" }, { op: "badge", text: "M_S(V) reached", kind: "good" }] },
      { caption: "<b>Backtrack — recover the DAG.</b> Read the optimal elimination order w*; each node's parents are Pred_w*(X) ∩ N_S(X). Orient the chosen allowed edges: A → C, B → C, M → C. Every arrow uses an edge that was in S.", ops: [{ op: "orient", from: "A", to: "C", type: "directed" }, { op: "orient", from: "B", to: "C", type: "directed" }, { op: "orient", from: "M", to: "C", type: "directed" }, { op: "highlightEdges", edges: [["A","C"],["B","C"],["M","C"]], cls: "good" }, { op: "badge", text: "parents = Pred_w*(X) ∩ N_S(X)", kind: "info" }] },
      { caption: "<b>Result — optimal DAG within S.</b> A → C ← B, M → C, and D isolated. Its skeleton is a subgraph of the super-structure, and it is the provably highest-scoring such DAG — same optimum exact search would find, but reached far faster. (If S were too sparse, a short COS+ hill climb could add missing edges.)", ops: [{ op: "highlightNodes", ids: ["A","B","C","M","D"], cls: "good" }, { op: "badge", text: "optimal DAG within S returned", kind: "good" }] }
    ]
  },

  complexity: "Still exact, so worst-case it inherits OptOrd's exponential blow-up — but in practice far cheaper, because each node's candidate parents are limited to its super-structure neighbours N_S(X). The sparser S is, the fewer family scores must be computed and the smaller the DP. Theorem 49 lets the DP run only on connected components of S, summing disconnected pieces for free, so the effective cost is governed by the size of the largest connected piece of S rather than by n directly. Building S adds an upfront MMPC-style constraint phase.",
  strengths: [
    "Returns the globally optimal DAG <i>within</i> the super-structure — and the true global optimum when S contains an optimal skeleton.",
    "Dramatically faster than unrestricted exact search because forbidden parent sets are never even formed; sparse super-structures make exact learning feasible at larger scales.",
    "Theorem 49 (connected-subset decomposition) lets the DP solve disconnected pieces separately and add them, a big saving on sparse problems.",
    "Cleanly hybrid: reuses a proven constraint method (MMPC-style discovery) to seed a proven exact method (OptOrd)."
  ],
  limitations: [
    "Optimality is only <i>within</i> S: if the super-structure wrongly omits a needed edge, COS cannot recover it (it returns the best DAG with skeleton ⊆ S) — hence the conservative, liberal-α construction and the optional COS+ hill-climb repair.",
    "Inherits exact search's exponential worst case; a dense super-structure (large connected components) erases the speed-up.",
    "Quality depends on the constraint phase building S correctly, which relies on faithfulness and reliable CI tests.",
    "Requires a decomposable score and the upfront cost of precomputing the (now fewer) local family scores."
  ],
  notes: "COS (Constrained Optimal Search) is due to Perrier et al. [532]. It is the hybrid pairing of OptOrd (the exact dynamic-programming optimum, §4.16) with an MMPC-style super-structure (§4.11): the constraint phase fixes which edges are allowed, and the exact phase finds the best DAG using only those edges. The recurrences (52)-(53) are OptOrd's recurrence (51) with parent sets restricted to N_S(X); Theorem 49 adds the connected-subset speed-up. COS+ is a hill-climbing post-processing step that recovers edges missing from an overly sparse super-structure.",
  figureRefs: "Paper §5.5 (pp.333-334): the algorithm description and recurrences (51) OptOrd, (52)-(53) constrained F_S/M_S; Theorem 49 (connected-subset decomposition); Algorithm 97 (COS pseudocode); Example 100 (two-component super-structure {C,M},{D} worked with BIC family scores, Fig.211a/b)."
};
