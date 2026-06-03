/* MMPC — Max-Min Parents and Children. Grounded in §4.11 (pp.77-79):
   Algorithm 15 (MMPC for a single target T), Definition 9 (association score),
   Example 20 (worked forward + backward run on candidates {A,B,C}),
   Fig.44 (true DAG of Example 20), Fig.45 (symmetry-correction counterexample),
   Theorem 10 (soundness under faithfulness + reliable CI tests). */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["mmpc"] = {
  name: "Max-Min Parents and Children (MMPC)",
  oneLiner: "For a chosen target variable, grow a candidate neighbour set by repeatedly admitting the variable whose weakest (minimum) association with the target — measured over every conditioning subset already in the set — is the strongest (maximum), then prune any candidate that some subset can make independent of the target.",
  basedOnText: "MMPC is a local, constraint-based building block: instead of learning a whole graph, it recovers just the Parents-and-Children (PC) set of one target node — its direct neighbours, left unoriented. It is the parent/child-discovery routine later combined with hill-climbing to form the hybrid MMHC algorithm.",

  assumptions: [
    "<b>Faithfulness</b> — every (in)dependence in the data reflects the structure of the true DAG, so a variable directly linked to the target can never be screened off from it.",
    "<b>Reliable CI tests and association measure</b> — a statistical test decides independence at level α, and a numeric association score ranks how strongly two variables depend given a conditioning set.",
    "<b>A single target T is fixed</b> — MMPC discovers the neighbours of one node; running it for every node (with symmetry correction) yields all neighbourhoods.",
    "<b>Causal sufficiency</b> is the usual backdrop for the soundness guarantee (no hidden common causes)."
  ],
  input: "A dataset over variables V, a chosen target T ∈ V, a CI test Indep(X,T | Z) at level α, an association score assoc(X;T | Z), and an optional cap c_max on the conditioning-set size.",
  output: "<b>PC(T)</b> — the set of Parents and Children of T (its direct neighbours in the skeleton), <i>without</i> any edge orientation.",

  idea: [
    "MMPC reframes neighbour discovery as a search for the variables that <i>stay</i> associated with the target no matter what we condition on. A true neighbour of T can never be made independent of T by conditioning on other variables; a non-neighbour eventually can. So MMPC keeps the ones that resist screening and discards the rest.",
    "The clever part is the <b>Max-Min heuristic</b> used to decide who to admit next. For each outside variable X it first asks: across all subsets Z of the current candidate set, what is the <i>weakest</i> association assoc(X;T | Z) it can be pushed to — its <b>minimum</b> association? A variable whose minimum is still high has survived its hardest test. MMPC then admits the variable with the <b>maximum</b> such minimum — the 'max-min' pick. This greedily grabs the most robustly dependent variable first.",
    "The forward stage repeats this admission until the best remaining minimum association is essentially zero (the candidate can already be screened off), at which point growth stops.",
    "Forward selection can let in <b>false positives</b> — variables that looked dependent before the set was large enough to screen them. So a <b>backward stage</b> re-examines every admitted candidate: if some subset of the others makes it independent of T, it is dropped. The survivors are PC(T)."
  ],

  steps: [
    "<b>Initialise.</b> Set the candidate parent-children set CPC ← ∅ for the chosen target T.",
    "<b>Forward / max-min admission.</b> For every variable X not yet in CPC (and X ≠ T), compute its <i>minimum</i> association with T over all conditioning subsets Z ⊆ CPC (with |Z| ≤ c_max): m(X) = min<sub>Z</sub> assoc(X;T | Z). This is the association under the conditioning set that screens X most.",
    "<b>Pick the max-min variable.</b> Choose X* with the largest minimum association, X* ∈ argmax<sub>X</sub> m(X) (ties broken arbitrarily). If m(X*) indicates independence (its minimum association has dropped to zero), <b>stop the forward stage</b>.",
    "<b>Admit it.</b> Otherwise add X* to the set: CPC ← CPC ∪ {X*}. Adding X* enlarges the pool of conditioning subsets available for testing the remaining variables next round.",
    "<b>Repeat</b> the max-min admission until no outside variable keeps a non-zero minimum association — the forward stage has stabilised.",
    "<b>Backward / symmetry-free pruning.</b> For every X currently in CPC, search for a subset Z ⊆ CPC \\ {X} such that Indep(X, T | Z) holds. If one exists, X was a false positive admitted before the set grew — remove it: CPC ← CPC \\ {X}.",
    "<b>Return PC(T) = CPC</b>, the unoriented direct neighbours of T.",
    "<b>(Symmetry correction, when MMPC is run for every node.)</b> Keep X in PC(T) only if T is also returned in PC(X). This drops variables spuriously retained on one side and is needed for the soundness guarantee."
  ],

  keyConcepts: [
    { term: "Parents-and-Children set PC(T)", def: "The direct neighbours of T in the underlying DAG — its parents and its children together — without distinguishing or orienting them. MMPC's whole output." },
    { term: "Association score assoc(X;T | Z)", def: "A number measuring how strongly X and T depend on each other given Z. In the paper it is built from the CI-test p-value: it is set to 0 when the test declares independence (p > α), and otherwise grows with dependence. Higher means 'more dependent'." },
    { term: "Minimum association (the 'min')", def: "For a candidate X, the smallest association it can be driven to over all conditioning subsets of the current set. It captures the subset that screens X off most — X's hardest test so far." },
    { term: "Max-min selection (the 'max')", def: "Admit the candidate whose minimum association is the largest. This is the variable that best resists being screened off, i.e. the most robustly dependent on T." },
    { term: "Forward stage", def: "Greedy growth: repeatedly admit the max-min variable until the best remaining minimum association reaches zero (independence)." },
    { term: "Backward stage", def: "Cleanup: remove any admitted candidate that some subset of the others can render independent of T — eliminating false positives the forward stage let in." },
    { term: "Symmetry correction", def: "Across runs, keep X ∈ PC(T) only if T ∈ PC(X). Required for soundness so a one-sided spurious neighbour is discarded." }
  ],

  animation: {
    title: "MMPC on the paper's Example 20: target T with candidate variables {A,B,C} (Fig.44 true DAG).",
    nodes: [
      { id: "T", x: 0.5, y: 0.12 },
      { id: "A", x: 0.32, y: 0.5 },
      { id: "B", x: 0.7, y: 0.5 },
      { id: "C", x: 0.5, y: 0.9 }
    ],
    edges: [],
    steps: [
      { caption: "<b>Goal.</b> Find PC(T), the direct neighbours of target T, chosen from {A,B,C}. Start with an empty candidate set CPC = ∅. (Associations below are the paper's signed scores — more negative = stronger dependence, so the 'maximum minimum' is the value closest to the strong end.)", ops: [{ op: "highlightNodes", ids: ["T"], cls: "target" }, { op: "set", name: "PC(T)", items: [] }, { op: "badge", text: "CPC = ∅", kind: "info" }] },
      { caption: "<b>Forward round 1 — measure each candidate.</b> With CPC empty, the only conditioning subset is ∅. Compute each candidate's minimum association with T: assoc(A;T|∅) = −0.19, assoc(B;T|∅) = −0.20, assoc(C;T|∅) = −0.10.", ops: [{ op: "highlightNodes", ids: ["A", "B", "C"], cls: "hl" }, { op: "score", text: "min: A=−0.19, B=−0.20, C=−0.10" }, { op: "badge", text: "forward (max-min)", kind: "info" }] },
      { caption: "<b>Max-min pick = C.</b> Among the minimum associations, the largest (the value closest to zero from this set, the max of the minima per the paper) is −0.10, attained by C. C is the most robustly dependent, so it is admitted first.", ops: [{ op: "score", text: "argmax min = C (−0.10)" }, { op: "badge", text: "admit C", kind: "good" }, { op: "highlightNodes", ids: ["C"], cls: "pick" }, { op: "addEdge", from: "T", to: "C", type: "undirected" }, { op: "set", name: "PC(T)", items: ["C"] }] },
      { caption: "<b>Forward round 2.</b> Now CPC = {C}, so candidates may be conditioned on ∅ or {C}. Re-evaluate minimum associations: A's minimum is −0.15 (attained at Z = {C}), B's minimum is −0.20.", ops: [{ op: "highlightNodes", ids: ["A", "B"], cls: "hl" }, { op: "testCI", x: "A", y: "T", z: ["C"], result: "dep" }, { op: "score", text: "min: A=−0.15 (Z={C}), B=−0.20" }] },
      { caption: "<b>Max-min pick = A.</b> The larger minimum is A's −0.15, so A is admitted next. CPC grows to {C, A}.", ops: [{ op: "score", text: "argmax min = A (−0.15)" }, { op: "badge", text: "admit A", kind: "good" }, { op: "highlightNodes", ids: ["A"], cls: "pick" }, { op: "addEdge", from: "T", to: "A", type: "undirected" }, { op: "set", name: "PC(T)", items: ["C", "A"] }] },
      { caption: "<b>Forward round 3.</b> Only B remains. Its minimum association with T is −0.20 (attained at Z = {C}), still a genuine dependence, so B is admitted too. CPC = {C, A, B}.", ops: [{ op: "highlightNodes", ids: ["B"], cls: "hl" }, { op: "testCI", x: "B", y: "T", z: ["C"], result: "dep" }, { op: "score", text: "min B = −0.20 → admit B" }, { op: "badge", text: "admit B", kind: "good" }, { op: "highlightNodes", ids: ["B"], cls: "pick" }, { op: "addEdge", from: "T", to: "B", type: "undirected" }, { op: "set", name: "PC(T)", items: ["C", "A", "B"] }] },
      { caption: "<b>Forward stage stabilises.</b> No outside variable is left with a non-zero minimum association, so growth stops. The candidate set is CPC = {A, B, C} — but forward selection can include false positives, so a cleanup stage follows.", ops: [{ op: "badge", text: "forward done: CPC = {A,B,C}", kind: "good" }, { op: "set", name: "PC(T)", items: ["A", "B", "C"] }] },
      { caption: "<b>Backward stage begins.</b> For each X in CPC, look for a subset Z ⊆ CPC\\{X} that makes X independent of T. Such a subset would expose X as a spurious neighbour admitted before the set was large enough to screen it.", ops: [{ op: "badge", text: "backward (pruning)", kind: "info" }] },
      { caption: "<b>Test A.</b> Conditioning on the rest, {B, C}, makes A independent of T: Indep(A, T | {B,C}) holds. A was a false positive — the larger conditioning set screens it off.", ops: [{ op: "highlightNodes", ids: ["A"], cls: "hl" }, { op: "testCI", x: "A", y: "T", z: ["B", "C"], result: "indep" }, { op: "score", text: "A ⫫ T | {B,C}" }] },
      { caption: "<b>Remove A.</b> A is dropped from the set: CPC = {B, C}.", ops: [{ op: "badge", text: "remove A (false positive)", kind: "bad" }, { op: "removeEdge", from: "T", to: "A" }, { op: "set", name: "PC(T)", items: ["B", "C"] }] },
      { caption: "<b>Test the survivors.</b> No subset of {B,C}\\{B} = {C} separates B from T, and likewise none separates C from T — both resist every screening test, so both stay.", ops: [{ op: "highlightNodes", ids: ["B", "C"], cls: "hl" }, { op: "testCI", x: "B", y: "T", z: ["C"], result: "dep" }, { op: "testCI", x: "C", y: "T", z: ["B"], result: "dep" }, { op: "score", text: "B, C inseparable from T" }] },
      { caption: "<b>Return PC(T) = {B, C}.</b> The recovered direct neighbours of T, left unoriented. (Run for every node and add the symmetry correction — keep X only if T ∈ PC(X) — to assemble the full skeleton, the seed for MMHC.)", ops: [{ op: "highlightNodes", ids: ["T", "B", "C"], cls: "good" }, { op: "highlightEdges", edges: [["T", "B"], ["T", "C"]], cls: "good" }, { op: "badge", text: "PC(T) = {B, C}", kind: "good" }, { op: "set", name: "PC(T)", items: ["B", "C"] }] }
    ]
  },

  complexity: "Each forward admission re-scores every outside variable over all conditioning subsets of the current candidate set, so cost grows with the number of variables and (exponentially) with the candidate-set size; the cap c_max on |Z| keeps the subset enumeration and CI tests tractable and reliable. In practice it is efficient on sparse problems because PC sets stay small, which is what makes MMPC usable as the inner loop of MMHC.",
  strengths: [
    "<b>Local</b> — discovers one node's neighbours without learning the whole graph, so it scales to high-dimensional problems.",
    "The max-min heuristic greedily admits the most robustly dependent variable first, and the backward stage removes false positives the forward greed lets in.",
    "<b>Sound:</b> under faithfulness and reliable CI tests it returns a superset in forward, and pruning yields exactly PC(T) (Theorem 10), with symmetry correction guaranteeing correctness across nodes.",
    "Serves as the proven parent/child-discovery building block of the hybrid MMHC algorithm."
  ],
  limitations: [
    "Relies on accurate CI tests and the association measure; errors propagate as in any constraint-based method.",
    "Conditioning over subsets of the growing candidate set is costly without the c_max cap, and large conditioning sets make tests unreliable.",
    "Returns unoriented neighbours only — orientation requires a further step (e.g. the hill-climbing phase of MMHC).",
    "Without the symmetry correction a variable can be spuriously retained on one side (Fig.45 counterexample): C is kept for T unless T also appears in PC(C)."
  ],
  notes: "MMPC is the neighbour-finding subroutine of <b>MMHC (Max-Min Hill-Climbing)</b>: MMPC first constrains the possible edges per node, then a scored hill-climbing search orients them, giving a hybrid constraint-plus-score method. The association score in the paper is derived from the CI-test p-value and set to zero on independence, so 'maximising the minimum association' literally means 'keep the variable that no conditioning subset can screen off'.",
  figureRefs: "Paper §4.11 (pp.77–79): Algorithm 15 (MMPC for a single target T), Definition 9 (association score from the CI p-value), Example 20 (worked forward + backward run on {A,B,C}), Fig.44 (true DAG of Example 20), Fig.45 (symmetry-correction counterexample), Theorem 10 (soundness under faithfulness and reliable CI tests)."
};
