/* AVICI — Amortized Variational Inference for Causal Discovery (Lorch et al.).
   Grounded in §4.55 (pp.264-267): Algorithm 69 (training + amortized inference),
   Eq.(47) ELBO/KL view, the encoder of Fig.170 (8 layers alternating attention over
   samples & variables, sample-pooling, logistic bilinear edge readout),
   mean-field Bernoulli factorization q(G;θ)=∏ Bernoulli(θ_ij), and the spectral-radius
   acyclicity penalty. Example below is a faithful 4-node illustration (no per-paper
   numeric example is given for AVICI). */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["avici"] = {
  name: "AVICI — Amortized Variational Inference for Causal Discovery",
  oneLiner: "Instead of running a fresh search on every dataset, train a neural network once on huge numbers of simulated (data → true graph) pairs; afterwards it looks at a brand-new dataset and in a single forward pass outputs its predicted causal graph as a set of per-edge probabilities.",
  basedOnText: "AVICI is an amortized, simulation-trained method: the expensive learning is done once, up front, and then 'amortized' (spread out) over all future datasets, each of which only needs one cheap forward pass — no per-dataset combinatorial search and no conditional-independence testing.",

  assumptions: [
    "<b>A realistic simulator</b> — there is a generative model P(G) over graphs and P(D|G) over datasets (observational and/or interventional) that can produce unlimited (data, true-graph) training pairs. Accuracy at test time relies on this simulator resembling reality.",
    "<b>Exchangeable samples</b> — the rows (data samples) of a dataset have no meaningful order, so the network is built to be permutation-invariant over samples and equivariant over variables.",
    "<b>Acyclicity is desired</b> — the target is a DAG, encouraged during training by a penalty on the graph's spectral radius rather than enforced by a hard search constraint.",
    "<b>One trained network generalises</b> — a single network f_φ is expected to handle new datasets drawn from the same family it was trained on."
  ],
  input: "At test time: a brand-new dataset D* (an N×d matrix of N samples over d variables; each entry may also carry an intervention flag). At training time: a graph prior P(G) and a simulator P(D|G).",
  output: "A variational distribution q(G;θ) over the adjacency matrix — a d×d matrix of edge probabilities θ_ij = P(i→j). Optionally a single DAG, obtained by thresholding θ or by greedy acyclic decoding.",

  idea: [
    "Classical methods (PC, GES, etc.) treat each new dataset from scratch: every time, they re-run an expensive search or a battery of independence tests. AVICI asks a different question — <i>can we learn the search itself?</i>",
    "The trick is <b>amortized inference</b>. Build a neural network f_φ that takes a whole dataset as input and outputs a distribution over graphs. Train it once on millions of <i>simulated</i> examples where the true graph is known: feed the simulated data in, compare the predicted edges to the ground-truth edges, and nudge the network's weights to do better. The cost of 'learning how to learn graphs' is paid a single time.",
    "Once trained, prediction is instant: present a real dataset, run <b>one forward pass</b>, and read off the predicted causal graph as per-edge probabilities. The combinatorial work has been replaced by a fixed neural computation.",
    "Concretely, AVICI minimises the KL divergence between the true posterior P(G|D) and a tractable family q(G;θ) with θ = f_φ(D); by Bayes' rule this is equivalent to <i>maximising</i> an expected log-likelihood over simulated graphs and data (the objective in Eq.(47)).",
    "The output distribution is <b>mean-field</b>: each possible edge i→j is an independent Bernoulli with probability θ_ij, so the whole graph is q(G;θ)=∏ Bernoulli(θ_ij). Self-loops are forbidden (θ_ii is masked out), and a spectral-radius penalty pushes the predicted edges toward an acyclic (DAG) configuration."
  ],

  steps: [
    "<b>Set up the simulator.</b> Choose a graph prior P(G) and a data simulator P(D|G) that can generate observational and/or interventional datasets together with their known ground-truth graphs.",
    "<b>Build the inference network f_φ.</b> The dataset enters as N×d tokens. An encoder stacks several layers that <i>alternate</i> attention across data samples and across variables — this makes the network permutation-invariant over samples and equivariant over variables. Pooling over the sample axis turns each variable into a single embedding.",
    "<b>Read out edge probabilities.</b> Two small linear maps produce, for each variable, a pair of embeddings (w, v). A logistic bilinear map θ_ij = σ(τ · wᵢ · vⱼ + b) turns each ordered pair into a directed-edge probability, giving the full matrix θ = f_φ(D). (Fig.170.)",
    "<b>Train once (the amortized phase).</b> Repeatedly sample a batch of graphs G ~ P(G) and datasets D ~ P(D|G); run them through f_φ; score the mean-field q(G;θ) against the known true graphs; and update φ by gradient ascent. Because q factorises over edges, each edge gets its own Bernoulli loss.",
    "<b>Encourage acyclicity.</b> Add a penalty on the spectral radius ρ(θ) of the predicted edge matrix (estimated cheaply by a few power iterations) and enforce it with a Lagrangian / dual-ascent update — driving ρ toward 0, which guarantees a DAG.",
    "<b>Stop when converged.</b> Training ends with a fixed parameter vector φ*. The network has now 'learned to infer graphs'; this cost is never paid again.",
    "<b>Inference on new data (single forward pass).</b> For a brand-new real dataset D*, compute θ* = f_φ*(D*) in one pass. Out come calibrated per-edge probabilities P(i→j) — no search, no CI tests.",
    "<b>Optionally decode a single DAG.</b> Either threshold θ* (keep edges whose probability passes a cutoff while skipping any that would create a cycle), or do greedy acyclic decoding: sort candidate edges by probability and add them one by one as long as acyclicity is preserved.",
    "<b>Return</b> the edge-probability matrix q(G;θ*) and, if requested, the decoded DAG."
  ],

  keyConcepts: [
    { term: "Amortized inference", def: "Pay a large training cost once to learn a function that maps data → posterior, so each later dataset is handled by a cheap single forward pass instead of a fresh per-dataset search." },
    { term: "Simulation-based training", def: "Training pairs come from a simulator: sample a graph G~P(G), generate data D~P(D|G), and learn to recover G from D. The network only ever sees synthetic ground truth." },
    { term: "Inference network f_φ", def: "The neural encoder that ingests the whole dataset and outputs edge probabilities. Permutation-invariant over samples, equivariant over variables." },
    { term: "Mean-field factorization", def: "q(G;θ)=∏ Bernoulli(θ_ij): every possible directed edge is an independent coin flip with probability θ_ij. Self-loops are masked (θ_ii excluded)." },
    { term: "Logistic bilinear readout", def: "Each variable gets two vectors (w,v); the edge probability is θ_ij = σ(τ·wᵢ·vⱼ + b), with learned scale τ and bias b (Fig.170)." },
    { term: "Spectral-radius acyclicity penalty", def: "ρ(θ)=largest absolute eigenvalue of the edge-weight matrix; ρ=0 means the graph has no cycles. A penalty (with dual ascent) drives predictions toward DAGs." },
    { term: "Single forward pass", def: "At test time θ* = f_φ(D*) is computed in one neural pass — the whole inference, with no combinatorial optimisation." }
  ],

  animation: {
    title: "AVICI: train one network on simulated (data → graph) pairs, then predict a new graph in a single forward pass. Faithful 4-node illustration {A,B,C,D} (no per-paper numeric example).",
    nodes: [
      { id: "A", x: 0.10, y: 0.18 },
      { id: "B", x: 0.85, y: 0.18 },
      { id: "C", x: 0.10, y: 0.82 },
      { id: "D", x: 0.85, y: 0.82 }
    ],
    edges: [],
    steps: [
      { caption: "<b>The problem.</b> Classical learners re-run an expensive search on every dataset. AVICI instead trains a neural network ONCE so that any future dataset needs only a single forward pass.", ops: [{ op: "badge", text: "amortized inference", kind: "info" }] },
      { caption: "<b>Build a simulator.</b> A graph prior P(G) and a data simulator P(D|G) can produce unlimited training examples — each a dataset paired with its KNOWN true graph.", ops: [{ op: "set", name: "Training sims", items: ["sim #1: data + true graph", "sim #2: data + true graph", "sim #3: data + true graph", "…millions more"] }] },
      { caption: "<b>Training, early.</b> Feed simulated datasets through the inference network f_φ; it predicts edge probabilities and is scored against the true graphs. At first it is barely better than guessing.", ops: [{ op: "score", text: "edge accuracy ≈ 0.55" }, { op: "badge", text: "training…", kind: "info" }] },
      { caption: "<b>Training, improving.</b> Gradient ascent updates the weights φ over many batches of sims. The permutation-invariant encoder learns which data patterns imply which edges.", ops: [{ op: "set", name: "Training sims", items: ["batch 1 ✓", "batch 2 ✓", "batch 3 ✓", "…"] }, { op: "score", text: "edge accuracy ≈ 0.78" }] },
      { caption: "<b>Acyclicity penalty.</b> A penalty on the spectral radius ρ(θ) (a few power iterations) pulls the predicted graphs toward DAGs: ρ → 0 means no cycles.", ops: [{ op: "score", text: "ρ(θ) → 0  (DAG family)" }, { op: "badge", text: "acyclicity penalty", kind: "info" }] },
      { caption: "<b>Training converged.</b> The network now reliably recovers simulated graphs. This whole cost is paid ONCE and amortized over every future dataset.", ops: [{ op: "score", text: "edge accuracy ≈ 0.95" }, { op: "badge", text: "trained once", kind: "good" }, { op: "clearSet", name: "Training sims" }] },
      { caption: "<b>Test time: a NEW real dataset.</b> A brand-new dataset D* over {A,B,C,D} arrives. No search, no CI tests — just one forward pass θ* = f_φ(D*).", ops: [{ op: "highlightNodes", ids: ["A", "B", "C", "D"], cls: "hl" }, { op: "badge", text: "single forward pass", kind: "info" }] },
      { caption: "<b>Network outputs edge probabilities.</b> A→B comes out with high probability — add it. Each edge is an independent Bernoulli θ_ij.", ops: [{ op: "addEdge", from: "A", to: "B", type: "directed" }, { op: "score", text: "P(A→B)=0.93" }] },
      { caption: "<b>More predicted edges.</b> A→C also scores high → add it.", ops: [{ op: "addEdge", from: "A", to: "C", type: "directed" }, { op: "score", text: "P(A→C)=0.88" }] },
      { caption: "<b>And B→D.</b> The forward pass returns the whole probability matrix at once; here B→D is confident.", ops: [{ op: "addEdge", from: "B", to: "D", type: "directed" }, { op: "score", text: "P(B→D)=0.90" }] },
      { caption: "<b>Low-probability edges are dropped.</b> e.g. P(C→D)=0.12 falls below threshold, so it is not added (and would risk a cycle anyway).", ops: [{ op: "highlightNodes", ids: ["C", "D"], cls: "hl" }, { op: "score", text: "P(C→D)=0.12 — skip" }] },
      { caption: "<b>Threshold / acyclic decode → final DAG.</b> Keeping confident edges while preserving acyclicity yields A→B, A→C, B→D. Total test cost: one forward pass.", ops: [{ op: "highlightEdges", edges: [["A","B"],["A","C"],["B","D"]] }, { op: "badge", text: "DAG predicted instantly", kind: "good" }] }
    ]
  },

  complexity: "Training is expensive but paid once (many simulated datasets, gradient updates, with cheap power-iteration estimates of the spectral radius). Inference per new dataset is a single forward pass — roughly the cost of one neural-network evaluation — with no combinatorial search and no conditional-independence tests.",
  strengths: [
    "Inference is near-instant: one forward pass per new dataset, no per-dataset search or CI testing.",
    "Outputs calibrated per-edge probabilities (AUROC/AUPRC computable directly from θ), not just a single graph.",
    "Naturally handles observational and interventional data and is permutation-invariant over samples by construction.",
    "Acyclicity is encouraged smoothly via the spectral-radius penalty rather than a hard combinatorial constraint."
  ],
  limitations: [
    "Accuracy hinges on the simulator: if the training simulator (graph prior, noise, mechanisms) does not match the real data, predictions degrade.",
    "Large up-front training cost and the need to design a faithful generative model of graphs and data.",
    "The mean-field output treats edges independently, which can understate dependencies between edges.",
    "Acyclicity is encouraged, not guaranteed at the probability level — a decoding step (thresholding or greedy acyclic selection) is needed to extract a strict DAG."
  ],
  notes: "AVICI recasts structure learning as a learned function fit on simulations, contrasting with search/score and constraint-based methods that optimise each dataset independently. Related work (Ness et al. [487]) frames experimental design as a Bayesian active-learning loop over DAGs, updating a posterior after each experiment.",
  figureRefs: "Paper §4.55 (pp.264-267): Algorithm 69 (AVICI training and amortized inference), Eq.(47) (KL / ELBO objective), Remark 18 (Bayes-rule equivalence), Fig.170 (AVICI encoder with alternating sample/variable attention and logistic bilinear edge readout), Recall 71 (why the spectral penalty enforces acyclicity)."
};
