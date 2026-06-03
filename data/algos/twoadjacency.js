/* 2-adjacency faithfulness — §4.50 (pp.236-240). Builds on PC and GS.
   Grounded in: Recall 62/63 (faithfulness, adjacency faithfulness), Def.24 (unfaithful &
   minimal unfaithful triple), Def.25 (2-adjacency faithfulness), Lemma 14, Theorem 32
   (strict 2-association forces a collider), Proposition 10 (orientation rules),
   Algorithm 62 (Grow-Shrink with 2-adjacency awareness, GS-s≤2), and the noisy-XOR
   worked example (Example 70/71, Figs.147-149: X,Z → Y ← W). */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["twoadjacency"] = {
  name: "2-adjacency faithfulness (GS-s≤2)",
  oneLiner: "Replace the strong adjacency-faithfulness assumption with a weaker one: an edge need not show up as a pairwise dependence — it is enough that a variable stays dependent on its neighbour together with at most one helper. A Grow-Shrink loop that tests these size-≤2 associations then recovers and orients the graph even on noisy-XOR-style data where standard methods fail.",
  basedOnText: "Standard constraint-based learners (PC, GS) lean on <i>adjacency faithfulness</i>: if X and Y are adjacent in the true DAG, they must remain dependent given <i>every</i> conditioning set. That is strong and is violated by parity/XOR-style interactions, where a single parent can look independent of the child while the <i>pair</i> of parents is not. 2-adjacency faithfulness weakens this so that such triple-wise dependencies stay detectable, and modifies the Grow-Shrink algorithm (Alg. 62) to work under the weaker condition.",

  assumptions: [
    "<b>Causal sufficiency</b> — no hidden common causes; all relevant variables are observed (inherited from PC/GS).",
    "<b>2-adjacency faithfulness (Def. 25)</b> — if X and Y are adjacent in 𝒢 then there exists a set <b>Y ⊆ Mb(X) with |Y| ≤ 2 and Y ∈ Y such that X ⫫̸ Y</b>. In words: every edge is justified either by a <i>1-association</i> (the usual pairwise dependence) or by a <i>strict 2-association</i> — dependence that only surfaces when X is conditioned together with one helper. This is strictly <i>weaker</i> than adjacency faithfulness (Lemma 14): adjacency faithfulness implies it, not the reverse.",
    "<b>Markov / I-map property (Recall 64)</b> — every d-separation in 𝒢 is a true conditional independence in P, so non-edges are never spurious dependencies. (Only the <i>edge</i> side is weakened, not the independence side.)",
    "<b>Reliable CI tests</b> — independence/dependence is decided by a statistical test (χ²/G², partial correlation), ideally an oracle."
  ],
  input: "A dataset over variables V, a target T ∈ V (or, run for all T), and a conditional-independence (CI) test.",
  output: "The <b>Markov blanket Mb(T)</b> for each target, assembled into a Bayesian-network structure (skeleton + orientations) — recovered correctly even when adjacency faithfulness is violated by 1-/2-sized parity-type interactions.",

  idea: [
    "Constraint-based methods decide an edge X–Y by asking 'can some conditioning set make X and Y independent?'. <b>Adjacency faithfulness</b> answers this confidently: if the edge is real, <i>no</i> conditioning set can ever break the dependence, so any independence we see means the edge is absent. The trouble is the converse assumption — that adjacency always shows up as a <i>pairwise</i> dependence — which is exactly what XOR-style data breaks.",
    "<b>The failure case (Example 70, Fig.147).</b> Let X and Z be independent fair coins and let Y = X ⊕ Z ⊕ E be their noisy XOR (E a small independent flip with 0 < p < ½). Then X is <i>marginally independent</i> of Y, and Z is too — even though both are genuine parents of Y. Conditioning on either parent alone reveals the other, but on its own each parent looks unrelated to the child. A pairwise test would wrongly delete both real edges. <i>Adjacency faithfulness fails.</i>",
    "<b>The fix (Def. 25, k-association).</b> Call X <i>1-associated</i> with Y if X ⫫̸ Y given every conditioning set — the ordinary case. Call X <i>strictly 2-associated</i> with the pair {Y,Z} if X is not 1-associated with Y or Z alone, but stays dependent once you condition on one of them together with the rest. 2-adjacency faithfulness only demands that every neighbour of X be reachable by a 1-association <i>or</i> a strict 2-association — a witness set of size at most two. In the XOR example, X is strictly 2-associated with {Y,Z}: testing X against Y while conditioning on Z exposes the edge.",
    "<b>Why the structure is still recoverable.</b> A strict 2-association is the graphical footprint of a length-2 path with a collider (Theorem 32): if X,Y,Z satisfy the symmetric triple-dependence conditions, 𝒢 must contain a collider X→Y←Z (or a rotation). So the very pattern that breaks pairwise testing <i>encodes</i> a v-structure. The algorithm tests size-≤2 associations during blanket discovery, keeps a neighbour whenever a 1- or strict-2-association witnesses it, and then reads off the colliders the 2-associations imply.",
    "<b>The algorithm (Alg. 62) is Grow-Shrink, widened.</b> Plain GS grows a blanket by adding any Y that is still <i>1-associated</i> with the target T. The 2-adjacency variant <b>also</b> adds Y whenever some Z makes T ⫫̸ X | U∪{Z} — i.e. a strict 2-association surfaces with one helper. Shrink then removes anything that becomes independent of T given the rest. This keeps GS's locality and decomposability while making it robust to noisy-XOR-type violations.",
    "<b>Orientation (Prop. 10, Figs.148-149).</b> Once neighbours are fixed, a strict 2-association on {X,Z} forces a collider somewhere on the X–Y–Z path; a remaining 1-association (a third, ordinary helper like W in Fig.149) disambiguates <i>which</i> middle node is the collider, yielding the local structure {X,Z}→Y←W."
  ],

  steps: [
    "<b>Pick a target T and start empty.</b> Set the candidate blanket C ← V \\ {T} and the accumulated blanket U ← ∅. (Alg. 62, line 1.)",
    "<b>Grow with size-≤2 awareness.</b> While there exists X ∈ C with <b>T ⫫̸ X | U</b> (an ordinary 1-association) <b>OR</b> a pair X,Z ∈ C with <b>T ⫫̸ X | U∪{Z}</b> (a strict 2-association that only appears with one helper), move X into the blanket: U ← U ∪ {X}; C ← C \\ {X}. (Alg. 62, lines 2-4.)",
    "<b>Why the OR matters.</b> The second clause is what plain GS lacks. It catches a parent like X in the noisy-XOR collider X→Y←Z, whose dependence on T is invisible pairwise but appears the moment its co-parent Z is in the conditioning set. This is exactly the strict-2-association of Def. 25 and Theorem 32.",
    "<b>Shrink.</b> While there exists X ∈ U with <b>T ⫫ X | U \\ {X}</b> (independent given the rest of the blanket), remove it: U ← U \\ {X}. These are false positives admitted before the real blanket was complete. (Alg. 62, lines 5-7.)",
    "<b>Return Mb(T) ← U</b> and repeat for every target, giving each variable's Markov blanket. (Alg. 62, line 8.)",
    "<b>Build the skeleton.</b> X and Y are neighbours if each lies in the other's blanket and no size-≤2 witness can be explained away — i.e. they are 1-associated, or strictly 2-associated through a shared collider that the blankets confirm.",
    "<b>Force colliders from strict 2-associations (Theorem 32).</b> If X,Y,Z satisfy the symmetric triple-dependence conditions (X⫫̸Y|{Z}∪U, X⫫̸Z|{Y}∪U, Y⫫̸Z|{X}∪U for all U), then a collider must sit on the triple: orient X→Y←Z (or the rotation Theorem 32 allows).",
    "<b>Disambiguate the middle node (Prop. 10, Fig.149).</b> When a third variable W is 1-associated with the candidate centre Y, use it to decide which node is the collider: if every X,Z stays dependent on the centre across all conditioning sets containing the others, the centre is the collider; otherwise it is a non-collider on some path.",
    "<b>Propagate and return.</b> Apply the orientation rules to direct remaining forced edges (no cycles, no new colliders) and return the Bayesian-network structure — recovered under the weaker 2-adjacency-faithfulness condition."
  ],

  keyConcepts: [
    { term: "Adjacency faithfulness (Recall 63)", def: "The strong assumption that if X and Y are adjacent, X ⫫̸ Y given EVERY conditioning set. Convenient but violated by parity/XOR interactions where a parent looks pairwise-independent of its child." },
    { term: "1-association", def: "The ordinary situation: X ⫫̸ Y given every conditioning set. A single pairwise test (suitably conditioned) witnesses the edge — the case standard PC/GS rely on." },
    { term: "Strict 2-association", def: "X is not 1-associated with Y or Z alone, but stays dependent on one of them when conditioned together with the other (a size-2 witness). It is the footprint of a length-2 path with a collider (Theorem 32)." },
    { term: "2-adjacency faithfulness (Def. 25)", def: "If X and Y are adjacent there is a witness set Y ⊆ Mb(X) with |Y| ≤ 2 and Y ∈ Y such that X ⫫̸ Y. Every edge is justified by a 1- or strict-2-association. Strictly weaker than adjacency faithfulness (Lemma 14)." },
    { term: "Minimal unfaithful triple (Def. 24)", def: "Three variables pairwise marginally independent yet each dependent on the PAIR of the others, with the symmetric triple-dependence conditions holding under any conditioning. The XOR situation; it motivates k-association." },
    { term: "Collider from 2-association (Theorem 32)", def: "If X,Y,Z meet the strict-2-association triple conditions, 𝒢 must contain a collider on the triple (X→Y←Z or a rotation). The pattern that breaks pairwise testing is exactly what encodes a v-structure." },
    { term: "GS-s≤2 (Algorithm 62)", def: "Grow-Shrink made 2-adjacency-aware: grow on 1-associations OR strict 2-associations (the T ⫫̸ X | U∪{Z} clause), then shrink to minimality. Keeps GS's locality while tolerating XOR-type violations." }
  ],

  animation: {
    title: "GS-s≤2 recovering a noisy-XOR collider (paper Example 70/71, Figs.147-149). True structure: X→Y←Z with Y = X⊕Z⊕E, plus a third parent W→Y. Target T = Y.",
    nodes: [
      { id: "X", x: 0.10, y: 0.20 },
      { id: "Z", x: 0.10, y: 0.80 },
      { id: "Y", x: 0.50, y: 0.50 },
      { id: "W", x: 0.90, y: 0.50 },
      { id: "Q", x: 0.50, y: 0.06 }
    ],
    edges: [
      { from: "X", to: "Y", type: "directed" },
      { from: "Z", to: "Y", type: "directed" },
      { from: "W", to: "Y", type: "directed" }
    ],
    steps: [
      { caption: "<b>The setup (Fig.147).</b> Y is the noisy XOR of its parents: Y = X ⊕ Z ⊕ E, with X,Z independent fair coins and a small flip E. W is a third parent. We learn the blanket of target <b>T = Y</b>. Start with U = ∅; grow will add anything 1- or strictly-2-associated with Y.", ops: [{ op: "highlightNodes", ids: ["Y"], cls: "hl" }, { op: "set", name: "U = Mb(Y)", items: [] }, { op: "badge", text: "GROW (size ≤ 2)", kind: "info" }] },
      { caption: "<b>Pairwise test of X (the trap).</b> Test Y against X marginally (U = ∅). Because XOR hides each parent, X comes out <i>independent</i> of Y on its own. Standard adjacency faithfulness would conclude there is no X–Y edge — and delete a real edge.", ops: [{ op: "testCI", x: "Y", y: "X", z: [], result: "indep" }, { op: "highlightNodes", ids: ["X"], cls: "dim" }, { op: "badge", text: "adjacency-faithfulness would FAIL: near-cancellation hides X→Y", kind: "bad" }] },
      { caption: "<b>Same trap for Z.</b> Z is also <i>marginally independent</i> of Y. A pairwise (1-association) test alone would throw away both genuine parent edges. This is the minimal unfaithful triple of Def. 24.", ops: [{ op: "testCI", x: "Y", y: "Z", z: [], result: "indep" }, { op: "highlightNodes", ids: ["Z"], cls: "dim" }, { op: "badge", text: "Z also pairwise-independent of Y", kind: "bad" }] },
      { caption: "<b>The 2-adjacency clause rescues X.</b> Grow also tries strict 2-associations: test Y against X while conditioning on the helper Z, i.e. <b>Y ⫫̸ X | {Z}</b>. Now the parity is broken and X is clearly <i>dependent</i> on Y. X is admitted. U = {X}.", ops: [{ op: "testCI", x: "Y", y: "X", z: ["Z"], result: "dep" }, { op: "highlightNodes", ids: ["X"], cls: "add" }, { op: "set", name: "U = Mb(Y)", items: ["X"] }, { op: "badge", text: "strict 2-association: T ⫫̸ X | U∪{Z}", kind: "good" }] },
      { caption: "<b>And Z, symmetrically.</b> Test <b>Y ⫫̸ Z | {X}</b>: with X now available as the helper, Z is <i>dependent</i> on Y and is added. The pair {X,Z} witnesses both edges — exactly the strict-2-association of Def. 25. U = {X, Z}.", ops: [{ op: "testCI", x: "Y", y: "Z", z: ["X"], result: "dep" }, { op: "highlightNodes", ids: ["Z"], cls: "add" }, { op: "set", name: "U = Mb(Y)", items: ["X", "Z"] }, { op: "badge", text: "both real edges recovered", kind: "good" }] },
      { caption: "<b>Grow W (an ordinary 1-association).</b> W is a plain parent of Y: test Y against W given U = {X,Z}. It is <i>dependent</i> — a 1-association — so W joins. Grow ends with U = {X, Z, W}.", ops: [{ op: "testCI", x: "Y", y: "W", z: ["X", "Z"], result: "dep" }, { op: "highlightNodes", ids: ["W"], cls: "add" }, { op: "set", name: "U = Mb(Y)", items: ["X", "Z", "W"] }, { op: "badge", text: "grow done", kind: "good" }] },
      { caption: "<b>Shrink to minimality.</b> Re-test each member against Y given the rest. X, Z and W each stay <i>dependent</i> given the others (none is screened off), so none is a false positive. The blanket settles: <b>Mb(Y) = {X, Z, W}</b>.", ops: [{ op: "testCI", x: "Y", y: "X", z: ["Z", "W"], result: "dep" }, { op: "highlightNodes", ids: ["X", "Z", "W"], cls: "add" }, { op: "set", name: "U = Mb(Y)", items: ["X", "Z", "W"] }, { op: "badge", text: "SHRINK → Mb(Y) = {X,Z,W}", kind: "info" }] },
      { caption: "<b>Skeleton around Y.</b> The size-≤2 witnesses confirm true edges X–Y, Z–Y and W–Y. The collider parents X and Z are non-adjacent (independent coins), so no X–Z edge is added.", ops: [{ op: "highlightEdges", edges: [["X","Y"],["Z","Y"],["W","Y"]], cls: "hl" }] },
      { caption: "<b>Force the collider (Theorem 32).</b> X,Z,Y meet the strict-2-association triple conditions — X⫫̸Y|{Z}, Z⫫̸Y|{X}, and X⫫Z marginally — so a collider must sit at Y. Orient <b>X → Y ← Z</b>.", ops: [{ op: "highlightNodes", ids: ["X", "Z", "Y"], cls: "hl" }, { op: "orient", from: "X", to: "Y", type: "directed" }, { op: "orient", from: "Z", to: "Y", type: "directed" }, { op: "badge", text: "strict 2-association ⇒ collider at Y", kind: "good" }] },
      { caption: "<b>Disambiguate with W (Prop. 10, Fig.149).</b> The 1-association W–Y pins the centre: observing Y renders {X,Z} dependent on W, confirming Y (not X or Z) is the collider. Orient <b>W → Y</b> into the same node.", ops: [{ op: "orient", from: "X", to: "Y", type: "directed" }, { op: "orient", from: "Z", to: "Y", type: "directed" }, { op: "orient", from: "W", to: "Y", type: "directed" }, { op: "highlightNodes", ids: ["W"], cls: "hl" }, { op: "badge", text: "1-association W disambiguates the collider", kind: "good" }] },
      { caption: "<b>Result.</b> The full local structure {X,Z} → Y ← W is recovered, including both XOR edges that pairwise testing (standard adjacency faithfulness) would have lost. The graph is learned correctly under the weaker <b>2-adjacency-faithfulness</b> condition.", ops: [{ op: "orient", from: "X", to: "Y", type: "directed" }, { op: "orient", from: "Z", to: "Y", type: "directed" }, { op: "orient", from: "W", to: "Y", type: "directed" }, { op: "badge", text: "structure recovered under 2-adjacency faithfulness", kind: "good" }] }
    ]
  },

  complexity: "Same Grow-Shrink locality as GS, but the grow test now also ranges over size-2 conditioning patterns (a helper Z drawn from the candidates), so each grow scan costs up to O(n²) tests per target instead of O(n) — overall roughly O(n³) tests across n targets in the worst case. Conditioning sets are still capped at the local blanket plus one helper (size ≤ 2 witnesses), keeping individual tests far more reliable than global subset search.",
  strengths: [
    "Correct under a strictly weaker assumption (Lemma 14): recovers structure on noisy-XOR / parity data where adjacency faithfulness — and hence plain PC and GS — silently delete real edges.",
    "Turns the very pattern that breaks pairwise testing into evidence: a strict 2-association directly implies a collider (Theorem 32), aiding orientation.",
    "Drop-in modification of Grow-Shrink — keeps GS's local, decomposable blanket discovery and only widens the grow condition to size-≤2 witnesses.",
    "Still purely constraint-based: needs only CI tests, no scoring function or parametric form."
  ],
  limitations: [
    "More tests than GS: the extra helper variable in the grow clause raises cost from O(n) to O(n²) per scan and admits more interim false positives to shrink away.",
    "Only covers up to 2-sized witnesses; deeper k-way interactions (3+ parents jointly cancelling) need a higher-order k-association generalisation, not this variant.",
    "Still assumes the Markov / I-map side (non-edges are real independencies) and causal sufficiency — only the edge-detection assumption is relaxed.",
    "Inherits constraint-based fragility: errors in the size-2 CI tests can still cascade into wrong neighbours or orientations."
  ],
  notes: "2-adjacency faithfulness sits in a broader line of work weakening the global faithfulness assumption while keeping consistent causal discovery: triangle-faithfulness and SGS-minimality variants, the Selection-via-Representative-Sets approach (Yu et al.) for blanket features that are not faithful to any DAG, ASP/SAT encodings that turn weakened-faithfulness conditions into logical constraints (Zhalama et al.; including V-adjacency-faithfulness for semi-Markovian models), and the Frugality condition for score-based search (Lu et al.) that prefers DAGs explaining the data with the fewest dependencies.",
  figureRefs: "Paper §4.50 (pp.236-240): Recall 62/63 (faithfulness, adjacency faithfulness), Def.24 (unfaithful & minimal unfaithful triple), Def.25 (2-adjacency faithfulness), Lemma 14 (it is weaker than adjacency faithfulness), Theorem 32 (strict 2-association forces a collider), Proposition 10 (orientation rules for 1-/2-associations), Algorithm 62 (Grow-Shrink with 2-adjacency awareness, GS-s≤2), and the noisy-XOR worked example Example 70/71 with Figs.147 (setup), 148 (admissible local structures) and 149 (collider disambiguation)."
};
