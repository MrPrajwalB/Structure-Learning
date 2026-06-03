/* K2 — score-based, ordering-driven greedy parent search. Grounded in §4.2 (pp.25-30):
   Algorithm 4 (K2 algorithm, p.26), the K2/Bayesian marginal-likelihood score with
   Dirichlet priors (Example 5, pp.26-27), and the worked example Fig.9 (order A≺B≺C≺D, p.30). */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["k2"] = {
  name: "K2 algorithm",
  oneLiner: "Given a fixed ordering of the variables, build a DAG by greedily adding to each node the earlier-ordered parent that most improves a Bayesian (K2) score, stopping when no parent helps or a parent cap is reached.",
  basedOnText: "K2 is the archetypal score-based search method: it pairs a decomposable Bayesian score with a simple greedy hill-climb made tractable by assuming the variable order is known in advance.",

  assumptions: [
    "<b>Known variable ordering</b> — a topological order X₁ ≺ X₂ ≺ … ≺ Xₙ is given; a node may only take parents from variables that come <i>before</i> it.",
    "<b>Discrete data</b> — variables are categorical, so counts of each parent-configuration can be tabulated.",
    "<b>Parameter independence + Dirichlet priors</b> — the score assumes a Dirichlet prior on each conditional distribution, which yields a closed-form marginal likelihood.",
    "<b>Decomposable score</b> — the total score is a product (sum in log) of independent <i>local</i> scores, one per node, so each node can be optimised on its own."
  ],
  input: "A discrete dataset over variables, a fixed variable ordering, and an optional maximum number of parents per node d.",
  output: "A <b>single DAG</b> consistent with the given ordering (not an equivalence class) — each node annotated with its chosen parent set.",

  idea: [
    "K2 sidesteps the hardest part of structure learning — deciding edge directions and avoiding cycles — by being <i>handed a variable order</i>. Because every node can only point to earlier nodes, the result is automatically a DAG, and learning reduces to choosing a parent set for each node separately.",
    "It scores candidate structures with the <b>K2 score</b> (a Bayesian marginal likelihood with Dirichlet priors). Conceptually this score measures how well a chosen set of parents explains a variable's data: it rewards parents that make the variable predictable, while implicitly penalising overly complex parent sets that just memorise noise.",
    "Search is a simple <b>greedy hill-climb</b>. For each node, start with no parents, then repeatedly try adding the single eligible predecessor that raises the local score the most; keep it if it helps, and stop as soon as no addition helps (or the parent cap d is hit).",
    "Because the score decomposes node-by-node and the order forbids cycles, K2 never has to check the global graph for cycles or re-orient edges — making it fast, but only as good as the supplied ordering."
  ],

  steps: [
    "<b>Initialise.</b> Start from the empty DAG G₀ on X₁ … Xₙ (no edges). Optionally fix a maximum parent count d.",
    "<b>Take the next node</b> Xᵢ in the given order. Its set of allowed parent candidates is exactly the nodes before it, Pred(Xᵢ) = {X₁, …, Xᵢ₋₁} (so X₁ has none).",
    "<b>Compute the current local score</b> of Xᵢ with its present parent set (initially empty): S_old = FamScore(Xᵢ, Parents(Xᵢ)).",
    "<b>Try every eligible new parent.</b> For each candidate Z in Pred(Xᵢ) not already a parent, compute the local score Xᵢ would get if Z were added, and <b>pick the highest</b> such score.",
    "<b>Add it if it helps.</b> If the best candidate's score exceeds S_old (the gain is positive) and the parent cap d is not yet reached, <b>add that edge</b> Z → Xᵢ, update S_old to the new score, and repeat the search for more parents.",
    "<b>Stop for this node</b> when no remaining candidate raises the score, or the parent cap is reached. The current parent set becomes the final Pa(Xᵢ).",
    "<b>Move on</b> to the next node in the order and repeat steps 2–6.",
    "<b>Return</b> the assembled DAG: every node with its locally optimal parent set."
  ],

  keyConcepts: [
    { term: "Variable ordering", def: "A fixed sequence of the variables. A node may only take parents from earlier positions, which guarantees the output is acyclic and removes the need to choose edge directions." },
    { term: "K2 score (local Bayesian score)", def: "A Bayesian marginal likelihood with Dirichlet priors that rates how well a parent set explains a node's data, rewarding good fit while implicitly discouraging needlessly large parent sets." },
    { term: "Decomposability", def: "The whole-graph score equals the sum of independent per-node (local) scores, so each node's parents can be optimised separately." },
    { term: "Greedy hill-climb", def: "Repeatedly make the single best local improvement (add the best parent) until no improvement remains — no backtracking." },
    { term: "Parent cap d", def: "An optional limit on how many parents any node may have, keeping the search cheap and avoiding overfitting on small data." },
    { term: "Predecessors Pred(Xᵢ)", def: "The variables ordered before Xᵢ — the only legal parent candidates for Xᵢ." }
  ],

  animation: {
    title: "K2 running on the four-variable example {A,B,C,D} with order A ≺ B ≺ C ≺ D (paper Fig. 9).",
    nodes: [
      { id: "A", x: 0.25, y: 0.18 },
      { id: "B", x: 0.72, y: 0.18 },
      { id: "C", x: 0.25, y: 0.80 },
      { id: "D", x: 0.72, y: 0.80 }
    ],
    edges: [],
    steps: [
      { caption: "<b>Start (Fig.9a):</b> the empty DAG G₀ on {A,B,C,D}, no edges. K2 is given the order A ≺ B ≺ C ≺ D and will choose parents for each node from the variables that come <i>before</i> it.", ops: [{ op: "set", name: "Order", items: ["A", "B", "C", "D"] }, { op: "badge", text: "empty DAG G₀", kind: "info" }] },
      { caption: "<b>Local scores at G₀ (Fig.9b):</b> every node starts with an empty parent set and its own baseline local score S_A, S_B, S_C, S_D. K2 will try to raise each one by adding parents.", ops: [{ op: "highlightNodes", ids: ["A", "B", "C", "D"], cls: "hl" }] },
      { caption: "<b>Node A — no predecessors (Fig.9c):</b> A is first in the order, so it has no candidate parents. Nothing to add ⇒ Pa(A) = ∅.", ops: [{ op: "highlightNodes", ids: ["A"], cls: "add" }, { op: "set", name: "Parents(A)", items: ["∅"] }, { op: "badge", text: "Pa(A) = ∅", kind: "good" }] },
      { caption: "<b>Node B — try adding A → B (Fig.9d):</b> A is B's only predecessor. Compute B's score with parent A; suppose this gain S₁ is <i>not</i> better than B's current score S_B.", ops: [{ op: "highlightNodes", ids: ["B"], cls: "hl" }, { op: "score", text: "Candidate A→B: S₁  vs  current S_B  ⇒  S₁ < S_B (no gain)" }] },
      { caption: "<b>No gain for B:</b> adding A does not help, and there are no other predecessors. Keep Pa(B) = ∅.", ops: [{ op: "set", name: "Parents(B)", items: ["∅"] }, { op: "badge", text: "Pa(B) = ∅", kind: "good" }] },
      { caption: "<b>Node C — candidates {A,B} (Fig.9e):</b> score C with parent A and with parent B separately, then <b>pick the highest</b>. Suppose adding A gives the best score S₁.", ops: [{ op: "highlightNodes", ids: ["C"], cls: "hl" }, { op: "score", text: "Try A→C: S₁   |   Try B→C: S₂   ⇒ pick highest = S₁ (parent A)" }] },
      { caption: "<b>Add A → C:</b> S₁ beats C's current score S_C, so commit the edge and update S_C ← S₁.", ops: [{ op: "addEdge", from: "A", to: "C", type: "directed" }, { op: "set", name: "Parents(C)", items: ["A"] }, { op: "score", text: "S₁ > S_C ⇒ add A→C, update S_C ← S₁" }] },
      { caption: "<b>Node C — try a second parent:</b> the only remaining candidate is B. Adding B → C does not beat the updated S_C, so stop. Final Pa(C) = {A}.", ops: [{ op: "score", text: "Try B→C on top of {A}: no further gain" }, { op: "badge", text: "Pa(C) = {A}", kind: "good" }] },
      { caption: "<b>Node D — candidates {A,B,C} (Fig.9f):</b> score D with each predecessor as a parent and <b>pick the highest</b>. Suppose C gives the best score S₄.", ops: [{ op: "highlightNodes", ids: ["D"], cls: "hl" }, { op: "score", text: "Try A→D / B→D / C→D ⇒ pick highest = S₄ (parent C)" }] },
      { caption: "<b>Add C → D:</b> S₄ beats D's current score S_D, so commit the edge and update S_D ← S₄.", ops: [{ op: "addEdge", from: "C", to: "D", type: "directed" }, { op: "set", name: "Parents(D)", items: ["C"] }, { op: "score", text: "S₄ > S_D ⇒ add C→D, update S_D ← S₄" }] },
      { caption: "<b>Node D — try more parents:</b> adding A or B on top of {C} gives no further gain, so stop. Final Pa(D) = {C}.", ops: [{ op: "score", text: "Try A→D / B→D on top of {C}: no gain ⇒ stop" }, { op: "badge", text: "Pa(D) = {C}", kind: "good" }] },
      { caption: "<b>Final learned DAG (Fig.9g):</b> Pa(A)=∅, Pa(B)=∅, Pa(C)={A}, Pa(D)={C} — i.e. A → C → D, with B isolated. K2 returns this single DAG.", ops: [{ op: "highlightEdges", edges: [["A", "C"], ["C", "D"]], cls: "hl" }, { op: "badge", text: "DAG returned", kind: "good" }] }
    ]
  },

  complexity: "With n variables, the parent cap d, and m records, K2 makes a polynomial number of local-score evaluations — roughly O(n² · d) candidate scorings, each a pass over the data. Far cheaper than searching DAG space directly, because the fixed order removes cycle-checking and direction choices.",
  strengths: [
    "Simple and fast: greedy, decomposable scoring with no cycle checks thanks to the fixed order.",
    "Closed-form Bayesian (K2) score with Dirichlet priors — no iterative parameter fitting per candidate.",
    "Parent cap d gives direct control over model complexity and runtime."
  ],
  limitations: [
    "Requires a correct variable ordering up front; a poor order yields a poor (or wrong-direction) network.",
    "Greedy hill-climb can stop at a local optimum and never revisits an added parent.",
    "Returns one DAG, not the Markov-equivalence class, and is restricted to discrete data with the assumed priors."
  ],
  notes: "Because a good ordering is rarely known, much follow-up work pairs K2's scoring with an outer search over orderings (e.g. genetic algorithms, swarm optimisation, or greedy order search) so the order itself is learned rather than assumed.",
  figureRefs: "Paper §4.2 (pp.25-30): Algorithm 4 (K2 algorithm, p.26); the K2/Bayesian marginal-likelihood score with Dirichlet priors (Example 5, pp.26-27); worked example Fig.9 (a)–(g), order A ≺ B ≺ C ≺ D (p.30)."
};
