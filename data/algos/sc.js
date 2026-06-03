/* SC — Sparse Candidate. Grounded in §4.9 (p.70): Algorithm 13 (SC),
   restrict/maximize alternation, candidate selection by conditional mutual
   information (CMI), and the worked Example 18 (SC with d=2, V={A,B,C,D}),
   whose run is depicted in Fig.35. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["sc"] = {
  name: "Sparse Candidate",
  oneLiner: "Make score-based search scalable by alternating two steps until convergence: RESTRICT — give each variable a small set of candidate parents (the most strongly associated variables), then MAXIMIZE — run a score-based search that may only pick parents from those candidate sets; recompute the candidates from the new network and repeat.",
  basedOnText: "SC is a hybrid method: it keeps the accuracy of score-based search but bounds the search space so learning stays fast even with many variables. It does this by restricting the parents of each node to a small candidate set before each round of optimisation.",

  assumptions: [
    "<b>A score function is available</b> — SC optimises a decomposable score (e.g. BIC/BDeu) over candidate-restricted structures.",
    "<b>An association measure is available</b> — candidate parents are chosen by how strongly each variable is associated with the target, measured here by <i>conditional mutual information (CMI)</i> with respect to the current network.",
    "<b>A maximum parent size d is chosen in advance</b> — each candidate set holds at most d variables, which is what bounds the search.",
    "<b>No variable ordering is assumed</b> — unlike some greedy methods, SC does not require the variables to be pre-ordered."
  ],
  input: "A dataset over variables V, a maximum in-degree d, an initial DAG G₀ (often the empty graph), and a CMI estimator.",
  output: "A DAG Ĝ found by restricted score-based search — a single network, not an equivalence class.",

  idea: [
    "Plain score-based search is accurate but slow: for every node it would consider every other variable as a possible parent, so the number of candidate structures explodes as the number of variables grows. SC's insight is that most of those candidates are hopeless — a variable that carries almost no information about a node is very unlikely to be its parent.",
    "So SC <b>restricts</b> attention: for each node X it keeps only a small <i>candidate parent set</i> C_X of size at most d, made of the variables most strongly associated with X. Association is measured by conditional mutual information (CMI), I(X;Y | Pa(X)), which asks how much extra a variable Y tells us about X <i>beyond what the current network already explains</i>.",
    "It then <b>maximizes</b>: a normal score-based search (e.g. hill climbing) runs, but it is only allowed to give X parents drawn from C_X. Because each node has at most d candidates, the search space is tiny compared with the unrestricted version, so this step is fast.",
    "The trick is the <b>outer loop</b>. After search produces a better network, SC recomputes every candidate set using that new network. Because CMI is now measured given the current parents, a variable that looked promising at the start can drop out, and a genuinely informative variable that was missed can enter. Restrict and maximize alternate until the score stops improving — so the iteration can repair an imperfect first guess at the candidates."
  ],

  steps: [
    "<b>Initialise.</b> Start from an initial DAG Ĝ₀ (commonly the empty graph) and set the iteration counter t = 0.",
    "<b>Restrict (candidate selection).</b> For each node X, look at every non-parent variable Y and measure its association with X by the conditional mutual information I(X;Y | Pa(X)) given X's <i>current</i> parents. Keep the top variables by this score so that the candidate set C_X has at most d members (current parents are always kept). This is Step 1 in Algorithm 13.",
    "<b>Maximize (score optimisation under the candidate constraints).</b> Run a score-based search — e.g. hill climbing — that may add, remove or reverse edges, but is only allowed to choose a parent for X from C_X. This produces a new network Ĝ_{t+1}. This is Step 2 in Algorithm 13.",
    "<b>Check for improvement.</b> If the score of Ĝ_{t+1} is no better than the score of Ĝ_t, stop (convergence). Otherwise accept Ĝ_{t+1}.",
    "<b>Iterate.</b> Increase t by 1 and go back to Restrict — recomputing every candidate set from the <i>updated</i> network, so newly informative variables can enter and now-redundant ones can leave.",
    "<b>Return</b> the final network Ĝ_t once the global score no longer improves."
  ],

  keyConcepts: [
    { term: "Candidate parent set C_X", def: "A small set (size ≤ d) of the variables most strongly associated with node X. Only members of C_X may be chosen as parents of X during the maximize step — this is what bounds the search." },
    { term: "Maximum parent size d", def: "The cap on how many candidate parents each node may have. Smaller d means a smaller, faster search but risks missing a true parent." },
    { term: "Conditional mutual information (CMI)", def: "I(X;Y | Z) measures how much extra Y tells us about X once we already know Z. SC conditions on X's current parents, so it scores how much new information a variable would add beyond the current network." },
    { term: "Restrict step", def: "The filter that rebuilds each candidate set C_X by association with X. It uses statistics, not the score, so it is cheap to run." },
    { term: "Maximize step", def: "A standard score-based search (e.g. hill climbing) restricted to parents inside the candidate sets. It uses the score, not associations." },
    { term: "Outer (alternating) loop", def: "Restrict and maximize repeat: each maximize step changes the network, which changes the CMI values, which changes the candidate sets — letting the method correct an imperfect first guess." }
  ],

  animation: {
    title: "SC running on the four-variable example {A,B,C,D} with d = 2 (paper Example 18 / Fig. 35).",
    nodes: [
      { id: "A", x: 0.20, y: 0.18 },
      { id: "B", x: 0.80, y: 0.18 },
      { id: "C", x: 0.50, y: 0.85 },
      { id: "D", x: 0.06, y: 0.85 }
    ],
    edges: [],
    steps: [
      { caption: "<b>Start.</b> Initial DAG Ĝ₀ is empty and the maximum parent size is d = 2. SC will give each node a candidate parent set of at most two variables, then search for edges only inside those sets.", ops: [{ op: "badge", text: "t = 0,  d = 2,  Ĝ₀ empty", kind: "info" }] },
      { caption: "<b>Restrict — candidates for C.</b> Measure association of each variable with C using conditional mutual information given C's current (empty) parents: I(C;A|∅)=0.21, I(C;B|∅)=0.25, I(C;D|∅)=0.03. The two strongest are B and A.", ops: [{ op: "badge", text: "RESTRICT", kind: "info" }, { op: "highlightNodes", ids: ["C"], cls: "hl" }, { op: "score", text: "I(C;B|∅)=0.25, I(C;A|∅)=0.21, I(C;D|∅)=0.03" }] },
      { caption: "<b>Pick top-d = 2 candidate parents of C:</b> C_C = {A, B}. D is too weakly associated (0.03), so it is left out — this is exactly how SC bounds the search.", ops: [{ op: "set", name: "Candidates(C)", items: ["A", "B"] }, { op: "highlightNodes", ids: ["A", "B"], cls: "cand" }] },
      { caption: "<b>Restrict — the other nodes.</b> Repeating the CMI ranking gives C_A = {D, C} (I(A;D)=0.19, I(A;C)=0.17 beat I(A;B)=0.02), C_B = {C, A} (0.24, 0.03 beat 0.01), and C_D = {A, B} (0.22, 0.04 beat 0.02). Every node now has at most two candidate parents.", ops: [{ op: "set", name: "Candidates(A)", items: ["D", "C"] }, { op: "set", name: "Candidates(B)", items: ["C", "A"] }, { op: "set", name: "Candidates(D)", items: ["A", "B"] }] },
      { caption: "<b>Maximize — restricted hill climbing.</b> Now run a score-based search that may only draw each node's parents from its candidate set. It first tries the highest-scoring legal edge. Adding B → C (B is a candidate of C) improves the score, so accept it.", ops: [{ op: "badge", text: "MAXIMIZE", kind: "info" }, { op: "addEdge", from: "B", to: "C", type: "directed" }, { op: "score", text: "score improves: +B→C" }] },
      { caption: "<b>Maximize — keep climbing.</b> A → C is also legal (A ∈ C_C) and improves the score further. Add it. C now has the two parents allowed by C_C = {A, B}.", ops: [{ op: "addEdge", from: "A", to: "C", type: "directed" }, { op: "score", text: "score improves: +A→C" }] },
      { caption: "<b>Maximize — one more edge.</b> Hill climbing adds D → A (D ∈ C_A). The search settles on Ĝ₁ with A → C, B → C and D → A — the restricted optimum for these candidate sets.", ops: [{ op: "addEdge", from: "D", to: "A", type: "directed" }, { op: "score", text: "Ĝ₁: A→C, B→C, D→A" }, { op: "badge", text: "score(Ĝ₁) > score(Ĝ₀)", kind: "good" }] },
      { caption: "<b>Iterate — outer loop, t = 1.</b> Because the network changed, the candidate sets are recomputed from Ĝ₁. Associations are now measured given the new parents — e.g. C already has parents {A, B}.", ops: [{ op: "badge", text: "t = 1  →  RESTRICT again", kind: "info" }, { op: "highlightNodes", ids: ["C"], cls: "hl" }] },
      { caption: "<b>Recompute candidates for C.</b> Given C's parents {A, B}, the extra information D carries about C collapses: I(C;D | {A,B}) becomes small. So D is no longer a candidate for C — the iteration corrects the earlier ranking even though D had been close before.", ops: [{ op: "score", text: "I(C;D | {A,B}) ≈ 0  →  D drops out" }, { op: "clearSet", name: "Candidates(C)" }, { op: "set", name: "Candidates(C)", items: ["A", "B"] }] },
      { caption: "<b>Maximize again.</b> With the refreshed candidate sets, restricted hill climbing finds no edge that improves the score — the current parents already capture the structure.", ops: [{ op: "badge", text: "MAXIMIZE", kind: "info" }, { op: "score", text: "no scoring edge to add or change" }] },
      { caption: "<b>Converge.</b> The global score did not improve over the last pass, so the restrict↔maximize loop stops.", ops: [{ op: "highlightEdges", edges: [["A","C"],["B","C"],["D","A"]] }, { op: "badge", text: "converged", kind: "good" }] },
      { caption: "<b>Result.</b> SC returns Ĝ with A → C, B → C and D → A — found quickly because every search step was confined to small candidate parent sets, and refined because the outer loop rebuilt those sets from the improving network.", ops: [{ op: "badge", text: "return Ĝ", kind: "good" }] }
    ]
  },

  complexity: "Each maximize step searches only over parents drawn from candidate sets of size ≤ d, so its cost grows roughly like the (bounded) restricted search rather than with all variables — far cheaper than unrestricted score-based search on many variables. The restrict step is a cheap pass of association (CMI) computations, and the whole loop repeats only a few times until the score stops improving.",
  strengths: [
    "Scales score-based learning to many variables by capping each node's parents at d candidates.",
    "Hybrid: keeps the accuracy of a score function while using cheap association statistics to prune.",
    "The outer loop can repair imperfect initial candidate sets — informative variables that were missed can enter on a later pass.",
    "Needs no variable ordering."
  ],
  limitations: [
    "If a true parent is never placed in a candidate set (e.g. d too small, or its association is masked early), the edge can never be learned.",
    "Quality depends on the association measure; CMI estimates can be noisy, especially with limited data.",
    "Returns a single DAG via local search, so like other greedy methods it can settle in a local optimum.",
    "Choosing d trades speed against the risk of excluding real parents."
  ],
  notes: "SC was introduced by Friedman, Nachman and Pe'er. The paper measures candidate association by conditional mutual information, I(X;Y|Z) = Σ P(x,y,z) log[ P(x,y|z) / (P(x|z)P(y|z)) ], conditioning on a node's current parents so that already-explained dependence is discounted; the original method also discusses a Kullback–Leibler discrepancy between the current model and the data as an alternative selection score.",
  figureRefs: "Paper §4.9 (p.70): Algorithm 13 (SC) with its candidate-selection (Step 1) and restricted score-optimisation (Step 2) loop; the conditional-mutual-information measure I(X;Y|Z); Example 18 (SC with d=2 on {A,B,C,D}); Fig.35 (the SC run, showing top-d candidate edges at t=0 and the resulting Ĝ₁)."
};
