/* PartitionMCMC — Partition MCMC. Grounded in §4.40 (pp.197-200):
   the algorithm samples a Markov chain over ORDERED PARTITIONS of the nodes
   into layers (Λ = [B₁,…,Bₘ], block sizes [k₁,…,kₘ] summing to n); building an
   ordered partition by peeling a DAG by its roots (Fig.121); the split-merge
   proposal kernel and neighbourhood size |N_Λ| (Fig.122); the MH acceptance
   α = min(1, (|N_Λ|/|N_Λ'|)·P(Λ'|D)/P(Λ|D)) (p.198); partition score as a
   product-of-sums marginalising consistent DAGs (Eq.37, p.198); DAG sampling
   via the partition-conditional P(G|Λ,D) and Rao-Blackwellised feature
   estimates (Eq.38–39, pp.199-200); Example 56, three-node {M,C,D}, Λ₀=[1,1,1]
   merge→Λ₁=[1,2], α=min(1, 48.34/38.56 ×10⁻¹¹)=1 ACCEPT, P(C→D|D) averaged
   (Fig.123-125, p.200). Reference: Kuipers & Moffa [349]. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["partitionmcmc"] = {
  name: "Partition MCMC",
  oneLiner: "Run a Markov chain not over DAGs (like MC³) and not over orders (like Order-MCMC), but over ORDERED PARTITIONS of the variables into layers: propose to split or merge layers, accept by Metropolis-Hastings on the partition score, and sample DAGs consistent with each visited partition — which removes Order-MCMC's posterior bias while keeping its fast mixing.",
  basedOnText: "Partition MCMC (Kuipers &amp; Moffa) is a score-based Bayesian sampler that sits between MC³ and Order-MCMC. MC³ samples DAGs but mixes slowly; Order-MCMC samples orders and mixes well but distorts the posterior because many orders are consistent with one DAG. Partition MCMC samples a labelled <i>ordered partition</i> of the nodes — a state space whose mapping to DAGs is well-behaved, so it both mixes fast and targets the correct posterior.",

  assumptions: [
    "<b>Decomposable family score</b> — the DAG score factorises into per-node family scores FamScore(X, Pa_X | D), so the evidence for a whole partition can be written as a product over nodes of sums over admissible parent sets.",
    "<b>An ordered partition restricts parents</b> — the nodes are split into ordered layers Λ = [B₁, B₂, …, Bₘ]; a node in layer Bᵢ may take parents only from <i>earlier</i> layers, and must have at least one parent in the immediately preceding layer (so that layer is genuinely 'earlier'). Nodes in the same layer are unordered and cannot be connected to each other.",
    "<b>Every DAG peels to one ordered partition</b> — repeatedly removing the current roots (source nodes) of a DAG and grouping the roots exposed at each stage yields a unique ordered partition (Fig. 121). This DAG→partition map is what makes the posterior unbiased.",
    "<b>Exact vs. approximate evidence</b> — with the closed-form Bayesian family evidence Φ_B (discrete–Dirichlet / Gaussian) the partition posterior is exact; using Φ_BIC or Φ_L gives an approximation.",
    "<b>Enough run length</b> — the chain is run past a burn-in so it forgets its starting partition and explores the high-posterior region."
  ],
  input: "A dataset D over variables V, a decomposable family-score Φ⋆, an optional cap on parent-set size, a prior over partitions, a burn-in length and a total number of iterations T.",
  output: "A collection of sampled ordered partitions Λ⁽¹⁾, …, Λ⁽ᵀ⁾ (and, when concrete graphs are wanted, DAGs drawn consistent with them) used to estimate posterior structural features — e.g. edge probabilities — by Bayesian model averaging, either by sampling DAGs or by exact Rao-Blackwellised averaging over partitions.",

  idea: [
    "The choice of state space decides both how fast a sampler mixes and whether it targets the right posterior. <b>MC³</b> samples DAGs directly: correct target, but the DAG landscape is rugged so it mixes slowly. <b>Order-MCMC</b> samples variable orders: it mixes far better, but it is <i>biased</i> — a single DAG is consistent with many orders, so summing over orders silently over-counts certain DAGs and warps the posterior.",
    "Partition MCMC fixes the bias by choosing a smarter middle state: an <b>ordered partition</b> of the nodes into layers, Λ = [B₁, …, Bₘ]. Think of it as an order in which ties are allowed — instead of a strict ranking of single variables, you group variables into ordered <i>layers</i>. Block sizes [k₁, …, kₘ] sum to the number of variables n.",
    "The key is how DAGs relate to partitions. <b>Peel a DAG by its roots:</b> the source nodes (no incoming edges) form the first layer; remove them and the newly exposed sources form the next layer; repeat. Every DAG yields exactly <i>one</i> ordered partition this way (Fig. 121). Conversely a partition stands for the set of DAGs that obey two rules: nodes in the same layer cannot be connected, and every node beyond the first layer has at least one parent in the immediately preceding layer. Because each DAG maps to a single partition, summing over partitions does <b>not</b> over-count DAGs — so the posterior is unbiased, unlike Order-MCMC.",
    "Scoring a partition is cheap and smooth, exactly like an order score: because the family score is decomposable, the evidence for a partition is a <b>product over nodes of the sum of that node's admissible parent-set scores</b> (parents drawn from earlier layers, respecting the 'one parent in the previous layer' rule). One number summarises a whole family of DAGs.",
    "The chain moves by a simple <b>split–merge</b> proposal: either <i>split</i> a layer (peel off a nonempty subset of its nodes into a new layer just before it) or <i>merge</i> two adjacent layers into one. Candidates are drawn uniformly from the neighbourhood N_Λ of all valid splits and adjacent merges, and the move is accepted by the Metropolis-Hastings rule on the partition scores — including a neighbourhood-size correction because different partitions have different numbers of neighbours.",
    "After the chain mixes, you do <b>Bayesian model averaging</b>. You can draw one or more DAGs consistent with each visited partition (each node picks an allowed parent set with probability proportional to its family score) and count features; or, more efficiently, average features <i>exactly</i> over the visited partitions (Rao-Blackwellisation), avoiding the noise of sampling DAGs at all."
  ],

  steps: [
    "<b>Pre-compute family scores.</b> For every node X and every admissible parent set U, compute and cache the family evidence Φ⋆(X, U | D). These caches make every later partition score fast (engineering detail; omitted from the worked scoring below).",
    "<b>Initialise.</b> Pick a starting ordered partition Λ⁽⁰⁾ (e.g. all nodes in one block, or one node per layer) and score it.",
    "<b>Score the partition (product-of-sums).</b> For each node, sum Φ⋆(X, U | D) over the parent sets U allowed by the partition — U drawn from earlier layers with at least one parent in the immediately preceding layer — then multiply these sums across nodes. This single number P(Λ | D) marginalises over every DAG consistent with Λ.",
    "<b>Build the split–merge neighbourhood.</b> Enumerate N_Λ: every valid <i>split</i> of a block (move a nonempty proper subset of a block into a new layer immediately before it) and every <i>merge</i> of two adjacent blocks into one. Its size is |N_Λ| = (m − 1) adjacent merges plus the count of all nontrivial subset-splits of each block.",
    "<b>Propose a move.</b> Draw a candidate partition Λ′ uniformly from N_Λ (so q(Λ → Λ′) = 1/|N_Λ|).",
    "<b>Re-score the candidate.</b> Compute P(Λ′ | D) the same product-of-sums way; only nodes whose set of allowed earlier-layer parents changed need re-summing.",
    "<b>Metropolis-Hastings accept/reject.</b> α = min(1, (|N_Λ| / |N_Λ′|) · P(Λ′ | D) / P(Λ | D)). The first ratio is the neighbourhood-size (proposal) correction; the second is the partition-score ratio. With probability α move to Λ′; otherwise stay at Λ (and record it again). Worse partitions are sometimes accepted — this drives exploration.",
    "<b>Repeat</b> the split/merge–score–accept loop for T iterations, discarding an initial burn-in.",
    "<b>Sample DAGs per partition (optional).</b> For each retained partition, draw DAGs: each node independently picks an admissible parent set (from earlier layers, ≥1 parent in the previous layer) with probability proportional to its family score, then orient accordingly. Use these for concrete graphs / MAP candidates.",
    "<b>Average (model averaging).</b> Estimate a feature's posterior probability — e.g. P(edge | D) — either by counting over the sampled DAGs, or, more efficiently and with no extra noise, by exactly averaging the partition-conditional feature probability over the visited partitions (Rao-Blackwellisation). Both estimators correctly account for the partition conditioning and give the <i>unbiased</i> posterior."
  ],

  keyConcepts: [
    { term: "Ordered partition Λ = [B₁,…,Bₘ]", def: "The state of the chain: the variables split into ordered layers (blocks). Block sizes [k₁,…,kₘ] sum to n. Like an order that allows ties — variables grouped into ranked layers rather than ranked one-by-one." },
    { term: "Layer (block) restrictions", def: "Nodes in the same layer are unordered and cannot be connected to each other; a node beyond the first layer may take parents only from earlier layers and must have at least one parent in the immediately preceding layer." },
    { term: "Peeling a DAG by its roots", def: "Repeatedly remove the current source nodes and group the roots exposed at each stage. This maps every DAG to exactly one ordered partition (Fig. 121) — the property that makes the posterior unbiased." },
    { term: "Partition score", def: "P(Λ | D) ∝ P(Λ) · product over nodes of the sum of admissible family scores Φ⋆. It marginalises exactly over all DAGs consistent with Λ; one number scores a whole family of DAGs (Eq. 37)." },
    { term: "Split–merge proposal", def: "A new partition is proposed by either splitting a block (peel a subset into a new layer just before it) or merging two adjacent blocks (Fig. 122). Drawn uniformly from the neighbourhood N_Λ." },
    { term: "Neighbourhood size |N_Λ|", def: "|N_Λ| = (m − 1) adjacent merges plus the number of nontrivial subset-splits of each block. Because it differs between partitions it enters the acceptance ratio as a correction." },
    { term: "MH acceptance", def: "α = min(1, (|N_Λ|/|N_Λ′|) · P(Λ′ | D)/P(Λ | D)). The neighbourhood ratio corrects for unequal proposal frequencies; the score ratio favours higher-evidence partitions." },
    { term: "Unbiasedness vs. Order-MCMC", def: "Each DAG corresponds to a single ordered partition, so summing over partitions does not over-count DAGs the way summing over orders does. Partition MCMC therefore samples the correct posterior while keeping good mixing." },
    { term: "Rao-Blackwellised averaging", def: "Feature posteriors can be computed exactly by averaging the partition-conditional feature probability over visited partitions (Eq. 38–39), avoiding the extra noise of sampling concrete DAGs." }
  ],

  animation: {
    title: "Partition MCMC on the paper's 3-node Example 56, variables {M, C, D} (true edge C → D). Λ₀ = [1,1,1] (three single-node layers); a merge proposal gives Λ₁ = [1,2]; α = 1 so it is ACCEPTED (Fig. 123–125).",
    nodes: [
      { id: "M", x: 0.18, y: 0.5 },
      { id: "C", x: 0.5, y: 0.5 },
      { id: "D", x: 0.82, y: 0.5 }
    ],
    edges: [],
    steps: [
      { caption: "<b>State = an ordered partition.</b> The chain starts at Λ₀ = [1, 1, 1]: every variable sits alone in its own layer — [M] | [C] | [D]. This is like a strict order, but the state space is partitions, not orders. Each layer beyond the first may parent only on earlier layers, with ≥1 parent in the layer immediately before.", ops: [{ op: "set", name: "Partition (layers)", items: ["[M]", "[C]", "[D]"] }, { op: "badge", text: "start: Λ₀ = [1,1,1]", kind: "info" }] },
      { caption: "<b>A consistent DAG.</b> One DAG consistent with [M] | [C] | [D] is the chain M → C → D: each node's parent lies in the previous layer. We draw it in the panel. The partition stands for ALL such DAGs at once.", ops: [{ op: "addEdge", from: "M", to: "C", type: "directed" }, { op: "addEdge", from: "C", to: "D", type: "directed" }, { op: "highlightNodes", ids: ["M", "C", "D"], cls: "hl" }] },
      { caption: "<b>Score the partition (product-of-sums).</b> For each node sum its family scores over allowed parent sets (from earlier layers), then multiply across nodes. This single number P(Λ₀ | D) marginalises every DAG consistent with Λ₀. The paper aggregates these to P(Λ₀ | D) = 38.56 × 10⁻¹¹.", ops: [{ op: "score", text: "P(Λ₀ | D) = 38.56 × 10⁻¹¹" }] },
      { caption: "<b>Why partitions, not orders?</b> Peeling any DAG by its roots (remove sources, regroup) maps it to exactly ONE ordered partition. So summing over partitions never over-counts a DAG — unlike Order-MCMC, where many orders match one DAG and bias the posterior. Same fast mixing, correct target.", ops: [{ op: "badge", text: "each DAG ↦ one partition ⇒ unbiased", kind: "info" }] },
      { caption: "<b>Build the split–merge neighbourhood N_Λ.</b> From Λ₀ = [1,1,1] the legal moves are merging adjacent layers ([M] & [C], or [C] & [D]) — there is nothing to split since every block is a singleton. One move is drawn uniformly, q = 1/|N_Λ|.", ops: [{ op: "set", name: "N(Λ₀) moves", items: ["merge [M]&[C]", "merge [C]&[D]"] }] },
      { caption: "<b>Propose a MERGE.</b> Merge the last two layers [C] and [D] into one block, giving candidate Λ₁ = [1, 2] — i.e. [M] | [C, D]. Now C and D share a layer, so they become unordered and cannot connect to each other; both may parent on M.", ops: [{ op: "clearSet", name: "Partition (layers)" }, { op: "set", name: "Partition (layers)", items: ["[M]", "[C, D]"] }, { op: "highlightNodes", ids: ["C", "D"], cls: "swap" }, { op: "badge", text: "merge [C]&[D] → Λ₁ = [1,2]", kind: "info" }] },
      { caption: "<b>Re-score the candidate.</b> Recompute the product-of-sums for Λ₁: now C and D each sum parent sets drawn only from layer [M]. The aggregated evidence is P(Λ₁ | D) = 48.34 × 10⁻¹¹ — higher than Λ₀.", ops: [{ op: "score", text: "P(Λ₁ | D) = 48.34 × 10⁻¹¹" }] },
      { caption: "<b>Metropolis-Hastings test.</b> α = min(1, (|N_Λ₀|/|N_Λ₁|) · P(Λ₁|D)/P(Λ₀|D)). With the symmetric neighbourhood sizes in this toy example the correction is 1, so α = min(1, 48.34/38.56 × 10⁻¹¹ ÷ 10⁻¹¹) = min(1, 1.25) = 1.", ops: [{ op: "score", text: "α = min(1, 48.34/38.56) = 1" }, { op: "badge", text: "α = 1 → ACCEPT", kind: "good" }] },
      { caption: "<b>Accept and redraw a consistent DAG.</b> The chain moves to Λ₁ = [M] | [C, D]. A DAG consistent with it has both C and D parented by M and no edge between them: M → C and M → D. (We keep C → D out, since C and D are now in the same layer.)", ops: [{ op: "removeEdge", from: "C", to: "D" }, { op: "addEdge", from: "M", to: "D", type: "directed" }, { op: "highlightNodes", ids: ["M", "C", "D"], cls: "hl" }, { op: "badge", text: "now at Λ₁ = [1,2]", kind: "info" }] },
      { caption: "<b>Sample DAGs per visited partition.</b> For Bayesian model averaging, draw one DAG from each accepted partition using the partition-conditional P(G | Λ, D): each node picks an admissible parent set with probability proportional to its family score. From Λ₀ a DAG with C → D may be drawn; from Λ₁ it cannot.", ops: [{ op: "highlightEdges", edges: [["M", "C"], ["M", "D"]], cls: "feature" }, { op: "badge", text: "draw 1 DAG per accepted partition", kind: "info" }] },
      { caption: "<b>Model averaging (Rao-Blackwellised).</b> Estimate the feature C → D by averaging its partition-conditional probability over the visited partitions Λ₀, Λ₁ — exactly, with no extra DAG-sampling noise. Because each DAG maps to one partition, this average is the correct (unbiased) posterior.", ops: [{ op: "highlightEdges", edges: [["C", "D"]], cls: "feature" }, { op: "score", text: "P̂(C→D | D) = ½[1{C→D ∈ G⁽⁰⁾} + 1{C→D ∈ G⁽¹⁾}]" }] },
      { caption: "<b>Result.</b> Partition MCMC returns a posterior over structures summarised as edge probabilities — sampled over ORDERED PARTITIONS, so it keeps Order-MCMC's good mixing while fixing its bias and improving on DAG-space MC³.", ops: [{ op: "set", name: "Posterior edge features", items: ["M → C : averaged", "M → D : averaged", "C → D : averaged"] }, { op: "badge", text: "unbiased posterior over structures", kind: "good" }] }
    ]
  },

  complexity: "Each partition score is a product over n nodes of a sum over admissible parent sets; with a parent-size cap the per-node sums are pre-computed and cached, so iterations are cheap. The neighbourhood is split–merge moves over the partition's blocks. The partition state space mixes far better than DAG-space MC³ for a given number of iterations, while — unlike Order-MCMC — its DAG↔partition mapping keeps the target posterior exact. Building each ordered partition by peeling roots is linear in the graph size.",
  strengths: [
    "<b>Unbiased posterior</b> — each DAG maps to exactly one ordered partition, so it does not suffer the over-counting bias that distorts Order-MCMC's posterior.",
    "<b>Good mixing</b> — the partition landscape is much smoother than DAG space, so it mixes far better than single-edge MC³.",
    "Simple split–merge proposal with cheap incremental re-scoring thanks to a decomposable score.",
    "Yields Bayesian model averaging of features, with an exact Rao-Blackwellised estimator that avoids the noise of sampling concrete DAGs.",
    "With the exact family evidence Φ_B the partition posterior is exact (discrete–Dirichlet / Gaussian)."
  ],
  limitations: [
    "More involved to implement than Order-MCMC or MC³ (enumerating split/merge neighbourhoods, the neighbourhood-size correction, and partition-conditional DAG sampling).",
    "Still requires a decomposable score and typically a parent-size cap to keep the per-node sums tractable.",
    "Per-iteration cost can exceed Order-MCMC's because the partition neighbourhood and scoring are richer.",
    "Like all MCMC, convergence/burn-in must be diagnosed, and the implicit prior over DAGs induced by the partition prior may need care."
  ],
  notes: "Partition MCMC (Kuipers &amp; Moffa, ref. [349]) was introduced precisely to remove the posterior bias of Order-MCMC while retaining its superior mixing over DAG-space MC³. The ordered partition is obtained by peeling a DAG by its roots; the chain explores partitions via split–merge moves and samples DAGs consistent with the visited partitions (Structure MCMC builds on local edge moves; Partition MCMC builds on this root-layer view). Feature posteriors can be estimated by sampling DAGs or, more efficiently, by exact Rao-Blackwellisation over partitions. For efficiency one caches FamScore(X, P | D) for admissible parent sets and reuses them across iterations (Remark 13).",
  figureRefs: "Paper §4.40 (pp.197–200): the ordered-partition state Λ = [B₁,…,Bₘ] (Fig. 120); constructing a partition by peeling roots (Fig. 121); the split / merge proposal moves (Fig. 122); the neighbourhood size |N_Λ| = (m−1) + Σ subset-splits and the MH acceptance α = min(1, (|N_Λ|/|N_Λ′|)·P(Λ′|D)/P(Λ|D)) (p.198); partition score as a product-of-sums (Eq. 37); partition-conditional DAG sampling and Rao-Blackwellised feature averaging (Eqs. 38–39, Eq. 40); Example 56 on {M,C,D} with Λ₀=[1,1,1] merge→Λ₁=[1,2], P(Λ₀|D)=38.56×10⁻¹¹, P(Λ₁|D)=48.34×10⁻¹¹, α=1 ACCEPT, and P(C→D|D) by averaging (Fig. 123–125, p.200)."
};
