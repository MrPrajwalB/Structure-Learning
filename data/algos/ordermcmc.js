/* OrderMCMC — Order MCMC. Grounded in §4.13 (pp.85-89):
   posterior over orders Eq.(18); product-of-sums identity Eq.(20)-(21);
   log order score Eq.(22); pairwise-swap proposal Fig.48 with symmetric
   kernel q = 1/C(n,2); MH acceptance Eq.(18-ratio) on p.89; Algorithm 18
   (Order-MCMC) p.90; worked Example 22 on {M,D,C}, Fig.49-50, P(C→D|D)≈0.105. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["ordermcmc"] = {
  name: "Order MCMC",
  oneLiner: "Run a Markov chain over variable orderings instead of over DAGs: score each order by summing every node's best-allowed parent-set scores, propose new orders by swapping two variables, accept by Metropolis-Hastings, and average DAGs drawn from the sampled orders.",
  basedOnText: "OrderMCMC is a score-based Bayesian sampler. Unlike MC³, which proposes local edge edits on individual DAGs, OrderMCMC samples variable orders by marginalising over all DAGs consistent with each order — a much smaller, smoother state space that mixes far better.",

  assumptions: [
    "<b>Decomposable family score</b> — the score of a DAG factorises into per-node 'family' scores FamScore(X, Pa_X | D), so the sum over consistent DAGs can be rewritten as a product over nodes (the product-of-sums identity).",
    "<b>An order constrains parents</b> — under a total order π, a node may only take parents from the variables that come <i>before</i> it. Every order is automatically acyclic.",
    "<b>A prior over orders P(π)</b> and a structure-modular prior ρ(X, Pa_X) ≥ 0 over families; often uniform.",
    "<b>Exactness vs. approximation</b> — using the exact Bayesian family evidence Φ_B (discrete–Dirichlet closed form) makes the order posterior exact; using Φ_BIC or Φ_L (= exp{FamScore}) gives an approximation."
  ],
  input: "A dataset D over variables V, a decomposable family-score FamScore, an optional cap d on parent-set size, and the number of iterations T.",
  output: "A collection of sampled orders π⁰, π¹, … and DAGs drawn consistent with them, used to estimate posterior structural features (e.g. edge probabilities) by Bayesian model averaging.",

  idea: [
    "Sampling DAGs directly is hard: the DAG posterior is rugged and full of local optima, so a chain like MC³ mixes slowly. OrderMCMC changes the playing field — it samples a <b>variable ordering</b> π (a permutation of the variables) rather than a DAG.",
    "The trick is that scoring an order is cheap and smooth. For a fixed order, each node's parents can only be chosen from the variables ahead of it. Because the score is decomposable, the total evidence for the order is just the <b>product over nodes of the sum of that node's parent-set scores</b> over all allowed parent sets (the product-of-sums identity). One number summarises a whole family of DAGs at once.",
    "There are only n! orders versus roughly 2^(n²/2) labelled DAGs, and each order already bundles many DAGs together, so the landscape over orders is far flatter and the chain mixes much better.",
    "The chain moves by a simple, symmetric proposal: pick two variables and <b>swap their positions</b> in the order. Compute the new order's score, then accept or reject by the Metropolis-Hastings rule. Sometimes a slightly worse order is accepted — that is what lets the chain explore rather than get stuck.",
    "Once the chain has mixed, you draw DAGs consistent with the visited orders (each node picks a parent set from its predecessors, with probability proportional to that family's score) and average structural features across them. <b>Caveat:</b> many different orders are consistent with the same DAG, so naively averaging over sampled DAGs introduces a multiplicity bias; the unbiased estimate conditions on each sampled order and marginalises exactly over the DAGs it allows."
  ],

  steps: [
    "<b>Pre-compute family scores.</b> For every node X and every admissible parent set U ⊆ V\\{X} (with |U| ≤ d), compute and cache Φ⋆(X, U | D). These caches make every later order score fast.",
    "<b>Initialise.</b> Pick a starting order π⁰ uniformly at random (or by a heuristic). Score it.",
    "<b>Score an order (product-of-sums).</b> For each node X, sum Φ⋆(X, U | D) over all parent sets U drawn from the variables that precede X in the order; multiply these sums over all nodes. In log form: log P(π | D) = log P(π) + Σ_X log( Σ_{U allowed} exp{FamScore(X,U | D)} ) + const.",
    "<b>Propose a swap.</b> Choose two positions in the current order uniformly at random and swap the variables there to get a candidate order π′. This proposal is symmetric, with kernel q(π ↔ π′) = 1 / C(n,2).",
    "<b>Re-score the candidate.</b> Compute the order score of π′ (only the nodes whose set of predecessors changed need re-summing).",
    "<b>Metropolis-Hastings accept/reject.</b> Accept with probability α = min(1, P(π′ | D) / P(π | D)). (The symmetric proposal cancels, so only the order-score ratio remains.) If accepted, move to π′; otherwise stay at π.",
    "<b>Repeat</b> the swap–score–accept loop for T iterations, discarding an initial burn-in. Occasionally accepting a worse order is intentional and keeps the chain mixing.",
    "<b>Sample DAGs per order.</b> For each retained order, draw one or more DAGs: each node independently picks a parent set from its predecessors with probability proportional to its family score Φ⋆, then orient the edges accordingly.",
    "<b>Average (model averaging).</b> Estimate a feature's posterior probability, e.g. P(edge | D), by averaging order-conditioned feature probabilities over the post-burn-in orders — not by naively averaging over sampled DAGs (which biases the posterior)."
  ],

  keyConcepts: [
    { term: "Variable order π", def: "A total ordering (permutation) of the variables. It is the state of the Markov chain. Under an order, a node may only have parents that appear earlier, so every order corresponds to a whole set of acyclic DAGs." },
    { term: "Family / family score", def: "A (node, parent-set) pair (X, Pa_X) is a 'family'. A decomposable FamScore gives each family its own score; the DAG score is the product of family scores." },
    { term: "Product-of-sums identity", def: "Because the score is decomposable, the sum over all DAGs consistent with an order equals the product over nodes of the sum of that node's allowed parent-set scores (Eq. 20–21). It lets one number score a whole family of DAGs." },
    { term: "Order score", def: "P(π | D) ∝ P(π) · Π_X Σ_{U allowed} Φ⋆(X, U | D). Used in log form (Eq. 22) for numerical stability. Exact with Φ_B; approximate with Φ_BIC or Φ_L." },
    { term: "Pairwise swap proposal", def: "A new order is obtained by swapping two variables' positions (Fig. 48). The proposal kernel q = 1/C(n,2) is symmetric, so it cancels in the acceptance ratio." },
    { term: "Metropolis-Hastings acceptance", def: "α = min(1, P(π′ | D)/P(π | D)). Accept the candidate order with this probability; otherwise keep the current one." },
    { term: "Order-conditioned averaging (caveat)", def: "For feature probabilities, average over sampled ORDERS and marginalise exactly over consistent DAGs. Naively averaging over sampled DAGs over-counts: many orders are consistent with one DAG, biasing the posterior." }
  ],

  animation: {
    title: "OrderMCMC on the paper's 3-variable Example 22, variables {M, D, C} (true DAG M → D → C; Fig. 48–50).",
    nodes: [
      { id: "M", x: 0.18, y: 0.5 },
      { id: "D", x: 0.5, y: 0.5 },
      { id: "C", x: 0.82, y: 0.5 }
    ],
    edges: [],
    steps: [
      { caption: "<b>State = an order.</b> The chain starts at order π₀ : C ≺ D ≺ M. We show the order as a chip; under it each node may only take parents from the variables to its left (so M may parent on {C,D}, D on {C}, C on none).", ops: [{ op: "set", name: "Order", items: ["C", "D", "M"] }, { op: "badge", text: "start: π₀ = C ≺ D ≺ M", kind: "info" }] },
      { caption: "<b>Score the order (product-of-sums).</b> For each node, sum its family scores over allowed parent sets and multiply across nodes. This single number summarises every DAG consistent with C ≺ D ≺ M.", ops: [{ op: "score", text: "order score = P(π₀ | D)" }] },
      { caption: "<b>Best DAG consistent with π₀.</b> Sampling a parent for each node from its predecessors (probability ∝ family score) gives the chain D ← C ← M, i.e. M → C → D... here the consistent DAG drawn is C → D, D ← M's path. We draw the high-scoring consistent DAG for π₀.", ops: [{ op: "addEdge", from: "C", to: "D", type: "directed" }, { op: "addEdge", from: "C", to: "M", type: "directed" }, { op: "highlightNodes", ids: ["C"], cls: "hl" }] },
      { caption: "<b>Propose a pairwise swap.</b> Pick two variables uniformly and swap their positions (kernel q = 1/C(3,2) = 1/3). Here we swap C and M, giving candidate order π₁ : M ≺ D ≺ C.", ops: [{ op: "clearSet", name: "Order" }, { op: "set", name: "Order", items: ["M", "D", "C"] }, { op: "highlightNodes", ids: ["M", "C"], cls: "swap" }, { op: "badge", text: "swap M ↔ C → π₁ = M ≺ D ≺ C", kind: "info" }] },
      { caption: "<b>Re-score the candidate.</b> Recompute the product-of-sums for π₁. Only nodes whose predecessor set changed need re-summing.", ops: [{ op: "score", text: "order score = P(π₁ | D)" }] },
      { caption: "<b>Metropolis-Hastings test.</b> α = min(1, P(π₁ | D)/P(π₀ | D)). In the paper this ratio works out to 1, so the move is accepted.", ops: [{ op: "badge", text: "α = min(1, ratio) = 1 → ACCEPT", kind: "good" }] },
      { caption: "<b>Move to π₁ and redraw its DAG.</b> Under M ≺ D ≺ C the consistent DAG is M → D → C: each node parents only on earlier variables. The order chip and the SVG now reflect π₁.", ops: [{ op: "removeEdge", from: "C", to: "D" }, { op: "removeEdge", from: "C", to: "M" }, { op: "addEdge", from: "M", to: "D", type: "directed" }, { op: "addEdge", from: "D", to: "C", type: "directed" }, { op: "highlightNodes", ids: ["M", "D", "C"], cls: "hl" }] },
      { caption: "<b>Propose another swap.</b> Swap D and C to get candidate π₂ : M ≺ C ≺ D. Re-score it.", ops: [{ op: "clearSet", name: "Order" }, { op: "set", name: "Order", items: ["M", "C", "D"] }, { op: "highlightNodes", ids: ["D", "C"], cls: "swap" }, { op: "score", text: "order score = P(π₂ | D)" }] },
      { caption: "<b>A slightly worse move — accepted to explore.</b> Suppose π₂ scores a bit lower than π₁ (ratio < 1). MH still accepts it with probability equal to that ratio; this random draw lands on ACCEPT, letting the chain escape local optima rather than freeze.", ops: [{ op: "badge", text: "α = ratio < 1, but draw < α → ACCEPT (explore)", kind: "bad" }] },
      { caption: "<b>Update DAG for π₂.</b> Under M ≺ C ≺ D the drawn consistent DAG re-routes to M → C → D (C now precedes D). The chain continues swapping and accepting/rejecting for many iterations.", ops: [{ op: "removeEdge", from: "D", to: "C" }, { op: "addEdge", from: "C", to: "D", type: "directed" }, { op: "highlightNodes", ids: ["M", "C", "D"], cls: "hl" }] },
      { caption: "<b>Sample DAGs per visited order.</b> After burn-in, draw DAGs consistent with each retained order (parent sets ∝ family scores). Across orders, the edge C → D appears with some frequency and is absent in others.", ops: [{ op: "highlightEdges", edges: [["C", "D"]], cls: "feature" }, { op: "badge", text: "collecting DAGs across orders", kind: "info" }] },
      { caption: "<b>Model averaging (order-conditioned).</b> Average the feature over sampled ORDERS, marginalising exactly over their DAGs (never naively over DAGs — that biases the posterior). In Example 22 the edge C → D gets posterior P(C→D | D) ≈ 0.105.", ops: [{ op: "highlightEdges", edges: [["M", "C"], ["C", "D"]], cls: "feature" }, { op: "badge", text: "P(C→D | D) ≈ 0.105 — averaged", kind: "good" }] }
    ]
  },

  complexity: "Each order score is a product over n nodes of a sum over admissible parent sets; with a parent-size cap |U| ≤ d, the per-node sum has O(n^d) terms, all pre-computed and cached once. The state space is n! orders rather than ~2^(n²/2) DAGs, and bundling DAGs per order makes the landscape much smoother, so the chain mixes far better than DAG-space MCMC for a given number of iterations.",
  strengths: [
    "Markedly better mixing than DAG-space samplers (e.g. MC³): the order landscape is smaller and smoother.",
    "Simple, symmetric pairwise-swap proposal — the kernel cancels in the acceptance ratio.",
    "With the exact family evidence Φ_B the order posterior is exact (discrete–Dirichlet); cached scores keep iterations cheap.",
    "Naturally yields Bayesian model averaging of structural features such as edge probabilities."
  ],
  limitations: [
    "<b>Multiplicity / posterior bias:</b> many orders are consistent with one DAG, so naively averaging over sampled DAGs over-weights DAGs compatible with many orders; one must average over orders and marginalise over DAGs.",
    "Requires a decomposable score and a parent-size cap d to keep the per-node sums tractable.",
    "Sampling DAGs conditional on orders is needed only for concrete graphs/MAP candidates; for plain feature probabilities it is unnecessary and can bias results.",
    "The non-uniform implicit prior over DAGs induced by the order prior can be undesirable; correcting it requires extra care."
  ],
  notes: "Order-MCMC (Friedman & Koller, ref. [192]) replaces MC³'s DAG edits with swaps over orders. The Monte-Carlo workflow is otherwise unchanged: run a chain π₀, π₁, …, optionally draw DAGs per order, and average structural features. For numerical stability the order score is evaluated in log form (Eq. 22). Partition-MCMC and other variants were later introduced to remove the order-induced posterior bias.",
  figureRefs: "Paper §4.13 (pp.85–89): Algorithm 18 (Order-MCMC, p.90); Eq.(18) order posterior, Eq.(20)–(21) product-of-sums identity, Eq.(22) log order score; Fig.48 pairwise-swap proposal; Example 22 with Fig.49–50 (3-variable {M,D,C} walkthrough, P(C→D | D) ≈ 0.105)."
};
