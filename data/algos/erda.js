/* ERDA — Efficient Recursive Decomposition Algorithm (Jia et al., ref [300]).
   Constraint-based, divide-and-conquer, tagged DATA-DISTRIBUTED. BUILDS ON SAR (§4.39).
   Grounded in §4.61 (pp.292-295): ERDA replaces SAR's global, balanced graph-cut
   separator search with a STRICTLY LOCAL cut around a single TARGET node (smallest
   degree) and recurses ONLY on the LARGER side of each split. It builds an undirected
   independence graph Ḡ (moralization/MB), picks a target X of minimum degree, searches
   for an ERDA decomposition (X,Z,Y) with the separator Z drawn ONLY from X's neighbors,
   splits into the closed neighborhood N̄_X (a LEAF, learned directly) and the remainder
   (V\N̄_X)∪Z, then recurses on the larger piece — building a BINARY TREE of subgraphs.
   Leaves are learned by any BN learner LearnBN; siblings are reunited by SAR's REUNION
   rule. Worked example = the 8-node ASIA-style graph {A,S,T,L,B,R,D,X}:
   Fig 187 (first local cut at target X, Z={R}), Fig 188 (second local cut at target A,
   Z={T}), Fig 189 (binary tree of subgraphs), Fig 190 (separator with multiple
   neighbors: target T, Z={L,R}). Algorithm 79 (ERDA), Definition 43 (ERDA decomposition),
   Lemma 22 (min-degree closed neighborhood is a minimal independence subgraph),
   Examples 86-88. */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["erda"] = {
  name: "Efficient Recursive Decomposition Algorithm (ERDA)",
  oneLiner: "Build an undirected independence graph, then repeatedly pick the easiest variable to peel off — the one with the fewest neighbours — cut the graph locally around it using only its own neighbours as the separator, learn that small closed neighbourhood directly, and recurse only on the larger leftover side; finally glue the learned pieces back together with SAR's reunion rule.",
  basedOnText: "ERDA is a constraint-based divide-and-conquer method in the same decomposition family as SAR, but re-engineered for efficiency on distributed data. Instead of SAR's global, balanced graph-cut separator search, ERDA uses a strictly LOCAL cut centred on a single target node and recurses on only the larger side of each split. Every other ingredient — the undirected independence graph, learning leaves with a generic base learner, and reuniting siblings — is inherited from SAR; the change is purely in how the separator is chosen and how the recursion unfolds.",

  assumptions: [
    "<b>Causal sufficiency</b> — no hidden common causes; every common cause of measured variables is itself measured.",
    "<b>Faithfulness</b> — every independence in the data corresponds to a missing connection in the true graph, so separation in the undirected independence graph implies d-separation in the underlying DAG. Correctness of ERDA's local cuts rests on this.",
    "<b>A reliable undirected independence graph</b> — an initial graph Ḡ over V can be built from the data (e.g. by moralization or Markov-blanket methods); its node cuts are genuine d-separating sets.",
    "<b>A base structure learner LearnBN</b> — any BN structure learner (e.g. hill-climbing) can recover a DAG on a small leaf subgraph.",
    "<b>Min-degree closed neighbourhood is a valid leaf (Lemma 22)</b> — when the target X is the smallest-degree node, its closed neighbourhood N̄_X is a minimal undirected independence subgraph of the moral graph, so it needs no further decomposition and can be learned directly."
  ],
  input: "A dataset 𝒟 over variables V and a base BN learner LearnBN (e.g. HC). ERDA first builds an undirected independence graph Ḡ over V (e.g. by moralization or Markov-blanket methods).",
  output: "A single DAG 𝒢* over all of V (the graph stored at the root of the binary tree of subgraphs), I-equivalent to what a global learner would produce — assembled from independently learned local pieces.",

  idea: [
    "ERDA starts from the same place as SAR — an undirected independence graph Ḡ over all the variables — and asks the same question: where can we cut the problem so the pieces barely interact? The difference is <i>where it looks</i>. SAR scans for a global, balanced cut that splits the whole graph into two big halves. ERDA instead looks only at one node at a time.",
    "<b>Pick the easiest target.</b> ERDA chooses the variable X of <i>minimum degree</i> — the one with the fewest neighbours. By Lemma 22, the closed neighbourhood of a minimum-degree node (X together with its neighbours) is already a minimal undirected independence subgraph: it is the smallest self-contained piece and can be learned directly with no further splitting.",
    "<b>Cut locally.</b> ERDA then searches for a separator Z drawn <i>only from X's own neighbours</i> — never from the whole graph. This is the local cut. It produces an <b>ERDA decomposition</b> (X, Z, Y): a triple where the separator Z separates the closed-neighbourhood side from the rest, Y, in Ḡ. The closed neighbourhood N̄_X becomes a small piece; everything else, (V∖N̄_X)∪Z, is the remainder. Because separation in Ḡ implies d-separation under faithfulness, the two pieces are conditionally independent given Z.",
    "<b>Recurse on the larger side only.</b> Here is the efficiency twist. The closed-neighbourhood piece is small and is treated as a <b>leaf</b> — learned directly. ERDA pushes <i>only the larger child</i> back onto the work stack and recurses on it, peeling off one cheap leaf at a time. This turns the recursion into a lopsided binary tree that grows down the spine of the big leftover graph, rather than SAR's balanced two-way split.",
    "<b>Learn and reunite.</b> Each leaf subgraph is handed to the base learner LearnBN to get a small local DAG. Then, walking the tree bottom-up, ERDA reunites siblings with SAR's <b>reunion rule</b>: keep all edges outside the separator, keep a separator-internal edge only if it appears in both learned pieces, and reorient the smallest set of edges needed so no v-structure is created or destroyed. The result is one global, I-equivalent DAG — but built with cheaper, purely local cuts."
  ],

  steps: [
    "<b>Build the independence graph.</b> From the data 𝒟, construct an undirected independence graph Ḡ over V (e.g. moralization or Markov-blanket methods). Initialise a work stack with Ḡ and an empty binary tree 𝒯 of subgraphs. (Algorithm 79, lines 1-2.)",
    "<b>Pop the current piece and pick a target.</b> Pop the current undirected subgraph Ḡ_cur from the stack. Choose the target X ∈ V_cur of <b>minimum degree</b> — the node with the fewest neighbours. (Lines 3-4.)",
    "<b>Search for a local separator.</b> Look for an ERDA decomposition (X, Z, Y) where the separator Z ⊆ N̄_X is taken <i>only from X's neighbours</i> and Z separates X's side from Y in Ḡ_cur. (Line 5; Definition 43.)",
    "<b>Base case — no separator: make a leaf.</b> If no proper separator Z exists for X (the piece can't be split further), mark Ḡ_cur as a leaf of 𝒯. The closed neighbourhood of a min-degree node is a minimal independence subgraph (Lemma 22), so it is safe to learn directly. (Lines 6-7.)",
    "<b>Split into closed neighbourhood + remainder.</b> Otherwise add two children to Ḡ_cur in 𝒯: the closed-neighbourhood piece N̄_X (=X's neighbourhood ∪ {X}) and the remainder (V_cur ∖ N̄_X) ∪ Z. Both contain the separator nodes Z as their shared overlap. (Lines 8-9.)",
    "<b>Recurse on the LARGER side only.</b> Push <b>only the larger child</b> (by node count) back onto the work stack — this is the local-recursion shortcut that keeps ERDA cheap. The small closed-neighbourhood piece is left as a leaf to be learned. Repeat from step 2 until the stack is empty. (Lines 10-12.)",
    "<b>LearnBN — learn each leaf.</b> For every leaf subgraph V_leaf of 𝒯 (bottom to top), run the base learner 𝒢_{V_leaf} ← LearnBN(𝒟|_{V_leaf}) to get a small local DAG. Leaves are independent and can be learned in parallel / on distributed data partitions. (Lines 13-15.)",
    "<b>REUNION — merge siblings bottom-up.</b> For every internal node of 𝒯 whose children cover (X∪Z) and (Y∪Z), combine 𝒢_{X∪Z} and 𝒢_{Y∪Z} by the SAR reunion rule: keep edges <i>outside</i> Z exactly as learned; keep an edge <i>inside</i> Z only if it is present in <b>both</b> learned pieces. (Lines 16-17.)",
    "<b>REUNION — minimal reorientation.</b> Reorient the smallest set of edges needed to preserve every existing v-structure and introduce no new one. The merged graph is I-equivalent to the original. (Line 17.)",
    "<b>Return.</b> Continue merging up the tree until one graph remains; <b>return</b> the graph stored at the root of 𝒯 as the global DAG 𝒢*. (Lines 18-19.)"
  ],

  keyConcepts: [
    { term: "Minimum-degree target X", def: "ERDA always peels off the variable with the fewest neighbours. Its closed neighbourhood is the smallest self-contained piece, so picking it keeps each cut cheap and each leaf small. This is the principled choice behind ERDA's efficiency (Lemma 22)." },
    { term: "Local cut / separator from neighbours only", def: "Unlike SAR, which searches the whole graph for a balanced minimum cut, ERDA searches for the separator Z only among the target's own neighbours. A purely local search is far cheaper and is all that is needed to peel off the target's closed neighbourhood." },
    { term: "ERDA decomposition (Definition 43)", def: "A triple (X, Z, Y) where X∪Z∪Y = V and Z separates X from Y in the undirected independence graph Ḡ. It formalises one local split: the closed-neighbourhood side, the separator, and the remainder." },
    { term: "Closed neighbourhood N̄_X (the leaf)", def: "The target X together with all its neighbours. For a min-degree node this is a minimal independence subgraph of the moral graph (Lemma 22), so it is treated as a leaf and learned directly with no further decomposition." },
    { term: "Recurse on the larger side only", def: "ERDA pushes only the larger child onto the work stack and recurses on it, leaving the small closed-neighbourhood piece as a leaf. This 'peel one leaf, recurse on the rest' loop builds a lopsided binary tree and is the main efficiency gain over SAR's balanced two-way recursion." },
    { term: "LearnBN on leaves", def: "Any BN structure learner (e.g. hill-climbing) is run on each small leaf subgraph 𝒢_{V_leaf} ← LearnBN(𝒟|_{V_leaf}). Leaves are independent, so this step parallelises naturally — well suited to distributed data." },
    { term: "SAR reunion rule", def: "To merge two learned siblings: keep edges outside the separator as they are, keep a separator-internal edge only if it appears in BOTH pieces, and reorient a minimal set so no v-structure is created or destroyed — yielding an I-equivalent DAG. ERDA inherits this verbatim from SAR." }
  ],

  animation: {
    title: "ERDA on the paper's 8-node example {A,S,T,L,B,R,D,X} (Figs 187-189). Peel the min-degree target → local cut → recurse on the larger side → learn leaves → reunite.",
    nodes: [
      { id: "A", x: 0.10, y: 0.12 },
      { id: "S", x: 0.62, y: 0.10 },
      { id: "T", x: 0.26, y: 0.40 },
      { id: "L", x: 0.50, y: 0.40 },
      { id: "B", x: 0.78, y: 0.40 },
      { id: "R", x: 0.44, y: 0.68 },
      { id: "X", x: 0.12, y: 0.92 },
      { id: "D", x: 0.66, y: 0.92 }
    ],
    edges: [
      { from: "A", to: "T", type: "undirected" },
      { from: "S", to: "L", type: "undirected" },
      { from: "S", to: "B", type: "undirected" },
      { from: "T", to: "L", type: "undirected" },
      { from: "T", to: "R", type: "undirected" },
      { from: "L", to: "R", type: "undirected" },
      { from: "B", to: "R", type: "undirected" },
      { from: "B", to: "D", type: "undirected" },
      { from: "R", to: "X", type: "undirected" },
      { from: "R", to: "D", type: "undirected" }
    ],
    steps: [
      { caption: "<b>Start — undirected independence graph Ḡ.</b> ERDA builds an undirected independence graph over all variables {A,S,T,L,B,R,D,X} (Fig 187a), e.g. by moralization. It will peel off one variable at a time using only LOCAL cuts.", ops: [{ op: "badge", text: "independence graph Ḡ", kind: "info" }] },
      { caption: "<b>Pick the min-degree target.</b> X has only one neighbour (R), the smallest degree in the graph, so ERDA chooses X as the target. By Lemma 22 the closed neighbourhood of a min-degree node is a minimal independence subgraph — the cheapest piece to peel off.", ops: [{ op: "highlightNodes", ids: ["X"], cls: "hl" }, { op: "badge", text: "target X (degree 1)", kind: "good" }] },
      { caption: "<b>Local cut — separator from X's neighbours only.</b> ERDA searches for a separator among X's neighbours and finds Z = {R}: removing R disconnects X from everything else. This is an ERDA decomposition (X, Z, Y) with Z = {R} (Definition 43). The search is purely local — no global cut needed.", ops: [{ op: "highlightNodes", ids: ["R"], cls: "hl" }, { op: "highlightEdges", edges: [["R","X"]], cls: "hl" }, { op: "badge", text: "separator Z = {R}", kind: "good" }, { op: "set", name: "Separator Z", items: ["Z = {R}"] }] },
      { caption: "<b>Split — closed neighbourhood vs. remainder.</b> Ḡ splits into the LEAF piece N̄_X = {X, R} (Fig 187b left) and the REMAINDER (V∖N̄_X)∪Z = {A,T,L,S,B,D,R} (Fig 187b right). Both share the separator node R (the overlap). This is the first node of the binary subgraph tree (Fig 189).", ops: [{ op: "badge", text: "split: leaf N̄_X + remainder", kind: "info" }, { op: "set", name: "Subproblems", items: ["Leaf N̄_X = {X, R}", "Remainder = {A,T,L,S,B,D,R}", "shared Z = {R}"] }] },
      { caption: "<b>Recurse on the LARGER side only.</b> The leaf {X,R} is tiny, so ERDA keeps it as a leaf and pushes only the larger child {A,T,L,S,B,D,R} back onto the work stack. This 'peel one leaf, recurse on the rest' shortcut (Alg 79 line 10) is what makes ERDA cheaper than SAR's balanced split.", ops: [{ op: "highlightNodes", ids: ["A", "T", "L", "S", "B", "D", "R"], cls: "dim" }, { op: "badge", text: "recurse on larger child", kind: "info" }] },
      { caption: "<b>Recurse — new min-degree target A.</b> On the larger piece, A now has the smallest degree (its only neighbour is T). ERDA chooses A as the next target and again searches its neighbours for a separator (Fig 188a).", ops: [{ op: "highlightNodes", ids: ["A"], cls: "hl" }, { op: "badge", text: "target A (degree 1)", kind: "good" }] },
      { caption: "<b>Local cut again — Z = {T}.</b> Among A's neighbours, Z = {T} is a valid separator: removing T disconnects A from the rest (Fig 188a). ERDA splits off the leaf N̄_A = {A, T} and keeps recursing on the larger remainder {T,L,S,B,D,R} (Fig 188b), extending the binary tree (Fig 189).", ops: [{ op: "highlightNodes", ids: ["T"], cls: "hl" }, { op: "highlightEdges", edges: [["A","T"]], cls: "hl" }, { op: "badge", text: "separator Z = {T}", kind: "good" }, { op: "set", name: "Subproblems", items: ["Leaf N̄_X = {X, R}", "Leaf N̄_A = {A, T}", "Remainder = {T,L,S,B,D,R}", "shared T (with remainder)"] }] },
      { caption: "<b>Base case — remainder becomes a leaf.</b> The remaining core {T,L,S,B,D,R} cannot be split into smaller independent pieces by a local separator, so ERDA marks it as a leaf of 𝒯 (Alg 79 lines 6-7). The decomposition is complete: leaves {X,R}, {A,T}, and the core.", ops: [{ op: "highlightNodes", ids: ["T", "L", "S", "B", "D", "R"], cls: "hl" }, { op: "badge", text: "base case → leaf", kind: "good" }, { op: "set", name: "Leaves of 𝒯", items: ["{X, R}", "{A, T}", "{T, L, S, B, D, R}"] }] },
      { caption: "<b>LearnBN — learn the leaf {X, R}.</b> Run the base learner directly on this piece. It finds the single dependency and orients it: R → X. (Leaves are independent, so on distributed data they can be learned in parallel on local partitions.)", ops: [{ op: "clearSet" }, { op: "highlightNodes", ids: ["X", "R"], cls: "add" }, { op: "badge", text: "LearnBN leaf {X,R}", kind: "info" }, { op: "orient", from: "R", to: "X", type: "directed" }, { op: "set", name: "Local DAGs", items: ["𝒢_{X,R}: R→X"] }] },
      { caption: "<b>LearnBN — learn the leaf {A, T} and the core.</b> The base learner orients A → T in the second leaf, and learns the core {T,L,S,B,D,R}: a CI test confirms T ⫫ B | {L,R}, so no T–B edge, and the families are oriented (S→L, S→B, T→L, L→R, B→R, B→D, R→D).", ops: [{ op: "highlightNodes", ids: ["A", "T", "L", "S", "B", "D", "R"], cls: "add" }, { op: "badge", text: "LearnBN remaining leaves", kind: "info" }, { op: "testCI", x: "T", y: "B", z: ["L", "R"], result: "indep" }, { op: "orient", from: "A", to: "T", type: "directed" }, { op: "orient", from: "S", to: "L", type: "directed" }, { op: "orient", from: "S", to: "B", type: "directed" }, { op: "orient", from: "T", to: "L", type: "directed" }, { op: "orient", from: "L", to: "R", type: "directed" }, { op: "orient", from: "B", to: "R", type: "directed" }, { op: "orient", from: "B", to: "D", type: "directed" }, { op: "orient", from: "R", to: "D", type: "directed" }, { op: "set", name: "Local DAGs", items: ["𝒢_{X,R}: R→X", "𝒢_{A,T}: A→T", "𝒢_core over {T,L,S,B,D,R}"] }] },
      { caption: "<b>REUNION — merge siblings, reconcile separator edges.</b> Walking the tree bottom-up, ERDA reunites with SAR's rule: keep edges outside the separator as they are; keep a separator-internal edge only if present in BOTH pieces. Here each separator (R, then T) is a single node, so there are no internal separator edges to drop — the leaves glue cleanly onto the core at R and T.", ops: [{ op: "clearSet" }, { op: "badge", text: "REUNION (bottom-up)", kind: "info" }, { op: "highlightNodes", ids: ["R", "T"], cls: "hl" }, { op: "set", name: "Reunite at", items: ["leaf {X,R} ⨝ core at R", "leaf {A,T} ⨝ core at T", "keep separator edge only if in both"] }] },
      { caption: "<b>REUNION — minimal reorientation.</b> ERDA reorients the fewest edges needed so no v-structure is created or destroyed across the merge. The collider at R (L→R←B) and the rest of the orientations are preserved; nothing new is introduced.", ops: [{ op: "highlightNodes", ids: ["R"], cls: "hl" }, { op: "badge", text: "preserve v-structures", kind: "info" }] },
      { caption: "<b>Result — global DAG 𝒢*.</b> By peeling off the min-degree target with a LOCAL cut, recursing only on the larger side, learning each small leaf directly, and reuniting with SAR's rule, ERDA returns the DAG at the root of the tree: A→T→L→R→X, S→L, S→B, B→R, B→D, R→D — I-equivalent to a global learner's result, from cheaper local subproblems.", ops: [{ op: "clearSet" }, { op: "highlightEdges", edges: [["A","T"],["T","L"],["S","L"],["S","B"],["L","R"],["B","R"],["B","D"],["R","D"],["R","X"]], cls: "add" }, { op: "badge", text: "𝒢* returned (I-equivalent)", kind: "good" }] }
    ]
  },

  complexity: "ERDA's win over SAR is the LOCAL cut plus the lopsided recursion. SAR searches the whole independence graph for a balanced minimum-cut separator at every level; ERDA instead searches only among one min-degree node's neighbours and then recurses on only the larger child. Each step peels off a small closed-neighbourhood leaf, so the separator search stays cheap and the leaves stay small. Leaves are independent and can be learned in parallel on distributed data partitions; reunion only re-learns separator-internal edges. Worst case still inherits the base learner's complexity when the graph does not decompose well (one large core leaf ≈ little speed-up), but the cuts themselves are much cheaper to find than SAR's global, balanced ones.",
  strengths: [
    "Cheap, purely LOCAL separator search — only the target's own neighbours are examined, versus SAR's global balanced minimum-cut search.",
    "Principled, efficient target choice: the min-degree node's closed neighbourhood is a minimal independence subgraph (Lemma 22), so it can be peeled off and learned directly.",
    "Recursing on only the larger side keeps the work focused and avoids re-solving small pieces.",
    "Leaves are independent and learnable in parallel — well suited to DATA-DISTRIBUTED settings.",
    "Works with any base learner LearnBN and reunites with SAR's reunion rule, recovering an I-equivalent global DAG under faithfulness."
  ],
  limitations: [
    "Quality depends on the initial undirected independence graph — a wrong Ḡ produces wrong local cuts and wrong separators.",
    "Gains shrink when the graph does not decompose well: if min-degree nodes have no small local separator, the leftover core stays large and little is peeled off.",
    "The local, greedy target order can produce a lopsided tree; a poor target sequence yields less effective decomposition than a well-chosen global cut.",
    "Inherits the reunion's delicacy — a mishandled separator boundary can create or destroy a v-structure and break I-equivalence.",
    "Inherits constraint-based fragility (unreliable CI tests inside leaves) and assumes causal sufficiency — no hidden confounders."
  ],
  notes: "ERDA (Jia et al., ref [300]) is built directly on SAR and belongs to the same node-separator decomposition family. The ONLY substantive change is the separator: SAR performs a global, balanced graph-cut separator search, while ERDA replaces it with a strictly LOCAL search around a single minimum-degree target and recurses on only the larger side of each split — all other ingredients (the undirected independence graph, learning leaves with a generic base learner, and the reunion rule) are inherited from SAR. When a target has several neighbours, ERDA still seeks a separator among their subsets and valid separators need not contain all neighbours (Example 88 / Fig 190: target T with Z = {L,R}). The animation uses the paper's own running example (Figs 187-189) — target X with Z={R}, then target A with Z={T}, then the core as a base-case leaf; the CI test shown for the core (T ⫫ B | {L,R}) and the final orientations are illustrative of the LearnBN step on each piece.",
  figureRefs: "Paper §4.61 (pp.292-295), Jia et al. [300]: Algorithm 79 (ERDA — min-degree target, local separator search, recurse on larger child, LearnBN leaves, SAR REUNION), Definition 43 (ERDA decomposition (X,Z,Y)), Lemma 22 (min-degree closed neighbourhood is a minimal undirected independence subgraph), Example 86 / Fig 187 (first local cut: target X, separator Z={R}, closed neighbourhood vs. remainder), Example 87 / Fig 188 (second local cut: target A, separator Z={T}), Fig 189 (binary tree of subgraphs generated by local separators), Example 88 / Fig 190 (separator with multiple neighbours: target T, Z={L,R}; valid separators need not contain all neighbours)."
};
