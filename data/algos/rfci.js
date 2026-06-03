/* RFCI — Really Fast Causal Inference. Grounded in §4.30 (pp.157-158).
   Builds on FCI (§4.4). Key idea: keep FCI's PC-style adjacency search but
   SKIP the expensive Possible-D-Sep phase; restore soundness with a handful of
   cheap, targeted CI checks before orienting colliders (Step 2) and applying the
   discriminating-path rule (Step 4). Worked examples = Fig.91 (decisive CI shows
   up in the triple/DP checks → RFCI matches FCI) and Fig.92 (it never shows up →
   RFCI keeps a bidirected X1↔X5 that FCI would delete). PAG/MAG marks reuse FCI. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["rfci"] = {
  name: "Really Fast Causal Inference (RFCI)",
  oneLiner: "A faster cousin of FCI for data with hidden confounders: it learns the skeleton with PC-style independence tests but SKIPS FCI's costly Possible-D-Sep pruning, instead running a few cheap extra CI checks right before it orients a collider or a discriminating path — so it stays sound while running far faster on large, dense graphs.",
  basedOnText: "RFCI keeps everything that makes FCI work in the presence of latent (unobserved) common causes, but removes FCI's most expensive step. It still outputs a PAG; that PAG is guaranteed sound (its ancestral relations are correct) but may be slightly less informative than FCI's.",

  assumptions: [
    "<b>Faithfulness</b> — every (conditional) independence in the data reflects a missing connection in the true causal structure, not an accidental cancellation.",
    "<b>Reliable CI tests</b> — independence is decided by a statistical test (or, in theory, a perfect 'oracle' CI test).",
    "<b>NO causal sufficiency required</b> — like FCI (and unlike PC), RFCI explicitly allows hidden/latent common causes and selection variables."
  ],
  input: "A dataset over the observed variables O and a conditional-independence (CI) test.",
  output: "A <b>PAG</b> (partial ancestral graph) with circle/arrowhead/tail endpoint marks, representing a Markov-equivalence class of MAGs. A bidirected edge A↔B flags a latent common cause. The PAG is <b>sound</b> (no false arrowheads or tails) but may be <b>incomplete</b> — a few extra undirected/bidirected edges that FCI would have removed can remain.",

  idea: [
    "FCI is correct in the latent-variable setting, but its completeness comes from exploring large conditioning sets inside <b>Possible-D-Sep</b> — a pool that can blow up exponentially. RFCI's whole design is to <i>avoid that phase entirely</i> and recover the soundness it gives up with cheaper, very local checks.",
    "RFCI keeps FCI's PC-style first phase verbatim: start from the complete graph (every edge drawn ∘–∘) and delete a pair's edge whenever conditioning on some subset of <i>current adjacencies</i> makes them independent. This sparse skeleton is all RFCI ever computes — it never builds Possible-D-Sep sets.",
    "The catch: skipping Possible-D-Sep means some edges survive that FCI would have removed, and a naive orientation could then create a <b>false collider</b> (a wrong arrowhead). RFCI patches exactly the two places where that danger lives. Before orienting a v-structure, and before applying the discriminating-path rule, it runs a small number of <i>extra, targeted CI tests</i> to confirm the configuration is real.",
    "<b>Refined collider orientation (RFCI's centerpiece).</b> For an unshielded triple X ∗–∗ Z ∗–∗ Y with X, Y non-adjacent, RFCI does NOT immediately mark Z a collider. It first verifies that neither incident edge can be deleted using the separating set with Z removed — it tests X⫫Y given U\\{Z} and Z⫫Y given U\\{Z}. Only if BOTH dependencies still hold does it orient X ∗→ Z ←∗ Y; if a test fails, the offending edge is deleted (with a minimal sepset stored) and no false collider is created.",
    "<b>Refined discriminating-path rule (R4).</b> RFCI finds a <i>shortest</i> discriminating path and checks every edge along it is indispensable (each X_i⫫X_{i+1} test fails for all relevant Z). If a dependence fails, it deletes that edge instead of orienting; otherwise it applies the usual R4 decision. The remaining FCI rules R1–R10 then run as normal.",
    "The trade-off is explicit: when the decisive CI happens to appear inside these triple/discriminating-path checks, RFCI matches FCI exactly (paper Fig.91). When it never surfaces there, RFCI simply does not perform that deletion and keeps an extra (e.g. bidirected) edge — still sound, just less informative (Fig.92)."
  ],

  steps: [
    "<b>Initialise.</b> Connect every pair of observed variables with an edge bearing two circle marks (∘–∘). Set conditioning-set size ℓ = 0.",
    "<b>PC-style skeleton (Steps 0–1, exactly as FCI).</b> Growing ℓ = 0,1,2,…, for each adjacent pair (X,Y) test independence conditioning on subsets of size ℓ from the current adjacencies of X (excluding Y). When a subset makes X⫫Y, delete the edge and store it as Sep(X,Y).",
    "<b>SKIP Possible-D-Sep.</b> This is the FCI phase RFCI omits: it never builds Possible-D-Sep(X,Y) and never re-tests over it. This is where the speed comes from — RFCI prunes only when an edge is forced to be deleted anyway, via the local checks below.",
    "<b>Refined collider orientation (Step 2).</b> For each unshielded triple X ∗–∗ Z ∗–∗ Y (X,Y non-adjacent), BEFORE marking Z a collider, verify both incident edges are indispensable: test X⫫Y | U_{X,Y}\\{Z} and Z⫫Y | U_{X,Y}\\{Z}. If both dependencies hold, orient X ∗→ Z ←∗ Y. If a test reveals independence, delete the failing edge and store a minimal sepset (no false collider is created).",
    "<b>Refined discriminating-path rule (Step 4 / R4).</b> Find a shortest discriminating path (X_n,…,X_{n-2},X_{n-1},X_n) for the node in question and check every edge (X_i,X_{i+1}) along it is indispensable (each X_i⫫X_{i+1} test fails for all Z ⊆ U on the path). If a dependence fails, delete that edge and store a minimal sepset; otherwise apply the usual R4 collider/non-collider decision.",
    "<b>Apply the remaining FCI rules (R1–R10).</b> With colliders and discriminating paths settled, run the standard FCI orientation rules to turn circles into arrowheads or tails wherever the marks are logically forced.",
    "<b>Return the PAG.</b> Forced ends become arrowheads/tails; remaining circles stay undetermined. The result is a sound PAG — possibly incomplete (extra undirected/bidirected edges may remain that FCI would have removed)."
  ],

  keyConcepts: [
    { term: "Possible-D-Sep (the skipped phase)", def: "FCI's enlarged conditioning pool, recomputed after the skeleton pass. Building and re-testing over it can be exponential. RFCI's defining move is to NOT compute it at all." },
    { term: "Refined collider check", def: "Before orienting an unshielded triple X–Z–Y as a collider, RFCI runs the extra tests X⫫Y | U\\{Z} and Z⫫Y | U\\{Z}. Only if both still show dependence is the collider oriented; this guards against false colliders caused by a separating set that a missed CI test left incomplete." },
    { term: "Minimal sepset", def: "When a refined check reveals independence, the offending edge is deleted and the smallest conditioning set witnessing that independence is stored, so later steps stay consistent." },
    { term: "Refined R4 (discriminating path)", def: "RFCI takes the SHORTEST discriminating path and confirms every edge on it is indispensable before applying the standard collider/non-collider orientation; a failing edge is deleted instead." },
    { term: "Sound but possibly incomplete PAG", def: "All arrowheads and tails RFCI outputs are correct (sound). But because it skips Possible-D-Sep, it may leave extra undirected/bidirected edges that FCI would have removed (incomplete)." },
    { term: "Endpoint marks ∘ , &gt; , —", def: "As in FCI: a circle is undetermined, an arrowhead means 'not an ancestor of the other node', a tail means 'is an ancestor'. A bidirected edge A↔B (arrowheads both ends) signals a latent common cause." }
  ],

  animation: {
    title: "RFCI on the paper's 6-variable example with latents L1, L2 (Fig.91): X2,X3,X4→X6, X3→X2, X3→X4, plus L1 confounding {X2,X5} and L2 confounding {X4,X1}. RFCI skips Possible-D-Sep and confirms each collider with extra CI checks.",
    nodes: [
      { id: "X6", x: 0.50, y: 0.06 },
      { id: "X3", x: 0.50, y: 0.34 },
      { id: "X2", x: 0.24, y: 0.55 },
      { id: "X4", x: 0.76, y: 0.55 },
      { id: "X1", x: 0.24, y: 0.92 },
      { id: "X5", x: 0.76, y: 0.92 }
    ],
    edges: [
      { from: "X6", to: "X3", type: "circ-circ" }, { from: "X6", to: "X2", type: "circ-circ" },
      { from: "X6", to: "X4", type: "circ-circ" }, { from: "X3", to: "X2", type: "circ-circ" },
      { from: "X3", to: "X4", type: "circ-circ" }, { from: "X2", to: "X4", type: "circ-circ" },
      { from: "X2", to: "X1", type: "circ-circ" }, { from: "X2", to: "X5", type: "circ-circ" },
      { from: "X4", to: "X1", type: "circ-circ" }, { from: "X4", to: "X5", type: "circ-circ" },
      { from: "X1", to: "X5", type: "circ-circ" }
    ],
    steps: [
      { caption: "<b>Start (Step 0).</b> Like FCI, RFCI begins from the complete graph on the observed variables {X1,…,X6}, every edge drawn ∘–∘. The hidden truth: X2,X3,X4 → X6; X3 → X2 and X3 → X4; latent L1 is a common cause of X2 and X5, latent L2 of X4 and X1. The latents are NOT in the data — RFCI must explain the dependence they leave behind.", ops: [{ op: "badge", text: "ℓ = 0", kind: "info" }] },
      { caption: "<b>PC-style skeleton (Step 1).</b> Conditioning on small neighbour sets screens off the non-adjacent pairs. For example X1⫫X3 | {X2} and X5⫫X3 | {X4}: delete X1–X3 and X3–X5 (here only the leftover edges of the complete graph are pruned). Separating sets are stored.", ops: [{ op: "badge", text: "ℓ = 1", kind: "info" }, { op: "testCI", x: "X1", y: "X3", z: ["X2"], result: "indep" }, { op: "testCI", x: "X5", y: "X3", z: ["X4"], result: "indep" }] },
      { caption: "<b>End of PC-style pass.</b> RFCI keeps the sparse skeleton: X6–X3, X6–X2, X6–X4, X3–X2, X3–X4, X2–X4, X2–X1, X4–X5, and X1–X5 (the latents L1, L2 leave dependences that the neighbour-only search cannot resolve). This sparse skeleton is ALL RFCI will ever compute.", ops: [{ op: "badge", text: "skeleton (PC) done", kind: "good" }, { op: "highlightEdges", edges: [["X1", "X5"], ["X2", "X1"], ["X4", "X5"]], cls: "hl" }] },
      { caption: "<b>SKIP Possible-D-Sep — the speed win.</b> This is exactly where FCI would now build a big Possible-D-Sep pool for every still-adjacent pair and re-test over its subsets (potentially exponential). RFCI does NOT. It moves straight to orientation and prunes only when a local check forces it.", ops: [{ op: "badge", text: "no Possible-D-Sep — saves time", kind: "warn" }] },
      { caption: "<b>Refined collider check (Step 2) — RFCI's centerpiece.</b> Look at the unshielded triple X2 ∘–∘ X6 ∘–∘ X4 (X2,X4 are adjacent here, so skip) and instead the genuine unshielded triple X1 ∘–∘ X2 ∘–∘ X6 with X1,X6 non-adjacent. BEFORE orienting, RFCI runs the EXTRA checks that FCI skips: confirm both incident edges are indispensable.", ops: [{ op: "highlightNodes", ids: ["X1", "X2", "X6"], cls: "hl" }, { op: "highlightEdges", edges: [["X2", "X1"], ["X6", "X2"]], cls: "hl" }] },
      { caption: "<b>Extra CI tests confirm the collider.</b> Test X1⫫X6 | U\\{X2} and X2⫫X6 | U\\{X2}. Both come back DEPENDENT — neither edge can be deleted by the separating set minus X2 — so the triple is a real collider. Only NOW does RFCI orient X1 ∗→ X2 ←∗ X6.", ops: [{ op: "testCI", x: "X1", y: "X6", z: [], result: "dep" }, { op: "testCI", x: "X2", y: "X6", z: [], result: "dep" }, { op: "orient", from: "X1", to: "X2", type: "circ-arrow" }, { op: "orient", from: "X6", to: "X2", type: "circ-arrow" }, { op: "badge", text: "collider confirmed by extra check", kind: "good" }] },
      { caption: "<b>Confirm the X6 collider too.</b> The same refined check on X2 ∘–∘ X6 ∘–∘ X4 path into X6: extra tests keep both dependences, so RFCI orients arrowheads into X6 — X2 ∗→ X6 ←∗ X4 and X3 ∗→ X6. Each is gated by its own cheap CI confirmation, never by Possible-D-Sep.", ops: [{ op: "highlightNodes", ids: ["X6"], cls: "hl" }, { op: "testCI", x: "X2", y: "X4", z: ["X3"], result: "dep" }, { op: "orient", from: "X2", to: "X6", type: "circ-arrow" }, { op: "orient", from: "X4", to: "X6", type: "circ-arrow" }, { op: "orient", from: "X3", to: "X6", type: "circ-arrow" }] },
      { caption: "<b>FCI rules R1–R10.</b> With colliders fixed, the standard rules propagate. X3 is an ancestor of X2 and X4, so the X3 ends get tails: X3 → X2 and X3 → X4. No rule introduces a false mark because every collider was pre-confirmed.", ops: [{ op: "highlightEdges", edges: [["X3", "X2"], ["X3", "X4"]], cls: "hl" }, { op: "orient", from: "X3", to: "X2", type: "directed" }, { op: "orient", from: "X3", to: "X4", type: "directed" }] },
      { caption: "<b>Latent confounders ⇒ bidirected edges.</b> The dependence between X2 and X5 (caused by hidden L1) and between X4 and X1 (hidden L2) cannot be explained by any direct orientation consistent with the arrowheads already placed. RFCI marks them bidirected: X2 ↔ X5 and X1 ↔ X4 — each flagging a latent common cause.", ops: [{ op: "highlightEdges", edges: [["X2", "X5"], ["X4", "X1"]], cls: "hl" }, { op: "orient", from: "X2", to: "X5", type: "bidirected" }, { op: "orient", from: "X4", to: "X1", type: "bidirected" }, { op: "badge", text: "latent common causes: X2↔X5, X1↔X4", kind: "warn" }] },
      { caption: "<b>Speed–completeness trade-off.</b> Here the decisive CI happened to surface inside the triple/discriminating-path checks, so RFCI's output MATCHES FCI exactly (paper Fig.91b). When such a CI never appears in those checks, RFCI simply does not make that deletion and keeps an extra bidirected edge (e.g. X1↔X5 in Fig.92) — still sound, just less informative.", ops: [{ op: "highlightEdges", edges: [["X1", "X5"]], cls: "hl" }, { op: "orient", from: "X1", to: "X5", type: "bidirected" }] },
      { caption: "<b>Result — a sound PAG, computed fast.</b> Arrowheads into X2 and X6, X3 → X2 and X3 → X4, and bidirected edges for the latents. Every arrowhead and tail is correct (sound). RFCI reached this WITHOUT ever computing Possible-D-Sep — the win that makes it 'really fast' on large, dense graphs.", ops: [{ op: "badge", text: "sound PAG returned (no Possible-D-Sep)", kind: "good" }] }
    ]
  },

  complexity: "Like PC/FCI, worst-case exponential in the largest node degree from the adjacency search, BUT RFCI removes FCI's Possible-D-Sep phase, whose conditioning pools can themselves be exponential. The replacement checks are a handful of cheap, local CI tests on unshielded triples and shortest discriminating paths, so RFCI is dramatically faster than FCI on large or dense graphs while remaining sound.",
  strengths: [
    "Much faster than FCI on large/dense graphs — it never builds the expensive Possible-D-Sep sets.",
    "Sound in the latent-variable setting: every arrowhead and tail it outputs is correct, given faithfulness and an oracle CI test.",
    "Uses only cheap, local CI tests (small conditioning sets), which are also more statistically reliable than FCI's large-conditioning-set tests."
  ],
  limitations: [
    "Possibly incomplete: skipping Possible-D-Sep means a few extra undirected/bidirected edges that FCI would remove can remain (Fig.92), so the PAG can be less informative.",
    "Still test-based, so still sensitive to CI-test errors — though it makes fewer, smaller-conditioning-set tests than FCI.",
    "The output PAG, like FCI's, can leave many circle marks undetermined."
  ],
  notes: "RFCI sits in the FCI family of latent-variable learners alongside <b>CFCI</b> (conservative FCI) and <b>FCI+</b>. Related work cited in §4.30: Rohekar et al.'s <i>Iterative Causal Discovery</i> (an anytime refinement that grows the conditioning radius until completeness is recovered), Chen et al.'s <b>lFCI</b> (bounded-size separating sets with a conditioning-size cap), and Ling et al.'s <b>LatentLCD</b> (a local, target-centric method that detects bidirected edges via collider checks to output a local MAG).",
  figureRefs: "Paper §4.30 (pp.157–158): the RFCI algorithm and its refinements of collider orientation (Step 2) and the discriminating-path rule R4; reuses FCI's MAG/PAG and orientation rules R1–R10 (§4.4). Worked examples: Fig.91 (decisive CI appears in the triple/DP checks → RFCI agrees with FCI) and Fig.92 (the key CI never appears → RFCI keeps a bidirected X1↔X5 that FCI would delete). The animation follows Fig.91's 6-variable graph with latents L1, L2."
};
