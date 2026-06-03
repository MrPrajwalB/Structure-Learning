/* PrivacyK2 (PPK2 — Privacy-Preserving K2). Grounded in §4.18 (pp.111-117):
   Algorithm 24 (PrivacyK2, two parties, vertical partition, p.113); the additively
   shared-counts / scalar-product-sharing scoring (pp.111-112); Example 27 (count by
   secret sharing, p.112) and Example 28 (private scalar product via Paillier, pp.113-114).
   Original method: Zhiqiang Yang & R. N. Wright, 2006, "Privacy-Preserving Computation of
   Bayesian Networks on Vertically Partitioned Data" (cite [745]). */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["privacyk2"] = {
  name: "PrivacyK2 (Privacy-Preserving K2)",
  oneLiner: "Run K2's ordered greedy parent search across data that is split among several parties who must not reveal their records: the frequency counts the K2 score needs are computed by a secure protocol (masked secure sum / encrypted scalar product), so every score is evaluated without anyone seeing another party's raw data.",
  basedOnText: "PrivacyK2 (originally PPK2) keeps K2's exact search — a fixed variable order and greedy parent addition — but replaces the one operation that touches the data, counting parent–child configurations, with a cryptographic subprotocol so the final DAG can be learned collaboratively while each party's records stay private.",

  assumptions: [
    "<b>Partitioned data, aligned records</b> — the parties hold a shared population (the same rows, e.g. linked by a common key), but each party owns a <i>disjoint subset of the variables</i> (vertical partition). Conceptually they could be glued into one union table 𝒟, which no one is allowed to materialise.",
    "<b>Semi-honest (honest-but-curious) parties</b> — everyone follows the prescribed protocol correctly, but may try to deduce extra information from the messages they receive.",
    "<b>Known variable ordering + Dirichlet/K2 score</b> — exactly as in plain K2: a topological order is given and the local family score is the Bayesian (K2) marginal likelihood, here written in the log domain so it is built only from counts.",
    "<b>No trusted third party</b> — there is no central server with access to 𝒟; only the final DAG (and the variable order, treated as public) may be revealed."
  ],
  input: "A dataset vertically split across parties (e.g. Alice holds variables V_A, Bob holds V_B, with V_A ∩ V_B = ∅ over the same rows), a fixed variable ordering, a parent bound d, and a secure-computation primitive (secure sum / scalar-product sharing / homomorphic encryption).",
  output: "A <b>single shared DAG</b> over all variables V, consistent with the given order — each node with its chosen parent set. No raw records, and no intermediate counts or scores, are revealed to any party along the way.",

  idea: [
    "Plain K2 only ever looks at the data through one window: to score a candidate parent set for a node it needs <b>frequency counts</b> N[xᵢ, paₓ] — how many records show a given child value together with a given parent configuration. PrivacyK2's whole insight is that <i>if you can get those counts privately, the rest of K2 runs unchanged.</i>",
    "When variables are split between parties, a count is a quantity neither party can compute alone: deciding whether a row matches a configuration may need columns from both Alice and Bob. Each party can only build a local <b>compatibility vector</b> (a 0/1 indicator over rows for the part of the configuration it can check); the true count is the number of rows where <i>all</i> parties' indicators are 1 — a dot product across parties.",
    "That dot product is computed with a cryptographic subprotocol so the answer comes out <b>additively secret-shared</b>: Alice ends with a random-looking share, Bob with another, and only their sum equals the real count (mod a large modulus). A single share reveals nothing because it could correspond to any value. Equivalently, parties each add a random mask to their local contribution and the masks cancel only in the total, so the secure sum exposes the global count but never an individual party's part.",
    "K2's log-score is a sum of terms, each a function of one count (via Stirling's log-factorial surrogate, which keeps everything in counts). Parties evaluate it locally on their shares and add a public, data-independent term that depends only on the variable arities — so the family score itself ends up secret-shared.",
    "When the greedy search must <b>compare candidate scores</b> (the argmax over possible parents) the parties run a small secure two-party comparison that returns only the <i>winner</i> — which candidate is largest — not the scores themselves. The winning edge is recorded, and search continues. The result is ordinary K2's DAG, learned with nothing leaked beyond the final structure."
  ],

  steps: [
    "<b>Align and initialise.</b> Parties agree on the shared row population and the public variable order; start from the empty DAG G₀ over all variables V. Fix the parent bound d. No data is exchanged.",
    "<b>Take the next node Xᵢ</b> in the order. Its candidate parents are the variables that come before it. Begin with Paₓ = ∅.",
    "<b>Build local compatibility vectors.</b> For a candidate parent configuration, each party forms a 0/1 indicator over the shared rows for the part of the configuration involving <i>its own</i> variables (rows where its columns match the required values).",
    "<b>Securely obtain the count.</b> The parties run the secure subprotocol (masked secure sum / scalar-product sharing / homomorphic encryption) so that the global count N[xᵢ, paₓ] — the number of rows where all parties' indicators agree — comes out as <b>additive shares</b>: each party gets a random-looking piece whose sum is the count. No party sees the count or another party's records.",
    "<b>Add the public arity term.</b> A known term that depends only on the variable arities and the number of configurations (independent of any data count) is folded in publicly, requiring no secure computation. Zero cells are smoothed to 1 only to avoid log 0.",
    "<b>Form shares of the K2 family score.</b> Each count-dependent term of K2's log-score is computed from the shares (using the log-factorial / Stirling surrogate, which keeps every term a function of a single count); parties locally add their shares to get a share of the candidate's local score gₐ(Paₓ).",
    "<b>Securely pick the best parent.</b> Across all eligible candidate parents (subject to the bound d), parties run a secure comparison (argmax) that reveals only <i>which</i> candidate scores highest — not the score values.",
    "<b>Add the edge if it helps.</b> If the winning candidate is an improvement, record the directed edge Z → Xᵢ, add Z to Paₓ, and repeat the parent search for Xᵢ. Otherwise stop for this node.",
    "<b>Stop for Xᵢ</b> when no candidate improves the score or |Paₓ| reaches d; the current parent set is final.",
    "<b>Move on</b> to the next node in the order and repeat. Throughout, only winners (not raw counts or scores) are ever revealed.",
    "<b>Return the shared DAG</b> — the same network plain K2 would have learned on the union table 𝒟, but with no raw data, counts, or intermediate scores disclosed to any party."
  ],

  keyConcepts: [
    { term: "Vertical partition", def: "Each party owns a disjoint set of variables (columns) over the same shared records (rows). The conceptual union table 𝒟 exists only in principle and is never assembled." },
    { term: "Compatibility vector", def: "A party's local 0/1 indicator over the shared rows, marking which rows match the part of a candidate configuration that its own columns can check. The true count is where all parties' vectors agree." },
    { term: "Secure sum / secret-shared count", def: "A protocol that returns a count as additive shares (xₐ for Alice, x_B for Bob, with xₐ + x_B = count mod M). Equivalently each party masks its contribution with a random value that cancels only in the total — so only the global count is ever recoverable, never an individual part." },
    { term: "Scalar-product / homomorphic computation", def: "The cross-party count is a dot product of compatibility vectors. It is computed via scalar-product-sharing or homomorphic encryption (e.g. Paillier), so a party can combine encrypted contributions without decrypting another party's data." },
    { term: "Shared K2 score", def: "K2's log family-score is a sum of single-count terms (via a Stirling log-factorial surrogate). Computed on the secret shares plus a public arity-only term, the score itself ends up secret-shared." },
    { term: "Secure comparison (argmax)", def: "A small two-party computation used for the greedy parent choice: it reveals only which candidate is largest (the winning edge), not the underlying score values." },
    { term: "Semi-honest model", def: "Parties follow the protocol honestly but are curious — they may try to infer extra information from the messages. Security guarantees that the transcript leaks nothing beyond the final DAG." }
  ],

  animation: {
    title: "PrivacyK2 over a vertically partitioned table: Alice (A) and Bob (B) jointly learn the DAG on {X₁,X₂,X₃} without sharing rows. Faithful small example in the paper's spirit (Alg. 24).",
    nodes: [
      { id: "X1", x: 0.18, y: 0.22 },
      { id: "X2", x: 0.78, y: 0.22 },
      { id: "X3", x: 0.48, y: 0.82 },
      { id: "Alice", x: 0.10, y: 0.55 },
      { id: "Bob", x: 0.90, y: 0.55 }
    ],
    edges: [],
    steps: [
      { caption: "<b>Setup:</b> the table is split <i>vertically</i> — Alice owns variable X₁, Bob owns X₂ and X₃, over the <i>same</i> shared rows. The conceptual union table 𝒟 is never built. Public order is X₁ ≺ X₂ ≺ X₃; start from the empty DAG.", ops: [{ op: "highlightNodes", ids: ["Alice", "Bob"], cls: "hl" }, { op: "set", name: "Order", items: ["X₁", "X₂", "X₃"] }, { op: "set", name: "Alice holds", items: ["X₁"] }, { op: "set", name: "Bob holds", items: ["X₂", "X₃"] }, { op: "badge", text: "empty DAG · no data shared", kind: "info" }] },
      { caption: "<b>Node X₁ — first in order:</b> it has no predecessors, so no candidate parents. Nothing to add ⇒ Pa(X₁) = ∅. No secure computation needed.", ops: [{ op: "highlightNodes", ids: ["X1"], cls: "add" }, { op: "set", name: "Parents(X₁)", items: ["∅"] }, { op: "badge", text: "Pa(X₁) = ∅", kind: "good" }] },
      { caption: "<b>Node X₂ — candidate parent X₁:</b> to score X₁ → X₂ K2 needs the count N[X₂=x, X₁=v]. But X₁ is Alice's and X₂ is Bob's — neither can compute it alone. Each builds a local <b>compatibility vector</b> over the shared rows.", ops: [{ op: "highlightNodes", ids: ["X2", "X1"], cls: "hl" }, { op: "set", name: "Alice mask", items: ["compat_A(X₁=v) ⊕ random"] }, { op: "set", name: "Bob mask", items: ["compat_B(X₂=x) ⊕ random"] }] },
      { caption: "<b>Secure sum:</b> Alice and Bob each add a random mask to their local count, exchange only the masked values, and sum them. The masks cancel only in the total, so they recover the <i>global</i> count N[X₂,X₁] — and never each other's individual numbers.", ops: [{ op: "highlightEdges", edges: [["Alice", "Bob"]], cls: "hl" }, { op: "badge", text: "masks cancel → only the total count is revealed", kind: "info" }] },
      { caption: "<b>Score X₁ → X₂ (securely):</b> from the shared count the parties form shares of K2's log family-score, add the public arity-only term, and combine. The candidate's score gₐ(X₂) is computed <i>without revealing any raw count</i>.", ops: [{ op: "score", text: "g(X₁→X₂) built from secret-shared count + public arity term" }, { op: "badge", text: "secure", kind: "good" }] },
      { caption: "<b>Secure comparison:</b> a small two-party comparison checks whether X₁ → X₂ beats the no-parent score, revealing only the <i>winner</i>. Here it helps, so the edge is accepted.", ops: [{ op: "addEdge", from: "X1", to: "X2", type: "directed" }, { op: "set", name: "Parents(X₂)", items: ["X₁"] }, { op: "badge", text: "argmax reveals only the winner", kind: "good" }] },
      { caption: "<b>Node X₃ — candidates {X₁, X₂}:</b> Bob owns X₃, but a candidate parent (X₁) is Alice's, so scoring X₁ → X₃ again needs a cross-party count. Build compatibility vectors and mask them.", ops: [{ op: "highlightNodes", ids: ["X3", "X1"], cls: "hl" }, { op: "set", name: "Alice mask", items: ["compat_A(X₁=v) ⊕ random"] }, { op: "set", name: "Bob mask", items: ["compat_B(X₃=x) ⊕ random"] }] },
      { caption: "<b>Secure sum again:</b> masked counts are summed so only the global N[X₃, X₁] is recovered. K2's score for the candidate X₁ → X₃ is formed from the shares — still nothing private leaks.", ops: [{ op: "highlightEdges", edges: [["Alice", "Bob"]], cls: "hl" }, { op: "score", text: "g(X₁→X₃) from secret-shared count" }, { op: "badge", text: "secure", kind: "good" }] },
      { caption: "<b>Candidate X₂ → X₃ is local to Bob:</b> both X₂ and X₃ are Bob's, so he can compute that count alone — no protocol needed. The parties securely compare X₁→X₃ vs X₂→X₃ and pick the best.", ops: [{ op: "clearSet", name: "Alice mask" }, { op: "clearSet", name: "Bob mask" }, { op: "score", text: "argmax{ g(X₁→X₃), g(X₂→X₃) } — only the winner revealed" }] },
      { caption: "<b>Add best parent X₂ → X₃:</b> the winning candidate improves the score, so commit the edge and update X₃'s parent set.", ops: [{ op: "addEdge", from: "X2", to: "X3", type: "directed" }, { op: "set", name: "Parents(X₃)", items: ["X₂"] }, { op: "badge", text: "edge accepted (winner only)", kind: "good" }] },
      { caption: "<b>Try a second parent for X₃:</b> adding X₁ on top of {X₂} is scored securely but gives no further gain (and respects the bound d), so stop. Final Pa(X₃) = {X₂}.", ops: [{ op: "score", text: "g(X₁→X₃ | X₂): no improvement ⇒ stop" }, { op: "badge", text: "Pa(X₃) = {X₂}", kind: "good" }] },
      { caption: "<b>Final shared DAG:</b> X₁ → X₂ and X₂ → X₃ — the same network plain K2 would have found on the union table, learned jointly while Alice's and Bob's raw rows, counts, and scores stayed private throughout.", ops: [{ op: "highlightEdges", edges: [["X1", "X2"], ["X2", "X3"]], cls: "hl" }, { op: "clearSet", name: "Alice mask" }, { op: "clearSet", name: "Bob mask" }, { op: "badge", text: "DAG returned · no raw data revealed", kind: "good" }] }
    ]
  },

  complexity: "Same search shape as K2 — roughly O(n² · d) candidate scorings under a fixed order — but each score now carries the overhead of one or more secure subprotocols (a masked secure sum / encrypted scalar product per cross-party count, plus a secure comparison per greedy choice). Cost grows with the number of records, the candidate parent configurations, and the cryptographic primitive used (homomorphic encryption is heavier than additive secret sharing).",
  strengths: [
    "Learns exactly K2's DAG on the joint data while no party reveals raw records, intermediate counts, or scores.",
    "Modular: only the counting step changes, so K2's order-driven greedy search and decomposable Bayesian score are reused unchanged.",
    "Provably leaks nothing beyond the final DAG under the semi-honest model and standard security of the subprotocols."
  ],
  limitations: [
    "Inherits K2's weaknesses: needs a good variable order, is greedy (local optima), and assumes discrete data with Dirichlet/K2 priors.",
    "Security holds for semi-honest parties; malicious deviation from the protocol is not covered.",
    "Cryptographic overhead (secure sums / homomorphic operations per candidate) makes it far slower than plain K2, and revealing the final DAG can itself be a mild information leak."
  ],
  notes: "The original method is PPK2 by Zhiqiang Yang and R. N. Wright (2006), 'Privacy-Preserving Computation of Bayesian Networks on Vertically Partitioned Data'. The paper's Algorithm 24 states the two-party vertical-partition version; the same idea extends to a secure-sum aggregator over many parties for horizontally partitioned data (counts add across parties). Related privacy lines also use differential privacy or federated learning across clients.",
  figureRefs: "Paper §4.18 (pp.111-117): Algorithm 24 (PrivacyK2, two parties, vertical partition, p.113); additively shared-counts / scalar-product-sharing scoring (pp.111-112); Example 27 (count by secret sharing, p.112); Example 28 (private scalar product via Paillier, pp.113-114). Original work: Yang & Wright 2006 [745]."
};
