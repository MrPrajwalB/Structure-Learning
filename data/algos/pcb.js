/* PCB — Partial Correlation-Based hybrid (Yang et al.). Grounded in §5.9 (pp.349-350):
   Recall 96 (partial correlation via the precision/correlation matrix and residual
   regression), Algorithm 102 (PCB hill-climbing restricted to candidate neighbours
   PN, with add/delete/reverse operators), Example 107 (worked run on {C,M,D}),
   Remark 33 (partial correlation as a d-separation surrogate under linear-Gaussian SEM),
   Fig.219 (binary dataset for C,M,D and the allowed-neighbour search states 𝒢₆→𝒢₄→𝒢₂).
   PCB follows the same constraint-then-score template as MMHC. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["pcb"] = {
  name: "Partial Correlation-Based hybrid (PCB)",
  oneLiner: "Use partial-correlation tests to build, for each variable, a small set of candidate neighbours (the constraint phase), then run a score-based hill-climbing search that may only add, delete or reverse edges between those candidate pairs (the score phase) — yielding a DAG cheaply on continuous, roughly-Gaussian data.",
  basedOnText: "PCB (Yang et al.) is a <b>hybrid</b> structure learner that follows the same constraint-then-score template as MMHC. Its one distinctive idea is the CI test it plugs into the constraint phase: instead of a generic χ²/G² or Fisher's-z test, PCB decides independence with <b>partial correlation</b>. That makes the skeleton-building phase fast and natural whenever the data are continuous and approximately linear-Gaussian, while the rest of the pipeline (a restricted hill-climbing search) is exactly the MMHC second stage.",

  assumptions: [
    "<b>Linear-Gaussian (linear-SEM) data</b> — partial correlation is a valid independence test mainly when relationships are linear and the variables are jointly (approximately) Gaussian; near-zero partial correlation then really does mean conditional independence.",
    "<b>Faithfulness</b> — a true direct edge between two variables leaves a non-zero partial correlation that no conditioning set can cancel, so genuine neighbours survive the constraint phase.",
    "<b>Reliable CI tests</b> — independence is decided by thresholding the (absolute) partial correlation at a cut-off k; the test is assumed accurate enough that the candidate skeleton is trustworthy.",
    "<b>Causal sufficiency</b> — the usual no-hidden-confounders backdrop shared with MMHC and other constraint-based methods.",
    "PCB is template-agnostic: a different (consistent) CI test can be substituted into Algorithm 102 without changing the search, but partial correlation is the one PCB ships with."
  ],
  input: "A dataset 𝒟 over variables V, a CI test Indep(X,Y | Z) implemented as a partial-correlation test, a scoring function score(𝒢; 𝒟) (e.g. BIC/BDeu), and a cap T on the number of hill-climbing iterations.",
  output: "A single <b>DAG 𝒢</b> over V — the highest-scoring directed graph found by hill-climbing within the edges allowed by the candidate-neighbour sets.",

  idea: [
    "PCB splits learning into two phases, just like MMHC. <b>Phase 1 (constraint):</b> for every variable X it computes a set of candidate neighbours PN(X) — the variables that could plausibly be directly linked to X — using partial-correlation tests. <b>Phase 2 (score):</b> a hill-climbing search edits a DAG to maximise a score, but it is <i>restricted</i> so that an edge X–Y may only ever be touched if X and Y are candidate neighbours of each other. The skeleton from Phase 1 fences off the search space.",
    "The heart of PCB is what <b>partial correlation</b> means. The ordinary correlation between X and Y can be high simply because both depend on a third variable. Partial correlation ρ(X,Y | Z) measures their correlation <i>after the linear effect of the variables in Z has been removed from both</i> — equivalently, correlate the leftover residuals once X and Y have each been regressed on Z. If that residual correlation is near zero, X and Y carry no direct linear information about each other beyond what Z already explains, which signals <b>no direct edge</b>; a clearly non-zero value signals a direct link.",
    "Partial correlation is cheap to obtain in bulk: every ρ(X,Y | Z) can be read off the inverse of the sample correlation matrix (the precision matrix R⁻¹), so PCB does not have to refit a separate model per test. This is exactly why PCB is attractive on continuous Gaussian data — the constraint phase reduces to fast linear algebra rather than many independent statistical fits.",
    "Once the candidate skeleton constrains which pairs may be connected, Phase 2 is an ordinary greedy search: at each step it scores every legal single-edge change (add, delete, reverse) that keeps the graph acyclic, applies the best-scoring one, and repeats until no change improves the score or the iteration cap T is hit. Because the candidate sets are small, far fewer moves are ever scored than in an unconstrained hill-climb."
  ],

  steps: [
    "<b>Phase 1 — candidate neighbours via partial correlation.</b> For every unordered pair {Xᵢ, Xⱼ}, search for a conditioning set Z ⊆ V \\ {Xᵢ, Xⱼ} and compute the partial correlation ρ(Xᵢ, Xⱼ | Z). Conceptually: remove the linear effect of Z from both variables and correlate what is left.",
    "<b>Threshold the partial correlation.</b> Fix a cut-off k ∈ (0,1). If |ρ(Xᵢ, Xⱼ | Z)| ≤ k for some conditioning set, declare Xᵢ ⫫ Xⱼ | Z — there is <i>no</i> candidate edge. If the partial correlation stays above k for every Z, the pair are candidate neighbours.",
    "<b>Build the PN sets.</b> Collect the survivors into a candidate-neighbour set PN(X) for each variable — the symmetric candidate skeleton. (When Z = ∅ this reduces to the ordinary correlation between Xᵢ and Xⱼ.)",
    "<b>Phase 2 — initialise the search.</b> Start the hill-climbing from a DAG 𝒢 (e.g. the empty graph) and compute its score score(𝒢; 𝒟). Set the iteration counter t = 0.",
    "<b>Restricted move generation.</b> At each iteration, consider only single-edge operations on candidate pairs: <i>add</i> X → Y is allowed only if Y ∈ PN(X) <b>and</b> X ∈ PN(Y); <i>delete</i> any existing edge; <i>reverse</i> any existing edge — and only if the resulting graph is acyclic.",
    "<b>Pick the best legal move.</b> Evaluate score(𝒢′; 𝒟) for every legal neighbouring graph 𝒢′ and select the one with the highest score, 𝒢ᵇᵉˢᵗ.",
    "<b>Greedy update with stopping test.</b> If score(𝒢ᵇᵉˢᵗ) improves on the current score, commit the move (𝒢 ← 𝒢ᵇᵉˢᵗ) and set t ← t + 1; otherwise <b>break</b> — a local optimum has been reached.",
    "<b>Repeat</b> the restricted hill-climbing until no move improves the score or the iteration cap T is reached.",
    "<b>Return the DAG 𝒢</b> — the best-scoring directed graph found inside the partial-correlation candidate skeleton."
  ],

  keyConcepts: [
    { term: "Partial correlation ρ(X,Y | Z)", def: "The correlation between X and Y after the linear effect of the variables in Z has been removed from both — i.e. regress X on Z and Y on Z, then correlate the residuals R_X,Z and R_Y,Z. Near zero ⇒ no direct linear link given Z; clearly non-zero ⇒ a direct link." },
    { term: "Precision (concentration) matrix R⁻¹", def: "The inverse of the sample correlation matrix R. Every partial correlation can be read directly off its entries, ρ(Xᵢ,Xⱼ | rest) = −(R⁻¹)ᵢⱼ / √((R⁻¹)ᵢᵢ(R⁻¹)ⱼⱼ), so all the CI tests come from one linear-algebra step." },
    { term: "Threshold k", def: "A cut-off in (0,1) for the absolute partial correlation. |ρ| ≤ k is read as conditional independence (no candidate edge); |ρ| > k as dependence (keep the edge)." },
    { term: "Candidate-neighbour set PN(X)", def: "The variables that survive the partial-correlation tests for X — the pairs allowed to carry an edge. The constraint phase's output and the fence around the hill-climbing search." },
    { term: "Restriction rule", def: "Phase 2 may add X → Y only when X and Y are candidate neighbours of each other (Y ∈ PN(X) and X ∈ PN(Y)); deletes and reverses are unrestricted. This is what keeps the score search small." },
    { term: "Hill-climbing operators", def: "Add, delete, and reverse a single edge — the three local moves the score phase chooses among, always keeping the graph acyclic, exactly as in MMHC's second stage." },
    { term: "Hybrid (constraint + score)", def: "PCB combines a constraint phase (partial-correlation tests build the skeleton) with a score phase (hill-climbing orients and selects edges), getting the speed of constraint pruning and the optimisation power of scoring." }
  ],

  animation: {
    title: "PCB on the paper's Example 107: variables {C, M, D} (Fig.219 dataset and search states).",
    nodes: [
      { id: "C", x: 0.5, y: 0.12 },
      { id: "M", x: 0.26, y: 0.82 },
      { id: "D", x: 0.74, y: 0.82 }
    ],
    edges: [],
    steps: [
      { caption: "<b>Phase 1 — constraint phase.</b> Goal: for each variable build its candidate-neighbour set PN using partial correlation. Begin with no edges; PCB will test each pair {C,M}, {C,D}, {M,D} by removing the linear effect of the third variable and checking the leftover (partial) correlation against a threshold k.", ops: [{ op: "badge", text: "Phase 1: partial-correlation tests", kind: "info" }, { op: "set", name: "PN(C)", items: [] }] },
      { caption: "<b>Test C and M.</b> The partial correlation ρ(C,M | D) stays high (well above the cut-off k) — removing D's effect does not explain away their dependence, so C and M are directly linked. Add a candidate edge C–M.", ops: [{ op: "highlightNodes", ids: ["C", "M"], cls: "hl" }, { op: "testCI", x: "C", y: "M", z: ["D"], result: "dep" }, { op: "score", text: "partial corr ρ(C,M|D) = 0.41 > k → edge" }, { op: "addEdge", from: "C", to: "M", type: "undirected" }, { op: "badge", text: "C–M kept", kind: "good" }] },
      { caption: "<b>Test C and D.</b> Likewise ρ(C,D | M) is high — C and D stay dependent after removing M's linear effect — so they are candidate neighbours. Add a candidate edge C–D.", ops: [{ op: "highlightNodes", ids: ["C", "D"], cls: "hl" }, { op: "testCI", x: "C", y: "D", z: ["M"], result: "dep" }, { op: "score", text: "partial corr ρ(C,D|M) = 0.38 > k → edge" }, { op: "addEdge", from: "C", to: "D", type: "undirected" }, { op: "badge", text: "C–D kept", kind: "good" }] },
      { caption: "<b>Test M and D.</b> Now ρ(M,D | C) is near zero — once the linear effect of C is removed, M and D carry no extra information about each other. So M ⫫ D | C: <b>no direct edge</b>. M and D are linked only through C.", ops: [{ op: "highlightNodes", ids: ["M", "D"], cls: "hl" }, { op: "testCI", x: "M", y: "D", z: ["C"], result: "indep" }, { op: "score", text: "partial corr ρ(M,D|C) ≈ 0.02 ≤ k → no edge" }, { op: "badge", text: "M–D excluded", kind: "bad" }] },
      { caption: "<b>Candidate skeleton complete.</b> The partial-correlation tests give PN(C) = {M, D}, PN(M) = {C}, PN(D) = {C}. Only the pairs C–M and C–D may carry an edge in the next phase; M–D is fenced off forever.", ops: [{ op: "badge", text: "partial-correlation skeleton", kind: "good" }, { op: "highlightEdges", edges: [["C", "M"], ["C", "D"]], cls: "good" }, { op: "set", name: "PN(C)", items: ["M", "D"] }, { op: "set", name: "PN(M)", items: ["C"] }, { op: "set", name: "PN(D)", items: ["C"] }] },
      { caption: "<b>Phase 2 — score phase.</b> Hill-climbing now searches for the best DAG, but it may only touch the candidate pairs C–M and C–D. Start from the empty graph 𝒢₁ and score it. Each step scores every legal add/delete/reverse and keeps the best improving move.", ops: [{ op: "clearSet", name: "PN(C)" }, { op: "clearSet", name: "PN(M)" }, { op: "clearSet", name: "PN(D)" }, { op: "removeEdge", from: "C", to: "M" }, { op: "removeEdge", from: "C", to: "D" }, { op: "badge", text: "Phase 2: restricted hill-climbing", kind: "info" }, { op: "score", text: "score(𝒢₁ empty) = −180.0" }] },
      { caption: "<b>Add the best edge: M → C.</b> Adding M → C is legal (M ∈ PN(C) and C ∈ PN(M)) and gives the largest score gain, so it is committed. The graph becomes 𝒢₂.", ops: [{ op: "orient", from: "M", to: "C", type: "directed" }, { op: "score", text: "score after add M→C = −150.0 ↑" }, { op: "badge", text: "add M → C", kind: "good" }] },
      { caption: "<b>Add the next best edge: D → C.</b> Adding D → C is also legal (D ∈ PN(C), C ∈ PN(D)) and improves the score, so it is committed. The graph 𝒢₄ now has M → C ← D.", ops: [{ op: "orient", from: "D", to: "C", type: "directed" }, { op: "score", text: "score after add D→C = −138.0 ↑" }, { op: "badge", text: "add D → C", kind: "good" }] },
      { caption: "<b>A disallowed move.</b> Hill-climbing considers add M → D, but M and D are not candidate neighbours (M ∉ PN(D)), so the restriction forbids it — this move is never scored. The candidate skeleton keeps the search small.", ops: [{ op: "highlightNodes", ids: ["M", "D"], cls: "hl" }, { op: "badge", text: "add M → D disallowed (not in PN)", kind: "bad" }] },
      { caption: "<b>Reverse an edge.</b> The search tests reversing M → C to C → M; this raises the score, so it is committed. Reversal is one of the three operators and is always allowed on existing edges while the graph stays acyclic.", ops: [{ op: "orient", from: "C", to: "M", type: "directed" }, { op: "score", text: "score after reverse → C→M = −131.0 ↑" }, { op: "badge", text: "reverse M→C ⇒ C→M", kind: "good" }] },
      { caption: "<b>No improving move remains.</b> Every legal add/delete/reverse on the candidate pairs now lowers the score, so hill-climbing stops at this local optimum (the iteration cap T was not reached).", ops: [{ op: "score", text: "no move improves score → break" }, { op: "badge", text: "local optimum", kind: "info" }] },
      { caption: "<b>Result — the DAG 𝒢.</b> PCB returns C → M and D → C: the structure agreeing with the candidate skeleton {C–M, C–D} and the data, with M–D correctly absent. Partial correlation built the skeleton; restricted hill-climbing oriented it.", ops: [{ op: "highlightEdges", edges: [["C", "M"], ["D", "C"]], cls: "good" }, { op: "highlightNodes", ids: ["C", "M", "D"], cls: "good" }, { op: "badge", text: "DAG 𝒢 returned", kind: "good" }] }
    ]
  },

  complexity: "The constraint phase reduces to reading partial correlations off the inverse correlation matrix, so it is cheap on continuous Gaussian data and avoids refitting a model per CI test. The score phase is hill-climbing capped at T iterations, but because moves are restricted to the small candidate-neighbour sets PN, far fewer single-edge changes are scored than in an unconstrained hill-climb — the main source of PCB's speed-up over plain score-based search.",
  strengths: [
    "<b>Fast on continuous / linear-Gaussian data:</b> partial-correlation tests come from one linear-algebra step instead of many separate model fits.",
    "<b>Hybrid efficiency:</b> the candidate skeleton fences off the hill-climbing, so the score search explores a far smaller space than an unrestricted search (the MMHC advantage).",
    "Keeps the proven MMHC second stage — add/delete/reverse hill-climbing with a global score — so it benefits from a scoring objective rather than CI tests alone.",
    "Modular: the partial-correlation test can be swapped for any consistent CI test in Algorithm 102 without altering the search."
  ],
  limitations: [
    "Partial correlation only captures <b>linear</b> dependence and assumes (near-)Gaussian data; non-linear or non-Gaussian relationships can be missed or spuriously kept.",
    "Sensitive to the threshold k and to CI-test errors: a wrong test in Phase 1 wrongly excludes or admits a candidate pair, and Phase 2 can never repair an edge the skeleton fenced off.",
    "Hill-climbing returns a single DAG and can get stuck in a local optimum (no improving move) rather than the global best.",
    "Shares the causal-sufficiency assumption — hidden confounders are not handled."
  ],
  notes: "PCB is best understood as <b>MMHC with a partial-correlation CI test</b>: it inherits MMHC's constraint-then-score template (candidate neighbours PN built first, then a restricted add/delete/reverse hill-climbing search), and contributes the partial-correlation skeleton-building that makes it efficient on continuous Gaussian data. Remark 33 notes that under a linear-Gaussian SEM partial correlation is a sound surrogate for d-separation: Xᵢ ⫫ Xⱼ | Z corresponds to ρ(Xᵢ,Xⱼ | Z) = 0.",
  figureRefs: "Paper §5.9 (pp.349–350): Recall 96 (partial correlation via the precision/correlation matrix and residual regression), Algorithm 102 (PCB hill-climbing restricted to PN with add/delete/reverse operators and threshold k), Example 107 (worked run on {C,M,D}), Remark 33 (partial correlation as a d-separation surrogate under linear-Gaussian SEM), Fig.219 (binary dataset for C,M,D and the allowed-neighbour search states 𝒢₆ → 𝒢₄ → 𝒢₂)."
};
