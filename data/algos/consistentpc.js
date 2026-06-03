/* ConsistentPC — Consistent PC (Li et al.). Grounded in §4.45 (pp.216-218), ref [376].
   Worked example = Example 62 five-variable run {A,B,C,D,E}; Definition 19 (consistent set);
   Algorithm 56; Theorem 28; Figs.130-134. ConsistentPC builds on PC (§4.1): it re-runs PC's
   deletion phase each round but only allows deletions whose separator stays *admissible*
   (consistent) w.r.t. the current graph, then unions the graphs in any limit cycle. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["consistentpc"] = {
  name: "Consistent PC",
  oneLiner: "Run PC, but only delete an edge when the conditioning set that removes it is still 'consistent' with the graph as it currently stands — then keep re-running the whole deletion phase round after round, and if the graph starts oscillating, output the edge-union of the cycle so the result no longer depends on processing order.",
  basedOnText: "PC deletes X−Y as soon as some set U makes them independent and trusts that decision forever. With finite samples that separator can become inconsistent as the skeleton changes — nodes in U may stop lying on an X−Y trail, or become children of an endpoint — so the edge was removed for a reason the final graph no longer supports. ConsistentPC enforces that every separator used to remove X−Y stays compatible (admissible) with the current graph.",

  assumptions: [
    "<b>Causal sufficiency</b> — no hidden common causes (same as PC).",
    "<b>Faithfulness</b> — independencies in the data reflect missing connections in the true graph.",
    "<b>Reliable CI tests</b> — independence is decided by a statistical test; ConsistentPC is designed precisely for the <i>finite-sample</i> regime where those tests are noisy and a once-valid separator can later look wrong.",
    "<b>Admissibility check is computable</b> — for every candidate deletion the algorithm can compute the consistent set of each endpoint in the current graph and check the separator against it."
  ],
  input: "A dataset over variables V and a conditional-independence (CI) test (the same inputs as PC).",
  output: "A single final graph G<sub>final</sub> with directed and undirected edges. When the round-by-round procedure settles, G<sub>final</sub> is that fixed graph; when it falls into a limit cycle, G<sub>final</sub> is the <b>edge-wise union</b> of the graphs in the cycle, with conflicting arrowheads dropped to undirected edges.",

  idea: [
    "PC removes edges using CI tests and then orients the remaining skeleton. The hidden assumption is that a separator U which made X and Y independent <i>stays meaningful</i>. But the skeleton keeps changing as other edges are deleted: with finite samples a separator U that removed X−Y early can later become <b>inconsistent</b> with the evolving graph — the nodes in U may lose their adjacency to X and/or Y, so they no longer sit on any X−Y path that the surviving graph supports. ConsistentPC is the fix for exactly this drift.",
    "The centerpiece is a notion of a <b>consistent set</b> (Definition 19). For a graph G and two nodes X, Y, consist(X,Y | G) is the set of neighbours Z of X (other than Y) such that there is an X↔Y trail passing through Z <i>and</i> Z is not a child of X. Intuitively these are the nodes that can genuinely act as 'blockers' on an X−Y trail and are not downstream of the endpoint. A separator U is then declared <b>admissible</b> only if U ⊆ consist(X,Y | G) or U ⊆ consist(Y,X | G).",
    "ConsistentPC re-runs PC's deletion phase in <b>rounds</b> k = 0, 1, 2, …. Round 0 builds G₀ from the complete graph by removing the marginally-independent pairs. In every later round it re-examines the deletions against the <i>current</i> graph G<sub>k−1</sub>: an edge X−Y is deleted only if its separator is admissible w.r.t. G<sub>k−1</sub>. Then PC's standard orientation rules are applied to get G<sub>k</sub>. Because admissibility is re-checked every round, a separator that drifts out of consistency causes its edge to be <b>restored</b>, and one that drifts back in causes a deletion — the graph is allowed to correct earlier order-dependent mistakes.",
    "Sometimes this never reaches a single fixed point: the graph oscillates, G<sub>k</sub> = G<sub>k−r</sub> for some r ≥ 1 — a <b>limit cycle</b>. ConsistentPC then returns the union (on edges) of the graphs in the cycle, keeping an edge if any cycle member has it and dropping an arrowhead wherever members disagree. <b>Theorem 28</b> guarantees the payoff: every separating set actually used by the algorithm is consistent with the returned graph G<sub>final</sub> — so the output no longer depends on the accident of processing order, which is what plain PC suffers from."
  ],

  steps: [
    "<b>Round 0 — baseline skeleton.</b> Start from the complete undirected graph on V. Delete X−Y whenever X ⫫ Y given the empty set (|U| = 0). Call the result G₀. (This is PC's order-0 pass.)",
    "<b>Define the consistent set (Definition 19).</b> For the current graph and any pair X, Y compute consist(X,Y | G) = { Z ∈ N<sub>X</sub> \\ {Y} : some X↔Y trail passes through Z, and Z is not a child of X }. A separator U is <b>admissible</b> iff U ⊆ consist(X,Y | G) or U ⊆ consist(Y,X | G).",
    "<b>Round k ≥ 1 — re-run the deletion phase, filtered.</b> Working from G<sub>k−1</sub>, go through adjacent pairs in growing conditioning-set size ℓ = 1, 2, … (over current neighbours, as in PC). For each pair, find a separating set U with |U| = ℓ that makes X ⫫ Y.",
    "<b>Admissibility gate.</b> Delete X−Y <b>only if</b> its separator U is admissible w.r.t. G<sub>k−1</sub> (U ⊆ consist(X,Y | G<sub>k−1</sub>) or U ⊆ consist(Y,X | G<sub>k−1</sub>)). If U is not consistent with the current graph, the deletion is refused and the edge survives this round — undoing the order-dependent drift PC would have committed.",
    "<b>Orient.</b> Apply PC's standard orientation rules (v-structures then Meek's R1–R3) to the filtered skeleton to obtain G<sub>k</sub>.",
    "<b>Check for convergence or a limit cycle.</b> If G<sub>k</sub> equals an earlier graph G<sub>k−r</sub> (r ≥ 1), a limit cycle of length r has been found — stop. Otherwise repeat from the consistent-set step with the new current graph.",
    "<b>Return G<sub>final</sub>.</b> On convergence, return the fixed graph. On a limit cycle, return the edge-wise <b>union</b> of the cycle members G<sub>k−r+1</sub> ∪ … ∪ G<sub>k</sub>: keep an edge present in any member, and where two members disagree on an arrowhead leave that edge undirected (discard the conflicting orientation). By Theorem 28 every separator used is consistent with this G<sub>final</sub>."
  ],

  keyConcepts: [
    { term: "Inconsistent separator", def: "A conditioning set U that legitimately removed X−Y at one point but, as the skeleton evolves, no longer fits the graph — its nodes lose their adjacency to X and/or Y, so they no longer lie on an X−Y trail the surviving structure supports. This drift is the root cause of PC's order-dependence that ConsistentPC targets." },
    { term: "Consistent set consist(X,Y | G) — Definition 19", def: "The neighbours Z of X (other than Y) that sit on some X↔Y trail and are not children of X — the nodes that can serve as reliable 'blockers' between X and Y in the current graph G." },
    { term: "Admissible separator", def: "A separator U is admissible w.r.t. G iff U ⊆ consist(X,Y | G) or U ⊆ consist(Y,X | G). Only admissible separators are allowed to delete an edge — this is the consistency gate." },
    { term: "Round-based re-running", def: "Unlike PC's single pass, ConsistentPC re-runs the entire deletion phase against the current graph each round (k = 0,1,2,…). A separator that becomes inconsistent gets its edge restored; one that becomes consistent gets its edge deleted — letting the graph self-correct." },
    { term: "Limit cycle", def: "When the rounds do not converge to one graph but repeat, G_k = G_{k−r}, the procedure oscillates with period r. ConsistentPC detects this and stops rather than looping forever." },
    { term: "Edge-wise union", def: "On a limit cycle the output keeps every edge that appears in any cycle member; where members disagree on an arrowhead the edge is left undirected. This makes the output independent of which graph the cycle is entered at — i.e. order-independent." },
    { term: "Theorem 28 (consistency of returned separators)", def: "Every separating set used by ConsistentPC is consistent with the final graph G_final. This is the formal statement that the output is stable/order-independent." }
  ],

  animation: {
    title: "ConsistentPC on the five-variable example {A,B,C,D,E} (paper Example 62, Figs. 130-134).",
    nodes: [
      { id: "A", x: 0.05, y: 0.5 },
      { id: "B", x: 0.34, y: 0.5 },
      { id: "C", x: 0.66, y: 0.1 },
      { id: "D", x: 0.66, y: 0.9 },
      { id: "E", x: 0.97, y: 0.5 }
    ],
    edges: [
      { from: "A", to: "B", type: "undirected" }, { from: "A", to: "C", type: "undirected" },
      { from: "A", to: "D", type: "undirected" }, { from: "A", to: "E", type: "undirected" },
      { from: "B", to: "C", type: "undirected" }, { from: "B", to: "D", type: "undirected" },
      { from: "B", to: "E", type: "undirected" }, { from: "C", to: "D", type: "undirected" },
      { from: "C", to: "E", type: "undirected" }, { from: "D", to: "E", type: "undirected" }
    ],
    steps: [
      { caption: "<b>Round 0 (|U| = 0).</b> Start from the complete undirected graph on {A,B,C,D,E}. The only marginal independencies are A ⫫ E, A ⫫ C and A ⫫ D, so those three edges are removed, giving the baseline skeleton G₀ (Fig. 132a).", ops: [{ op: "badge", text: "k = 0, |U| = 0", kind: "info" }, { op: "testCI", x: "A", y: "E", z: [], result: "indep" }, { op: "removeEdge", from: "A", to: "E" }, { op: "removeEdge", from: "A", to: "C" }, { op: "removeEdge", from: "A", to: "D" }] },
      { caption: "<b>Why plain PC drifts.</b> Next PC would test order-1 separations and delete edges the instant any single variable separates a pair. But a separator chosen now may stop fitting the graph after other edges go — and PC never re-checks, so its answer depends on the order pairs were visited.", ops: [{ op: "badge", text: "plain PC: order-dependent", kind: "bad" }, { op: "highlightEdges", edges: [["B","C"],["C","D"],["B","E"]], cls: "dim" }] },
      { caption: "<b>Round 1 (|U| = 1), consistency-gated.</b> Compute consistent sets w.r.t. G₀. E lies in consist for B and C, so the separator {E} for C−B is <b>admissible</b>: delete B−C. (ConsistentPC only deletes when the separator is consistent with the current graph.)", ops: [{ op: "badge", text: "k = 1: {E} admissible", kind: "good" }, { op: "set", name: "consist(C,B|G₀)", items: ["E", "…"] }, { op: "testCI", x: "C", y: "B", z: ["E"], result: "indep" }, { op: "removeEdge", from: "B", to: "C" }, { op: "clearSet" }] },
      { caption: "<b>Round 1 continued.</b> Likewise B, E ∈ consist(D,C | G₀), so the separator {B,E} for D−C is admissible: delete C−D. Both admissible deletions yield G₁ (Fig. 132b).", ops: [{ op: "badge", text: "{B,E} admissible", kind: "good" }, { op: "set", name: "consist(D,C|G₀)", items: ["B", "E"] }, { op: "testCI", x: "D", y: "C", z: ["B", "E"], result: "indep" }, { op: "removeEdge", from: "C", to: "D" }, { op: "clearSet" }] },
      { caption: "<b>Orient G₁ (Fig. 133a).</b> Standard PC orientation: A→B, and the collider C→E←D appears. This is the orientation snapshot after round k = 1.", ops: [{ op: "orient", from: "A", to: "B", type: "directed" }, { op: "orient", from: "C", to: "E", type: "directed" }, { op: "orient", from: "D", to: "E", type: "directed" }, { op: "badge", text: "G₁", kind: "info" }] },
      { caption: "<b>Round 2 — re-check against G₁.</b> Now consist(C,B | G₁) = ∅, so the separator {E} for C−B is <b>no longer admissible</b>; consist(C,D | G₁) = {E}, so {B,E} for C−D is also disallowed. The earlier deletions are not re-confirmed → edges B−C and C−D are <b>restored</b>. No new deletions: G₂ (Fig. 132b/133b).", ops: [{ op: "badge", text: "k = 2: separators inadmissible → restore", kind: "bad" }, { op: "addEdge", from: "B", to: "C" }, { op: "addEdge", from: "C", to: "D" }, { op: "highlightEdges", edges: [["B","C"],["C","D"]], cls: "hl" }] },
      { caption: "<b>Round 3 — re-check against G₂.</b> Test C ⫫ B | E becomes admissible again with consist(C,B | G₂) = {E,D}, while D ⫫ C | {B,E} stays inadmissible. So only B−C is deleted this round, orienting toward G₃ (Fig. 133c).", ops: [{ op: "badge", text: "k = 3: {E} admissible again", kind: "good" }, { op: "set", name: "consist(C,B|G₂)", items: ["E", "D"] }, { op: "testCI", x: "C", y: "B", z: ["E"], result: "indep" }, { op: "removeEdge", from: "B", to: "C" }, { op: "clearSet" }] },
      { caption: "<b>Round 4 — limit cycle detected.</b> The same procedure returns G₄, which matches G₃ on the undirected part (Fig. 134a): the graph is now oscillating between two states. G₄ = G₃-shaped, so a 2-cycle is found and the rounds stop.", ops: [{ op: "badge", text: "k = 4: G₄ ≈ G₃ → 2-cycle", kind: "info" }, { op: "addEdge", from: "B", to: "C" }, { op: "highlightEdges", edges: [["B","C"],["C","D"]], cls: "dim" }] },
      { caption: "<b>Resolve the cycle by edge-wise union.</b> G<sub>final</sub> = G₃ ∪ G₄ keeps every edge present in either member; where the two members give B conflicting arrowheads, the edge is left undirected (conflicting orientations discarded). This union is what makes the output order-independent.", ops: [{ op: "badge", text: "G_final = G₃ ∪ G₄", kind: "good" }, { op: "addEdge", from: "C", to: "D" }] },
      { caption: "<b>Final graph (Fig. 133/134c).</b> B is the hub: A→B, E→B and D→B all point in; the triangle C−E, C−D, D−E remains undirected (arrowheads conflicted across the cycle). The only nontrivial separator that survives is {E} for C ⫫ B, and indeed E ∈ consist(C,B | G_final).", ops: [{ op: "orient", from: "A", to: "B", type: "directed" }, { op: "orient", from: "E", to: "B", type: "directed" }, { op: "orient", from: "D", to: "B", type: "directed" }, { op: "highlightEdges", edges: [["C","E"],["C","D"],["D","E"]], cls: "dim" }] },
      { caption: "<b>Consistency guaranteed (Theorem 28).</b> Every separating set used by ConsistentPC is consistent with G<sub>final</sub>. Unlike plain PC, no separator was trusted past the point where it stopped fitting the graph — so the result does not depend on the order pairs were processed.", ops: [{ op: "badge", text: "all separators consistent → order-independent", kind: "good" }] }
    ]
  },

  complexity: "Each round is a full PC deletion+orientation pass (worst-case exponential in the largest node degree, efficient on sparse graphs), with an added per-deletion admissibility check that computes consistent sets in the current graph. ConsistentPC runs several such rounds until convergence or a detected limit cycle, so it costs a small constant-to-modest multiple of a single PC run.",
  strengths: [
    "Directly removes PC's order-dependence: a separator is honoured only while it stays consistent with the current graph, and the union over a limit cycle makes the output independent of entry point.",
    "Self-correcting — edges deleted on a now-invalid separator are restored, and edges become deletable again once their separator regains consistency.",
    "Formal guarantee (Theorem 28): every separator used is consistent with the returned graph.",
    "Keeps PC's tooling: same CI tests, same orientation (v-structures + Meek's rules), efficient on sparse graphs."
  ],
  limitations: [
    "More expensive than a single PC run — multiple rounds plus a consistency check on every candidate deletion.",
    "May not converge to one graph; the limit-cycle union leaves the conflicting edges undirected, so the output can be less fully oriented than PC's CPDAG.",
    "Still assumes causal sufficiency (no hidden confounders) and relies on CI tests, even though it is more robust to their finite-sample errors.",
    "The consistent-set definition adds conceptual and implementation overhead compared with PC's single stored separating set."
  ],
  notes: "ConsistentPC (Li et al., ref [376]) builds directly on PC (§4.1): same skeleton tooling and orientation rules, but each deletion is gated by an admissibility/consistency check (Definition 19) and the deletion phase is re-run in rounds, with a limit-cycle union resolving oscillation. It tackles the same order-dependence issue as the stable/order-independent and conservative (CPC) variants, but does so by enforcing separator consistency against the evolving graph rather than by reordering work or by a conservative collider vote.",
  figureRefs: "Paper §4.45 (pp.216–218), ref [376]: Definition 19 (consistent set), Algorithm 56 (Consistent PC), Theorem 28 (consistency of returned separators), Example 61 + Fig.130 (inconsistent separators under sampling noise), Fig.131 (consistent-set intuition), Example 62 worked run + Fig.132 (k=0→1), Fig.133 (stages k=1→3), Fig.134 (limit cycle and edge-wise union G_final = G₃ ∪ G₄)."
};
