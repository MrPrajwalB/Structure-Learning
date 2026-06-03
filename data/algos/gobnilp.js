/* GOBNILP — Globally Optimal BN learning via Integer Linear Programming.
   Grounded in §4.26 (pp.144-151): Algorithm 33 (branch-and-cut with cluster
   separation, p.148), the 0-1 ILP formulation (p.145), cluster/acyclicity
   constraints (Fig.84), the cycle-inequality Example 36 + Fig.85 (3-cycle),
   and the cutting-plane / branch-and-cut picture (Fig.86). */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["gobnilp"] = {
  name: "GOBNILP (Globally Optimal BN learning via ILP)",
  oneLiner: "Precompute a score for every candidate parent set, then turn 'pick the best parents for each node without making a cycle' into an integer linear program that a solver optimises exactly — forbidding cycles by adding cluster constraints on the fly until the answer is acyclic.",
  basedOnText: "GOBNILP is an exact, score-based method: instead of searching the space of DAGs heuristically, it casts the whole problem as a 0-1 integer linear program (ILP) and hands it to a solver, which returns a provably globally optimal network. It builds on the branch-and-cut / linear-programming approach of Bartlett & Cussens.",

  assumptions: [
    "<b>Decomposable score</b> — the network's total quality is a sum of <i>local</i> family scores, one per node and its parent set (e.g. BIC/BDeu). This is what lets the objective be written as a linear sum.",
    "<b>Precomputed candidate parent sets</b> — for each node a (usually pruned) list of plausible parent sets and their scores is computed up front; the ILP only chooses among these.",
    "<b>Bounded parent-set size</b> — in practice the number of candidate parent sets is kept manageable (a cap on parents), otherwise the variable count explodes."
  ],
  input: "A dataset D over variables V, and for each variable X its candidate parent sets {P_X} with precomputed local family scores FamScore(X, W | D).",
  output: "A single <b>globally optimal DAG G*</b> — the highest-total-score acyclic network, with a certificate of optimality from the ILP solver.",

  idea: [
    "GOBNILP reframes structure learning as an <i>optimisation</i> problem rather than a search. First it computes, for every node, a score for each candidate parent set it might be given. Then it asks one clean question: which assignment of one parent set to every node maximises the total score, subject to the result being a valid (acyclic) DAG?",
    "That question is encoded as a <b>0-1 integer linear program</b>. There is one binary variable per (node, parent-set) pair — call it I(W→X), equal to 1 if node X is given exactly the parent set W. The <b>objective</b> is to maximise the sum of FamScore(X,W|D) over all chosen variables. The <b>'one parent set per node'</b> rule is a simple linear equation; the hard part is forbidding cycles.",
    "Cycles are ruled out with <b>cluster constraints</b>. For any set of nodes C, a valid DAG must have at least one node in C whose parents all lie <i>outside</i> C — otherwise the nodes in C would form a cycle. Writing this for the right clusters forbids exactly the cyclic solutions.",
    "There are far too many clusters to list them all in advance, so GOBNILP uses <b>cutting planes</b>: it solves a relaxed problem, and whenever the solution contains a cycle it generates just the cluster constraint that 'cuts off' that cycle, adds it, and re-solves. This loop repeats until the optimum is acyclic — at which point it is the proven global optimum (branch-and-bound handles any leftover fractional cases)."
  ],

  steps: [
    "<b>Precompute local scores.</b> For each variable X and each candidate parent set W, compute the family score FamScore(X, W | D). Prune dominated parent sets to keep the list small.",
    "<b>Create variables.</b> Introduce one binary variable I(W→X) ∈ {0,1} for every stored (parent-set, node) pair: 1 means 'X uses exactly parent set W'.",
    "<b>Set the objective.</b> Maximise ∑<sub>X</sub> ∑<sub>W</sub> FamScore(X, W | D) · I(W→X) — the total network score expressed as a linear sum.",
    "<b>'Convexity' constraint — one parent set per node.</b> Add ∑<sub>W</sub> I(W→X) = 1 for every X, so each node selects exactly one parent set.",
    "<b>Solve the LP relaxation.</b> Drop the integrality and solve the linear program; if rounding gives a valid acyclic DAG, update the incumbent (best integral solution so far).",
    "<b>Separate clusters (find a cut).</b> Look for a set of nodes C whose cluster constraint ∑<sub>X∈C</sub> ∑<sub>W: W∩C=∅</sub> I(W→X) ≥ 1 is violated — i.e. a region with no parents reaching in from outside (a 'cycle that breaks the rule').",
    "<b>Add the cutting plane.</b> If a violated cluster (or, on a fractional solution, a Gomory) cut is found, add it to the program and re-solve the LP. This tightens the relaxation and removes that cyclic solution.",
    "<b>Branch if needed.</b> If no cut is found but the LP solution is still fractional, branch on a variable (branch-and-bound) to drive it toward integrality.",
    "<b>Fathom.</b> Stop exploring a node once its LP solution is integral and acyclic, or once its bound cannot beat the incumbent.",
    "<b>Return</b> the optimal DAG G* decoded from the chosen parent-set variables, certified globally optimal."
  ],

  keyConcepts: [
    { term: "Local / family score FamScore(X,W|D)", def: "The score of giving node X exactly the parent set W, computed once from the data. The total network score is the sum of these, which makes the objective linear." },
    { term: "Binary variable I(W→X)", def: "A 0-1 decision variable that is 1 exactly when node X is assigned parent set W. The DAG is read off from which of these equal 1." },
    { term: "Convexity constraint", def: "∑_W I(W→X) = 1 for each node — the rule that every node picks exactly one parent set." },
    { term: "Cluster (acyclicity) constraint", def: "For a node set C, at least one member must take all its parents from outside C: ∑_{X∈C} ∑_{W∩C=∅} I(W→X) ≥ 1. A cycle inside C violates this, so these constraints forbid cycles." },
    { term: "Cutting plane", def: "A linear inequality (here a violated cluster constraint) added to the program to slice off an invalid LP solution and tighten the relaxation, instead of listing all constraints up front." },
    { term: "Branch-and-cut", def: "The exact solving scheme: solve the LP relaxation, add cluster cuts when cycles appear, branch when the solution is fractional, and fathom nodes — yielding a certified global optimum (Algorithm 33)." },
    { term: "Incumbent", def: "The best valid (integral, acyclic) DAG found so far; its score is a lower bound used to prune the search." }
  ],

  animation: {
    title: "GOBNILP on a faithful 4-node example {A,B,C,D} (illustrative; the paper's worked case is the 3-cycle of Example 36 / Fig.85).",
    nodes: [
      { id: "A", x: 0.20, y: 0.18 },
      { id: "B", x: 0.80, y: 0.18 },
      { id: "C", x: 0.20, y: 0.82 },
      { id: "D", x: 0.80, y: 0.82 }
    ],
    edges: [],
    steps: [
      { caption: "<b>Precompute local scores.</b> For each node, score every candidate parent set FamScore(X,W|D). These fixed numbers are the only data the ILP needs.", ops: [
        { op: "set", name: "Candidate parent-set scores", items: ["A | {} : 1.0", "A | {C} : 2.5", "B | {A} : 3.0", "C | {D} : 2.2", "C | {} : 1.4", "D | {B} : 2.8"] },
        { op: "badge", text: "scores precomputed", kind: "info" } ] },
      { caption: "<b>Create variables.</b> One binary variable I(W→X) per stored (parent-set, node) pair: 1 means 'X uses exactly parent set W'. The DAG will be read off from the 1's.", ops: [
        { op: "badge", text: "binary I(W→X) ∈ {0,1}", kind: "info" } ] },
      { caption: "<b>Objective + convexity.</b> Maximise ∑ FamScore·I(W→X), subject to each node choosing exactly one parent set (∑_W I(W→X)=1).", ops: [
        { op: "score", text: "maximise total score; one parent set per node" },
        { op: "badge", text: "objective set", kind: "info" } ] },
      { caption: "<b>Solve LP relaxation (no acyclicity yet).</b> The relaxed program greedily picks the top-scoring parent set for each node, ignoring cycles for now.", ops: [
        { op: "badge", text: "LP relaxation solved", kind: "info" },
        { op: "set", name: "Chosen parent-sets", items: ["B ← {A}  (3.0)", "A ← {C}  (2.5)", "D ← {B}  (2.8)", "C ← {D}  (2.2)"] } ] },
      { caption: "<b>Draw the picked edges.</b> Each chosen parent set becomes arrows into its node: A←C, B←A, D←B, C←D.", ops: [
        { op: "addEdge", from: "C", to: "A" },
        { op: "addEdge", from: "A", to: "B" },
        { op: "addEdge", from: "B", to: "D" },
        { op: "addEdge", from: "D", to: "C" },
        { op: "score", text: "LP objective = 2.5 + 3.0 + 2.8 + 2.2 = 10.5" } ] },
      { caption: "<b>A cycle appears!</b> Following the arrows A→B→D→C→A loops back on itself — this is not a valid DAG. The cluster C={A,B,C,D} has no node taking parents from outside it.", ops: [
        { op: "highlightNodes", ids: ["A", "B", "C", "D"], cls: "hl" },
        { op: "highlightEdges", edges: [["C","A"],["A","B"],["B","D"],["D","C"]], cls: "bad" },
        { op: "badge", text: "cyclic — infeasible", kind: "bad" } ] },
      { caption: "<b>Separate cluster → add a cutting plane.</b> Add the violated cluster constraint ∑_{X∈C}∑_{W∩C=∅} I(W→X) ≥ 1 for C={A,B,C,D}: at least one node must take its parents from outside the cluster. This cut forbids exactly this cycle.", ops: [
        { op: "set", name: "Added cluster cuts", items: ["C={A,B,C,D}:  ≥1 node parents outside C"] },
        { op: "badge", text: "cluster cut added", kind: "info" } ] },
      { caption: "<b>Re-solve.</b> With the new constraint the cyclic assignment is illegal, so the LP must change at least one parent-set choice. Remove the cycle-forming edges.", ops: [
        { op: "removeEdge", from: "D", to: "C" },
        { op: "removeEdge", from: "C", to: "A" },
        { op: "highlightNodes", ids: ["A", "B", "C", "D"], cls: "" } ] },
      { caption: "<b>New, acyclic optimum.</b> The solver now gives A its empty parent set and C its {D} parents, breaking the loop while keeping the score as high as the acyclicity rule allows.", ops: [
        { op: "addEdge", from: "D", to: "C" },
        { op: "set", name: "Chosen parent-sets", items: ["B ← {A}  (3.0)", "A ← {}   (1.0)", "D ← {B}  (2.8)", "C ← {D}  (2.2)"] },
        { op: "score", text: "new objective = 1.0 + 3.0 + 2.8 + 2.2 = 9.0" },
        { op: "badge", text: "integral & acyclic", kind: "good" } ] },
      { caption: "<b>Fathom and return G*.</b> The solution is integral, acyclic, and no remaining branch can beat it — so it is certified the <i>global</i> optimum. Return the proven-optimal DAG A→B→D→C.", ops: [
        { op: "highlightEdges", edges: [["A","B"],["B","D"],["D","C"]], cls: "good" },
        { op: "badge", text: "proven globally optimal G*", kind: "good" } ] }
    ]
  },

  complexity: "Solving BN structure learning exactly is NP-hard, and the ILP can have exponentially many cluster constraints, so worst-case effort is exponential. In practice branch-and-cut with cluster separation and parent-set pruning solves moderate problems (dozens of variables) to certified optimality; cost grows steeply with the number and size of candidate parent sets.",
  strengths: [
    "Returns a <b>provably globally optimal</b> network, with an optimality certificate — not just a local optimum.",
    "Cleanly separates scoring (precomputed local scores) from the combinatorial search (the ILP).",
    "Leverages mature ILP/CIP solver technology (e.g. SCIP) and cutting-plane theory."
  ],
  limitations: [
    "Scales poorly to many variables or large parent sets, because the number of candidate-parent-set variables can explode.",
    "Relies on the score being decomposable and on a good pruned set of candidate parent sets being precomputable.",
    "Generally produces a single best DAG (point estimate), and is heavier to run than fast heuristics like greedy hill-climbing."
  ],
  notes: "GOBNILP is based on the integer/linear-programming branch-and-cut approach of Bartlett & Cussens. Cluster constraints (Fig.84) forbid cycles; they are added lazily as cutting planes when a violated cluster is found (Example 36, Fig.85 shows the behaviour on a 3-cycle). The cutting-plane picture (Fig.86) shows each added cut tightening the LP relaxation toward the integral optimum.",
  figureRefs: "Paper §4.26 (pp.144–151): Algorithm 33 (GOBNILP branch-and-cut with cluster separation, p.148), the 0-1 ILP formulation (p.145), Fig.84 (cluster constraints force a node to take parents outside C), Example 36 + Fig.85 (cycle inequalities on a 3-cycle), Fig.86 (a cutting plane tightens the LP relaxation)."
};
