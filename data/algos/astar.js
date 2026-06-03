/* A* — A-star search for optimal BN structure. Grounded in §4.27 (pp.152-154):
   the order-graph / subset-lattice cast as a shortest-path problem, the evaluation
   function f(S) = score(S) + h(S), the "ignore-acyclicity" admissible & consistent
   heuristic of Eq.(31) (Lemma 5), Algorithm 34 (A*), and the worked Example 38 on
   {A,B,C,D} (Fig.90). A* builds directly on the OptOrd dynamic-programming view —
   it traverses the SAME order graph, but uses the heuristic to expand far fewer
   states. Method due to Yuan et al. [764]. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["astar"] = {
  name: "A* search for optimal structure",
  oneLiner: "An exact score-based method that finds the single best-scoring Bayesian network by treating structure learning as a shortest-path problem on the lattice of variable subsets — using an optimistic heuristic to expand only the most promising states, so it does far less work than full dynamic programming while still guaranteeing the global optimum.",
  basedOnText: "A* takes the dynamic-programming view of OptOrd — every DAG has a leaf, so the best score of a variable set decomposes into the best family score of one leaf plus the best score of the rest — and turns it into a guided search. The same lattice of subsets becomes an <i>order graph</i>: a path from the empty set up to the full set spells out an optimal variable ordering (hence an optimal DAG). Instead of filling the whole 2<sup>n</sup> table, A* explores that graph strategically, steered by an admissible heuristic toward the optimum.",

  assumptions: [
    "<b>Decomposable score</b> — the network score is the sum of per-node family scores FamScore(X, U). This is what lets a path's cost be accumulated edge by edge and lets the leaf decomposition hold.",
    "<b>Admissible & consistent heuristic available</b> — A* needs an optimistic estimate of the remaining score that never under-estimates the best attainable future score (admissible) and never over-promises across a single step (consistent). The paper supplies such a heuristic (Eq.31).",
    "<b>Modest number of variables</b> — A* is exact and shares the worst-case 2<sup>n</sup> state space of OptOrd, but in practice the heuristic prunes most states, extending the reach to somewhat larger problems than plain DP."
  ],
  input: "A dataset 𝒟 over variables V and a decomposable family-score function FamScore(X, U | 𝒟) giving the score of node X with parent set U.",
  output: "A single <b>globally optimal DAG</b> G* — provably the highest-scoring network (not a local optimum, not an equivalence class).",

  idea: [
    "Picture the same subset lattice OptOrd fills, but now read it as an <b>order graph</b>: the start node is the empty set ∅, the goal node is the full set V, and a single step adds one variable — moving from a subset S to S∪{X}. The 'reward' of that step is the best family score X can earn using parents drawn from the variables already placed (S). A complete path from ∅ to V therefore lays out a full ordering of the variables, and the total reward along it is exactly the score of the corresponding DAG. <b>Finding the best path = finding the optimal DAG.</b>",
    "OptOrd solves this by exhaustively computing an answer for every one of the 2<sup>n</sup> subsets. A* is smarter: it does not know in advance which path leads to the optimum, so for every state S it forms an estimate of how good the <i>whole</i> path through S could possibly be. That estimate is the evaluation function <b>f(S) = score(S) + h(S)</b>: the genuine score earned so far (g) plus an <i>optimistic</i> guess h of the best score still to be earned from S onward.",
    "The heuristic h must be <b>admissible</b> — it may over-estimate the remaining reward (an upper bound) but must never under-estimate it, so it never makes a state look worse than it really is. The paper's choice is the <b>'ignore-acyclicity' heuristic</b> (Eq.31): for each variable not yet placed, give it its single best family score allowing <i>any</i> of the other variables as parents, even if that would create a cycle. Because it relaxes the acyclicity constraint, it can only be optimistic — a valid admissible bound. It is also <b>consistent</b> (Lemma 5): the estimate never drops by more than the reward actually gained on any one step, which is what guarantees A* returns the true optimum.",
    "A* keeps a frontier (the OPEN list) of reached-but-not-yet-expanded states, each tagged with its f value. At every iteration it expands the state with the <b>best f</b> — the most promising one — generating its successors and updating their best-known scores. A state whose f is worse than another path's proven value is effectively pruned: it never gets expanded. Because h is optimistic, the moment the goal V is pulled from the frontier, no unexpanded state can do better, so the path to V is provably optimal.",
    "The payoff versus OptOrd: same guaranteed global optimum, but the heuristic concentrates effort on promising frontiers, so most of the 2<sup>n</sup> states are never touched. The optimal DAG is then read off by backtracking the recorded path — each step's chosen leaf and its optimal parents reconstruct G*."
  ],

  steps: [
    "<b>Precompute local family scores.</b> For every node X and every candidate parent set U, compute and cache FamScore(X, U | 𝒟). These are the per-step rewards on the order graph and the ingredients of the heuristic.",
    "<b>Set up the search.</b> Create the start state S = ∅ with score(∅) = 0 and evaluation key f(∅) = h(∅). Put it on the frontier (OPEN). The goal state is the full set V.",
    "<b>Expand the best state.</b> Remove from OPEN the state S with the highest evaluation key f(S) = score(S) + h(S) — the most promising frontier — and mark it expanded.",
    "<b>Generate successors.</b> For each variable Y not yet in S, form the successor S′ = S∪{Y}. Its immediate gain is max<sub>U⊆S</sub> FamScore(Y, U) — Y's best family score using parents already placed. The new partial score is score(S′) = score(S) + that gain.",
    "<b>Update best-known values.</b> If this path gives S′ a better score than any previously found, record it (and a back-pointer: S′ was reached from S by adding Y with parents U*) and (re)insert S′ into OPEN with key f(S′) = score(S′) + h(S′). States whose f can never beat a known path are left unexpanded — that is the pruning.",
    "<b>Stop at the goal.</b> Repeat steps 3–5 until the state selected for expansion is the full set V. Because h is admissible/consistent, at that moment score(V) equals the global optimum and no unexpanded frontier can do better.",
    "<b>Reconstruct G* by backtracking.</b> Follow the back-pointers from V down to ∅: each step's recorded variable Y and its optimal parents U* are added to the DAG. The sequence of additions is the optimal variable ordering; the families form the globally optimal DAG G*."
  ],

  keyConcepts: [
    { term: "Order graph (subset lattice)", def: "A graph whose nodes are subsets of the variables, with ∅ at the bottom and V at the top. An edge S → S∪{X} adds one variable. A path from ∅ to V is a complete variable ordering — the same lattice OptOrd fills, here searched." },
    { term: "score(S) — the 'g' cost", def: "The genuine accumulated score along the path so far, i.e. the best total family score over the variables already placed in S. This is the part of f that is already paid for." },
    { term: "Heuristic h(S) — the optimistic future", def: "An upper bound on the best score still earnable from S to the goal. The paper uses the 'ignore-acyclicity' bound (Eq.31): each remaining variable picks its best parents from anywhere, even if that breaks acyclicity." },
    { term: "Evaluation function f = score + h", def: "The key A* uses to rank states: realised score plus optimistic remaining score. A* always expands the state with the best f, focusing on the most promising path." },
    { term: "Admissible & consistent (Recall 36, Lemma 5)", def: "Admissible = never under-estimates the remaining reward; consistent = never drops by more than the gain on a single step. Consistency implies admissibility and guarantees A* returns the true optimum." },
    { term: "OPEN / frontier & back-pointers", def: "OPEN holds reached-but-unexpanded states with their f keys; back-pointers record how each state was reached (which variable, which parents) so the optimal DAG can be rebuilt by backtracking from V." }
  ],

  animation: {
    title: "A* on the paper's four-variable example {A,B,C,D} (Example 38, Fig.90). Scores are the f = score + h keys; A* maximizes the key.",
    nodes: [
      { id: "A", x: 0.18, y: 0.30 },
      { id: "B", x: 0.82, y: 0.30 },
      { id: "C", x: 0.50, y: 0.08 },
      { id: "D", x: 0.50, y: 0.85 }
    ],
    edges: [],
    steps: [
      { caption: "<b>Goal.</b> Find the single best-scoring DAG over {A,B,C,D}. A* searches the order graph of subsets: start at ∅, goal at the full set {A,B,C,D}, each step adds one variable with its best parents. The path's total reward is the DAG's score.", ops: [{ op: "badge", text: "exact · A* on order graph", kind: "info" }] },
      { caption: "<b>Start state ∅.</b> The empty set has score(∅) = 0; its whole value is the optimistic heuristic. The initial bound is f(∅) = 80 (Fig.90a) — an upper bound on any DAG's score. Put ∅ on the frontier (OPEN).", ops: [{ op: "set", name: "Subset (path)", items: ["∅"] }, { op: "score", text: "g+h = f : 0 + 80 = 80" }, { op: "badge", text: "expand ∅", kind: "info" }] },
      { caption: "<b>Expand ∅ → evaluate the four candidate first-variables.</b> Each singleton gets a key f = (best family score so far) + (heuristic on the rest): f(A)=77, f(B)=63, f(C)=78, f(D)=50 (Fig.90b). A* compares these on the frontier.", ops: [{ op: "highlightNodes", ids: ["A","B","C","D"], cls: "hl" }, { op: "score", text: "OPEN keys: f(A)=77, f(B)=63, f(C)=78, f(D)=50" }] },
      { caption: "<b>Pick the best f → select C.</b> C has the highest key f(C) = 78, so A* expands the state {C} first — the most promising frontier. The other singletons stay on OPEN, unexpanded for now.", ops: [{ op: "set", name: "Subset (path)", items: ["{C}"] }, { op: "highlightNodes", ids: ["C"], cls: "leaf" }, { op: "score", text: "expand {C} : f = 78 (highest)" }, { op: "badge", text: "best-f chosen", kind: "good" }] },
      { caption: "<b>Expand {C} → its successors.</b> Adding B with C as a possible parent gives the state {B,C} with key f(BC) = 75 (Fig.90c). It joins the frontier alongside the earlier singletons.", ops: [{ op: "set", name: "Subset (path)", items: ["{C}","{B,C}"] }, { op: "highlightNodes", ids: ["B"], cls: "hl" }, { op: "score", text: "successor {B,C} : f = 75" }] },
      { caption: "<b>Re-rank the frontier.</b> Now the best key on OPEN is the singleton {A} with f(A) = 77, which beats {B,C} at 75. So A* heads back and expands A next — the heuristic, not greed, decides the order.", ops: [{ op: "set", name: "Subset (path)", items: ["{A}"] }, { op: "highlightNodes", ids: ["A"], cls: "leaf" }, { op: "score", text: "OPEN: f(A)=77 > f(BC)=75 → expand {A}" }, { op: "badge", text: "frontier re-ranked", kind: "info" }] },
      { caption: "<b>Expand {A} → prune a hopeless branch.</b> The successor {A,D} comes out with key f(AD) = 43 (Fig.90d) — far below the proven 75 of {B,C}. Its optimistic estimate already loses, so A* never expands it. (Plain OptOrd would still compute every such subset.)", ops: [{ op: "set", name: "Subset (path)", items: ["{A,D}"] }, { op: "highlightNodes", ids: ["A","D"], cls: "muted" }, { op: "score", text: "{A,D} : f = 43 « 75" }, { op: "badge", text: "pruned: f too low", kind: "bad" }] },
      { caption: "<b>Frontier returns to {B,C}.</b> With {A,D} discarded, the best remaining key is {B,C} at f = 75. A* expands it next, continuing toward the goal.", ops: [{ op: "set", name: "Subset (path)", items: ["{B,C}"] }, { op: "highlightNodes", ids: ["B","C"], cls: "leaf" }, { op: "score", text: "expand {B,C} : f = 75 (best on OPEN)" }] },
      { caption: "<b>Expand {B,C} → state {B,C,D}.</b> Adding D, with its best parents drawn from {B,C}, creates {B,C,D} with key f(BCD) = 72 (Fig.90e). Commit this step of the optimal path: add the family for D, i.e. B → D and C → D.", ops: [{ op: "set", name: "Subset (path)", items: ["{B,C,D}"] }, { op: "highlightNodes", ids: ["D"], cls: "leaf" }, { op: "score", text: "successor {B,C,D} : f = 72 ; leaf D, parents {B,C}" }, { op: "addEdge", from: "B", to: "D" }, { op: "addEdge", from: "C", to: "D" }, { op: "orient", from: "B", to: "D", type: "directed" }, { op: "orient", from: "C", to: "D", type: "directed" }] },
      { caption: "<b>Reach the goal {A,B,C,D}.</b> Expanding {B,C,D} adds A and the edge BCD → ABCD lands on the full set with f(ABCD) = 71 (Fig.90f). Backtracking the path also fixes B → C (C's optimal parent) and B's family. The DAG is complete.", ops: [{ op: "set", name: "Subset (path)", items: ["{A,B,C,D}"] }, { op: "highlightNodes", ids: ["A","B","C","D"], cls: "leaf" }, { op: "score", text: "goal {A,B,C,D} : f = 71" }, { op: "addEdge", from: "B", to: "C" }, { op: "orient", from: "B", to: "C", type: "directed" } ] },
      { caption: "<b>Optimality certified.</b> Because the heuristic is admissible and consistent, once the goal is the best state on the frontier (f = 71) no unexpanded path can beat it — A* has proven the global optimum. Far fewer states were expanded than OptOrd's full 2ⁿ table.", ops: [{ op: "highlightNodes", ids: ["A","B","C","D"], cls: "good" }, { op: "badge", text: "global optimum certified (f = 71)", kind: "good" }] },
      { caption: "<b>Result — the globally optimal DAG G*.</b> B → C, B → D, C → D, with A placed by the final step. Reconstructed by following the back-pointers from the goal down to ∅. Exact like OptOrd, but the optimistic heuristic let A* skip most of the lattice.", ops: [{ op: "highlightNodes", ids: ["A","B","C","D"], cls: "good" }, { op: "badge", text: "optimal G* returned", kind: "good" }] }
    ]
  },

  complexity: "Worst-case exponential, sharing OptOrd's 2ⁿ order-graph state space: every subset is a potential state and each expansion considers each remaining variable with its best parent set. In practice the admissible heuristic prunes the vast majority of states, so A* typically expands only a small fraction of the lattice and reaches larger problems than plain DP — but it still requires precomputing local family scores and offers no polynomial guarantee.",
  strengths: [
    "Returns the provably globally optimal DAG — exact, no local optima.",
    "The admissible/consistent heuristic focuses search on promising frontiers, expanding far fewer states than OptOrd's exhaustive DP.",
    "Works with any decomposable score; back-pointers cleanly reconstruct the optimal ordering and DAG."
  ],
  limitations: [
    "Same exponential worst case as DP: on hard instances the frontier can still blow up in time and memory.",
    "Needs a good admissible heuristic and precomputed local family scores; a loose heuristic erodes the pruning advantage.",
    "Returns a single optimal DAG rather than the whole Markov-equivalence class."
  ],
  notes: "The A* formulation for BN structure learning is due to Yuan et al. [764], who cast the OptOrd order graph as a shortest-path problem with the 'ignore-acyclicity' heuristic. Related work tightens the heuristic and search: Fan and Yuan [179] proposed Components Grouping (CG), building a parent-relation graph, finding strongly connected components and grouping them under a budget so the lower bound hugs the true cost-to-go and node expansions drop sharply without losing exactness. Karan and Zola [316] recast the DP recurrences as a shortest-path search on the lattice using compact parent graphs and a deterministic path-extension rule. Tan et al. [622] studied search in the order-graph state space, and BiHS [763] runs a bidirectional A* (forward from ∅, backward from V) with admissible heuristics in both directions to terminate sooner.",
  figureRefs: "Paper §4.27 (pp.152-154): the OptOrd score recursion and order-graph view; evaluation function f(S) = score(S) + h(S); Recall 36 (admissible & consistent heuristics); the 'ignore-acyclicity' heuristic Eq.(31) and Lemma 5 (its consistency); Algorithm 34 (A*); Example 38 and Fig.90 (the {A,B,C,D} trace, panels a–f with f(∅)=80, f(C)=78, f(A)=77, f(BC)=75, f(AD)=43, f(BCD)=72, goal f(ABCD)=71)."
};
