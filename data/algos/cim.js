/* CIM — Characteristic Imset. Grounded in §4.60 (pp.289-291), builds on GSP (§4.52).
   Definition 40 (characteristic imset c_G: a 0/1 function on subsets S⊆V, |S|≥2),
   Fig.184 (reading CIM coordinates: 2-var set {⟨0⟩,⟨1⟩}; 3-var v-structure X→Y←Z gives
   ⟨1,0,1,1⟩ over {X,Y},{X,Z},{Y,Z},{X,Y,Z}), Theorem 38 (two DAGs are I-equivalent iff
   same CIM → CIM is a unique class representative), the CIM polytope (convex hull of all
   CIMs in R^(2^|V|-|V|-1), vertices = CIMs of DAGs), the score-becomes-linear result
   (§4.60.2 / Hemmecke et al.: decomposable score = affine function of the CIM, so learning
   = optimizing a linear objective over the polytope), Theorem 39 (Face property: fixed
   skeleton G → CIM_G is a face; a reversal moves along an edge of that face), Fig.185 (a
   single covered-edge reversal X→Y ⇒ Y→X toggles supported triple coordinates),
   Fig.186 / Def.42 (edge addition turns on coordinates, an edge of the global polytope),
   Def.41 + Theorem 40 (turn pairs = edges of CIM_V), Remark 21 (CIM is I-equivalence-aware:
   one CIM per class, no redundant enumeration, skeleton-respecting moves), Remark 22
   (in-spirit GES-like search but in imset/representation space; greedy CIM, hybrid skeleton
   greedy CIM, edge-pair greedy CIM). Animation uses the paper's own 3-variable example
   (Fig.184b, the v-structure X→Y←Z and its imset ⟨1,0,1,1⟩). */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["cim"] = {
  name: "Characteristic Imset (CIM)",
  oneLiner: "Encode each Markov-equivalence class of DAGs as a single vector of 0s and 1s — the characteristic imset, indexed by variable subsets — so that the network score becomes a plain linear function of that vector; then structure learning turns into walking the edges of the geometric region (polytope) of valid imsets toward the highest-scoring one, and decoding the winning vector back into a graph.",
  basedOnText: "CIM (Linnusson et al.) is built on the same idea as GSP but works in a different representation. Instead of moving between graphs, it represents every equivalence class by one 0/1 vector (Definition 40); because the score is linear in that vector, learning becomes optimization of a linear objective over the convex 'characteristic-imset polytope', and CIM performs a GSP-style greedy walk along the edges (faces) of that polytope.",

  assumptions: [
    "<b>Causal sufficiency</b> — no hidden common causes; all relevant variables are observed and indexed in V.",
    "<b>Reliable, decomposable score (or CI oracle)</b> — a score that decomposes over families (e.g. BIC / BDeu); decomposability is exactly what makes the score an <i>affine (linear) function</i> of the characteristic imset, which the whole method relies on.",
    "<b>Restricted faithfulness</b> — like its parent GSP, CIM aims to recover the true equivalence class under weaker-than-full-faithfulness conditions; each characteristic imset is a unique representative of one I-equivalence class (Theorem 38).",
    "<b>Score equivalence</b> — Markov-equivalent DAGs receive the same score, consistent with one imset (one polytope vertex) representing the whole class."
  ],
  input: "A dataset 𝒟 over variables V = {1,…,p} and a decomposable scoring function (which is rewritten as a weight vector w, one weight per imset coordinate), plus a starting equivalence class / imset.",
  output: "A <b>CPDAG</b> (the equivalence class). Internally the result is the optimal characteristic imset c* — a 0/1 vector — which is decoded back to the CPDAG: coordinate {i,j}=1 means i,j are adjacent, and a triple {i,j,k}=1 with {i,j}=0 marks the v-structure i → k ← j.",

  idea: [
    "<b>The core trick: stop working with graphs, work with one vector.</b> Every DAG (and the whole equivalence class it belongs to) is converted into a single binary vector — the <i>characteristic imset</i> c_G — with one coordinate for each subset S of variables of size ≥ 2. A coordinate is 1 or 0 according to a simple rule (Definition 40), and crucially two DAGs are Markov-equivalent <i>if and only if</i> they have the same characteristic imset (Theorem 38). So one vector = one equivalence class, with no redundancy.",
    "<b>How to read the coordinates.</b> The size-2 coordinates record the <i>skeleton</i>: c({i,j}) = 1 exactly when i and j are adjacent. The size-3 coordinates record <i>v-structures</i>: if c({i,j,k}) = 1 but the pair c({i,j}) = 0, then i → k ← j is a collider (Fig. 184). Since skeleton + v-structures determine the equivalence class, the imset captures everything the CPDAG does — for example the three-variable collider X → Y ← Z has imset ⟨1, 0, 1, 1⟩ over the coordinates {X,Y},{X,Z},{Y,Z},{X,Y,Z}.",
    "<b>Why this is powerful: the score becomes linear.</b> A decomposable score (BIC/BDeu) can be rewritten so that the total score of a graph is just a <i>linear function</i> w · c of its characteristic imset — a weighted sum of the coordinates that are 1 (§4.60.2; Hemmecke et al. show the score is an affine function of the CIM). Maximizing the score is therefore maximizing a linear objective over all valid imsets.",
    "<b>Geometry: a polytope.</b> Each imset is a point in {0,1}^(2^p − p − 1); taking the convex hull of the imsets of <i>all</i> DAGs gives the <b>characteristic-imset polytope</b> CIM_V, whose vertices are exactly the CIMs of DAGs (Theorem 38). Optimizing a linear objective over a polytope is a clean, classical problem — its optimum sits at a vertex, i.e. at an actual equivalence class. Fixing a skeleton G picks out a <i>face</i> of this polytope (Theorem 39, the Face property).",
    "<b>The search: a GSP-style greedy walk along the polytope's edges.</b> CIM does not build the (huge) polytope. Like GSP it takes one local step at a time, but its moves are imset edits — toggling coordinates — that correspond to edges of the polytope: a single covered-edge reversal flips the supported triple coordinates (Fig. 185), an edge addition switches coordinates on (Fig. 186, Definition 42), and 'turn pairs' are precisely the edges of CIM_V (Definition 41, Theorem 40). CIM greedily accepts a move when the linear score w · c goes <i>up</i> and rejects it otherwise, descending to the best-scoring imset, then decodes that imset back to the CPDAG.",
    "<b>Why bother versus GES/GSP.</b> CIM is, in spirit, a GES-like search but carried out in the <i>imset representation</i> rather than directly on CPDAGs (Remark 22). Because the imset is a unique, equivalence-class-aware encoding (Remark 21), the search avoids re-examining many DAGs of the same class, never needs Meek-rule bookkeeping, and turns scoring into a transparent dot product — at the cost of working in a high-dimensional 0/1 space."
  ],

  steps: [
    "<b>Set up the encoding.</b> Index every subset S ⊆ V with |S| ≥ 2; the characteristic imset c is a 0/1 vector with one coordinate per such S (length 2^p − p − 1). Define each coordinate by Definition 40: c(S) = 1 iff there is a variable v ∈ S whose every other member of S is a parent of v (S\{v} ⊆ Pa_v).",
    "<b>Turn the score into weights.</b> Rewrite the decomposable score as a linear objective w · c: one weight per coordinate, computed from local family scores, so the total score of any structure equals the weighted sum of its 1-coordinates (§4.60.2). Maximizing the score now means maximizing w · c.",
    "<b>Initialise.</b> Start from an equivalence class (e.g. the empty graph or a skeleton estimate). Encode it as its characteristic imset c — some coordinates are 1 (its adjacencies and v-structures) — and evaluate the linear score w · c.",
    "<b>Enumerate local moves as coordinate toggles.</b> Each candidate move is a polytope-edge step expressed on the imset: a covered-edge reversal flips the supported triple coordinates with a fixed skeleton (Fig. 185, Theorem 39); an edge addition switches on the relevant pair/triple coordinates (Fig. 186, Definition 42); turn pairs are the legal edge moves of CIM_V (Definition 41, Theorem 40). Only moves landing on a valid imset (a real DAG class) are allowed.",
    "<b>Score each candidate by the linear objective.</b> For each toggled imset c′, the new score is simply w · c′ — adding or subtracting the weights of the coordinates that changed. No re-scoring of the whole graph is needed.",
    "<b>Greedily accept improving moves.</b> If a candidate raises the linear score (w · c′ > w · c), move to it: c ← c′. Reject moves that lower (or fail to raise) the score. Repeat enumerating and scoring moves.",
    "<b>Stop at a local optimum of the linear objective.</b> When no allowed coordinate-toggle increases w · c, the current imset is a (locally) optimal vertex of the polytope. (Variants: <i>greedy CIM</i> pure score search; <i>hybrid skeleton greedy CIM</i> first fixes a skeleton — a face — then optimizes within it; <i>edge-pair greedy CIM</i>.)",
    "<b>Decode the imset back to a graph.</b> Read the optimal c*: size-2 coordinates that are 1 give the skeleton's edges; size-3 coordinates that are 1 with their pair = 0 give the v-structures i → k ← j. Output the resulting CPDAG — the learned equivalence class."
  ],

  keyConcepts: [
    { term: "Characteristic imset (c_G)", def: "A 0/1 vector representing a DAG, with one coordinate for every subset S of variables with |S| ≥ 2. c(S) = 1 iff some v ∈ S has all the other members of S as parents (Definition 40). Length 2^|V| − |V| − 1." },
    { term: "Coordinate meaning", def: "Size-2 coordinate c({i,j}) = 1 ⇔ i and j are adjacent (the skeleton); size-3 coordinate c({i,j,k}) = 1 with c({i,j}) = 0 ⇔ i → k ← j is a v-structure (Fig. 184). Skeleton + v-structures = the equivalence class." },
    { term: "Unique class representative", def: "Two DAGs are Markov-equivalent if and only if they have the same characteristic imset (Theorem 38). So one imset encodes exactly one I-equivalence class — no duplicate DAGs to sift through (Remark 21)." },
    { term: "Linear / affine score", def: "A decomposable score (BIC/BDeu) can be rewritten as w · c, a weighted sum over the imset's coordinates (§4.60.2; Hemmecke et al.). Scoring a structure becomes a dot product, and improving a move is just adding the changed coordinates' weights." },
    { term: "Characteristic-imset polytope (CIM_V)", def: "The convex hull of the imsets of all DAGs, living in {0,1}^(2^p−p−1). Its vertices are exactly the CIMs of DAGs (Theorem 38), so maximizing a linear objective over it lands on a genuine equivalence class." },
    { term: "Face property", def: "Fixing a skeleton G selects a face of CIM_V (Theorem 39): all DAGs with that skeleton form a sub-polytope. The hybrid search optimizes within such a face after first estimating the skeleton." },
    { term: "Edge moves (covered reversal / edge addition / turn pair)", def: "Local steps expressed as coordinate toggles that correspond to edges of the polytope: a covered-edge reversal flips supported triples (Fig. 185), an edge addition switches coordinates on (Fig. 186, Def. 42), and turn pairs are precisely the edges of CIM_V (Def. 41, Theorem 40)." },
    { term: "Greedy CIM search", def: "A GSP-style greedy walk that, in imset space, toggles coordinates along polytope edges and accepts a move only when the linear score rises (Remark 22). Variants: greedy CIM, hybrid skeleton greedy CIM, edge-pair greedy CIM." }
  ],

  animation: {
    title: "CIM on the paper's three-variable example {X,Y,Z} (Fig. 184b): encode the class as a characteristic imset, optimise the linear score by toggling coordinates along polytope edges, then decode to the CPDAG. Imset coordinates are ordered {X,Y}, {X,Z}, {Y,Z}, {X,Y,Z}.",
    nodes: [
      { id: "X", x: 0.18, y: 0.28 },
      { id: "Y", x: 0.82, y: 0.28 },
      { id: "Z", x: 0.50, y: 0.85 }
    ],
    edges: [],
    steps: [
      { caption: "<b>The plan.</b> Three variables {X,Y,Z}; the truth is the collider X → Z ← Y. Instead of moving between graphs, CIM encodes each equivalence class as one 0/1 vector — the <b>characteristic imset</b> — with a coordinate for every subset of size ≥ 2. For three variables that is just four coordinates: the pairs {X,Y}, {X,Z}, {Y,Z} and the triple {X,Y,Z}.", ops: [
        { op: "set", name: "Coordinates (S)", items: ["{X,Y}", "{X,Z}", "{Y,Z}", "{X,Y,Z}"] },
        { op: "badge", text: "encode class as a vector", kind: "info" } ] },
      { caption: "<b>The score becomes linear.</b> A decomposable score (BIC/BDeu) is rewritten as a weighted sum w · c over these coordinates (§4.60.2). So 'find the best structure' turns into 'maximise a linear objective over the valid imsets' — the characteristic-imset polytope. Suppose the data's weights are w = (+2, −1, +2, +3): adjacency edges X–Z and Y–Z and the collider triple all pay off; the X–Y pair does not.", ops: [
        { op: "set", name: "Weights w", items: ["{X,Y}:+2", "{X,Z}:−1", "{Y,Z}:+2", "{X,Y,Z}:+3"] },
        { op: "badge", text: "score = w · c (linear)", kind: "info" } ] },
      { caption: "<b>Start at the empty class.</b> Begin from the empty graph: no edges, so every coordinate is 0. Imset c = ⟨0,0,0,0⟩, and the linear score is w · c = 0. This is one vertex of the polytope; CIM will walk to a better one by toggling coordinates.", ops: [
        { op: "clearSet", name: "Imset (active subsets)" },
        { op: "score", text: "w·c = 0" },
        { op: "badge", text: "start: empty imset ⟨0,0,0,0⟩", kind: "info" } ] },
      { caption: "<b>Move 1 — toggle coordinate {X,Z} on (add edge X–Z).</b> Switching coordinate {X,Z} from 0 to 1 corresponds to making X and Z adjacent (an edge-addition move, Fig. 186 / Def. 42 — an edge of the polytope). New score adds w({X,Z}) = −1.", ops: [
        { op: "addEdge", from: "X", to: "Z", type: "undirected" },
        { op: "highlightEdges", edges: [["X", "Z"]], cls: "hl" },
        { op: "set", name: "Imset (active subsets)", items: ["{X,Z}"] },
        { op: "score", text: "w·c = −1" },
        { op: "badge", text: "{X,Z}=1 → score −1 < 0 — reject", kind: "bad" } ] },
      { caption: "<b>Rejected: it lowered the score.</b> w · c went from 0 to −1, so greedy CIM does not keep this move on its own. Undo it (coordinate {X,Z} back to 0) and try a different toggle. The point: each move is just adding/subtracting a coordinate's weight — no whole-graph rescoring.", ops: [
        { op: "removeEdge", from: "X", to: "Z" },
        { op: "clearSet", name: "Imset (active subsets)" },
        { op: "score", text: "w·c = 0" },
        { op: "badge", text: "undo — back to ⟨0,0,0,0⟩", kind: "info" } ] },
      { caption: "<b>Move 2 — toggle {Y,Z} on (add edge Y–Z).</b> This coordinate has weight +2. The score rises from 0 to +2 — an improving move, so greedy CIM <b>accepts</b> it. Imset is now ⟨0,0,1,0⟩.", ops: [
        { op: "addEdge", from: "Y", to: "Z", type: "undirected" },
        { op: "highlightEdges", edges: [["Y", "Z"]], cls: "hl" },
        { op: "set", name: "Imset (active subsets)", items: ["{Y,Z}"] },
        { op: "score", text: "w·c = +2" },
        { op: "badge", text: "{Y,Z}=1 → +2 > 0 — accept", kind: "good" } ] },
      { caption: "<b>Move 3 — toggle {X,Z} on, now alongside {Y,Z}.</b> With {Y,Z} already 1, adding the X–Z adjacency starts to enable the collider at Z. Score becomes +2 + (−1) = +1. By itself this dips, but it is the first half of the turn pair that unlocks the high-weight triple — CIM's edge-pair / turn-pair move (Def. 41) lets it look one polytope edge ahead.", ops: [
        { op: "addEdge", from: "X", to: "Z", type: "undirected" },
        { op: "highlightEdges", edges: [["X", "Z"]], cls: "hl" },
        { op: "set", name: "Imset (active subsets)", items: ["{X,Z}"] },
        { op: "score", text: "w·c = +1" },
        { op: "badge", text: "{X,Z}=1 (turn-pair step)", kind: "info" } ] },
      { caption: "<b>Move 4 — toggle the triple {X,Y,Z} on (orient the v-structure X → Z ← Y).</b> With X–Z and Y–Z present but X,Y non-adjacent, switching c({X,Y,Z}) to 1 records the collider X → Z ← Y (Definition 40: triple = 1, pair {X,Y} = 0 ⇒ v-structure). This adds the big weight +3.", ops: [
        { op: "orient", from: "X", to: "Z", type: "directed" },
        { op: "orient", from: "Y", to: "Z", type: "directed" },
        { op: "highlightNodes", ids: ["X", "Z", "Y"], cls: "hl" },
        { op: "set", name: "Imset (active subsets)", items: ["{X,Y,Z}"] },
        { op: "score", text: "w·c = +4" },
        { op: "badge", text: "{X,Y,Z}=1 → +4 > +2 — accept", kind: "good" } ] },
      { caption: "<b>Accepted: a new best.</b> Imset is now ⟨0,1,1,1⟩ over {X,Y},{X,Z},{Y,Z},{X,Y,Z} with score w·c = −1 + 2 + 3 = +4 — higher than any vertex seen. This is exactly the collider's encoding; compare Fig. 184b's ⟨1,0,1,1⟩ for X → Y ← Z (the same pattern, relabelled to a centre node).", ops: [
        { op: "highlightEdges", edges: [["X", "Z"], ["Y", "Z"]], cls: "hl" },
        { op: "score", text: "w·c = +4 (best so far)" },
        { op: "badge", text: "imset ⟨0,1,1,1⟩", kind: "good" } ] },
      { caption: "<b>Try the remaining move — toggle {X,Y} on (add edge X–Y).</b> Its weight is +2, but adding X–Y also destroys the collider (X,Y would be adjacent), removing the +3 triple. Net change +2 − 3 = −1, so the score would fall to +3. This worsening move is <b>rejected</b>.", ops: [
        { op: "addEdge", from: "X", to: "Y", type: "undirected" },
        { op: "highlightEdges", edges: [["X", "Y"]], cls: "hl" },
        { op: "set", name: "Imset (active subsets)", items: ["{X,Y}"] },
        { op: "score", text: "w·c = +3" },
        { op: "badge", text: "{X,Y}=1 breaks collider → +3 < +4 — reject", kind: "bad" } ] },
      { caption: "<b>Local optimum reached.</b> Undo the rejected toggle. No remaining coordinate flip raises w · c above +4, so the imset ⟨0,1,1,1⟩ is a (locally) optimal vertex of the characteristic-imset polytope. The greedy walk stops here.", ops: [
        { op: "removeEdge", from: "X", to: "Y" },
        { op: "set", name: "Imset (active subsets)", items: ["{X,Z}", "{Y,Z}", "{X,Y,Z}"] },
        { op: "score", text: "w·c = +4 (no toggle improves)" },
        { op: "badge", text: "optimal imset found", kind: "good" } ] },
      { caption: "<b>Decode the imset back to a graph.</b> Read ⟨0,1,1,1⟩: pairs {X,Z}=1 and {Y,Z}=1 give edges X–Z, Y–Z (the skeleton); the triple {X,Y,Z}=1 with {X,Y}=0 gives the v-structure X → Z ← Y. Output the CPDAG. CIM solved structure learning as 'encode → optimise the linear score → decode', without ever moving between graphs directly.", ops: [
        { op: "highlightEdges", edges: [["X", "Z"], ["Y", "Z"]], cls: "hl" },
        { op: "badge", text: "decoded → CPDAG returned", kind: "good" } ] }
    ]
  },

  complexity: "The imset lives in dimension 2^|V| − |V| − 1, which grows exponentially with the number of variables — the representation is high-dimensional, so the method is practical mainly for modest |V| (or with a fixed skeleton, which restricts the search to a low-dimensional face, Theorem 39). The walk itself is cheap per step: because the score is linear, evaluating a move is just adding/subtracting the changed coordinates' weights (a dot-product update), and each move is one polytope-edge step (covered reversal, edge addition, or turn pair). Like GSP, it is a heuristic greedy local search — no guarantee of reaching the global optimum from a single start; restarts and the hybrid skeleton-first variant improve robustness and scale.",
  strengths: [
    "Each equivalence class is one unique vector (Theorem 38), so the search is I-equivalence-aware and never wastes effort on duplicate DAGs of the same class (Remark 21).",
    "The decomposable score becomes a linear objective w · c, turning structure learning into clean optimization over a polytope, with cheap incremental move evaluation.",
    "No Meek-rule bookkeeping or explicit CPDAG manipulation — orientation/skeleton information is read directly off coordinates (Definition 40, Fig. 184).",
    "Geometry is exploitable: the polytope's vertices are exactly the DAG classes and fixing a skeleton gives a face (Theorem 39), enabling the hybrid skeleton-greedy variant.",
    "Builds on GSP's locality: a greedy edge-walk that scales far better than enumerating classes."
  ],
  limitations: [
    "The imset dimension is exponential in |V| (2^|V| − |V| − 1 coordinates), so without restricting the skeleton the representation becomes unwieldy for many variables.",
    "Greedy walks can stop at a local optimum of the linear objective; quality depends on the start (mitigated by restarts and the hybrid/skeleton variants).",
    "Correctness relies on a decomposable, score-equivalent score (so the linearization holds) and on restricted-faithfulness-style conditions inherited from GSP.",
    "Translating between the imset and the actual CPDAG, and enforcing that toggles land on valid (DAG) imsets, adds machinery compared with operating directly in graph space."
  ],
  notes: "CIM (Linnusson et al.) is a hybrid/score-based method that searches in the imset representation rather than directly on CPDAGs — in spirit a GES-like search carried out over the characteristic-imset polytope (Remark 22). Its foundations: Definition 40 defines the characteristic imset; Theorem 38 makes it a unique representative of each I-equivalence class; the score-is-linear result (§4.60.2, Hemmecke et al.) makes learning a linear program over the polytope; Theorem 39 (Face property) shows fixing a skeleton gives a face; Fig. 185 (single covered-edge reversal) and Fig. 186 / Definition 42 (edge addition) describe local coordinate-toggle moves; Definition 41 + Theorem 40 (turn pairs) identify the polytope's edges. The paper lists variants — greedy CIM, hybrid skeleton greedy CIM, edge-pair greedy CIM (Algorithms 77 and 78). The animation uses the paper's own three-variable v-structure example (Fig. 184b, imset ⟨1,0,1,1⟩) with illustrative weights; it is faithful to the encode→optimise-linear-score→decode pipeline, with the specific numeric weights chosen for illustration.",
  figureRefs: "Paper §4.60 (pp.289–291): Definition 40 (characteristic imset c_G, a 0/1 function on subsets S⊆V with |S|≥2; length 2^|V|−|V|−1), Fig. 184 (reading CIM coordinates: (a) two variables {⟨0⟩,⟨1⟩}; (b) three variables, v-structure with imset ⟨1,0,1,1⟩ over {X,Y},{X,Z},{Y,Z},{X,Y,Z}), Theorem 38 (two DAGs I-equivalent ⇔ same CIM; CIM_V polytope whose vertices are the CIMs of DAGs), §4.60.2 (the decomposable score is an affine/linear function of the CIM — Hemmecke et al.), Theorem 39 (Face property: fixed skeleton ⇒ a face of CIM_V), Fig. 185 (CIM edits from a single covered-edge reversal X→Y ⇒ Y→X), Fig. 186 + Definition 42 (edge addition / edge pairs), Definition 41 + Theorem 40 (turn pairs = edges of CIM_V), Remark 21 (CIM is I-equivalence-aware), Remark 22 (in-spirit GES-like search in imset space; greedy CIM / hybrid skeleton greedy CIM / edge-pair greedy CIM, Algorithms 77–78). Built on GSP (§4.52)."
};
