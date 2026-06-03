/* SP — Sparsest Permutation. Grounded in §4.42 (pp.207-209):
   Algorithm 52 (SP), Recall 52 (restricted faithfulness), Lemma 8,
   Definition 16 (SMR), Theorems 25-26; Example 58 + Fig.126 (necessary-arrow rule),
   Example 59 + Fig.127 (three-variable order 132), Fig.128 (six orders → six DAGs). */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["sp"] = {
  name: "Sparsest Permutation",
  oneLiner: "Try every ordering of the variables; for each ordering build the smallest DAG whose independencies match the data (each node keeps only the earlier variables it still depends on as parents); then return the DAG with the fewest edges — the sparsest one — as the learned structure.",
  basedOnText: "SP is an exact, constraint-based method that searches over all permutations of the variables. For each permutation it builds the minimal independence-map (minimal I-map) implied by the observed conditional independencies, and returns the graph(s) with the fewest edges — combining the combinatorics of edge operations with an ordering view of DAGs.",

  assumptions: [
    "<b>Restricted faithfulness</b> — a weaker condition than full faithfulness. It has two parts: <i>adjacency faithfulness</i> (if X and Y are adjacent in the true DAG, no conditioning set ever makes them independent) and <i>orientation faithfulness</i> (for an unshielded triple X−Z−Y, the dependence/independence of X and Y when conditioning on sets containing Z correctly reveals whether Z is a collider).",
    "<b>Sparsest Markov Representation (SMR)</b> — the true graph G* is the <i>unique</i> sparsest I-map of the distribution: any I-map that is not Markov-equivalent to G* has strictly more edges. SMR is what makes the sparsest permutation's DAG correct.",
    "<b>Reliable CI tests / an oracle</b> — independence is decided by a statistical test; correctness is stated for a perfect oracle returning the true conditional-independence relations.",
    "<b>Causal sufficiency</b> — the variables searched are all the relevant ones (no hidden common causes left out of the ordering)."
  ],
  input: "A dataset D over variables V = {X₁,…,X_p} and a conditional-independence (CI) test.",
  output: "The minimal-edge DAG(s) G_SP consistent with some ordering — i.e. the sparsest minimal I-map(s) found over all permutations. Under SMR this is the true graph G* (up to Markov equivalence).",

  idea: [
    "SP rests on a simple idea: <b>once you fix an order of the variables, there is one natural smallest DAG that matches the data</b>. Lay the variables left-to-right; each node may only take parents from variables that come <i>before</i> it. SP keeps an earlier variable as a parent only if the node still <i>depends</i> on it after conditioning on all the other predecessors. This 'minimal I-map' is the sparsest DAG consistent with that particular order.",
    "The arrow-keeping rule is exactly the one illustrated in the paper's blocking argument (Example 58, Fig. 126): for a fixed order, SP adds an arrow from an earlier variable into a node <i>if and only if</i> the two are still dependent after conditioning on all the other predecessors of that node. If conditioning on those predecessors makes them independent, no arrow is added.",
    "Different orders give different minimal DAGs — some dense, some sparse. SP's insight is that the <b>true causal structure is the sparsest one</b>: among all orderings, the minimal DAG with the <i>fewest edges</i> is (under the SMR assumption) the true graph, or one Markov-equivalent to it. Spurious edges only ever <i>appear</i> when an order forces them; the true order needs the fewest.",
    "So SP turns structure learning into a search over orderings scored by sparsity. It needs <i>weaker</i> assumptions than PC — restricted faithfulness instead of full faithfulness — and is provably exact under SMR, but it pays for this by searching the (factorially large) space of permutations, which is computationally heavy.",
    "Contrast: PC also uses CI tests but greedily prunes a single skeleton and can cascade early test errors; SP instead enumerates orderings and compares whole DAGs by edge count, making it more robust but far more expensive."
  ],

  steps: [
    "<b>Enumerate permutations.</b> Initialise an empty store S. For each permutation π = (π₁,…,π_p) of the variables, repeat the build below.",
    "<b>Start empty.</b> Initialise the DAG G_π on V with no edges. Edges will only ever point forward in π, so the result is automatically acyclic.",
    "<b>Build the minimal I-map (the parent rule).</b> For each position k (the k-th variable π_k), look at every earlier variable π_j (j &lt; k). Let Z be all the <i>other</i> predecessors of π_k, i.e. {π₁,…,π_{k−1}} minus π_j.",
    "<b>Test and add arrows.</b> If π_j and π_k are still <i>dependent</i> given Z (π_j ⫫̸ π_k | Z), add the edge π_j → π_k to G_π. If conditioning on Z makes them independent, add no edge. Doing this for every (j,k) pair gives the sparsest DAG consistent with order π.",
    "<b>Record the DAG.</b> Add the pair (π, G_π) to S. Move on to the next permutation.",
    "<b>Find the sparsest.</b> After all permutations, compute the minimum edge count e_min = min{ |E(G_π)| } over the store.",
    "<b>Return the sparsest DAG(s).</b> Output every G_π whose edge count equals e_min — the minimal-edge DAG(s) consistent with some order. Under SMR this recovers the true graph (up to Markov equivalence)."
  ],

  keyConcepts: [
    { term: "Permutation / variable order (π)", def: "A left-to-right arrangement of the variables. It restricts each node to take parents only from variables that come before it, so any consistent DAG is automatically acyclic." },
    { term: "Minimal I-map (G_π)", def: "For a fixed order, the smallest DAG that still captures all the data's dependencies: each node keeps an earlier variable as a parent only if they remain dependent after conditioning on the node's other predecessors." },
    { term: "Necessary-arrow / blocking rule", def: "The test that decides each edge: an arrow π_j → π_k is needed exactly when conditioning on all of π_k's other predecessors fails to make π_j and π_k independent (Example 58, Fig. 126)." },
    { term: "Sparsity (edge count)", def: "The number of edges |E(G_π)| of a permutation's minimal DAG. SP compares orderings purely by this count and keeps the fewest-edge DAG(s)." },
    { term: "Restricted faithfulness", def: "A weaker assumption than faithfulness: adjacency faithfulness (adjacent variables stay dependent under any conditioning) plus orientation faithfulness (colliders are correctly revealed). Enough for SP to be correct." },
    { term: "Sparsest Markov Representation (SMR)", def: "The condition that the true DAG G* is the unique sparsest I-map of the distribution — any non-equivalent I-map has strictly more edges. SMR guarantees the sparsest permutation's DAG is the truth." },
    { term: "Markov equivalence class", def: "The set of DAGs encoding the same independencies. SP recovers the true structure up to this class — DAGs that are equivalent have the same edge count and are indistinguishable by sparsity." }
  ],

  animation: {
    title: "SP on a three-variable example (paper Example 59 / Fig. 127, extended to compare permutations by sparsity).",
    nodes: [
      { id: "X1", x: 0.18, y: 0.28 },
      { id: "X2", x: 0.50, y: 0.82 },
      { id: "X3", x: 0.82, y: 0.28 }
    ],
    edges: [],
    steps: [
      { caption: "<b>The task.</b> Three variables {X1,X2,X3}. The data's only marginal independence is X1 ⫫ X3 (they become dependent once X2 is known). SP will try orderings, build each one's minimal DAG, and keep the sparsest. The truth has just two edges meeting at X2.", ops: [
        { op: "set", name: "Permutation", items: ["—"] },
        { op: "badge", text: "goal: fewest edges", kind: "info" } ] },
      { caption: "<b>Permutation 1: order 1 ≺ 3 ≺ 2.</b> Build its minimal I-map. Variables go X1, then X3, then X2. We add an arrow into each node only from the earlier variables it still depends on.", ops: [
        { op: "set", name: "Permutation", items: ["X1", "X3", "X2"] } ] },
      { caption: "<b>Test X1 → X3.</b> With no other predecessors, condition on the empty set: X1 ⫫ X3 holds, so they are independent and <b>no arrow is added</b> between X1 and X3 (this matches Fig. 127a).", ops: [
        { op: "highlightNodes", ids: ["X1", "X3"], cls: "hl" },
        { op: "testCI", x: "X1", y: "X3", z: [], result: "indep" } ] },
      { caption: "<b>Test arrows into X2.</b> X2 comes last, so its predecessors are X1 and X3. Conditioning each on the other, X2 still depends on both → add X1 → X2 and X3 → X2. This minimal DAG has <b>2 edges</b>.", ops: [
        { op: "highlightNodes", ids: ["X2"], cls: "hl" },
        { op: "testCI", x: "X1", y: "X2", z: ["X3"], result: "dep" },
        { op: "addEdge", from: "X1", to: "X2" },
        { op: "testCI", x: "X3", y: "X2", z: ["X1"], result: "dep" },
        { op: "addEdge", from: "X3", to: "X2" },
        { op: "score", text: "#edges = 2" },
        { op: "badge", text: "sparsest so far (2)", kind: "good" } ] },
      { caption: "<b>Permutation 2: order 1 ≺ 2 ≺ 3 (the order 132 walk-through, Example 59).</b> Rebuild from scratch for the new order. Clear the previous DAG and lay out X1, then X2, then X3.", ops: [
        { op: "set", name: "Permutation", items: ["X1", "X2", "X3"] },
        { op: "removeEdge", from: "X1", to: "X2" },
        { op: "removeEdge", from: "X3", to: "X2" } ] },
      { caption: "<b>Test X1 → X2.</b> X2's only predecessor is X1. With no other predecessor to condition on (empty set), X1 and X2 are dependent → add X1 → X2 (Fig. 127b).", ops: [
        { op: "highlightNodes", ids: ["X1", "X2"], cls: "hl" },
        { op: "testCI", x: "X1", y: "X2", z: [], result: "dep" },
        { op: "addEdge", from: "X1", to: "X2" } ] },
      { caption: "<b>Test arrows into X3.</b> X3's predecessors are X1 and X2. X1 ⫫̸ X3 | X2 (dependent) → add X1 → X3; and X2 ⫫̸ X3 | X1 → add X2 → X3. This DAG has <b>3 edges</b> — denser than permutation 1.", ops: [
        { op: "highlightNodes", ids: ["X3"], cls: "hl" },
        { op: "testCI", x: "X1", y: "X3", z: ["X2"], result: "dep" },
        { op: "addEdge", from: "X1", to: "X3" },
        { op: "testCI", x: "X2", y: "X3", z: ["X1"], result: "dep" },
        { op: "addEdge", from: "X2", to: "X3" },
        { op: "score", text: "#edges = 3" },
        { op: "badge", text: "denser (3 > 2) — rejected", kind: "bad" } ] },
      { caption: "<b>Permutation 3: order 3 ≺ 1 ≺ 2.</b> Rebuild again. Clear the dense DAG; lay out X3, then X1, then X2. This order, like permutation 1, puts the two parents before the common child X2.", ops: [
        { op: "set", name: "Permutation", items: ["X3", "X1", "X2"] },
        { op: "removeEdge", from: "X1", to: "X2" },
        { op: "removeEdge", from: "X1", to: "X3" },
        { op: "removeEdge", from: "X2", to: "X3" } ] },
      { caption: "<b>Test X3 → X1.</b> Conditioning set is empty: X3 ⫫ X1 holds, so they are independent → <b>no arrow</b> between X3 and X1.", ops: [
        { op: "highlightNodes", ids: ["X3", "X1"], cls: "hl" },
        { op: "testCI", x: "X3", y: "X1", z: [], result: "indep" } ] },
      { caption: "<b>Test arrows into X2.</b> Predecessors of X2 are X3 and X1; X2 depends on each given the other → add X3 → X2 and X1 → X2. Again a <b>2-edge</b> DAG — ties permutation 1 and matches the true structure.", ops: [
        { op: "highlightNodes", ids: ["X2"], cls: "hl" },
        { op: "testCI", x: "X3", y: "X2", z: ["X1"], result: "dep" },
        { op: "addEdge", from: "X3", to: "X2" },
        { op: "testCI", x: "X1", y: "X2", z: ["X3"], result: "dep" },
        { op: "addEdge", from: "X1", to: "X2" },
        { op: "score", text: "#edges = 2" },
        { op: "badge", text: "sparsest so far (2)", kind: "good" } ] },
      { caption: "<b>Compare by sparsity.</b> Across all permutations the minimum edge count is e_min = 2. Orders 132 and 312 both achieve it (they are Markov-equivalent — same skeleton with the collider at X2); the 1≺2≺3-type orders need 3 edges and are discarded.", ops: [
        { op: "set", name: "Permutation", items: ["X3", "X1", "X2"] },
        { op: "score", text: "e_min = 2" },
        { op: "badge", text: "pick the sparsest", kind: "good" } ] },
      { caption: "<b>Result.</b> SP returns the sparsest minimal I-map: the collider X1 → X2 ← X3. Under restricted faithfulness + SMR this is exactly the true structure (up to Markov equivalence) — recovered with weaker assumptions than PC.", ops: [
        { op: "highlightEdges", edges: [["X1","X2"],["X3","X2"]], cls: "hl" },
        { op: "score", text: "#edges = 2" },
        { op: "badge", text: "sparsest DAG returned", kind: "good" } ] }
    ]
  },

  complexity: "Exact but expensive: SP enumerates all p! permutations of the variables, and for each builds a minimal I-map with O(p²) conditional-independence tests (one per ordered pair, conditioning on the other predecessors). This factorial blow-up limits exact SP to small variable sets; greedy/local variants (e.g. GSP) search the permutation space without full enumeration.",
  strengths: [
    "Provably exact under SMR — returns the true DAG (up to Markov equivalence) rather than a heuristic answer.",
    "Needs only restricted faithfulness, a strictly weaker assumption than the full faithfulness PC requires, so it is correct on some distributions where PC fails.",
    "Compares whole DAGs by sparsity instead of pruning a single skeleton, avoiding the cascading errors of greedy edge-deletion."
  ],
  limitations: [
    "Searching all p! permutations is computationally heavy — exact SP is only feasible for small numbers of variables.",
    "Still depends on reliable CI tests; with finite data the minimal I-map per order can be mis-built.",
    "SMR is strictly stronger than restricted faithfulness: distributions exist that satisfy restricted faithfulness but violate SMR, where the exact result no longer holds."
  ],
  notes: "SP needs fewer assumptions than PC-style methods but pays in computation. The paper's Theorem 25 establishes exactness under SMR, while Theorem 26 notes SMR is strictly stronger than restricted faithfulness (so the exact guarantee applies under broader conditions than PC-style faithfulness but not universally). Greedy variants such as Greedy SP (GSP) explore the permutation space with local moves to avoid the factorial cost.",
  figureRefs: "Paper §4.42 (pp.207–209): Algorithm 52 (SP: sparsest permutation search), Recall 52 (restricted faithfulness), Lemma 8 (consistency), Definition 16 (SMR), Theorems 25–26; Example 58 + Fig.126 (necessary-arrow/blocking rule), Example 59 + Fig.127 (three-variable order 132), Fig.128 (six orders → six minimal I-maps)."
};
