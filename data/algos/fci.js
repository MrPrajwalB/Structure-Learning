/* FCI — Fast Causal Inference. Grounded in §4.4 (pp.37-49).
   Pseudocode = Algorithm 7 (p.45). Worked example = Fig.24 (true MAG / PC pass /
   Possible-D-Sep pruning / final PAG). MAG = Def.3, PAG = Def.4. Possible-D-Sep
   and path-restricted variant = Fig.25. Orientation rules R1/R2/R3 = Fig.26/27/28
   (R0 v-structures, R4 discriminating path = Thm.7/Recall 12). */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["fci"] = {
  name: "Fast Causal Inference (FCI)",
  oneLiner: "A constraint-based learner that, unlike PC, does NOT assume every common cause is observed: it learns a skeleton with independence tests, prunes extra edges using 'Possible-D-Separation' sets, then orients endpoint marks to output a PAG that explicitly admits hidden confounders.",
  basedOnText: "FCI extends PC to the setting with latent (unobserved) variables. Where PC targets the equivalence class of DAGs, FCI targets the equivalence class of MAGs — represented by a PAG — so it can flag edges produced by hidden common causes.",

  assumptions: [
    "<b>Faithfulness</b> — every (conditional) independence in the data reflects a missing connection in the true causal structure, not an accidental cancellation.",
    "<b>Reliable CI tests</b> — independence is decided by a statistical test (or, in theory, a perfect 'oracle' CI test).",
    "<b>NO causal sufficiency required</b> — this is the key relaxation: FCI explicitly allows hidden/latent common causes and (optionally) selection variables, which PC forbids."
  ],
  input: "A dataset over the observed variables O and a conditional-independence (CI) test.",
  output: "A <b>PAG</b> (partial ancestral graph): a graph whose edge <i>endpoints</i> carry marks — circle (∘ = undetermined), arrowhead (&gt;), or tail (—) — representing the whole Markov-equivalence class of MAGs consistent with the data. A bidirected edge A↔B signals a latent common cause.",

  idea: [
    "PC assumes there are no hidden confounders, so once two variables are screened off it deletes their edge and is done. But if an <i>unobserved</i> variable causes both X and Y, no set of <i>observed</i> variables can screen them off — the edge survives, yet it is not a direct cause. FCI is built to detect and label exactly these cases.",
    "To do this FCI changes <b>what a graph edge means</b>. Instead of plain directed/undirected edges it works with <b>MAGs</b> (maximal ancestral graphs), which summarise a DAG-with-latents over only the observed variables, and reports a <b>PAG</b>, which records what all data-equivalent MAGs agree on. Each edge end is a <i>mark</i>: a circle ∘ means 'could be either', an arrowhead means 'is not an ancestor of', and a tail means 'is an ancestor of'.",
    "<b>Phase 1 (initial skeleton):</b> exactly like PC — start from the complete graph (every edge drawn ∘–∘) and delete a pair's edge whenever conditioning on some subset of neighbours makes them independent, recording the separating set.",
    "<b>Phase 2 (Possible-D-Sep pruning):</b> with latents present, the neighbour-based search of PC can miss separating sets. FCI therefore recomputes, for each still-adjacent pair, a larger candidate pool called <b>Possible-D-Sep(X,Y)</b> and re-tests independence over its subsets. This removes additional spurious edges that PC would have kept (paper Fig.24c).",
    "<b>Phase 3 (orientation):</b> all surviving endpoints start as circles. FCI first orients <i>unshielded colliders</i>, then applies the FCI orientation rule set (R1–R4, later extended R5–R10) which turns circles into arrowheads or tails wherever the marks are logically forced — yielding the final PAG, possibly containing a bidirected edge."
  ],

  steps: [
    "<b>Initialise.</b> Connect every pair of observed variables with an edge bearing two circle marks (∘–∘). Set conditioning-set size ℓ = 0.",
    "<b>PC-style skeleton (Phase 1).</b> Growing ℓ = 0,1,2,…, for each adjacent pair (X,Y) test independence conditioning on subsets of size ℓ from the current adjacencies of X (excluding Y). When a subset makes X⫫Y, delete the edge and store it as Sep(X,Y). (Algorithm 7, lines for the adjacency search.)",
    "<b>Recompute Possible-D-Sep (Phase 2).</b> For each pair (X,Y) still adjacent, build Possible-D-Sep(X,Y): nodes reachable from X by a path on which every consecutive triple is either a collider or a (potential) triangle — the witnesses that can separate X,Y once latents are allowed. (A path-restricted variant keeps only nodes that lie on X–Y paths; Fig.25.)",
    "<b>Extra CI pruning.</b> Re-test X⫫Y conditioning on subsets of Possible-D-Sep(X,Y). If any subset makes them independent, delete the edge and update Sep(X,Y). This catches separations that PC's neighbour-only search missed (Fig.24c removes X–Y).",
    "<b>Reset marks.</b> Give every surviving edge two circle endpoints (∘–∘): nothing about direction is known yet.",
    "<b>Orient unshielded colliders (R0).</b> For every triple X ∘–∘ Z ∘–∘ Y with X,Y non-adjacent: if Z is NOT in Sep(X,Y), put arrowheads into Z, i.e. X ∗→ Z ←∗ Y. (Same logic as PC's v-structures, but on circle endpoints.)",
    "<b>R1.</b> If X ∗→ Z ∘–∘ Y with X,Y non-adjacent, orient Z → Y (the Z end gets a tail, the Y end an arrowhead) — otherwise an unwanted collider at Z would appear (Fig.26).",
    "<b>R2.</b> If X → Z ∗→ Y (or X ∗→ Z → Y) and X ∗–∘ Y, put an arrowhead at the Y end of the X–Y edge: X ∗→ Y — orienting it the other way would create a directed cycle (Fig.27).",
    "<b>R3.</b> If X ∗→ Z ←∗ Y, X ∗–∘ W ∘–∗ Y, X and Y non-adjacent, and W ∘–∗ Z, then put an arrowhead at the Z end: W ∗→ Z (Fig.28).",
    "<b>R4 (discriminating path).</b> Along a discriminating path for Z, use Sep to decide whether Z is a collider (arrowheads) or a non-collider (tail), per Theorem 7 / Recall 12.",
    "<b>Return the PAG.</b> Remaining circles stay undetermined; forced ends become arrowheads or tails. Any A↔B that emerges is read as 'a latent common cause of A and B' (Fig.24d)."
  ],

  keyConcepts: [
    { term: "Latent / hidden confounder", def: "An unobserved variable that causes two observed variables. It cannot be conditioned away, so it leaves a dependence FCI must explain — typically with a bidirected edge." },
    { term: "MAG (maximal ancestral graph)", def: "Paper Def.3. A graph over only the observed variables that summarises a DAG-with-latents: it keeps ancestor relations and adds bidirected edges where a latent common cause exists; every non-adjacent pair is separable." },
    { term: "PAG (partial ancestral graph)", def: "Paper Def.4. FCI's output: it represents all MAGs that fit the data. Edges marks are shared by every such MAG; differences are left as circles." },
    { term: "Endpoint marks ∘ , &gt; , —", def: "Each edge end is a circle (undetermined), an arrowhead (the endpoint is NOT an ancestor of the other node), or a tail (the endpoint IS an ancestor). E.g. A↔B = both ends arrowheads = latent common cause; A∘→B = A is not a descendant of B but A's own status is unknown." },
    { term: "Possible-D-Separation", def: "An enlarged candidate conditioning pool computed after the skeleton pass. Conditioning over its subsets removes spurious edges that PC's neighbour-only tests cannot, which is FCI's defining extra step (Fig.25)." },
    { term: "Inducing / discriminating path", def: "An inducing path keeps two non-adjacent variables dependent given any conditioning set, forcing an edge in the MAG. A discriminating path is the configuration R4 uses to decide a collider vs. non-collider." }
  ],

  animation: {
    title: "FCI on a 5-variable example with a HIDDEN common cause of C and E (faithful to paper Fig.24's pipeline; a latent is added so a bidirected edge appears).",
    nodes: [
      { id: "A", x: 0.06, y: 0.50 },
      { id: "B", x: 0.32, y: 0.50 },
      { id: "C", x: 0.60, y: 0.16 },
      { id: "D", x: 0.60, y: 0.84 },
      { id: "E", x: 0.94, y: 0.50 }
    ],
    edges: [
      { from: "A", to: "B", type: "circ-circ" }, { from: "A", to: "C", type: "circ-circ" },
      { from: "A", to: "D", type: "circ-circ" }, { from: "A", to: "E", type: "circ-circ" },
      { from: "B", to: "C", type: "circ-circ" }, { from: "B", to: "D", type: "circ-circ" },
      { from: "B", to: "E", type: "circ-circ" }, { from: "C", to: "D", type: "circ-circ" },
      { from: "C", to: "E", type: "circ-circ" }, { from: "D", to: "E", type: "circ-circ" }
    ],
    steps: [
      { caption: "<b>Start (Phase 1).</b> Like PC, FCI begins from the complete graph on the observed variables {A,B,C,D,E}, but every edge is drawn with two circles (∘–∘): no endpoint is known yet. The true setup is A→B, B→C, B→D, with C and E (and D and E) connected — and a HIDDEN variable that is a common cause of C and E.", ops: [{ op: "badge", text: "ℓ = 0", kind: "info" }] },
      { caption: "<b>Skeleton CI tests.</b> A⫫C | B and A⫫D | B: B screens A off from both C and D. Delete A–C and A–D; store Sep(A,C)=Sep(A,D)={B}.", ops: [{ op: "badge", text: "ℓ = 1", kind: "info" }, { op: "testCI", x: "A", y: "C", z: ["B"], result: "indep" }, { op: "testCI", x: "A", y: "D", z: ["B"], result: "indep" }, { op: "removeEdge", from: "A", to: "C" }, { op: "removeEdge", from: "A", to: "D" }] },
      { caption: "<b>Skeleton CI tests.</b> A⫫E | B and A⫫... handled; also C⫫D | B (B is the only parent of both). Delete A–E and C–D. Sep(A,E)={B}, Sep(C,D)={B}.", ops: [{ op: "badge", text: "ℓ = 1", kind: "info" }, { op: "testCI", x: "A", y: "E", z: ["B"], result: "indep" }, { op: "removeEdge", from: "A", to: "E" }, { op: "testCI", x: "C", y: "D", z: ["B"], result: "indep" }, { op: "removeEdge", from: "C", to: "D" }] },
      { caption: "<b>End of PC-style pass.</b> Remaining edges: A∘–∘B, B∘–∘C, B∘–∘D, C∘–∘E, D∘–∘E, and B∘–∘E. PC would stop here — but the B–E edge is kept only because the latent behind C and E leaks dependence; the neighbour-only search cannot resolve it.", ops: [{ op: "badge", text: "skeleton (PC) done", kind: "good" }, { op: "highlightEdges", edges: [["B", "E"]], cls: "hl" }] },
      { caption: "<b>Phase 2 — Possible-D-Sep.</b> FCI recomputes a larger candidate pool for each still-adjacent pair. For B and E it builds Possible-D-Sep(B,E) from nodes on collider/triangle paths between them: {C,D}.", ops: [{ op: "set", name: "Poss-D-Sep(B,E)", items: ["C", "D"] }, { op: "highlightNodes", ids: ["C", "D"], cls: "add" }] },
      { caption: "<b>Extra CI test.</b> Re-test B⫫E over subsets of Possible-D-Sep(B,E). Conditioning on {C,D} gives B⫫E | {C,D} → the B–E edge is spurious. Delete it; set Sep(B,E)={C,D}. This is the removal PC could not make (cf. Fig.24c).", ops: [{ op: "testCI", x: "B", y: "E", z: ["C", "D"], result: "indep" }, { op: "removeEdge", from: "B", to: "E" }, { op: "clearSet", name: "Poss-D-Sep(B,E)" }, { op: "badge", text: "Poss-D-Sep prune", kind: "good" }] },
      { caption: "<b>Reset to circles.</b> The final skeleton is A–B, B–C, B–D, C–E, D–E. Every endpoint is set back to a circle (∘–∘): direction is unknown everywhere.", ops: [{ op: "highlightEdges", edges: [["A", "B"], ["B", "C"], ["B", "D"], ["C", "E"], ["D", "E"]], cls: "hl" }] },
      { caption: "<b>Orient unshielded collider (R0).</b> Triple C ∘–∘ E ∘–∘ D: C and D are non-adjacent and E ∉ Sep(C,D)={B}. So put arrowheads INTO E: C ∗→ E ←∗ D. (Circle ends become arrowheads.)", ops: [{ op: "highlightNodes", ids: ["C", "E", "D"], cls: "hl" }, { op: "orient", from: "C", to: "E", type: "circ-arrow" }, { op: "orient", from: "D", to: "E", type: "circ-arrow" }] },
      { caption: "<b>FCI rule R1.</b> With B ∘–∘ C and the arrowhead now at C from a collider, R1 forces a tail at B and an arrowhead at C: orient B → C. The same reasoning fixes B → D. (Circle → tail/arrow.)", ops: [{ op: "highlightEdges", edges: [["B", "C"], ["B", "D"]], cls: "hl" }, { op: "orient", from: "B", to: "C", type: "directed" }, { op: "orient", from: "B", to: "D", type: "directed" }] },
      { caption: "<b>Latent confounder ⇒ bidirected edge.</b> The dependence between C and E that no observed variable removes cannot come from C→E or E→C (both would clash with the collider marks). The only consistent explanation is a hidden common cause: FCI puts arrowheads at BOTH ends, giving the bidirected edge C ↔ E.", ops: [{ op: "highlightEdges", edges: [["C", "E"]], cls: "hl" }, { op: "orient", from: "C", to: "E", type: "bidirected" }, { op: "badge", text: "latent common cause: C ↔ E", kind: "warn" }] },
      { caption: "<b>Remaining rules R2–R4.</b> Check the rest: A ∘–∘ B has no forcing collider or path, so it stays undetermined; D ∗→ E keeps its arrowhead into E. No further mark is forced.", ops: [{ op: "highlightEdges", edges: [["A", "B"]], cls: "hl" }] },
      { caption: "<b>Result — the PAG.</b> A ∘–∘ B undetermined; B → C and B → D directed; D ∗→ E into the collider; and C ↔ E bidirected, explicitly flagging a hidden common cause. This PAG represents every MAG (DAG-with-latents) consistent with the data — something PC's CPDAG cannot express.", ops: [{ op: "badge", text: "PAG returned", kind: "good" }] }
    ]
  },

  complexity: "Like PC, worst-case exponential in the largest node degree because many conditioning subsets may be tested; the extra Possible-D-Sep phase enlarges the candidate sets, so FCI is strictly more expensive than PC. Variants (RFCI, FCI+, the path-restricted Possible-D-Sep of Fig.25) cut the number of these extra tests.",
  strengths: [
    "Drops the causal-sufficiency assumption — it is sound and complete for the latent-variable setting given faithfulness and an oracle CI test.",
    "Explicitly represents hidden confounders via bidirected edges, instead of silently mis-reporting a direct cause.",
    "Still purely test-based: no scoring function or distributional model to choose."
  ],
  limitations: [
    "Even more sensitive to CI-test errors than PC, because Possible-D-Sep needs many additional tests, often with larger conditioning sets that are statistically unreliable.",
    "Higher computational cost than PC due to the extra pruning phase.",
    "Output PAGs leave many circle marks undetermined, so the causal answer can be less informative than a CPDAG when no latents are present."
  ],
  notes: "Conservative and order-independent variants exist: <b>CFCI</b> (conservative FCI) double-checks ambiguous triples, <b>RFCI</b> (Really Fast Causal Inference) skips the costly Possible-D-Sep phase using cheaper local tests, and <b>FCI+</b> bounds the conditioning-set size. The base orientation rules R1–R4 were later shown insufficient; rules R5–R10 were added to recover the unique PAG.",
  figureRefs: "Paper §4.4 (pp.37–49): Algorithm 7 (FCI, p.45); Def.3 (MAG), Def.4 (PAG); Possible-D-Sep & path-restricted variant (Fig.25); worked pipeline true MAG / PC pass / Possible-D-Sep pruning / final PAG (Fig.24); orientation rules R1 (Fig.26), R2 (Fig.27), R3 (Fig.28), R4 / discriminating path (Thm.7, Recall 12). The animation adds an explicit latent confounder to Fig.24's chain so a bidirected edge appears."
};
