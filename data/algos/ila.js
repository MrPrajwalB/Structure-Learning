/* ILA — Iterative / Learning-Automata-based BN structure learning (Gheisari et al.).
   Grounded in §4.37 (pp.185-189): Algorithm 43 (ILA, variable-action-set LAs),
   reward/penalty update rule Eq.(35), worked Example 51 on {X1,X2,X3}
   (Figs.108-110, iterations 1 and 2 of ILA). Related work pp.188-189. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["ila"] = {
  name: "ILA — Learning-Automata structure learning",
  oneLiner: "Give every possible edge a probability of being chosen, sample a whole DAG from those probabilities, score it, then reward the choices that produced a better-than-average score by raising their probabilities (and lower the rest) — repeat until the probabilities sharpen onto one good structure.",
  basedOnText: "ILA recasts structure learning as a team of learning automata (LAs): self-improving units that each hold a probability distribution over their possible actions and update it from feedback. A score-based 'reward' signal reinforces good edge choices over many iterations, so the search is guided by reinforcement rather than by exhaustive testing or greedy hill-climbing.",

  assumptions: [
    "<b>A decomposable score</b> exists (e.g. BIC/BDeu) so that a candidate DAG given the data can be assigned a single quality number score(𝒢 | 𝒟).",
    "<b>Acyclicity is enforced</b> while a DAG is being assembled — an action that would close a directed cycle is disabled, so every sampled structure is a valid DAG.",
    "<b>Stochastic feedback is informative</b> — averaged over iterations, higher-scoring structures get rewarded often enough for the probabilities to converge (standard learning-automaton convergence assumption)."
  ],
  input: "A dataset 𝒟 over variables V, a decomposable score function score(· | 𝒟), the LA reward parameter a and penalty parameter b, and a maximum number of iterations T.",
  output: "The DAG 𝒢_k with the maximal score encountered across all iterations.",

  idea: [
    "A <b>learning automaton</b> is a simple adaptive unit: it has a set of <i>actions</i> and a <i>probability</i> attached to each, it picks an action at random according to those probabilities, receives feedback (reward or penalty), and nudges the probabilities so that rewarded actions become more likely next time. ILA runs one such automaton per variable.",
    "For variable X_i its automaton's actions are the candidate edges leaving it — A_i = { X_i → X_j : j ≠ i } (a <b>variable-action-set</b> LA, because actions that would create a cycle are temporarily disabled). All action probabilities start uniform, so initially every edge is equally likely.",
    "<b>One iteration builds a whole DAG.</b> Starting from the empty graph, each automaton (in turn) samples one of its still-enabled actions according to its probabilities and adds that edge — unless it would form a cycle, in which case that action is disabled first. After every automaton has acted, a candidate DAG 𝒢 is complete and is scored.",
    "<b>The score becomes the reward signal.</b> ILA keeps a running average of all scores seen so far. If the new structure scores <i>above</i> that average it is treated as a <b>reward</b>: each automaton raises the probability of the action it just chose and lowers its others. If it scores below average it is a <b>penalty</b>: the chosen action's probability is lowered and the slack is redistributed to the alternatives.",
    "Over many iterations the edge choices that repeatedly sit inside high-scoring DAGs accumulate probability while poor ones fade, so the probability vectors sharpen and the team converges on a single high-scoring structure — the best DAG seen is returned."
  ],

  steps: [
    "<b>Initialise the automata.</b> For each variable X_i create an automaton with action set A_i = { X_i → X_j : j ≠ i } and a <i>uniform</i> probability over those actions. (With r actions each starts at 1/r.)",
    "<b>Start an iteration.</b> Set 𝒢 to the empty DAG on V; enable all actions and mark every automaton 'active'.",
    "<b>Each automaton acts.</b> While an enabled active automaton remains: it samples an action whose probability is at least the largest among its enabled actions, adds the corresponding edge to 𝒢, and is marked 'passive'. If an action would create a directed cycle in 𝒢, that action is disabled first so a valid DAG is preserved.",
    "<b>Score the candidate.</b> Compute s_k = score(𝒢 | 𝒟) for the assembled DAG, and update the running average scorē_k = (1/k) Σ_{t=1..k} s_t.",
    "<b>Reward or penalise.</b> If s_k > scorē_k the iteration is a <b>reward</b>: for every active automaton, increase the probability of its chosen action a*_k and decrease the others using Eq.(35) with reward parameter a. Otherwise it is a <b>penalty</b>: decrease a*_k's probability and redistribute it to the other actions using Eq.(35) with penalty parameter b.",
    "<b>Eq.(35), reward (chosen action j, others i≠j):</b> p_j ← p_j + a(1 − p_j);  p_i ← (1 − a) p_i.",
    "<b>Eq.(35), penalty:</b> p_j ← (1 − b) p_j;  p_i ← b/(r − 1) + (1 − b) p_i — lowering the chosen action and spreading the difference over the r−1 alternatives.",
    "<b>Re-enable and iterate.</b> Re-enable all actions, restore all automata to active, and repeat the build-score-reinforce loop for the next iteration (up to T iterations).",
    "<b>Return</b> the DAG 𝒢_k with the maximal score observed across all iterations."
  ],

  keyConcepts: [
    { term: "Learning automaton (LA)", def: "An adaptive unit that keeps a probability over a set of actions, picks one at random, and shifts the probabilities toward actions that earn reward. ILA uses one LA per variable." },
    { term: "Action set A_i", def: "For variable X_i, the candidate outgoing edges { X_i → X_j : j ≠ i }. Each action carries a probability of being selected." },
    { term: "Variable-action-set LA", def: "An LA whose available actions can shrink during an iteration: any action that would close a cycle in the partly-built DAG is temporarily disabled." },
    { term: "Probability vector", def: "The per-automaton distribution over its actions. Starts uniform and is reshaped each iteration by the reward/penalty update — its sharpening is what 'learning' means here." },
    { term: "Reward / penalty signal", def: "Comparison of the new structure's score s_k against the running average scorē_k. Above average ⇒ reward; below ⇒ penalty. This is the score-based feedback that drives the search." },
    { term: "Reward/penalty update Eq.(35)", def: "The linear reward-penalty rule: on reward the chosen action gains a·(1−p) and others shrink by factor (1−a); on penalty the chosen action shrinks by (1−b) and the slack b/(r−1) is shared among the rest." },
    { term: "Parameters a, b", def: "Step sizes for reinforcement: a controls how strongly a rewarded action is boosted, b how strongly a penalised action is damped." }
  ],

  animation: {
    title: "ILA on the 3-variable example {X1,X2,X3} (paper Example 51, Figs.108-110; a = 0.2, b = 0.1).",
    nodes: [
      { id: "X1", x: 0.20, y: 0.20 },
      { id: "X2", x: 0.80, y: 0.20 },
      { id: "X3", x: 0.50, y: 0.85 }
    ],
    edges: [],
    steps: [
      { caption: "<b>One automaton per variable.</b> LA1's actions are X1→X2 and X1→X3; LA2's are X2→X1, X2→X3; LA3's are X3→X1, X3→X2. Every action starts with uniform probability 0.5 (paper sets a = 0.2, b = 0.1).", ops: [
        { op: "highlightNodes", ids: ["X1", "X2", "X3"], cls: "hl" },
        { op: "set", name: "Edge probabilities", items: ["X1→X2: 0.50", "X1→X3: 0.50", "X2→X1: 0.50", "X2→X3: 0.50", "X3→X1: 0.50", "X3→X2: 0.50"] },
        { op: "badge", text: "automata initialised (uniform)", kind: "info" }
      ] },
      { caption: "<b>Iteration 1 — build a DAG.</b> Start from the empty graph. LA1 samples its action and adds X1→X2; the chosen action is recorded for later reinforcement.", ops: [
        { op: "badge", text: "iteration 1: empty DAG → sample", kind: "info" },
        { op: "addEdge", from: "X1", to: "X2", type: "directed" },
        { op: "highlightEdges", edges: [["X1", "X2"]], cls: "hl" }
      ] },
      { caption: "<b>Each remaining automaton acts.</b> LA2 adds X2→X3 and LA3 adds X3→X1. Any action that would close a cycle would be disabled first; here the result is a valid DAG 𝒢_1.", ops: [
        { op: "addEdge", from: "X2", to: "X3", type: "directed" },
        { op: "addEdge", from: "X3", to: "X1", type: "directed" },
        { op: "highlightEdges", edges: [["X1", "X2"], ["X2", "X3"], ["X3", "X1"]], cls: "hl" }
      ] },
      { caption: "<b>Score the candidate.</b> The assembled DAG 𝒢_1 is scored against the data. With only one structure seen so far, this score also sets the running average scorē_1.", ops: [
        { op: "score", text: "score(𝒢_1 | 𝒟) = 1900 = scorē_1" },
        { op: "badge", text: "first structure — establishes the average", kind: "info" }
      ] },
      { caption: "<b>Iteration 2 — reset and re-sample.</b> The graph is emptied and all actions re-enabled. This time LA1 samples X1→X3, and the automata assemble a second candidate DAG 𝒢_2.", ops: [
        { op: "removeEdge", from: "X1", to: "X2" },
        { op: "removeEdge", from: "X2", to: "X3" },
        { op: "removeEdge", from: "X3", to: "X1" },
        { op: "badge", text: "iteration 2: re-enable & re-sample", kind: "info" },
        { op: "addEdge", from: "X1", to: "X3", type: "directed" },
        { op: "addEdge", from: "X2", to: "X1", type: "directed" },
        { op: "highlightEdges", edges: [["X1", "X3"], ["X2", "X1"]], cls: "hl" }
      ] },
      { caption: "<b>Score 𝒢_2 vs the average.</b> 𝒢_2 scores 2000, above the running average scorē_2 = (1900 + 2000)/2 = 1950. Because s_2 > scorē_2 the iteration is a <b>reward</b>.", ops: [
        { op: "score", text: "score(𝒢_2 | 𝒟) = 2000 > scorē_2 = 1950" },
        { op: "badge", text: "REWARD (s_k above average)", kind: "good" }
      ] },
      { caption: "<b>Reinforce the rewarded choices.</b> Eq.(35) reward: LA1 boosts its chosen X1→X3 to 0.5 + 0.2(1−0.5) = 0.60 and shrinks X1→X2 to (1−0.2)·0.5 = 0.40. LA2 likewise lifts X2→X1 to 0.60.", ops: [
        { op: "set", name: "Edge probabilities", items: ["X1→X2: 0.40", "X1→X3: 0.60", "X2→X1: 0.60", "X2→X3: 0.40", "X3→X1: 0.50", "X3→X2: 0.50"] },
        { op: "highlightEdges", edges: [["X1", "X3"], ["X2", "X1"]], cls: "good" },
        { op: "badge", text: "p_j ← p_j + a(1−p_j); others ×(1−a)", kind: "good" }
      ] },
      { caption: "<b>A below-average iteration is penalised.</b> Suppose a later iteration produces a structure scoring below the running average. Eq.(35) penalty shrinks the chosen action by (1−b) and shares the slack b/(r−1) across the alternatives.", ops: [
        { op: "score", text: "score(𝒢_k | 𝒟) < scorē_k" },
        { op: "badge", text: "PENALTY (s_k below average)", kind: "bad" },
        { op: "set", name: "Edge probabilities", items: ["X1→X2: 0.36", "X1→X3: 0.64", "X2→X1: 0.60", "X2→X3: 0.40", "X3→X1: 0.50", "X3→X2: 0.50"] }
      ] },
      { caption: "<b>Iterate — probabilities sharpen.</b> Over many rounds the actions that keep appearing in high-scoring DAGs accumulate probability: X1→X3 and X2→X1 climb toward 1, their rivals fade toward 0.", ops: [
        { op: "set", name: "Edge probabilities", items: ["X1→X2: 0.08", "X1→X3: 0.92", "X2→X1: 0.90", "X2→X3: 0.10", "X3→X1: 0.20", "X3→X2: 0.80"] },
        { op: "badge", text: "vectors converging", kind: "info" }
      ] },
      { caption: "<b>Convergence.</b> Each automaton's probability concentrates on one action, so the sampled DAG stops changing: LA1→X1→X3, LA2→X2→X1, LA3→X3→X2 — a stable, acyclic structure.", ops: [
        { op: "addEdge", from: "X1", to: "X3", type: "directed" },
        { op: "addEdge", from: "X2", to: "X1", type: "directed" },
        { op: "addEdge", from: "X3", to: "X2", type: "directed" },
        { op: "highlightEdges", edges: [["X1", "X3"], ["X2", "X1"], ["X3", "X2"]], cls: "good" },
        { op: "set", name: "Edge probabilities", items: ["X1→X2: 0.02", "X1→X3: 0.98", "X2→X1: 0.97", "X2→X3: 0.03", "X3→X1: 0.05", "X3→X2: 0.95"] }
      ] },
      { caption: "<b>Return the best DAG.</b> ILA outputs 𝒢_k, the structure with the maximal score seen across all iterations — the converged, reinforced DAG.", ops: [
        { op: "score", text: "best score(𝒢_k | 𝒟) returned" },
        { op: "badge", text: "final DAG returned", kind: "good" }
      ] }
    ]
  },

  complexity: "Each of the T iterations builds and scores one DAG: per iteration the automata add O(|V|) edges and the score evaluation dominates the cost. Total work is roughly T × (DAG-construction + scoring), so runtime is controlled by the iteration budget T rather than by enumerating subsets — but no fixed bound on the iterations needed for convergence is guaranteed.",
  strengths: [
    "Reinforcement-guided global search: it samples whole structures and learns from their scores rather than committing greedily, so it can escape local optima that hill-climbing falls into.",
    "Acyclicity is maintained by construction (cycle-forming actions are disabled), so every candidate is a legal DAG.",
    "Simple, tunable mechanism — only the reward/penalty step sizes a and b and the iteration budget T need setting."
  ],
  limitations: [
    "Convergence is stochastic and can be slow; the result and speed depend on a, b and T.",
    "Needs a decomposable scoring function and many score evaluations, which is expensive on large variable sets.",
    "Like other score-based searches it returns a single high-scoring DAG, not the full equivalence class, and the outcome can vary between runs."
  ],
  notes: "Related work (pp.188-189): Asghari et al. introduced PSLA-B, a score-and-search method attaching a fixed-structure LA per pair of variables. Gheisari et al. also proposed LA-CP and LA-DP, where automaton training is a repeated game played by discrete learning automata — LA-CP being cooperative (a global reward derived from the whole-DAG evaluation) and LA-DP competitive (each automaton receives a localised payoff). ILA generalises these with variable-action-set automata reinforced by a global score signal.",
  figureRefs: "Paper §4.37 (pp.185-189): Algorithm 43 (ILA, variable-action-set LAs); reward/penalty update Eq.(35); Example 51 with Fig.108 (iteration 1), Fig.109 (graph 𝒢_1), Fig.110 (iteration 2)."
};
