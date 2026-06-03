/* E-B&B — Extended Branch-and-Bound (Etminani et al., 2010). Grounded in §4.24
   (pp.137-140): Algorithm 31 (E-B&B); Example 34 (variables {C,M,D}); initial
   graph Fig.75; layered-tree illustration Fig.76. It extends the basic
   Branch-and-Bound of de Campos et al. (§4.23, id="bb"). */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["ebb"] = {
  name: "Etminani B&B (E-B&B)",
  oneLiner: "Find the highest-scoring DAG exactly by searching a layered tree that, variable by variable, swaps in alternative parent sets from per-variable score-sorted caches — but with extra pruning rules (best-first cache cut-off, bound-vs-incumbent, and early cycle detection on already-processed variables) that cut away large parts of the tree the plain B&B would still explore.",
  basedOnText: "E-B&B is an <b>exact, score-based</b> method that revisits de Campos et al.'s Branch-and-Bound (§4.23). It keeps B&B's promise — return the globally optimal structure for a decomposable score — but changes <i>how</i> the search tree is built and adds tighter pruning so far fewer candidate graphs are ever examined.",

  assumptions: [
    "<b>Decomposable score</b> — the network score is a sum of independent per-variable 'family scores' score(Xᵢ | Paᵢ), so each variable's parent choice can be evaluated on its own.",
    "<b>Pre-computed parent caches</b> — for every variable Xᵢ a cache Cᵢ of candidate parent sets with their family scores has been built and <b>sorted in descending score order</b> (best parent set first), then pruned.",
    "<b>Acyclicity required</b> — only directed acyclic graphs are valid outputs; cyclic candidates are rejected."
  ],
  input: "A dataset 𝒟 over variables V = (X₁,…,Xₙ) in a fixed processing order, a decomposable score, and for each Xᵢ a descending-sorted, pruned cache Cᵢ of candidate parent sets with their family scores.",
  output: "The single globally optimal DAG 𝒢★ (the structure with the maximum total score).",

  idea: [
    "Like all exact methods, E-B&B treats structure learning as: <i>choose one parent set for every variable so the result is a DAG and the summed family score is as large as possible.</i> Because the score is decomposable, the choices interact only through the no-cycle rule.",
    "Basic B&B (§4.23) explores a tree of partial graphs and prunes a branch when an optimistic <i>bound</i> on what that branch could ever reach falls below the best complete DAG found so far (the <b>incumbent</b>). E-B&B keeps this skeleton but makes three concrete improvements that prune the tree far more aggressively.",
    "<b>(1) A layered tree over the variable order.</b> The root state simply picks, for each variable, its <i>top</i> parent set from the cache (the highest-scoring family). Then layer j explores alternative parent sets for variable Xⱼ only, leaving all other variables at their current selection. Each layer is one variable's cache.",
    "<b>(2) Descending-cache cut-off.</b> Within a layer the children are generated in cache order — best family score first. So the <i>first</i> child that happens to be a DAG is already the best possible DAG obtainable in that layer; E-B&B records it as the new incumbent and <b>stops generating the rest of that layer's children</b>, because none of them can beat it.",
    "<b>(3) Early cycle pruning on processed variables.</b> If a child contains a directed cycle that uses only variables already fixed in the upper layers {X₁,…,Xⱼ₋₁}, that cycle can never be broken by any later layer — so the whole branch is discarded immediately instead of being expanded. At the last layer, any cyclic child is simply dropped. These structural tests cut the search tree without endangering optimality.",
    "The frontier of unexpanded leaves is explored <b>best-first</b>: the next state to expand is always the leaf with the largest current node score, focusing effort where the optimum is most likely to lie."
  ],

  steps: [
    "<b>Build the caches.</b> For every variable Xᵢ assemble its candidate parent sets with family scores and sort the cache Cᵢ in <i>descending</i> score order (best first); prune weak entries. This sorting is what later lets E-B&B stop a layer early.",
    "<b>Root state.</b> Build the root NS₀ by giving every variable its top (highest-scoring) parent set from its cache. Its node score is the sum of those best family scores. If NS₀ is already a DAG, it is the answer.",
    "<b>Initialise the search.</b> Set the incumbent S★ ← −∞ and 𝒢★ ← ∅; set the current depth/layer index j = 1; the frontier holds only NS₀.",
    "<b>Expand a state by its layer's variable.</b> Take the current expansion node NS and iterate over the j-th variable's cache: for each cached parent set Pa(k) make a child CH(k) that replaces Xⱼ's parents with Pa(k), keeping all other variables as selected. Compute its score by updating the one family score that changed.",
    "<b>Best-first DAG cut-off (improvement 1).</b> Children are tried in descending cache order. If CH(k) is a DAG and beats the incumbent (S > S★), record it as the new incumbent (S★ ← S, 𝒢★ ← CH(k)) and <b>stop creating the remaining children of this layer</b> — they have lower family scores and cannot beat it.",
    "<b>Bound-vs-incumbent pruning.</b> If a child's score is ≤ S★, discard it and do not expand it: it can never lead to a strictly better DAG.",
    "<b>Cycle pruning on upper layers (improvement 2).</b> If a child has a directed cycle involving only variables in {X₁,…,Xⱼ₋₁} (all already processed), discard it — later layers cannot remove that cycle.",
    "<b>Last-layer rule.</b> If j = n (the last variable) and the child is not a DAG, discard it: no variables remain that could break the cycle.",
    "<b>Otherwise keep exploring.</b> Any surviving child is added to the frontier as a leaf at depth j + 1, to be expanded later through the next variable's cache.",
    "<b>Choose the next state best-first.</b> Pick the frontier leaf with the largest current node score, set it as the new expansion node NS, and update j to its depth. Repeat the expand-and-prune loop while the frontier is non-empty.",
    "<b>Return 𝒢★.</b> When the frontier is exhausted, the recorded incumbent 𝒢★ is the globally optimal DAG."
  ],

  keyConcepts: [
    { term: "Parent cache Cᵢ (descending-sorted)", def: "Per-variable list of candidate parent sets with family scores, ordered best-first. Sorting is essential: it lets a layer stop at its first valid DAG." },
    { term: "Family score score(Xᵢ | Paᵢ)", def: "The decomposable score contribution of one variable given its parents. The whole-network score is the sum of these, so swapping one variable's parents updates only one term." },
    { term: "Layered tree / processing order", def: "Variables are handled in a fixed order; tree layer j varies only Xⱼ's parent set while the others stay fixed. Each layer is exactly one variable's cache." },
    { term: "Incumbent (S★, 𝒢★)", def: "The best complete DAG and score found so far. New children must beat it to survive; it is the moving target that drives pruning." },
    { term: "Descending-cache cut-off", def: "E-B&B's signature trick: because children are made best-family-score first, the first DAG child in a layer is that layer's best, so the remaining children are skipped." },
    { term: "Early cycle pruning", def: "If a child's cycle uses only already-processed variables (upper layers), it can never be repaired later, so the branch is dropped at once — and any cyclic child at the final layer is dropped too." },
    { term: "Best-first frontier", def: "Unexpanded leaves are kept in a frontier; the leaf with the largest current node score is always expanded next." }
  ],

  animation: {
    title: "E-B&B on the paper's Example 34 — variables {C, M, D} (initial graph Fig.75, layered tree Fig.76).",
    nodes: [
      { id: "C", x: 0.12, y: 0.5 },
      { id: "M", x: 0.5, y: 0.5 },
      { id: "D", x: 0.88, y: 0.5 }
    ],
    edges: [],
    steps: [
      { caption: "<b>Caches (sorted best-first).</b> Each variable has a pruned, descending-sorted parent cache, e.g. C: [{M} −4.50, ∅ −8.64], D: [{M} −5.01, ∅ −9.15]. Sorting best-first is exactly what lets E-B&B cut a layer short later.", ops: [{ op: "set", name: "Cache C", items: ["Pa={M}  s=−4.50", "Pa=∅  s=−8.64"] }, { op: "set", name: "Cache D", items: ["Pa={M}  s=−5.01", "Pa=∅  s=−9.15"] }, { op: "badge", text: "caches descending-sorted", kind: "info" }] },
      { caption: "<b>Root state (Fig.75).</b> Give every variable its TOP parent set: C←{M}, M←{C}, D←{M}. This yields C⇄M (a 2-cycle) and D←M. The root is the highest <i>possible</i> total score, but it is NOT a DAG.", ops: [{ op: "addEdge", from: "M", to: "C", type: "directed" }, { op: "addEdge", from: "C", to: "M", type: "directed" }, { op: "addEdge", from: "M", to: "D", type: "directed" }, { op: "badge", text: "root: not a DAG (C⇄M)", kind: "bad" }] },
      { caption: "<b>Initialise.</b> Incumbent S★ ← −∞, 𝒢★ ← ∅. Layer index j = 1 (we will first vary variable C). The frontier holds only this root state.", ops: [{ op: "score", text: "S★ = −∞   (no DAG yet)" }] },
      { caption: "<b>Layer 1 — vary C's cache, best-first.</b> First child keeps C←{M}: the same C⇄M 2-cycle. It is not a DAG, so it cannot be the incumbent — keep scanning C's cache in descending order.", ops: [{ op: "highlightNodes", ids: ["C", "M"], cls: "bad" }, { op: "highlightEdges", edges: [["C", "M"], ["M", "C"]], cls: "bad" }, { op: "badge", text: "child 1: cyclic, skip", kind: "bad" }] },
      { caption: "<b>Layer 1 — next cached option for C: ∅.</b> Replace C's parents with the empty set, removing C←M. Now the graph is C→M→D: a DAG! Its score is −22.80.", ops: [{ op: "removeEdge", from: "M", to: "C" }, { op: "score", text: "score(C→M→D) = −22.80" }, { op: "highlightEdges", edges: [["C", "M"], ["M", "D"]], cls: "good" }] },
      { caption: "<b>Descending-cache cut-off (E-B&B's key extension).</b> This first DAG child IS the best DAG obtainable in layer 1 — every remaining option for C has a lower family score. Record it as the incumbent and STOP making the rest of layer 1. <i>Plain B&B would still generate and test those siblings.</i>", ops: [{ op: "score", text: "S★ = −22.80,  𝒢★ = C→M→D" }, { op: "highlightEdges", edges: [["C", "M"], ["M", "D"]], cls: "good" }, { op: "badge", text: "incumbent set; layer 1 cut short", kind: "good" }] },
      { caption: "<b>Layer 2 — vary M's cache (Fig.76b).</b> Keep C and D at their current choices and swap M's parent set across its alternatives, e.g. M←{C} and M←∅, generating children best-first.", ops: [{ op: "badge", text: "j = 2: branch on M", kind: "info" }] },
      { caption: "<b>Layer 2 — first child not a DAG.</b> The best M-option re-introduces a cycle, so it is discarded. The next child (M←∅, i.e. C→M dropped) is a DAG but its score −26.94 is below the incumbent −22.80.", ops: [{ op: "score", text: "best M-child cyclic → discard;  next DAG scores −26.94" }, { op: "badge", text: "−26.94 ≤ S★ = −22.80", kind: "bad" }] },
      { caption: "<b>Bound-vs-incumbent pruning.</b> Because −26.94 does not beat the incumbent, this child is discarded and NOT expanded — no descendant could score higher. Layer 2 adds nothing to 𝒢★.", ops: [{ op: "badge", text: "pruned: cannot beat incumbent", kind: "bad" }, { op: "highlightEdges", edges: [["C", "M"], ["M", "D"]], cls: "good" }] },
      { caption: "<b>Layer 3 — variable D, the last layer.</b> Any change to D that creates a cycle C→M→C is rejected outright: D is the final variable, so no later layer remains to break a cycle (last-layer rule). The incumbent stands.", ops: [{ op: "badge", text: "j = n: cyclic children dropped", kind: "info" }, { op: "highlightNodes", ids: ["C", "M", "D"], cls: "good" }] },
      { caption: "<b>Frontier empty → return 𝒢★.</b> The global optimum is C→M→D with score −22.80. E-B&B reached it after touching only a handful of states, having pruned whole layers that plain B&B would have enumerated.", ops: [{ op: "highlightEdges", edges: [["C", "M"], ["M", "D"]], cls: "good" }, { op: "score", text: "global optimum: C→M→D,  S★ = −22.80" }, { op: "badge", text: "optimal DAG returned (exact)", kind: "good" }] }
    ]
  },

  complexity: "Worst-case exponential like any exact search, but in practice far cheaper than basic B&B: the descending-cache cut-off ends each layer at its first valid DAG, bound-vs-incumbent pruning kills branches that cannot beat the best DAG so far, and early cycle detection on already-processed variables removes branches that can never become acyclic. Cost depends heavily on cache size and how early a strong incumbent is found.",
  strengths: [
    "Exact: returns the globally optimal DAG for a decomposable score, just like B&B.",
    "Prunes much more than plain B&B via three concrete extensions — best-first cache cut-off, bound-vs-incumbent, and early upper-layer cycle detection.",
    "Per-variable updates are cheap: swapping one variable's parents changes only one family-score term.",
    "Best-first frontier focuses search on the most promising states first, helping find a strong incumbent early (which strengthens all the bound-based pruning)."
  ],
  limitations: [
    "Still worst-case exponential; very large or dense problems remain intractable.",
    "Relies on a fixed variable order and pre-built, sorted parent caches — cache construction/pruning itself can be expensive and may bias which structures are reachable.",
    "Performance is sensitive to how quickly a good incumbent appears; a weak early incumbent prunes little."
  ],
  notes: "E-B&B (Etminani et al.) explicitly revisits de Campos et al.'s B&B (§4.23). Its distinctive additions are the descending-sorted parent caches that allow a layer to stop at its first valid DAG, and the structural feasibility tests (cycles confined to already-processed variables) that prune branches before they are expanded. The worked Example 34 over {C, M, D} converges to the optimal C→M→D with total score −22.80.",
  figureRefs: "Paper §4.24 (pp.137–140): Algorithm 31 (E-B&B); Example 34 (variables {C,M,D}); Fig.75 (initial best-parent graph); Fig.76 (layered-tree iterations a–b); pruning rules in §4.24.1. Builds on §4.23 Branch-and-Bound (id 'bb')."
};
