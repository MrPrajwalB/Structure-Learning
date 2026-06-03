/* DAGAF — Directed Acyclic Generative Adversarial Framework. Grounded in §4.68
   (pp.318-321; Petkov et al. [534]). Two-stage tagged SCM + score method:
   Stage 1 jointly learns a weighted adjacency matrix A (the candidate DAG) and
   nodewise structural mechanisms {f_j} under the NOTEARS smooth acyclicity penalty
   h(A)=tr(e^{A∘A})−n, trained with a GAN adversarial loss + MMD distributional
   matching + reconstruction (+ PNL inverse-consistency); Stage 2 freezes the DAG
   (L0, W^0) and refines the per-node generators adversarially with WGAN-GP to build
   a high-fidelity causal data generator. Model families = LiNGAM / ANM / PNL
   (Recall 86). Losses = GAN + MMD (Recall 87). Pseudocode = Algorithm 89 (Stage 1),
   Algorithm 90 (Stage 2), Algorithm 91 (overall). Neural mechanisms = Remark 26
   (graph/parent layer + hidden layers + output head). The paper gives the framework,
   not a node-level worked example, so the 4-node example below is illustrative. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["dagaf"] = {
  name: "DAGAF (Directed Acyclic Generative Adversarial Framework)",
  oneLiner: "Treat structure learning as a game: a generator proposes a candidate causal graph (a weighted adjacency matrix) plus a small function at each node, and simulates fake data by running that structural causal model; a discriminator tries to tell the simulated data from the real data. The generator keeps improving its graph and functions — under a smooth penalty that forces the graph to stay acyclic — until the discriminator can no longer tell real from fake, at which point the graph captures the true data-generating structure.",
  basedOnText: "DAGAF (Petkov et al.) is a tagged structural-causal-model + score method that learns a DAG with a GAN-style adversarial objective. It runs in two stages: Stage 1 jointly learns a weighted adjacency matrix (the structure) and nodewise mechanisms under an acyclicity penalty so simulated data matches real data; Stage 2 freezes the discovered DAG and refines only the per-node generators to obtain a high-quality structural data generator (the graph itself is no longer changed).",

  assumptions: [
    "<b>Structural causal model</b> — each variable is generated from its parents through a nodewise mechanism plus independent exogenous noise: X_j = f_j(X_Pa(j), ε_j). DAGAF can instantiate three families (Recall 86): <b>LiNGAM</b> (linear, non-Gaussian noise), <b>ANM</b> (additive noise, X_j = f_j(X_Pa(j)) + ε_j), or <b>PNL</b> (post-nonlinear, X_j = g_j(f_j(X_Pa(j)) + ε_j) with invertible g_j).",
    "<b>Independent exogenous noise</b> — the noises ε = (ε₁,…,ε_n) are mutually independent and sampled in Stage 2 from a fixed reference distribution (typically a factorised Gaussian). These are the usual exogenous shocks of an SEM, NOT latent confounders.",
    "<b>The graph must be a DAG</b> — acyclicity is enforced as the single smooth NOTEARS constraint h(A)=tr(e^{A∘A})−n = 0, which is zero exactly when the weighted adjacency matrix A encodes a directed acyclic graph.",
    "<b>Continuous, differentiable model</b> — both the generator (adjacency matrix A, the nodewise networks f_j, and for PNL the inverse distortions g_j⁻¹) and the discriminator are differentiable, so everything is trained by gradient-based optimisation."
  ],
  input: "A dataset D = {x⁽ⁱ⁾} of n-dimensional real samples; a chosen model family (LiNGAM / ANM / PNL); and hyperparameters λ_MMD, λ_rec, λ_acyc, λ_PNL (and the WGAN-GP penalty weight λ_GP for Stage 2).",
  output: "A learned DAG G — a thresholded binary adjacency matrix L₀ ∈ {0,1}ⁿˣⁿ together with the extracted first-layer (parent-aggregation) weights W⁰ — plus a trained structural data generator (the refined per-node mechanisms) that produces samples X̂ consistent with G.",

  idea: [
    "<b>Structure learning becomes a generation game.</b> A <i>generator</i> is itself a structural causal model: a weighted adjacency matrix A says who points to whom, and a small neural network f_j at each node says how each variable is computed from its parents and its own noise. Running this SCM forward simulates a whole fake dataset. A <i>discriminator</i> looks at batches of data and tries to tell the simulated samples from the real ones. If it can tell them apart, the generator's graph/functions are wrong; if it cannot, the simulated data is statistically indistinguishable from the real data — meaning the graph and mechanisms capture the true data-generating process.",
    "<b>The graph is a real-valued matrix.</b> Like NOTEARS, DAGAF encodes the candidate graph as a weighted adjacency matrix A ∈ ℝⁿˣⁿ whose entries parameterise the edge weights, so 'learning structure' means tuning the numbers in A. The mechanisms are small networks whose first 'graph/parent layer' is <i>masked</i> by A, so only parents are allowed to feed a node.",
    "<b>Acyclicity is one smooth equation.</b> A candidate graph is only valid if it has no cycles. DAGAF reuses the NOTEARS smooth penalty h(A)=tr(e^{A∘A})−n, which equals zero exactly when A is acyclic and grows positive when a cycle exists (the Hadamard square A∘A makes signs irrelevant; the matrix-exponential trace counts closed walks of every length). Adding λ_acyc·h(A) to the loss drives A toward a DAG during training — a cycle-forming edge weight is pushed to zero.",
    "<b>Stage 1 — discover the structure.</b> The Stage 1 objective is a weighted sum of five terms: the <b>GAN adversarial loss</b> (make simulated data fool the discriminator), an <b>MMD</b> distributional-matching term (a kernel distance aligning the overall distributions as a complementary signal), a <b>reconstruction</b> term (each structural equation should approximately reproduce its node), the <b>acyclicity penalty</b> λ_acyc·h(A), and — only for PNL — an inverse-consistency term forcing g_j⁻¹∘g_j to behave like the identity. Gradient descent jointly trains A and the mechanisms; at convergence A is thresholded to a binary adjacency L₀ and the masked first-layer weights W⁰ are extracted, defining the DAG G.",
    "<b>Stage 2 — refine the generator.</b> Stage 2 treats the discovered DAG as <i>fixed</i> (L₀ and W⁰ are frozen) and no longer touches the graph. It picks a topological order of G, draws independent noise ε, and generates samples recursively along the order through the structural equations. Only the per-node generators' 'hidden weights' are updated, trained adversarially against a discriminator with the <b>Wasserstein GAN with gradient penalty (WGAN-GP)</b> objective, so the fixed structure produces a high-fidelity data generator for downstream simulation or data augmentation.",
    "<b>Division of labour.</b> Stage 1 answers 'who depends on whom, and roughly how?' (it learns the graph); Stage 2 answers 'given that fixed structure, how exactly?' (it polishes the mechanisms without ever altering the estimated DAG)."
  ],

  steps: [
    "<b>Set up the generator as an SCM.</b> Encode the candidate graph as a weighted adjacency matrix A and attach a small nodewise mechanism f_j to each variable (plus, for PNL, an inverse distortion g_j⁻¹). The first 'graph/parent layer' of each f_j is masked by A so only parents feed a node. Choose the model family (LiNGAM / ANM / PNL) and the hyperparameters λ_MMD, λ_rec, λ_acyc, λ_PNL.",
    "<b>Stage 1 — initialise.</b> Initialise the graph-layer weights A and the nodewise networks {f_j} (and {g_j⁻¹} if PNL) randomly. The discriminator starts able to easily distinguish simulated data from real.",
    "<b>Simulate data from the current candidate model.</b> Draw a minibatch from D and compute reconstructions X̂ (component X̂_j from the current mechanisms) — i.e. run the candidate SCM forward to produce simulated samples.",
    "<b>Score the fake data (adversarial + distributional).</b> Compute the GAN adversarial loss ℒ_GAN comparing real X with simulated X̂, the MMD² distributional-matching term between the real and generated distributions, and the reconstruction loss Σ_j‖X_j − X̂_j‖².",
    "<b>Add the acyclicity penalty.</b> Add λ_acyc·h(A) with h(A)=tr(e^{A∘A})−n — zero only when A is a DAG — and, for PNL, the inverse-consistency term λ_PNL·Σ_j‖g_j⁻¹(X_j) − f_j(X_Pa(j))‖². Combine all terms into ℒ_Stage1.",
    "<b>Generator/discriminator step.</b> Take a gradient (back-propagation) update of A, {f_j} (and {g_j⁻¹}) to decrease ℒ_Stage1: the generator's graph and functions change so its simulated data becomes harder to distinguish, while the discriminator is updated to keep spotting fakes.",
    "<b>Repeat the adversarial loop.</b> Iterate the simulate → score → update steps over minibatches until ℒ_Stage1 converges. Along the way the acyclicity penalty drives any cycle-forming edge weight toward zero, so A becomes acyclic.",
    "<b>Threshold to a DAG.</b> Threshold A elementwise to a binary adjacency L₀ ← 1{|A| ≥ τ}; set W⁰ to the learned first-layer (parent-aggregation) weights masked by L₀. Return L₀, W⁰ — the discovered DAG G. (End of Stage 1.)",
    "<b>Stage 2 — freeze the structure.</b> Freeze L₀ and W⁰; compute a topological order π of G. The graph is never altered again — only the per-node generators' hidden weights will be refined.",
    "<b>Generate along the topological order.</b> Sample independent noise ε from the reference distribution P_ε and simulate x̃ recursively in the order π through the structural equations (ANM/LiNGAM or PNL), so samples strictly respect the fixed DAG.",
    "<b>Refine the generators with WGAN-GP.</b> Update the discriminator D by maximising the WGAN-GP critic objective (Wasserstein-1 term + gradient penalty), and update only the generators' hidden weights to minimise ℒ_Stage2, keeping L₀ and W⁰ frozen. Iterate until the WGAN-GP training converges.",
    "<b>Return.</b> Output the learned DAG G (from L₀) and the trained structural generator producing samples X̂ consistent with G."
  ],

  keyConcepts: [
    { term: "Generator = a parameterised SCM", def: "The generator IS a structural causal model: a weighted adjacency matrix A encodes the candidate graph and a small network f_j at each node computes the variable from its parents plus noise. Running it forward simulates a fake dataset, so 'generating data' and 'proposing a causal graph' are the same act." },
    { term: "Discriminator (critic)", def: "A network that tries to tell simulated samples X̂ from real samples X. It supplies the training signal: the generator improves precisely when the discriminator can no longer distinguish fake from real (Stage 2 uses a Wasserstein critic with gradient penalty)." },
    { term: "GAN + MMD losses (Recall 87/228)", def: "The adversarial GAN loss makes simulated data fool the discriminator; the Maximum Mean Discrepancy (MMD²) is a complementary kernel-based distance that directly aligns the overall real and generated distributions. DAGAF uses both as distribution-matching signals." },
    { term: "Weighted adjacency matrix A", def: "A real-valued nˣn matrix whose entries parameterise edge weights and define the candidate graph; it masks each mechanism's first layer so only parents feed a node. Thresholding A gives the binary DAG L₀." },
    { term: "Smooth acyclicity penalty h(A)", def: "The NOTEARS function h(A)=tr(e^{A∘A})−n, which is exactly 0 iff the directed graph of A is acyclic and positive otherwise. Added as λ_acyc·h(A), it forces the candidate graph toward a DAG via gradient descent rather than discrete cycle-checking." },
    { term: "Model families (Recall 86)", def: "DAGAF can instantiate LiNGAM (linear, non-Gaussian noise — order identifiable), ANM (additive noise, X_j=f_j(X_Pa(j))+ε_j), or PNL (post-nonlinear, X_j=g_j(f_j(X_Pa(j))+ε_j) with invertible g_j, adding an inverse-consistency term)." },
    { term: "Two-stage training", def: "Stage 1 (Alg. 89) jointly learns A and the nodewise mechanisms under the five-term ℒ_Stage1 to DISCOVER the structure. Stage 2 (Alg. 90) FREEZES the DAG (L₀, W⁰) and refines only the per-node generators with WGAN-GP to build a high-fidelity data generator." },
    { term: "Neural mechanism (Remark 26)", def: "Each f_j is a small feedforward net: a masked graph/parent layer (constrained by L₀ so only parents connect) aggregates parents, optional hidden layers transform it, and an output head produces f_j(X_Pa(j)). In Stage 2 the masked first layer W⁰ is frozen and only the hidden weights are tuned." }
  ],

  animation: {
    title: "DAGAF on an illustrative 4-variable example {A,B,C,D} (paper gives the framework, not a node example): the generator proposes a candidate DAG and simulates data; the discriminator's real-vs-fake signal drives the graph until acyclic and indistinguishable.",
    nodes: [
      { id: "A", x: 0.18, y: 0.18 },
      { id: "B", x: 0.82, y: 0.18 },
      { id: "C", x: 0.82, y: 0.82 },
      { id: "D", x: 0.18, y: 0.82 }
    ],
    edges: [
      { from: "A", to: "B", type: "directed" },
      { from: "B", to: "C", type: "directed" },
      { from: "C", to: "A", type: "directed" },
      { from: "A", to: "D", type: "directed" }
    ],
    steps: [
      { caption: "<b>Set up the generator as an SCM.</b> The candidate graph is a weighted adjacency matrix A; a small network f_j at each node computes the variable from its parents plus noise ε_j. Running this forward will simulate a fake dataset. Right now the random init even contains a cycle A→B→C→A, so it is not a DAG.", ops: [
        { op: "highlightEdges", edges: [["A","B"],["B","C"],["C","A"]], cls: "hl" },
        { op: "badge", text: "generator = SCM (A + {f_j})", kind: "info" },
        { op: "badge", text: "h(A) > 0 — not acyclic", kind: "bad" }
      ] },
      { caption: "<b>The adversarial game.</b> A generator proposes a graph + functions and simulates data; a discriminator tries to tell simulated data from real. The generator improves until its simulated data is indistinguishable from real — meaning its graph captures the true structure.", ops: [
        { op: "set", name: "ℒ_Stage1 terms", items: ["GAN adversarial loss", "+ λ_MMD · MMD² (distribution match)", "+ λ_rec · reconstruction", "+ λ_acyc · h(A) (acyclicity)"] },
        { op: "badge", text: "Stage 1: discover structure", kind: "info" }
      ] },
      { caption: "<b>Simulate data from the candidate model.</b> Draw a real minibatch from D and run the current SCM forward to produce reconstructions X̂. The discriminator inspects real X vs simulated X̂.", ops: [
        { op: "highlightNodes", ids: ["A","B","C","D"], cls: "hl" },
        { op: "score", text: "discriminator D(real)=0.97 · D(fake)=0.04 → easily spots fake" }
      ] },
      { caption: "<b>Discriminator step — it easily spots the fake.</b> The candidate graph is wrong, so the simulated data looks nothing like the real data; the discriminator separates them almost perfectly and the GAN loss is high.", ops: [
        { op: "badge", text: "discriminator step", kind: "info" },
        { op: "badge", text: "fake easily detected (≈96% correct)", kind: "bad" },
        { op: "score", text: "ℒ_GAN: high · MMD²: high · h(A): high (cycle!)" }
      ] },
      { caption: "<b>Generator step.</b> Back-propagate ℒ_Stage1 to update A and the mechanisms {f_j}. Edges that genuinely help the simulated data match the real data strengthen (A→B, B→C, A→D); the simulated distribution moves toward the real one.", ops: [
        { op: "badge", text: "generator step", kind: "info" },
        { op: "highlightEdges", edges: [["A","B"],["B","C"],["A","D"]], cls: "strong" },
        { op: "score", text: "ℒ_GAN: falling · MMD²: falling · D(fake)=0.22 (rising)" }
      ] },
      { caption: "<b>Acyclicity penalty bites.</b> λ_acyc·h(A) with h(A)=tr(e^{A∘A})−n is positive whenever a cycle exists. The cycle-closing edge C→A is what makes A→B→C→A a loop, so its weight is driven toward zero under the tightening penalty.", ops: [
        { op: "highlightEdges", edges: [["C","A"]], cls: "weak" },
        { op: "score", text: "h(A): shrinking · ℒ_GAN: lower · MMD²: lower" }
      ] },
      { caption: "<b>Acyclicity enforced — remove the cycle.</b> The weight on C→A falls below threshold; removing it breaks the cycle so the candidate graph becomes a DAG. The smooth penalty did this, not discrete cycle-checking.", ops: [
        { op: "removeEdge", from: "C", to: "A" },
        { op: "badge", text: "acyclicity enforced — h(A) ≈ 0", kind: "good" }
      ] },
      { caption: "<b>Generator keeps refining the functions.</b> The reconstruction and MMD terms tune each f_j so every structural equation reproduces its node and the overall distributions align. The simulated data now overlaps the real cloud much more.", ops: [
        { op: "highlightEdges", edges: [["A","B"],["B","C"],["A","D"]], cls: "strong" },
        { op: "score", text: "discriminator D(real)=0.61 · D(fake)=0.39 → struggling" }
      ] },
      { caption: "<b>Discriminator can no longer tell real from fake.</b> The candidate DAG and its mechanisms now generate data indistinguishable from the real data — the discriminator is near chance (~50%). This is the convergence signal that the structure is right.", ops: [
        { op: "badge", text: "discriminator step", kind: "info" },
        { op: "score", text: "D(real)≈0.50 · D(fake)≈0.50 → ~50% (chance)" },
        { op: "badge", text: "real vs fake indistinguishable", kind: "good" }
      ] },
      { caption: "<b>Threshold to the DAG (end of Stage 1).</b> Threshold A elementwise to the binary adjacency L₀ ← 1{|A|≥τ} and extract the masked first-layer weights W⁰. The discovered DAG G is A→B, B→C, A→D.", ops: [
        { op: "highlightNodes", ids: ["A","B","C","D"], cls: "hl" },
        { op: "highlightEdges", edges: [["A","B"],["B","C"],["A","D"]], cls: "strong" },
        { op: "badge", text: "L₀, W⁰ returned — DAG discovered", kind: "good" }
      ] },
      { caption: "<b>Stage 2 — freeze the structure, refine the generator.</b> Freeze L₀ and W⁰ (the graph is never changed again), take a topological order, draw noise ε, and generate along the order. Train ONLY the per-node generators' hidden weights with the WGAN-GP critic objective.", ops: [
        { op: "set", name: "Stage 2 (frozen DAG)", items: ["topological order π", "ε ~ P_ε (reference noise)", "WGAN-GP critic + gradient penalty", "update hidden weights only"] },
        { op: "badge", text: "Stage 2: high-fidelity data generator", kind: "info" }
      ] },
      { caption: "<b>Result.</b> A learned DAG G = (A→B, B→C, A→D) from L₀, plus a trained structural generator whose simulated samples respect G and are indistinguishable from real data — usable for downstream simulation or data augmentation.", ops: [
        { op: "highlightEdges", edges: [["A","B"],["B","C"],["A","D"]], cls: "strong" },
        { op: "badge", text: "DAG + structural generator returned", kind: "good" }
      ] }
    ]
  },

  complexity: "Each Stage 1 iteration runs a forward simulation of the SCM, evaluates the GAN loss, an MMD² between real and generated minibatches (kernel evaluations), a reconstruction term, and the acyclicity score h(A) with its gradient (about O(n³) from the matrix exponential), then back-propagates to A and the mechanisms {f_j} (and {g_j⁻¹} for PNL). Stage 2 is a WGAN-GP training loop over the frozen DAG, updating only the per-node generators' hidden weights. Overall cost scales with the number of variables n, network/minibatch sizes, and the number of adversarial iterations — there is no explicit search over the super-exponential space of DAGs.",
  strengths: [
    "Unifies structure learning with a generative model: the SAME generator both proposes a candidate causal DAG and simulates realistic data, and the discriminator provides a strong distribution-level training signal (GAN + MMD).",
    "Acyclicity is the single smooth NOTEARS constraint h(A)=0 — no discrete cycle-checking — and the whole pipeline is differentiable, trained end-to-end by gradient descent.",
    "Flexible model families (LiNGAM / ANM / PNL via Recall 86) let it handle linear non-Gaussian, additive-noise nonlinear, and post-nonlinear mechanisms in one framework.",
    "The two-stage design separates concerns: Stage 1 discovers the graph, Stage 2 freezes it and yields a high-fidelity structural data generator (e.g. for simulation or data augmentation) without ever altering the estimated DAG."
  ],
  limitations: [
    "Adversarial (GAN/WGAN-GP) training is notoriously sensitive to optimisation, architecture and balance between generator and discriminator, and can be unstable or land in poor local optima.",
    "Results depend on several hyperparameters (λ_MMD, λ_rec, λ_acyc, λ_PNL, λ_GP) and on the final thresholding cutoff τ that turns A into the binary DAG L₀.",
    "Assumes a structural causal model with independent exogenous noise (no hidden confounders) and a chosen family (LiNGAM/ANM/PNL); identifiability rests on those family assumptions.",
    "Like other continuous-optimisation acyclicity methods it is non-convex, and the matrix-exponential acyclicity term plus adversarial simulation make each iteration relatively expensive."
  ],
  notes: "DAGAF is a tagged structural-causal-model + score method (Petkov et al. [534]). Stage 1's five-term objective ℒ_Stage1 = ℒ_GAN + λ_MMD·MMD²(P_X,P_X̂) + λ_rec·Σ_j‖X_j−X̂_j‖² + λ_acyc·h(A) + λ_PNL·(inverse-consistency, PNL only) discovers the structure; Stage 2's WGAN-GP objective ℒ_Stage2 = E[D(X)] − E[D(X̂)] + λ_GP·E[(‖∇D(x̃)‖₂ − 1)²] refines the generators over the frozen DAG. It builds on NOTEARS-style smooth acyclicity (h(A)=tr(e^{A∘A})−n) and on GAN/MMD distribution matching; Remark 26 details that each mechanism f_j is a small feedforward net (masked graph/parent layer, hidden layers of depth L_j, output head), with the graph-induced parent layer (mask L₀ and weights W⁰) frozen in Stage 2.",
  figureRefs: "Paper §4.68 (pp.318–321): Recall 86 (model families LiNGAM/ANM/PNL), Recall 87 (GAN + MMD losses), the NOTEARS acyclicity penalty h(A)=tr(e^{A∘A})−n, the Stage 1 objective ℒ_Stage1 (five terms) and Stage 2 WGAN-GP objective ℒ_Stage2, Algorithm 89 (DAGAF Stage 1: joint learning of A and nodewise mechanisms), Algorithm 90 (DAGAF Stage 2: causal data generator, WGAN-GP, frozen L₀,W⁰), Algorithm 91 (DAGAF overall procedure), and Remark 26 (neural parameterisation: graph/parent layer, hidden layers, output head)."
};
