/* BBLP — Branch and Bound with Linear Programming. Grounded in §5.6 (pp.335-339):
   §5.6.1 "The algorithm" (p.335); Recall 89 (LP viewpoint, binary I(W→u) variables,
   decomposable objective, p.336); Recall 90 (polytope interpretation — DAGs are the
   vertices, fractional interior points are mixtures, p.336); cycle/edge-existence
   inequalities (p.336) and Example 100 + Fig.212 (cycle-inequality examples a/b/c);
   the cluster constraint ∀C ⊆ V: ∑_{u∈C}∑_{W: W∩C=∅} I(W→u) ≥ 1 (p.336) with
   Example 101 (3-cycle cut) and Example 102 + Fig.213 (cluster with/without a root);
   Recall 91 (P_cluster relaxation / outer polytope) and Recall 92 (Lagrangian dual,
   p.337); Algorithm 98 BBLP (p.339): dual coordinate descent, decode order from the
   dual-adjusted family scores, decode a DAG, strong-duality certificate, cycle/cluster
   separation, and the branch-and-bound phase. GOBNILP builds on this LP approach. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["bblp"] = {
  name: "BBLP (Branch and Bound with Linear Programming)",
  oneLiner: "Write exact score-based BN learning as a yes/no choice of one parent set per node, then relax those yes/no choices to fractions so a fast linear-program solver gives an optimistic bound; whenever the answer is fractional or has a cycle, add a cutting-plane inequality and branch — repeating until you reach a whole-number, acyclic, provably optimal network.",
  basedOnText: "BBLP casts score-based BN structure learning as a constrained linear program over parent-set indicator variables and solves a tight relaxation (with cluster constraints) via a dual method coupled with branch-and-bound for a certificate of optimality. It is the LP-based exact approach that GOBNILP is built on.",

  assumptions: [
    "<b>Decomposable score</b> — the network's total quality is a sum of <i>local family scores</i> FamScore(u,W|D), one per node u and candidate parent set W (e.g. BIC/BDeu). This is what makes the objective a linear sum over the indicator variables.",
    "<b>Precomputed, pruned candidate parent sets</b> — for each node a (usually pruned) list of plausible parent sets and their scores is computed up front; a simple pruning lemma drops dominated sets so the variable count stays manageable.",
    "<b>Goal is the certified global optimum</b> — BBLP is willing to do more work than a heuristic in order to <i>prove</i> the network it returns is the highest-scoring DAG."
  ],
  input: "A dataset 𝒟 over variables V, a decomposable family-scoring function FamScore(·,·), and for each node u a pruned list of candidate parent sets {P_u}.",
  output: "A single <b>globally optimal DAG G*</b> maximising ∑<sub>u</sub> FamScore(u, Pa<sub>u</sub><sup>G*</sup>), together with a <b>strong-duality certificate</b> of optimality from the LP.",

  idea: [
    "BBLP turns structure learning into one clean optimisation. For every node u and every candidate parent set W it introduces a yes/no variable I(W→u) that equals 1 exactly when W is chosen as u's parents. The total network score is then a simple linear sum of family scores weighted by these variables, and 'each node picks exactly one parent set' is a single linear equation — the only genuinely hard part is forbidding cycles.",
    "The key move is the <b>LP relaxation</b>. We let the yes/no variables take <i>fractional</i> values between 0 and 1 instead of just 0/1. The honest DAGs sit at the corners (vertices) of a geometric region; the fractional interior points are 'mixtures' of parent-set choices and are not real DAGs. Relaxing to that region makes the problem a plain linear program a solver can crack quickly, and its optimum is an <b>optimistic upper bound</b> on the best possible network.",
    "When the LP answer is fractional or describes a cycle, it is not a valid network, so BBLP adds a <b>cutting plane</b> — a linear inequality that the bad solution violates but every real DAG satisfies. The decisive family are <b>cluster constraints</b>: for any set of nodes C, a valid DAG must have at least one node in C whose parents all lie <i>outside</i> C (a 'root' of the cluster). A cycle has no such root, so the cluster inequality slices it off. Plain cycle inequalities alone are too weak, which is exactly why cluster constraints are used.",
    "Solving with all clusters at once is impossible (there are exponentially many), so BBLP works with the cluster relaxation through its <b>Lagrangian dual</b>: it improves a cheap dual bound by coordinate descent, then decodes an ordering and a DAG from the dual-adjusted scores. If that DAG's score equals the dual bound, <b>strong duality</b> certifies it is globally optimal and we are done.",
    "Otherwise BBLP <b>separates</b> a violated cycle or cluster, adds it as a cut, and — if a certificate is still absent — enters a <b>branch-and-bound</b> phase: it picks a node and a cluster, branches by selecting/forbidding a parent set in/out of that cluster, re-optimises the dual on each child, and fathoms branches whose bound cannot beat the best DAG found so far. The loop ends with a whole-number, acyclic, provably optimal network."
  ],

  steps: [
    "<b>Precompute & prune local scores.</b> For each node u and each candidate parent set W compute FamScore(u,W|D); drop dominated parent sets with the pruning lemma so each node keeps a small list P_u.",
    "<b>Encode the LP (Recall 89).</b> Introduce a binary variable I(W→u) for every stored (parent-set, node) pair, with objective max ∑<sub>u</sub> ∑<sub>W∈P_u</sub> FamScore(u,W) · I(W→u) and the convexity constraint ∑<sub>W</sub> I(W→u) = 1 (each node picks exactly one parent set).",
    "<b>Relax to fractions (Recall 90).</b> Allow 0 ≤ I(W→u) ≤ 1. The real DAGs are the vertices of the feasible polytope; fractional interior points are mixtures of parent-set choices and are not valid DAGs. Solving the relaxation gives an <b>optimistic upper bound</b>.",
    "<b>Improve the dual bound (Recall 92, Alg.98 lines 2–9).</b> Maintain cluster multipliers λ and minimise the dual g(λ) by coordinate descent; define dual-adjusted family scores FamScore<sub>λ</sub> = FamScore − ∑<sub>C</sub> λ<sub>C</sub>·1{W∩C=∅}.",
    "<b>Decode an order and a DAG (Alg.98 lines 4–11).</b> From the dual-adjusted scores compute each node's <i>regret</i>, induce an ordering of V, then give each node its best parent set consistent with that order — an acyclic graph by construction. Score it with the original FamScore.",
    "<b>Optimality test (Alg.98 lines 12–14).</b> If the decoded DAG's score equals the dual bound g(λ), <b>strong duality</b> certifies it globally optimal — return it.",
    "<b>Check feasibility / find a cut.</b> If the relaxed solution is fractional or contains a cycle, it is not a real DAG. Find a violated <b>cluster inequality</b> ∑<sub>u∈C</sub> ∑<sub>W: W∩C=∅</sub> I(W→u) ≥ 1 — a cluster C with no root — (cycle inequalities alone are too weak).",
    "<b>Add the cutting plane (Alg.98 line 16).</b> Add the most-violated cluster (or cycle) inequality C to the program and re-optimise the dual. This tightens the relaxation and removes that fractional/cyclic solution.",
    "<b>Branch-and-bound (Alg.98 line 17).</b> If a certificate is still absent, pick a key node i and cluster C and branch: one child forces i to take a parent set with W ∩ C = ∅ (a root in C), the other forbids it. Re-optimise the dual on each child.",
    "<b>Fathom & repeat.</b> Discard any branch whose upper bound cannot beat the best DAG found so far; otherwise keep separating cuts and branching.",
    "<b>Return G*.</b> When a branch yields an integral, acyclic solution whose score meets its bound, return it as the certified globally optimal DAG."
  ],

  keyConcepts: [
    { term: "Indicator variable I(W→u)", def: "A yes/no (binary) variable equal to 1 exactly when node u is given parent set W. The DAG is read off from which of these equal 1 (Recall 89)." },
    { term: "Decomposable objective", def: "max ∑_u ∑_{W∈P_u} FamScore(u,W)·I(W→u): the total network score written as a linear sum of precomputed local family scores — the reason an LP solver can handle it." },
    { term: "LP relaxation", def: "Letting the yes/no variables become fractions in [0,1]. Its optimum is an optimistic upper bound on the best network; if it happens to be integral and acyclic, it is already the answer." },
    { term: "Polytope / vertices (Recall 90)", def: "Geometrically, the valid DAGs are the corners (vertices) of the feasible region. Fractional interior points are 'mixtures' of parent-set choices and are not themselves valid DAGs." },
    { term: "Cluster constraint", def: "For any node set C, at least one node must take all its parents from outside C (a 'root' of the cluster): ∑_{u∈C} ∑_{W: W∩C=∅} I(W→u) ≥ 1. A cycle has no root, so this forbids it — and it is strictly stronger than a plain cycle inequality." },
    { term: "Cutting plane (separation)", def: "A linear inequality (a violated cluster or cycle constraint) added on the fly to slice off an invalid LP solution and tighten the relaxation, rather than listing all exponentially-many constraints up front." },
    { term: "Lagrangian dual (Recall 92)", def: "Moving the cluster constraints into the objective with multipliers λ_C gives a cheap dual bound g(λ); coordinate descent improves it and yields dual-adjusted family scores used to decode an ordering and a DAG (Algorithm 98)." },
    { term: "Strong-duality certificate", def: "When the decoded DAG's true score equals the dual bound, the gap is closed: the DAG is provably globally optimal and the search can stop." },
    { term: "Branch-and-bound", def: "When no certificate is found, BBLP branches on a (node, cluster) pair — forcing or forbidding a root choice — re-optimises the dual on each child, and fathoms branches whose bound cannot beat the best DAG so far." }
  ],

  animation: {
    title: "BBLP on a faithful 4-node example {A,B,C,D} (illustrative — paper Figs 212–213 show the cycle/cluster inequalities; here we trace LP relaxation → cluster cut → branch → certified optimum).",
    nodes: [
      { id: "A", x: 0.20, y: 0.18 },
      { id: "B", x: 0.80, y: 0.18 },
      { id: "C", x: 0.20, y: 0.82 },
      { id: "D", x: 0.80, y: 0.82 }
    ],
    edges: [],
    steps: [
      { caption: "<b>Encode the LP (Recall 89).</b> For each node u and candidate parent set W make a yes/no variable I(W→u); the objective is the total score ∑ FamScore(u,W)·I(W→u), and every node must pick exactly one parent set. These precomputed local scores are the only data the LP needs.", ops: [
        { op: "set", name: "Family scores FamScore(u,W)", items: ["A | {}  : 1.0", "A | {C} : 2.5", "B | {A} : 3.0", "C | {D} : 2.2", "C | {}  : 1.4", "D | {B} : 2.8"] },
        { op: "badge", text: "binary I(W→u), one per node", kind: "info" } ] },
      { caption: "<b>Relax to fractions (Recall 90).</b> Let each I(W→u) range over [0,1] instead of just 0/1. Real DAGs are the corners of the feasible region; fractional interior points are mixtures, not valid DAGs. Solving this linear program is fast and gives an optimistic upper bound.", ops: [
        { op: "score", text: "LP relaxation = optimistic upper bound" },
        { op: "badge", text: "LP relaxation solved", kind: "info" } ] },
      { caption: "<b>Read off the relaxed solution.</b> The relaxation greedily prefers each node's top-scoring parent set, ignoring acyclicity: A←{C}, B←{A}, D←{B}, C←{D}. Draw those arrows.", ops: [
        { op: "set", name: "LP solution", items: ["A ← {C}  (2.5)", "B ← {A}  (3.0)", "D ← {B}  (2.8)", "C ← {D}  (2.2)"] },
        { op: "addEdge", from: "C", to: "A" },
        { op: "addEdge", from: "A", to: "B" },
        { op: "addEdge", from: "B", to: "D" },
        { op: "addEdge", from: "D", to: "C" },
        { op: "score", text: "bound = 2.5 + 3.0 + 2.8 + 2.2 = 10.5" } ] },
      { caption: "<b>It has a cycle.</b> Following the arrows A→B→D→C→A loops forever — not a valid DAG. The cluster C={A,B,C,D} has <i>no root</i>: every node takes a parent from inside the cluster.", ops: [
        { op: "highlightNodes", ids: ["A", "B", "C", "D"], cls: "hl" },
        { op: "highlightEdges", edges: [["C","A"],["A","B"],["B","D"],["D","C"]], cls: "bad" },
        { op: "badge", text: "cycle → cut", kind: "bad" } ] },
      { caption: "<b>Add a cluster cutting plane.</b> Add the violated inequality ∑<sub>u∈C</sub> ∑<sub>W: W∩C=∅</sub> I(W→u) ≥ 1 for C={A,B,C,D}: at least one node must take all its parents from outside the cluster. (A plain cycle inequality would be too weak to forbid every fractional cycle.)", ops: [
        { op: "set", name: "Added cuts", items: ["cluster C={A,B,C,D}: ≥1 root (parents outside C)"] },
        { op: "badge", text: "cluster cut added", kind: "info" } ] },
      { caption: "<b>Re-optimise the dual (Recall 92).</b> The cut enters the Lagrangian with a multiplier λ_C; coordinate descent improves the dual bound and produces dual-adjusted family scores. The cyclic assignment is now illegal — remove the cycle-closing arc.", ops: [
        { op: "removeEdge", from: "D", to: "C" },
        { op: "highlightNodes", ids: ["A", "B", "C", "D"], cls: "" },
        { op: "score", text: "dual bound tightened by λ_C" },
        { op: "badge", text: "dual re-optimised", kind: "info" } ] },
      { caption: "<b>Still fractional → branch.</b> Suppose the new relaxation is fractional on A's parent-set choice (part {C}, part {}). No certificate yet, so BBLP branches on that edge variable I({C}→A): force it in one child, forbid it in the other.", ops: [
        { op: "highlightEdges", edges: [["C","A"]], cls: "hl" },
        { op: "badge", text: "fractional → branch", kind: "bad" } ] },
      { caption: "<b>Child 1: forbid C→A (I({C}→A)=0).</b> A falls back to its empty parent set {} (1.0), which makes A a root of the cluster and breaks the loop. Re-optimise the dual on this child.", ops: [
        { op: "removeEdge", from: "C", to: "A" },
        { op: "set", name: "LP solution", items: ["A ← {}   (1.0)", "B ← {A}  (3.0)", "D ← {B}  (2.8)", "C ← {D}  (2.2)"] },
        { op: "score", text: "child-1 bound = 1.0 + 3.0 + 2.8 + 2.2 = 9.0" },
        { op: "badge", text: "branch: forbid C→A", kind: "info" } ] },
      { caption: "<b>Decode an integral, acyclic DAG (Alg.98).</b> From the dual-adjusted scores BBLP induces the order A → B → D → C and gives each node its best order-respecting parents: A←{}, B←{A}, D←{B}, C←{D}. Whole numbers, no cycle.", ops: [
        { op: "addEdge", from: "D", to: "C" },
        { op: "highlightEdges", edges: [["A","B"],["B","D"],["D","C"]], cls: "good" },
        { op: "badge", text: "integral & acyclic", kind: "good" } ] },
      { caption: "<b>Strong-duality certificate.</b> This DAG's true score (9.0) meets the dual upper bound for the branch — the gap is closed, so it is provably optimal here. The sibling child (force C→A) re-creates a cycle, so its bound cannot beat 9.0 and it is fathomed.", ops: [
        { op: "score", text: "score 9.0 = bound → certificate" },
        { op: "badge", text: "branch fathomed", kind: "info" } ] },
      { caption: "<b>Return G*.</b> No remaining branch can beat 9.0, so the integral, acyclic solution A→B→D→C is certified the <i>global</i> optimum. Return the proven-optimal DAG.", ops: [
        { op: "highlightEdges", edges: [["A","B"],["B","D"],["D","C"]], cls: "good" },
        { op: "badge", text: "proven optimal G*", kind: "good" } ] }
    ]
  },

  complexity: "Exact BN structure learning is NP-hard, and the LP has exponentially many cluster constraints, so the worst case is exponential. In practice the dual (Lagrangian) bound, lazy cluster separation, parent-set pruning, and branch-and-bound let BBLP solve moderate problems (dozens of variables) to certified optimality; cost grows steeply with the number and size of candidate parent sets and with how loose the LP bound is.",
  strengths: [
    "Returns a <b>provably globally optimal</b> DAG with a strong-duality optimality certificate — not just a local optimum.",
    "The LP relaxation gives a tight optimistic bound, and cluster cutting planes forbid cycles far more effectively than plain cycle inequalities.",
    "Cleanly separates scoring (precomputed local family scores) from the combinatorial search (the LP + branch-and-bound), and exploits mature LP/dual machinery.",
    "Parent-set pruning shrinks the candidate lists before the LP is even built."
  ],
  limitations: [
    "Worst-case exponential; can be slow or infeasible when the LP bound is loose or there are many large candidate parent sets.",
    "Requires a decomposable score and a precomputable, well-pruned set of candidate parent sets.",
    "Generally produces a single best DAG (point estimate) and is heavier to run than fast heuristics like greedy hill-climbing.",
    "Effectiveness hinges on tight separation and good dual convergence; weak cuts mean little pruning."
  ],
  notes: "BBLP is the LP-based exact approach that GOBNILP builds on. The feasible region is a polytope whose vertices are exactly the DAGs (Recall 90); cluster constraints (Example 102, Fig.213 — a cluster with vs. without a root) are the workhorse inequalities, since cycle inequalities alone fail to block every fractional cycle (Example 100, Fig.212). Algorithm 98 alternates improving the Lagrangian dual bound (coordinate descent) with decoding an integral DAG from the dual-adjusted scores; when the decoded score meets the bound, strong duality certifies optimality, otherwise it separates a violated cut and enters branch-and-bound.",
  figureRefs: "Paper §5.6 (pp.335–339): Algorithm 98 (BBLP, p.339), Recall 89 (LP viewpoint / indicator variables, p.336), Recall 90 (polytope — DAGs are the vertices, p.336), the cluster constraint ∀C⊆V: ∑_{u∈C}∑_{W:W∩C=∅} I(W→u) ≥ 1 (p.336), Recall 91 (cluster relaxation / outer polytope) and Recall 92 (Lagrangian dual, p.337), Example 100 + Fig.212 (cycle-inequality examples), Example 101 (3-cycle cut), Example 102 + Fig.213 (cluster with/without a root)."
};
