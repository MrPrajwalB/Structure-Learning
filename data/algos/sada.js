/* SADA — Scalable Causation Discovery Algorithm. Grounded in §4.33 (pp.166-171):
   Definition (causal cut), Algorithm 39 (Finding a causal cut), Algorithm 40
   (Merge two learned subgraphs), Algorithm 41 (SADA: recursive divide-learn-merge),
   worked Example 42/43 + Fig.98 (8-variable cut {B,C}), Fig.99 (merge conflicts). */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["sada"] = {
  name: "SADA (Scalable Causation Discovery Algorithm)",
  oneLiner: "Split a large variable set into two nearly-independent halves by conditioning on a small 'causal cut', recursively learn the structure of each half with any base learner, then stitch the two sub-structures back together and repair the few edges that cross the cut.",
  basedOnText: "SADA is a divide-and-conquer wrapper around constraint-based learning. Its goal is scalability to high-dimensional data: by cutting the problem into small subproblems, every conditional-independence test stays low-dimensional and therefore reliable and fast.",

  assumptions: [
    "<b>Causal sufficiency & faithfulness</b> — the usual constraint-based assumptions, inherited from whatever base learner SADA wraps.",
    "<b>A good causal cut exists</b> — there is a relatively small set of variables that, once conditioned on, splits the rest into two (largely) independent groups. SADA pays off when the true graph has such 'bottleneck' structure.",
    "<b>Reliable low-dimensional CI tests</b> — SADA's whole point is to keep conditioning sets small so the CI test (CondIndep) is trustworthy."
  ],
  input: "A dataset 𝒟 over variables V, a CI test (CondIndep), a base structure learner (BaseLearn), and a size threshold θ for when a subproblem is small enough to hand to the base learner.",
  output: "An oriented acyclic graph (DAG) over all of V — equivalently the P-map class PDAG / CPDAG of the true DAG when the base learner returns that.",

  idea: [
    "Constraint-based learners struggle as the number of variables grows: the conditioning sets in their independence tests get large, and large-conditioning-set CI tests are both slow and statistically unreliable. SADA sidesteps this by never working on the whole variable set at once.",
    "The key object is a <b>causal cut</b> (V₁, V₂, C): a partition of the variables into two groups V₁ and V₂ plus a (small) cut set C, such that every variable in V₁ is conditionally independent of every variable in V₂ <i>given C</i>. Conditioning on C 'screens off' the two sides from each other.",
    "<b>Divide:</b> find such a cut. <b>Conquer:</b> recursively run SADA on V₁∪C and on V₂∪C — note the cut variables appear in <i>both</i> subproblems, because they are the bridge between the halves and we need their edges to each side. Each subproblem is smaller, so its CI tests use smaller conditioning sets.",
    "<b>Merge:</b> overlay the two learned sub-structures. They agree on the easy edges; conflicts only arise around the cut variables, where the two halves may disagree or together create a cycle. SADA resolves these by re-checking independence and, when a cycle forms, removing the least-significant offending edge.",
    "Recursion bottoms out when a subproblem has ≤ θ variables; that small piece is handed directly to the base learner."
  ],

  steps: [
    "<b>Base case.</b> If the current variable set has ≤ θ variables, just run the base learner on it and return its DAG. (Algorithm 41, line 1-2.)",
    "<b>Find a causal cut.</b> Initialise from a pair of variables X, Y that are conditionally independent given some minimal set Z; set V₁ = {X}, V₂ = {Y}, C = Z. (Algorithm 39.)",
    "<b>Assign the remaining variables.</b> For each other variable W: if W is conditionally independent of <i>all</i> of V₁ given some subset of the current cut, put W in V₂; if it is independent of all of V₂, put W in V₁; otherwise W belongs in the cut C. This keeps the two sides screened off by C.",
    "<b>Shrink / balance the cut.</b> A final pass tries to move cut variables W∈C to a side when independence still holds, shrinking C. The procedure also encourages a small and roughly balanced split (|V₁|≈|V₂|) so the two subproblems take comparable effort.",
    "<b>Recurse on side 1.</b> Run SADA on V₁ ∪ C. Because the cut variables are included, the sub-learner can find every edge between V₁ and the cut. CI tests here only range over this smaller set.",
    "<b>Recurse on side 2.</b> Run SADA on V₂ ∪ C, the same way. The two recursions are independent and can run in parallel.",
    "<b>Merge — add agreed edges.</b> Combine the two learned subgraphs 𝒢₁ and 𝒢₂. Edges entirely inside V₁ or inside V₂ are carried over as-is; the interesting case is edges touching the cut variables, which both subgraphs may have opinions about. (Algorithm 40.)",
    "<b>Merge — resolve cross-cut conflicts (orientation).</b> For a cut edge X−Y, if both subgraphs already place a directed edge from X to Y, the union is taken; but if adding it forms a <i>cycle</i>, that edge is a spurious 'least-significant' edge and is discarded (cycle avoidance).",
    "<b>Merge — resolve redundant edges.</b> If a direct edge X→Y in one subgraph is actually explained by an <i>indirect</i> path P from X to Y once both sides are combined, re-test X ⫫ Y | Z for some Z ⊆ P; if independence now holds, drop the redundant direct edge.",
    "<b>Break any merge cycle.</b> When overlaying the halves creates a directed cycle around the cut (e.g. C → D → F → H → B → C in the example), remove the single least-significant edge on the cycle to restore acyclicity.",
    "<b>Return</b> the merged acyclic graph for the current level. Each merge step propagates up the recursion until the full graph over V is assembled."
  ],

  keyConcepts: [
    { term: "Causal cut (V₁, V₂, C)", def: "A partition of the variables into two groups V₁, V₂ plus a cut set C such that every X∈V₁ is conditionally independent of every Y∈V₂ given C. Conditioning on C separates the two sides." },
    { term: "Divide-and-conquer", def: "SADA does not learn the whole graph at once. It splits the variables, solves each smaller half recursively, and merges — the same template as classic divide-and-conquer algorithms." },
    { term: "Cut variables appear in both halves", def: "The cut set C is included in BOTH recursive subproblems (V₁∪C and V₂∪C) because the cut variables are the bridge between the two sides and their edges to each side must be learned." },
    { term: "Low-dimensional CI tests", def: "Because subproblems are small, the conditioning sets in independence tests stay small — which is exactly what makes CI tests fast and statistically reliable. This is SADA's source of scalability." },
    { term: "Merge conflicts", def: "When the two learned subgraphs are overlaid, disagreements appear only near the cut: a cross-cut edge that closes a cycle, or a direct edge made redundant by an indirect path through the other half." },
    { term: "Least-significant-edge removal", def: "When merging creates a directed cycle, SADA breaks it by deleting the edge whose CI evidence is weakest (least significant), restoring an acyclic graph." },
    { term: "Size threshold θ", def: "The recursion's base case: once a subproblem has at most θ variables, it is small enough to hand straight to the base learner instead of cutting further." }
  ],

  animation: {
    title: "SADA on the 8-variable example {A..H} with causal cut C={B,C} (paper Example 42/43, Fig. 98).",
    nodes: [
      { id: "A", x: 0.18, y: 0.18 },
      { id: "C", x: 0.46, y: 0.10 },
      { id: "D", x: 0.74, y: 0.14 },
      { id: "G", x: 0.42, y: 0.46 },
      { id: "F", x: 0.78, y: 0.46 },
      { id: "E", x: 0.18, y: 0.80 },
      { id: "B", x: 0.50, y: 0.84 },
      { id: "H", x: 0.80, y: 0.82 }
    ],
    edges: [
      { from: "A", to: "C", type: "directed" }, { from: "A", to: "G", type: "directed" },
      { from: "A", to: "E", type: "directed" }, { from: "C", to: "D", type: "directed" },
      { from: "C", to: "F", type: "directed" }, { from: "D", to: "F", type: "directed" },
      { from: "F", to: "H", type: "directed" }, { from: "E", to: "G", type: "directed" },
      { from: "B", to: "G", type: "directed" }, { from: "B", to: "H", type: "directed" }
    ],
    steps: [
      { caption: "<b>The problem.</b> We want the causal structure over eight variables {A,B,C,D,E,F,G,H}. Learning all of it at once would need large, unreliable conditioning sets. SADA will divide it first. (The DAG shown is the ground truth we aim to recover.)", ops: [{ op: "badge", text: "divide & conquer", kind: "info" }] },
      { caption: "<b>Seed the cut.</b> SADA starts from a pair that is conditionally independent given a minimal set. Here A ⫫ D | C, so it initialises V₁={A}, V₂={D}, C={C}.", ops: [{ op: "testCI", x: "A", y: "D", z: ["C"], result: "indep" }, { op: "set", name: "Cut set C", items: ["C"] }, { op: "highlightNodes", ids: ["C"], cls: "hl" }] },
      { caption: "<b>Grow the split.</b> Assign each remaining variable. E and G stay independent of the V₂ side given the cut, so they join V₁; F and H stay independent of the V₁ side, so they join V₂.", ops: [{ op: "highlightNodes", ids: ["A", "E", "G"], cls: "hl" }] },
      { caption: "<b>B must enter the cut.</b> B is not independent of either side given the current cut (it points to G in one half and H in the other). So B is added to the cut: C = {B,C}.", ops: [{ op: "testCI", x: "B", y: "G", z: ["C"], result: "dep" }, { op: "set", name: "Cut set C", items: ["B", "C"] }, { op: "highlightNodes", ids: ["B", "C"], cls: "hl" }, { op: "badge", text: "split", kind: "info" }] },
      { caption: "<b>Causal cut found.</b> C={B,C} (highlighted) separates V₁={A,E,G} from V₂={D,F,H}: conditioning on {B,C} makes the two sides independent. Now conquer each side.", ops: [{ op: "highlightNodes", ids: ["B", "C"], cls: "hl" }, { op: "highlightNodes", ids: ["A", "E", "G", "D", "F", "H"], cls: "dim" }] },
      { caption: "<b>Subset 1 = V₁∪C = {A,E,G,B,C}.</b> Recurse here. The cut variables B,C are included so their edges into this side can be found. Only these five variables enter the CI tests.", ops: [{ op: "highlightNodes", ids: ["A", "E", "G", "B", "C"], cls: "hl" }, { op: "highlightNodes", ids: ["D", "F", "H"], cls: "dim" }, { op: "set", name: "Subset 1 (V₁∪C)", items: ["A", "E", "G", "B", "C"] }] },
      { caption: "<b>Learn subset 1.</b> Small, low-dimensional CI tests recover A→C, A→G, A→E, E→G, and B→G — the edges of the left half (Fig. 98c, left).", ops: [{ op: "highlightEdges", edges: [["A","C"],["A","G"],["A","E"],["E","G"],["B","G"]], cls: "hl" }] },
      { caption: "<b>Subset 2 = V₂∪C = {D,F,H,B,C}.</b> Now recurse on the right half. Again the cut variables B,C are included. These two recursions are independent and can run in parallel.", ops: [{ op: "clearSet" }, { op: "set", name: "Subset 2 (V₂∪C)", items: ["D", "F", "H", "B", "C"] }, { op: "highlightNodes", ids: ["D", "F", "H", "B", "C"], cls: "hl" }, { op: "highlightNodes", ids: ["A", "E", "G"], cls: "dim" }] },
      { caption: "<b>Learn subset 2.</b> The right-half CI tests recover C→D, C→F, D→F, F→H, and B→H (Fig. 98c, right).", ops: [{ op: "highlightEdges", edges: [["C","D"],["C","F"],["D","F"],["F","H"],["B","H"]], cls: "hl" }] },
      { caption: "<b>Merge.</b> Overlay 𝒢₁ and 𝒢₂. Edges inside each half carry over directly; the cut variables B and C are where the two halves meet and where conflicts can appear (Algorithm 40).", ops: [{ op: "highlightNodes", ids: ["B", "C"], cls: "hl" }, { op: "badge", text: "merge", kind: "info" }] },
      { caption: "<b>Resolve a merge cycle.</b> Combining the halves creates the directed cycle C→D→F→H→B→? around the cut. SADA detects the cycle and removes the single least-significant offending edge to restore acyclicity (Fig. 98d / Fig. 99).", ops: [{ op: "highlightEdges", edges: [["C","D"],["D","F"],["F","H"]], cls: "hl" }, { op: "badge", text: "break cycle: drop weakest edge", kind: "warn" }] },
      { caption: "<b>Done.</b> The merged, acyclic graph over all eight variables is returned. Every CI test along the way stayed low-dimensional — the payoff of cut → conquer-each-side → merge.", ops: [{ op: "clearSet" }, { op: "highlightNodes", ids: ["A","B","C","D","E","F","G","H"], cls: "hl" }, { op: "badge", text: "global DAG returned", kind: "good" }] }
    ]
  },

  complexity: "When a balanced cut exists, SADA roughly follows a divide-and-conquer recurrence: the problem of size n splits into two subproblems of about half the size, so the dominant cost — the number and dimension of CI tests — drops sharply versus running the base learner on all of V. The win depends on finding small, balanced cuts; in the worst case (no good cut) it degrades toward the base learner's cost.",
  strengths: [
    "Scales constraint-based learning to high-dimensional data by keeping every CI test low-dimensional and therefore reliable.",
    "Wrapper design: works with ANY base learner and any CI test — it only adds the cut/merge logic around them.",
    "The two recursive subproblems are independent, so they can be solved in parallel."
  ],
  limitations: [
    "Depends on the existence of a small, balanced causal cut; graphs without such bottlenecks give little speed-up.",
    "Finding a good cut itself needs CI tests, and a poor cut can push too many variables into C, shrinking the benefit.",
    "Merge conflicts (cross-cut cycles, redundant edges) must be resolved heuristically by removing the least-significant edge, which can be wrong if CI evidence is noisy.",
    "Inherits the base learner's assumptions (causal sufficiency, faithfulness) and is only as correct as the base learner on each subproblem."
  ],
  notes: "SADA stops cutting once a subproblem reaches the size threshold θ and hands it to the base learner. If the base learner is correct, SADA returns a graph equivalent to the true DAG (the P-map class PDAG/CPDAG). The two merge hazards illustrated in Fig. 99 are: a cross-cut edge that would create a cycle (drop the least-significant edge), and a direct edge made redundant by an indirect path through the other half (drop it after a confirming CI test).",
  figureRefs: "Paper §4.33 (pp.166–171): Algorithm 41 (SADA recursive divide-learn-merge), Algorithm 39 (Finding a causal cut), Algorithm 40 (Merge two learned subgraphs), Definition of causal cut, Example 42/43 with Fig. 98 (8-variable cut C={B,C}, panels a–d), Fig. 99 (merge conflicts), Eq. (33)."
};
