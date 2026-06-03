/* §5.18 "Other algorithms" (pp.371-374). A reference catalogue of the methods the
   survey names only in passing, grouped by the themes the paper uses. Stops where the
   Discussion (§6) begins (p.376). Plain-language summaries grounded in the paper text. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["other"] = { html: `
<p style="color:var(--muted);margin:0 0 4px">
  Section 5.18 collects the many structure-learning methods the survey mentions only briefly —
  ones that did not earn a full subsection. They are listed below in the same thematic groups the
  paper uses, with a one-line plain-language summary of what each does and what it builds on.
</p>

<div class="section"><h3>Incremental / online updates (learning as new data arrives)</h3></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Alcobé <span style="color:var(--dim);font-weight:400;font-size:13px">— Alcobé [562]</span></h4>
  <p style="margin:0;color:var(--muted)">Updates a network when new cases arrive by reusing the whole trajectory of a previous hill-climbing run: it replays the saved sequence of edit operations on the enlarged dataset and only restarts the search where the old path stops being valid. Based on hill-climbing search reuse.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Shi &amp; Tan <span style="color:var(--dim);font-weight:400;font-size:13px">— Shi and Tan [584]</span></h4>
  <p style="margin:0;color:var(--muted)">An incremental hybrid method that refreshes the constraint-based candidate parent sets after each new batch arrives, then revises the graph by local score search inside that restricted space. Based on combining constraint-based candidacy with score search.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">iMMPC <span style="color:var(--dim);font-weight:400;font-size:13px">— Yasin and Leray [381]</span></h4>
  <p style="margin:0;color:var(--muted)">An incremental version of the MMPC local-discovery routine used inside MMHC: it maintains candidate parent–child sets and updates them with localized edits, focusing recomputation on the relationships most affected by the new cases. Based on MMPC / MMHC.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Li et al. (online refinement) <span style="color:var(--dim);font-weight:400;font-size:13px">— Li et al. [381]</span></h4>
  <p style="margin:0;color:var(--muted)">Learns an initial DAG and then updates it online by triggering local refinement rounds that add, remove, or reverse edges as new data accumulates. Based on incremental local search.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Concept-drift blending <span style="color:var(--dim);font-weight:400;font-size:13px">— (online approach in §5.18)</span></h4>
  <p style="margin:0;color:var(--muted)">Explicitly targets concept drift by blending fit on historical and recent data with an adaptive weighting that becomes more responsive when the current graph stops explaining incoming cases; tabu-style mechanisms avoid cycling and low-gain moves. Based on weighted incremental scoring.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Zhu et al. (dual-population) <span style="color:var(--dim);font-weight:400;font-size:13px">— Zhu et al. [810]</span></h4>
  <p style="margin:0;color:var(--muted)">An incremental score-based framework that updates the current structure with a dual-population evolutionary strategy, using chaos-based perturbations to keep the population diverse while editing parent sets. Based on evolutionary/score search.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Shao et al. (MCMC importance sampling) <span style="color:var(--dim);font-weight:400;font-size:13px">— Shao et al. [788]</span></h4>
  <p style="margin:0;color:var(--muted)">An online scheme that uses MCMC-based importance sampling to keep an informative subset of past cases, optimizes a candidate structure on that subset, and accepts or rejects updates via a Bayesian posterior criterion. Based on MCMC importance sampling.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Ekanayake &amp; Zois (batch-incremental) <span style="color:var(--dim);font-weight:400;font-size:13px">— Ekanayake and Zois [169]</span></h4>
  <p style="margin:0;color:var(--muted)">A simpler batch-incremental variant that, after each incoming batch, applies the single best edge edit that preserves acyclicity. Based on greedy single-edit updating.</p>
</div></div>

<div class="section"><h3>Online local discovery around a target variable (streaming features)</h3></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">DO-MBSF <span style="color:var(--dim);font-weight:400;font-size:13px">— Khan et al. [325]</span></h4>
  <p style="margin:0;color:var(--muted)">An online conditional-independence method that incrementally maintains the minimal Markov blanket of a target in high-dimensional feature streams, admitting strongly relevant features and pruning redundant ones as they appear. Based on online Markov-blanket discovery.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Li et al. (blanket with spouse recovery) <span style="color:var(--dim);font-weight:400;font-size:13px">— Li et al. [377]</span></h4>
  <p style="margin:0;color:var(--muted)">Maintains a candidate blanket using information-theoretic relevance screening, removes false positives with cheap conditional-dependence scores, and adds a spouse-recovery step to reinstate variables that earlier pruning was too aggressive about. Based on streaming Markov-blanket discovery.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">OMBGS <span style="color:var(--dim);font-weight:400;font-size:13px">— Li et al. [370]</span></h4>
  <p style="margin:0;color:var(--muted)">A batched streaming method that screens each incoming batch and then refines parent/child versus spouse relations across all observed features using conditional-independence tests. Based on batched Markov-blanket discovery.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">LCSLSF <span style="color:var(--dim);font-weight:400;font-size:13px">— You et al. [753]</span></h4>
  <p style="margin:0;color:var(--muted)">First builds an approximate local blanket for a target by filtering irrelevant and redundant features, then orients the local neighbourhood with conditional-independence tests and Meek's rules as variables appear. Based on local CI testing plus Meek orientation.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Liu et al. (block-by-block blanket) <span style="color:var(--dim);font-weight:400;font-size:13px">— Liu et al. [402]</span></h4>
  <p style="margin:0;color:var(--muted)">For streaming <i>data</i> rather than streaming variables, learns and updates the Markov boundary of a class variable block-by-block, summarizing past data in a dynamic AD-tree and alternating forward inclusion and backward elimination tests to keep the boundary consistent with accumulated evidence. Based on dynamic AD-trees.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">CSBS <span style="color:var(--dim);font-weight:400;font-size:13px">— CSBS [240]</span></h4>
  <p style="margin:0;color:var(--muted)">Updates each new variable with a grow–shrink-style procedure that adds dependent neighbours then removes redundant ones under conditioning, producing blankets that together form an undirected skeleton; a greedy edge-orientation step then searches only within it. Based on grow–shrink blanket learning.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">CSSU <span style="color:var(--dim);font-weight:400;font-size:13px">— CSSU [735]</span></h4>
  <p style="margin:0;color:var(--muted)">Operates in a streaming-feature setting, first filtering candidate relations with an information-theoretic criterion, pruning indirect links with a dominance test, and orienting the remaining skeleton with a greedy search under a decomposable score. Based on streaming feature filtering.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">CDFSF <span style="color:var(--dim);font-weight:400;font-size:13px">— Guo et al. [759]</span></h4>
  <p style="margin:0;color:var(--muted)">Alternates growing and shrinking phases to update parent–child candidates and then orients edges as features stream in. Based on grow/shrink candidate updating.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Guo et al. (bootstrap aggregation) <span style="color:var(--dim);font-weight:400;font-size:13px">— Guo et al. [239]</span></h4>
  <p style="margin:0;color:var(--muted)">To stabilize local-to-global procedures under noisy data, aggregates skeletons over bootstrap resamples, keeps only stable adjacencies, and orients them with a final greedy refinement. Based on bootstrap-aggregated skeletons.</p>
</div></div>

<div class="section"><h3>Estimating an undirected dependence structure (orientation done separately)</h3></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Love et al. <span style="color:var(--dim);font-weight:400;font-size:13px">— Love et al. [436]</span></h4>
  <p style="margin:0;color:var(--muted)">Recovers a skeleton from pairwise similarities by either thresholding a similarity matrix or extracting a maximum-weight spanning tree. Based on similarity thresholding.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Sun et al. (copula association) <span style="color:var(--dim);font-weight:400;font-size:13px">— Sun et al. [612]</span></h4>
  <p style="margin:0;color:var(--muted)">Estimates a full association matrix using copula-based entropy and then algebraically deconvolves it to isolate direct links before thresholding. Based on copula entropy.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Wang et al. (two-stage sparse regression) <span style="color:var(--dim);font-weight:400;font-size:13px">— Wang et al. [684]</span></h4>
  <p style="margin:0;color:var(--muted)">A two-stage estimator: a structurally adaptive sparse regression first selects neighbourhoods under multicollinearity, then conditional-independence tests prune spurious edges. Based on sparse regression plus CI tests.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Liu et al. (mutual-information screening) <span style="color:var(--dim);font-weight:400;font-size:13px">— Liu et al. [418]</span></h4>
  <p style="margin:0;color:var(--muted)">Combines a mutual-information screening step with low-order conditional-independence tests restricted to a fixed neighbourhood radius to build an undirected independence graph. Based on mutual information.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Nadendla et al. (joint-entropy gate) <span style="color:var(--dim);font-weight:400;font-size:13px">— Nadendla et al. [482]</span></h4>
  <p style="margin:0;color:var(--muted)">Modifies mutual-information edge selection with a joint-entropy gate that removes treatment–confounder–outcome triangles, yielding a confounder-attenuated DAG. Based on mutual information with an entropy gate.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Ma et al. (learned skeleton classifiers) <span style="color:var(--dim);font-weight:400;font-size:13px">— Ma et al. [442]</span></h4>
  <p style="margin:0;color:var(--muted)">A supervised route to skeleton recovery: generates labelled "vicinal" graphs by perturbing a proxy structure, simulates data, and trains classifiers that decide adjacencies from simple CI and local-graph features. Based on supervised learning over simulated graphs.</p>
</div></div>

<div class="section"><h3>Bayesian inference &amp; probabilistic generation over graphs</h3></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">DAG-GFlowNet <span style="color:var(--dim);font-weight:400;font-size:13px">— Deleu et al. [153]</span></h4>
  <p style="margin:0;color:var(--muted)">Replaces traditional posterior samplers with a Generative Flow Network trained to construct graphs edge-by-edge, rewarding each completed DAG by its Bayesian score; after training it produces independent DAG samples whose distribution tracks the posterior. Based on Generative Flow Networks.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Gao, Shen &amp; Xia (adversarial) <span style="color:var(--dim);font-weight:400;font-size:13px">— Gao, Shen, and Xia [212]</span></h4>
  <p style="margin:0;color:var(--muted)">Casts causal discovery as a two-player game: a generator implements a nonlinear structural-equation model with an acyclicity-regularized adjacency matrix, and a critic matches real and generated samples via a kernel discrepancy, so the game equilibrium recovers the true DAG. Based on adversarial / GAN-style training.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Structure Learning Trees (SLTs) <span style="color:var(--dim);font-weight:400;font-size:13px">— Oates and Mukherjee [501]</span></h4>
  <p style="margin:0;color:var(--muted)">A hierarchical Bayesian model for jointly learning multiple related graphs connected by a known tree, solved exactly via belief propagation to obtain posterior edge probabilities for each task. Based on hierarchical Bayesian inference.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">LDAGs (labeled DAGs) <span style="color:var(--dim);font-weight:400;font-size:13px">— Pensar et al. [531]</span></h4>
  <p style="margin:0;color:var(--muted)">A Bayesian framework combining an LDAG-specific marginal likelihood with a structural prior over labeling complexity, searched with a hybrid that mixes non-reversible MCMC proposals and greedy hill climbing. Based on labeled-DAG Bayesian inference.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Eggeling et al. (sparsity prior) <span style="color:var(--dim);font-weight:400;font-size:13px">— Eggeling et al. [168]</span></h4>
  <p style="margin:0;color:var(--muted)">Studies how to encode sparsity preferences as priors by counting how many graphs belong to each sparsity pattern, and proposes a search-space-maximization scheme that adjusts scores for the size of the explored space. Based on prior design over sparsity patterns.</p>
</div></div>

<div class="section"><h3>Less standard combinatorial search strategies</h3></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">De et al. (reverse PC) <span style="color:var(--dim);font-weight:400;font-size:13px">— De et al. [151]</span></h4>
  <p style="margin:0;color:var(--muted)">Runs PC's logic in reverse: starts from an empty graph and iteratively adds arcs based on regression-style dependence tests. Based on PC, reversed.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Best Parents <span style="color:var(--dim);font-weight:400;font-size:13px">— Best Parents [347] / Tang and Srihari [623]</span></h4>
  <p style="margin:0;color:var(--muted)">Greedy schemes that build graphs incrementally by selecting locally strong parent sets or candidate edges while explicitly enforcing acyclicity during construction. Based on greedy parent-set selection.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">LCD <span style="color:var(--dim);font-weight:400;font-size:13px">— Cooper [126]</span></h4>
  <p style="margin:0;color:var(--muted)">A three-variable edge-orientation rule that infers X → Y from a characteristic dependence pattern over (W, X, Y) relative to a pre-specified root variable. Based on local constraint patterns.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">LCD (high-dimensional) <span style="color:var(--dim);font-weight:400;font-size:13px">— Versteeg and Mooij [657]</span></h4>
  <p style="margin:0;color:var(--muted)">Adapts Cooper's Local Causal Discovery to high-dimensional settings by preceding it with ℓ₂-boosting variable selection and allowing alternative independence tests. Based on LCD.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">GIT <span style="color:var(--dim);font-weight:400;font-size:13px">— THALJAOUI [631]</span></h4>
  <p style="margin:0;color:var(--muted)">First eliminates weak dependencies to obtain an undirected acyclic graph, then orients edges using an entropy-based criterion. Based on entropy-driven pruning and orientation.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Ko, Lim &amp; Kim (monotonicity) <span style="color:var(--dim);font-weight:400;font-size:13px">— Ko, Lim, and Kim [336]</span></h4>
  <p style="margin:0;color:var(--muted)">A score-based pipeline with a monotonicity heuristic: estimates pairwise causal influence, discards relations that violate an empirical influence-decay rule from parent to distant ancestors, and merges the rest into an acyclic graph. Based on score search with an influence heuristic.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Physarum Learner <span style="color:var(--dim);font-weight:400;font-size:13px">— Physarum Learner [572, 577]</span></h4>
  <p style="margin:0;color:var(--muted)">Starts from a dense correlation-weighted graph and uses a Physarum (slime-mold)-inspired solver to identify and score indirect pathways before selecting and orienting edges under cycle-avoidance thresholds. Based on bio-inspired network optimization.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Wang et al. (annealing loop) <span style="color:var(--dim);font-weight:400;font-size:13px">— Wang et al. [681]</span></h4>
  <p style="margin:0;color:var(--muted)">A two-level simulated annealing scheme that nests an inner annealing local optimizer over edge edits inside an outer annealing loop, aiming to escape local optima. Based on simulated annealing.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Elidan et al. (data perturbation) <span style="color:var(--dim);font-weight:400;font-size:13px">— Elidan et al. [173]</span></h4>
  <p style="margin:0;color:var(--muted)">Escapes local optima by perturbing the <i>data</i>: repeatedly reweights training cases on a temperature schedule, runs a standard local optimizer on the reweighted objective, and anneals the weights back to uniformity using random and adversarial reweighting strategies. Based on data-perturbation search.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Benjumeda et al. (elimination trees) <span style="color:var(--dim);font-weight:400;font-size:13px">— Benjumeda et al. [51]</span></h4>
  <p style="margin:0;color:var(--muted)">Recasts score-based learning as a search over elimination orders represented by elimination trees, updating candidates via local rotations while pruning those that exceed a width bound. Based on elimination-tree search.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Carvalho &amp; Oliveira (branching backbone) <span style="color:var(--dim);font-weight:400;font-size:13px">— Carvalho and Oliveira [86]</span></h4>
  <p style="margin:0;color:var(--muted)">Fixes an optimal branching as a backbone and then selects, for each node, the best parent set among its branching ancestors, yielding a polynomial-time search restricted to DAGs consistent with that initial tree. Based on optimal branching.</p>
</div></div>

<div class="section"><h3>Scalability &amp; parallel learning on large datasets</h3></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Nikolova &amp; Aluru (parallel) <span style="color:var(--dim);font-weight:400;font-size:13px">— Nikolova and Aluru [496]</span></h4>
  <p style="margin:0;color:var(--muted)">Decomposes the optimization into parallel per-variable tasks: a first phase builds a supercluster of promising candidate parents for each node, and a second phase searches these reduced spaces exactly and in parallel before combining the locally optimized families into an acyclic graph. Based on parallel per-variable optimization.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">ABNL <span style="color:var(--dim);font-weight:400;font-size:13px">— Tang et al. [627]</span></h4>
  <p style="margin:0;color:var(--muted)">Adaptive Bayesian Network Learning grows a reservoir sample until the learned structure stabilizes, runs multiple base learners in parallel on the selected partition, and forms a consensus DAG by thresholding edge frequencies and breaking residual cycles by removing the least-supported arcs. Based on reservoir sampling and ensemble consensus.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">SRPM <span style="color:var(--dim);font-weight:400;font-size:13px">— Yang, Lu, and Kuai [738]</span></h4>
  <p style="margin:0;color:var(--muted)">For big nonlinear data, repeatedly learns on fixed-size subsamples, adjusts each subsample's influence with a reward–punishment rule that encourages agreement with emerging edges, and merges the outputs of multiple additive-noise-model learners into a consensus network. Based on subsample ensembling with reward–punishment.</p>
</div></div>

<div class="section"><h3>Nonstandard distributions &amp; latent structure</h3></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Hobæk Haff et al. (vine copula) <span style="color:var(--dim);font-weight:400;font-size:13px">— Hobæk Haff et al. [250]</span></h4>
  <p style="margin:0;color:var(--muted)">Learns DAGs for continuous, non-Gaussian data by fitting a regular-vine pair-copula model, truncating and pruning the vine, translating the result into a chordal undirected graph, and orienting it into a DAG whose conditional densities are expressed through the vine's bivariate copulas. Based on vine copulas.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Tenzer et al. (clustered latents) <span style="color:var(--dim);font-weight:400;font-size:13px">— Tenzer et al. [628]</span></h4>
  <p style="margin:0;color:var(--muted)">Extends hidden-variable discovery to copula-based models by clustering variables whose quasi-ideal parent profiles align, introducing one latent per cluster, and refining both parameters and edges via a structural EM loop. Based on copula models with latent clusters.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Qiao et al. (hidden compact representation) <span style="color:var(--dim);font-weight:400;font-size:13px">— Qiao et al. [541]</span></h4>
  <p style="margin:0;color:var(--muted)">A multivariate hidden compact representation in which each parent–child mechanism factors through a low-cardinality hidden state, optimized by alternating closed-form parameter updates with greedy structural changes. Based on hidden compact representations.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">IB-EM <span style="color:var(--dim);font-weight:400;font-size:13px">— Elidan [171]</span></h4>
  <p style="margin:0;color:var(--muted)">Augments structural EM with an information-bottleneck term to reduce sensitivity to poor local optima when learning with hidden variables. Based on structural EM plus the information bottleneck.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">LPCC <span style="color:var(--dim);font-weight:400;font-size:13px">— Asbeh and Lerner [26, 27]</span></h4>
  <p style="margin:0;color:var(--muted)">Compares large clusters of samples to infer patterns of co-variation, introduces latent variables and colliders in a first stage, then uses higher-order cluster comparisons to distinguish additional latent types and complete edge orientation under cluster-coherence assumptions. Based on cluster-comparison latent discovery.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">McDSL <span style="color:var(--dim);font-weight:400;font-size:13px">— Chen et al. [100]</span></h4>
  <p style="margin:0;color:var(--muted)">For multiple-cause settings, combines an initial screening of candidate causes with a subsequent rule-based orientation step. Based on candidate screening plus rule orientation.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">RINN <span style="color:var(--dim);font-weight:400;font-size:13px">— Young et al. [755]</span></h4>
  <p style="margin:0;color:var(--muted)">The Redundant Input Neural Network, in which each hidden layer receives both previous activations and the original inputs, and sparsity-inducing regularization encourages interpretable connectivity; nonzero weights among latent units are then treated as candidate causal links among unobserved variables. Based on regularized neural networks.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Liao (relational, 3NF) <span style="color:var(--dim);font-weight:400;font-size:13px">— Liao [394]</span></h4>
  <p style="margin:0;color:var(--muted)">Exploits functional dependencies mined from relational data in third normal form, mapping each dependency X → Y directly to a parent set, then estimating the associated conditional distributions from the same tables. Based on relational functional dependencies.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">MLBN <span style="color:var(--dim);font-weight:400;font-size:13px">— Wu et al. [706]</span></h4>
  <p style="margin:0;color:var(--muted)">Builds a Bayesian network with multiple latent variables by learning a small network for each latent variable, merging them into one graph, and adjusting connections under stated constraints, with an incremental update that uses a node-level variation degree to update only changed subgraphs. Based on per-latent subnetwork merging.</p>
</div></div>

<div class="section"><h3>Specialized information sources &amp; sub-problems</h3></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Bello &amp; Honorio (path-query oracle) <span style="color:var(--dim);font-weight:400;font-size:13px">— Bello and Honorio [48]</span></h4>
  <p style="margin:0;color:var(--muted)">Assumes access to a path-query oracle that reports whether a directed path exists between two variables, uses these queries to recover a topological order, and identifies direct edges by checking whether a path vanishes when intermediate nodes are masked; with bounded indegree it bounds both query complexity and the interventional samples needed. Based on path-query oracles.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Ben-David &amp; Sabato (active learning) <span style="color:var(--dim);font-weight:400;font-size:13px">— Ben-David and Sabato [49]</span></h4>
  <p style="margin:0;color:var(--muted)">Studies active learning when each sample reveals only a bounded number of variable values, and designs an interactive algorithm that adaptively chooses which subsets to observe across rounds while guaranteeing, under an indegree constraint, a near-optimal score with high probability. Based on active learning under observation budgets.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Safaeian et al. (DP orientation) <span style="color:var(--dim);font-weight:400;font-size:13px">— Safaeian et al. [565]</span></h4>
  <p style="margin:0;color:var(--muted)">Revisits the orientation step by rewriting Meek's rules as Meek functions and solving the resulting causal-orientation problem on a given skeleton with a dynamic-programming pass. Based on Meek's rules plus dynamic programming.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Wang &amp; Chan (regression skeleton) <span style="color:var(--dim);font-weight:400;font-size:13px">— Wang and Chan [691]</span></h4>
  <p style="margin:0;color:var(--muted)">Combines a regression-style skeleton estimation for linear structural-equation models with Markov-blanket information to restrict the conditional-independence tests used during pruning and orientation. Based on regression-based skeletons.</p>
</div></div>

<div class="section"><h3>Quantum &amp; quantum-inspired formulations</h3></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">O'Gorman et al. (QUBO / annealing) <span style="color:var(--dim);font-weight:400;font-size:13px">— O'Gorman et al. [503, 504]</span></h4>
  <p style="margin:0;color:var(--muted)">Maps score-based structure learning to a quadratic unconstrained binary optimization (QUBO) with penalty terms enforcing bounded indegree and acyclicity via an encoded topological order, enabling quantum-annealing-based search. Based on QUBO / quantum annealing.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Soloviev et al. (QAOA) <span style="color:var(--dim);font-weight:400;font-size:13px">— Soloviev et al. [182]</span></h4>
  <p style="margin:0;color:var(--muted)">Follows a similar QUBO encoding but applies the quantum approximate optimization algorithm (QAOA), using a risk-sensitive evaluation of sampled bitstrings to spot a high-scoring graph in a hybrid loop. Based on QAOA.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Ohno (quantum generative model) <span style="color:var(--dim);font-weight:400;font-size:13px">— Ohno [505]</span></h4>
  <p style="margin:0;color:var(--muted)">Trains a parameterized quantum generative model whose samples directly represent candidate DAGs, optimized against a constraint-augmented score. Based on quantum generative modeling.</p>
</div></div>

<div class="section"><h3>Deployment &amp; meta-level concerns</h3></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">BAFL <span style="color:var(--dim);font-weight:400;font-size:13px">— Alsuwat [21]</span></h4>
  <p style="margin:0;color:var(--muted)">Bayesian Adversarial Federated Learning: observing that data-poisoning attacks alter PC's convergence behaviour (its CI-driven edge removal and orientation steps), it uses this deviation as a signal of tampering and models contributions from multiple parties probabilistically, then applies an optimization-based decision rule and PC convergence diagnostics to filter suspicious data before learning. Based on PC plus federated adversarial detection.</p>
</div></div>

<div class="section"><div class="card">
  <h4 style="margin:0 0 6px">Malone et al. (meta-problem) <span style="color:var(--dim);font-weight:400;font-size:13px">— Malone et al. [452]</span></h4>
  <p style="margin:0;color:var(--muted)">Examines the meta-problem of predicting the computational hardness of exact Bayesian-network structure learning: it generates benchmark instances spanning a wide range of sizes, densities, and data, then relates features of an instance to the search, scoring, and CI-testing workload it implies. Based on empirical hardness modeling.</p>
</div></div>
` };
