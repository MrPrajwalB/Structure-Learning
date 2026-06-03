/* CPC — Conservative PC. Grounded in §4.17 (pp.108-110), ref [549].
   Worked example = Example 26 five-variable run {A,B,C,D,E}; Figs.60-62.
   CPC builds on PC (§4.1): identical skeleton phase, conservative orientation phase. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["cpc"] = {
  name: "Conservative PC",
  oneLiner: "Run PC's skeleton search unchanged, but orient v-structures cautiously: for each unshielded triple, look at every conditioning set that separates the two endpoints and only commit to a collider when the evidence is unanimous — otherwise flag the triple as ambiguous and leave it undirected.",
  basedOnText: "CPC modifies only the orientation phase of PC. It weakens 'complete faithfulness' to adjacency-faithfulness in the skeleton phase plus a conservative test of orientation-faithfulness at triples, so unreliable CI tests cause fewer wrong arrowheads.",

  assumptions: [
    "<b>Adjacency-faithfulness</b> — every edge in the true graph shows up as a dependence that no conditioning set can remove (this is all CPC needs for the skeleton). This is weaker than PC's full faithfulness.",
    "<b>Conservative orientation-faithfulness (tested, not assumed)</b> — instead of trusting a single separating set, CPC checks all of them at each triple; triples that disagree are marked rather than oriented.",
    "<b>Causal sufficiency</b> — no hidden common causes.",
    "<b>CI tests</b> — independence is decided by a statistical test, exactly as in PC."
  ],
  input: "A dataset over variables V and a conditional-independence (CI) test (the same inputs as PC).",
  output: "An <b>extended PDAG (ePDAG)</b>: directed and undirected edges, together with unshielded triples flagged as <i>unfaithful</i> (ambiguous). When such triples are present, the DAGs an ePDAG represents need not be d-separation equivalent.",

  idea: [
    "PC orients a v-structure X→Z←Y the moment it finds that the middle node Z is missing from <i>one</i> separating set of X and Y. But a single CI test can be wrong, and different separating sets can disagree — so this rule produces false colliders and makes the output depend on the order in which pairs are processed.",
    "CPC's fix is caution. The skeleton phase is left <b>exactly</b> as in PC. The change is purely in how triples are oriented: for each unshielded triple X−Z−Y (X and Y not adjacent) CPC gathers the <i>family of all conditioning sets</i> that make X and Y independent, drawn from subsets of the potential parents of the two endpoints.",
    "It then takes a vote. If the middle node Z is in <b>none</b> of those sets, the collider is unanimous → orient X→Z←Y. If Z is in <b>all</b> of them, it is unanimously a non-collider → keep the triple undirected. If Z is in <b>some but not others</b>, the tests disagree → the triple is <b>ambiguous (unfaithful)</b>; CPC marks it (underlines X−Z−Y) and never orients it or uses it during propagation.",
    "The payoff: far fewer false arrowheads from noisy CI tests and improved order-independence, at the cost of leaving more edges undirected (the conservative trade-off)."
  ],

  steps: [
    "<b>Skeleton (same as PC).</b> Start from the complete undirected graph and delete an edge whenever some conditioning set makes its endpoints independent, growing the conditioning-set size 0,1,2,… over current neighbours. Store each separating set. The result is the PC skeleton — CPC changes nothing here.",
    "<b>List the unshielded triples.</b> Find every triple X−Z−Y in the skeleton where X and Y are <i>not</i> adjacent. Each will be classified as collider, non-collider, or ambiguous.",
    "<b>Collect all separating sets per triple.</b> For a triple X−Z−Y, find every subset U of the potential parents of X and Y for which X ⫫ Y | U. Call this family S — not just one set as in PC.",
    "<b>Conservative vote.</b> If Z ∉ U for <b>every</b> U in S → orient the collider X → Z ← Y. If Z ∈ U for <b>every</b> U in S → leave the triple undirected (a non-collider).",
    "<b>Mark ambiguity.</b> If Z is in <i>some</i> separating sets but not others, the triple is <b>unfaithful</b>: underline X−Z−Y, do not orient it, and exclude it from later propagation.",
    "<b>Propagate with Meek's rules R1–R3</b> exactly as PC does — but never apply a rule using an ambiguous (underlined) triple. Orient only what is logically forced, without creating cycles or new colliders.",
    "<b>Return</b> the ePDAG: oriented edges, undirected edges, and the set of triples flagged unfaithful."
  ],

  keyConcepts: [
    { term: "Unshielded triple", def: "Three nodes X−Z−Y where X−Z and Z−Y are edges but X and Y are not adjacent. These are the only places where v-structures can appear, so CPC focuses its conservative test here." },
    { term: "Family of separating sets S", def: "ALL conditioning sets (drawn from the potential parents of the endpoints) that make X and Y independent — CPC examines every one, whereas PC trusts a single stored separating set." },
    { term: "Conservative collider test", def: "The vote over S: Z in none → collider; Z in all → non-collider; Z in some-but-not-all → ambiguous." },
    { term: "Ambiguous / unfaithful triple", def: "A triple whose separating sets disagree about the middle node. CPC underlines it, leaves it undirected, and never uses it in propagation — preventing a coin-flip from forcing a wrong orientation." },
    { term: "Adjacency-faithfulness", def: "The weaker assumption CPC relies on for the skeleton: true edges always produce a detectable dependence. It drops PC's stronger requirement on every triple's orientation." },
    { term: "Extended PDAG (ePDAG)", def: "CPC's output: directed + undirected edges plus a list of unfaithful triples. Because of those flags, its DAGs need not all be d-separation equivalent." }
  ],

  animation: {
    title: "CPC on the five-variable example {A,B,C,D,E} (paper Example 26, Figs. 60-62).",
    nodes: [
      { id: "A", x: 0.5,  y: 0.08 },
      { id: "B", x: 0.16, y: 0.48 },
      { id: "D", x: 0.84, y: 0.48 },
      { id: "C", x: 0.30, y: 0.92 },
      { id: "E", x: 0.70, y: 0.92 }
    ],
    edges: [
      { from: "A", to: "B", type: "undirected" }, { from: "A", to: "C", type: "undirected" },
      { from: "A", to: "D", type: "undirected" }, { from: "A", to: "E", type: "undirected" },
      { from: "B", to: "C", type: "undirected" }, { from: "B", to: "D", type: "undirected" },
      { from: "B", to: "E", type: "undirected" }, { from: "C", to: "D", type: "undirected" },
      { from: "C", to: "E", type: "undirected" }, { from: "D", to: "E", type: "undirected" }
    ],
    steps: [
      { caption: "<b>Start (same as PC).</b> Begin from the complete undirected graph on {A,B,C,D,E} — 10 edges. CPC's skeleton phase is identical to PC's; only orientation differs.", ops: [{ op: "badge", text: "skeleton = PC", kind: "info" }] },
      { caption: "<b>Order-1 deletions (|U|=1).</b> Several pairs become independent given a single variable: B ⫫ E | C, B ⫫ E | D, B ⫫ D | C and C ⫫ D | E (Fig. 61b). Spurious edges B–E, B–D, C–D and others are removed (PC-style).", ops: [{ op: "badge", text: "|U| = 1", kind: "info" }, { op: "testCI", x: "B", y: "E", z: ["C"], result: "indep" }, { op: "removeEdge", from: "B", to: "E" }, { op: "removeEdge", from: "B", to: "D" }, { op: "removeEdge", from: "C", to: "D" }] },
      { caption: "<b>Order-2 deletions (|U|=2).</b> With size-2 conditioning sets the last spurious edges fall: C ⫫ A | {B,E} and E ⫫ A | {C,D} (Fig. 61c). Edges A–C and A–E are removed, leaving the final skeleton.", ops: [{ op: "badge", text: "|U| = 2", kind: "info" }, { op: "testCI", x: "C", y: "A", z: ["B", "E"], result: "indep" }, { op: "testCI", x: "E", y: "A", z: ["C", "D"], result: "indep" }, { op: "removeEdge", from: "C", to: "A" }, { op: "removeEdge", from: "E", to: "A" }] },
      { caption: "<b>Skeleton finished (Fig. 61d).</b> Remaining edges: A–B, A–D, B–C, C–E, D–E. Now CPC's conservative orientation begins.", ops: [{ op: "badge", text: "skeleton done", kind: "good" }, { op: "highlightEdges", edges: [["A","B"],["A","D"],["B","C"],["C","E"],["D","E"]] }] },
      { caption: "<b>Triple B−A−D.</b> B and D are not adjacent. The potential parents of the endpoints are {A,C,E}. CPC collects EVERY conditioning set U with B ⫫ D | U.", ops: [{ op: "highlightNodes", ids: ["B", "A", "D"], cls: "hl" }, { op: "set", name: "S(B,D)", items: ["{C}", "{C,E}"] }] },
      { caption: "<b>Conservative vote — unanimous collider.</b> The middle node A is in NONE of those separating sets. Unanimous → orient the v-structure B → A ← D (Fig. 62a).", ops: [{ op: "testCI", x: "B", y: "D", z: ["C"], result: "indep" }, { op: "badge", text: "A in NONE → collider", kind: "good" }, { op: "orient", from: "B", to: "A", type: "directed" }, { op: "orient", from: "D", to: "A", type: "directed" }, { op: "clearSet" }] },
      { caption: "<b>Triple B−C−E.</b> B and E are not adjacent. Endpoint potential parents: N(B)={A,C}, N(E)={C,D}. CPC collects all U with B ⫫ E | U.", ops: [{ op: "highlightNodes", ids: ["B", "C", "E"], cls: "hl" }, { op: "set", name: "S(B,E)", items: ["{C}", "{D}"] }] },
      { caption: "<b>Conservative vote — disagreement!</b> Among the admissible separators we have B ⫫ E | C (middle node C is IN) and B ⫫ E | D (C is OUT). C is in some but not all sets.", ops: [{ op: "testCI", x: "B", y: "E", z: ["C"], result: "indep" }, { op: "testCI", x: "B", y: "E", z: ["D"], result: "indep" }, { op: "highlightNodes", ids: ["C"], cls: "dim" }] },
      { caption: "<b>Mark AMBIGUOUS.</b> Because the separating sets disagree about C, the triple B−C−E is flagged <i>unfaithful</i>. CPC leaves it undirected and will not use it during propagation (Fig. 62b).", ops: [{ op: "badge", text: "B−C−E unfaithful (ambiguous)", kind: "warn" }, { op: "clearSet" }] },
      { caption: "<b>Triple C−E−D.</b> C and D are not adjacent; endpoint potential parents are {B,E}. The only admissible separator is C ⫫ D | E, so the middle node E is in ALL of them.", ops: [{ op: "highlightNodes", ids: ["C", "E", "D"], cls: "hl" }, { op: "set", name: "S(C,D)", items: ["{E}"] }, { op: "testCI", x: "C", y: "D", z: ["E"], result: "indep" }] },
      { caption: "<b>Conservative vote — unanimous non-collider.</b> E is in EVERY separating set, so this is not a collider. CPC keeps C−E−D undirected.", ops: [{ op: "badge", text: "E in ALL → non-collider", kind: "info" }, { op: "clearSet" }] },
      { caption: "<b>Result — the ePDAG (Fig. 62b).</b> Recovered v-structure B → A ← D; the triple B−C−E left undirected and flagged unfaithful; no further Meek orientations are forced. Conservative caution keeps the questionable triple unoriented.", ops: [{ op: "highlightEdges", edges: [["B","C"],["C","E"]], cls: "dim" }, { op: "badge", text: "ePDAG returned", kind: "good" }] }
    ]
  },

  complexity: "Same order as PC for the skeleton (worst-case exponential in the largest node degree, efficient on sparse graphs). The orientation phase costs more than PC because each unshielded triple requires checking the whole family of separating sets rather than a single stored set.",
  strengths: [
    "Far fewer false v-structures: a noisy CI test cannot force a collider unless the evidence is unanimous.",
    "More order-independent than plain PC — the conservative test does not hinge on which separating set happened to be stored first.",
    "Explicitly reports ambiguity (unfaithful triples) instead of silently guessing.",
    "Skeleton phase is unchanged, so it inherits PC's efficiency on sparse graphs."
  ],
  limitations: [
    "Leaves more edges undirected — caution costs orientation power, so the output can be less informative than PC's.",
    "Still assumes causal sufficiency (no hidden confounders).",
    "Checking all separating sets per triple is more expensive than PC's single-set rule.",
    "The output ePDAG's flagged triples mean its DAGs need not be d-separation equivalent, complicating downstream use."
  ],
  notes: "CPC (Conservative PC, ref [549]) changes only PC's orientation phase; the skeleton search is identical to PC (§4.1). It is closely related to order-independent / stable variants of PC, and its conservative collider test directly addresses PC's sensitivity to CI-test errors. The ambiguous-triple idea also appears in conservative versions of FCI.",
  figureRefs: "Paper §4.17 (pp.108–110): Example 25 (3-variable orientation), Example 26 (five-variable run), Fig.60 (skeleton orientation), Fig.61 (skeleton progression a–d), Fig.62 (CPC results: v-structure formation and final ePDAG)."
};
