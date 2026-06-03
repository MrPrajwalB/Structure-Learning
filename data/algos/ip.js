/* IP — Ideal Parent (Elidan et al.). Grounded in §5.4 (pp.329-332):
   Definition 48 (linear-Gaussian CPD + residuals + ideal-parent profile y_X = e),
   the cosine-similarity ranking C(y_X,z), Example 99 + Fig.209/210 (four-node worked
   walk-through on X1 with residual/ideal-profile tables), Algorithm 95 (Compute
   ideal-parent rankings for a target X), Algorithm 96 (IP-HC: HC with ideal-parent
   pruning), Fig.208 (IP-HC iteration: only top-k additions per child entertained). */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["ip"] = {
  name: "Ideal Parent algorithm",
  oneLiner: "Speed up score-based structure search for continuous (linear-Gaussian) networks: for each variable, imagine the perfect extra parent that would best explain its leftover variation, then only test the few real variables most similar to that imagined ideal — instead of scoring every possible new edge.",
  basedOnText: "IP is a score-based / hybrid accelerator for continuous, parametric (linear-Gaussian) models. It keeps hill-climbing's score-guided search but replaces the brute-force scoring of every candidate parent with a cheap similarity ranking against a computed 'ideal parent' profile.",

  assumptions: [
    "<b>Continuous, parametric model</b> — each variable is a linear-Gaussian conditional of its parents: X = β₀ + Σⱼ βⱼ Xⱼ + ε with Gaussian noise ε ~ N(0, σ²) (Definition 48). The 'ideal parent' is defined relative to this parametric form.",
    "<b>A decomposable score</b> driving an underlying greedy/hill-climbing search (the parts IP plugs into) — adding a useful edge raises the score, a useless one does not.",
    "<b>Scoring each candidate edge is expensive</b> — every candidate parent requires re-fitting a regression, so the number of full score evaluations is the bottleneck IP attacks.",
    "<b>Acyclicity is enforced</b> — only edge additions that keep the graph a valid DAG are considered."
  ],
  input: "A dataset 𝒟 over continuous variables V, a current DAG 𝒢 with fitted linear-Gaussian CPDs, a decomposable score, and a shortlist size k.",
  output: "A locally-optimal DAG 𝒢 — but reached far faster, because at each step only the top-k most promising parent additions per variable are actually scored (Algorithm 96, IP-HC).",

  idea: [
    "Ordinary score-based search (like hill climbing) is slow on continuous networks because deciding whether to add an edge Z → X means <i>fitting a regression and computing a score for every candidate Z</i> — and there are many candidates for every variable, every iteration. IP asks a cheaper question first: <i>what would the ideal new parent of X even look like?</i>",
    "For a target variable X, fit X on its current parents and look at the <b>residuals</b> — the part of X that the current parents fail to explain, e^(m) = x^(m) − β₀ − Σⱼ βⱼ xⱼ^(m) for each data instance m. Stacking these into a vector gives the <b>ideal parent profile</b> y_X ≡ e (Definition 48): the exact signal a perfect extra parent would have to contribute to explain X's leftover variation completely.",
    "y_X is hypothetical — usually no real variable equals it. So IP <b>ranks the real candidate variables by similarity to this ideal</b>. The similarity is essentially the cosine angle between a candidate Z's data vector and the ideal profile, cos φ = (y_Xᵀ z) / (‖y_X‖ ‖z‖). A candidate that points the same way as the residual will explain that leftover variation well. Crucially this similarity uses only dot products and norms — it costs O(N) per candidate, far cheaper than fitting a full model.",
    "IP then only spends the expensive score evaluations on the <b>top-k</b> candidates from that ranking, and adds the best-scoring one (Algorithm 95 builds the ranking; Algorithm 96 / IP-HC drives the search with it). The cosine similarity provides a lower bound on the actual score improvement, so the ranking is a faithful, not arbitrary, shortlist. This 'ideal-parent guidance avoids scoring every candidate' is the whole point — it keeps the quality of greedy search while drastically cutting the number of costly fits (Fig. 208: only top-k additions per child are entertained)."
  ],

  steps: [
    "<b>Initialise.</b> Start from an initial DAG 𝒢 = 𝒢₀ with linear-Gaussian CPDs fitted to the data, and fix a shortlist size k (Algorithm 96, IP-HC).",
    "<b>Pick a target X and fit its current model.</b> Run the local regression of X on its current parents Pa_𝒢(X) to obtain the coefficients β̂ (Algorithm 95, line 1).",
    "<b>Compute the residuals.</b> For each data instance m, form the leftover e^(m) = x^(m) − β̂₀ − Σⱼ β̂ⱼ xⱼ^(m): the part of X the current parents cannot explain.",
    "<b>Form the ideal-parent profile.</b> Stack the residuals into the vector y_X ≡ e (Definition 48). This is the imagined perfect extra parent — the exact contribution that would best explain X's leftover variation.",
    "<b>Rank real candidates by similarity to the ideal.</b> For every legal candidate Z ∈ V \\ ({X} ∪ Pa_𝒢(X)), compute the cheap similarity score C(y_X, z) — the cosine alignment between Z's data column z and the ideal y_X — using only dot products and norms (Algorithm 95, lines 2–6).",
    "<b>Shortlist the top-k.</b> Sort candidates by decreasing similarity and keep only the k most ideal-like ones, 𝓡_X (Algorithm 95, line 7; Algorithm 96, line 4). Everything below the cut is never scored.",
    "<b>Score only the shortlist and add the best edge.</b> Run the full (expensive) score evaluation on the top-k candidate additions only; pick the one with the largest positive score gain and add that edge Z → X, keeping the graph acyclic (Algorithm 96, lines 6–7).",
    "<b>Repeat for every variable and iterate.</b> Do the same for each X ∈ V (also considering valid deletions/reversals as usual), apply the single best overall move, then recompute residuals and re-rank — because adding a parent changes X's residuals and therefore its next ideal profile.",
    "<b>Terminate.</b> When no shortlisted move improves the score for any variable, stop and return the resulting locally-optimal DAG 𝒢."
  ],

  keyConcepts: [
    { term: "Linear-Gaussian CPD", def: "Each variable is modelled as a linear combination of its parents plus Gaussian noise, X = β₀ + Σ βⱼXⱼ + ε (Definition 48). This parametric form is what lets IP define a precise 'ideal' parent." },
    { term: "Residual vector (e)", def: "What is left of X after its current parents have explained as much as they can: e^(m) = x^(m) − β̂₀ − Σ β̂ⱼxⱼ^(m) for each instance m. Large residuals mean the current parents fit poorly." },
    { term: "Ideal parent profile (y_X)", def: "The residual vector itself, y_X ≡ e — the hypothetical perfect extra parent whose signal would exactly account for X's unexplained variation. It is a target to match, not a real variable." },
    { term: "Similarity ranking C(y_X, z)", def: "A cheap measure (cosine alignment cos φ = y_Xᵀz / (‖y_X‖‖z‖), using only dot products and norms) of how closely a real candidate Z points along the ideal. It lower-bounds the true score gain, so it is a faithful surrogate for ranking." },
    { term: "Top-k shortlist (𝓡_X)", def: "Only the k candidates most similar to the ideal are kept and actually scored. Every other candidate edge is skipped entirely — the source of IP's speed-up." },
    { term: "IP-HC (Algorithm 96)", def: "Hill climbing with ideal-parent pruning: at each step it forms each variable's ranked candidate list, scores only the top-k additions, and applies the best move — keeping HC's quality while cutting the number of expensive fits." }
  ],

  animation: {
    title: "IP on the four-variable example {X1, X2, X3, X4} (paper Example 99, Fig. 209/210). Target X1 has unexplained residual variation; IP imagines its ideal parent, then adds the real variable most similar to it — without scoring every candidate.",
    nodes: [
      { id: "X1", label: "X1", x: 0.20, y: 0.30 },
      { id: "X2", label: "X2", x: 0.78, y: 0.16 },
      { id: "X3", label: "X3", x: 0.82, y: 0.62 },
      { id: "X4", label: "X4", x: 0.30, y: 0.84 }
    ],
    edges: [
      { from: "X2", to: "X1", type: "directed" }
    ],
    steps: [
      { caption: "<b>Current DAG.</b> The model so far has X2 → X1; X3 and X4 are not yet parents of X1. We will improve X1's fit. Normally HC would score adding <i>every</i> remaining candidate (X3, X4) as a parent of X1 — IP will avoid that.", ops: [{ op: "badge", text: "target: X1", kind: "info" }, { op: "highlightNodes", ids: ["X1"], cls: "hl" }, { op: "highlightEdges", edges: [["X2", "X1"]], cls: "hl" }] },
      { caption: "<b>Step 1 — fit X1 on its current parents.</b> Run the local linear-Gaussian regression of X1 on Pa(X1) = {X2} to get the coefficients β̂ (Algorithm 95, line 1).", ops: [{ op: "highlightNodes", ids: ["X1", "X2"], cls: "hl" }, { op: "badge", text: "regress X1 on {X2}", kind: "info" }] },
      { caption: "<b>Step 2 — compute the residuals.</b> For each data instance m, the leftover is e^(m) = x1^(m) − β̂₀ − β̂₂ x2^(m): the part of X1 that X2 alone cannot explain. These leftovers are still sizeable, so X1 is underfit.", ops: [{ op: "highlightNodes", ids: ["X1"], cls: "hl" }, { op: "score", text: "residuals e = (2.1, 4.3, …, 5.4)ᵀ — X1 underexplained" }] },
      { caption: "<b>Step 3 — form the ideal parent profile y_X1 ≡ e.</b> This imagined 'perfect' extra parent is exactly the residual vector: the contribution that would best explain X1's leftover variation (Definition 48). No real variable will equal it.", ops: [{ op: "highlightNodes", ids: ["X1"], cls: "hl" }, { op: "badge", text: "ideal parent y_X1 computed", kind: "good" }] },
      { caption: "<b>Step 4 — rank the REAL candidates by similarity to the ideal.</b> For each legal candidate (X3, X4) compute the cheap cosine alignment C(y_X1, z) = y_X1ᵀz / (‖y_X1‖‖z‖) — only dot products and norms, O(N) each (Algorithm 95).", ops: [{ op: "highlightNodes", ids: ["X3", "X4"], cls: "cand" }, { op: "set", name: "Candidate similarity", items: ["X3 : cos φ = 0.91 (most ideal-like)", "X4 : cos φ = 0.27"] }] },
      { caption: "<b>Shortlist the top-k.</b> Sort by similarity and keep only the top-k most ideal-like candidates (here k = 1 → {X3}). X4 ranks low, so it is <i>never scored</i> — this is where IP saves the expensive fits.", ops: [{ op: "highlightNodes", ids: ["X3"], cls: "hl" }, { op: "badge", text: "top-k shortlist 𝓡 = {X3}", kind: "good" }, { op: "set", name: "Candidate similarity", items: ["X3 : 0.91 ✓ shortlisted", "X4 : 0.27 ✗ pruned (not scored)"] }] },
      { caption: "<b>Score ONLY the shortlist.</b> Run the full (expensive) score evaluation just on X3 → X1. It gives a large positive gain — the cosine similarity lower-bounded exactly this kind of improvement.", ops: [{ op: "highlightNodes", ids: ["X3", "X1"], cls: "hl" }, { op: "score", text: "score(add X3→X1) : ΔBIC = +7.4 (only 1 fit, not 2)" }] },
      { caption: "<b>Add the best matching edge: X3 → X1.</b> The real variable most similar to X1's ideal parent becomes its new parent. X1 is now much better explained.", ops: [{ op: "addEdge", from: "X3", to: "X1", type: "directed" }, { op: "highlightEdges", edges: [["X3", "X1"]], cls: "hl" }, { op: "badge", text: "edge added via ideal-parent guidance", kind: "good" }, { op: "clearSet", name: "Candidate similarity" }] },
      { caption: "<b>Move to another target — X4.</b> Repeat the same recipe: fit X4 on its current parents (none yet), take the residuals, and form its ideal profile y_X4. Adding a parent to X1 doesn't change X4's residuals, so we compute them fresh.", ops: [{ op: "highlightNodes", ids: ["X4"], cls: "hl" }, { op: "badge", text: "target: X4 — ideal parent y_X4 computed", kind: "info" }] },
      { caption: "<b>Rank and shortlist for X4.</b> Compare candidates {X1, X2, X3} to y_X4 by cosine similarity. X2 aligns best and is shortlisted; the rest fall below the top-k cut and are skipped.", ops: [{ op: "highlightNodes", ids: ["X1", "X2", "X3"], cls: "cand" }, { op: "set", name: "Candidate similarity", items: ["X2 : cos φ = 0.85 ✓ shortlisted", "X1 : 0.31 ✗ pruned", "X3 : 0.12 ✗ pruned"] }] },
      { caption: "<b>Score the shortlist and add X2 → X4.</b> Only the top candidate is fitted; it improves the score, so the edge is added. Again most candidates were never scored.", ops: [{ op: "score", text: "score(add X2→X4) : ΔBIC = +3.9 (best)" }, { op: "addEdge", from: "X2", to: "X4", type: "directed" }, { op: "highlightEdges", edges: [["X2", "X4"]], cls: "hl" }, { op: "badge", text: "edge added", kind: "good" }, { op: "clearSet", name: "Candidate similarity" }] },
      { caption: "<b>Final DAG.</b> No shortlisted move improves any variable's score, so IP-HC stops. The structure X2→X1, X3→X1, X2→X4 was reached with far fewer expensive score evaluations than plain HC — because at every step only the top-k ideal-like candidates were ever scored (Fig. 208).", ops: [{ op: "highlightEdges", edges: [["X2", "X1"], ["X3", "X1"], ["X2", "X4"]], cls: "hl" }, { op: "badge", text: "local optimum — fewer fits than HC", kind: "good" }] }
    ]
  },

  complexity: "Per variable, computing the ideal profile and ranking all candidates costs only O(N) per candidate (dot products and norms) — much cheaper than fitting a regression for each. The expensive full-score evaluations are then limited to the top-k shortlist per variable, instead of all O(n) candidates, so the number of costly model fits per iteration drops from ~n to k. IP keeps the heuristic, locally-optimal nature of the underlying greedy search; it speeds it up rather than changing the optimum sought.",
  strengths: [
    "Drastically cuts the number of expensive score evaluations — only the top-k most promising parents per variable are ever fitted (Fig. 208).",
    "The similarity ranking is a principled surrogate (it lower-bounds the true score gain), so the shortlist is faithful, not a random heuristic.",
    "Slots into existing greedy / hill-climbing search (IP-HC, Algorithm 96) without changing the score being optimised.",
    "Well-suited to continuous, high-dimensional domains where per-edge fitting is the bottleneck."
  ],
  limitations: [
    "Tied to the parametric (linear-Gaussian) assumption — the ideal parent is defined relative to that model form.",
    "Approximate pruning: a genuinely good parent that is poorly aligned with the linear ideal could be ranked low and missed (the shortlist size k trades speed against completeness).",
    "Inherits the underlying greedy search's weaknesses — it still converges to a local, not necessarily global, optimum.",
    "Benefit shrinks when there are few candidates per variable, where scoring everything is already cheap."
  ],
  notes: "IP (Elidan et al.) is presented in §5.4 as an accelerator for score-based / hybrid structure learning of continuous networks: the same greedy search, but guided so that only the most promising edges are scored. The core construct is the residual-based ideal parent profile y_X ≡ e (Definition 48) and the cheap cosine-similarity ranking C(y_X, z) that requires only dot products and norms. Algorithm 95 builds the per-target ranking; Algorithm 96 (IP-HC) embeds it in hill climbing, scoring only the top-k additions per child.",
  figureRefs: "Paper §5.4 (pp.329–332): Definition 48 (linear-Gaussian CPD, residuals e, ideal parent profile y_X ≡ e), the similarity C(y_X, z) = y_Xᵀz / (‖y_X‖‖z‖); Algorithm 95 (Compute ideal-parent rankings for a target X), Algorithm 96 (IP-HC, HC with ideal-parent pruning), Fig. 208 (IP-HC iteration: only top-k additions per child entertained), Example 99 with Fig. 209/210 (four-node worked walk-through on X1: tables of x, residuals, and the ideal profile y_X1 used for similarity ranking)."
};
