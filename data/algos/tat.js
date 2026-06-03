/* TAT — Time–Approximation Trade-off. Grounded in §4.64 (pp.304-307), ref [351].
   Three schemes: TAT-PO last-bucket selection (Alg.83, Example 91, Figs.194-196),
   bounded-component (Alg.84, Thm 43, Example 92, Fig.197), core-periphery (Alg.85,
   Thm 44, Example 93, Figs.198-199). Worked example used in animation = Example 91 /
   Figs.194-196 (8 nodes {A..H}, k=4 buckets, merge r=2, partial-order scores). */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["tat"] = {
  name: "Time–Approximation Trade-off (TAT)",
  oneLiner: "Exact score-based structure learning is exponential, so TAT exposes a dial: instead of demanding the single best DAG, you fix how much structure you are willing to constrain (a partial order, a component-size cap, or a small exact 'core'), and in return you get a DAG whose score is guaranteed to be within a known fraction of the optimum — turn the dial up and you spend more time but get closer to optimal.",
  basedOnText: "Finding the maximum-scoring DAG has worst-case cost O(2^|V|), which is prohibitive beyond a modest |V|. TAT (Kundu et al.) trades time for a <i>provable</i> approximation of the maximum score, relying on the score being decomposable, score(G|D)=Σ_X FamScore(X,Pa_X|D), and on building sub-problems whose optimal solutions can be composed.",

  assumptions: [
    "<b>Decomposable score</b> — the global score is a sum of per-family local scores, score(G|D)=Σ_X FamScore(X, Pa_X | D), so independent subproblems can be solved and recombined.",
    "<b>A fixed approximation budget</b> — you commit in advance to how much you constrain the search (the number/size of buckets, the component-size cap c, or the core size k). This budget is what is traded against running time.",
    "<b>Empty-parent score ≥ 0 baseline</b> — nodes left fully unconstrained or whose families are dropped contribute at least their no-parent score (zero or better), which is what makes the worst-case guarantee provable."
  ],
  input: "A dataset D over variables V, a decomposable local-score function, and a chosen approximation budget (e.g. number of buckets k and merge count r, or component cap c, or core size k).",
  output: "A high-scoring DAG G whose score is guaranteed to be at least a known fraction of the global optimum (an r/k fraction for TAT-PO, a 1/c fraction for the bounded-component and core–periphery schemes).",

  idea: [
    "The starting point is brutal arithmetic: searching over all DAGs on V costs O(2^|V|), so beyond a few dozen variables exact optimisation is hopeless. TAT's response is not a single algorithm but a <b>family of three schemes that all turn one knob</b> — how much you are willing to restrict the search — into a guaranteed score ratio. Smaller restriction = faster but rougher; larger restriction = slower but provably closer to optimal.",
    "<b>Scheme 1 — partial-order / last-bucket selection (TAT-PO, Alg. 83).</b> Partition the nodes into k ordered <i>buckets</i> B₁ ≼ … ≼ B_k. A DAG is <i>compatible</i> with this order if every parent of a node in B_i lies in B₁∪…∪B_i. Searching only compatible DAGs costs O(2^M) where M is the largest bucket — far cheaper than O(2^|V|). By merging r of the k buckets into the last, <i>unconstrained</i> bucket, you fix an r/k fraction of the nodes that may pick parents freely; the resulting DAG scores at least an <b>r/k fraction</b> of the global optimum in the pessimistic case. <b>The dial is r and k:</b> larger last buckets improve the ratio but inflate the 2^M cost; smaller ones do the opposite.",
    "<b>Scheme 2 — bounded components (Alg. 84, Thm 43).</b> Restrict attention to DAGs whose <i>moralized</i> graph decomposes into connected components of size at most c. Then you can solve each small subproblem exactly and recombine them by choosing a collection of pairwise-disjoint high-scoring pieces — a max-weight c-set packing. This delivers a <b>1/c-approximation</b> and runs in time polynomial in |V| for fixed c. <b>The dial is c:</b> bigger c → better ratio, but the per-component exact search grows.",
    "<b>Scheme 3 — core–periphery (Alg. 85, Thm 44).</b> Relax the size cap by allowing removal of up to k nodes. The removed nodes plus their parents form a small <i>core</i> that is searched exactly; everything else is the <i>periphery</i>, handled with the bounded-component method. Combining them keeps the same 1/c ratio while staying polynomial for fixed c and k — letting the (small) core absorb the one big component that would otherwise break the size bound.",
    "Across all three, the common theme is the same trade: <b>commit a budget up front, get a known-quality answer faster.</b> You never lose the guarantee — you only choose where on the time-versus-quality curve to sit."
  ],

  steps: [
    "<b>Pick a scheme and a budget.</b> Decide whether to constrain by partial order (k buckets, merge r), by component size (cap c), or by core–periphery (cap c, core size k). This single choice fixes both the running-time and the quality guarantee.",
    "<b>TAT-PO — bucket the nodes.</b> Partition V into k ordered buckets B₁ ≼ … ≼ B_k. Any DAG whose every node draws parents only from its own and earlier buckets is <i>compatible</i> with this order. (Alg. 83, line 2; Recall 80.)",
    "<b>Merge r buckets into the last one.</b> Fold r of the k buckets into the final, unconstrained bucket L, so an r/k fraction of nodes may choose parents with no restriction. For each choice of which r to merge and each permutation π of the remaining k−r buckets, build a partial order. (Alg. 83, lines 3–5.)",
    "<b>Score each partial order by exact DP.</b> Run dynamic programming over the DAGs compatible with each order to get the best compatible DAG G_PO and its score — cost O(2^M) with M the largest bucket, not O(2^|V|). (Alg. 83, lines 6–7.)",
    "<b>Keep the best.</b> Whenever a partial order beats the current champion, store its DAG. After all choices, return G_best. Its score is at least an r/k fraction of the global optimum. (Alg. 83, lines 8–12.)",
    "<b>Bounded-component scheme — bound the moralized graph.</b> Alternatively, restrict to DAGs whose moralized graph splits into components of size ≤ c. (Recall 81, 82; Thm 43.)",
    "<b>Solve and pack small subproblems.</b> Enumerate all ≤ c-node subsets, compute each one's optimal local DAG score, sort by weight, and greedily keep a subset whenever it is disjoint from those already chosen — a max-weight c-set packing. Combine the kept pieces into one DAG. (Alg. 84; Example 92, Fig. 197.)",
    "<b>Core–periphery scheme — peel off a small core.</b> When one component is too big, remove up to k nodes: the removed nodes (N₁) plus their parents (N₂) form the <i>core</i>, searched exactly; the rest (N₃) is the <i>periphery</i>, solved by bounded components. (Alg. 85; Example 93, Figs. 198–199.)",
    "<b>Recombine and return.</b> Glue the exact core solution to the bounded-component periphery solution into the final DAG, which keeps the 1/c guarantee. (Thm 44; Fig. 199b.)"
  ],

  keyConcepts: [
    { term: "Time–approximation trade-off", def: "The core idea: exact search is O(2^|V|), so you trade some optimality for time, but with a provable bound on how much score you give up. A tunable dial, not a fixed loss." },
    { term: "Bucket-compatible partial order (Recall 80)", def: "An ordered list of node buckets B₁ ≼ … ≼ B_k. A DAG is compatible if every parent of a node in B_i lies in B₁∪…∪B_i. Searching only compatible DAGs costs O(2^M) for the largest bucket M." },
    { term: "Last-bucket merge (r of k)", def: "Folding r buckets into a final unconstrained bucket frees an r/k fraction of nodes to pick any parents, giving an r/k score guarantee. The chief time-vs-quality knob of TAT-PO." },
    { term: "Decomposable score", def: "score(G|D)=Σ_X FamScore(X,Pa_X|D). Because the score is a sum of per-family terms, independent subproblems can be optimised separately and recombined — the property every TAT scheme exploits." },
    { term: "Bounded-component (1/c) approximation (Thm 43)", def: "Restricting the moralized graph to components of size ≤ c gives a 1/c-approximation in time polynomial in |V| for fixed c, via max-weight c-set packing of optimal small subgraphs." },
    { term: "Core–periphery (Thm 44)", def: "Remove up to k nodes to form a small core (searched exactly) and a periphery (bounded-component method). Keeps the 1/c ratio while staying polynomial for fixed c, k." }
  ],

  animation: {
    title: "TAT-PO on the 8-node example {A..H} (paper Example 91, Figs. 194–196): k=4 buckets, merge r=2, dial up the budget to improve the guaranteed score.",
    nodes: [
      { id: "A", x: 0.18, y: 0.16 },
      { id: "B", x: 0.45, y: 0.16 },
      { id: "C", x: 0.72, y: 0.16 },
      { id: "D", x: 0.92, y: 0.16 },
      { id: "E", x: 0.18, y: 0.82 },
      { id: "F", x: 0.45, y: 0.82 },
      { id: "G", x: 0.72, y: 0.82 },
      { id: "H", x: 0.92, y: 0.82 }
    ],
    edges: [],
    steps: [
      { caption: "<b>The problem.</b> Eight variables {A..H}. Finding the single best-scoring DAG costs O(2^|V|) — far too slow at scale. TAT instead offers a dial that buys speed for a <i>known</i> drop in quality. Global optimum (for reference) scores ≈ 10.11.", ops: [
        { op: "highlightNodes", ids: ["A","B","C","D","E","F","G","H"], cls: "hl" },
        { op: "badge", text: "exact = O(2^|V|)", kind: "bad" },
        { op: "set", name: "Dial (TAT-PO)", items: ["k = 4 buckets", "merge r = ?", "guarantee = r/k"] }
      ] },
      { caption: "<b>Bucket the nodes (k = 4).</b> Partition V into 4 ordered buckets — {A,B},{C,D},{E,F},{G,H}. A DAG is <i>compatible</i> if every parent of a node lies in its own or an earlier bucket. This is the initial bucketing of Fig. 194.", ops: [
        { op: "badge", text: "k = 4", kind: "info" },
        { op: "set", name: "Buckets", items: ["B1={A,B}", "B2={C,D}", "B3={E,F}", "B4={G,H}"] }
      ] },
      { caption: "<b>Lowest budget — merge r = 1.</b> Free only the last bucket. Few nodes pick parents unrestricted, so the search is fastest but the guarantee is weakest: score ≥ (1/4) of optimum. A quick rough DAG.", ops: [
        { op: "clearSet", name: "Dial (TAT-PO)" },
        { op: "set", name: "Dial (TAT-PO)", items: ["k = 4", "merge r = 1", "guarantee = 1/4"] },
        { op: "badge", text: "fast / approx", kind: "bad" },
        { op: "addEdge", from: "A", to: "B" },
        { op: "addEdge", from: "C", to: "G" },
        { op: "addEdge", from: "F", to: "H" },
        { op: "score", text: "score ≈ 3.68 (rough)" }
      ] },
      { caption: "<b>Turn the dial up — merge r = 2.</b> Now two of the four buckets are folded into the unconstrained last bucket: an r/k = 2/4 = 1/2 fraction of nodes may choose any parents. Stronger guarantee, more partial orders to try. (Example 91.)", ops: [
        { op: "clearSet", name: "Dial (TAT-PO)" },
        { op: "set", name: "Dial (TAT-PO)", items: ["k = 4", "merge r = 2", "guarantee = 1/2"] },
        { op: "badge", text: "r/k = 2/4", kind: "info" }
      ] },
      { caption: "<b>Enumerate partial orders.</b> With r=2 there are C(4,2) choices of which buckets to merge, and the remaining buckets are permuted into an order. Each ordering is one candidate to score by exact DP — cost O(2^M), not O(2^|V|). (Fig. 195.)", ops: [
        { op: "set", name: "Candidate orders", items: ["…07.09", "…10.11", "…09.32", "…06.25", "…04.52", "…03.68"] },
        { op: "badge", text: "DP cost O(2^M)", kind: "good" }
      ] },
      { caption: "<b>Score candidate order #1.</b> Permuting the remaining buckets one way and running DP over compatible DAGs yields a best compatible DAG scoring 7.09. Better than the rough r=1 result already. (Fig. 195, top-left.)", ops: [
        { op: "removeEdge", from: "C", to: "G" },
        { op: "removeEdge", from: "F", to: "H" },
        { op: "addEdge", from: "A", to: "C" },
        { op: "addEdge", from: "B", to: "F" },
        { op: "addEdge", from: "C", to: "E" },
        { op: "score", text: "score = 7.09" },
        { op: "badge", text: "candidate 1", kind: "info" }
      ] },
      { caption: "<b>Score candidate order #2.</b> A different permutation of the same r=2 budget lets more parents fall in earlier buckets and scores 10.11 — the highest of the enumerated orders. (Fig. 195, top-middle.)", ops: [
        { op: "addEdge", from: "B", to: "D" },
        { op: "addEdge", from: "F", to: "G" },
        { op: "orient", from: "A", to: "C", type: "directed" },
        { op: "score", text: "score = 10.11 (best so far)" },
        { op: "badge", text: "new champion", kind: "good" }
      ] },
      { caption: "<b>Keep the best, discard the rest.</b> Other orders score 9.32, 6.25, 4.52, 3.68 — all below 10.11, so they are dropped. TAT-PO stores only the running champion (Alg. 83, lines 7–9).", ops: [
        { op: "clearSet", name: "Candidate orders" },
        { op: "set", name: "Kept", items: ["best = 10.11", "rejected: 9.32, 7.09,", "6.25, 4.52, 3.68"] },
        { op: "score", text: "best = 10.11" },
        { op: "highlightNodes", ids: ["A","B","C","D","F","G"], cls: "hl" }
      ] },
      { caption: "<b>The selected compatible DAG.</b> The highest-scoring order's DAG (Fig. 196) is returned: A→C, A→B, B→D, B→F, C→E, F→G, G→H. With r/k = 1/2 its score is guaranteed ≥ half the global optimum — and here it actually <i>reaches</i> it.", ops: [
        { op: "addEdge", from: "G", to: "H" },
        { op: "orient", from: "A", to: "B", type: "directed" },
        { op: "orient", from: "B", to: "D", type: "directed" },
        { op: "orient", from: "B", to: "F", type: "directed" },
        { op: "orient", from: "C", to: "E", type: "directed" },
        { op: "orient", from: "F", to: "G", type: "directed" },
        { op: "orient", from: "G", to: "H", type: "directed" },
        { op: "badge", text: "returned G_best", kind: "good" }
      ] },
      { caption: "<b>Push the dial further — toward exact.</b> Raising r toward k (or in the other schemes, raising the component cap c toward |V|) shrinks the gap to optimum: at r=k there is no restriction and you recover the exact O(2^|V|) optimum. The cost climbs with the 2^M factor.", ops: [
        { op: "clearSet", name: "Dial (TAT-PO)" },
        { op: "set", name: "Dial (TAT-PO)", items: ["k = 4", "merge r → k", "guarantee → 1 (exact)"] },
        { op: "score", text: "score → optimum (10.11)" },
        { op: "badge", text: "slower / near-optimal", kind: "good" }
      ] },
      { caption: "<b>The trade-off, summarised.</b> Low budget (r=1, or small c): fast, rough, ≥1/4 of optimum. High budget (r→k, or large c): slow, near-optimal. TAT lets you pick any point on this curve — and always tells you the worst-case quality you are buying.", ops: [
        { op: "set", name: "Time ↔ quality", items: ["r=1 → fast, ≥1/4 opt", "r=2 → balanced, ≥1/2 opt", "r→k → slow, exact"] },
        { op: "badge", text: "tunable guarantee", kind: "good" },
        { op: "highlightEdges", edges: [["A","B"],["A","C"],["B","D"],["B","F"],["C","E"],["F","G"],["G","H"]] }
      ] }
    ]
  },

  complexity: "TAT-PO runs in O(2^M) where M is the largest bucket (vs O(2^|V|) exact), with the score guaranteed ≥ r/k of optimum — larger r/k improves the ratio but inflates the 2^M factor. The bounded-component scheme gives a 1/c-approximation in time polynomial in |V| for fixed c (via max-weight c-set packing of optimal ≤c-node subgraphs). Core–periphery keeps the 1/c ratio and stays polynomial for fixed c and k.",
  strengths: [
    "Provides a <b>provable</b> approximation guarantee (r/k or 1/c) rather than a heuristic with unknown loss.",
    "A genuine tunable dial: pick any point between fast/rough and slow/near-optimal, recovering the exact optimum at the extreme.",
    "Polynomial-time variants (bounded-component, core–periphery) for fixed budget, exploiting score decomposability."
  ],
  limitations: [
    "The guarantee is worst-case: the pessimistic r/k or 1/c bound can be loose, and tightening it costs exponentially more (2^M grows with bucket size).",
    "Requires a decomposable score and a sensible bucketing / component structure; poor partitions waste the budget.",
    "Enumerating partial orders (TAT-PO) or all ≤c-node subsets (bounded-component) can be costly when the budget is pushed high."
  ],
  notes: "TAT is one of several scalability ideas that trade statistical optimality or search completeness. Related work: LSevoBN (Kaminsky & Deeva) clusters variables into weakly-coupled blocks by pairwise conditional mutual information and reconnects them; Lu et al. split large datasets into shards with an online streaming-feature causal learner and merge by edge voting; Zhao et al. fix variables outside the current subset and grow the network with tabu-guided hill-climbing over nested subsets.",
  figureRefs: "Paper §4.64 (pp.304–307), ref [351]: Algorithm 83 (TAT-PO, last-bucket selection), Algorithm 84 (bounded-component), Algorithm 85 (core–periphery); Theorem 43 (1/c bounded-component), Theorem 44 (1/c core–periphery); Recalls 80–82; Example 91 with Figs. 194–196 (8-node TAT-PO), Example 92 with Fig. 197, Example 93 with Figs. 198–199."
};
