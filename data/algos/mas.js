/* MAS — (Bayesian Network Structure Learning via) Maximum Acyclic Subgraph.
   Grounded in §4.49 (pp.233-235): Algorithm 61 (edge-weight MAS formulation, p.235),
   the edge-weight proxy / ℓ1 calibration ILP Eq.(41) (p.233), Example 68 + Fig.145
   (edge-weight approximation of family scores), the MAS ILP + cycle inequalities and
   lazy cut generation Example 69 + Fig.146 (the worked 6-node A..F example), and
   Theorem 31 (upper-bound connection). MAS originally = BNSL2MAS [220]; ≈ GOBNILP. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["mas"] = {
  name: "MAS (BN learning via Maximum Acyclic Subgraph)",
  oneLiner: "Approximate each node's family score by a sum of per-edge weights, then 'pick the highest-total-weight set of arrows that forms a DAG' — a maximum-acyclic-subgraph ILP over edge variables, with cycles forbidden by cycle inequalities added lazily only when a cycle actually appears.",
  basedOnText: "MAS (originally BNSL2MAS) recasts score-based structure learning as a Maximum Acyclic Subgraph problem. Like GOBNILP it is an exact ILP method, but instead of one variable per candidate family it uses one variable per directed edge — far fewer variables — and it optimises an edge-weight proxy of the score rather than the families directly.",

  assumptions: [
    "<b>Decomposable score</b> — the network's quality is a sum of <i>local</i> family scores FamScore<sub>v</sub>(W), one per node and its parent set (e.g. BIC/BDeu). This is what makes an edge-additive proxy possible.",
    "<b>Edge-additive proxy is adequate</b> — each family score is approximated by a sum of edge weights plus a node bias, FamScorẽ<sub>v</sub>(W) = Σ<sub>w∈W</sub> e<sub>v</sub>(w) + b<sub>v</sub>. The proxy is fitted to track the true scores closely.",
    "<b>One-sided (conservative) calibration</b> — the edge weights are fitted so the proxy <i>over-estimates</i> the true score (FamScorẽ<sub>v</sub>(W) ≥ FamScore<sub>v</sub>(W)); this is what makes the MAS objective an upper bound on the optimum (Theorem 31).",
    "<b>Precomputed candidate parent sets</b> — for each node a (pruned) list of candidate parent sets with local scores is available to fit the weights against."
  ],
  input: "A dataset D over variables V, and for each variable v its candidate parent sets {Pa<sub>v</sub>} with precomputed local family scores FamScore<sub>v</sub>(W | D).",
  output: "A single high-scoring acyclic network (DAG) Ĝ, found as the maximum-weight acyclic subgraph of the weighted edge graph. Its proxy score is a certified upper bound on the true optimum up to the constant Σ<sub>v</sub> b<sub>v</sub> (Theorem 31).",

  idea: [
    "GOBNILP optimises over whole <i>families</i>: one binary variable for every (node, candidate-parent-set) pair. MAS makes a key simplification — it tries to explain each family score as a <b>sum of single-edge contributions</b>. If having parents {B,C} is worth FamScore<sub>v</sub>({B,C}), MAS fits weights so that e<sub>v</sub>(B) + e<sub>v</sub>(C) + b<sub>v</sub> reproduces that number (Fig.145). A root with no parents is just the bias b<sub>v</sub>.",
    "Those edge weights are learned by an <b>ℓ1 fit</b> (Eq.41): minimise the total gap between proxy and true scores, subject to the proxy never <i>under</i>-estimating. Keeping the proxy on the high side is deliberate — it guarantees the later maximisation can only over-shoot the truth, which gives the clean upper bound in Theorem 31.",
    "With per-edge weights in hand, structure learning becomes the textbook <b>Maximum Acyclic Subgraph (MAS)</b> problem: among all directed edges w→v (each carrying weight e<sub>v</sub>(w)), choose the subset of maximum total weight that contains no directed cycle. There is now just one 0-1 variable J<sub>v</sub>(w) per possible edge — at most |V|(|V|−1) of them — so the ILP is dramatically smaller than GOBNILP's family-indexed program.",
    "Acyclicity is imposed by <b>cycle inequalities</b>: for any directed cycle C, you may keep at most |C|−1 of its edges, written Σ<sub>(w→v)∈C</sub> J<sub>v</sub>(w) ≤ |C|−1. There are exponentially many cycles, so — exactly like GOBNILP's cluster cuts — MAS adds them <b>lazily</b>: solve, look for cycles in the answer, add one cut per detected cycle, and re-solve until the solution is a DAG."
  ],

  steps: [
    "<b>Fit edge weights (Eq.41).</b> For each node v, solve the ℓ1 calibration that finds edge weights e<sub>v</sub>(w) and bias b<sub>v</sub> so the proxy FamScorẽ<sub>v</sub>(W) = Σ<sub>w∈W</sub> e<sub>v</sub>(w) + b<sub>v</sub> tracks the true family scores, under the one-sided constraint FamScorẽ<sub>v</sub>(W) ≥ FamScore<sub>v</sub>(W) (proxy stays conservative / on the high side).",
    "<b>Build the MAS ILP.</b> Introduce one binary variable J<sub>v</sub>(w) ∈ {0,1} for each possible directed edge w→v (w ≠ v): 1 means 'include the arrow w→v'. Objective: maximise Σ<sub>v</sub> Σ<sub>w≠v</sub> J<sub>v</sub>(w)·e<sub>v</sub>(w) — the total edge weight — <i>with no cycle constraints yet</i>.",
    "<b>Solve the unconstrained ILP.</b> Solve to get a directed graph G. Because acyclicity is not yet enforced, G simply takes every positively-weighted edge it wants and may well contain cycles.",
    "<b>Detect directed cycles.</b> Inspect G for directed cycles. (In the paper's example two 3-cycles ⟨A,B,D,A⟩ and ⟨C,E,F,C⟩ appear in the first solution — Fig.146a.)",
    "<b>Add cycle cuts lazily.</b> For each detected cycle C, add the cycle inequality Σ<sub>(w→v)∈C</sub> J<sub>v</sub>(w) ≤ |C|−1 to the ILP — forbidding keeping <i>all</i> edges of that cycle, i.e. at least one edge of the cycle must be dropped.",
    "<b>Re-optimise.</b> Solve the ILP again with the new cuts. The solver drops the lowest-cost edges needed to break the cycles while keeping total weight as high as the acyclicity constraints allow.",
    "<b>Repeat</b> the detect-cut-resolve loop until the returned graph G contains no directed cycle. (In the example the second solution is already acyclic: B→D and F→C drop out — Fig.146b.)",
    "<b>Optional sparsity / post-processing.</b> Because the conservative proxy over-estimates scores it can favour denser graphs, so optionally enforce an indegree cap d, or repair any node whose chosen parent set W is not an actual candidate by replacing it with its best candidate subset arg max<sub>A⊆W, A∈Pa<sub>v</sub></sub> FamScore<sub>v</sub>(A).",
    "<b>Return</b> the acyclic graph Ĝ — the maximum-weight acyclic subgraph under the fitted edge weights."
  ],

  keyConcepts: [
    { term: "Edge-weight proxy FamScorẽ<sub>v</sub>(W)", def: "An approximation of a family score as a sum of per-edge weights plus a node bias: Σ_{w∈W} e_v(w) + b_v. A root contributes just b_v; the family {B,C} for E contributes e_E(B)+e_E(C)+b_E (Fig.145)." },
    { term: "ℓ1 calibration (Eq.41)", def: "The fit that learns the edge weights and biases by minimising the total absolute gap between proxy and true scores, subject to the proxy never under-estimating (a one-sided / conservative constraint)." },
    { term: "Edge variable J_v(w)", def: "A 0-1 decision variable, 1 exactly when the arrow w→v is included. There is one per possible directed edge — at most |V|(|V|−1) — far fewer than GOBNILP's one-per-family variables." },
    { term: "Maximum Acyclic Subgraph (MAS) problem", def: "Given weighted directed edges, pick the maximum-total-weight subset that contains no directed cycle. MAS reduces BN structure learning to exactly this classic optimisation." },
    { term: "Cycle inequality", def: "For a directed cycle C, the constraint Σ_{(w→v)∈C} J_v(w) ≤ |C|−1: you may keep at most all-but-one of the cycle's edges, i.e. at least one must be dropped, which forbids that cycle." },
    { term: "Lazy cut generation", def: "Because there are exponentially many cycles, MAS does not list all cycle inequalities up front; it solves, finds the cycles present, adds only those cuts, and re-solves — repeating until the solution is acyclic (Example 69, Fig.146)." },
    { term: "Upper-bound connection (Theorem 31)", def: "Because the proxy is conservatively calibrated (proxy ≥ true), the true optimal score score(G★) is bounded above by (Σ_v b_v) + the proxy score of the MAS solution — a guarantee linking the proxy optimum to the true optimum." }
  ],

  animation: {
    title: "MAS on the paper's 6-node example {A,B,C,D,E,F} (Example 69 / Fig.146): build edge weights, take the max-weight edges, break cycles with cuts, reach the optimal DAG.",
    nodes: [
      { id: "A", x: 0.50, y: 0.08 },
      { id: "B", x: 0.30, y: 0.45 },
      { id: "C", x: 0.70, y: 0.45 },
      { id: "D", x: 0.10, y: 0.88 },
      { id: "E", x: 0.50, y: 0.88 },
      { id: "F", x: 0.90, y: 0.88 }
    ],
    edges: [],
    steps: [
      { caption: "<b>Step 1 — Fit edge weights (Eq.41).</b> First MAS approximates each family score by a sum of per-edge weights plus a node bias: FamScorẽ<sub>v</sub>(W)=Σ<sub>w∈W</sub> e<sub>v</sub>(w)+b<sub>v</sub>. A root like A is just its bias b<sub>A</sub>; node E with parents {B,C} is e<sub>E</sub>(B)+e<sub>E</sub>(C)+b<sub>E</sub> (Fig.145). Weights are fitted by an ℓ1 loss kept conservative (proxy ≥ true score).", ops: [
        { op: "set", name: "Candidate edge weights e_v(w)", items: ["A→B : 2", "A→C : 6", "B→D : 1", "B→E : 2", "C→E : 4", "D→A : 3", "E→F : 3", "F→C : 2"] },
        { op: "badge", text: "proxy fitted (conservative)", kind: "info" } ] },
      { caption: "<b>Step 2 — One variable per EDGE (vs GOBNILP per family).</b> MAS introduces a 0-1 variable J<sub>v</sub>(w) for each possible arrow w→v: 1 = include it. This is at most |V|(|V|−1) variables — far fewer than GOBNILP's one-per-candidate-family encoding. The DAG is read off from the edges set to 1.", ops: [
        { op: "badge", text: "binary J_v(w) ∈ {0,1}, one per edge", kind: "info" } ] },
      { caption: "<b>Step 3 — MAS objective, no acyclicity yet.</b> Maximise the total edge weight Σ<sub>v</sub>Σ<sub>w≠v</sub> J<sub>v</sub>(w)·e<sub>v</sub>(w) with <i>no</i> cycle constraints. The solver greedily turns on every positively-weighted edge it can.", ops: [
        { op: "score", text: "maximise total edge weight (cycles ignored for now)" },
        { op: "badge", text: "MAS ILP, no cuts", kind: "info" } ] },
      { caption: "<b>Step 4 — First solution (Fig.146a).</b> The unconstrained optimum draws all eight weighted edges: A→B(2), A→C(6), B→D(1), B→E(2), C→E(4), D→A(3), E→F(3), F→C(2).", ops: [
        { op: "addEdge", from: "A", to: "B" },
        { op: "addEdge", from: "A", to: "C" },
        { op: "addEdge", from: "B", to: "D" },
        { op: "addEdge", from: "B", to: "E" },
        { op: "addEdge", from: "C", to: "E" },
        { op: "addEdge", from: "D", to: "A" },
        { op: "addEdge", from: "E", to: "F" },
        { op: "addEdge", from: "F", to: "C" },
        { op: "set", name: "Selected edges", items: ["A→B (2)", "A→C (6)", "B→D (1)", "B→E (2)", "C→E (4)", "D→A (3)", "E→F (3)", "F→C (2)"] },
        { op: "score", text: "total weight = 2+6+1+2+4+3+3+2 = 23" } ] },
      { caption: "<b>Step 5 — Detect directed cycles.</b> Following the arrows reveals two 3-cycles: ⟨A,B,D,A⟩ (A→B→D→A) and ⟨C,E,F,C⟩ (C→E→F→C). This is not a DAG.", ops: [
        { op: "highlightNodes", ids: ["A", "B", "D"], cls: "hl" },
        { op: "highlightEdges", edges: [["A","B"],["B","D"],["D","A"]], cls: "bad" },
        { op: "highlightEdges", edges: [["C","E"],["E","F"],["F","C"]], cls: "bad" },
        { op: "badge", text: "2 cycles → infeasible", kind: "bad" } ] },
      { caption: "<b>Step 6 — Add cycle cuts (lazily).</b> For each detected cycle C add the inequality Σ<sub>(w→v)∈C</sub> J<sub>v</sub>(w) ≤ |C|−1: J(A→B)+J(B→D)+J(D→A) ≤ 2 and J(C→E)+J(E→F)+J(F→C) ≤ 2. Each cut forces at least one edge of its cycle to be dropped — and only these two cuts are added, not all cycles.", ops: [
        { op: "set", name: "Cycle cuts added", items: ["⟨A,B,D⟩:  A→B + B→D + D→A ≤ 2", "⟨C,E,F⟩:  C→E + E→F + F→C ≤ 2"] },
        { op: "badge", text: "lazy cycle inequalities", kind: "info" } ] },
      { caption: "<b>Step 7 — Re-optimise: drop the cheapest cycle edges.</b> To satisfy the cuts the solver removes one edge per cycle, choosing the lowest-weight ones: B→D (weight 1) and F→C (weight 2). All other high-weight edges are kept.", ops: [
        { op: "removeEdge", from: "B", to: "D" },
        { op: "removeEdge", from: "F", to: "C" },
        { op: "highlightNodes", ids: ["A", "B", "C", "D", "E", "F"], cls: "" },
        { op: "badge", text: "dropped B→D, F→C", kind: "info" } ] },
      { caption: "<b>Step 8 — Solution is now acyclic (Fig.146b).</b> The remaining edges D→A, A→B, A→C, B→E, C→E, E→F contain no directed cycle, so the detect-cut-resolve loop stops. Contrast with GOBNILP: same lazy-cut idea, but the cuts here are simple per-cycle edge inequalities over edge variables, not cluster constraints over family variables.", ops: [
        { op: "set", name: "Selected edges", items: ["D→A (3)", "A→B (2)", "A→C (6)", "B→E (2)", "C→E (4)", "E→F (3)"] },
        { op: "highlightEdges", edges: [["D","A"],["A","B"],["A","C"],["B","E"],["C","E"],["E","F"]], cls: "good" },
        { op: "score", text: "DAG weight = 3+2+6+2+4+3 = 20" },
        { op: "badge", text: "acyclic — loop stops", kind: "good" } ] },
      { caption: "<b>Step 9 — Optional sparsity / repair, then return Ĝ.</b> Because the conservative proxy over-estimates scores (favouring denser graphs), MAS may apply an indegree cap d or replace any non-candidate parent set by its best candidate subset. By Theorem 31 the proxy score of Ĝ upper-bounds the true optimum up to Σ<sub>v</sub> b<sub>v</sub>. Return the maximum-weight acyclic subgraph.", ops: [
        { op: "highlightEdges", edges: [["D","A"],["A","B"],["A","C"],["B","E"],["C","E"],["E","F"]], cls: "good" },
        { op: "badge", text: "optimal acyclic subgraph Ĝ", kind: "good" } ] }
    ]
  },

  complexity: "BN structure learning is NP-hard and the number of cycle inequalities is exponential, so the worst case is exponential. But MAS's ILP has only edge variables — at most |V|(|V|−1), versus GOBNILP's one-per-candidate-family — and cuts are added lazily, so in practice it is leaner than the family-indexed ILP. Cost grows with the number of cycles that have to be cut before the solution becomes acyclic.",
  strengths: [
    "<b>Far fewer ILP variables</b> than GOBNILP: one per directed edge (≤ |V|(|V|−1)) instead of one per candidate parent set.",
    "Cleanly reduces structure learning to the well-studied Maximum Acyclic Subgraph problem, reusing its solvers and cutting-plane machinery.",
    "Lazy cycle inequalities avoid ever listing the exponentially many acyclicity constraints; only cycles that actually appear are cut.",
    "Comes with a guarantee (Theorem 31): the proxy objective upper-bounds the true optimal score up to the constant Σ<sub>v</sub> b<sub>v</sub>."
  ],
  limitations: [
    "Optimises an <b>edge-additive proxy</b> of the score, not the true family scores — interaction effects between parents that are not additive are lost, so the returned DAG can be sub-optimal for the real score.",
    "The conservative (over-estimating) calibration tends to favour <b>denser</b> graphs, needing an indegree cap or post-processing to control sparsity.",
    "A chosen parent set may not be an actual candidate, requiring a repair step (replace it with its best candidate subset).",
    "Still relies on a decomposable score and precomputed candidate families, and the cut loop can be slow if many cycles must be removed."
  ],
  notes: "MAS (originally BNSL2MAS) is closely related to GOBNILP: both are exact ILP/cutting-plane methods that forbid cycles by adding constraints lazily. The crucial difference is the variables and objective — GOBNILP keeps one variable per candidate family and optimises the exact decomposable score with cluster constraints, whereas MAS keeps one variable per edge and optimises a fitted additive edge-weight proxy with per-cycle edge inequalities. This trades exactness on the true score for a much smaller, faster ILP plus an upper-bound guarantee (Theorem 31).",
  figureRefs: "Paper §4.49 (pp.233–235): Algorithm 61 (edge-weight MAS formulation, p.235), Eq.(41) (ℓ1 edge-weight calibration, p.233), Example 68 + Fig.145 (edge-weight approximation of family scores), Example 69 + Fig.146 (the 6-node A..F run: Fig.146a initial solution with 3-cycles ⟨A,B,D,A⟩ and ⟨C,E,F,C⟩, Fig.146b acyclic solution after cycle cuts drop B→D and F→C), and Theorem 31 (upper-bound connection)."
};
