/* GA — Genetic Algorithm. Grounded in §4.6 (pp.57-61):
   Algorithm 9 (GA algorithm), Fig.14 (population of orderings decoded by K2),
   Example 14 (alternating-position crossover, AP), Example 15 (scramble mutation),
   Remark 4 (K2 may be swapped for exact / other order-based search). */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["ga"] = {
  name: "Genetic Algorithm",
  oneLiner: "Evolve a whole population of candidate networks: score each one, let the fittest 'reproduce' by crossover and mutation, and over many generations breed structures that score ever higher — returning the best DAG ever seen.",
  basedOnText: "GA is a population-based metaheuristic for score-based structure learning. In this survey's formulation each individual is an ordering (permutation) of the variables; an ordering is decoded into a DAG with K2, and the K2 network score is used as that individual's fitness.",

  assumptions: [
    "<b>A decodable score</b> — a network-scoring function (here K2's Bayesian score) that turns any candidate into a single fitness number to maximise.",
    "<b>Order-based encoding</b> — a chromosome is a permutation of the variables; K2 (or another order-respecting search) turns that order into a concrete DAG, which guarantees acyclicity for free.",
    "<b>It is a metaheuristic</b> — randomised search with no optimality guarantee; quality depends on population size, operators and number of generations."
  ],
  input: "A dataset over variables V, a scoring function (K2 score), and GA controls: population size, crossover rate, mutation rate, and a stopping rule (generation limit or convergence level).",
  output: "The single highest-scoring DAG G(E) observed across all generations.",

  idea: [
    "Instead of growing one network step by step, a GA keeps a <b>population</b> of many candidate solutions at once and improves them in parallel, imitating natural selection: good solutions survive and combine, poor ones die out.",
    "The clever choice in this survey is the <b>encoding</b>. Rather than encode a DAG directly (which makes crossover prone to creating cycles), each individual is just an <b>ordering of the variables</b>. That order is fed to K2, which builds the best DAG consistent with the order and reports its score. So the genetic operators only ever shuffle an ordering — the resulting graph is always acyclic.",
    "<b>Fitness = score.</b> An individual's fitness is simply the K2 score of the DAG its ordering decodes to. Higher-scoring orderings are 'fitter' and are more likely to be selected as parents.",
    "Each generation does three things: <b>select</b> fitter parents, <b>cross over</b> two parents to make children that mix their orderings, and <b>mutate</b> children slightly for extra diversity. The new generation replaces the old, and the cycle repeats. The best DAG ever seen is remembered and returned at the end."
  ],

  steps: [
    "<b>Initialise.</b> Create an initial population of P random orderings (permutations) of the variables. Decode each one with K2 and record its score as fitness.",
    "<b>Selection.</b> Pick parents for the next generation in proportion to fitness (e.g. fitness-proportionate / roulette-wheel), so higher-scoring orderings reproduce more often. An optional elitist step copies the very best individual through unchanged.",
    "<b>Crossover.</b> With crossover probability p_c, combine two selected parent orderings into a child ordering. Because the genes are positions in a permutation, a permutation-safe operator is used — the paper uses <b>alternating-position (AP) crossover</b>: walk through the parents, taking the next not-yet-used element alternately from Parent 1 and Parent 2.",
    "<b>Mutation.</b> With mutation probability p_m, perturb a child ordering for diversity. The paper uses <b>scramble mutation</b>: choose a sub-string of the ordering and randomly shuffle the elements inside it.",
    "<b>Decode &amp; score the new generation.</b> Run K2 on every child's ordering to build its DAG and compute its fitness. Keep track of the best DAG seen so far.",
    "<b>Form the next generation</b> from the children (plus any elites) and repeat selection → crossover → mutation → scoring.",
    "<b>Stop</b> when the generation limit is reached, or when the population has <i>converged</i>: a position (gene) is 'converged' at level α once at least α% of individuals share the same value there, and the population converges at level β once at least β% of genes are converged (e.g. α≈95, β≈100).",
    "<b>Return</b> the highest-scoring DAG G(E) observed across all generations."
  ],

  keyConcepts: [
    { term: "Population", def: "A set of candidate solutions held at the same time. GA improves them all together rather than refining a single graph." },
    { term: "Chromosome / encoding", def: "How a candidate is represented as 'genes'. Here a chromosome is an ordering of the variables; each position is a gene." },
    { term: "Decoding via K2", def: "An ordering on its own is not a network. K2 reads the order and builds the best DAG that respects it; that DAG's score becomes the ordering's fitness." },
    { term: "Fitness = score", def: "Each individual is judged by the network score (K2 score) of the DAG it decodes to. Selection favours higher-scoring individuals." },
    { term: "Selection", def: "Choosing parents for the next generation, biased toward fitter individuals (e.g. roulette-wheel proportional to fitness), often with elitism to preserve the best." },
    { term: "Alternating-position (AP) crossover", def: "A permutation-safe crossover: build the child by alternately taking the next unused element from Parent 1 and Parent 2, skipping any element already present." },
    { term: "Scramble mutation", def: "Pick a contiguous sub-string of the ordering and randomly reshuffle its elements, injecting diversity without breaking the permutation." },
    { term: "Convergence (α, β)", def: "Stopping criterion based on genetic uniformity: a gene converges when α% of the population agrees on it; the population converges when β% of genes have converged." }
  ],

  animation: {
    title: "GA over orderings, decoded by K2, on a 4-node example {1,2,3,4}. We draw the current best DAG and use chips for population fitness. (Illustrative 4-node example in the spirit of paper Fig.14 / Examples 14-15.)",
    nodes: [
      { id: "1", x: 0.10, y: 0.20 },
      { id: "2", x: 0.85, y: 0.20 },
      { id: "3", x: 0.10, y: 0.82 },
      { id: "4", x: 0.85, y: 0.82 }
    ],
    edges: [],
    steps: [
      { caption: "<b>Initialise a population</b> of random orderings of the variables {1,2,3,4}. Each ordering is one candidate solution (a chromosome).", ops: [
        { op: "set", name: "Population (orderings)", items: ["3·1·2·4", "1·4·3·2", "2·3·1·4", "4·2·1·3"] },
        { op: "badge", text: "Generation 0", kind: "info" }
      ] },
      { caption: "<b>Decode &amp; score each ordering with K2.</b> K2 turns each ordering into a DAG and reports its score — that score is the individual's fitness. We draw the best ordering so far (3·1·2·4) as a DAG.", ops: [
        { op: "addEdge", from: "3", to: "1" }, { op: "addEdge", from: "1", to: "2" },
        { op: "set", name: "Population fitness", items: ["3·1·2·4 → -512", "1·4·3·2 → -540", "2·3·1·4 → -528", "4·2·1·3 → -551"] },
        { op: "score", text: "best fitness = -512" }
      ] },
      { caption: "<b>Selection.</b> Fitter orderings are more likely to become parents. The two best (3·1·2·4 and 2·3·1·4) are highlighted as the chosen parents.", ops: [
        { op: "set", name: "Selected parents", items: ["Parent 1 = 3·1·2·4", "Parent 2 = 2·3·1·4"] },
        { op: "highlightNodes", ids: ["3", "1"], cls: "hl" },
        { op: "badge", text: "select fittest", kind: "good" }
      ] },
      { caption: "<b>Crossover (alternating-position).</b> Build a child by taking elements alternately from Parent 1 then Parent 2, skipping ones already used: 3 (P1), 2 (P2), 1 (P1), 4 → child ordering 3·2·1·4.", ops: [
        { op: "set", name: "AP crossover", items: ["P1=3·1·2·4", "P2=2·3·1·4", "child = 3·2·1·4"] },
        { op: "badge", text: "crossover p_c", kind: "info" }
      ] },
      { caption: "<b>Decode the child.</b> K2 on ordering 3·2·1·4 yields a different DAG: now 3→2 appears as well. This child mixes structure from both parents.", ops: [
        { op: "removeEdge", from: "1", to: "2" },
        { op: "addEdge", from: "3", to: "2" }, { op: "addEdge", from: "2", to: "1" },
        { op: "highlightEdges", edges: [["3","2"],["2","1"]] }
      ] },
      { caption: "<b>Mutation (scramble).</b> With probability p_m, scramble a sub-string of the child's ordering. Here the sub-string (2·1·4) is reshuffled to (4·2·1), giving 3·4·2·1.", ops: [
        { op: "set", name: "Scramble mutation", items: ["before = 3·[2·1·4]", "after  = 3·[4·2·1]", "child' = 3·4·2·1"] },
        { op: "badge", text: "mutation p_m", kind: "info" }
      ] },
      { caption: "<b>Decode the mutated child.</b> Ordering 3·4·2·1 decodes (via K2) to a DAG that now connects node 4: edge 3→4 is added. Mutation explored a new region of the search space.", ops: [
        { op: "addEdge", from: "3", to: "4" },
        { op: "highlightEdges", edges: [["3","4"]] }
      ] },
      { caption: "<b>New generation, generation 1.</b> Children replace the weak individuals (elitism keeps the previous best). Re-score the whole population with K2.", ops: [
        { op: "set", name: "Population fitness", items: ["3·4·2·1 → -498", "3·2·1·4 → -509", "3·1·2·4 → -512", "1·4·3·2 → -540"] },
        { op: "badge", text: "Generation 1", kind: "info" },
        { op: "score", text: "best fitness = -498  (improved from -512)" }
      ] },
      { caption: "<b>Generational improvement.</b> The best individual 3·4·2·1 now scores higher than anything in generation 0 — the population is climbing. Its DAG is the current champion.", ops: [
        { op: "highlightNodes", ids: ["3", "4"], cls: "good" },
        { op: "badge", text: "best so far ↑", kind: "good" }
      ] },
      { caption: "<b>Repeat for many generations.</b> Selection → crossover → mutation → scoring keeps refining. A weak edge is dropped and a better-supported one (4→2) is found as scores keep rising.", ops: [
        { op: "removeEdge", from: "2", to: "1" },
        { op: "addEdge", from: "4", to: "2" },
        { op: "score", text: "best fitness = -476" },
        { op: "badge", text: "Generation k", kind: "info" }
      ] },
      { caption: "<b>Convergence.</b> Once β% of genes have converged (α% of the population agree on them) — or the generation limit is hit — evolution stops.", ops: [
        { op: "set", name: "Population (converged)", items: ["3·4·2·1", "3·4·2·1", "3·4·1·2", "3·4·2·1"] },
        { op: "badge", text: "converged (α,β)", kind: "good" }
      ] },
      { caption: "<b>Return the best DAG.</b> The answer is the highest-scoring network observed across all generations — the evolved champion structure.", ops: [
        { op: "highlightEdges", edges: [["3","2"],["3","4"],["4","2"]] },
        { op: "score", text: "final best DAG = -476" },
        { op: "badge", text: "best DAG returned", kind: "good" }
      ] }
    ]
  },

  complexity: "Cost ≈ (population size) × (generations) × (cost of decoding+scoring one individual). With the order-based encoding each evaluation is a K2 run, so GA is far heavier than a single greedy search, but it is naturally parallel and explores broadly. No optimality guarantee — it is a metaheuristic.",
  strengths: [
    "Population-based global search escapes local optima that trap greedy hill-climbers.",
    "Order-based encoding decoded by K2 guarantees acyclic DAGs, so crossover and mutation never produce illegal graphs (no separate repair needed).",
    "Flexible: any decodable network score can serve as fitness, and the operators are problem-independent and easy to parallelise."
  ],
  limitations: [
    "Computationally expensive — every individual in every generation needs a K2 decode-and-score.",
    "No optimality guarantee; results depend on population size, crossover/mutation rates and the random seed.",
    "Direct DAG encodings (used by some related GAs) need explicit acyclicity repair and can break apart good substructures during crossover."
  ],
  notes: "Remark 4: K2 inside the GA can be replaced by an exact search over DAGs or any other algorithm that takes a variable order as input and returns a DAG. Related-work GAs vary the encoding (edge lists, adjacency/triangular matrices, partially-directed graphs over the equivalence class), the operators (one-/two-point crossover, edge-level mutation, partition-based crossover preserving building blocks), and add island models, NSGA-II multi-objective fronts, or hybridisation with tabu/local search.",
  figureRefs: "Paper §4.6 (pp.57-61): Algorithm 9 (GA algorithm), Fig.14 (population of orderings decoded by K2), Example 14 (alternating-position crossover), Example 15 (scramble mutation), Remark 4 (K2 swappable), §4.6.2 related work (Sierra & Larrañaga, Van Dijk et al., etc.)."
};
