/* PC — Peter-Clark. Gold-reference page. Grounded in §4.1 (pp.18-24),
   worked example = Fig.7 five-variable example; Meek rules Fig.5; pseudocode Alg.3. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["pc"] = {
  name: "Peter-Clark algorithm",
  oneLiner: "Start from the fully-connected graph, delete an edge whenever a conditional-independence test says two variables are independent given some neighbours, then orient the surviving edges using v-structures and Meek's rules.",
  basedOnText: "PC is the archetypal constraint-based method — it learns structure purely from (conditional) independence relations in the data, with no scoring function.",

  assumptions: [
    "<b>Causal sufficiency</b> — no hidden common causes (every common cause is observed).",
    "<b>Faithfulness</b> — every independence in the data corresponds to a missing connection in the true graph (no accidental cancellations).",
    "<b>Reliable CI tests</b> — independence is decided by a statistical test (e.g. partial correlation, χ²/G²); in theory a perfect 'oracle' test."
  ],
  input: "A dataset over variables V and a conditional-independence (CI) test.",
  output: "A <b>CPDAG</b> (class PDAG / completed PDAG): a graph with directed and undirected edges representing the whole Markov-equivalence class of the true DAG.",

  idea: [
    "PC turns the structure-learning problem into a question of <i>independence</i>. Two variables that are directly connected can never be made independent by conditioning on other variables; two variables that are <i>not</i> directly connected can. So PC hunts for, for each pair, a set of variables that 'screens them off'.",
    "It works in two phases. <b>Phase 1 (skeleton):</b> begin with every pair connected, then try to disconnect each pair by finding a conditioning set that makes them independent — testing first with the empty set, then sets of size 1, then size 2, and so on. Whenever a screening set is found, the edge is deleted and that set is remembered (the <i>separating set</i>).",
    "<b>Phase 2 (orientation):</b> the leftover undirected skeleton is given arrows. First the <i>v-structures</i> (colliders) are found, then Meek's three rules propagate as many further orientations as are logically forced — without creating cycles or new colliders.",
    "Because conditioning sets are grown gradually and only over current neighbours, PC avoids testing every possible subset, which is what makes it practical on sparse graphs."
  ],

  steps: [
    "<b>Initialise.</b> Connect every pair of variables with an undirected edge (the complete graph). Set the conditioning-set size ℓ = 0.",
    "<b>Order-0 tests.</b> For each adjacent pair (X,Y), test whether X ⫫ Y given the empty set. If independent, delete the edge and store Sep(X,Y)=∅.",
    "<b>Grow the conditioning set.</b> Increase ℓ by 1. For each still-adjacent pair (X,Y), test independence conditioning on every subset of size ℓ drawn from X's current neighbours (excluding Y). The moment a subset makes them independent, delete the edge and remember that subset as Sep(X,Y).",
    "<b>Repeat</b> step 3 with ℓ = 1, 2, 3, … . Stop when no node has more than ℓ neighbours left to condition on (an optional cap c_max can stop it earlier, because CI tests get unreliable with large conditioning sets). What remains is the <b>skeleton</b>.",
    "<b>Orient v-structures.</b> For every connected triple X − Z − Y where X and Y are <i>not</i> adjacent: if Z is <b>not</b> in Sep(X,Y), orient it as a collider X → Z ← Y.",
    "<b>Propagate with Meek's rules R1–R3</b> until nothing more can be oriented: <i>R1</i> if X→Y and Y−Z with X,Z non-adjacent, orient Y→Z (else a new collider would appear); <i>R2</i> if X→Y→Z and X−Z, orient X→Z (avoid a cycle); <i>R3</i> orient to avoid a cycle/new collider when two directed paths force it.",
    "<b>Return</b> the resulting CPDAG — the equivalence class of DAGs consistent with the data."
  ],

  keyConcepts: [
    { term: "Conditional independence (CI) test", def: "A statistical check of whether X and Y carry no extra information about each other once we already know the variables in a set Z. PC's only source of evidence." },
    { term: "Skeleton", def: "The undirected version of the graph — just which pairs are connected, before any arrows are added." },
    { term: "Separating set Sep(X,Y)", def: "The conditioning set that made X and Y independent and caused their edge to be deleted. It decides whether a triple is a collider." },
    { term: "v-structure (collider)", def: "A pattern X → Z ← Y where X and Y are not directly connected. Colliders are detectable from independencies, which is why orientation starts here." },
    { term: "Meek's rules (R1–R3)", def: "Logical rules that orient additional edges that are forced once colliders are fixed, without introducing cycles or new colliders." },
    { term: "CPDAG", def: "The partially-directed graph PC outputs: edges that all equivalent DAGs agree on are directed; the rest stay undirected." }
  ],

  animation: {
    title: "PC running on the five-variable example {A,B,C,D,E} (paper Fig. 7).",
    nodes: [
      { id: "A", x: 0.04, y: 0.5 },
      { id: "B", x: 0.32, y: 0.5 },
      { id: "C", x: 0.62, y: 0.12 },
      { id: "D", x: 0.62, y: 0.88 },
      { id: "E", x: 0.96, y: 0.5 }
    ],
    edges: [
      { from: "A", to: "B", type: "undirected" }, { from: "A", to: "C", type: "undirected" },
      { from: "A", to: "D", type: "undirected" }, { from: "A", to: "E", type: "undirected" },
      { from: "B", to: "C", type: "undirected" }, { from: "B", to: "D", type: "undirected" },
      { from: "B", to: "E", type: "undirected" }, { from: "C", to: "D", type: "undirected" },
      { from: "C", to: "E", type: "undirected" }, { from: "D", to: "E", type: "undirected" }
    ],
    steps: [
      { caption: "<b>Start:</b> assume everything is connected. PC begins from the complete undirected graph on {A,B,C,D,E} — 10 edges — and will try to delete edges using independence tests.", ops: [] },
      { caption: "<b>Order 0 (condition on ∅):</b> test each pair marginally. Here no pair is independent on its own, so nothing is deleted yet.", ops: [{ op: "badge", text: "ℓ = 0", kind: "info" }] },
      { caption: "<b>Order 1:</b> A and C become independent once we condition on B — so the direct edge A–C is spurious. Delete it and record Sep(A,C)={B}.", ops: [{ op: "badge", text: "ℓ = 1", kind: "info" }, { op: "testCI", x: "A", y: "C", z: ["B"], result: "indep" }, { op: "removeEdge", from: "A", to: "C" }] },
      { caption: "<b>Order 1:</b> A ⫫ D | B → delete A–D. (B screens A off from D.) Sep(A,D)={B}.", ops: [{ op: "badge", text: "ℓ = 1", kind: "info" }, { op: "testCI", x: "A", y: "D", z: ["B"], result: "indep" }, { op: "removeEdge", from: "A", to: "D" }] },
      { caption: "<b>Order 1:</b> A ⫫ E | B → delete A–E. Sep(A,E)={B}.", ops: [{ op: "badge", text: "ℓ = 1", kind: "info" }, { op: "testCI", x: "A", y: "E", z: ["B"], result: "indep" }, { op: "removeEdge", from: "A", to: "E" }] },
      { caption: "<b>Order 1:</b> C ⫫ D | B → delete C–D. Sep(C,D)={B}. (Remember this — it decides the collider later.)", ops: [{ op: "badge", text: "ℓ = 1", kind: "info" }, { op: "testCI", x: "C", y: "D", z: ["B"], result: "indep" }, { op: "removeEdge", from: "C", to: "D" }] },
      { caption: "<b>Order 2:</b> B and E are still connected. Conditioning on the pair {C,D} makes them independent → delete B–E. Sep(B,E)={C,D}.", ops: [{ op: "badge", text: "ℓ = 2", kind: "info" }, { op: "testCI", x: "B", y: "E", z: ["C", "D"], result: "indep" }, { op: "removeEdge", from: "B", to: "E" }] },
      { caption: "<b>Skeleton finished.</b> No more edges can be removed. The remaining undirected graph is A–B, B–C, B–D, C–E, D–E.", ops: [{ op: "badge", text: "skeleton done", kind: "good" }, { op: "highlightEdges", edges: [["A","B"],["B","C"],["B","D"],["C","E"],["D","E"]] }] },
      { caption: "<b>Find v-structures.</b> Look at triple C–E–D: C and D are NOT adjacent, and the middle node E is NOT in Sep(C,D)={B}. That signals a collider.", ops: [{ op: "highlightNodes", ids: ["C", "E", "D"], cls: "hl" }] },
      { caption: "<b>Orient the collider:</b> C → E ← D. Both arrows point into E.", ops: [{ op: "orient", from: "C", to: "E", type: "directed" }, { op: "orient", from: "D", to: "E", type: "directed" }] },
      { caption: "<b>Meek rules R1–R3:</b> check A–B, B–C, B–D. None are forced (orienting them would create no required collider and no cycle), so they stay undirected.", ops: [{ op: "orient", from: "C", to: "E", type: "directed" }, { op: "orient", from: "D", to: "E", type: "directed" }, { op: "highlightEdges", edges: [["A","B"],["B","C"],["B","D"]] }] },
      { caption: "<b>Result — the CPDAG.</b> A–B, B–C, B–D undirected, with the recovered v-structure C → E ← D. This represents every DAG equivalent to the truth.", ops: [{ op: "orient", from: "C", to: "E", type: "directed" }, { op: "orient", from: "D", to: "E", type: "directed" }, { op: "badge", text: "CPDAG returned", kind: "good" }] }
    ]
  },

  complexity: "Worst case exponential in the largest node degree (it may test many subsets), but efficient on sparse graphs because conditioning sets only range over current neighbours. The optional cap c_max trades completeness for reliability/speed.",
  strengths: [
    "No scoring function or distributional form to choose — only independence tests.",
    "Recovers the correct equivalence class (CPDAG) given faithfulness and a perfect CI oracle.",
    "Scales well on sparse graphs; conditioning sets stay small."
  ],
  limitations: [
    "Sensitive to CI-test errors: a wrong early test removes/keeps an edge and the mistake cascades.",
    "Large conditioning sets make tests unreliable and the result order-dependent.",
    "Assumes causal sufficiency (no hidden confounders) — FCI relaxes this."
  ],
  notes: "An order-independent variant (stable-PC / CPC) reduces sensitivity to the order in which pairs are processed. A related-work line (Kim et al.) first ranks pairs by mutual information, prunes weak ones, then applies PC-style CI tests and v-structure checks.",
  figureRefs: "Paper §4.1 (pp.18–24): Algorithm 3 (PC), Fig.5 (Meek rules R1–R3), Fig.7 (five-variable worked example), Fig.8 (workflow)."
};
