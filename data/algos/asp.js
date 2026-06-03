/* ASP — Answer Set Programming formulation for structure learning. Gold-reference page.
   Grounded in §4.34 (pp.172-174): the ASP "primer" (Recall 41), the illustrative ASP
   fragment (cand/edge/fail/#minimize), Definition 14 (d-connection graph / state triple),
   Example 44 + Fig.100 (d-connection graph for B⊥D|{E,F}), and the weight/log-odds Eq.(34). */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["asp"] = {
  name: "ASP (Answer Set Programming) formulation",
  oneLiner: "Write structure learning as a logic program — facts about the (in)dependence tests, rules that build a candidate graph, hard constraints (no 2-cycles, must respect d-separation), and a cost to minimise — then let a generic ASP solver enumerate the graphs that satisfy everything and return the cheapest one.",
  basedOnText: "Constraint-based discovery with Answer Set Programming casts structure learning as an optimization problem: among all directed mixed graphs, find the one whose d-separations / d-connections agree with as many empirical (in)dependence constraints as possible, with disagreements weighted by their statistical credibility.",

  assumptions: [
    "<b>Weighted constraints, not an oracle</b> — instead of trusting every CI test, each (in)dependence statement carries a weight reflecting its statistical credibility, so the solver can overrule a few weak tests to stay globally consistent.",
    "<b>Directed mixed graphs allowed</b> — the search space is all directed mixed graphs with directed edges (→) and bidirected edges (↔), so latent confounders (and, in this formulation, more general structures) can be expressed, not just plain DAGs.",
    "<b>Soundness of the d-connection encoding</b> — assumes the symbolic d-connection-graph construction (Definition 14) correctly decides, for each query, whether two variables are d-separated or d-connected in a candidate graph.",
    "<b>A correct CI test supplies the facts</b> — a statistical test (with a weight) decides each X ⫫ Y | U statement that becomes a fact in the program."
  ],
  input: "A dataset over variables V, a CI test, and a set of weighted (in)dependence statements X ⫫ Y | U / X ⫫̸ Y | U each with a credibility weight W.",
  output: "An <b>optimal answer set</b> = a directed mixed graph (directed → and bidirected ↔ edges) that satisfies all hard constraints and minimises the total weight of violated (in)dependence constraints. The framework can return the single optimum or enumerate all consistent graphs.",

  idea: [
    "ASP is a <i>declarative</i> method: instead of coding a search procedure, you write a compact logical <b>specification</b> that <i>describes</i> the space of valid graphs plus an objective, and a generic solver does the searching. You say <i>what</i> a good graph is, not <i>how</i> to find it.",
    "Structure learning is encoded with four ingredients. <b>Facts</b> record the empirical evidence — each CI test result X ⫫ Y | U (or its dependence form) becomes an atom carrying a weight. <b>Choice rules</b> let the solver freely guess which candidate edges to include, ranging over all admissible graphs. <b>Hard constraints</b> forbid illegal graphs (e.g. no 2-cycles). <b>Optimization</b> (a weak constraint / #minimize) charges a penalty whenever the chosen graph contradicts a weighted statement.",
    "The clever part is judging each constraint <i>without</i> materializing every path. For a query (X,Y) under conditioning set U, the program symbolically builds a <b>d-connection graph</b> (Definition 14): marginalize out the variables not on the trail, and X and Y are adjacent in this derived graph exactly when an active trail still connects them — i.e. when they are <b>d-connected</b>. So the solver can check 'does this candidate graph make X and Y dependent given U?' purely as logic.",
    "Because every disagreement is weighted, the #minimize objective <b>reconciles contradictory tests</b>: it prefers the globally most coherent graph, trusting strong tests over weak ones rather than letting one bad early test cascade. The price is that exact optimization over all graphs does not scale to many variables."
  ],

  steps: [
    "<b>Run the CI tests and weight them.</b> For pairs (X,Y) with conditioning sets U up to a size limit, run the CI test. Turn each result into a weighted statement: X ⫫ Y | U (independence) or X ⫫̸ Y | U (dependence), with weight W from the test's credibility — formally a log-odds, w(K) = log[P(K|D)/(1−P(K|D))] (Eq. 34).",
    "<b>Write the facts.</b> Encode each weighted statement as an atom: <code>ind(X,Y,U,W)</code> for an independence and <code>dep(X,Y,U,W)</code> for a dependence. Admissible directed pairs become facts <code>cand(a,b)</code>.",
    "<b>Write the choice rule.</b> <code>{ edge(X,Y) } :- cand(X,Y).</code> lets the solver <i>guess</i> any subset of candidate edges — this is how the program ranges over all graphs.",
    "<b>Write the hard constraints.</b> <code>:- edge(X,Y), edge(Y,X).</code> forbids 2-cycles. (Acyclicity / other structural restrictions are imposed the same way: an integrity constraint <code>:- Body.</code> kills any candidate whose body holds.)",
    "<b>Encode d-connection.</b> For each query, the program symbolically constructs the d-connection graph (Definition 14): it conditions on U (adding edges between a collider's parents and self-loops to mark activated colliders) and marginalizes out everything not on the trail; X,Y are adjacent there iff they are d-connected.",
    "<b>Encode violations as failures.</b> A rule derives <code>fail(X,Y,U,W)</code> exactly when the chosen graph <i>disagrees</i> with a statement — e.g. <code>fail(...) :- ind(X,Y,U,W), edge(X,Y).</code> (graph connects a pair the data says is independent) and <code>fail(...) :- dep(X,Y,U,W), not edge(X,Y).</code> The fail rule's body is the d-connection-graph check.",
    "<b>Optimise.</b> The weak constraint <code>#minimize [ fail(X,Y,U,W) = W ].</code> asks the solver to minimise the summed weight of all violated constraints, so it prefers graphs agreeing with the most (and most strongly supported) tests.",
    "<b>Solve.</b> The ASP solver <i>grounds</i> the program (instantiates all variables) into a propositional program, then searches its stable models (answer sets). It returns the answer set — the directed mixed graph — with the smallest total fail weight (or enumerates all consistent graphs)."
  ],

  keyConcepts: [
    { term: "Answer Set Programming (ASP)", def: "A declarative framework for search and optimization: you write a logical specification (facts + rules + constraints + objective) describing valid solutions; the solver grounds it and computes answer sets (stable models) that satisfy every rule and optimise the objective." },
    { term: "Fact / rule / integrity constraint", def: "A fact is an unconditional atom like edge(a,b). A rule 'Head :- Body.' means Head holds if Body holds. An integrity constraint ':- Body.' has an empty head and forbids any candidate that makes Body true." },
    { term: "Choice rule", def: "'{ edge(X,Y) } :- cand(X,Y).' lets the solver pick any subset of the allowed edges. This is the mechanism that enumerates over all candidate graphs." },
    { term: "d-connection graph (Definition 14)", def: "A derived graph for a query (X,Y) under conditioning set U: marginalize out variables off the trail and add edges/self-loops for conditioned colliders. X and Y are adjacent in it exactly when they are d-connected (dependent) given U — so the test is decided symbolically, without enumerating all paths." },
    { term: "fail atom & weight", def: "fail(X,Y,U,W) is derived when the candidate graph contradicts a weighted (in)dependence statement. The weight W is the log-odds credibility of that statement, w(K)=log[P(K|D)/(1−P(K|D))] (Eq. 34)." },
    { term: "#minimize (weak constraint)", def: "An optimization directive that minimises the total weight of derived fail atoms, so the returned graph violates as few — and as weakly-supported — constraints as possible." },
    { term: "Directed mixed graph", def: "A graph with directed edges (→) and bidirected edges (↔). Bidirected edges represent the influence of a latent common cause, so the ASP search space is broader than plain DAGs." }
  ],

  animation: {
    title: "ASP on a faithful 4-node example {A,B,C,D}: weighted CI facts + hard constraints, the solver guesses graphs, rejects a cyclic one, returns the lowest-cost answer set. (Schematic — not from the paper's figure.)",
    nodes: [
      { id: "A", x: 0.20, y: 0.18 },
      { id: "B", x: 0.78, y: 0.18 },
      { id: "C", x: 0.20, y: 0.82 },
      { id: "D", x: 0.78, y: 0.82 }
    ],
    edges: [],
    steps: [
      { caption: "<b>Step 1 — collect evidence.</b> Run weighted CI tests over {A,B,C,D}. Each result becomes a fact: a dependence (must be connected) or an independence (must be separated), with a credibility weight W (a log-odds, Eq. 34).",
        ops: [ { op: "set", name: "Facts", items: ["dep(A,B,[]) = 0.95", "dep(A,C,[]) = 0.90", "dep(B,D,[]) = 0.85", "dep(C,D,[]) = 0.80", "ind(B,C,[A]) = 1.20", "ind(A,D,[B,C]) = 0.70"] } ] },
      { caption: "<b>Step 2 — admissible edges + choice rule.</b> Declare the candidate directed pairs cand(X,Y), then '{edge(X,Y)} :- cand(X,Y).' lets the solver GUESS any subset of them — this is how it ranges over all graphs.",
        ops: [ { op: "set", name: "Constraints", items: ["cand(X,Y) for all ordered pairs", "{ edge(X,Y) } :- cand(X,Y).   % guess any subgraph"] } ] },
      { caption: "<b>Step 3 — hard constraints.</b> Add integrity constraints the graph MUST obey: no 2-cycles, and (here) acyclicity. ':- edge(X,Y), edge(Y,X).' instantly kills any candidate that violates them.",
        ops: [ { op: "set", name: "Constraints", items: [":- edge(X,Y), edge(Y,X).   % forbid 2-cycles", ":- cycle(X).                % forbid directed cycles"] } ] },
      { caption: "<b>Step 4 — cost of disagreement.</b> A rule derives fail(...) whenever the graph contradicts a fact, and '#minimize [ fail(X,Y,U,W)=W ]' charges its weight. The solver will hunt for the graph with the smallest total fail weight.",
        ops: [ { op: "set", name: "Constraints", items: ["fail(..) :- ind(X,Y,U,W), d-connected(X,Y,U).", "fail(..) :- dep(X,Y,U,W), d-separated(X,Y,U).", "#minimize [ fail(X,Y,U,W) = W ]."] } ] },
      { caption: "<b>Step 5 — first candidate.</b> The solver guesses a graph: A→B, A→C, B→D, C→D. It satisfies the dependence facts so far. Now it must check every constraint.",
        ops: [ { op: "addEdge", from: "A", to: "B", type: "directed" }, { op: "addEdge", from: "A", to: "C", type: "directed" }, { op: "addEdge", from: "B", to: "D", type: "directed" }, { op: "addEdge", from: "C", to: "D", type: "directed" }, { op: "badge", text: "candidate model #1", kind: "info" } ] },
      { caption: "<b>Step 6 — check the d-connection facts.</b> Build the d-connection graph for ind(B,C,[A]): conditioning on A blocks the only trail B←A→C, so B and C are d-separated. The graph AGREES — no fail charged.",
        ops: [ { op: "highlightNodes", ids: ["B", "C", "A"], cls: "hl" }, { op: "badge", text: "ind(B,C|A) satisfied", kind: "good" } ] },
      { caption: "<b>Step 7 — a rival candidate violates a HARD constraint.</b> The solver also tries adding D→A (to chase dep facts). But A→B→D→A is a directed cycle — the integrity constraint ':- cycle(X).' rejects this answer set outright.",
        ops: [ { op: "addEdge", from: "D", to: "A", type: "directed" }, { op: "highlightEdges", edges: [["A","B"],["B","D"],["D","A"]], cls: "bad" }, { op: "badge", text: "violates acyclicity — rejected", kind: "bad" } ] },
      { caption: "<b>Step 8 — discard the illegal graph.</b> Because the hard constraint failed, this candidate is not a valid answer set at all. The solver removes D→A and backtracks.",
        ops: [ { op: "removeEdge", from: "D", to: "A" }, { op: "badge", text: "candidate discarded", kind: "bad" } ] },
      { caption: "<b>Step 9 — score the legal candidate.</b> Candidate #1 obeys all hard constraints. Its only tension is the weak ind(A,D,[B,C]) test (W=0.70): A and D are correctly d-separated given {B,C}, so even that is satisfied. Total fail weight = 0.",
        ops: [ { op: "highlightNodes", ids: ["A", "D"], cls: "hl" }, { op: "score", text: "total fail weight = 0.00" } ] },
      { caption: "<b>Step 10 — compare costs.</b> Suppose an alternative legal graph dropped edge C→D to avoid a weak test: it would then violate dep(C,D,[]) (W=0.80) and pay 0.80. The #minimize objective prefers the cheaper graph.",
        ops: [ { op: "set", name: "Constraints", items: ["graph #1: total fail weight = 0.00  ← best", "graph #2 (no C→D): total fail weight = 0.80"] }, { op: "score", text: "minimise: pick 0.00 over 0.80" } ] },
      { caption: "<b>Step 11 — return the optimal answer set.</b> The solver returns the directed mixed graph with the smallest total weight of violated constraints: A→B, A→C, B→D, C→D. (It could also enumerate every graph tied for the minimum.)",
        ops: [ { op: "highlightEdges", edges: [["A","B"],["A","C"],["B","D"],["C","D"]], cls: "good" }, { op: "badge", text: "optimal answer set", kind: "good" }, { op: "score", text: "argmin Σ W·fail = 0.00" } ] }
    ]
  },

  complexity: "Exact combinatorial optimization over directed mixed graphs: the solver searches all graphs satisfying the constraints, so cost grows steeply with the number of variables and the number of CI statements grounded. Excellent for small/medium problems and provable optimality; does not scale to large variable counts the way greedy or constraint-based heuristics do — an exactness-vs-scalability trade-off.",
  strengths: [
    "Declarative and flexible: background knowledge, structural restrictions, and new constraint types are added by writing extra rules — no algorithm to re-engineer.",
    "Reconciles contradictory CI tests: weighting every statement and minimising total violation gives the globally most coherent graph instead of letting one bad test cascade.",
    "Handles latent confounders via bidirected edges (directed mixed graphs), and can return the single optimum or enumerate all consistent graphs.",
    "Provably optimal with respect to the encoded objective, given the weighted constraints."
  ],
  limitations: [
    "Scalability: exact optimization over all graphs is combinatorially hard, so it is limited to relatively small numbers of variables.",
    "Grounding can blow up: many variables and conditioning sets produce huge numbers of ground CI statements and rules.",
    "Quality depends entirely on the CI tests and the weights chosen for them (the log-odds in Eq. 34).",
    "Requires expressing structure learning in ASP — a modelling effort and a different skill set from procedural solvers."
  ],
  notes: "The key device is the <i>d-connection graph</i> (Definition 14, Example 44 / Fig.100): for a query (X,Y) under conditioning set U the state is a triple (V,U,E); conditioning on a collider (or a descendant that activates one) places a self-loop to mark that any trail through it stays active even if the collider is later marginalized, and marginalizing out a variable rewires its neighbours. This lets the ASP program decide d-separation vs d-connection symbolically, without enumerating all paths. Each statement's weight is the log-odds w(K)=log[P(K|D)/(1−P(K|D))] = log[ρ/(1−ρ)] + log[P(D|M⊥)/P(D|M_L)] (Eq. 34), combining a prior on independence with the Bayes-factor evidence; the dependence statement gets the opposite-signed magnitude.",
  figureRefs: "Paper §4.34 (pp.172–174): Recall 41 (ASP primer), the illustrative ASP fragment (cand/edge/ind/dep/fail/#minimize), Definition 14 (d-connection graph / state triple), Example 44 with Fig.100 (constructing the d-connection graph for B ⊥ D | {E,F}), and Eq.(34) (constraint weight as log-odds)."
};
