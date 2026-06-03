/* IAMB — Incremental Association Markov Blanket. Grounded in §5.2 (pp.324-326):
   Algorithm 93 (IAMB, grow-by-max-association then shrink) and the worked example
   Example 98 / Fig.207 with target T. IAMB improves GS's blanket discovery by, in the
   grow phase, always adding the variable with the HIGHEST conditional association
   I(X;T|CMb) to the target rather than any dependent variable in scan order. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["iamb"] = {
  name: "Incremental Association Markov Blanket (IAMB)",
  oneLiner: "A grow-then-shrink Markov-blanket discovery method that improves on Grow-Shrink: in the grow phase it does not add just any dependent variable, but always the one with the HIGHEST conditional association with the target, then it shrinks away any members that become independent given the rest.",
  basedOnText: "IAMB is a constraint-based, Markov-blanket-centred method that builds directly on GS. Both keep a candidate blanket CMb for a target T and prune it at the end; the difference is purely in how candidates are admitted during growth — GS adds any variable that tests dependent (so the result can depend on scan order), whereas IAMB ranks candidates by their conditional association with T and admits only the current maximum.",

  assumptions: [
    "<b>Faithfulness</b> — every (in)dependence in the data reflects the true graph, so the target's Markov blanket is exactly recoverable from CI tests.",
    "<b>Causal sufficiency</b> — no hidden common causes; all relevant variables are observed.",
    "<b>Reliable CI tests</b> — independence is judged by a statistical test at a chosen significance level α (IAMB is typically instantiated with conditional mutual information and a standard χ²/G²-style test).",
    "A variable's Markov blanket (its parents, children, and the other parents of its children) is unique and renders it independent of everything else."
  ],
  input: "A dataset D over variables V, a target variable T ∈ V, an association measure I(X;T|U) (e.g. conditional mutual information), and a conditional-independence test at level α.",
  output: "The <b>Markov blanket Mb(T)</b> of the target T — the set of its parents, children, and spouses (the co-parents of its children).",

  idea: [
    "IAMB, like GS, finds the <b>Markov blanket</b> of a target T: the smallest set of variables that, once known, makes T independent of everything else — in a Bayesian network exactly T's parents, children, and the other parents of those children. It does this with a two-pass <b>grow-then-shrink</b> loop of conditional-independence tests, keeping a candidate blanket CMb.",
    "The crucial improvement is in the <b>grow phase</b>. GS scans the remaining variables and immediately admits <i>any</i> X that is still dependent on T given the current CMb — so which variables get in, and in what order, can depend on the arbitrary scan order. IAMB instead <b>ranks the candidates by their conditional association with the target</b>, I(X;T|CMb), and considers them one at a time, adding only the current <b>maximizer</b> — and only if it is confirmed dependent on T given CMb.",
    "Why the maximum? Adding the most strongly associated variable first means genuine blanket members tend to enter early, before weaker or merely indirect dependencies. This makes IAMB less sensitive to scan order and curbs redundant inclusions — fewer false positives are admitted in the first place, so the blanket stays smaller and the conditioning sets used in later tests stay small (and therefore more reliable).",
    "Once growth stabilizes (no further addition is supported), IAMB runs <b>exactly the same shrink phase as GS</b>: each member X of CMb is tested against T given the rest of the blanket, CMb\\{X}; if X has become independent it was a false positive and is removed. What survives is Mb(T).",
    "Because every CI test conditions only on the local candidate blanket, IAMB — like GS — keeps conditioning sets small and the number of tests manageable, which is what makes it scalable to many variables."
  ],

  steps: [
    "<b>Initialise.</b> Fix the target T. Start with an empty candidate blanket CMb = ∅.",
    "<b>Grow — rank by association (the key step).</b> Among all variables not yet chosen, X ∈ V \\ ({T} ∪ CMb), compute the conditional association with the target I(X;T|CMb) and pick the maximizer X* = argmax I(X;T|CMb).",
    "<b>Grow — admit only if dependent.</b> If X* is still <i>dependent</i> on T given CMb (the CI test rejects X* ⫫ T | CMb at level α), add it: CMb ← CMb ∪ {X*}. Otherwise nothing is added.",
    "<b>Repeat</b> the rank-and-admit step, each time re-scoring the remaining variables against the now-larger CMb, until CMb does not change — the grow phase is done.",
    "<b>Shrink (same as GS).</b> For each X currently in CMb, test X ⫫ T given the rest of the blanket, CMb \\ {X}. If they are independent (the test fails to reject at α), X was a false positive — remove it: CMb ← CMb \\ {X}.",
    "<b>Return</b> the pruned set as the Markov blanket: Mb(T) ← CMb."
  ],

  keyConcepts: [
    { term: "Markov blanket Mb(T)", def: "The smallest set that shields T from all other variables: its parents, its children, and the other parents of its children (its spouses). Knowing Mb(T) makes T independent of everything else." },
    { term: "Conditional association I(X;T|CMb)", def: "A measure (typically conditional mutual information) of how much X and the target still share once the current candidate blanket CMb is known. IAMB uses it to RANK candidates and pick the strongest." },
    { term: "Grow by maximum association", def: "IAMB's signature step: instead of admitting any dependent variable (GS), it adds the single variable with the highest I(X;T|CMb) that is confirmed dependent — admitting strong blanket members first." },
    { term: "Shrink phase", def: "Identical to GS: drop any candidate X that becomes independent of T given the rest of the blanket, CMb\\{X}. This removes the false positives growth let in." },
    { term: "False positive (in the blanket)", def: "A variable admitted during growth only because a genuine blanket member had not yet been included; once the set is complete it is screened off and shrink removes it." },
    { term: "Scan-order sensitivity", def: "GS admits the first dependent variable it encounters, so its output can vary with the order variables are scanned. Ranking by association makes IAMB far less sensitive to this." }
  ],

  animation: {
    title: "IAMB building the Markov blanket of target T (paper Example 98, Fig. 207). Graph edges: F→E, A→T, B→T, B→C, E→D, D→C, T→C. (F is an outsider that never enters the blanket.)",
    nodes: [
      { id: "F", x: 0.18, y: 0.08 },
      { id: "A", x: 0.55, y: 0.08 },
      { id: "E", x: 0.10, y: 0.45 },
      { id: "T", x: 0.50, y: 0.45 },
      { id: "B", x: 0.92, y: 0.45 },
      { id: "D", x: 0.28, y: 0.86 },
      { id: "C", x: 0.62, y: 0.86 }
    ],
    edges: [
      { from: "F", to: "E", type: "directed" },
      { from: "A", to: "T", type: "directed" },
      { from: "B", to: "T", type: "directed" },
      { from: "B", to: "C", type: "directed" },
      { from: "E", to: "D", type: "directed" },
      { from: "D", to: "C", type: "directed" },
      { from: "T", to: "C", type: "directed" }
    ],
    steps: [
      { caption: "<b>Pick the target.</b> We learn the Markov blanket of <b>T</b>. Start with an empty candidate blanket CMb = ∅. The grow phase will add variables by <i>maximum association</i> with T; the shrink phase will later strip the false positives.", ops: [{ op: "highlightNodes", ids: ["T"], cls: "hl" }, { op: "set", name: "CMb = Mb(T)", items: [] }, { op: "badge", text: "GROW", kind: "info" }] },
      { caption: "<b>Grow — rank candidates.</b> Score every other variable's conditional association with T given CMb = ∅. This is IAMB's key move: rather than adding any dependent variable (as GS would), it compares I(X;T|CMb) across all candidates and picks the strongest.", ops: [{ op: "highlightNodes", ids: ["A", "B", "C", "D", "E", "F"], cls: "hl" }, { op: "score", text: "assoc = I(X;T | CMb): A highest, then B, C, D, E; F ≈ 0" }] },
      { caption: "<b>Grow — add the maximizer A.</b> A has the highest association I(A;T|CMb) and is confirmed <i>dependent</i> on T (it is a parent of T), so A is admitted. CMb = {A}. (GS might have added whichever dependent variable came first in the scan; IAMB deliberately takes the strongest.)", ops: [{ op: "score", text: "A maximizes I(X;T | CMb), A ⫫̸ T | CMb" }, { op: "testCI", x: "T", y: "A", z: [], result: "dep" }, { op: "highlightNodes", ids: ["A"], cls: "add" }, { op: "set", name: "CMb = Mb(T)", items: ["A"] }] },
      { caption: "<b>Grow — re-rank, add B.</b> Re-score the remaining variables against CMb = {A}. Now B is the maximizer of I(X;T|CMb) and is dependent (it is the other parent of T and a spouse via child C), so B is admitted. CMb = {A, B}.", ops: [{ op: "score", text: "B maximizes I(X;T | CMb), B ⫫̸ T | CMb" }, { op: "testCI", x: "T", y: "B", z: ["A"], result: "dep" }, { op: "highlightNodes", ids: ["B"], cls: "add" }, { op: "set", name: "CMb = Mb(T)", items: ["A", "B"] }] },
      { caption: "<b>Grow — re-rank, add C.</b> Against CMb = {A, B}, the next strongest dependent variable is C (a child of T), so it joins. CMb = {A, B, C}.", ops: [{ op: "score", text: "C maximizes I(X;T | CMb), C ⫫̸ T | CMb" }, { op: "testCI", x: "T", y: "C", z: ["A", "B"], result: "dep" }, { op: "highlightNodes", ids: ["C"], cls: "add" }, { op: "set", name: "CMb = Mb(T)", items: ["A", "B", "C"] }] },
      { caption: "<b>Grow — D and E still test dependent.</b> Continuing the rank-and-admit loop, D and E come out as the next maximizers and still test dependent on T (information flows T→C→D and via E→D→C), so both are admitted — even though they are only indirect links. CMb = {A, B, C, D, E}. Growth now stabilizes: no further additions.", ops: [{ op: "score", text: "D then E maximize I(X;T | CMb), both ⫫̸ T | CMb" }, { op: "testCI", x: "T", y: "D", z: ["A", "B", "C"], result: "dep" }, { op: "highlightNodes", ids: ["D", "E"], cls: "add" }, { op: "set", name: "CMb = Mb(T)", items: ["A", "B", "C", "D", "E"] }, { op: "badge", text: "grow done", kind: "good" }] },
      { caption: "<b>F is never added.</b> F sits outside the blanket — it is screened off from T (its only path runs F→E→D→C and is blocked once the blanket is in CMb), so its association I(F;T|CMb) stays near zero and it is never the maximizer. CMb is unchanged.", ops: [{ op: "highlightNodes", ids: ["F"], cls: "dim" }, { op: "set", name: "CMb = Mb(T)", items: ["A", "B", "C", "D", "E"] }] },
      { caption: "<b>Shrink phase begins (same step as GS).</b> Re-examine each member of CMb = {A, B, C, D, E}, testing it against T given <i>all the others</i>, to catch the false positives growth let in.", ops: [{ op: "set", name: "CMb = Mb(T)", items: ["A", "B", "C", "D", "E"] }, { op: "badge", text: "SHRINK", kind: "info" }] },
      { caption: "<b>Shrink — remove E.</b> Test E against T given the rest, CMb \\ {E} = {A, B, C, D}. With C and D in the conditioning set the path through E is blocked, so E ⫫ T | CMb \\ {E} — E was a false positive (an indirect connection). Remove it.", ops: [{ op: "testCI", x: "T", y: "E", z: ["A", "B", "C", "D"], result: "indep" }, { op: "highlightNodes", ids: ["E"], cls: "dim" }, { op: "removeEdge", from: "F", to: "E" }, { op: "removeEdge", from: "E", to: "D" }, { op: "set", name: "CMb = Mb(T)", items: ["A", "B", "C", "D"] }] },
      { caption: "<b>Shrink — keep the rest.</b> A, B, C and D each remain <i>dependent</i> on T given the others, so none is removed. A and B are parents, C is a child, and D stays as a relevant member; E (and F) are excluded.", ops: [{ op: "testCI", x: "T", y: "A", z: ["B", "C", "D"], result: "dep" }, { op: "highlightNodes", ids: ["A", "B", "C", "D"], cls: "add" }, { op: "set", name: "CMb = Mb(T)", items: ["A", "B", "C", "D"] }] },
      { caption: "<b>Return the Markov blanket.</b> IAMB outputs <b>Mb(T) = {A, B, C, D}</b>. Because growth added the strongest-associated variables first, the genuine members entered early and the shrink phase had to remove only one false positive — a cleaner, more scan-order-robust result than plain GS.", ops: [{ op: "highlightNodes", ids: ["A", "B", "C", "D", "T"], cls: "add" }, { op: "set", name: "CMb = Mb(T)", items: ["A", "B", "C", "D"] }, { op: "badge", text: "Mb(T) = {A,B,C,D}", kind: "good" }] }
    ]
  },

  complexity: "Like GS, each grow/shrink loop costs on the order of O(n) CI tests per pass, so the blanket search is roughly O(n²) tests in the number of variables n — with conditioning sets kept local and small. Ranking candidates by association adds the cost of computing I(X;T|CMb) for the remaining variables on each grow iteration, but this is dominated by the size of the blanket rather than the whole graph, and it pays off by admitting fewer false positives.",
  strengths: [
    "Adds the strongest-associated variable first, so genuine blanket members tend to enter early and fewer false positives are admitted than in GS.",
    "Far less sensitive to the order in which variables are scanned than GS, because admission is decided by a ranking, not by who is encountered first.",
    "Keeps conditioning sets small and local (conditioning only on the candidate blanket), so it scales to many variables.",
    "Constraint-based: needs only an association measure and CI tests, no scoring function or assumed parametric form."
  ],
  limitations: [
    "Still sensitive to CI-test errors: with finite samples the maximizer can be misjudged, and an early mistake can cascade.",
    "The grow phase can require a candidate set as large as the true blanket before shrink can prune, so interim conditioning sets — and thus test reliability — depend on blanket size.",
    "Assumes faithfulness and causal sufficiency (no hidden confounders).",
    "Discovers the blanket of one target; recovering the full network requires running it per variable and stitching/orienting the results."
  ],
  notes: "IAMB descends directly from GS and shares its exact shrink step; the innovation is grow-by-maximum-association. Several variants refine the grow/shrink scheduling — most notably <b>interIAMB</b> (interleaving: a shrink step is performed after each admission, keeping the candidate set as small as possible throughout), along with other association-based members of the IAMB family. These local Markov-blanket discovery methods are widely used to seed hybrid (constraint-plus-score) structure learners.",
  figureRefs: "Paper §5.2 (pp.324-326): Algorithm 93 (IAMB, grow-by-maximum-association then shrink), the §5.2.1 text contrasting IAMB with GS, and the worked example Example 98 / Fig.207 (six-variable graph, target T, yielding Mb(T) = {A,B,C,D})."
};
