/* HEA — Hybrid Evolutionary Algorithm (Wong & Leung 2004). Grounded in §4.14 (pp.90-92):
   Algorithm 19 (HEA), Recall 24 (evolutionary search/individuals/fitness),
   Recall 25 (low-order CI tests & search-space restriction), Fig.51 (overall HEA workflow),
   Fig.52 (iteration cycle: competition, merge, mutate). Cite: Man Leung Wong and Kwong Sak
   Leung, "An efficient data mining method for learning Bayesian networks using an evolutionary
   algorithm-based hybrid approach", IEEE Trans. Evolutionary Computation 8(4), 2004, 378-404. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["hea"] = {
  name: "Hybrid Evolutionary Algorithm (HEA)",
  oneLiner: "First screen the data with low-order independence tests to forbid edges between variables that look independent, then run an evolutionary search — a population of DAGs that mutate, merge and compete on their network score — but only within the edges that screening left allowed.",
  basedOnText: "HEA marries the two big families: a PC-style constraint phase (low-order conditional-independence screening) restricts the search space, and a score-based evolutionary search (a genetic / evolutionary algorithm over DAGs) optimises a decomposable network score inside that restricted space. So it is a constraint-based + score-based hybrid — CI tests prune what the population is allowed to build.",

  assumptions: [
    "<b>A decomposable score</b> — each candidate DAG is evaluated by a score that breaks into per-family pieces (e.g. BIC) of the form score(G | D), so local edits give cheap local score updates.",
    "<b>Reliable low-order CI tests</b> — screening uses only order-0 and order-1 independence tests (conditioning set of size ≤ 1), which are statistically reliable and cheap; the resulting p-values drive the blacklists.",
    "<b>Evolutionary search is a metaheuristic</b> — a population evolves by randomised variation and fitness-based selection, with no optimality guarantee; quality depends on population size, generations and the operators.",
    "<b>Discrete variables</b> — the screening counts N[x,y,z] and the score are defined over discrete data."
  ],
  input: "A dataset D over discrete variables V, a decomposable network score (e.g. BIC), and HEA controls: population size m, competition size r, a mutation-count distribution p_K, the mutation-operator set (Simple / Reverse / Move / Knowledge), a threshold step Δα, and a maximum number of generations T.",
  output: "The single highest-scoring DAG G* observed across the whole evolutionary run.",

  idea: [
    "HEA combines the strengths of two paradigms. The <b>constraint side</b> (PC-style) looks at the data with cheap independence tests and decides which edges are clearly spurious; the <b>score side</b> (evolutionary) then breeds high-scoring networks, but is only ever allowed to draw the edges the constraints permit. The hybrid is: <i>CI tests shrink the search space, evolution searches what is left.</i>",
    "<b>Screening = a matrix of p-values.</b> Before evolving anything, HEA precomputes, for every ordered pair of variables, the maximal p-value over all order-0/1 CI tests (conditioning on nothing or on a single other variable). A pair that is easily made independent has a large p-value — it probably should not be connected.",
    "<b>An individual-specific blacklist.</b> Each DAG in the population carries its own threshold α: any edge whose maximal screening p-value exceeds α is <b>forbidden</b> (blacklisted) for that individual. Different individuals get different α, so the population explores different levels of strictness rather than committing to one global cut-off.",
    "<b>Fitness is the network score.</b> Each individual is a DAG; its fitness is the decomposable score(G | D). Variation is by graph mutations plus a specialised <b>merge</b> operator; <b>competition</b> (pairwise tournaments) selects the fittest to survive while offspring keep the search diverse — generation after generation the best score climbs.",
    "<b>The α nudge softens early mistakes.</b> Each generation an individual's α is moved by ±Δα. Raising α only releases previously forbidden edges; lowering α only adds forbidden edges. Because the blacklist never jumps arbitrarily, an unlucky early screening error need not be permanent — selection pressure can discard individuals whose blacklist is too restrictive."
  ],

  steps: [
    "<b>Precompute the screening matrix Pv.</b> For every ordered pair (X,Y), set Pv[X,Y] = the maximal p-value over all order-0/1 CI tests of X ⫫ Y | Z (Z empty or a single variable). High p-value ⇒ the pair looks independent ⇒ a candidate forbidden edge.",
    "<b>Initialise the population.</b> Create m random DAGs. Give each individual its own threshold α drawn at random in (0,1).",
    "<b>Build each individual's blacklist.</b> For every DAG, forbid edge X→Y whenever its screening p-value Pv[X,Y] exceeds that individual's α. Evaluate each DAG's score(G | D). The current champion G* is the best-scoring individual.",
    "<b>Generation loop (repeat up to T generations).</b> Run the variation–competition cycle below.",
    "<b>Mutate.</b> For each individual, draw a mutation count K from p_K and apply K random graph mutations from the operator set (Simple add/delete, Reverse an edge, Move, Knowledge), always respecting the individual's current blacklist (a forbidden edge is never added).",
    "<b>Nudge the threshold and re-prune.</b> Move α by ±Δα (clipped to [0,1]); recompute the blacklist from Pv and the new α. Raising α can only un-forbid edges; lowering α can only forbid more. Score the mutated graph.",
    "<b>Form the intermediate population.</b> The original individuals together with their mutated copies are pooled by union into an intermediate population I_t (roughly double the current size).",
    "<b>Competition (tournaments).</b> For each individual G in I_t, sample r random opponents and count how many it beats on score; that win-count s(G) is its tournament strength.",
    "<b>Selection.</b> Keep the m individuals with the largest win-counts s(·) (ties broken by score) as the next population P_{t+1}; update the global best G* if improved.",
    "<b>Offspring via merge.</b> Choose a subset of the survivors; for each loser-vs-winner pair, apply the <b>Merge</b> operator — replace, for a chosen subset of nodes, their parent sets in one graph by those from the other, provided the result stays acyclic and yields a higher decomposable score (only the changed families need re-scoring). Otherwise just mutate. Offspring diversify the search.",
    "<b>Advance the generation.</b> Take the survivors plus all offspring as the next population and continue, until the generation limit T is reached.",
    "<b>Return G*</b> — the highest-scoring DAG seen across the entire run."
  ],

  keyConcepts: [
    { term: "Hybrid (constraint + score)", def: "HEA uses both paradigms: PC-style CI tests restrict which edges may exist, and an evolutionary score-based search optimises the network score within that restriction." },
    { term: "Low-order CI screening", def: "Only order-0 and order-1 independence tests (conditioning on at most one variable) are used — cheap and statistically reliable — to estimate how independent each pair looks." },
    { term: "Screening matrix Pv", def: "For every ordered pair (X,Y), the maximal p-value over its order-0/1 CI tests. A large value means the pair is easily made independent and is a candidate forbidden edge." },
    { term: "Threshold α & blacklist", def: "Each individual carries its own α; any edge whose screening p-value exceeds α is forbidden for that individual. This is how constraints shrink the search space per-DAG." },
    { term: "Individual = DAG, fitness = score", def: "Every member of the population is a directed acyclic graph; its fitness is the decomposable network score(G | D), e.g. BIC." },
    { term: "Mutation operators", def: "Random graph edits drawn from a Simple/Reverse/Move/Knowledge set, applied K times (K from a distribution p_K), never violating the individual's blacklist." },
    { term: "Merge operator", def: "A specialised crossover-like move: copy a chosen subset of nodes' parent sets from one graph into another, kept only if the result stays acyclic and scores higher. Only changed families are re-scored." },
    { term: "Competition (tournament selection)", def: "Each individual plays r random opponents; its win-count decides survival. The fittest individuals are kept; offspring add diversity." },
    { term: "α nudge (±Δα)", def: "Each generation α moves by a small step: raising it releases forbidden edges, lowering it forbids more. Monotone changes mean early screening mistakes are recoverable." }
  ],

  animation: {
    title: "HEA on a faithful 5-node example {A,B,C,D,E}: a low-order CI screening phase builds a blacklist, then an evolutionary phase (mutate, merge, compete) optimises the score inside the allowed edges. (Illustrative example in the spirit of paper Algorithm 19 / Figs.51-52.)",
    nodes: [
      { id: "A", x: 0.10, y: 0.50 },
      { id: "B", x: 0.40, y: 0.18 },
      { id: "C", x: 0.40, y: 0.82 },
      { id: "D", x: 0.72, y: 0.50 },
      { id: "E", x: 0.95, y: 0.18 }
    ],
    edges: [],
    steps: [
      { caption: "<b>Constraint phase — screen the data.</b> Before evolving anything, HEA runs only low-order (order-0/1) CI tests on every pair and records the maximal p-value in the matrix Pv. We test A and E first.", ops: [
        { op: "badge", text: "Phase 1: CI screening (order 0/1)", kind: "info" },
        { op: "testCI", x: "A", y: "E", z: [], result: "indep" },
        { op: "score", text: "Pv[A,E] = 0.81  (large ⇒ candidate forbidden)" }
      ] },
      { caption: "<b>More low-order tests.</b> A ⫫ D given the single variable B (order-1). Its p-value is also large, so A–D and A–E are flagged as likely-spurious edges. These feed the blacklists.", ops: [
        { op: "testCI", x: "A", y: "D", z: ["B"], result: "indep" },
        { op: "score", text: "Pv[A,D] = 0.74 ,  Pv[A,E] = 0.81" },
        { op: "set", name: "Screening flags (high p-value)", items: ["A–E : 0.81", "A–D : 0.74", "C–E : 0.69"] }
      ] },
      { caption: "<b>Initialise the population.</b> Create a population of random DAGs (size 4 here), and give each individual its own random threshold α ∈ (0,1). α decides how strict that individual's blacklist will be.", ops: [
        { op: "badge", text: "Phase 2: evolution — Generation 0", kind: "info" },
        { op: "set", name: "Population (DAG, α)", items: ["G1  α=0.55", "G2  α=0.30", "G3  α=0.70", "G4  α=0.45"] }
      ] },
      { caption: "<b>Build each blacklist & score.</b> For individual G1 (α=0.55), any edge with Pv above 0.55 is forbidden — so A–E (0.81) and A–D (0.74) and C–E (0.69) are blacklisted. Inside the allowed edges, G1's DAG is drawn and scored.", ops: [
        { op: "set", name: "G1 blacklist (Pv > α)", items: ["forbid A→E", "forbid A→D", "forbid C→E"] },
        { op: "addEdge", from: "A", to: "B" }, { op: "addEdge", from: "A", to: "C" },
        { op: "addEdge", from: "B", to: "D" },
        { op: "score", text: "score(G1) = -612  (BIC)" }
      ] },
      { caption: "<b>Mutate.</b> Draw a mutation count K from p_K and apply K random edits from the Simple/Reverse/Move/Knowledge set — but never an edge on the blacklist. Here a Simple-add tries C→D (allowed) and is kept.", ops: [
        { op: "badge", text: "mutation (respects blacklist)", kind: "info" },
        { op: "addEdge", from: "C", to: "D" },
        { op: "highlightEdges", edges: [["C","D"]], cls: "hl" },
        { op: "score", text: "score(G1') = -601  (improved)" }
      ] },
      { caption: "<b>Nudge the threshold ±Δα.</b> G1's α rises 0.55 → 0.62. Raising α can only release forbidden edges — C–E (0.69) is still forbidden, but the blacklist never tightens unexpectedly, so early screening errors stay recoverable.", ops: [
        { op: "set", name: "G1 threshold", items: ["α: 0.55 → 0.62  (+Δα)", "released: none yet", "still forbidden: A–E, A–D, C–E"] },
        { op: "badge", text: "α nudge", kind: "info" }
      ] },
      { caption: "<b>Intermediate population.</b> Originals and their mutated copies are pooled by union, roughly doubling the size. We now have parents and offspring competing together.", ops: [
        { op: "set", name: "Intermediate I_t (scores)", items: ["G1' → -601", "G3' → -598", "G2' → -640", "G4' → -655", "...originals..."] },
        { op: "badge", text: "union: parents + mutants", kind: "info" }
      ] },
      { caption: "<b>Competition (tournaments).</b> Each individual plays r random opponents and earns a win-count for every opponent it out-scores. G3' beats 3 of its opponents; the weak G4' beats 0.", ops: [
        { op: "set", name: "Win-counts s(·)", items: ["G3' : 3 wins", "G1' : 3 wins", "G2' : 1 win", "G4' : 0 wins"] },
        { op: "badge", text: "pairwise tournaments (size r)", kind: "info" }
      ] },
      { caption: "<b>Selection.</b> Keep the individuals with the largest win-counts (ties broken by score) as the next population; the loser G4' is dropped. The global best G* is updated.", ops: [
        { op: "set", name: "Survivors P_{t+1}", items: ["G3'  -598", "G1'  -601", "G2'  -640"] },
        { op: "score", text: "G* = G3'  (-598)" },
        { op: "badge", text: "fittest survive", kind: "good" }
      ] },
      { caption: "<b>Offspring via Merge.</b> Pair a loser with a winner: copy a subset of nodes' parent sets from the fitter G3' into G1'. Here D adopts G3''s parents {B,C} and node E gains parent D — kept because the graph stays acyclic and scores higher. Only changed families are re-scored.", ops: [
        { op: "addEdge", from: "D", to: "E" },
        { op: "highlightEdges", edges: [["B","D"],["C","D"],["D","E"]], cls: "good" },
        { op: "set", name: "Merge (parent-set swap)", items: ["node D ← parents {B,C} from G3'", "node E ← parent {D}", "acyclic ✓ , higher score ✓"] },
        { op: "score", text: "score(offspring) = -571" }
      ] },
      { caption: "<b>Generational improvement.</b> Survivors + offspring form the next generation and the best score keeps climbing. The blacklist still forbids A–E and A–D, so the spurious edges screening rejected never reappear.", ops: [
        { op: "badge", text: "Generation k", kind: "info" },
        { op: "highlightNodes", ids: ["B", "C", "D", "E"], cls: "good" },
        { op: "score", text: "best fitness = -558  (was -612)" }
      ] },
      { caption: "<b>Stop & return G*.</b> When the generation limit T is reached, HEA returns the highest-scoring DAG ever seen — a network optimised by evolution but confined to the edges the CI-screening constraints allowed. The hybrid: constraints prune, evolution optimises.", ops: [
        { op: "highlightEdges", edges: [["A","B"],["A","C"],["B","D"],["C","D"],["D","E"]], cls: "good" },
        { op: "score", text: "final best DAG G* = -558" },
        { op: "badge", text: "best DAG returned", kind: "good" }
      ] }
    ]
  },

  complexity: "Cost ≈ (CI-screening of all pairs with order-0/1 tests) + (population size m) × (generations T) × (cost of variation, scoring and competition per individual). Decomposable scoring plus the merge operator's local deltas make each evaluation cheap, but the population × generations factor makes HEA far heavier than a single search; it is a metaheuristic with no optimality guarantee. The CI screening, done once up front, shrinks the per-individual search space and so speeds up every later generation.",
  strengths: [
    "Hybrid design: cheap low-order CI tests prune obviously-spurious edges, so the expensive evolutionary search only explores plausible structures.",
    "Per-individual thresholds α (nudged ±Δα monotonically) make early screening mistakes recoverable — the blacklist can loosen, and selection discards over-restrictive individuals.",
    "Population search escapes local optima, while the merge operator recombines good substructures and decomposable scoring keeps re-evaluation local and fast."
  ],
  limitations: [
    "Computationally expensive — many individuals scored over many generations, on top of the all-pairs CI screening.",
    "No optimality guarantee; results depend on population size, competition size, mutation distribution, Δα and the random seed.",
    "Screening relies on low-order CI tests only, so a wrong p-value can blacklist a true edge (mitigated, not eliminated, by the α nudge)."
  ],
  notes: "Recall 24 frames the evolutionary core (individuals = DAGs, variation = graph mutations + merge, fitness = network score, competition = tournament selection). Recall 25 frames the constraint core (order-0/1 CI tests over marginal counts N[x,y,z] used to restrict the search space). The original method is Wong & Leung's evolutionary-algorithm-based hybrid for learning Bayesian networks.",
  figureRefs: "Paper §4.14 (pp.90-92): Algorithm 19 (HEA), Recall 24 (evolutionary search / individuals / fitness), Recall 25 (low-order CI tests & search-space restriction), Fig.51 (overall HEA workflow), Fig.52 (iteration cycle: competition, merge, mutate). Source reference [700]: Man Leung Wong & Kwong Sak Leung, 2004."
};
