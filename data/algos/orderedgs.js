/* OrderedGS — Ordered Grow-Shrink (GSMN*). Grounded in §5.7 (pp.340-342):
   Algorithm 99 (OrderedGS), Algorithm 100 (I_OrderedGS — independence oracle with
   propagation/symmetry), Definition 49 (examination order π and grow order λ^X from
   average marginal log p-values), Remark 29 (why p-sorting helps), Example 103 — the
   complete eight-variable run with true DAG + moral graph in Fig.214 and the
   propagation/grow-order detail for target X4 in Fig.215. Method learns the MORAL
   GRAPH (undirected) and does NOT orient. Built on GS (§4.8) and MMPC-style ordering. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["orderedgs"] = {
  name: "Ordered Grow-Shrink (OrderedGS / GSMN*)",
  oneLiner: "A Grow-Shrink Markov-blanket learner that imposes two p-value-based orderings — an examination order over the variables and a per-target grow order over the candidates — and reuses blankets already found, so the strongest dependencies are tested first and many conditional-independence tests are skipped entirely.",
  basedOnText: "OrderedGS (also called GSMN*) builds directly on the Grow-Shrink (GS) strategy for Markov-blanket discovery, adding two ordering ideas to make blanket discovery more reliable and cheaper. It is constraint-based and outputs the undirected moral graph (it does not orient edges).",

  assumptions: [
    "<b>Faithfulness</b> — every (in)dependence in the data reflects the true DAG, so each variable's Markov blanket is exactly recoverable from CI tests.",
    "<b>Causal sufficiency</b> — no hidden common causes; all relevant variables are observed.",
    "<b>Reliable CI tests</b> — a CI test returns a p-value p(X,Y | Z); the pair is declared <i>dependent</i> if p(X,Y | Z) ≤ α and <i>independent</i> otherwise (threshold α, e.g. 0.05).",
    "<b>Marginal p-values are informative about closeness</b> — a small marginal p-value p<sub>XY</sub> = p(X,Y | ∅) typically signals a strong, often <i>direct</i>, dependence (the 'folk theorem' that direct dependence is stronger than indirect), so sorting by it puts likely neighbours first.",
    "A variable's Markov blanket (parents, children, and spouses) is unique and renders it independent of all other variables."
  ],
  input: "A dataset 𝒟 over variables V, a CI test returning a p-value p(X,Y | Z), and a threshold α.",
  output: "An <b>undirected graph 𝓗</b> on V — the <b>moral graph</b> of the data-generating DAG (each variable joined to every member of its Markov blanket) — together with a Markov blanket Mb(X) for every X. OrderedGS does <i>not</i> orient edges.",

  idea: [
    "OrderedGS keeps the proven two-pass <b>Grow-Shrink</b> core for one target: a <b>grow</b> phase that adds any variable still dependent on the target given the current working set S, and a <b>shrink</b> phase that drops any member that becomes independent given the rest. What it changes is the <i>order</i> in which work is done, plus a way to <i>reuse</i> results — both driven by marginal p-values.",
    "<b>Ordering idea 1 — the examination order π.</b> Before anything, compute every variable's average marginal (log) p-value against all the others (Definition 49). Sorting <i>increasingly</i> by this average gives π: variables with the strongest overall marginal dependence are examined first. Processing the most 'connected' variables early means their blankets are available to help everyone examined later.",
    "<b>Ordering idea 2 — the grow order λ<sup>X</sup>.</b> For the current target X, sort the other variables increasingly by their marginal p-value p<sub>XY</sub> with X. Small p<sub>XY</sub> usually means a strong, direct dependence, so likely neighbours are offered to the grow phase first (Remark 29). Reaching true blanket members early lets the conditioning set become informative quickly, which screens off non-neighbours sooner and shrinks both the number and the size of the CI tests.",
    "<b>Result reuse (the real saver).</b> Let A be the variables already examined. For the current X, split A into T = {Y ∈ A : X ∈ Mb(Y)} (those whose finished blanket already contains X) and F = {Y ∈ A : X ∉ Mb(Y)}. By symmetry of the blanket relation, every Y ∈ T must satisfy X ∈ Mb(Y) ⇔ Y ∈ Mb(X), so Y can be added to Mb(X) with <b>no CI test</b>; every Y ∈ F can be left out with no test. T and F are moved to the <i>end</i> of λ<sup>X</sup> so the genuinely unknown candidates are tested first and the certain ones are merely confirmed.",
    "Because the grow phase always 'follows your newest neighbour' (Algorithm 99 line 12 moves the most recently added blanket member to the front of π), the next target inherits an already-rich conditioning set — neighbours tend to share neighbours — so propagation information is reused and the test sequence shortens. The assembled neighbour relations give the undirected moral graph 𝓗; orientation is left to a later step."
  ],

  steps: [
    "<b>Compute marginals.</b> For every pair compute the marginal p-value p<sub>XY</sub> = p(X,Y | ∅).",
    "<b>Build the examination order π (Definition 49).</b> For each X average its marginal log p-values, (1/(|V|−1))·Σ<sub>Y</sub> log p<sub>XY</sub>, and sort variables <i>increasingly</i> by this average. Low average = strong overall marginal dependence → examined first. Start with an edgeless graph 𝓗 and the set of examined targets A = ∅.",
    "<b>Take the next target X in π.</b> Form the propagation sets from already-examined variables A: T = {Y ∈ A : X ∈ Mb(Y)} and F = {Y ∈ A : X ∉ Mb(Y)}.",
    "<b>Build the grow order λ<sup>X</sup>.</b> Sort the other variables increasingly by p<sub>XY</sub> (strongest marginal dependence first), then move all of T and then all of F to the <i>end</i> — so unknown candidates are tested before the already-decided ones.",
    "<b>Grow (S ← ∅).</b> Walk candidates Y in λ<sup>X</sup> order. Use the ordered oracle I<sub>OrderedGS</sub>(X,Y | S; T,F): if Y ∈ T return <i>dependent</i> by symmetry (no test); if Y ∈ F return <i>independent</i> by symmetry (no test); otherwise run the CI test and call it dependent iff p(X,Y | S) ≤ α. On 'dependent', set S ← S ∪ {Y} and remember Y as the most recent addition.",
    "<b>Follow your newest neighbour.</b> Whenever a Y is added, move it to the front of π (Algorithm 99 line 12) so the next target reuses this fresh, informative blanket member — accelerating later discovery.",
    "<b>Shrink.</b> For each Y currently in S, test independence given the rest, I<sub>OrderedGS</sub>(X,Y | S \\ {Y}; T,F): if independent, Y was a false positive — remove it. What survives is Mb(X) ← S.",
    "<b>Update the graph.</b> Add an <i>undirected</i> edge X − Y to 𝓗 for every Y ∈ Mb(X), then record X as examined: A ← A ∪ {X}.",
    "<b>Repeat</b> for every target in π. Because each later target reuses earlier blankets via T/F, fewer and fewer fresh CI tests are needed.",
    "<b>Return 𝓗</b> (the undirected moral graph) and {Mb(X)}<sub>X∈V</sub>. No edges are oriented."
  ],

  keyConcepts: [
    { term: "Examination order π", def: "The order in which variables are taken as targets. Built by sorting increasingly on each variable's average marginal log p-value (Definition 49); strongest overall marginal dependence first, so well-connected variables are processed early and their blankets help later targets." },
    { term: "Grow order λ^X", def: "For the current target X, the order in which candidates are offered to the grow phase: sort increasingly by the marginal p-value p_XY (likely direct neighbours first), then push the already-decided sets T and F to the end." },
    { term: "Marginal p-value p_XY", def: "The CI-test p-value of X and Y with an empty conditioning set, p(X,Y | ∅). Small p_XY signals strong — and usually direct — dependence, which is why OrderedGS sorts by it (Remark 29)." },
    { term: "Propagation sets T and F", def: "Among already-examined variables A: T = {Y ∈ A : X ∈ Mb(Y)} (already known to neighbour X) and F = {Y ∈ A : X ∉ Mb(Y)} (already known not to). By blanket symmetry both can be decided for X without any CI test." },
    { term: "Symmetric oracle I_OrderedGS", def: "The independence call used during grow/shrink (Algorithm 100): if Y ∈ T return dependent, if Y ∈ F return independent — both by the symmetry Y ∈ Mb(X) ⇔ X ∈ Mb(Y) — otherwise run the real CI test against α. This is how tests get skipped." },
    { term: "Follow-your-newest-neighbour", def: "After each addition, the new blanket member is moved to the front of π (Algorithm 99 line 12). Neighbours share neighbours, so the next target starts from an informative, reusable conditioning set." },
    { term: "Moral graph 𝓗", def: "The undirected output: each variable joined to every member of its Markov blanket. Under reliable CI tests this coincides with the moral graph of the true DAG. OrderedGS stops here — it does not orient." }
  ],

  animation: {
    title: "OrderedGS on the paper's Example 103 (eight variables, Fig.214). Learning the moral graph; spotlight on target X4 (Fig.215). Contrast: how the ordering + reuse skip the false positive plain GS would chase.",
    nodes: [
      { id: "X1", x: 0.10, y: 0.30 },
      { id: "X7", x: 0.40, y: 0.06 },
      { id: "X4", x: 0.18, y: 0.55 },
      { id: "X0", x: 0.46, y: 0.45 },
      { id: "X5", x: 0.66, y: 0.45 },
      { id: "X6", x: 0.90, y: 0.30 },
      { id: "X3", x: 0.55, y: 0.82 },
      { id: "X2", x: 0.88, y: 0.82 }
    ],
    edges: [],
    steps: [
      { caption: "<b>Setup.</b> Eight variables; the target is the undirected <b>moral graph</b> of the true DAG (Fig.214). Start with an edgeless graph 𝓗 and no examined targets (A = ∅). First, compute every pairwise marginal p-value p<sub>XY</sub> = p(X,Y | ∅).", ops: [{ op: "badge", text: "𝓗 = empty, A = ∅", kind: "info" }, { op: "highlightNodes", ids: ["X1","X7","X4","X0","X5","X6","X3","X2"], cls: "hl" }] },
      { caption: "<b>Examination order π (Definition 49).</b> Average each variable's marginal log p-values and sort increasingly — strongest overall marginal dependence first. The paper's run gives π = [X5, X7, X0, X4, X3, X2, X6, X1]. Low average for X5 means it is strongly dependent on many variables, so it is examined first.", ops: [{ op: "set", name: "π (exam order)", items: ["X5","X7","X0","X4","X3","X2","X6","X1"] }, { op: "badge", text: "π built by avg log p-value", kind: "info" }] },
      { caption: "<b>Examine the early targets.</b> Running grow-shrink for X5, then X7, then X0 fixes their blankets: Mb(X5) = {X7, X6, X3, X0}, Mb(X7) = {X4, X0, X5}, Mb(X0) = {X7, X3, X5}. Their moral edges are added to 𝓗. Now A = {X5, X7, X0}.", ops: [{ op: "addEdge", from: "X5", to: "X7", type: "undirected" }, { op: "addEdge", from: "X5", to: "X6", type: "undirected" }, { op: "addEdge", from: "X5", to: "X3", type: "undirected" }, { op: "addEdge", from: "X5", to: "X0", type: "undirected" }, { op: "addEdge", from: "X7", to: "X4", type: "undirected" }, { op: "addEdge", from: "X7", to: "X0", type: "undirected" }, { op: "addEdge", from: "X0", to: "X3", type: "undirected" }, { op: "set", name: "A (examined)", items: ["X5","X7","X0"] }, { op: "badge", text: "Mb(X5),Mb(X7),Mb(X0) done", kind: "good" }] },
      { caption: "<b>Current target: X4.</b> Build its propagation sets from the examined A = {X5, X7, X0}. X7's finished blanket already contains X4, so X7 ∈ <b>T</b> (known neighbour, by symmetry). X5 and X0 do <i>not</i> contain X4, so they go in <b>F</b> (known non-neighbours). T = {X7}, F = {X5, X0} (Fig.215a).", ops: [{ op: "highlightNodes", ids: ["X4"], cls: "target" }, { op: "set", name: "T (already neighbours)", items: ["X7"] }, { op: "set", name: "F (already non-nbrs)", items: ["X5","X0"] }, { op: "badge", text: "reuse: T={X7}, F={X5,X0}", kind: "info" }] },
      { caption: "<b>Grow order λ<sup>X4</sup>.</b> Sort the rest increasingly by marginal p-value with X4 → [X1, X7, X0, X3, X5, X6, X2], then move T and F to the end. The explicit order used is λ<sup>X4</sup> = [X1, X3, X6, X2, X7, X5, X0] — the genuinely unknown candidates are tested first; the already-decided X7, X5, X0 are confirmed last.", ops: [{ op: "set", name: "λ^X4 (grow order)", items: ["X1","X3","X6","X2","X7","X5","X0"] }, { op: "badge", text: "unknowns first, T/F last", kind: "info" }] },
      { caption: "<b>Grow X4 (S = ∅): candidate X1.</b> X1 is in neither T nor F, so a real CI test is performed. X4 and X1 are <i>dependent</i> given S = ∅, so X1 is added. S = {X1}. (X1 is the strongest marginal partner of X4, surfaced first by λ<sup>X4</sup>.)", ops: [{ op: "testCI", x: "X4", y: "X1", z: [], result: "dep" }, { op: "highlightNodes", ids: ["X1"], cls: "add" }, { op: "set", name: "S = Mb(X4)", items: ["X1"] }, { op: "badge", text: "CI test → add X1", kind: "good" }] },
      { caption: "<b>Grow: X3, X6, X2.</b> These unknown candidates are tested next against X4 given S = {X1}. Each comes back <i>independent</i> — they are screened off — so none is admitted. Plain GS, scanning in an arbitrary order, could easily have added one of these as an early false positive before a true neighbour arrived.", ops: [{ op: "testCI", x: "X4", y: "X3", z: ["X1"], result: "indep" }, { op: "testCI", x: "X4", y: "X6", z: ["X1"], result: "indep" }, { op: "testCI", x: "X4", y: "X2", z: ["X1"], result: "indep" }, { op: "highlightNodes", ids: ["X3","X6","X2"], cls: "dim" }, { op: "set", name: "S = Mb(X4)", items: ["X1"] }] },
      { caption: "<b>Contrast with plain GS.</b> Plain GS has no reuse: it would still run a full CI test on X7, X5 and X0 — and a mis-ordered scan can pull a non-neighbour like X0 into S before X7 (a real neighbour) is seen, forcing the shrink phase to clean it up. OrderedGS instead trusts its propagation sets.", ops: [{ op: "highlightNodes", ids: ["X0"], cls: "hl" }, { op: "badge", text: "GS would test X7,X5,X0 + risk a false +", kind: "bad" }] },
      { caption: "<b>Grow: X7 — added with NO test.</b> X7 ∈ T, so the symmetric oracle I<sub>OrderedGS</sub> returns <i>dependent</i> immediately (X4 ∈ Mb(X7) ⇔ X7 ∈ Mb(X4)). X7 joins the blanket for free. S = {X1, X7}. This is the test OrderedGS saves over GS.", ops: [{ op: "testCI", x: "X4", y: "X7", z: ["X1"], result: "dep" }, { op: "highlightNodes", ids: ["X7"], cls: "add" }, { op: "set", name: "S = Mb(X4)", items: ["X1","X7"] }, { op: "badge", text: "X7 ∈ T → added, 0 CI tests", kind: "good" }] },
      { caption: "<b>Grow: X5, X0 — rejected with NO test.</b> Both are in F, so the oracle returns <i>independent</i> by symmetry — no CI test is run for either. Grow ends with S = {X1, X7}.", ops: [{ op: "highlightNodes", ids: ["X5","X0"], cls: "dim" }, { op: "set", name: "S = Mb(X4)", items: ["X1","X7"] }, { op: "badge", text: "X5,X0 ∈ F → skipped, 0 CI tests", kind: "good" }] },
      { caption: "<b>Shrink.</b> Re-test each member of S = {X1, X7} against X4 given the other. Neither X1 (given X7) nor X7 (given X1) becomes independent, so nothing is removed — the ordering admitted no false positives to clean up. <b>Mb(X4) = {X1, X7}.</b>", ops: [{ op: "testCI", x: "X4", y: "X1", z: ["X7"], result: "dep" }, { op: "testCI", x: "X4", y: "X7", z: ["X1"], result: "dep" }, { op: "highlightNodes", ids: ["X1","X7"], cls: "add" }, { op: "set", name: "S = Mb(X4)", items: ["X1","X7"] }, { op: "badge", text: "Mb(X4) = {X1,X7}", kind: "good" }] },
      { caption: "<b>Update 𝓗 and finish.</b> Add undirected edges X4 − X1 and X4 − X7 to the moral graph (Fig.215b), and mark X4 examined. Repeating over all targets in π yields the full moral graph — learned with far fewer CI tests than GS, and OrderedGS leaves it <i>undirected</i> (no orientation step).", ops: [{ op: "addEdge", from: "X4", to: "X1", type: "undirected" }, { op: "addEdge", from: "X4", to: "X7", type: "undirected" }, { op: "highlightEdges", edges: [["X4","X1"],["X4","X7"]], cls: "good" }, { op: "set", name: "A (examined)", items: ["X5","X7","X0","X4"] }, { op: "badge", text: "moral graph 𝓗 (undirected) returned", kind: "good" }] }
    ]
  },

  complexity: "Like GS, each target costs on the order of O(n) CI tests across its grow and shrink loops, giving roughly O(n²) tests over n variables in the worst case. The two orderings and the propagation sets T/F cut this substantially in practice: reaching true neighbours early (via λ^X and 'follow your newest neighbour') screens off non-neighbours with smaller, more informative conditioning sets, while T/F reuse decides already-examined variables with zero tests. Cost is dominated by blanket sizes rather than the full graph.",
  strengths: [
    "Two simple, cheap p-value orderings put likely direct neighbours first, so true blanket members arrive early and conditioning sets become informative sooner — fewer and smaller CI tests than plain GS.",
    "<b>Result reuse via symmetry</b>: already-examined variables are decided through T and F with no CI test at all, a direct saving over GS which re-tests everything.",
    "Inherits the clean, sound grow-then-shrink design of GS; reaching neighbours early means the shrink phase has fewer false positives to remove.",
    "Constraint-based — needs only a CI test and a threshold α, no scoring function or parametric assumption."
  ],
  limitations: [
    "Outputs only the <b>undirected moral graph</b> — it does not orient edges; recovering a DAG/CPDAG needs a separate orientation step.",
    "Still sensitive to CI-test errors; an early mistake can cascade, and the orderings rely on marginal p-values being a good proxy for direct dependence (the 'folk theorem' can fail).",
    "Result reuse trusts earlier blankets — a wrong blanket for an early target can be propagated into T/F and reused without re-checking under sampling noise.",
    "Assumes faithfulness and causal sufficiency (no hidden confounders), as with other constraint-based methods."
  ],
  notes: "OrderedGS is the GSMN* algorithm of Bromberg et al. ([67]); it is the ordering-aware refinement of Grow-Shrink (§4.8) and shares the marginal-association-ranking idea with MMPC (§4.11). A large related-work family accelerates grow-shrink the same way: Fast-IAMB ranks candidates and admits several per iteration; Fit-IAMB and S-IAMB add interleaving, redundancy pruning and a symmetry check during forward selection to curb false-positive cascades; λ-IAMB swaps the dependence statistic for conditional entropy with a gap-controlled rule. The reused independence call is Algorithm 100 (I_OrderedGS), which short-circuits via blanket symmetry before ever touching the data.",
  figureRefs: "Paper §5.7 (pp.340-342): Algorithm 99 (OrderedGS), Algorithm 100 (I_OrderedGS — symmetric independence oracle with propagation), Definition 49 (examination order π and grow order λ^X from average marginal log p-values), Remark 29 (why p-value sorting helps), Example 103 (the complete eight-variable run), Fig.214 (true DAG and its moral-graph learning target), Fig.215 (propagation sets T={X7}, F={X5,X0} and grow order for target X4)."
};
