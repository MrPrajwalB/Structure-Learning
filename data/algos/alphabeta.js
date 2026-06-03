/* α-β Collaborative Discovery — Addanki & Kasiviswanathan. Grounded in §4.51
   (pp.241-249). Pseudocode = Algorithm 63 (α-β, p.246) + Algorithm 64
   (Dominant-MAG recovery, p.247). Worked example = Example 72 (nine per-entity
   PAGs, Fig.151; probe set S={A,C}, threshold τ=1, Fig.152; two clusters Fig.153;
   random node assignment Fig.154; node-wise voting Fig.155; dominant MAG Fig.156).
   (α,β)-clustering property = Definition 26 (p.241). Guarantee = Theorem 33 (p.244).
   Builds on FCI (each entity first runs FCI -> a PAG). */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["alphabeta"] = {
  name: "α-β Collaborative Discovery",
  oneLiner: "A distributed, latent-aware method for the setting where many entities measure the SAME variables but each has its own causal structure: instead of every entity paying for a full PAG-to-MAG resolution alone, α-β first CLUSTERS entities with a few shared intervention probes (the α part), then within each cluster VOTES node-by-node to assemble one shared 'dominant' MAG (the β part) — cutting interventions per entity to grow only logarithmically with the number of entities.",
  basedOnText: "α-β tackles 'collaborative causal discovery': multiple entities observe a common variable set V but follow different data-generating processes because of entity-specific latent factors. The goal is to recover each entity's own MAG (latent-aware) while keeping the number of atomic interventions each entity must run small, by sharing work across entities that turn out to be similar.",

  assumptions: [
    "<b>Shared variable set</b> — every entity measures the same variables V, so their MAGs tend to share many adjacencies and orientations (this overlap is what makes collaboration pay off).",
    "<b>(α,β)-clustering property (Definition 26)</b> — the entity MAGs fall into hidden clusters: two entities in the SAME cluster differ on at most βn nodes' neighbour sets, while entities in DIFFERENT clusters differ on at least αn, with the separation α &gt; β.",
    "<b>No causal sufficiency required</b> — like FCI, latent confounders are allowed; each entity's target is a MAG (so bidirected edges can appear).",
    "<b>Intervention access</b> — each entity can run CI tests on its observational data AND perform atomic interventions that fix one variable (e.g. hold price at a set level briefly), plus reliable CI-testing oracles for both data types."
  ],
  input: "A set of M entities sharing variables V; per-entity observational + atomic-interventional data with CI-testing oracles; a probe-set size s; and the clustering thresholds α &gt; β ≥ 0.",
  output: "For every entity i, an estimated latent-aware structure (a MAG) Ĝ_i. Entities in the same cluster all receive that cluster's single 'dominant' MAG, which is provably within node-wise distance βn of the entity's true MAG (Theorem 33).",

  idea: [
    "<b>The problem.</b> Imagine many companies all tracking {Price, Advertising, Demand, Web-traffic}. They share the variables, but each has private hidden influences (regional taste, supply shocks), so pooling everyone into one model conflates different causal stories. Each company really wants its OWN latent-aware graph — a MAG, because hidden confounders are present.",
    "<b>The expensive baseline.</b> Each entity could run FCI on its own data to get a PAG, then disambiguate every uncertain endpoint with single-variable interventions: for X∘→Y test X̸⫫Y|do(X) and X⫫Y|do(Y) to orient X→Y, or X↔Y if both interventions keep them dependent. Correct, but this costs on the order of |V| interventions PER entity (Fig.150).",
    "<b>The α-β insight: collaborate.</b> Because all entities share V, their MAGs overlap a lot. α-β assumes the entities cluster (Definition 26): same-cluster entities are nearly identical (differ on ≤ βn nodes), different-cluster entities differ a lot (≥ αn). So instead of fully resolving each entity alone, α-β 'pays once' to orient local neighbourhoods and reuses that work across the cluster.",
    "<b>α — the clustering phase.</b> Run FCI per entity to get PAGs. Then pick a SMALL probe set S ⊂ V of size s. For each probe node v and each entity, recover v's neighbour set (parents/children/spouses) by orienting only the edges incident to v with atomic interventions. Two entities are linked in a 'clustering graph' P if their probe neighbour sets agree on enough nodes (threshold τ = ⌈(1−(α+β)/2)·s⌉). The connected components of P are the clusters. The α/β gap is exactly what makes this cheap probe enough to separate clusters reliably.",
    "<b>β — the dominant-MAG phase.</b> Within each cluster, distribute the member PAGs across the nodes (e.g. assign each PAG to one node at random, giving node v a holder set T_v). For every node v, recover v's neighbour set from each PAG that holds it — again using only atomic interventions incident to v — and keep the MOST FREQUENT (plurality) neighbour set N*_v. Stitch {N*_v} together (enforcing ancestral acyclicity and maximality) into ONE dominant MAG, and assign it to every entity in the cluster. Latent confounders surface here as bidirected edges in the voted neighbour sets.",
    "<b>Why it wins.</b> The probe size only needs to grow like log(M) for the clusters to separate and the votes to be reliable (Theorem 33), so each entity performs at most (Δ+1) + s·(Δ+1) atomic interventions — logarithmic in the number of entities instead of linear in |V| per entity."
  ],

  steps: [
    "<b>Per-entity FCI.</b> For each entity i ∈ [M], run FCI on its own observational data to estimate a PAG G_i^PAG (Algorithm 63, lines 1–3). These PAGs are the inputs to everything that follows (Fig.151 shows nine of them).",
    "<b>α — draw the probe set.</b> Sample a small set S ⊂ V with |S| = s, and start an empty clustering graph P over the entity indices {1,…,M} (line 4).",
    "<b>α — probe neighbour sets by intervention.</b> For each probe node v ∈ S and each entity, recover v's neighbour set N_v = (Pa_v, Ch_v, Sp_v) by orienting ONLY the edges incident to v, using atomic interventions on v and its incident variables (e.g. A̸⫫B|do(A) and A⫫B|do(B) ⇒ A→B). This is the 'pay once for local neighbourhoods' step.",
    "<b>α — connect similar entities.</b> For every pair (i,j), count the probe nodes whose neighbour sets match. If that count c ≥ ⌈(1 − (α+β)/2)·s⌉ = τ, draw an edge i–j in P (lines 5–16). In Example 72 (α=0.75, β=0.5, |S|=2, S={A,C}) the threshold is τ=1, so any agreement on A or C links two entities.",
    "<b>α — read off the clusters.</b> The connected components of P are the clusters C_1,…,C_k (line 17). By Definition 26, entities inside a cluster differ on at most βn nodes after recovery; entities across clusters differ on at least αn (Fig.153).",
    "<b>β — assign PAGs to nodes.</b> Inside a cluster, give each member PAG to some node v, building a holder set T_v per node (Algorithm 64, lines 1–4; one simple rule assigns each PAG to a single node at random — Fig.154).",
    "<b>β — vote node-by-node.</b> For each node v, take each PAG in T_v and recover v's neighbour set N_v^(i) by orienting v's incident edges with atomic interventions on v and its neighbours; collect these and keep the MOST FREQUENT one, N*_v (lines 5–12). Latent common causes appear here as bidirected (↔) endpoints in the voted set.",
    "<b>β — stitch the dominant MAG.</b> Assemble the dominant MAG G_dom from the plurality neighbour sets {N*_v}, enforcing ancestral acyclicity and maximality (line 13). This single MAG represents the whole cluster (Fig.156).",
    "<b>Broadcast within the cluster.</b> Set Ĝ_i ← G_dom for every entity i in the cluster (Algorithm 63, lines 20–22). One paid-for structure now serves all members.",
    "<b>Return all estimates.</b> Repeat the dominant-MAG step for every cluster and return {Ĝ_i} for all M entities (line 24). With probe size s = c·log(M/δ)/(α−β)², Theorem 33 guarantees each Ĝ_i is within node-wise distance βn of the truth using at most (Δ+1)+s(Δ+1) interventions per entity."
  ],

  keyConcepts: [
    { term: "Collaborative causal discovery", def: "Many entities measure the SAME variables V but each follows its own causal process (because of entity-specific latents). The aim is each entity's own latent-aware graph, learned by sharing work across entities rather than independently." },
    { term: "α and β (the (α,β)-clustering property, Def.26)", def: "Two thresholds on node-wise distance between entity MAGs. β bounds how much entities in the SAME cluster may differ (≤ βn nodes); α lower-bounds how much entities in DIFFERENT clusters differ (≥ αn). The required separation is α > β — the bigger the gap, the smaller the probe needed." },
    { term: "α-phase (clustering)", def: "Cluster the entities using a few shared probes: for sampled nodes S, recover each probe's neighbour set by intervention, link entities that agree on at least τ = ⌈(1−(α+β)/2)·s⌉ probes, and take connected components as clusters." },
    { term: "β-phase (dominant-MAG recovery)", def: "Within a cluster, assign member PAGs to nodes, vote node-by-node on each node's neighbour set (parents/children/spouses) using atomic interventions, keep the plurality choice N*_v, and stitch them into one shared dominant MAG for all members." },
    { term: "Neighbour set N_v = (Pa_v, Ch_v, Sp_v)", def: "A node's parents, children and spouses (spouse = the other end of a bidirected ↔ edge, i.e. a latent-confounded partner). α-β orients only edges INCIDENT to v to recover this, instead of resolving the whole graph." },
    { term: "Atomic intervention", def: "Fixing a single variable to a set value (e.g. holding A at a level) and re-testing dependence. X̸⫫Y|do(X) with X⫫Y|do(Y) orients X→Y; if both interventions keep X,Y dependent, the edge is bidirected X↔Y (a latent common cause)." },
    { term: "Dominant MAG (G_dom)", def: "The single maximal ancestral graph voted up within a cluster and broadcast to every member. It is the 'pay once, reuse' object that replaces M separate PAG-to-MAG resolutions." },
    { term: "MAG / PAG (latent-aware)", def: "Built on FCI: each entity first gets a PAG (circle marks = undetermined). α-β resolves marks locally by intervention into a MAG, where a bidirected edge ↔ explicitly flags a hidden common cause." }
  ],

  animation: {
    title: "α-β on Example 72 (paper §4.51): nine entity PAGs over {A,B,C,D} → α-phase clusters them with probes S={A,C} → β-phase votes a dominant MAG (with a latent confounder C↔B surfacing). Sets/badges track which entities & which phase are acting.",
    nodes: [
      { id: "A", x: 0.20, y: 0.18 },
      { id: "B", x: 0.78, y: 0.18 },
      { id: "C", x: 0.20, y: 0.82 },
      { id: "D", x: 0.78, y: 0.82 }
    ],
    edges: [
      { from: "A", to: "B", type: "circ-circ" },
      { from: "A", to: "C", type: "circ-circ" },
      { from: "A", to: "D", type: "circ-circ" },
      { from: "B", to: "C", type: "circ-circ" },
      { from: "C", to: "D", type: "circ-circ" }
    ],
    steps: [
      { caption: "<b>Setup.</b> Nine entities all measure the SAME variables {A,B,C,D}, but each has its own hidden influences, so each has its own causal structure. We show one entity's FCI output: a PAG with undetermined circle endpoints (∘–∘). Running a full PAG-to-MAG resolution for all nine separately would be expensive — α-β instead collaborates.", ops: [{ op: "set", name: "entities", items: ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9"] }, { op: "badge", text: "9 entity PAGs (Fig.151)", kind: "info" }] },
      { caption: "<b>α-phase — pick a probe set.</b> Rather than resolve every edge of every entity, α-β samples a SMALL probe set S = {A,C} (size s=2) and will only orient edges incident to A and C, on every entity, via atomic interventions. Thresholds: α=0.75, β=0.5.", ops: [{ op: "set", name: "probe S (α)", items: ["A", "C"] }, { op: "highlightNodes", ids: ["A", "C"], cls: "hl" }, { op: "badge", text: "α: probe S={A,C}", kind: "info" }] },
      { caption: "<b>α-phase — orient around probe A by intervention.</b> On each entity, recover A's neighbour set with atomic interventions on A and its neighbours. Here A̸⫫B|do(A) but A⫫B|do(B) ⇒ orient A→B; likewise the D–A edge resolves to D→A. We learn A's (Pa,Ch,Sp) WITHOUT resolving the rest of the graph.", ops: [{ op: "testCI", x: "A", y: "B", z: ["A"], result: "dep" }, { op: "testCI", x: "A", y: "B", z: ["B"], result: "indep" }, { op: "orient", from: "A", to: "B", type: "directed" }, { op: "orient", from: "D", to: "A", type: "directed" }, { op: "highlightNodes", ids: ["A"], cls: "add" }] },
      { caption: "<b>α-phase — orient around probe C.</b> Same local probing for C: interventions give C's neighbour set. For entities P3 and P4 this yields, at A, {Pa={D}, Ch={B}, Sp={C}} and matching sets at C — they agree on BOTH probes.", ops: [{ op: "orient", from: "C", to: "D", type: "directed" }, { op: "highlightNodes", ids: ["C"], cls: "add" }, { op: "badge", text: "α: neighbour sets of A,C recovered", kind: "good" }] },
      { caption: "<b>α-phase — link similar entities.</b> Two entities connect in the clustering graph P if their probe neighbour sets agree on at least τ = ⌈(1−(α+β)/2)·s⌉ = ⌈0.375·2⌉ = 1 node. So agreeing on A OR C is enough. P3 and P4 match ⇒ they are linked (Fig.152a).", ops: [{ op: "set", name: "matched (α)", items: ["P3–P4", "P1–P2–P5", "P6", "P7–P8–P9"] }, { op: "badge", text: "α: threshold τ = 1", kind: "info" }] },
      { caption: "<b>α-phase — read off clusters.</b> The connected components of P are the clusters. Here they split into C1 = {P1,P2,P3,P4,P5} and C2 = {P6,P7,P8,P9} (Fig.153). Same-cluster entities differ on ≤ βn nodes; across clusters ≥ αn. α-phase is done — its job was to GROUP, cheaply.", ops: [{ op: "clearSet", name: "matched (α)" }, { op: "set", name: "cluster C1 (α)", items: ["P1", "P2", "P3", "P4", "P5"] }, { op: "set", name: "cluster C2 (α)", items: ["P6", "P7", "P8", "P9"] }, { op: "badge", text: "α DONE: 2 clusters", kind: "good" }] },
      { caption: "<b>β-phase begins — assign PAGs to nodes.</b> Switch to building ONE dominant MAG for cluster C1. Distribute its member PAGs across the nodes: each node v gets a holder set T_v. Here T_A={P5}, T_B={P1}, T_C={P6'}, T_D={P2,P3,P4} (Fig.154). β will vote node-by-node.", ops: [{ op: "clearSet", name: "cluster C2 (α)" }, { op: "set", name: "T_D (β holders)", items: ["P2", "P3", "P4"] }, { op: "highlightNodes", ids: ["D"], cls: "hl" }, { op: "badge", text: "β: node-wise voting (Alg.64)", kind: "info" }] },
      { caption: "<b>β-phase — vote on node D.</b> For each PAG holding D (T_D={P2,P3,P4}), recover D's incident edges by atomic interventions on D and its neighbours, then keep the PLURALITY neighbour set. The winner is N*_D = (Pa=∅, Ch={A}, Sp=∅) ⇒ orient D→A (Fig.155a).", ops: [{ op: "testCI", x: "D", y: "A", z: ["D"], result: "dep" }, { op: "orient", from: "D", to: "A", type: "directed" }, { op: "highlightNodes", ids: ["D", "A"], cls: "add" }, { op: "badge", text: "β: N*_D = (∅,{A},∅)", kind: "good" }] },
      { caption: "<b>β-phase — vote on A, B, C.</b> Repeat the plurality vote for the other nodes from their assigned PAGs. The votes fix A→B and the C–D and A–C endpoints, building up the dominant neighbourhood at each node (Fig.155b).", ops: [{ op: "set", name: "T_A,T_B,T_C (β)", items: ["A:P5", "B:P1", "C:P6"] }, { op: "orient", from: "A", to: "B", type: "directed" }, { op: "orient", from: "C", to: "D", type: "directed" }, { op: "orient", from: "A", to: "C", type: "directed" }, { op: "highlightNodes", ids: ["A", "B", "C"], cls: "add" }] },
      { caption: "<b>β-phase — a latent surfaces.</b> When voting on B's neighbourhood, the interventions show B and C stay dependent under do(B) AND do(C): neither B→C nor C→B is consistent. The plurality neighbour set records a SPOUSE — a hidden common cause — so the edge becomes bidirected C↔B.", ops: [{ op: "testCI", x: "B", y: "C", z: ["B"], result: "dep" }, { op: "testCI", x: "B", y: "C", z: ["C"], result: "dep" }, { op: "orient", from: "B", to: "C", type: "bidirected" }, { op: "highlightNodes", ids: ["B", "C"], cls: "hl" }, { op: "badge", text: "β: latent common cause ⇒ C↔B", kind: "bad" }] },
      { caption: "<b>β-phase — stitch the dominant MAG.</b> Assemble {N*_v} into one MAG (enforcing ancestral acyclicity and maximality): D→A, A→B, A→C, C→D, with the bidirected C↔B flagging the latent. This is G_dom for cluster C1 (Fig.156).", ops: [{ op: "clearSet", name: "T_D (β holders)" }, { op: "clearSet", name: "T_A,T_B,T_C (β)" }, { op: "highlightEdges", edges: [["D", "A"], ["A", "B"], ["A", "C"], ["C", "D"], ["B", "C"]], cls: "add" }, { op: "badge", text: "β: dominant MAG assembled", kind: "good" }] },
      { caption: "<b>Broadcast & finish.</b> Assign G_dom to EVERY entity in C1 (Ĝ_i ← G_dom). The same α-then-β procedure handles C2. α grouped entities with cheap shared probes; β paid once to vote a shared latent-aware MAG per cluster. By Theorem 33 each estimate is within βn of the truth, using only ~log(M)-many interventions per entity.", ops: [{ op: "set", name: "C1 ← G_dom", items: ["P1", "P2", "P3", "P4", "P5"] }, { op: "badge", text: "DONE: per-entity MAGs returned", kind: "good" }] }
    ]
  },

  complexity: "Per-entity intervention cost scales like (Δ+1)(1+s), where Δ is the maximum undirected degree across the per-entity PAGs and s is the probe size. Choosing s = c·log(M/δ)/(α−β)² makes the probes grow only LOGARITHMICALLY with the number of entities M while still separating clusters and voting reliably (Theorem 33). Accuracy is measured as node-wise distance — the number of variables whose parent/child/spouse sets differ from the true MAG. Each entity also runs FCI once up front to produce its PAG.",
  strengths: [
    "Slashes interventions: per-entity cost grows only logarithmically with the number of entities, versus Ω(|V|) per entity for the naive per-entity FCI-then-intervene baseline (Fig.150).",
    "Latent-aware throughout — builds on FCI/MAGs, so hidden common causes show up as bidirected edges in the voted neighbour sets.",
    "Provable guarantee (Theorem 33): with high probability each entity's estimate is within node-wise distance βn of its true MAG.",
    "Distributed and reuse-friendly: 'pays once' to orient local neighbourhoods during clustering, then shares one dominant MAG per cluster instead of resolving every entity separately."
  ],
  limitations: [
    "Relies on the (α,β)-clustering property with α > β; if entity structures don't actually cluster (clusters overlap, or α ≤ β), the probe-and-vote logic breaks down.",
    "Inherits FCI's fragility: each step rests on CI tests and atomic-intervention oracles, which are noisy with finite data and large neighbourhoods.",
    "The dominant MAG is a single representative per cluster, so genuine within-cluster differences (up to βn nodes) are smoothed over — every member gets the SAME graph.",
    "Requires the ability to perform atomic interventions on each entity, which is often costly or impossible in practice."
  ],
  notes: "α-β sits in a broad related-work landscape (§4.51.2): scale-driven sampling/ensembling (Tang et al.; PEnBayes; Liu et al.), transfer-learning across related tasks (Rodríguez-López & Sucar's GES-transfer, Azzimonti et al.'s hierarchical Dirichlet score, MT-MMHC, Oyen et al., PC-TL), horizontally distributed learning (P-TPDA, K2 vote-and-merge), and a rich line on intervention DESIGN for orienting edges (Hyttinen et al.; Squires et al.; Choo & Shiragur; Shiragur et al.'s Meek separator; submodular budgeted selection by Ghassami et al. and Sussex et al.). Closest in spirit, Addanki et al. analyse intervention planning UNDER latents with explicit costs, using strongly separating set systems and 'p-colliders'.",
  figureRefs: "Paper §4.51 (pp.241–249): Algorithm 63 (α-β, p.246) and Algorithm 64 (Dominant-MAG recovery, p.247); Definition 26 ((α,β)-clustering property, p.241); Theorem 33 (guarantee, p.244). Worked Example 72: nine per-entity PAGs (Fig.151), pairwise probe & clustering graph P with S={A,C}, τ=1 (Fig.152), clusters C1/C2 (Fig.153), random PAG-to-node assignment / holder sets T_v (Fig.154), node-wise voting (Fig.155), dominant MAG G_dom (Fig.156). Naive per-entity baseline (Fig.150). Remark 16 (pp.245) summarises the 'pay once, reuse' principle."
};
