/* CFCI — Conservative FCI. Grounded in §4.28 / §4.29 (pp.155-156), ref [124].
   Pseudocode = Algorithm 35 (CFCI, p.156). CFCI = FCI (§4.4, latent-variable
   skeleton + Possible-D-Sep pruning, PAG output) with PC's conservative /
   ambiguous-triple collider test (CPC, §4.17) replacing FCI's eager v-structure
   step. PAG edge-mark conventions reused from fci.js. Remark 8 (p.156): the
   conservative collider step is the SOLE deviation from FCI. Related work
   (§4.29.1): Isozaki & Kuroki [287]. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["cfci"] = {
  name: "Conservative FCI (CFCI)",
  oneLiner: "Run FCI for the latent-variable setting — a skeleton search, Possible-D-Sep pruning, and a PAG output that can show hidden confounders — but orient colliders cautiously: a triple becomes a collider only when the middle node is in NONE of the separating sets, otherwise it is flagged ambiguous and left as circles.",
  basedOnText: "CFCI (ref [124]) modifies FCI's early v-structure orientation so as to keep Possible-D-Sep sets small and the later pruning efficient — the same idea as in CPC. Except for this conservative collider rule, the pipeline coincides with FCI: an adjacency search akin to PC, then Possible-D-Sep-based pruning, then the standard orientation rules producing a PAG (paper §4.28-4.29, Algorithm 35).",

  assumptions: [
    "<b>Faithfulness</b> — every (conditional) independence in the data reflects a missing connection in the true structure, not an accidental cancellation. CFCI weakens reliance on this for triples via its conservative, <i>tested</i> collider rule.",
    "<b>Reliable CI tests</b> — independence is decided by a statistical test (or, in theory, a perfect 'oracle' CI test). The conservative step is precisely a hedge against unreliable tests.",
    "<b>NO causal sufficiency required</b> — inherited from FCI: CFCI explicitly allows hidden/latent common causes (and, optionally, selection variables), which PC and CPC forbid."
  ],
  input: "A dataset 𝒟 over the observed variables V and a conditional-independence (CI) test (the same inputs as FCI).",
  output: "A <b>PAG</b> (partial ancestral graph): a graph whose edge <i>endpoints</i> carry marks — circle (∘ = undetermined), arrowhead (&gt;), or tail (—) — representing the Markov-equivalence class of MAGs consistent with the data. A bidirected edge A↔B signals a latent common cause. Because of the conservative rule, more endpoints are left as circles than under plain FCI.",

  idea: [
    "FCI already handles hidden confounders: where PC would silently report a direct cause, FCI can leave a bidirected edge A↔B meaning 'a latent variable causes both'. But FCI inherits PC's <i>eager</i> collider rule — it commits to a v-structure the moment a single separating set omits the middle node. A wrong CI test there creates a false arrowhead, and in the latent setting such mistakes are worse: they can propagate long chains of bidirected edges and inflate the Possible-D-Sep sets that drive the expensive pruning phase.",
    "CFCI borrows the conservative collider test from CPC and drops it into FCI. <b>This is the only change</b> (paper Remark 8): every other stage — adjacency search, Possible-D-Sep pruning, the final orientation rules — is exactly FCI.",
    "For each unshielded triple ⟨X, Z, Y⟩ (X and Y not adjacent), CFCI does not trust one stored set. It enumerates <i>every</i> subset U of the current neighbours of X, and of Y, for which X⫫Y | U holds, building the family S<sub>X,Y</sub>. Then it votes: orient the collider X ∗→ Z ←∗ Y only if Z is in <b>none</b> of those sets. If Z appears in some but not all, the tests disagree and the triple's endpoints stay circles — it is <b>ambiguous</b> and never used to force later orientations.",
    "The payoff and the price: fewer false arrowheads and smaller, cleaner Possible-D-Sep sets (so the pruning runs on a sparser partially-oriented graph), at the cost of leaving more circle marks undetermined in the final PAG."
  ],

  steps: [
    "<b>Adjacency search (PC-style).</b> Start from the complete undirected graph on V. Growing ℓ = 0,1,2,…, for each ordered pair (X,Y) with X adjacent to Y and at least ℓ other neighbours, test independence over subsets U of size ℓ from X's current neighbours (excluding Y). When X⫫Y | U, remove the edge X–Y and record U<sub>X,Y</sub> ← U. (Algorithm 35, line 1.)",
    "<b>Initialise endpoints.</b> Set every surviving edge to two circle marks (∘–∘): nothing about direction is known yet.",
    "<b>Conservative v-structures.</b> For every unshielded triple ⟨X, Z, Y⟩ with X non-adjacent to Y, build the family S<sub>X,Y</sub> = all subsets U of N(X) and of N(Y) for which X⫫Y | U holds.",
    "<b>Conservative vote.</b> If Z ∉ U for <b>every</b> U in S<sub>X,Y</sub>, orient the collider X ∗→ Z ←∗ Y (arrowheads into Z). Otherwise — Z is in all of them, or in some but not all — leave the triple's endpoints as circles. A 'some-but-not-all' triple is <b>ambiguous</b> and is excluded from later orientation.",
    "<b>Possible-D-Sep pruning.</b> For every remaining adjacency X–Y, compute Possible-D-Sep(X,Y) on the current partially-oriented graph; if some subset U ⊆ Possible-D-Sep(X,Y) gives X⫫Y | U, delete X–Y and update U<sub>X,Y</sub> ← U. (Smaller because the conservative step withheld dubious arrowheads.)",
    "<b>Final orientation.</b> Reset all surviving edges to ∘–∘ again; re-orient all unshielded colliders using the <i>same conservative rule</i> with the now-updated separating sets; then apply the standard FCI orientation rules R1–R10 until nothing more is forced.",
    "<b>Return the PAG.</b> Remaining circles stay undetermined; forced ends become arrowheads or tails. Any A↔B that emerges flags a latent common cause."
  ],

  keyConcepts: [
    { term: "Latent / hidden confounder", def: "An unobserved variable that causes two observed variables. No set of observed variables can screen them off, so it leaves a dependence CFCI must explain — typically with a bidirected edge A↔B." },
    { term: "PAG (partial ancestral graph)", def: "CFCI's output (as in FCI): it represents all MAGs — DAGs-with-latents over the observed variables — that fit the data. Marks shared by every such MAG are committed; the rest are left as circles." },
    { term: "Endpoint marks ∘ , &gt; , —", def: "Each edge end is a circle (undetermined), an arrowhead (the endpoint is NOT an ancestor of the other node), or a tail (the endpoint IS an ancestor). A↔B = both ends arrowheads = latent common cause." },
    { term: "Conservative collider test", def: "The defining change: for an unshielded triple, gather the whole family S of separating sets and orient a collider only when the middle node is in NONE of them. In some-but-not-all → ambiguous; in all → non-collider." },
    { term: "Ambiguous triple", def: "An unshielded triple whose separating sets disagree about the middle node. CFCI leaves its endpoints as circles and never uses it to propagate further marks, preventing a noisy CI test from forcing a wrong arrowhead." },
    { term: "Possible-D-Separation", def: "FCI's enlarged candidate conditioning pool, recomputed after the conservative orientation. Because dubious arrowheads were withheld, these sets stay smaller and the extra pruning phase is cheaper (the motivation stated in §4.28)." }
  ],

  animation: {
    title: "CFCI on a 5-variable example with a HIDDEN common cause of C and E (faithful to FCI's pipeline; a latent is added so a bidirected edge appears, and a second triple is made ambiguous to show the conservative rule).",
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
      { caption: "<b>Start (adjacency search, PC-style).</b> Like FCI, CFCI begins from the complete graph on the observed variables {A,B,C,D,E}, every edge drawn ∘–∘ (no endpoint known). The true setup is A→B, B→C, B→D, with C–E and D–E connected — plus a HIDDEN variable that is a common cause of C and E.", ops: [{ op: "badge", text: "ℓ = 0", kind: "info" }] },
      { caption: "<b>Skeleton CI tests.</b> A⫫C | B and A⫫D | B: B screens A off from both C and D. Delete A–C and A–D; record U<sub>A,C</sub>=U<sub>A,D</sub>={B}.", ops: [{ op: "badge", text: "ℓ = 1", kind: "info" }, { op: "testCI", x: "A", y: "C", z: ["B"], result: "indep" }, { op: "testCI", x: "A", y: "D", z: ["B"], result: "indep" }, { op: "removeEdge", from: "A", to: "C" }, { op: "removeEdge", from: "A", to: "D" }] },
      { caption: "<b>Skeleton CI tests.</b> A⫫E | B and C⫫D | B (B is the common parent). Delete A–E and C–D; record U<sub>A,E</sub>={B}, U<sub>C,D</sub>={B}.", ops: [{ op: "badge", text: "ℓ = 1", kind: "info" }, { op: "testCI", x: "A", y: "E", z: ["B"], result: "indep" }, { op: "removeEdge", from: "A", to: "E" }, { op: "testCI", x: "C", y: "D", z: ["B"], result: "indep" }, { op: "removeEdge", from: "C", to: "D" }] },
      { caption: "<b>Initialise endpoints.</b> Remaining edges A–B, B–C, B–D, C–E, D–E and B–E are all set to ∘–∘. The B–E edge survives only because the latent behind C and E leaks dependence the neighbour search cannot resolve yet.", ops: [{ op: "badge", text: "endpoints ∘–∘", kind: "info" }, { op: "highlightEdges", edges: [["B", "E"]], cls: "hl" }] },
      { caption: "<b>Conservative v-structure test — triple C ∘–∘ E ∘–∘ D.</b> C and D are non-adjacent. CFCI gathers EVERY admissible separating set of C and D: the only one is {B}. Build the family S<sub>C,D</sub>.", ops: [{ op: "highlightNodes", ids: ["C", "E", "D"], cls: "hl" }, { op: "set", name: "S(C,D)", items: ["{B}"] }] },
      { caption: "<b>Vote — unanimous collider.</b> The middle node E is in NONE of the separating sets (only {B} qualifies, and E ∉ {B}). Conservative rule fires: orient arrowheads INTO E, giving C ∗→ E ←∗ D.", ops: [{ op: "testCI", x: "C", y: "D", z: ["B"], result: "indep" }, { op: "badge", text: "E in NONE → collider", kind: "good" }, { op: "orient", from: "C", to: "E", type: "circ-arrow" }, { op: "orient", from: "D", to: "E", type: "circ-arrow" }, { op: "clearSet", name: "S(C,D)" }] },
      { caption: "<b>Conservative test — triple A ∘–∘ B ∘–∘ E (B–E still present).</b> A and E are non-adjacent. CFCI collects every set with A⫫E: here A⫫E | {B} (middle B is IN) and A⫫E | {C,D} (B is OUT). Build S<sub>A,E</sub>.", ops: [{ op: "highlightNodes", ids: ["A", "B", "E"], cls: "hl" }, { op: "set", name: "S(A,E)", items: ["{B}", "{C,D}"] }] },
      { caption: "<b>Vote — disagreement → AMBIGUOUS.</b> B is in some separating sets ({B}) but not others ({C,D}). The tests disagree, so the triple A–B–E is flagged ambiguous: its endpoints stay circles and it will NOT be used to force any later orientation. This is exactly where CFCI departs from FCI (Remark 8).", ops: [{ op: "testCI", x: "A", y: "E", z: ["B"], result: "indep" }, { op: "testCI", x: "A", y: "E", z: ["C", "D"], result: "indep" }, { op: "highlightNodes", ids: ["B"], cls: "dim" }, { op: "badge", text: "A–B–E ambiguous → leave circles", kind: "warn" }, { op: "clearSet", name: "S(A,E)" }] },
      { caption: "<b>Possible-D-Sep pruning.</b> For the still-present B–E edge, CFCI builds Possible-D-Sep(B,E) on the partially-oriented graph: the collider witnesses {C,D}. Because the conservative step withheld dubious arrowheads, this pool stays small.", ops: [{ op: "set", name: "Poss-D-Sep(B,E)", items: ["C", "D"] }, { op: "highlightNodes", ids: ["C", "D"], cls: "add" }] },
      { caption: "<b>Extra CI prune.</b> Re-test over subsets: B⫫E | {C,D} → the B–E edge is spurious (the latent's leak is now screened). Delete it and update U<sub>B,E</sub>={C,D}. The earlier A–B–E ambiguity is moot now that B–E is gone.", ops: [{ op: "testCI", x: "B", y: "E", z: ["C", "D"], result: "indep" }, { op: "removeEdge", from: "B", to: "E" }, { op: "clearSet", name: "Poss-D-Sep(B,E)" }, { op: "badge", text: "Poss-D-Sep prune: B–E removed", kind: "good" }] },
      { caption: "<b>Final orientation.</b> Reset to ∘–∘, re-run the conservative collider test (C ∗→ E ←∗ D still unanimous), then apply FCI rules R1–R10. R1 forces B → C and B → D (an arrowhead at C/D from the collider would otherwise create unwanted structure). The latent behind C and E that no observed set removes can only be a hidden common cause → bidirected C ↔ E.", ops: [{ op: "highlightEdges", edges: [["B", "C"], ["B", "D"], ["C", "E"]], cls: "hl" }, { op: "orient", from: "B", to: "C", type: "directed" }, { op: "orient", from: "B", to: "D", type: "directed" }, { op: "orient", from: "C", to: "E", type: "bidirected" }, { op: "badge", text: "latent common cause: C ↔ E", kind: "warn" }] },
      { caption: "<b>Result — the PAG.</b> A ∘–∘ B left undetermined (no forcing collider survived); B → C and B → D directed; D ∗→ E into the collider; and C ↔ E bidirected, flagging the hidden common cause. The conservative rule kept the noisy A–B–E triple from forcing a false arrowhead — more circles than plain FCI, but fewer mistakes.", ops: [{ op: "highlightEdges", edges: [["A", "B"]], cls: "dim" }, { op: "badge", text: "PAG returned", kind: "good" }] }
    ]
  },

  complexity: "Same overall profile as FCI — worst-case exponential in the largest node degree, with an extra Possible-D-Sep pruning phase on top of the PC-style skeleton. The conservative collider test adds cost per unshielded triple (it enumerates the whole family of separating sets rather than trusting one), but it tends to make the Possible-D-Sep sets smaller, so the expensive pruning phase runs on a sparser partially-oriented graph — the explicit motivation in §4.28.",
  strengths: [
    "Fewer false arrowheads than FCI: a noisy CI test cannot force a collider unless the middle node is unanimously excluded.",
    "Keeps Possible-D-Sep sets small, making the costly pruning phase more efficient — the stated reason for the conservative rule.",
    "Retains FCI's core advantage: drops causal sufficiency and represents hidden confounders via bidirected edges.",
    "Explicitly flags ambiguous triples instead of silently committing to a guess."
  ],
  limitations: [
    "Leaves more endpoints as circles than FCI — caution costs orientation power, so the answer can be less informative.",
    "Still inherits FCI's heavy reliance on many CI tests, often with large conditioning sets that are statistically unreliable.",
    "Checking the whole family of separating sets per triple is more expensive than FCI's single-set rule.",
    "Output PAGs with many undetermined marks can be harder to use downstream."
  ],
  notes: "CFCI (ref [124]) is to FCI what CPC is to PC: it changes ONLY the v-structure orientation, replacing FCI's eager rule with the conservative 'middle node in none of the separating sets' test. Paper Remark 8 states this conservative step is the sole deviation from FCI; all other stages are identical. Related work (§4.29.1): Isozaki & Kuroki [287] retain an adjacency only when all CI tests of a fixed order agree, let Possible-D-Sep accommodate latents, and delay arrow propagation until justified — returning a PAG proved sound under their robustness conditions.",
  figureRefs: "Paper §4.28 (CFCI, p.155) and §4.29 'The algorithm' (p.156): Algorithm 35 (CFCI), Remark 8 (conservative step = sole deviation from FCI), §4.29.1 related work (Isozaki & Kuroki [287]). Builds on FCI §4.4 (Algorithm 7, MAG Def.3, PAG Def.4, Possible-D-Sep, rules R1–R10) and the conservative collider test of CPC §4.17. The animation adds an explicit latent confounder so a bidirected edge appears and constructs a second ambiguous triple to showcase the conservative-vs-FCI collider decision."
};
