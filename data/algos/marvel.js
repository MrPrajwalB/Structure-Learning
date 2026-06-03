/* MARVEL — Mokhtarian et al. Recursive, removable-variable, CI-test-efficient
   constraint-based learner. Grounded in §4.53 (pp.254-258): Definition 28
   (removable node), Theorem 35 (removability characterization, Conditions (i)&(ii)),
   Fig.166 (local intuition), Algorithm 66 (MARVEL), and the five-variable worked
   Example 75 / Fig.167 (true DAG A→B, A→C, B→D, C→D, D→E) with milestones Fig.168(a-e). */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["marvel"] = {
  name: "MARVEL",
  oneLiner: "Recursively find a 'removable' variable — one you can delete without disturbing the independencies among the rest — learn all of its connections using only conditional-independence tests confined to its Markov boundary, orient what those tests force, then eliminate it and repeat on the smaller problem; this needs dramatically fewer (and smaller) CI tests than PC.",
  basedOnText: "MARVEL (Markov-boundary-based Recursive Variable ELimination) is a constraint-based method built around the idea of a removable variable. Rather than testing pairs globally, it peels the graph one variable at a time: at each round it identifies a variable whose deletion leaves all remaining independencies intact, recovers that variable's edges and v-structures with tests restricted to its Markov boundary, removes it, and recurses on what is left — sharply cutting the number and size of conditional-independence tests.",

  assumptions: [
    "<b>Faithfulness</b> — every (in)dependence seen in the data corresponds exactly to the structure of the true graph, so Markov boundaries and removability can be read off CI tests.",
    "<b>Causal sufficiency</b> — no hidden common causes; all relevant variables are observed.",
    "<b>Reliable CI tests</b> — independence is decided by a statistical test (e.g. χ²/G², partial correlation); ideally a perfect 'oracle' test.",
    "<b>Markov boundaries are available</b> — the algorithm assumes the Markov boundary Mb(X) of every variable (its parents, children, and co-parents/spouses) is known or precomputed for the P-map class; the structure is recovered from these local neighbourhoods."
  ],
  input: "A dataset D over variables V, a conditional-independence (CI) test, and the Markov boundary Mb(X) of each variable.",
  output: "A <b>PDAG</b> (partially-directed graph) representing the P-map / Markov-equivalence class of the true DAG — directed edges where orientation is forced, undirected edges elsewhere.",

  idea: [
    "PC tests every pair of variables and keeps growing the conditioning set; that is expensive because conditioning sets can become large and many subsets must be tried. MARVEL attacks the cost differently: it asks <i>which variable can I throw away right now without changing any of the independencies among the others?</i> Such a variable is called <b>removable</b>.",
    "Formally (Definition 28), X is <b>removable</b> if deleting it from the graph leaves all d-separations among the remaining variables unchanged — equivalently, the graph minus X is still a perfect map (P-map) of the marginal distribution. A leaf (a variable with no children) is always trivially removable; the interesting case is removing internal variables.",
    "Theorem 35 turns this into something testable using only the variable's local neighbourhood. X is removable iff, for every child Z of X: <b>(i)</b> every neighbour of X is also adjacent to Z (so the dependence that X created between a neighbour and Z survives when X is gone), and <b>(ii)</b> every co-parent of Z through X is itself a parent of Z. Both conditions are checked with CI tests whose conditioning sets stay inside Mb(X) — never the whole graph.",
    "The procedure is recursive. Order the current variables by the <i>size</i> of their Markov boundary (small boundaries first — they are the cheapest and most likely removable). Take the first removable one, draw its edges, orient the v-structures it is part of, then <b>eliminate</b> it: delete it from the graph, update the Markov boundaries of its old neighbours, and start over on the smaller variable set.",
    "Because every test conditions on a subset of one Markov boundary, and because each variable is fully resolved and then removed (so it is never re-examined), MARVEL performs far fewer CI tests — and tests with much smaller conditioning sets — than PC, while still returning the correct equivalence class."
  ],

  steps: [
    "<b>Initialise.</b> Create the learned graph G on all variables V with no edges. Assume the Markov boundary Mb(X) of every variable is known (Algorithm 66, line 1).",
    "<b>Order by boundary size.</b> Sort the current variables by increasing |Mb(X)| — variables with the smallest Markov boundary are tried first, because they are cheapest to test and most likely removable (line 3).",
    "<b>Identify the local neighbourhood.</b> For the candidate X, use the blanket characterizations to split Mb(X) into its <i>neighbours</i> N_X (true parents and children, the variables directly linked to X) and its <i>co-parents/spouses</i> Sp_X (lines 4–5).",
    "<b>Draw X's edges.</b> Add an undirected edge between X and every neighbour Z ∈ N_X in G (line 6).",
    "<b>Test removability — Condition (i).</b> For every pair of neighbours W, Z ∈ N_X, check (with conditioning sets U ⊆ Mb(X)\\{W,Z}, always including X) that W and Z stay dependent — i.e. every neighbour of X is also adjacent to every child Z of X (lines 7–8).",
    "<b>Test removability — Condition (ii).</b> If Condition (i) holds, for every collider X → Y ← T check that the co-parents are accounted for: each remaining neighbour Z is screened off appropriately given U ∪ {X,Y}. Together (i) and (ii) decide whether X is removable (lines 9–10).",
    "<b>If X is removable, orient and ELIMINATE it.</b> Use the co-parents and separating sets to orient all v-structures X → Y ← T that X is part of; orient any remaining X-incident edges as pointing <i>into</i> X; then delete X from V and from G and update the Markov boundaries of its former neighbours (lines 11–14).",
    "<b>Recurse.</b> Break out and restart the loop with the updated, smaller variable set and refreshed boundaries (lines 15–18). If no removable variable were found in a pass, the next candidate is tried; in a faithful P-map setting a removable variable always exists.",
    "<b>Return</b> the PDAG G once every variable has been processed — it represents the P-map equivalence class of the true DAG (line 19)."
  ],

  keyConcepts: [
    { term: "Removable variable (Definition 28)", def: "A variable X whose deletion leaves all d-separations (independencies) among the remaining variables unchanged — equivalently, the graph without X is still a P-map of the marginal distribution. Variables with no children are trivially removable." },
    { term: "Markov boundary Mb(X)", def: "The minimal set that shields X from all other variables: its parents, children, and co-parents (spouses). MARVEL confines every CI test for X to subsets of Mb(X), keeping conditioning sets small." },
    { term: "Neighbours N_X vs co-parents Sp_X", def: "Mb(X) splits into N_X — the variables directly connected to X (its parents and children) — and Sp_X — the co-parents of X's children. The split is used to draw edges and to orient v-structures." },
    { term: "Removability Conditions (i) & (ii) (Theorem 35)", def: "X is removable iff for every child Z: (i) every neighbour of X is also adjacent to Z (the X-induced link survives X's removal), and (ii) every co-parent of Z reached through X is itself a parent of Z. Both are checked with Mb(X)-local CI tests." },
    { term: "Recursive variable elimination", def: "After a removable X is fully resolved (edges + orientations), it is deleted and the boundaries of its neighbours are updated; the algorithm recurses on the smaller graph, so each variable is examined once and never revisited." },
    { term: "CI-test efficiency", def: "Because tests condition only on a Markov boundary and each variable is removed once solved, MARVEL needs far fewer and much smaller conditional-independence tests than PC's growing-subset search." }
  ],

  animation: {
    title: "MARVEL on the five-variable example (paper Example 75 / Fig. 167). True DAG: A→B, A→C, B→D, C→D, D→E. Boundaries: Mb(A)={B,C}, Mb(B)={A,C,D}, Mb(C)={A,B,D}, Mb(D)={B,C,E}, Mb(E)={D}.",
    nodes: [
      { id: "A", x: 0.32, y: 0.10 },
      { id: "B", x: 0.68, y: 0.10 },
      { id: "C", x: 0.32, y: 0.48 },
      { id: "D", x: 0.68, y: 0.48 },
      { id: "E", x: 0.68, y: 0.88 }
    ],
    edges: [],
    steps: [
      { caption: "<b>Initialise (Fig. 168a).</b> Start with the learned graph on {A,B,C,D,E} and <i>no edges</i>. MARVEL assumes each variable's Markov boundary is known: Mb(A)={B,C}, Mb(B)={A,C,D}, Mb(C)={A,B,D}, Mb(D)={B,C,E}, Mb(E)={D}. It will peel off one removable variable at a time.", ops: [{ op: "badge", text: "no edges yet", kind: "info" }] },
      { caption: "<b>Order by |Mb(X)|.</b> The smallest boundary belongs to E (|Mb(E)|=1), so E is the first candidate. A variable with the smallest Markov boundary is cheapest to test and most likely removable.", ops: [{ op: "highlightNodes", ids: ["E"], cls: "hl" }, { op: "set", name: "Mb(E)", items: ["D"] }] },
      { caption: "<b>Resolve E locally.</b> Mb(E)={D}: its only neighbour is D and there are no co-parents. CI tests confined to Mb(E) confirm the link, so add the undirected edge E–D. E has no children, so the removability conditions are vacuous — <b>E is removable</b>.", ops: [{ op: "addEdge", from: "D", to: "E", type: "undirected" }, { op: "testCI", x: "E", y: "D", z: [], result: "dep" }, { op: "badge", text: "E removable → eliminate", kind: "good" }] },
      { caption: "<b>Orient and ELIMINATE E (Fig. 168b).</b> No v-structure is created at the leaf E, so the edge is oriented D → E. Delete E from the graph and update the boundaries of its neighbours. Now V = {A,B,C,D} with Mb(A)={B,C}, Mb(B)={A,C,D}, Mb(C)={A,B,D}, Mb(D)={B,C}.", ops: [{ op: "orient", from: "D", to: "E", type: "directed" }, { op: "highlightNodes", ids: ["E"], cls: "dim" }, { op: "set", name: "Mb(D)", items: ["B", "C"] }] },
      { caption: "<b>Next candidate: A.</b> Re-order the remaining variables; ties broken by picking A before D. Restrict all CI tests to Mb(A)={B,C}. This locality is what makes MARVEL cheap — it never conditions on the whole graph.", ops: [{ op: "highlightNodes", ids: ["A"], cls: "hl" }, { op: "set", name: "Mb(A)", items: ["B", "C"] }] },
      { caption: "<b>Draw A's edges (Fig. 168c).</b> CI checks inside Mb(A) give A's neighbours N_A = {B, C} (its children in the true graph), so add undirected edges A–B and A–C.", ops: [{ op: "addEdge", from: "A", to: "B", type: "undirected" }, { op: "addEdge", from: "A", to: "C", type: "undirected" }, { op: "highlightEdges", edges: [["A","B"],["A","C"]], cls: "add" }] },
      { caption: "<b>Test A's removability — Condition (i) fails.</b> A's neighbours B and C are <i>not</i> adjacent to each other (no edge B–C survives the conditioning sets specified for the test). So the dependence A induced between B and C would be lost if A were deleted — <b>A is NOT removable</b>. Leave A for now and move on.", ops: [{ op: "testCI", x: "B", y: "C", z: ["A"], result: "indep" }, { op: "highlightNodes", ids: ["B", "C"], cls: "hl" }, { op: "badge", text: "A not removable", kind: "warn" }] },
      { caption: "<b>Next candidate: D.</b> With E already gone, restrict tests to Mb(D) = {B, C}. CI checks inside this boundary give D's neighbours N_D = {B, C}.", ops: [{ op: "highlightNodes", ids: ["D"], cls: "hl" }, { op: "set", name: "Mb(D)", items: ["B", "C"] }] },
      { caption: "<b>Draw D's edges (Fig. 168d).</b> Add the undirected edges D–B and D–C found from Mb(D). D has no children left (E was already removed), so its removability conditions are satisfied — <b>D is removable</b>.", ops: [{ op: "addEdge", from: "B", to: "D", type: "undirected" }, { op: "addEdge", from: "C", to: "D", type: "undirected" }, { op: "highlightEdges", edges: [["B","D"],["C","D"]], cls: "add" }, { op: "badge", text: "D removable → eliminate", kind: "good" }] },
      { caption: "<b>Orient D's v-structures and ELIMINATE D (Fig. 168e).</b> B and C are non-adjacent co-parents of D, so the collider B → D ← C is implied; orient B → D and C → D. Then remove D and update the boundaries. The remaining variables are {A, B, C}.", ops: [{ op: "orient", from: "B", to: "D", type: "directed" }, { op: "orient", from: "C", to: "D", type: "directed" }, { op: "highlightNodes", ids: ["D"], cls: "dim" }, { op: "set", name: "Mb(A)", items: ["B", "C"] }] },
      { caption: "<b>Recurse on {A, B, C}.</b> A is now examined again: with D and E removed, A's neighbours B and C are its only links. The edges A–B and A–C are confirmed and A is finally removable, leaving B and C to be processed in turn — each is resolved by a tiny boundary-local test.", ops: [{ op: "highlightNodes", ids: ["A"], cls: "hl" }, { op: "highlightEdges", edges: [["A","B"],["A","C"]], cls: "hl" }, { op: "badge", text: "recurse on smaller graph", kind: "info" }] },
      { caption: "<b>Result — the PDAG.</b> Every variable has been peeled off. The recovered structure A–B, A–C with colliders B → D ← C and D → E is the PDAG for the P-map / equivalence class of the true DAG (Fig. 167) — obtained with far fewer and smaller CI tests than PC.", ops: [{ op: "orient", from: "B", to: "D", type: "directed" }, { op: "orient", from: "C", to: "D", type: "directed" }, { op: "orient", from: "D", to: "E", type: "directed" }, { op: "badge", text: "PDAG returned", kind: "good" }] }
    ]
  },

  complexity: "MARVEL is designed for CI-test efficiency. Each variable is fully resolved with tests whose conditioning sets stay inside its Markov boundary, and once removed it is never revisited, so the number and size of CI tests are far smaller than PC's growing-subset search. The paper proves worst-case bounds on the number of CI tests in terms of the maximum Markov-boundary size, and shows the saving empirically; cost is dominated by boundary sizes rather than the global graph degree.",
  strengths: [
    "Substantially fewer and smaller conditional-independence tests than PC — the central design goal — proven with worst-case bounds and shown empirically.",
    "Every test conditions only on a Markov boundary, so conditioning sets stay small and statistically more reliable.",
    "Recursive elimination resolves each variable once and removes it, avoiding the repeated re-testing of pairs.",
    "Constraint-based and sound: returns the correct P-map / Markov-equivalence class (a PDAG) under faithfulness and a perfect CI oracle."
  ],
  limitations: [
    "Relies on knowing (or accurately precomputing) the Markov boundaries; errors in the boundaries propagate into the recovered structure.",
    "Like all constraint-based methods it is sensitive to CI-test errors, and a mistaken early removal can cascade.",
    "Assumes faithfulness and causal sufficiency (no hidden confounders).",
    "Tie-breaking and the order in which removable variables are chosen can affect intermediate steps (though the final equivalence class is the target)."
  ],
  notes: "MARVEL extends the earlier removable-variable principle (Mokhtarian et al.) into a recursive constraint-based framework: the key notion is removability — a node is removable iff deleting it preserves all conditional independencies among the remaining variables (Theorem 35). It generalises an earlier line on recursive elimination for DAGs (the algorithm repeatedly identifies a removable variable using small-set conditional-independence tests). Related work includes L-MARVEL, which leverages side information, and methods that exploit bounded clique number or diamond-free structure, and ROL (which precomputes orderings).",
  figureRefs: "Paper §4.53 (pp.254-258): Definition 28 (removable node), Theorem 35 (removability Conditions (i) & (ii)), Fig.165 (Markov blanket), Fig.166 (local graphical intuition for the two conditions), Algorithm 66 (MARVEL), and Example 75 with the true DAG Fig.167 (A→B, A→C, B→D, C→D, D→E) and milestones Fig.168(a-e)."
};
