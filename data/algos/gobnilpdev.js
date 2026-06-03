/* GOBNILP-dev — Deviation-bounded GOBNILP (GPBNILP), Liao et al. [395].
   Grounded in §5.13 (p.358): the deviation-bounded target set M_δ
   (score ≥ score(G*) − δ), the factor form ρ ≥ 1 (δ = log ρ),
   Proposition 14 (calibration of δ to Bayes factors: log BF exactly for
   BDeu, +O(1) for BIC), the δ-thresholds log 3 / log 20 / log 150,
   Lemma 25 (δ-dominance pruning of parent sets), and Example 111
   (δ = log 20 ≈ 3 ↔ Bayes factor ≤ 20). Builds on GOBNILP §4.26. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["gobnilpdev"] = {
  name: "GOBNILP-dev (Deviation-bounded GOBNILP)",
  oneLiner: "Run the GOBNILP integer program, but instead of returning only the single best DAG, enumerate every DAG whose score is within a user-chosen deviation δ of the optimum — so you can average over all the near-optimal networks instead of betting on one.",
  basedOnText: "GOBNILP-dev (the deviation-bounded GPBNILP algorithm of Liao et al.) is a minimal but principled extension of GOBNILP: it keeps GOBNILP's exact branch-and-cut ILP and its cluster/cycle cutting planes, and adds one extra ingredient — a deviation bound δ that defines the set M_δ = { G : score(G|D) ≥ score(G*|D) − δ } of all DAGs no more than δ below the global optimum G*. The point is Bayesian model averaging over near-optimal structures rather than a single point estimate.",

  assumptions: [
    "<b>Decomposable score</b> — total score is a sum of local family scores (BDeu, BIC, …), exactly as GOBNILP requires, so the objective and the deviation bound are both linear.",
    "<b>An optimal score is available</b> — the deviation set M_δ is defined relative to the optimum score(G*|D); in practice GOBNILP is run first (or jointly) to fix that reference value.",
    "<b>The deviation tolerance δ ≥ 0 is chosen by the user</b> — equivalently a factor ρ ≥ 1 with δ = log ρ ('within a factor ρ of optimal' on the likelihood scale). δ is meant to be read as a Bayes-factor threshold (Proposition 14)."
  ],
  input: "A dataset D over variables V with precomputed local family scores FamScore(X,W|D) for each node and candidate parent set, plus a deviation tolerance δ ≥ 0 (or factor ρ ≥ 1, δ = log ρ).",
  output: "The <b>collection M_δ of all DAGs</b> within δ of the global optimum — score(G|D) ≥ score(G*|D) − δ — ready for Bayesian model averaging, rather than the single optimal DAG that plain GOBNILP returns.",

  idea: [
    "Plain GOBNILP answers 'what is the single best-scoring acyclic network?'. But a tiny score gap between the best DAG and the runner-up often is not real evidence that the best one is correct — so committing to one structure can be overconfident. GOBNILP-dev instead asks 'what are <i>all</i> the networks that are almost as good as the best?' and lets you average over them.",
    "'Almost as good' is made precise by a single number, the <b>deviation bound δ</b>. The target is the set M_δ = { G : score(G|D) ≥ score(G*|D) − δ }: every DAG whose total score is at most δ below the optimum G*. Setting δ = 0 recovers ordinary GOBNILP (only the optimum); larger δ widens the net to more near-optimal structures. Equivalently you fix a factor ρ ≥ 1 and keep every G within a factor ρ of optimal on the likelihood scale, with δ = log ρ.",
    "What makes δ interpretable is its <b>calibration to Bayes factors</b> (Proposition 14). Under a BDeu score the score gap score(G*|D) − score(G|D) is exactly log BF(G*:G), the log Bayes factor of the optimum against G; under a BIC score it equals log BF up to an O(1) Laplace term for large samples. So 'within δ of optimal' literally means 'Bayes factor against the best DAG is at most e^δ'. The customary evidence thresholds δ = log 3, log 20, log 150 correspond to 'anecdotal', 'positive-to-strong' and 'very strong' evidence.",
    "Integration into the ILP is deliberately light. The objective, the one-parent-set-per-node convexity constraint, and the cluster cutting planes that forbid cycles are exactly GOBNILP's. The only structural addition is the linear <b>deviation constraint</b> score(G|D) ≥ score(G*|D) − δ, and a strengthened pruning rule (<b>δ-dominance</b>, Lemma 25): if one parent set out-scores a larger one by more than δ, the larger set can never appear in any DAG of M_δ, so it and all its supersets are safely pruned. The solver then enumerates feasible solutions of this bounded program instead of returning just the single optimum."
  ],

  steps: [
    "<b>Find the optimum first.</b> Run GOBNILP's branch-and-cut ILP to obtain the global optimum G* and its score(G*|D). This score becomes the reference point for the deviation bound.",
    "<b>Choose the deviation tolerance δ.</b> Pick δ ≥ 0 directly, or a factor ρ ≥ 1 with δ = log ρ. Read δ as a Bayes-factor bar: log 3 ('anecdotal'), log 20 ('positive-to-strong'), log 150 ('very strong').",
    "<b>Keep the GOBNILP machinery.</b> Same binary variables I(W→X), same linear objective ∑ FamScore·I(W→X), same convexity constraint ∑_W I(W→X)=1, and the same cluster constraints generated as cutting planes to forbid cycles.",
    "<b>Add the deviation constraint.</b> Append the single linear inequality score(G|D) ≥ score(G*|D) − δ to the program. This restricts the feasible region to exactly the near-optimal set M_δ.",
    "<b>δ-dominance pruning (Lemma 25).</b> For each node, if an admissible parent set S out-scores a larger admissible set T ⊃ S by more than δ (FamScore(X,S|D) − FamScore(X,T|D) > δ), then no DAG in M_δ uses T — drop T and all its supersets from the candidate lists.",
    "<b>Solve the LP relaxation</b> of the bounded program (objective + convexity + deviation bound), ignoring acyclicity for now, exactly as GOBNILP does.",
    "<b>Separate clusters → cutting plane.</b> If the current solution contains a cycle, find the violated cluster C (a region whose nodes all take parents from inside C) and add its cluster constraint ∑_{X∈C}∑_{W∩C=∅} I(W→X) ≥ 1, then re-solve. Repeat until acyclic.",
    "<b>Enumerate, don't just optimise.</b> Instead of stopping at the first optimal DAG, systematically enumerate every feasible integral DAG of the bounded program — these are precisely the members of M_δ.",
    "<b>Return M_δ.</b> Output the whole collection of near-optimal DAGs (each guaranteed within δ, i.e. Bayes factor ≤ e^δ, of G*) for Bayesian model averaging — not a single point estimate."
  ],

  keyConcepts: [
    { term: "Deviation bound δ", def: "A user-chosen tolerance ≥ 0. A DAG is kept iff its score is at most δ below the optimum. δ = 0 reduces GOBNILP-dev back to ordinary GOBNILP." },
    { term: "Deviation set M_δ", def: "M_δ = { G : score(G|D) ≥ score(G*|D) − δ }: every DAG no more than δ short of the global optimum G*. This is what the algorithm enumerates." },
    { term: "Factor form ρ", def: "Equivalently specify ρ ≥ 1 — 'within a factor ρ of optimal' on the likelihood scale — with δ = log ρ. Two views of the same bar." },
    { term: "Bayes-factor calibration (Proposition 14)", def: "The score gap to the optimum equals the log Bayes factor: log BF(G*:G) exactly for BDeu, and +O(1) (Laplace, large-N) for BIC. So 'within δ' means 'Bayes factor against G* ≤ e^δ'." },
    { term: "Evidence thresholds", def: "Rule of thumb: δ = log 3 ≈ 1.1, log 20 ≈ 3, log 150 ≈ 5 mark 'anecdotal', 'positive-to-strong' and 'very strong' Bayesian evidence." },
    { term: "δ-dominance pruning (Lemma 25)", def: "If parent set S beats a larger set T ⊃ S by more than δ, no DAG in M_δ can use T, so T and its supersets are pruned. A minimal extension of GOBNILP's usual pruning that preserves deviation-bounded optimality." },
    { term: "Deviation constraint", def: "The one extra linear inequality score(G|D) ≥ score(G*|D) − δ added to GOBNILP's ILP. Everything else (objective, convexity, cluster cuts) is unchanged." }
  ],

  animation: {
    title: "GOBNILP-dev on a faithful 4-node example {A,B,C,D}: enumerate all DAGs within δ of the optimum (illustrative; §5.13 gives the deviation set M_δ and Example 111).",
    nodes: [
      { id: "A", x: 0.20, y: 0.18 },
      { id: "B", x: 0.80, y: 0.18 },
      { id: "C", x: 0.20, y: 0.82 },
      { id: "D", x: 0.80, y: 0.82 }
    ],
    edges: [],
    steps: [
      { caption: "<b>Same setup as GOBNILP.</b> Each node has scored candidate parent sets FamScore(X,W|D). The ILP will choose one set per node, maximising total score, with no cycles — exactly the GOBNILP objective.", ops: [
        { op: "set", name: "Candidate parent-set scores", items: ["A | {} : 1.0", "A | {C} : 2.5", "B | {A} : 3.0", "B | {} : 1.2", "C | {D} : 2.2", "C | {} : 1.4", "D | {B} : 2.8", "D | {} : 1.0"] },
        { op: "badge", text: "GOBNILP objective + convexity", kind: "info" } ] },
      { caption: "<b>Solve GOBNILP first → the optimum G*.</b> Branch-and-cut returns the single best acyclic DAG: A→B→D→C with A taking its empty parent set to stay acyclic. Its score is the reference point.", ops: [
        { op: "addEdge", from: "A", to: "B" },
        { op: "addEdge", from: "B", to: "D" },
        { op: "addEdge", from: "D", to: "C" },
        { op: "set", name: "Optimum G* parent-sets", items: ["B ← {A}  (3.0)", "A ← {}   (1.0)", "D ← {B}  (2.8)", "C ← {D}  (2.2)"] },
        { op: "score", text: "score(G*) = 1.0 + 3.0 + 2.8 + 2.2 = 9.0" },
        { op: "badge", text: "G* proven optimal (GOBNILP)", kind: "good" } ] },
      { caption: "<b>The GOBNILP-dev idea.</b> A close runner-up (e.g. C taking ∅ instead of {D}, score 8.2) is only 0.8 worse — hardly decisive evidence that G* is the truth. So instead of one DAG, collect <i>all</i> near-optimal ones.", ops: [
        { op: "highlightEdges", edges: [["D","C"]], cls: "hl" },
        { op: "badge", text: "one best DAG may be overconfident", kind: "info" } ] },
      { caption: "<b>Choose the deviation bound δ.</b> Pick δ = log 20 ≈ 3 ('positive-to-strong' evidence). By Proposition 14 this means: keep every DAG whose Bayes factor against G* is at most 20 (Example 111).", ops: [
        { op: "set", name: "Deviation bound", items: ["δ = log 20 ≈ 3", "factor ρ = 20  (δ = log ρ)", "keep G iff Bayes factor(G*:G) ≤ 20"] },
        { op: "badge", text: "δ chosen — calibrated to Bayes factor", kind: "info" } ] },
      { caption: "<b>Add the deviation constraint.</b> Append ONE linear inequality to GOBNILP's ILP: score(G|D) ≥ score(G*) − δ = 9.0 − 3 = 6.0. The feasible region is now exactly the near-optimal set M_δ.", ops: [
        { op: "set", name: "Added ILP constraints", items: ["deviation:  score(G) ≥ 9.0 − 3 = 6.0"] },
        { op: "score", text: "deviation bound: keep DAGs with score ≥ 6.0" },
        { op: "badge", text: "deviation constraint added", kind: "good" } ] },
      { caption: "<b>δ-dominance pruning (Lemma 25).</b> For node B, {A} (3.0) beats {} (1.2) by 1.8 < δ=3, so both survive. But if some larger parent set were beaten by MORE than δ, it and its supersets would be dropped — a tighter version of GOBNILP's pruning that keeps M_δ exact.", ops: [
        { op: "set", name: "Added ILP constraints", items: ["deviation:  score(G) ≥ 9.0 − 3 = 6.0", "δ-dominance: drop any T if a subset beats it by > δ"] },
        { op: "badge", text: "δ-dominance pruning applied", kind: "info" } ] },
      { caption: "<b>Enumerate member 1 = G* itself.</b> The optimum A→B→D→C (score 9.0 ≥ 6.0) is of course in M_δ. Keep it as the first network to average over.", ops: [
        { op: "highlightEdges", edges: [["A","B"],["B","D"],["D","C"]], cls: "good" },
        { op: "score", text: "G1 = G*: score 9.0  (Bayes factor 1)" },
        { op: "badge", text: "M_δ member #1", kind: "good" } ] },
      { caption: "<b>Enumerate member 2.</b> Re-solve for the next feasible DAG: give C its empty parent set (drop D→C). Score = 1.0+3.0+2.8+1.4 = 8.2 ≥ 6.0, gap 0.8 → Bayes factor e^0.8 ≈ 2.2 ≤ 20. It is in M_δ.", ops: [
        { op: "removeEdge", from: "D", to: "C" },
        { op: "set", name: "Optimum G* parent-sets", items: ["B ← {A}  (3.0)", "A ← {}   (1.0)", "D ← {B}  (2.8)", "C ← {}   (1.4)"] },
        { op: "score", text: "G2: score 8.2  (gap 0.8, BF ≈ 2.2 ≤ 20)" },
        { op: "badge", text: "M_δ member #2", kind: "good" } ] },
      { caption: "<b>Cluster cut still enforced.</b> Enumeration never drops acyclicity: any candidate with a cycle is cut by the usual cluster constraint ∑_{X∈C}∑_{W∩C=∅} I(W→X) ≥ 1, just as in GOBNILP. Only acyclic, within-δ DAGs are kept.", ops: [
        { op: "set", name: "Added ILP constraints", items: ["deviation:  score(G) ≥ 9.0 − 3 = 6.0", "δ-dominance: drop any T if a subset beats it by > δ", "cluster cuts: forbid cycles (as in GOBNILP)"] },
        { op: "badge", text: "acyclicity via cluster cuts", kind: "info" } ] },
      { caption: "<b>Reject a too-far DAG.</b> A candidate giving B its empty set scores 1.0+1.2+2.8+2.2 = 7.2 — still ≥ 6.0, so it is kept; but any DAG scoring below 6.0 (Bayes factor > 20 against G*) is cut by the deviation constraint and excluded.", ops: [
        { op: "addEdge", from: "D", to: "C" },
        { op: "score", text: "deviation bound rejects anything with score < 6.0" },
        { op: "badge", text: "below δ → excluded from M_δ", kind: "bad" } ] },
      { caption: "<b>Return M_δ, not a single DAG.</b> GOBNILP-dev outputs the whole collection of near-optimal DAGs (each within δ, i.e. Bayes factor ≤ e^δ, of G*) for Bayesian model averaging — the key enhancement over plain GOBNILP, which returns only G*.", ops: [
        { op: "highlightNodes", ids: ["A","B","C","D"], cls: "good" },
        { op: "set", name: "Returned set M_δ", items: ["G1 = G* (9.0)", "G2 (8.2)", "G3 (7.2)", "… all DAGs with score ≥ 6.0"] },
        { op: "badge", text: "M_δ returned for model averaging", kind: "good" } ] }
    ]
  },

  complexity: "Inherits GOBNILP's worst-case exponential cost (exact ILP, NP-hard, exponentially many cluster constraints). The deviation bound and δ-dominance pruning add essentially no overhead — one extra linear constraint and a tighter parent-set pruning rule — but enumerating M_δ instead of finding a single optimum is more work the larger δ is, since more near-optimal DAGs qualify. δ = 0 collapses to ordinary GOBNILP.",
  strengths: [
    "Replaces an overconfident single best DAG with a principled <b>collection of near-optimal DAGs</b> for Bayesian model averaging.",
    "The bound δ is <b>interpretable</b> — calibrated directly to a Bayes-factor threshold (Proposition 14), with standard evidence levels log 3 / log 20 / log 150.",
    "A <b>minimal extension</b> of GOBNILP: one extra linear constraint plus δ-dominance pruning (Lemma 25), reusing the entire exact branch-and-cut ILP and cluster cutting planes.",
    "Exact and solver-independent — keeps GOBNILP's certified-optimality machinery."
  ],
  limitations: [
    "Still scales poorly to many variables / large parent sets, because it is built on GOBNILP's exact ILP.",
    "Enumerating M_δ can be costly for large δ, since the number of qualifying near-optimal DAGs grows.",
    "Needs the optimum score(G*|D) as a reference (run GOBNILP first), and relies on a decomposable, Bayes-factor-calibrated score (BDeu exact; BIC only up to an O(1) Laplace term)."
  ],
  notes: "GOBNILP-dev is the deviation-bounded GPBNILP algorithm of Liao et al. [395], built on GOBNILP (§4.26). The target set M_δ = { G : score(G|D) ≥ score(G*|D) − δ } enumerates all near-optimal DAGs; equivalently a factor ρ ≥ 1 with δ = log ρ. Proposition 14 calibrates δ to log Bayes factors (exact for BDeu, +O(1) for BIC), so the thresholds log 3 / log 20 / log 150 map to anecdotal / positive-strong / very-strong evidence. Lemma 25 (δ-dominance) prunes parent sets a subset out-scores by more than δ. Example 111: δ = log 20 ≈ 3 keeps exactly the DAGs with Bayes factor ≤ 20 against G*.",
  figureRefs: "Paper §5.13 (p.358): deviation-bounded target set M_δ = { G : score(G|D) ≥ score(G*|D) − δ } and factor form δ = log ρ; Proposition 14 (calibration of δ to log Bayes factors — exact for BDeu, +O(1) Laplace for BIC); Lemma 25 (δ-dominance pruning of parent sets); Example 111 (δ = log 20 ≈ 3 ↔ Bayes factor ≤ 20). Builds on GOBNILP §4.26 (Algorithm 33, branch-and-cut with cluster cutting planes)."
};
