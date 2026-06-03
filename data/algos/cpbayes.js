/* CPBayes — Constraint Programming for Bayesian network structure learning.
   Grounded in §4.36 (pp.180-183), van Beek & Hoffmann [650].
   Worked examples = Ex.46-49; Figs.101 (ordering tree), 102 (branch-and-bound),
   103-104 (depth), 105-106 (symmetry-breaking transformations). */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["cpbayes"] = {
  name: "CPBayes (Constraint Programming for BN structure learning)",
  oneLiner: "Find the provably highest-scoring DAG by phrasing structure learning as a constraint-programming problem — search over node orderings with a branch-and-bound tree, propagating acyclicity and dominance/symmetry-breaking constraints to prune away choices that can never be optimal.",
  basedOnText: "CPBayes is an exact, score-based method. Like OptOrd and OBS it reasons over orderings of the variables, but it casts the task as a Constraint Satisfaction/Optimisation Problem and lets a CP solver branch, propagate and prune until it returns a structure that is guaranteed optimal.",

  assumptions: [
    "<b>Decomposable score</b> — the network score is a sum of per-family scores, score(G|D) = Σ<sub>X</sub> FamScore(X, Pa<sub>X</sub> | D), so each node can be scored from its own parent set.",
    "<b>Pre-computed candidate parent sets</b> — for each variable X a family U(X) = ⋃<sub>q∈Pa<sub>X</sub></sub> q of admissible parent sets (and their scores) is available before search.",
    "<b>Exactness is wanted</b> — the goal is the single best DAG (the global optimum), not just a good one; CPBayes invests search effort to <i>prove</i> optimality."
  ],
  input: "A dataset D over variables V, a decomposable family-score table FamScore(X, Pa<sub>X</sub> | D) listing the candidate parent sets and their scores for every variable.",
  output: "A single Bayesian-network DAG G that <b>maximises</b> score(G|D) subject to acyclicity — proven optimal.",

  idea: [
    "Constraint programming is a declarative style of problem solving: you <b>declare the variables, the rules (constraints) they must satisfy, and an objective</b>, then a generic CP solver assigns values to the variables, <i>propagating</i> the constraints to rule out impossible choices, and searches what is left. CPBayes applies exactly this recipe to structure learning.",
    "The decision variables are an <b>ordering</b> of the network's nodes, σ = (σ<sub>1</sub> ≺ … ≺ σ<sub>n</sub>). An ordering is convenient because once you fix it, every node may only pick parents from the nodes <i>before</i> it — so a valid ordering can never create a cycle. Choosing the ordering plus the best legal parents for each position gives a DAG.",
    "Search is a <b>depth-first branch-and-bound</b> tree (Fig.101–102). Each node of the tree fixes a <i>prefix</i> of the ordering; extending the prefix is a branch. Two pieces of information ride along with each prefix: a <b>lower bound LB</b> (the best complete DAG found so far — the incumbent) and an <b>upper bound UB</b> (the best score any completion of this prefix could possibly reach). If UB ≤ LB the whole subtree is hopeless and is pruned.",
    "On top of the basic acyclicity reasoning, CPBayes adds <b>dominance constraints</b> and <b>symmetry-breaking constraints</b>. Dominance says: if one prefix can be shown to be no better than another for every possible completion, drop it. Symmetry-breaking says: many different orderings encode the <i>same</i> DAG or equivalent ones, so fix a canonical form (e.g. break ties lexicographically) and refuse to re-explore equivalent branches. These extra constraints are the workhorses that make the exact search tractable in practice."
  ],

  steps: [
    "<b>Pre-compute families.</b> For every variable X build its candidate parent sets U(X) and their scores FamScore(X, Pa<sub>X</sub> | D). This table is the only data the search touches.",
    "<b>State the CP model.</b> Decision variables = the position/ordering of the nodes; objective = maximise score(G|D) = Σ<sub>X</sub> FamScore(X, Pa<sub>X</sub> | D); constraint = the chosen parents must respect the ordering (hence be acyclic).",
    "<b>Branch.</b> Search depth-first, extending the ordering one node at a time. Each partial ordering is a <i>prefix</i>; placing the next node in the prefix is a branching decision. The best parents for a positioned node are read straight from its family table (only earlier nodes are eligible).",
    "<b>Propagate constraints.</b> After each branch, propagate: fixing a node's position removes it from the candidate parents of nodes still to be placed, and acyclicity prunes parent-set choices that would close a cycle.",
    "<b>Bound and prune.</b> Maintain the incumbent score as a lower bound LB and compute an upper bound UB on the best completion of the current prefix. If UB ≤ LB the prefix cannot beat the incumbent, so cut the branch (Fig.102).",
    "<b>Apply dominance constraints.</b> If a prefix is provably dominated — no completion of it can beat some already-considered alternative — prune it (e.g. a 'redundant prefix' whose ordering yields the same DAG with worse depth, or a prefix whose families are pairwise inferior). Dominance I/II/III compare prefixes by consistency, induced parent sets and accumulated score.",
    "<b>Apply symmetry-breaking constraints.</b> Because many orderings represent the same or equivalent structures, enforce a canonical choice: break permutation ties lexicographically, skip orderings that merely swap interchangeable variables, and (optionally) avoid covered-edge reversals that stay in the same equivalence class. Equivalent branches are never re-explored.",
    "<b>Update incumbent.</b> Whenever search reaches a complete ordering whose DAG scores higher than LB, record it as the new best (raise LB).",
    "<b>Return the proven optimum.</b> When the tree is exhausted (every branch either explored or pruned), the incumbent is guaranteed to be the globally highest-scoring acyclic structure — return it."
  ],

  keyConcepts: [
    { term: "Constraint program (CSP/COP)", def: "A declarative formulation: decision variables, constraints they must satisfy, and an objective to optimise. A generic solver assigns values, propagates constraints to remove impossible options, and searches the rest." },
    { term: "Ordering / prefix", def: "A (partial) total order of the nodes, σ₁ ≺ … ≺ σₙ. A prefix fixes the first few positions; each node may only take parents from earlier positions, which guarantees acyclicity." },
    { term: "Decomposable score", def: "score(G|D) = Σ FamScore(X, Paₓ | D): the network score is the sum of independent per-family scores, so each node's best parents can be chosen locally given the ordering." },
    { term: "Branch-and-bound (LB / UB)", def: "Depth-first search keeping a lower bound LB (best DAG found so far, the incumbent) and an upper bound UB on each prefix. A subtree with UB ≤ LB is pruned because it cannot beat the incumbent." },
    { term: "Dominance constraint", def: "A rule that discards a prefix when another candidate is provably at least as good for every completion — based on consistency (I), induced parent sets (II), or accumulated local scores (III)." },
    { term: "Symmetry-breaking constraint", def: "A rule that fixes a canonical representative among equivalent orderings (lexicographic tie-breaking, ignoring interchangeable-variable swaps, covered-edge reversals) so equivalent branches are never explored twice." }
  ],

  animation: {
    title: "CPBayes branch-and-bound over orderings of {A,B,C,D} (illustrative 4-node example in the paper's style; depth/ordering ideas from Figs.101–105).",
    nodes: [
      { id: "A", x: 0.30, y: 0.12 },
      { id: "B", x: 0.72, y: 0.12 },
      { id: "C", x: 0.30, y: 0.62 },
      { id: "D", x: 0.72, y: 0.88 }
    ],
    edges: [],
    steps: [
      { caption: "<b>Declare the CP model.</b> Decision variables = an ordering of {A,B,C,D}; objective = maximise score(G|D) = Σ FamScore(X, Pa<sub>X</sub>|D); constraint = parents must respect the ordering (no cycles). Search will branch on the ordering and prune.", ops: [
        { op: "set", name: "Parent-set choices", items: ["A: pick from {} ∅", "B: pick from {} ∅", "C: pick from {} ∅", "D: pick from {} ∅"] },
        { op: "badge", text: "CP model: variables + constraints + objective", kind: "info" } ] },
      { caption: "<b>Branch: place A first.</b> A is the root of this prefix (σ₁ = A), so A has no parents. Extending the ordering is a branching decision in the search tree.", ops: [
        { op: "highlightNodes", ids: ["A"], cls: "hl" },
        { op: "set", name: "Parent-set choices", items: ["A: ∅  (placed 1st)"] },
        { op: "badge", text: "branch: prefix = (A)", kind: "info" } ] },
      { caption: "<b>Branch + assign parents: B after A.</b> With σ = (A ≺ B), B may only take parents from {A}. Its best legal family is Pa<sub>B</sub> = {A}: add A → B.", ops: [
        { op: "addEdge", from: "A", to: "B", type: "directed" },
        { op: "set", name: "Parent-set choices", items: ["B: {A}  (placed 2nd)"] },
        { op: "score", text: "partial score = -3.1" },
        { op: "badge", text: "branch: prefix = (A, B)", kind: "info" } ] },
      { caption: "<b>Propagate constraints.</b> Fixing A and B as the prefix removes them as 'free' choices and restricts the remaining nodes: C and D may now draw parents only from {A, B} (plus each other, by order). Impossible options are pruned from their candidate families.", ops: [
        { op: "highlightNodes", ids: ["A", "B"], cls: "ok" },
        { op: "set", name: "Parent-set choices", items: ["C: pick from {A,B,…}", "D: pick from {A,B,…}"] },
        { op: "badge", text: "propagate: shrink C's & D's candidate parents", kind: "info" } ] },
      { caption: "<b>Branch: place C, choose Pa<sub>C</sub> = {A}.</b> Add A → C. So far prefix (A, B, C) with score still improving.", ops: [
        { op: "addEdge", from: "A", to: "C", type: "directed" },
        { op: "set", name: "Parent-set choices", items: ["C: {A}  (placed 3rd)"] },
        { op: "score", text: "partial score = -4.6" },
        { op: "badge", text: "branch: prefix = (A, B, C)", kind: "info" } ] },
      { caption: "<b>Acyclicity violation on one branch.</b> A rival branch tries to give A a parent in D (D → A) while A → B → … already feeds back: that closes a cycle A → … → D → A. The acyclicity constraint forbids it — this branch is dead.", ops: [
        { op: "addEdge", from: "D", to: "A", type: "directed" },
        { op: "highlightNodes", ids: ["A", "D"], cls: "bad" },
        { op: "highlightEdges", edges: [["A","B"],["D","A"]], cls: "bad" },
        { op: "badge", text: "prune (acyclicity): cycle D→A detected — backtrack", kind: "bad" } ] },
      { caption: "<b>Backtrack.</b> Remove the illegal edge and abandon that subtree. Search returns to the last good prefix (A, B, C).", ops: [
        { op: "removeEdge", from: "D", to: "A" },
        { op: "highlightNodes", ids: ["A", "B", "C"], cls: "ok" },
        { op: "badge", text: "backtrack to prefix (A, B, C)", kind: "info" } ] },
      { caption: "<b>Symmetry-break: skip an equivalent branch.</b> The ordering (B, A, …) with B and A interchangeable would encode the same DAG as (A, B, …). The symmetry-breaking constraint keeps only the lexicographically-smaller representative, so the (B, A, …) subtree is never explored.", ops: [
        { op: "set", name: "Parent-set choices", items: ["skip (B, A, …): equivalent to (A, B, …)"] },
        { op: "badge", text: "symmetry-break: prune equivalent ordering", kind: "info" } ] },
      { caption: "<b>Bound check.</b> A different prefix's upper bound UB is computed; it is no better than the incumbent's lower bound LB (UB ≤ LB), so by branch-and-bound the whole subtree cannot win — prune it without expanding.", ops: [
        { op: "badge", text: "prune (bound): UB ≤ LB — subtree cannot beat incumbent", kind: "bad" } ] },
      { caption: "<b>Complete the best ordering.</b> Place D last with Pa<sub>D</sub> = {C}: add C → D. The full ordering (A, B, C, D) yields a complete acyclic structure.", ops: [
        { op: "addEdge", from: "C", to: "D", type: "directed" },
        { op: "highlightNodes", ids: ["A", "B", "C", "D"], cls: "ok" },
        { op: "set", name: "Parent-set choices", items: ["D: {C}  (placed 4th)"] },
        { op: "score", text: "complete score = -5.8  (new incumbent, raise LB)" },
        { op: "badge", text: "new incumbent: LB updated", kind: "good" } ] },
      { caption: "<b>Tree exhausted → proven optimal.</b> Every remaining branch was pruned by acyclicity, bounds, dominance or symmetry. The incumbent DAG A → B, A → C, C → D is the globally highest-scoring structure.", ops: [
        { op: "highlightEdges", edges: [["A","B"],["A","C"],["C","D"]], cls: "good" },
        { op: "score", text: "optimal score = -5.8" },
        { op: "badge", text: "optimal: globally best DAG, proven", kind: "good" } ] }
    ]
  },

  complexity: "Worst case super-exponential — finding the optimal BN structure is NP-hard, and the ordering search space is n! — but the combination of branch-and-bound bounds, acyclicity propagation, and dominance + symmetry-breaking constraints prunes enormous parts of the tree, so CPBayes solves instances exactly that are out of reach for naïve search. Effort is spent both finding the optimum and proving it.",
  strengths: [
    "Exact: returns a provably globally optimal DAG, not a heuristic local optimum.",
    "Dominance and symmetry-breaking constraints prune aggressively, making exact search practical on non-trivial problems.",
    "Declarative CP formulation cleanly separates the model (variables, acyclicity, objective) from the generic branch-and-propagate solver."
  ],
  limitations: [
    "Still fundamentally exponential — very large variable counts or dense candidate-parent families remain hard.",
    "Needs the candidate parent sets and decomposable family scores pre-computed; their number can blow up with high in-degree limits.",
    "Performance depends on tight bounds and effective constraints; on adversarial instances pruning is weak and the search is slow."
  ],
  notes: "CPBayes shares its ordering-based view with OptOrd and OBS: like OptOrd it searches the space of variable orderings, and like OBS it exploits that a fixed ordering makes the best parent choice easy. Its contribution is encoding this as a constraint program and adding dominance (I/II/III) and symmetry-breaking (I/II/III) constraints — redundant-prefix elimination, interchangeable-variable permutation pruning, and covered-edge handling — to shrink the exact search.",
  figureRefs: "Paper §4.36 (pp.180–183): Fig.101 (ordering/prefix tree as partial vs total orders), Fig.102 (depth-first branch-and-bound with LB/UB pruning), Figs.103–104 (ordering depth definition), Figs.105–106 (symmetry-breaking via permutations and covered-edge transformations); Examples 46–49 (symmetric permutations, redundant prefixes, consistency, symmetric menus)."
};
