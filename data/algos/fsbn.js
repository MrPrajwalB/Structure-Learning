/* FSBN — Fast Search Bayesian Network (Minn & Shunkai, ref [469]). Constraint-based,
   built directly on PC. Grounded in §4.67 (pp.315-317): Algorithm 88 (FSBN),
   Fig.203 (initialization + ground-truth running example), Def.46-47 (node-/set-level
   RDSA), Example 96 (guided sepset search), Remark 25 (SSBN variant). */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["fsbn"] = {
  name: "Fast Search Bayesian Network (FSBN)",
  oneLiner: "Run the PC algorithm exactly as usual — grow the skeleton by deleting edges with conditional-independence tests — but at each conditioning-set size, test the most promising conditioning sets first, learned on the fly from which variables have separated pairs before, so a valid separator is hit sooner and fewer tests are wasted.",
  basedOnText: "FSBN is a speed-up of the constraint-based PC algorithm. It keeps PC's outer schedule and its correctness, but replaces PC's arbitrary order of trying conditioning sets with a history-based ranking — the Relative d-Separating Ability (RDSA) score — so the search finds separating sets faster.",

  assumptions: [
    "<b>Everything PC assumes</b> — causal sufficiency (no hidden common causes), faithfulness (every independence reflects a missing edge), and reliable CI tests. FSBN inherits PC's assumptions unchanged.",
    "<b>Structure carries over between pairs</b> — the practical premise behind RDSA: a variable that has helped separate one pair tends to help separate others, so its past usefulness is informative for ordering future tests.",
    "<b>Same oracle ⇒ same skeleton</b> — with a perfect CI test FSBN deletes exactly the edges PC would; reordering tests only changes how many are run, not which edges survive."
  ],
  input: "A dataset D over variables V and a conditional-independence (CI) test — identical inputs to PC.",
  output: "The same <b>CPDAG</b> PC would produce: the skeleton plus separating sets, then oriented v-structures and Meek-propagated edges representing the Markov-equivalence class.",

  idea: [
    "PC learns the skeleton by testing pairs at increasing conditioning-set size ℓ = 0, 1, 2, …, and for a pair (X,Y) it tries subsets of X's neighbours as conditioning sets until one makes them independent (a <i>separator</i>). The catch: classical PC tries those candidate sets in an <b>arbitrary order</b> and treats them all equally, so it can run many useless tests before stumbling onto a set that actually separates.",
    "FSBN's insight (paper Fig.203): some variables are good separators because they sit on many paths connecting other variables. If conditioning on Z separated X from one variable, a set containing Z is more likely to separate X from <i>other</i> variables too — so those sets should be tried <b>first</b>.",
    "FSBN turns this into a learned score, <b>RDSA (Relative d-Separating Ability)</b>. Every time a CI test succeeds (X ⫫ Y | U), each member Z of the successful set U earns a point for X: RDSA<sub>X</sub><sup>Z</sup> += 1 (Def.46). A whole candidate set is then scored by the sum of its members' points, RDSA<sub>X</sub><sup>U</sup> = Σ<sub>Z∈U</sub> RDSA<sub>X</sub><sup>Z</sup> (Def.47).",
    "At each size ℓ, the candidate conditioning sets for X are sorted by <b>decreasing</b> RDSA score and tested in that order. Historically effective variables float to the top, so the test that deletes the edge tends to come early — and as soon as one set separates the pair, FSBN stops (the <i>break</i>), exactly like PC. The result is fewer and often shorter searches, with the same skeleton."
  ],

  steps: [
    "<b>Initialise.</b> Start from the complete undirected graph on V (every pair connected), set conditioning-set size ℓ = 0, and set every node-level score RDSA<sub>X</sub><sup>Z</sup> = 0. (Alg.88 lines 1–6.)",
    "<b>Order-0 tests.</b> For each adjacent pair (X,Y), test X ⫫ Y given the empty set. If independent, delete the edge and record the separating set. No scores change yet (the empty set has no members to reward).",
    "<b>Pick the pairs still to test at this size.</b> Increase ℓ by 1. Consider every adjacent pair (X,Y) for which X still has at least ℓ other neighbours — i.e. there is still a size-ℓ conditioning set to try.",
    "<b>Rank the candidate sets (the FSBN step).</b> For pair (X,Y), form all size-ℓ subsets U of X's current neighbours (excluding Y), then <b>sort them by decreasing RDSA<sub>X</sub><sup>U</sup></b> = Σ<sub>Z∈U</sub> RDSA<sub>X</sub><sup>Z</sup>. Sets built from historically effective separators are tested first. (Alg.88 lines 8–9; Def.47.)",
    "<b>Test in that order, stop early.</b> Walk the ranked sets and run the CI test. The first set U with X ⫫ Y | U deletes the edge, records Sep(X,Y)=U, and <b>breaks</b> out of the search for this pair — no further size-ℓ sets are tried (same early stop as PC). Because the good set was likely near the front, far fewer tests are run than PC's blind order. (Alg.88 lines 10–13, 16.)",
    "<b>Reward the winners (update RDSA online).</b> For every Z in the successful set U, increment RDSA<sub>X</sub><sup>Z</sup> += 1. These updated scores sharpen the ranking for all later pairs and sizes. (Alg.88 line 13; Def.46.)",
    "<b>Repeat</b> the rank-test-reward loop for ℓ = 2, 3, … until no node has more than ℓ neighbours left to condition on. What remains is the <b>skeleton</b> — identical to the one PC would have found.",
    "<b>Orient like PC.</b> FSBN changes only skeleton search, so orientation is unchanged: find v-structures (a triple X − Z − Y with X,Y non-adjacent and Z ∉ Sep(X,Y) becomes the collider X → Z ← Y), then apply Meek's rules R1–R3.",
    "<b>Return</b> the CPDAG together with the separating sets U<sub>X,Y</sub>. (Alg.88 line 22.)"
  ],

  keyConcepts: [
    { term: "RDSA — Relative d-Separating Ability", def: "FSBN's history-based score that estimates how good a variable (or a set) is at separating pairs. It is the whole point of FSBN: it ranks which conditioning sets to try first." },
    { term: "Node-level RDSA (Def.46)", def: "A per-target counter RDSA_X^Z: each time a CI test finds X ⫫ Y | U, every member Z of U gets +1 for X. Variables that keep appearing in successful separators accumulate high scores." },
    { term: "Set-level RDSA (Def.47)", def: "A candidate conditioning set U is scored by the sum of its members' node-level scores, RDSA_X^U = Σ_{Z∈U} RDSA_X^Z. Sets are tested in decreasing order of this sum." },
    { term: "Guided sepset search", def: "PC tries conditioning sets in arbitrary order; FSBN sorts them by RDSA so the set most likely to separate the pair is tested first — the source of the speed-up." },
    { term: "Early stop (break)", def: "As soon as one set separates a pair, the edge is deleted and the search for that pair ends. PC has this too; FSBN's gain is that the deleting set tends to be reached sooner." },
    { term: "Same skeleton as PC", def: "FSBN reorders tests, it does not change the criterion. With a perfect CI oracle the deleted edges — and therefore the skeleton and CPDAG — are exactly PC's." }
  ],

  animation: {
    title: "FSBN on the paper's running example (Fig. 203b): X→M, X→Z, M→Y, Z→Y, Z→N. We contrast FSBN's ranked, cached search with plain PC's blind order.",
    nodes: [
      { id: "X", x: 0.10, y: 0.30 },
      { id: "M", x: 0.62, y: 0.10 },
      { id: "Y", x: 0.92, y: 0.50 },
      { id: "Z", x: 0.30, y: 0.78 },
      { id: "N", x: 0.78, y: 0.92 }
    ],
    edges: [
      { from: "X", to: "M", type: "undirected" }, { from: "X", to: "Y", type: "undirected" },
      { from: "X", to: "Z", type: "undirected" }, { from: "X", to: "N", type: "undirected" },
      { from: "M", to: "Y", type: "undirected" }, { from: "M", to: "Z", type: "undirected" },
      { from: "M", to: "N", type: "undirected" }, { from: "Y", to: "Z", type: "undirected" },
      { from: "Y", to: "N", type: "undirected" }, { from: "Z", to: "N", type: "undirected" }
    ],
    steps: [
      { caption: "<b>Start (Alg.88 lines 1–6).</b> Like PC, FSBN begins from the complete undirected graph on {X,M,Y,Z,N}. Set ℓ = 0 and initialise every RDSA score to 0 — the score table that will steer the search.", ops: [{ op: "badge", text: "ℓ = 0", kind: "info" }, { op: "set", name: "RDSA(X)", items: ["M:0", "Y:0", "Z:0", "N:0"] }] },
      { caption: "<b>Order 0 (condition on ∅).</b> Test pairs marginally. In this example no pair is independent on its own, so no edge is deleted yet. Empty set has no members, so no RDSA points are awarded.", ops: [{ op: "badge", text: "ℓ = 0: no separations", kind: "info" }] },
      { caption: "<b>ℓ = 1, pair (X,N).</b> All size-1 sets have RDSA 0 so far, so order is still arbitrary. The test X ⫫ N | {Z} succeeds — Z screens X from N. Delete X–N and record Sep(X,N)={Z}.", ops: [{ op: "badge", text: "ℓ = 1", kind: "info" }, { op: "testCI", x: "X", y: "N", z: ["Z"], result: "indep" }, { op: "removeEdge", from: "X", to: "N" }] },
      { caption: "<b>Reward the winner (Def.46).</b> Z was the separating variable, so RDSA<sub>X</sub><sup>Z</sup> += 1. Z is now a known-good separator for X — FSBN will try Z-containing sets first from here on.", ops: [{ op: "highlightNodes", ids: ["Z"], cls: "good" }, { op: "set", name: "RDSA(X)", items: ["Z:1  ★", "M:0", "Y:0", "N:0"] }, { op: "badge", text: "RDSA_X(Z) = 1", kind: "good" }] },
      { caption: "<b>ℓ = 1, pair (X,Y): the FSBN advantage.</b> Candidate single-variable sets are {Z},{M},{N}. FSBN sorts by RDSA: {Z} scores 1, the rest 0 — so {Z} is tested FIRST. Plain PC, with no memory, might try {M} and {N} first and waste those tests.", ops: [{ op: "badge", text: "rank: {Z}=1 > {M}=0 = {N}=0", kind: "info" }, { op: "highlightNodes", ids: ["Z"], cls: "good" }] },
      { caption: "<b>Try {Z} first — but X and Y are NOT independent given Z alone</b> (the path X→M→Y is still open). Test fails; edge stays. FSBN keeps walking the ranked list at this size.", ops: [{ op: "testCI", x: "X", y: "Y", z: ["Z"], result: "dep" }, { op: "highlightEdges", edges: [["X", "Y"]], cls: "bad" }] },
      { caption: "<b>ℓ = 1 finishes; advance to ℓ = 2.</b> Other true edges survive every size-1 test (e.g. M and Z stay adjacent here). When PC needs size-2 sets, FSBN again ranks them by RDSA before testing. (Alg.88 lines 20–21.)", ops: [{ op: "badge", text: "ℓ = 2", kind: "info" }] },
      { caption: "<b>ℓ = 2, pair (X,Y): ranking pays off again.</b> Set-level RDSA (Def.47) sums members' scores, so every candidate pair that CONTAINS Z — like {Z,M} — outranks pairs without it. FSBN tests {Z,M} near the front instead of last.", ops: [{ op: "highlightNodes", ids: ["Z", "M"], cls: "good" }, { op: "badge", text: "RDSA_X({Z,M}) = 1+0 highest", kind: "info" }] },
      { caption: "<b>Separator found early.</b> X ⫫ Y | {Z,M} holds — Z and M together block every path from X to Y. Delete X–Y, record Sep(X,Y)={Z,M}, and <b>break</b> (stop testing further size-2 sets for this pair). Far fewer tests than PC's blind scan.", ops: [{ op: "testCI", x: "X", y: "Y", z: ["Z", "M"], result: "indep" }, { op: "removeEdge", from: "X", to: "Y" }, { op: "badge", text: "early break — tests skipped", kind: "good" }] },
      { caption: "<b>Reward again.</b> Both Z and M get +1 for X (Def.46). The score table keeps sharpening, so the remaining pairs that still need size-2 sets are searched even faster — the cumulative speed-up FSBN is designed for.", ops: [{ op: "set", name: "RDSA(X)", items: ["Z:2  ★", "M:1  ★", "Y:0", "N:0"] }, { op: "highlightNodes", ids: ["Z", "M"], cls: "good" }] },
      { caption: "<b>Skeleton done (same as PC).</b> The surviving edges X–M, X–Z, M–Y, Z–Y, Z–N match the ground-truth adjacencies. FSBN reached this with fewer CI tests, but the skeleton is identical to PC's.", ops: [{ op: "badge", text: "skeleton = PC's", kind: "good" }, { op: "highlightEdges", edges: [["X", "M"], ["X", "Z"], ["M", "Y"], ["Z", "Y"], ["Z", "N"]], cls: "hl" }] },
      { caption: "<b>Orient with PC's rules.</b> Triple M–Y–Z: M and Z are adjacent, so it is not a collider here; the v-structure / Meek pass orients edges as PC would (FSBN never changes orientation). Final result: the CPDAG plus the recorded separating sets.", ops: [{ op: "orient", from: "X", to: "M", type: "directed" }, { op: "orient", from: "X", to: "Z", type: "directed" }, { op: "orient", from: "M", to: "Y", type: "directed" }, { op: "orient", from: "Z", to: "Y", type: "directed" }, { op: "orient", from: "Z", to: "N", type: "directed" }, { op: "badge", text: "CPDAG returned", kind: "good" }] }
    ]
  },

  complexity: "Same worst-case order as PC — exponential in the largest node degree, because in the worst case all candidate conditioning sets at a size must still be tried. FSBN does not change this bound; it cuts the <i>typical</i> number of CI tests by ranking promising sets first so a separator is usually hit early, before the full list is exhausted. The skeleton, and hence the CPDAG, is unchanged.",
  strengths: [
    "Fewer CI tests than PC in practice: ranking conditioning sets by RDSA means a separating set is usually found early, saving the tests PC wastes on unhelpful sets.",
    "No loss of correctness: with a perfect CI oracle FSBN returns exactly PC's skeleton and CPDAG — it only reorders tests, it does not change the deletion criterion.",
    "Self-tuning and cheap: RDSA is just running counts updated online from successes; it adds negligible overhead and needs no extra data or scoring model.",
    "Drop-in on PC's pipeline: same inputs, same outer schedule, same orientation phase — only the within-size test order differs."
  ],
  limitations: [
    "Inherits all of PC's weaknesses — sensitivity to CI-test errors, unreliable large-conditioning-set tests, and the causal-sufficiency assumption; FSBN speeds PC up but does not make it more robust.",
    "The speed-up is heuristic: if good separators do not recur across pairs, the RDSA ranking gives little benefit and reduces to roughly PC's behaviour.",
    "In finite samples the reordered schedule can slightly change which edges are removed (because early successful tests differ), so results need not be bit-identical to a particular PC ordering — the paper's guarantee is for the perfect-oracle case.",
    "RDSA rewards by count, not by separator size, so it can favour larger sets; the SSBN variant (Remark 25) addresses this."
  ],
  notes: "FSBN is by Minn & Shunkai (ref [469]). A sibling variant, <b>SSBN — Smart Search BN</b> (Remark 25), uses the same RDSA machinery but down-weights a separator by its set size, updating RDSA<sub>X</sub><sup>Z</sup> += 1/|U|. This favours small (parsimonious) separating sets — reducing over-conditioning — while keeping PC's outer schedule. Both methods change only the order of CI tests, not the underlying constraint-based logic.",
  figureRefs: "Paper §4.67 (pp.315–317): Algorithm 88 (FSBN), Fig.203 (a: fully-connected start; b: ground-truth DAG running example), Def.46 (node-level RDSA), Def.47 (set-level RDSA and ranking), Example 96 (guided sepset search), Remark 25 (SSBN variant)."
};
