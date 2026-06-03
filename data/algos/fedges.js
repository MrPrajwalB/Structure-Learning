/* FedGES — Federated Greedy Equivalence Search. Grounded in §4.65 (pp.308-311):
   Algorithm 86 (FedGES), Fig.200 (horizontal data partition across clients),
   Fig.201 (one communication round: broadcast → local GES → return → server fusion),
   Fig.202 + Example 94 (the sink-based common-ordering fusion on {A,B,C}, three client graphs).
   Authors: Torrijos, Gámez & Puerta (2025), ref [635]. Builds on GES (§4.12). */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["fedges"] = {
  name: "Federated Greedy Equivalence Search",
  oneLiner: "Runs GES across several clients (e.g. hospitals) that never share raw data: each round the server broadcasts the current global DAG, every client fuses it with its own graph and runs a budget-limited local GES on its private data, then the server fuses all returned client graphs into one acyclic global DAG using a sink-based ordering heuristic — repeating until convergence.",
  basedOnText: "FedGES is a federated, score-based method built on GES. It keeps each client's data on-device and communicates only learned structures; a structural-fusion heuristic merges the per-client graphs into a single global Bayesian network.",

  assumptions: [
    "<b>Horizontally partitioned data</b> — every client holds a private dataset over the <i>same</i> variables V but with <i>different</i> rows (data instances). The full table D is split row-wise across clients (Fig. 200).",
    "<b>Data never leaves the device</b> — only structures (learned DAGs / proposed edges) are transmitted; raw records stay local, preserving privacy.",
    "<b>A decomposable, score-equivalent score</b> for the local GES on each client — e.g. BDeu or BIC (same requirement as ordinary GES).",
    "<b>Faithfulness & causal sufficiency</b> per client, as inherited from GES — the local searches are standard GES runs on each client's data."
  ],
  input: "A set of k clients C = {C₁,…,C_k}, each with a private dataset D_i over shared variables V; a decomposable score for local GES; a per-round edge-addition budget B; and a stopping rule (max rounds or structural convergence).",
  output: "A single <b>global DAG</b> G over V, learned collaboratively without any client revealing its data.",

  idea: [
    "FedGES answers a practical question: how can several parties — say hospitals that each hold patient records over the same variables — jointly learn one Bayesian network <i>without</i> pooling their confidential data? The trick is <b>federated learning</b>: each client keeps its data private and only ever sends model updates — here, its locally learned graph structure — to a central server, which combines them into one global network.",
    "The method <b>marries GES with a client–server loop</b>. GES is the score-based search that, on a single dataset, greedily adds then removes edges over equivalence classes (CPDAGs). FedGES runs GES <i>locally</i> on each client and then has a server stitch the results together, round after round.",
    "<b>One round (Fig. 201).</b> (1) the server broadcasts the current global DAG G to all clients; (2) each client fuses G with its own previous local graph to get an initialisation, then runs a <i>constrained</i> local GES on its private data, allowed to introduce at most B new edges this round; (3) clients send their updated local graphs back; (4) the server <b>fuses</b> the k returned graphs into a new global G. The round repeats until convergence or a budget runs out.",
    "<b>The heart of the method is the structural-fusion heuristic.</b> Several client graphs will generally disagree about edge directions, so it is impossible to honour every client's orientation at once. Instead the server derives <i>one</i> workable variable ordering π using a simple <b>sink-based</b> rule, maps each client graph to the order, and unites them — giving an acyclic global DAG by construction.",
    "<b>Sink-based ordering.</b> To fill the order from the back, the server looks for the variable that is 'most often a sink' (few or no outgoing edges) across the received client graphs. A candidate sink S is accepted if any outgoing edge S→U can be flipped to U→S without creating a directed cycle; otherwise the next-best sink is tried. The accepted sink is placed last, removed with its edges, and the process repeats on the remaining variables. Each client graph is then re-oriented to obey π (its minimal π-consistent I-map), and the edgewise union of these order-consistent graphs is the fused DAG."
  ],

  steps: [
    "<b>Initialise (server).</b> Set the global DAG G ← G₀ (e.g. the empty graph, or a random graph) and broadcast G to all k clients.",
    "<b>Begin a communication round.</b> The server sends the current global G to every client.",
    "<b>Local fuse (each client, in parallel).</b> Client i fuses the received global G with its own previous local graph G_i to obtain a fresh initialisation G′_i.",
    "<b>Local GES (each client, in parallel).</b> Client i runs GES on its <i>private</i> data D_i, starting from G′_i, but is permitted to add at most B new edges this round. This yields an updated local graph G_i.",
    "<b>Return structures.</b> Each client sends only its updated graph G_i back to the server — no data is transmitted. The server now holds k client graphs.",
    "<b>Server fusion — choose a common order (sink-based).</b> Pick the variable most often a sink across the client graphs; accept it if its outgoing edges can be flipped without making a cycle, else try the next candidate. Place it last in π, delete it and its edges, and repeat to fill π from right to left.",
    "<b>Server fusion — re-orient & unite.</b> Map each client graph to its minimal π-consistent I-map (orient every edge from earlier to later in π, reversing edges that contradict π). Take the edgewise union of these graphs — acyclic by construction — as the new global DAG G.",
    "<b>Check the stopping rule.</b> If the structure has converged or the round/budget limit is reached, stop; otherwise broadcast the new G and repeat the round.",
    "<b>Return</b> the final global DAG G — learned collaboratively while every client's raw data stayed on its own device."
  ],

  keyConcepts: [
    { term: "Federated learning", def: "A setting where multiple clients each keep their own data private and share only model updates with a central server, which combines them. Here the 'updates' are learned graph structures (or proposed edges), never raw records." },
    { term: "Horizontal partition", def: "The data is split by rows: every client has the same variables V but different instances (Fig. 200). FedGES targets exactly this case." },
    { term: "Communication round", def: "One broadcast-learn-return-fuse cycle (Fig. 201): server sends G → clients run local GES on D_i → clients return G_i → server fuses into a new global G. Rounds repeat until convergence." },
    { term: "Local GES with budget B", def: "Each client runs ordinary GES on its private data, but capped at B new edge additions per round, so changes are introduced gradually and the global structure is built up across rounds." },
    { term: "Structural fusion", def: "The server's heuristic for merging k disagreeing client graphs into one acyclic DAG without seeing data — by imposing a single variable ordering and uniting order-consistent graphs." },
    { term: "Sink-based ordering", def: "To build the common order π, repeatedly pick the variable that is 'most often a sink' across client graphs; accept it if its outgoing edges can be flipped without a cycle, place it last, remove it, and repeat (Fig. 202a, Example 94)." },
    { term: "π-consistent I-map / union", def: "Each client graph is re-oriented so all edges go earlier→later in π; because they all respect the same order, their edgewise union is automatically acyclic and serves as the fused global DAG (Fig. 202c,d)." }
  ],

  animation: {
    title: "FedGES on the paper's worked example (Example 94, Fig. 201–202): 3 clients learn local graphs over {A,B,C} on their private data, send structures to the server, and the server fuses them via the sink-based ordering π = A ≺ B ≺ C.",
    nodes: [
      { id: "A", x: 0.20, y: 0.18 },
      { id: "B", x: 0.80, y: 0.18 },
      { id: "C", x: 0.50, y: 0.86 }
    ],
    edges: [],
    steps: [
      { caption: "<b>Setup (server).</b> Three clients C₁, C₂, C₃ (e.g. three hospitals) each hold private rows over the same variables {A,B,C}. The server initialises the global DAG G to the empty graph and broadcasts it. No raw data ever leaves a client.", ops: [{ op: "badge", text: "round 1 — broadcast G", kind: "info" }, { op: "set", name: "Client proposals", items: ["C₁: —", "C₂: —", "C₃: —"] }] },
      { caption: "<b>Client C₁ runs local GES (forward) on its private data D₁.</b> Within its budget it proposes the edges A→B and B→C (so C is a sink with no outgoing edge). It will send only this structure — not the data.", ops: [{ op: "badge", text: "client C₁ — local GES", kind: "info" }, { op: "addEdge", from: "A", to: "B", type: "directed" }, { op: "addEdge", from: "B", to: "C", type: "directed" }, { op: "highlightNodes", ids: ["A", "B", "C"], cls: "hl" }, { op: "score", text: "local score D₁: +0.0021" }, { op: "set", name: "Client proposals", items: ["C₁: A→B, B→C", "C₂: —", "C₃: —"] }] },
      { caption: "<b>Client C₂ runs local GES on its private data D₂.</b> Its data favours A→C and C→B — note C here has an <i>outgoing</i> edge C→B, so the clients already disagree about directions.", ops: [{ op: "badge", text: "client C₂ — local GES", kind: "info" }, { op: "removeEdge", from: "A", to: "B" }, { op: "removeEdge", from: "B", to: "C" }, { op: "addEdge", from: "A", to: "C", type: "directed" }, { op: "addEdge", from: "C", to: "B", type: "directed" }, { op: "highlightNodes", ids: ["A", "C", "B"], cls: "hl" }, { op: "score", text: "local score D₂: +0.0018" }, { op: "set", name: "Client proposals", items: ["C₁: A→B, B→C", "C₂: A→C, C→B", "C₃: —"] }] },
      { caption: "<b>Client C₃ runs local GES on its private data D₃.</b> Its score peaks at A→B with an <i>undirected</i> B–C (a one-edge equivalence class it cannot orient). Each client returns only its graph G_i to the server.", ops: [{ op: "badge", text: "client C₃ — local GES", kind: "info" }, { op: "removeEdge", from: "A", to: "C" }, { op: "removeEdge", from: "C", to: "B" }, { op: "addEdge", from: "A", to: "B", type: "directed" }, { op: "addEdge", from: "B", to: "C", type: "undirected" }, { op: "highlightNodes", ids: ["A", "B", "C"], cls: "hl" }, { op: "score", text: "local score D₃: +0.0015" }, { op: "set", name: "Client proposals", items: ["C₁: A→B, B→C", "C₂: A→C, C→B", "C₃: A→B, B–C"] }] },
      { caption: "<b>Server collects 3 graphs.</b> The server now holds G₁, G₂, G₃ — and only these structures, never the data. It must fuse them into one acyclic global DAG, starting by choosing a common variable ordering π via the sink rule.", ops: [{ op: "badge", text: "aggregate — k=3 graphs received", kind: "good" }, { op: "removeEdge", from: "A", to: "B" }, { op: "removeEdge", from: "B", to: "C" }, { op: "set", name: "Sink ordering π", items: ["π = ( _ , _ , _ )"] }] },
      { caption: "<b>Fusion step 1 — pick the last (sink).</b> C is most often a sink: a sink in G₂'s opposite? No — C is a sink in G₁ and G₃ but in G₂ it has the outgoing edge C→B. Reversing C→B to B→C creates no cycle, so C is accepted as the global sink (placed last).", ops: [{ op: "badge", text: "aggregate — C is the global sink", kind: "info" }, { op: "highlightNodes", ids: ["C"], cls: "hl" }, { op: "set", name: "Sink ordering π", items: ["π = ( _ , _ , C )", "C accepted: flip C→B ⇒ B→C, no cycle"] }] },
      { caption: "<b>Fusion step 2 — remove C, find the next sink.</b> With C and its edges deleted from all client graphs (Fig. 202b), B is now clearly the sink among the remaining variables. Place B second-to-last.", ops: [{ op: "badge", text: "aggregate — next sink B", kind: "info" }, { op: "highlightNodes", ids: ["B"], cls: "hl" }, { op: "set", name: "Sink ordering π", items: ["π = ( _ , B , C )", "B is the sink after removing C"] }] },
      { caption: "<b>Fusion step 3 — A is first.</b> Removing B leaves A as the final sink, i.e. the first variable in the order. The common ordering is fixed: π = A ≺ B ≺ C.", ops: [{ op: "badge", text: "aggregate — order fixed", kind: "good" }, { op: "highlightNodes", ids: ["A"], cls: "hl" }, { op: "set", name: "Sink ordering π", items: ["π = ( A , B , C )", "A ≺ B ≺ C"] }] },
      { caption: "<b>Re-orient each client graph to π.</b> Every edge is oriented earlier→later in π. C₁ is already consistent; in C₂ the edge C→B is reversed to B→C (and A→C kept); in C₃ the undirected B–C is oriented B→C. All three now respect A ≺ B ≺ C.", ops: [{ op: "badge", text: "aggregate — π-consistent I-maps", kind: "info" }, { op: "set", name: "π-adapted graphs", items: ["G₁: A→B, B→C", "G₂: A→C, B→C", "G₃: A→B, B→C"] }] },
      { caption: "<b>Server fuses by union.</b> Take the edgewise union of the π-adapted graphs: A→B (C₁,C₃), B→C (all), A→C (C₂). Because every edge goes forward in π, the union is acyclic by construction — the new global DAG.", ops: [{ op: "badge", text: "aggregate — union of π-maps", kind: "good" }, { op: "addEdge", from: "A", to: "B", type: "directed" }, { op: "addEdge", from: "B", to: "C", type: "directed" }, { op: "addEdge", from: "A", to: "C", type: "directed" }, { op: "highlightEdges", edges: [["A", "B"], ["B", "C"], ["A", "C"]], cls: "add" }] },
      { caption: "<b>Next round (backward pruning).</b> The new global G is broadcast again; clients re-run budget-limited local GES, whose backward phase finds A→C is redundant (A reaches C through B). They return the trimmed graph and the server's fusion drops A→C.", ops: [{ op: "badge", text: "round 2 — backward deletions aggregated", kind: "info" }, { op: "removeEdge", from: "A", to: "C" }, { op: "highlightEdges", edges: [["A", "C"]], cls: "dim" }, { op: "score", text: "delete A→C improves combined score" }, { op: "set", name: "Client proposals", items: ["C₁: drop A→C", "C₂: keep", "C₃: drop A→C"] }] },
      { caption: "<b>Consensus reached.</b> The structure no longer changes between rounds, so FedGES stops and returns the global DAG A→B→C. It was learned jointly by all three clients while every dataset D₁, D₂, D₃ stayed private — only structures were ever exchanged.", ops: [{ op: "badge", text: "converged — no raw data shared", kind: "good" }, { op: "highlightEdges", edges: [["A", "B"], ["B", "C"]], cls: "add" }, { op: "clearSet", name: "Client proposals" }, { op: "clearSet", name: "π-adapted graphs" }] }
    ]
  },

  complexity: "Each round runs k local GES searches in parallel (each a standard, decomposable-score GES on D_i, capped at B new edges) plus one server fusion. The sink-based fusion is cheap: it makes a single pass over the variables, at each step counting sinks and checking flip-induced cycles across the k client graphs. Communication per round is only O(k) graphs (structures, not data), and the number of rounds is bounded by the stopping rule (max rounds or structural convergence).",
  strengths: [
    "Preserves privacy: raw data never leaves any client — only learned structures (or partial structures) are communicated.",
    "Reuses GES unchanged on each client, inheriting its score-based, equivalence-class search.",
    "The fusion always yields an acyclic global DAG by construction (union of order-consistent I-maps), so the result is a valid Bayesian-network structure.",
    "Low communication: a handful of graphs per round, not datasets; the per-round edge budget B keeps changes gradual and controllable."
  ],
  limitations: [
    "The fusion does not honour every client's edge orientations — it imposes one workable order π, so a client's preferred direction may be reversed.",
    "Quality depends on the sink-based heuristic and on the per-round budget B; greedy local GES on each client can still settle on suboptimal local structures.",
    "Assumes horizontally partitioned data over a shared variable set; it does not cover vertically partitioned (different-variable) clients.",
    "Inherits GES's needs: a decomposable, score-equivalent score, faithfulness and causal sufficiency on each client's data."
  ],
  notes: "Related federated structure-learning work (§4.65.2): Mian et al.'s RFCD wraps a score-based learner, with clients returning only a scalar 'regret' and the server running a min-max-regret beam search; Guo et al.'s FedACD masks edges from low-quality variable subspaces and aggregates the rest by a relaxed voting rule with probabilistic guarantees; Yu et al.'s FedLCS is a target-centric, three-stage method that votes on skeleton edges and separation sets, then orients v-structures locally. All keep raw data on-device.",
  figureRefs: "Paper §4.65 (pp.308–311): Algorithm 86 (FedGES: broadcast → local fuse → budget-limited local GES → return → server fusion loop), Fig. 200 (horizontal data partition across clients), Fig. 201 (one communication round), Fig. 202 + Example 94 (sink-based common ordering π = A ≺ B ≺ C and the union fusion on three client graphs). Recall 83 (GES) and Recall 84 (federated learning). Authors: Torrijos, Gámez & Puerta (2025), ref [635]."
};
