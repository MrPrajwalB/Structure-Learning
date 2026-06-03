/* BAP — Bow-free Acyclic Path diagrams. Grounded in §4.41 (pp.201-206).
   Model class = bow-free acyclic path diagram: directed edges (B) + bidirected
   edges (Ω) for latent confounding, directed part acyclic, NO "bow" (no pair with
   both a directed and a bidirected edge). Linear-Gaussian SEM X = BX + N, N~N(0,Ω).
   Score-based greedy search = Algorithm 51 (Greedy BAP score search, p.206); each
   candidate is fitted by RICF = Algorithm 50 (RICF for a fixed BAP, p.205) and
   scored by the Gaussian (log-)likelihood / a penalised score. Worked example =
   Example 57 (first RICF sweep in a three-node BAP, p.203): X1→X2→X3 with X1↔X3.
   Related work (4.41.2): Wang & Drton (BANG), Bhattacharya et al. (ADMG smooth opt). */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["bap"] = {
  name: "Bow-free Acyclic Path diagrams (BAP)",
  oneLiner: "A score-based learner for data with hidden confounders: it searches over graphs that mix direct-cause arrows (→) with latent-confounder arrows (↔), greedily adding/removing/flipping edges to maximise a Gaussian score, while never allowing a 'bow' — a pair joined by BOTH a direct cause and a hidden common cause — and keeping the arrow part acyclic.",
  basedOnText: "BAP fits a linear-Gaussian structural equation model X = BX + N with correlated noise N ~ N(0,Ω). The directed coefficients B encode direct linear effects; the off-diagonal entries of Ω encode error covariances that stand in for unobserved common causes. The model class is restricted to bow-free acyclic path diagrams so that the parameters are identifiable, and the best such diagram is found by a greedy score search.",

  assumptions: [
    "<b>Linear-Gaussian SEM</b> — each variable is a linear function of its direct causes plus Gaussian noise: X = BX + N, with N ~ N(0,Ω). Effects are linear and errors jointly Gaussian.",
    "<b>Latent confounding allowed</b> — unobserved common causes are NOT forbidden; they are absorbed into correlated noise and drawn as bidirected edges (off-diagonal Ω). (This relaxes the causal-sufficiency assumption that DAG learners make.)",
    "<b>Directed part acyclic</b> — the → edges admit a topological ordering; B is strictly lower-triangular under that order (no directed cycles).",
    "<b>Bow-free constraint</b> — no ordered pair may have BOTH a directed edge and a bidirected edge between it: if i → j is present then ω_ij = 0. This is what makes the model identifiable.",
    "<b>Score is comparable across candidates</b> — a (penalised) Gaussian likelihood is used to rank competing diagrams."
  ],
  input: "A continuous dataset D over variables V (used through its covariance), a starting BAP G₀ (often the empty graph), and a score score(G | D) based on the Gaussian likelihood.",
  output: "A locally optimal <b>BAP</b>: a mixed graph with directed edges → (direct causes) and bidirected edges ↔ (latent common causes), whose directed part is acyclic and which contains no bow, together with the fitted coefficients (B,Ω).",

  idea: [
    "Most structure learners assume every common cause is observed (causal sufficiency). BAP drops that: it lets two variables share an <i>unobserved</i> common cause, modelled not by an arrow between them but by letting their noise terms be correlated. That correlated noise is drawn as a <b>bidirected edge</b> i ↔ j, while an ordinary cause is a <b>directed edge</b> i → j.",
    "So a BAP is a mixed graph with two kinds of edge. The directed part must be <b>acyclic</b> (the causes admit an ordering). The bidirected part is unrestricted in shape except for one crucial rule.",
    "<b>The bow-free rule.</b> A 'bow' is a pair of nodes connected by BOTH a directed edge and a bidirected edge at the same time (i → j AND i ↔ j). Bows are notoriously hard to identify — the data cannot tell apart 'direct effect' from 'shared hidden cause' when both are allowed on one pair. BAP therefore <b>forbids bows entirely</b>: every pair may have a → , or a ↔ , or neither, but never both. This restriction is exactly what buys identifiability of (B,Ω).",
    "Because the class is restricted and parametric, BAP is <b>score-based</b>, not test-based. Each candidate diagram is turned into a linear-Gaussian SEM X = BX + N (N ~ N(0,Ω)); the model is fitted by maximum likelihood and given a score (typically the Gaussian log-likelihood, penalised for the number of edges).",
    "The search is a <b>greedy hill-climb</b> (Algorithm 51). From a starting diagram it repeatedly proposes single-edge moves — add, delete, or change the type of one edge — that keep the graph bow-free and acyclic, scores each candidate, and takes the best one. It stops when no single move improves the score, returning a locally optimal BAP.",
    "Fitting each candidate is itself iterative: <b>RICF</b> (Residual Iterative Conditional Fitting, Algorithm 50) cycles through the nodes, updating the directed coefficients of one node and then its bidirected (error-covariance) entries, raising the likelihood until convergence."
  ],

  steps: [
    "<b>Initialise.</b> Start from G₀ — usually the empty graph (no edges), so B = 0 and Ω = I. Compute its score score(G₀ | D).",
    "<b>Propose neighbours.</b> Generate the candidate moves N(G): every single-edge change — <i>add</i> a directed or bidirected edge, <i>delete</i> an edge, or <i>change the type</i> of an existing edge (→ ↔). Only keep candidates that remain <b>bow-free</b> (no pair with both edge kinds) and whose directed part stays <b>acyclic</b>.",
    "<b>Fit each candidate with RICF (Algorithm 50).</b> For a fixed BAP H, cycle over the nodes: for node i, regress its residual on its parents to update the directed coefficients B, then update the bidirected error-covariances Ω with its 'spouses' (nodes joined by ↔). Repeat the sweep until the log-likelihood converges; symmetrise Ω.",
    "<b>Score each candidate.</b> Evaluate score(H | D) from the fitted (B,Ω) — the (penalised) Gaussian likelihood — for every legal neighbour H.",
    "<b>Take the best move.</b> Set G ← argmax over N(G)∪{G} of the score: keep the current graph if no neighbour beats it, otherwise move to the best-scoring neighbour.",
    "<b>Reject illegal moves.</b> Any proposed move that would create a bow (a pair with both → and ↔) or a directed cycle is discarded before scoring — it never enters the candidate set.",
    "<b>Repeat</b> the propose-fit-score-move loop until no single-edge move improves the score (G does not change).",
    "<b>Return</b> the locally optimal BAP G together with its fitted coefficients (B,Ω): directed edges as direct causes, bidirected edges as latent common causes."
  ],

  keyConcepts: [
    { term: "Path diagram / mixed graph", def: "A graph with two edge types: directed → for a direct causal effect and bidirected ↔ for a covariance between two error terms (a stand-in for an unobserved common cause)." },
    { term: "Directed edge → (matrix B)", def: "A direct linear effect of one variable on another. Collected in the coefficient matrix B; the directed part must be acyclic, so B is strictly lower-triangular under a topological order." },
    { term: "Bidirected edge ↔ (matrix Ω)", def: "Correlated noise between two variables, i.e. an off-diagonal entry of the error-covariance Ω. It represents a latent (hidden) common cause without naming it." },
    { term: "Bow", def: "A pair of nodes joined by BOTH a directed and a bidirected edge (i → j AND i ↔ j). Bows are not identifiable, so BAP forbids them — that is the defining 'bow-free' constraint." },
    { term: "Bow-free acyclic path diagram", def: "The model class: directed part acyclic, plus any bidirected edges, with no pair carrying both edge types. Restricting to this class makes the SEM parameters (B,Ω) identifiable." },
    { term: "Greedy score search (Alg. 51)", def: "Hill-climbing over BAPs: repeatedly apply the single-edge add/delete/flip move that most improves the Gaussian score while staying bow-free and acyclic, until no move helps." },
    { term: "RICF (Alg. 50)", def: "Residual Iterative Conditional Fitting — the inner routine that maximum-likelihood-fits a fixed BAP by cycling over nodes, updating directed coefficients (parents) then bidirected covariances (spouses) until the likelihood converges." }
  ],

  animation: {
    title: "Greedy BAP score search on a faithful 4-node example {1,2,3,4}. The directed/bidirected edge types and the bow-free rejection are the centerpiece (based on Algorithm 51; the latent confounder 1↔3 mirrors Example 57's three-node BAP).",
    nodes: [
      { id: "1", x: 0.10, y: 0.50 },
      { id: "2", x: 0.40, y: 0.20 },
      { id: "3", x: 0.70, y: 0.50 },
      { id: "4", x: 0.40, y: 0.80 }
    ],
    edges: [],
    steps: [
      { caption: "<b>Start empty.</b> Greedy BAP search begins from G₀ = the empty graph on {1,2,3,4}: no directed (→) and no bidirected (↔) edges, so B = 0 and Ω = I. We will add, delete and flip single edges to maximise a Gaussian score, always staying bow-free and acyclic.", ops: [{ op: "score", text: "score(G₀) = −58.4" }, { op: "badge", text: "G₀ = empty BAP", kind: "info" }] },
      { caption: "<b>Add a directed edge 1 → 2.</b> The best single-edge move is to add a direct cause 1 → 2. RICF fits the coefficient and the Gaussian score improves, so the move is accepted.", ops: [{ op: "addEdge", from: "1", to: "2", type: "directed" }, { op: "highlightEdges", edges: [["1", "2"]], cls: "add" }, { op: "score", text: "score = −51.2  (▲)" }, { op: "badge", text: "add → : accepted", kind: "good" }] },
      { caption: "<b>Add a directed edge 2 → 3.</b> Another direct cause raises the score. The directed part is still acyclic (1 → 2 → 3 has a valid ordering), so the move is legal and accepted.", ops: [{ op: "addEdge", from: "2", to: "3", type: "directed" }, { op: "highlightEdges", edges: [["2", "3"]], cls: "add" }, { op: "score", text: "score = −45.7  (▲)" }, { op: "badge", text: "add → : accepted", kind: "good" }] },
      { caption: "<b>Add a bidirected edge 1 ↔ 3 (latent confounder).</b> Variables 1 and 3 stay correlated beyond what 1 → 2 → 3 explains — a hidden common cause. We model it not with an arrow but with correlated noise, drawn as the bidirected edge 1 ↔ 3 (an off-diagonal entry of Ω). The score improves.", ops: [{ op: "addEdge", from: "1", to: "3", type: "bidirected" }, { op: "highlightEdges", edges: [["1", "3"]], cls: "add" }, { op: "score", text: "score = −40.9  (▲)" }, { op: "badge", text: "latent common cause: 1 ↔ 3", kind: "good" }] },
      { caption: "<b>Proposed move: add 1 → 3.</b> The search considers also putting a DIRECT cause 1 → 3 on top of the existing 1 ↔ 3. But that pair would then carry BOTH a directed and a bidirected edge — a 'bow'. Bows are not identifiable: the data cannot separate a direct effect from a shared hidden cause on the same pair.", ops: [{ op: "highlightNodes", ids: ["1", "3"], cls: "hl" }, { op: "highlightEdges", edges: [["1", "3"]], cls: "hl" }, { op: "badge", text: "candidate: add 1 → 3 ?", kind: "info" }] },
      { caption: "<b>REJECT — violates bow-free.</b> The move is discarded before it is ever scored: a pair may have a → , or a ↔ , or neither — never both. The 1 ↔ 3 edge stays; no directed edge is added between 1 and 3.", ops: [{ op: "highlightEdges", edges: [["1", "3"]], cls: "bad" }, { op: "badge", text: "violates bow-free → rejected", kind: "bad" }] },
      { caption: "<b>Proposed move: add 3 → 1.</b> A cycle check. Adding 3 → 1 on top of 1 → 2 → 3 would close a directed cycle 1 → 2 → 3 → 1, breaking acyclicity of the directed part.", ops: [{ op: "highlightNodes", ids: ["1", "2", "3"], cls: "hl" }, { op: "badge", text: "candidate: add 3 → 1 ?", kind: "info" }] },
      { caption: "<b>REJECT — would create a directed cycle.</b> Only bow-free AND acyclic candidates may enter the score comparison, so this move is dropped too.", ops: [{ op: "badge", text: "creates cycle → rejected", kind: "bad" }] },
      { caption: "<b>Add a directed edge 2 → 4.</b> Variable 4 is explained by a direct cause from 2. RICF refits and the score rises again. Acyclic and bow-free, so accepted.", ops: [{ op: "addEdge", from: "2", to: "4", type: "directed" }, { op: "highlightEdges", edges: [["2", "4"]], cls: "add" }, { op: "score", text: "score = −36.1  (▲)" }, { op: "badge", text: "add → : accepted", kind: "good" }] },
      { caption: "<b>Flip an edge's type: 2 → 4 becomes 2 ↔ 4.</b> The search also tries changing an existing edge's kind. Re-fitting shows the dependence between 2 and 4 is better explained by a latent common cause than a direct effect, so flipping → to ↔ improves the score. (The flip keeps the pair bow-free: it still has only one edge.)", ops: [{ op: "orient", from: "2", to: "4", type: "bidirected" }, { op: "highlightEdges", edges: [["2", "4"]], cls: "hl" }, { op: "score", text: "score = −34.8  (▲)" }, { op: "badge", text: "flip → to ↔ : accepted", kind: "good" }] },
      { caption: "<b>No move improves the score.</b> Every remaining single-edge add/delete/flip either lowers the score or is rejected as a bow or a cycle. The greedy search has reached a local optimum.", ops: [{ op: "highlightNodes", ids: ["1", "2", "3", "4"], cls: "hl" }, { op: "score", text: "score = −34.8  (local max)" }, { op: "badge", text: "no improving move", kind: "info" }] },
      { caption: "<b>Result — the best-scoring BAP.</b> Direct causes 1 → 2, 2 → 3; latent common causes 1 ↔ 3 and 2 ↔ 4. The directed part is acyclic and no pair carries both edge types — the diagram is bow-free. Returned with its fitted coefficients (B,Ω).", ops: [{ op: "badge", text: "locally optimal bow-free acyclic BAP", kind: "good" }] }
    ]
  },

  complexity: "The greedy search visits O(p²) single-edge moves per sweep (p variables), and each candidate is fitted by RICF, an iterative procedure that cycles over nodes until the likelihood converges — so the per-move cost is dominated by repeated regression/covariance updates. Restricting to the bow-free acyclic class shrinks the search space versus general path diagrams (ADMGs), but the overall procedure is still a heuristic hill-climb with no global-optimality guarantee.",
  strengths: [
    "Handles hidden confounders: unobserved common causes are represented explicitly as bidirected edges, instead of being mis-reported as direct effects.",
    "The bow-free restriction makes the linear-Gaussian SEM parameters (B,Ω) identifiable, unlike unrestricted path diagrams.",
    "Score-based, so it uses the full likelihood of the data rather than a sequence of independence tests; edge penalties control sparsity."
  ],
  limitations: [
    "Greedy hill-climbing only finds a local optimum; the result can depend on the starting graph and move order.",
    "Assumes a linear-Gaussian SEM — non-linear effects or non-Gaussian noise break the score and the identifiability argument.",
    "Each candidate requires an inner RICF fit that must itself be iterated to convergence, which is computationally heavy on larger graphs.",
    "The bow-free assumption excludes true structures in which a pair really does have both a direct effect and a shared latent cause."
  ],
  notes: "RICF (Algorithm 50) is the maximum-likelihood fitter used inside the search; Example 57 walks through its first sweep on a three-node BAP (X1→X2→X3 with X1↔X3), updating directed coefficients then symmetrising the bidirected covariance Ω. Related work (§4.41.2): Wang & Drton study identifiability of bow-free acyclic path diagrams and propose <b>BANG</b> for non-Gaussian errors; Bhattacharya et al. recast ancestral/arid/bow-free ADMG learning as continuous optimisation under smooth algebraic acyclicity-and-bow-free constraints, combined with RICF-based parameter fitting.",
  figureRefs: "Paper §4.41 (pp.201–206): Algorithm 51 (Greedy BAP score search, p.206), Algorithm 50 (RICF for a fixed BAP, p.205), Example 57 (first RICF sweep in a three-node BAP X1→X2→X3, X1↔X3, p.203), and §4.41.2 related work (Wang & Drton / BANG; Bhattacharya et al. smooth-optimisation ADMG learning)."
};
