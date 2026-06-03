/* GS — Grow-Shrink. Grounded in §4.8 (pp.65-68): Algorithm 11 (GS-Markov-Blanket),
   Algorithm 12 (GS-Structure), and the seven-variable worked example in Fig.32 (a-h),
   target T with true edges A→T, B→T, B→C, T→C, C→D, E→D, G→D. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["gs"] = {
  name: "Grow-Shrink (GS)",
  oneLiner: "For each variable, build its Markov blanket in two passes — a GROW pass that greedily adds any variable still dependent on it, then a SHRINK pass that removes the false positives that turn out independent given the rest — and assemble the blankets into a network that is finally oriented.",
  basedOnText: "GS is a constraint-based, Markov-blanket-centred method: instead of testing every pair globally (as PC does), it first localises each variable's relevant neighbourhood — its Markov blanket — using a grow-then-shrink loop of conditional-independence tests, and only then stitches and orients the global structure.",

  assumptions: [
    "<b>Faithfulness</b> — every (in)dependence seen in the data reflects the true graph, so a variable's Markov blanket is exactly recoverable from CI tests.",
    "<b>Causal sufficiency</b> — no hidden common causes; all relevant variables are observed.",
    "<b>Reliable CI tests</b> — independence is judged by a statistical test (e.g. χ²/G², partial correlation); ideally a perfect 'oracle'.",
    "A variable's Markov blanket (its parents, children, and the other parents of its children) is unique and renders it independent of everything else."
  ],
  input: "A dataset over variables V and a conditional-independence (CI) test.",
  output: "A <b>Bayesian-network structure</b> (DAG / partially-directed graph): edges are recovered from the Markov blankets and then oriented with v-structures and rule propagation.",

  idea: [
    "GS rests on the idea of a <b>Markov blanket</b> Mb(X): the smallest set of variables that, once known, makes X independent of every other variable. In a Bayesian network this is exactly X's parents, its children, and the other parents of those children (its 'spouses'). If we know Mb(X) for every X, we almost know the graph.",
    "The blanket for one target X is found in two passes. <b>GROW</b>: start with an empty candidate set S and repeatedly scan the other variables; whenever some Y is still <i>dependent</i> on X given the current S, add Y to S. Keep looping until no addition is possible. This pass is greedy and deliberately over-inclusive — it may let in false positives.",
    "<b>SHRINK</b>: now go back through S and test each member Y for independence from X given <i>the rest of</i> S. If Y has become independent (it was only pulled in earlier because a true blanket member had not yet been added), it was a false positive — remove it. What survives is the true Mb(X).",
    "Once the blankets are known, GS builds the structure: X and Y are <b>neighbours</b> (directly connected) only if each lies in the other's blanket and they cannot be separated by a conditioning set drawn from the smaller blanket. Finally edges are oriented — colliders (v-structures) first, then the orientations are propagated by rules — to yield the network.",
    "Because every CI test conditions on a <i>local</i> blanket rather than on arbitrary global subsets, GS keeps conditioning sets small and the number of tests manageable."
  ],

  steps: [
    "<b>For each target variable X, find its Markov blanket (Algorithm 11).</b> Start with an empty candidate set S = ∅.",
    "<b>Grow phase.</b> Repeatedly loop over the remaining variables Y ∉ S ∪ {X}: if X is still dependent on Y given the current S (the CI test says <i>not</i> independent), add Y to S. Restart the scan after each addition and stop only when a full pass adds nothing.",
    "<b>Shrink phase.</b> For each Y currently in S, test X ⫫ Y given S \\ {Y} (the rest of the blanket). If they are independent, Y was a false positive — remove it from S. After this pass, S = Mb(X).",
    "<b>Repeat</b> the grow-shrink loop for every variable, giving a Markov blanket for each.",
    "<b>Recover neighbours (Algorithm 12).</b> For an ordered pair (X,Y) with Y ∈ Mb(X), search the smaller of the two blankets for a set Z that makes X ⫫ Y. If no such separator exists, X and Y are true neighbours — draw an (undirected) edge.",
    "<b>Orient v-structures.</b> For a triple X − Z − Y with X,Y non-adjacent, if Z is <i>not</i> in the separating set of X and Y, orient it as a collider X → Z ← Y.",
    "<b>Propagate orientations.</b> Apply Meek-style rules to direct any further edges that are logically forced (avoiding new colliders and cycles), and return the resulting Bayesian-network structure."
  ],

  keyConcepts: [
    { term: "Markov blanket Mb(X)", def: "The smallest set that shields X from all other variables: its parents, its children, and the other parents of its children. Knowing Mb(X) makes X independent of everything else." },
    { term: "Grow phase", def: "Greedy inclusion pass: add any variable that is still dependent on the target given the current candidate set. Over-inclusive on purpose — it can admit false positives." },
    { term: "Shrink phase", def: "Pruning pass: drop any candidate that becomes independent of the target given the rest of the set. This removes the false positives the grow phase let in." },
    { term: "False positive (in the blanket)", def: "A variable added during grow only because a genuine blanket member had not yet been included; once the set is complete it is screened off and shrink removes it." },
    { term: "Conditional-independence (CI) test", def: "A statistical check of whether X and Y share no extra information once a set Z is known. GS conditions on the local blanket, keeping Z small." },
    { term: "Neighbour recovery", def: "Two variables are directly linked only if each is in the other's blanket and no subset of the smaller blanket can separate them; otherwise the dependence is indirect." }
  ],

  animation: {
    title: "GS building the Markov blanket of target T (paper Fig. 32). True edges: A→T, B→T, B→C, T→C, C→D, E→D, G→D.",
    nodes: [
      { id: "A", x: 0.50, y: 0.06 },
      { id: "E", x: 0.18, y: 0.40 },
      { id: "T", x: 0.50, y: 0.40 },
      { id: "B", x: 0.84, y: 0.40 },
      { id: "D", x: 0.30, y: 0.72 },
      { id: "C", x: 0.62, y: 0.72 },
      { id: "G", x: 0.30, y: 0.97 }
    ],
    edges: [
      { from: "A", to: "T", type: "directed" },
      { from: "B", to: "T", type: "directed" },
      { from: "B", to: "C", type: "directed" },
      { from: "T", to: "C", type: "directed" },
      { from: "C", to: "D", type: "directed" },
      { from: "E", to: "D", type: "directed" },
      { from: "G", to: "D", type: "directed" }
    ],
    steps: [
      { caption: "<b>Pick a target.</b> We learn the Markov blanket of <b>T</b>. Start with an empty candidate set S = ∅. The grow phase will add anything still dependent on T; the shrink phase will later strip the false positives.", ops: [{ op: "highlightNodes", ids: ["T"], cls: "hl" }, { op: "set", name: "S = Mb(T)", items: [] }, { op: "badge", text: "GROW", kind: "info" }] },
      { caption: "<b>Grow:</b> test A against T given S = ∅. They are <i>dependent</i> (A is a parent of T), so A is admitted to the candidate blanket. S = {A}.", ops: [{ op: "testCI", x: "T", y: "A", z: [], result: "dep" }, { op: "highlightNodes", ids: ["A"], cls: "add" }, { op: "set", name: "S = Mb(T)", items: ["A"] }] },
      { caption: "<b>Grow:</b> test E given S = {A}. E is <i>independent</i> of T — it is far away (only an extra parent of D), so it is left out. S unchanged.", ops: [{ op: "testCI", x: "T", y: "E", z: ["A"], result: "indep" }, { op: "highlightNodes", ids: ["E"], cls: "dim" }, { op: "set", name: "S = Mb(T)", items: ["A"] }] },
      { caption: "<b>Grow:</b> test D given S = {A}. D looks <i>dependent</i> on T (information flows T→C→D while C is not yet in S), so D is added — even though it is really only an indirect link. S = {A, D}. (A false positive sneaks in.)", ops: [{ op: "testCI", x: "T", y: "D", z: ["A"], result: "dep" }, { op: "highlightNodes", ids: ["D"], cls: "add" }, { op: "set", name: "S = Mb(T)", items: ["A", "D"] }] },
      { caption: "<b>Grow:</b> test C given S = {A, D}. C is a child of T, so it is <i>dependent</i> and joins the set. S = {A, D, C}.", ops: [{ op: "testCI", x: "T", y: "C", z: ["A", "D"], result: "dep" }, { op: "highlightNodes", ids: ["C"], cls: "add" }, { op: "set", name: "S = Mb(T)", items: ["A", "D", "C"] }] },
      { caption: "<b>Grow:</b> test G given S = {A, D, C}. With C in the set, G is screened off and tests <i>independent</i> of T — rejected. S unchanged.", ops: [{ op: "testCI", x: "T", y: "G", z: ["A", "D", "C"], result: "indep" }, { op: "highlightNodes", ids: ["G"], cls: "dim" }, { op: "set", name: "S = Mb(T)", items: ["A", "D", "C"] }] },
      { caption: "<b>Grow:</b> test B given S = {A, D, C}. B is both a parent of T and a spouse (it co-parents C), so it stays <i>dependent</i> and is added. S = {A, D, C, B}. The grow phase ends — no further additions.", ops: [{ op: "testCI", x: "T", y: "B", z: ["A", "D", "C"], result: "dep" }, { op: "highlightNodes", ids: ["B"], cls: "add" }, { op: "set", name: "S = Mb(T)", items: ["A", "D", "C", "B"] }, { op: "badge", text: "grow done", kind: "good" }] },
      { caption: "<b>Shrink phase begins.</b> Now re-examine each member of S = {A, D, C, B}, testing it against T given <i>all the others</i>, to catch false positives.", ops: [{ op: "set", name: "S = Mb(T)", items: ["A", "D", "C", "B"] }, { op: "badge", text: "SHRINK", kind: "info" }] },
      { caption: "<b>Shrink:</b> test D given the rest, S \\ {D} = {A, C, B}. Now that C is in the conditioning set, the path T→C→D is blocked and D is <i>independent</i> of T — D was a false positive. Remove it.", ops: [{ op: "testCI", x: "T", y: "D", z: ["A", "C", "B"], result: "indep" }, { op: "highlightNodes", ids: ["D"], cls: "dim" }, { op: "removeEdge", from: "C", to: "D" }, { op: "removeEdge", from: "E", to: "D" }, { op: "removeEdge", from: "G", to: "D" }, { op: "set", name: "S = Mb(T)", items: ["A", "C", "B"] }] },
      { caption: "<b>Shrink:</b> A, C and B each remain <i>dependent</i> on T given the others, so all three stay. The blanket is settled: <b>Mb(T) = {A, C, B}</b> — parents A and B, child C, and spouse B (co-parent of C).", ops: [{ op: "testCI", x: "T", y: "C", z: ["A", "B"], result: "dep" }, { op: "highlightNodes", ids: ["A", "C", "B"], cls: "add" }, { op: "set", name: "S = Mb(T)", items: ["A", "C", "B"] }, { op: "badge", text: "Mb(T) = {A,C,B}", kind: "good" }] },
      { caption: "<b>Recover neighbours.</b> Using the blankets, A, B and C cannot be separated from T → they are true edges around T. The same blanket-based test elsewhere confirms B→C. The undirected skeleton around T is fixed.", ops: [{ op: "highlightEdges", edges: [["A","T"],["B","T"],["T","C"],["B","C"]], cls: "hl" }] },
      { caption: "<b>Orient.</b> Triple A → T ← B is a collider: A and B are non-adjacent and T is not in their separating set, so both arrows point into T. Propagation then directs the rest, returning the Bayesian-network structure.", ops: [{ op: "orient", from: "A", to: "T", type: "directed" }, { op: "orient", from: "B", to: "T", type: "directed" }, { op: "orient", from: "T", to: "C", type: "directed" }, { op: "orient", from: "B", to: "C", type: "directed" }, { op: "badge", text: "structure returned", kind: "good" }] }
    ]
  },

  complexity: "Each Markov-blanket search costs O(n) CI tests per variable in the grow/shrink loops, so the blanket phase is roughly O(n²) tests over n variables — far fewer than testing all subsets — with conditioning sets kept local and small. Cost is dominated by the size of the blankets rather than the global graph.",
  strengths: [
    "Localises the work: builds small Markov blankets instead of testing arbitrary global subsets, so conditioning sets stay small.",
    "Conceptually clean two-pass design — grow to over-include, shrink to remove false positives.",
    "Constraint-based: needs only CI tests, no scoring function or assumed parametric form.",
    "Scales better than naïve global CI search on sparse, high-dimensional data."
  ],
  limitations: [
    "Sensitive to CI-test errors and to the order in which variables are scanned during grow.",
    "The grow phase can admit several false positives before any blanket member arrives, and large interim conditioning sets weaken the tests.",
    "Assumes faithfulness and causal sufficiency (no hidden confounders).",
    "Like other constraint-based methods, an early mistaken test can cascade into wrong neighbours or orientations."
  ],
  notes: "GS popularised the Markov-blanket-first style of structure learning; the same grow-shrink idea underpins later local-discovery methods (IAMB and its variants, which interleave or reorder the inclusion/exclusion tests for robustness). It is also the basis for hybrid approaches that use the recovered blankets to seed a scoring search.",
  figureRefs: "Paper §4.8 (pp.65-68): Algorithm 11 (GS-Markov-Blanket, grow then shrink), Algorithm 12 (GS-Structure: neighbour recovery, v-structure orientation, rule propagation), and the seven-variable worked example Fig.32 (a-h) with target T."
};
