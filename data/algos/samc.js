/* SAMC — Stochastic Approximation Monte Carlo. Grounded in §4.22 (pp.130-132):
   the energy U(G) = -log P(G|D); the partition of the search space into energy
   regions E_1..E_m by thresholds u_1<...<u_{m-1} (Fig.72); the per-region log-weights
   θ tilting the Metropolis-Hastings ratio r = exp(θ_{J(G)} - θ_{J(G')}) × posterior
   ratio × proposal correction; the Robbins-Monro weight update toward target visit
   proportions ρ; Algorithm 29 (SAMC); and Example 32 (V={A,B,C}, five energy regions
   E_1=[0,85], E_2=[85,90], E_3=[90,95], E_4=[95,100], E_5=[100,∞), G0 energy 100 in
   E_5 → G1 energy 95 in E_4 by reversing A→B, Fig.73). */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["samc"] = {
  name: "SAMC — Stochastic Approximation Monte Carlo",
  oneLiner: "An MCMC sampler over DAGs that fixes MC3's poor mixing: it slices the structure space into 'energy' regions by score, keeps a running weight per region, proposes single-edge moves like MC3 but accepts them using the score AND the region weights, then after every step nudges those weights so over-visited regions get penalised — flattening the landscape so the chain can cross low-score valleys and sample multi-modal posteriors.",
  basedOnText: "SAMC is an <i>adaptive</i> Metropolis-Hastings sampler for Bayesian model averaging over DAGs. It partitions the posterior landscape into energy regions and biases transitions so that all regions are visited at chosen long-run frequencies; the self-adjusting weights are what let it escape the high-posterior basins that trap a plain single-edge MC3 chain.",

  assumptions: [
    "<b>A decomposable, computable score</b> — each DAG's posterior P(G | D) ∝ P(D | G)P(G) can be evaluated (e.g. BDeu / BGe), so a single-edge move only re-scores the changed families. The energy is defined as U(G) = −log P(G | D), so low energy = high posterior.",
    "<b>User-specified energy thresholds</b> u₁ &lt; u₂ &lt; … &lt; u_{m−1} that slice the space into m energy regions E₁, …, E_m, plus target visit proportions ρ = (ρ₁,…,ρ_m) (often uniform, ρ_i = 1/m).",
    "<b>A connected, reversible neighbourhood</b> — single-edge add / delete / reverse moves, as in MC3, so the chain can reach any DAG and undo any move.",
    "<b>A decreasing step-size schedule</b> a_t for the Robbins-Monro weight update (e.g. a_t = t₀/max(t₀, t)), so the weights stabilise and the chain converges.",
    "<b>Enough run length</b> — the chain runs past a burn-in B for T iterations so visit frequencies settle to the desired proportions."
  ],
  input: "A dataset D over variables V, a prior P(G), an add/delete/reverse operator O with a region/slice index map J(·) (which region each DAG falls in), target visit proportions ρ, a burn-in B and total iterations T.",
  output: "A collection of <b>posterior draws</b> {G⁽ᵗ⁾ : t &gt; B} approximately from P(G | D), used for Bayesian model averaging — e.g. posterior edge probabilities by averaging an edge's presence over the samples. (The region weights θ are a by-product that recorded how the landscape was flattened.)",

  idea: [
    "SAMC starts from the same goal as MC3 — <i>sample</i> the posterior over DAGs instead of optimising it — but cures MC3's central weakness: <b>poor mixing</b>. A plain single-edge chain over-stays in whichever high-posterior basin it falls into and rarely crosses the low-score valleys between competing structures, so it under-explores multi-modal posteriors.",
    "The key new idea is to <b>slice the landscape into energy regions</b>. Define each DAG's energy as U(G) = −log P(G | D), so low energy means high posterior probability. User-chosen thresholds u₁ &lt; … &lt; u_{m−1} cut the space into regions E₁ (lowest energy / best) up to E_m (highest energy / worst). Every DAG belongs to exactly one region, given by the slice index J(G).",
    "Each region carries a <b>running log-weight θ_i</b>, and the sampler aims to visit every region at chosen long-run frequencies ρ (often uniform). Intuitively, if the chain over-stays in one slice — typically a deep low-energy basin — the method <i>raises that region's weight</i>, which then pushes the chain to leave it and head toward rarely-seen, possibly-better structures elsewhere. <b>Regions visited often get penalised, flattening the landscape so the sampler escapes traps.</b>",
    "Moves are proposed exactly like MC3 — pick a single-edge add/delete/reverse neighbour G' — but acceptance uses the score <i>and</i> the region weights. The MH ratio is tilted by the multiplicative factor exp(θ_{J(G)} − θ_{J(G')}): leaving an over-weighted (over-visited) region makes the factor &gt; 1 and <i>increases</i> acceptance; entering a heavy region makes it &lt; 1 and <i>decreases</i> acceptance. This is precisely what steers proposals toward under-visited regions and lets the chain accept a move into a temporarily worse region to cross an energy barrier.",
    "After every accept/reject step the weights self-adjust by a <b>Robbins-Monro (stochastic-approximation) update</b>: the weight of the region just visited is bumped up by a shrinking step size, all others nudged down toward their targets. As the step sizes decay the weights settle, the visit frequencies approach ρ, and the retained samples give a Bayesian model average — e.g. posterior edge probabilities — over a far better-explored, multi-modal posterior than MC3 reaches."
  ],

  steps: [
    "<b>Set up the slicing.</b> Define energy U(G) = −log P(G | D). Choose thresholds u₁ &lt; … &lt; u_{m−1} that partition the space into regions E₁, …, E_m, and target visit proportions ρ (e.g. ρ_i = 1/m). Initialise all region log-weights θ = (θ₁,…,θ_m) = 0.",
    "<b>Initialise the chain.</b> Pick a starting DAG G⁽⁰⁾, set burn-in B and total iterations T, and fix the step-size schedule a_t.",
    "<b>Propose a move.</b> At the current graph G⁽ᵗ⁾, draw a candidate G' by one legal single-edge add / delete / reverse (any cycle-creating move excluded), with proposal probability q(G⁽ᵗ⁾ → G').",
    "<b>Find the regions.</b> Compute the energies U(G⁽ᵗ⁾) and U(G'); read off which region each falls in via the slice index J(·).",
    "<b>Form the weight-tilted acceptance ratio.</b> r = exp(θ_{J(G⁽ᵗ⁾)} − θ_{J(G')}) × [P(G' | D)P(G') / P(G⁽ᵗ⁾ | D)P(G⁽ᵗ⁾)] × [q(G' → G⁽ᵗ⁾) / q(G⁽ᵗ⁾ → G')], and α = min(1, r). The first factor is the new piece: it raises acceptance when leaving a heavily-weighted (over-visited) region and lowers it when entering one. (With θ = 0 and a symmetric proposal, r collapses to the ordinary MC3 posterior ratio.)",
    "<b>Accept or reject.</b> With probability α set G⁽ᵗ⁺¹⁾ ← G'; otherwise keep G⁽ᵗ⁺¹⁾ ← G⁽ᵗ⁾. Because of the weight factor, a move into a worse (higher-energy) region can be accepted when that region is under-visited — this is how the chain crosses energy barriers.",
    "<b>Update the weights (stochastic approximation).</b> Robbins-Monro step: for each region i, θ_i ← θ_i + a_t (𝟙[G⁽ᵗ⁺¹⁾ ∈ E_i] − ρ_i). The region just landed in gets bumped up; all regions drift toward their target proportions ρ. Over-visited regions accumulate weight and become less attractive next time.",
    "<b>Repeat</b> steps 3–7 for t = 1 … T, with the step size a_t shrinking so the weights stabilise and visit frequencies approach ρ.",
    "<b>Discard burn-in and average.</b> Drop the first B samples; from the retained DAGs {G⁽ᵗ⁾ : t &gt; B} estimate any feature by its sample average — e.g. P(edge X→Y | D) ≈ fraction of retained DAGs containing X→Y — now over a much better-explored, multi-modal posterior."
  ],

  keyConcepts: [
    { term: "Energy U(G) = −log P(G | D)", def: "A rescaling of the posterior: low energy means high posterior probability. SAMC works on this energy landscape so it can talk about 'valleys' (good DAGs) and 'barriers' (low-posterior structures between them)." },
    { term: "Energy regions E₁ … E_m", def: "Slices of the search space cut by user-chosen thresholds u₁ &lt; … &lt; u_{m−1}: E₁ holds the lowest-energy (best) DAGs, E_m the highest-energy (worst). Each DAG sits in exactly one region (its slice index J(G))." },
    { term: "Region weights θ (self-adjusting)", def: "A running log-weight per region. Over-visited regions accumulate weight, which the acceptance rule then uses to push the chain out — the mechanism that flattens the landscape and prevents over-staying in one basin." },
    { term: "Target visit proportions ρ", def: "How often you want the chain to visit each region in the long run (often uniform, 1/m). The weights are adapted so the actual visit frequencies converge to ρ, guaranteeing every region — even rarely-seen ones — gets explored." },
    { term: "Weight-tilted MH ratio", def: "The MC3 acceptance ratio multiplied by exp(θ_{J(G)} − θ_{J(G')}). Leaving a heavily-weighted region boosts acceptance; entering one suppresses it, steering proposals toward under-visited regions." },
    { term: "Robbins-Monro update", def: "The stochastic-approximation rule θ_i ← θ_i + a_t(𝟙[G ∈ E_i] − ρ_i) applied after each step. The shrinking step size a_t lets the weights self-correct early then settle, so the chain converges." },
    { term: "Energy barrier / multi-modal posterior", def: "Competing high-posterior structures are separated by valleys of low-posterior graphs. SAMC's flattened landscape lets the chain cross these barriers, so it samples several modes instead of getting stuck in one (MC3's failure mode)." }
  ],

  animation: {
    title: "SAMC escaping a local mode (faithful 4-node example {A,B,C,D}, using the paper's energy-region machinery from §4.22 / Example 32 and Fig. 72-73). Lower-numbered region = lower energy = better DAG.",
    nodes: [
      { id: "A", x: 0.20, y: 0.20 },
      { id: "B", x: 0.80, y: 0.20 },
      { id: "C", x: 0.20, y: 0.82 },
      { id: "D", x: 0.80, y: 0.82 }
    ],
    edges: [
      { from: "A", to: "C", type: "directed" },
      { from: "C", to: "D", type: "directed" }
    ],
    steps: [
      { caption: "<b>Set up the slicing.</b> Energy U(G) = −log P(G | D), so low energy = high posterior. Thresholds cut the space into regions E₁ (best) … E₅ (worst), each starting with log-weight θ = 0 and a uniform visit target ρ = 1/5. The current DAG {A→C, C→D} has energy 92, putting it in region E₃.", ops: [{ op: "badge", text: "current DAG · energy 92 · region E₃", kind: "info" }, { op: "set", name: "Region weights θ", items: ["E₁ [0,85] : 0.00", "E₂ [85,90] : 0.00", "E₃ [90,95] : 0.00", "E₄ [95,100] : 0.00", "E₅ [100,∞) : 0.00"] }, { op: "highlightEdges", edges: [["A","C"],["C","D"]] }] },
      { caption: "<b>Stuck in a local mode.</b> Like MC3, SAMC proposes single-edge moves. From here it keeps falling back into region E₃ — a decent basin, but not the global best. Every visit to E₃ will raise θ₃, the key to getting out.", ops: [{ op: "badge", text: "over-staying in basin E₃", kind: "bad" }, { op: "set", name: "Region weights θ", items: ["E₁ [0,85] : 0.00", "E₂ [85,90] : 0.00", "E₃ [90,95] : 0.30", "E₄ [95,100] : 0.00", "E₅ [100,∞) : 0.00"] }] },
      { caption: "<b>Propose a single-edge move:</b> add edge A → B, giving candidate G'. Score it. Its energy is 97 → region E₄, which is <i>worse</i> (higher energy) than the current E₃. Plain MC3 would almost always reject this downhill move.", ops: [{ op: "addEdge", from: "A", to: "B", type: "directed" }, { op: "highlightNodes", ids: ["A", "B"], cls: "hl" }, { op: "highlightEdges", edges: [["A","B"]] }, { op: "score", text: "U(G') = 97 → region E₄ (worse than E₃)" }, { op: "badge", text: "proposal: add A→B", kind: "info" }] },
      { caption: "<b>Region weights enter the acceptance rule.</b> r = exp(θ_{E₃} − θ_{E₄}) × posterior-ratio × proposal-correction. The target region E₄ is under-visited (θ₄ = 0) while the current E₃ is over-visited (θ₃ = 0.30), so the weight factor exp(0.30 − 0.00) = exp(0.30) ≈ 1.35 <i>boosts</i> acceptance of this otherwise-worse move.", ops: [{ op: "score", text: "r = exp(0.30 − 0.00) × 0.37 × 1 ≈ 1.35 × 0.37 ≈ 0.50" }, { op: "highlightEdges", edges: [["A","B"]] }] },
      { caption: "<b>ACCEPT — escaping the trap.</b> The weight boost lifts α to ≈ 0.50, the random draw lands under it, and the chain moves into the worse region E₄. This is the centerpiece: <b>the self-adjusting weights pushed the sampler out of its basin and across an energy barrier</b>, something MC3's score-only rule rarely does.", ops: [{ op: "badge", text: "ACCEPTED — crossed barrier into E₄", kind: "good" }, { op: "highlightEdges", edges: [["A","B"]] }] },
      { caption: "<b>Update the weights (Robbins-Monro).</b> θ_i ← θ_i + a_t(𝟙[G ∈ E_i] − ρ_i). We just landed in E₄, so θ₄ rises; the over-visited E₃ is nudged down toward its target. The landscape keeps flattening so the chain won't be re-trapped in E₃.", ops: [{ op: "set", name: "Region weights θ", items: ["E₁ [0,85] : 0.00", "E₂ [85,90] : 0.00", "E₃ [90,95] : 0.22", "E₄ [95,100] : 0.18", "E₅ [100,∞) : 0.00"] }, { op: "badge", text: "θ₄ ↑, θ₃ ↓ (toward ρ)", kind: "info" }] },
      { caption: "<b>Propose from the new region:</b> reverse A → C into C → A. The candidate's energy is 88 → region E₂, much better (lower energy / higher posterior) than where we are. This is a path the chain could only reach after escaping E₃.", ops: [{ op: "removeEdge", from: "A", to: "C" }, { op: "addEdge", from: "C", to: "A", type: "directed" }, { op: "highlightNodes", ids: ["A", "C"], cls: "hl" }, { op: "highlightEdges", edges: [["C","A"]] }, { op: "score", text: "U(G') = 88 → region E₂ (better!)" }, { op: "badge", text: "proposal: reverse A→C ⇒ C→A", kind: "info" }] },
      { caption: "<b>ACCEPT a downhill-in-energy (uphill-in-posterior) move.</b> Moving to a better, under-visited region E₂ gives r well above 1 (posterior ratio &gt; 1, weight factor also favourable), so α = 1. The chain settles into a new, higher-posterior mode it had been walled off from.", ops: [{ op: "score", text: "r = exp(θ_{E₄} − θ_{E₂}) × (>1) × 1 ⇒ α = 1" }, { op: "badge", text: "ACCEPTED — reached better region E₂", kind: "good" }, { op: "highlightEdges", edges: [["C","A"],["C","D"],["A","B"]] }] },
      { caption: "<b>Weights self-adjust again.</b> E₂ now gets weight; the briefly-visited E₄ relaxes. After many such steps every region — best and worst — has been visited near its target frequency ρ, so the chain has mapped the whole multi-modal posterior, not just one basin.", ops: [{ op: "set", name: "Region weights θ", items: ["E₁ [0,85] : 0.05", "E₂ [85,90] : 0.16", "E₃ [90,95] : 0.19", "E₄ [95,100] : 0.15", "E₅ [100,∞) : 0.10"] }, { op: "badge", text: "visit frequencies → ρ (≈ uniform)", kind: "info" }] },
      { caption: "<b>Discard burn-in.</b> As the step sizes a_t shrink, the weights stop changing and the chain mixes across modes. The first B samples (collected while the weights were still swinging) are thrown away.", ops: [{ op: "badge", text: "drop first B samples (burn-in)", kind: "info" }] },
      { caption: "<b>Model averaging over a multi-modal posterior.</b> Over the retained DAGs — drawn from several modes the chain could now reach — count each feature's frequency. Because SAMC explored where MC3 would have stalled, these posterior edge probabilities reflect the true structural uncertainty.", ops: [{ op: "clearSet", name: "Region weights θ" }, { op: "set", name: "Posterior edge probabilities", items: ["C → D : ≈ 0.81", "C → A : ≈ 0.54", "A → B : ≈ 0.30", "A → C : ≈ 0.22"] }, { op: "score", text: "features averaged over a well-mixed, multi-modal sample" }] },
      { caption: "<b>Result.</b> SAMC returns posterior draws {G⁽ᵗ⁾ : t &gt; B} for Bayesian model averaging. The self-adjusting region weights flattened the landscape, pushed the chain out of the E₃ trap and across barriers, and gave coverage of competing modes that single-edge MC3 misses.", ops: [{ op: "badge", text: "multi-modal posterior returned", kind: "good" }, { op: "highlightEdges", edges: [["C","A"],["C","D"],["A","B"]] }] }
    ]
  },

  complexity: "Per iteration the cost is the same as MC3 — propose and score a single-edge move with a cheap local re-score, plus an O(m) weight update over the m regions and an O(1) region lookup. The win is not per-step cost but <b>mixing</b>: the self-adjusting weights flatten the landscape so the chain crosses energy barriers and reaches the high-posterior region in far fewer effective iterations, especially on multi-modal posteriors where MC3 stalls. Overall cost is still T × (per-iteration cost); choosing the energy thresholds, target proportions ρ and step-size schedule trades flattening strength against convergence speed.",
  strengths: [
    "<b>Escapes local modes</b> — over-visited regions are penalised by their weights, pushing the chain out of basins that trap single-edge MC3.",
    "<b>Better coverage of multi-modal posteriors</b> — the visit-proportion targets force every energy region, even rarely-seen ones, to be explored, so model averaging sees competing structures.",
    "Reuses MC3's cheap machinery: same single-edge add/delete/reverse moves, same decomposable score, with only a region lookup and an O(m) weight update added.",
    "Self-tuning: the weights adapt automatically to the landscape rather than requiring a hand-set temperature ladder."
  ],
  limitations: [
    "Requires choosing the <b>energy thresholds</b> u₁ &lt; … &lt; u_{m−1} (region boundaries) and target proportions ρ — poor choices give too-coarse or too-fine slicing and waste effort.",
    "Adds the step-size schedule a_t as another tuning knob; it must decrease for the weights (and the chain) to converge.",
    "Still samples in DAG space, so it inherits MC3's issue that Markov-equivalent graphs can be visited unevenly.",
    "Convergence diagnostics are subtler than for plain MCMC because the sampler is adaptive (the weights keep changing early on)."
  ],
  notes: "SAMC (Liang et al.) is an adaptive Metropolis-Hastings sampler that generalises the Wang-Landau idea to model space. It is the same family of fixes for MC3's slow mixing as tempering / parallel-tempering and order/partition-MCMC, but it adapts region weights online rather than running a fixed temperature ladder. The paper's Example 32 (three-node walk on V = {A,B,C} with five energy regions E₁=[0,85] … E₅=[100,∞)) shows a first accepted move from G₀ (energy 100, region E₅) to G₁ (energy 95, region E₄) by reversing the A–B edge, with r = exp(100−95) = exp(5) under zero weights, followed by the Robbins-Monro weight update.",
  figureRefs: "Paper §4.22 (pp.130-132): Algorithm 29 (SAMC, neighbourhood-based); the energy U(G) = −log P(G | D); the weight-tilted MH ratio r = exp(θ_{J(G)} − θ_{J(G')}) × posterior ratio × proposal correction; the Robbins-Monro weight update θ_i ← θ_i + a_t(𝟙[G ∈ E_i] − ρ_i); Fig.72 (energy slicing of the search space into regions E_i, dashed bands, escaping a local maximum); Fig.73 and Example 32 (three-node walk on {A,B,C}, five energy regions E₁=[0,85] … E₅=[100,∞), move G₀→G₁ by reversing A–B with r = exp(5))."
};
