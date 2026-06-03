/* MC3 — MCMC Model Composition. Grounded in §4.5 (pp.50-55):
   Algorithm 8 (MC3), the Metropolis-Hastings acceptance ratio with the
   neighbourhood-size proposal correction, the single-edge add/delete/reverse
   neighbourhood, Example 13 (variables C,M,D from Fig.12a), and Fig.29
   (worked MCMC iterations + panel (e) model averaging of the feature C→D). */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["mc3"] = {
  name: "MC3 — MCMC Model Composition",
  oneLiner: "Instead of returning one 'best' graph, MC3 walks randomly through the space of DAGs — from the current graph it proposes a single-edge change (add/delete/reverse), accepts it with a probability based on how much its posterior score improves (and sometimes accepts a worse one), and records the visited graphs to estimate a whole posterior over structures.",
  basedOnText: "MC3 is the classic score-based <i>Bayesian model averaging</i> method: rather than searching for a single high-scoring DAG, it builds a Markov chain whose long-run visiting frequencies match the posterior P(G | D), so features (such as the probability of a particular edge) can be averaged over many sampled graphs.",

  assumptions: [
    "<b>A decomposable, computable score</b> — each graph's posterior score P(G | D) (or marginal likelihood × prior) can be evaluated and factorises over nodes, so a single-edge move only re-scores the affected families.",
    "<b>Parameter modularity / a closed-form marginal likelihood</b> — e.g. BDeu for discrete data or BGe for Gaussian data, so P(G | D) has a closed form (paper Eqs. for the Dirichlet-multinomial / Wishart families).",
    "<b>A connected, reversible neighbourhood</b> — the single-edge moves (add, delete, reverse) can reach any DAG from any other and every move can be undone, which is what makes the chain a valid sampler.",
    "<b>Enough run length</b> — the chain is run long enough (past a burn-in) to forget its starting graph and explore the high-posterior region."
  ],
  input: "A dataset D over variables V, a prior P(G) over structures, a scoring operator (marginal-likelihood score), a burn-in length B and a total number of iterations T.",
  output: "A collection of <b>sampled DAGs</b> {G^(t) : t &gt; B} drawn (approximately) from the posterior P(G | D). From these you read off posterior quantities — most often <b>posterior edge probabilities</b> by averaging an edge's presence over the samples — rather than a single graph.",

  idea: [
    "MC3 reframes structure learning as <i>sampling</i> instead of optimisation. The true target is the posterior P(G | D) over all DAGs — a huge, impossible-to-enumerate distribution. A Markov chain is designed so that, after it settles, the fraction of time it spends at any graph equals that graph's posterior probability.",
    "The chain moves locally. From the current DAG it looks at its <b>neighbourhood</b> N(G): all DAGs reachable by one legal single-edge change — add an edge, delete an edge, or reverse an edge (moves that would create a cycle are not allowed). It picks one neighbour at random as the <i>proposal</i> G'.",
    "Whether to move there is decided by the <b>Metropolis-Hastings rule</b>. Conceptually: accept the proposed graph with a probability based on how much better its posterior score is than the current one. If the proposal scores higher it is (almost) always accepted; if it scores lower it is <i>sometimes</i> accepted anyway — this willingness to occasionally go downhill is exactly what lets the chain escape local optima and explore.",
    "There is one extra bookkeeping factor: the <b>neighbourhood-size correction</b>. Because a move is chosen uniformly among the neighbours, graphs with more neighbours propose any given move less often. The acceptance ratio multiplies the score ratio by q(G'→G)/q(G→G') = |N(G)| / |N(G')| so the chain stays unbiased.",
    "Finally MC3 does <b>model averaging</b>: it throws away the early 'burn-in' samples (taken before the chain mixed), then for any feature of interest — e.g. 'is there an edge C→D?' — it simply counts the fraction of retained samples that have it. That fraction is a Monte-Carlo estimate of the feature's posterior probability."
  ],

  steps: [
    "<b>Initialise.</b> Choose a starting DAG G⁽⁰⁾ (often the empty graph), fix the prior P(G) and the scoring operator, and set the burn-in B and total iterations T.",
    "<b>Build the neighbourhood.</b> At the current graph G⁽ᵗ⁾, enumerate N(G⁽ᵗ⁾): every DAG obtained by one legal single-edge add, delete, or reverse (skipping any move that introduces a cycle).",
    "<b>Propose a move.</b> Draw a candidate G' uniformly at random from N(G⁽ᵗ⁾) (any proposal distribution q may be used; uniform-over-neighbours is the standard choice).",
    "<b>Score both graphs.</b> Evaluate the posterior scores P(G' | D) and P(G⁽ᵗ⁾ | D). Because the score decomposes, only the families changed by the single edge need re-scoring.",
    "<b>Form the acceptance probability.</b> α = min(1, [P(G' | D) / P(G⁽ᵗ⁾ | D)] × [q(G'→G⁽ᵗ⁾) / q(G⁽ᵗ⁾→G')]). The first factor is the score (posterior) ratio; the second is the neighbourhood-size correction |N(G⁽ᵗ⁾)| / |N(G')|.",
    "<b>Accept or reject.</b> With probability α set G⁽ᵗ⁺¹⁾ ← G' (move there); otherwise set G⁽ᵗ⁺¹⁾ ← G⁽ᵗ⁾ (stay put and record the current graph again). Worse-scoring proposals are accepted sometimes, which drives exploration.",
    "<b>Repeat</b> steps 2–6 for t = 1 … T, recording the visited graph at every iteration.",
    "<b>Discard burn-in.</b> Drop the first B samples (collected before the chain settled into the high-posterior region).",
    "<b>Average over the posterior.</b> Return the retained samples {G⁽ᵗ⁾ : t &gt; B} and estimate any feature f by its sample average — e.g. P(edge C→D | D) ≈ (number of retained DAGs containing C→D) / (number of retained DAGs)."
  ],

  keyConcepts: [
    { term: "Posterior over structures P(G | D)", def: "The probability of each possible DAG given the data, proportional to its marginal likelihood times its prior. MC3's goal is to sample from this — not to maximise it." },
    { term: "Bayesian model averaging", def: "Instead of betting on one graph, you average a quantity of interest (like an edge's existence) over many plausible graphs weighted by their posterior, giving more honest, uncertainty-aware answers." },
    { term: "Neighbourhood N(G)", def: "All DAGs one legal single-edge change away from G — add, delete, or reverse an edge, excluding moves that would create a cycle." },
    { term: "Metropolis-Hastings acceptance", def: "The rule for deciding whether to move to a proposed graph: accept with probability based on how much better it scores; sometimes accept a worse graph so the chain can explore and avoid getting stuck." },
    { term: "Neighbourhood-size (proposal) correction", def: "The factor |N(G)| / |N(G')| in the acceptance ratio. It compensates for the fact that graphs with more neighbours propose any given move less often, keeping the sampler unbiased." },
    { term: "Burn-in", def: "The initial stretch of iterations, thrown away because the chain still remembers its starting graph and has not yet reached the typical (high-posterior) set." },
    { term: "Mixing", def: "How quickly the chain forgets where it started and roams the posterior. Good mixing means the samples are representative; poor mixing means estimates are unreliable even after many steps." }
  ],

  animation: {
    title: "MC3 on the 3-variable example {C, M, D} (paper Example 13 / Fig. 29). Each step proposes one single-edge move and accepts or rejects it.",
    nodes: [
      { id: "C", x: 0.18, y: 0.22 },
      { id: "M", x: 0.82, y: 0.22 },
      { id: "D", x: 0.50, y: 0.85 }
    ],
    edges: [
      { from: "C", to: "D", type: "directed" }
    ],
    steps: [
      { caption: "<b>Current state G⁽¹⁾.</b> The chain is at a DAG with the single edge C → D. MC3 will not try to optimise this graph — it will sample around it to map the posterior.", ops: [{ op: "badge", text: "t = 1 · current DAG", kind: "info" }, { op: "highlightEdges", edges: [["C","D"]] }] },
      { caption: "<b>Build the neighbourhood N(G⁽¹⁾).</b> List every legal single-edge change: add M→D, add C→M, delete C→D, reverse C→D, … (cycle-creating moves are excluded). One is picked uniformly at random.", ops: [{ op: "set", name: "N(G⁽¹⁾)", items: ["add M→D", "add C→M", "delete C→D", "reverse C→D"] }] },
      { caption: "<b>Propose a move:</b> add the edge M → D, giving candidate G'. Now score it against the current graph.", ops: [{ op: "highlightNodes", ids: ["M", "D"], cls: "hl" }, { op: "addEdge", from: "M", to: "D", type: "directed" }, { op: "highlightEdges", edges: [["M","D"]] }, { op: "badge", text: "proposal: add M→D", kind: "info" }] },
      { caption: "<b>Acceptance ratio.</b> α = min(1, score-ratio × neighbourhood correction). Here the posterior ratio P(G'|D)/P(G⁽¹⁾|D) ≈ 1.25×10⁻¹⁰ / 4.6×10⁻¹⁰, giving α ≈ 0.27 — the proposal scores a bit worse.", ops: [{ op: "score", text: "α = min(1, 0.27 × correction) ≈ 0.27" }, { op: "highlightEdges", edges: [["M","D"]] }] },
      { caption: "<b>Accept anyway (exploring).</b> α ≈ 0.27 means we keep the move only ~27% of the time — but this draw lands in that 27%, so we ACCEPT a slightly worse graph. This downhill step is how MC3 avoids getting trapped.", ops: [{ op: "badge", text: "ACCEPTED (worse move — explore)", kind: "good" }, { op: "highlightEdges", edges: [["M","D"]] }] },
      { caption: "<b>New current state G⁽²⁾</b> = {C→D, M→D}. The chain rebuilds the neighbourhood at this graph for the next iteration.", ops: [{ op: "badge", text: "t = 2 · current DAG", kind: "info" }, { op: "set", name: "N(G⁽²⁾)", items: ["delete M→D", "delete C→D", "reverse C→D", "add C→M"] }] },
      { caption: "<b>Propose a move:</b> reverse C → D into D → C, giving candidate G⁴. Score it against G⁽²⁾.", ops: [{ op: "highlightNodes", ids: ["C", "D"], cls: "hl" }, { op: "removeEdge", from: "C", to: "D" }, { op: "addEdge", from: "D", to: "C", type: "directed" }, { op: "highlightEdges", edges: [["D","C"]] }, { op: "badge", text: "proposal: reverse C→D", kind: "info" }] },
      { caption: "<b>Acceptance ratio.</b> The posterior ratio P(G⁴|D)/P(G⁽²⁾|D) ≈ 5.05×10⁻¹⁰ / 1.25×10⁻¹⁰, times the neighbourhood correction, gives α ≈ 0.404. The proposal scores higher.", ops: [{ op: "score", text: "α = min(1, 4.04 × correction) ≈ 0.404" }, { op: "highlightEdges", edges: [["D","C"]] }] },
      { caption: "<b>This time REJECT.</b> Even though α ≈ 0.404 favours moving, the random draw exceeds α, so we reject and stay. The reversal is undone — G⁽³⁾ stays equal to G⁽²⁾. (Rejected steps still count: the current graph is recorded again.)", ops: [{ op: "removeEdge", from: "D", to: "C" }, { op: "addEdge", from: "C", to: "D", type: "directed" }, { op: "badge", text: "REJECTED — keep current graph", kind: "bad" }, { op: "highlightEdges", edges: [["C","D"],["M","D"]] }] },
      { caption: "<b>Burn-in discarded.</b> The chain keeps proposing/accepting/rejecting for many iterations; the first B graphs (before it mixed) are thrown away, leaving a clean set of posterior samples.", ops: [{ op: "badge", text: "drop first B samples (burn-in)", kind: "info" }, { op: "clearSet", name: "N(G⁽²⁾)" }, { op: "clearSet", name: "N(G⁽¹⁾)" }] },
      { caption: "<b>Model averaging.</b> Over the retained DAGs, count how often each feature appears. For the target feature C → D: it is present in 2 of 3 sampled DAGs, so the Monte-Carlo estimate is P(C→D | D) ≈ 2/3 ≈ 0.67.", ops: [{ op: "set", name: "Posterior edge probabilities", items: ["C → D : ≈ 0.67", "M → D : ≈ 0.33", "D → C : ≈ 0.28"] }, { op: "score", text: "feature C→D averaged over samples ≈ 0.67" }] },
      { caption: "<b>Result.</b> MC3 returns not one graph but a posterior over structures, summarised here as edge probabilities. This captures structural <i>uncertainty</i> that a single best-DAG search would hide.", ops: [{ op: "badge", text: "posterior over structures returned", kind: "good" }, { op: "highlightEdges", edges: [["C","D"],["M","D"]] }] }
    ]
  },

  complexity: "Per iteration the cost is dominated by enumerating and scoring the single-edge neighbourhood: O(|V|²) candidate moves, each needing only a local re-score thanks to score decomposition. The number of iterations T must be large (and grows with problem size) for the chain to mix and give reliable posterior estimates, so total cost is T × (per-iteration cost); mixing — not per-step work — is the practical bottleneck.",
  strengths: [
    "Estimates a full <b>posterior over structures</b>, so it quantifies uncertainty (e.g. per-edge probabilities) instead of committing to one graph.",
    "The occasional acceptance of worse moves lets it escape local optima that greedy hill-climbing gets stuck in.",
    "Simple, local moves with cheap incremental re-scoring; any decomposable score (BDeu, BGe, …) plugs in.",
    "Model averaging gives more robust feature predictions than a single point estimate."
  ],
  limitations: [
    "<b>Slow mixing</b> over the large, highly multimodal space of DAGs — chains can stay stuck near one region, making single-edge MC3 converge slowly.",
    "Diagnosing convergence and choosing the burn-in length is hard; estimates are unreliable if the chain has not mixed.",
    "Sampling in DAG space lets equivalent graphs be visited unevenly, which can bias feature estimates (later work samples over orders or equivalence classes to fix this).",
    "Computationally heavy for many variables because a great many iterations are needed."
  ],
  notes: "Related samplers improve on plain MC3: edge-reversal and multi-step proposals (Mansinghka et al., Grzegorczyk &amp; Husmeier) give better-mixing single-edge moves; order-MCMC (Friedman &amp; Koller) and partition/structure-MCMC sample over node orderings or partitions to mix faster and reduce bias; and Markov-blanket resampling schemes (Su &amp; Borsuk) remove and resample a node's incoming edges as a block.",
  figureRefs: "Paper §4.5 (pp.50-55): Algorithm 8 (MC3); the Metropolis-Hastings acceptance ratio α with the neighbourhood-size proposal correction (p.51, p.54); Example 13 on variables {C,M,D} from the Fig.12a dataset (p.54); Fig.29 — worked MCMC iterations 1-2 with add/delete/reverse proposals and panel (e) sampled DAGs used for model averaging of the feature C→D (p.55)."
};
