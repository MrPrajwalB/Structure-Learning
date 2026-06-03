/* HCMC — Hill-Climber Monte Carlo (Castelo & Kocka). Grounded in §5.1 (pp.322-323):
   §5.1.1 "The algorithm"; Fig. 204 (motivation — score-equivalent neighbours G1/G2
   prolong greedy search); Recall 88 (covered edge); Theorem 48 (covered-arc reversal
   preserves the Markov equivalence class); RCAR = Repeated Covered Arc Reversal;
   neighbourhoods RCARNR / RCARR. Ref [87]. HCMC is a refinement of HC (§4.3). */
window.ALGO_DATA = window.ALGO_DATA || {};
window.ALGO_DATA["hcmc"] = {
  name: "Hill-Climber Monte Carlo (HCMC)",
  oneLiner: "A refinement of greedy hill climbing that, every so often, makes a random move that flips a 'covered' edge — leaving the statistical meaning of the graph unchanged but swapping to a different equivalent DAG — and then resumes climbing, so the search is not trapped by arbitrary tie-breaks among score-equivalent graphs.",
  basedOnText: "HCMC (Castelo & Kocka) is a score-based <i>refinement</i> of Hill Climbing (§4.3): it keeps HC's greedy add/delete/reverse ascent but injects a Monte-Carlo randomisation step — a short random walk of covered-arc reversals — to jump between equally-scored DAGs in the same equivalence class before continuing uphill.",

  assumptions: [
    "<b>A decomposable score</b> (e.g. BIC, BDeu, log-likelihood) that is also <b>score-equivalent</b> — it gives the same value to every DAG in one Markov equivalence class. This very property is what creates the ties HCMC is designed to handle.",
    "<b>Acyclicity is enforced</b> — every graph examined, including those produced by the random reversals, must remain a valid DAG.",
    "<b>The same DAG search space as HC</b>, explored with single-edge operators (add / delete / reverse), plus the special <b>covered-arc reversal</b> move used for the randomisation."
  ],
  input: "A dataset 𝒟 over the variables, a (score-equivalent) score function score(𝒢 | 𝒟), an initial DAG 𝒢₀, a probability p of triggering a random jump, and a small cap on the number of covered-arc reversals per jump.",
  output: "A single DAG 𝒢 — a local maximum of the score, the same kind of output HC returns, but reached by a path that is less likely to stall on long detours between equivalent graphs.",

  idea: [
    "HC walks uphill on the score landscape by repeatedly moving to the best single-edge neighbour (add / delete / reverse) of the current DAG until no neighbour improves. HCMC keeps exactly this engine but fixes one specific weakness the paper highlights (Fig. 204): the score is <b>score-equivalent</b>, so two neighbours that are merely different orientations of the <i>same</i> independence structure get identical scores. HC must then break the tie arbitrarily, and an unlucky choice can send the trajectory on a long, uninformative detour through intermediate DAGs before it finds the next genuinely improving move.",
    "HCMC's key idea is to occasionally insert a <b>random move that stays within the same equivalence class</b> before resuming greedy ascent. Because the move never leaves the class, it does not change which conditional independencies the graph encodes — it only changes the DAG <i>representative</i>. This keeps the independencies fixed while letting the search hop to a different starting point for the next climb, which can shorten the path to a better basin.",
    "The move that achieves this is the <b>reversal of a covered arc</b>. An arc A → B is <i>covered</i> when A and B have exactly the same other parents (the parents of B are the parents of A plus A itself). Theorem 48 says reversing a covered arc gives a DAG that is <b>I-equivalent</b> to the original — same equivalence class — because such a flip can never create or destroy a v-structure and never changes the skeleton. So covered-arc reversals are precisely the legal 'sideways' moves within a class.",
    "Putting it together: with a user-specified probability <i>p</i>, HCMC first runs a short <b>Repeated Covered Arc Reversal (RCAR)</b> walk — it repeatedly picks a covered arc uniformly at random and reverses it, up to a small cap — producing a different but equivalent representative of the current class. It then performs a standard HC improvement step, but with covered-arc reversals <i>excluded</i> from the neighbourhood so it does not immediately undo the randomisation. Two neighbourhoods are used for that improvement step: <b>RCARNR</b> (additions and deletions only, no reversals) and <b>RCARR</b> (additions, deletions, and <i>non-covered</i> reversals); in both, covered-arc reversals are omitted."
  ],

  steps: [
    "<b>Initialise.</b> Start from an initial DAG 𝒢 = 𝒢₀ and compute score(𝒢 | 𝒟). Choose a jump probability p and a cap on reversals per jump.",
    "<b>Greedy HC step.</b> As in HC, generate the single-edge neighbours of 𝒢 (add / delete / reverse, kept acyclic), score them using decomposability, and move to the best <i>improving</i> neighbour. Repeat while improvements exist.",
    "<b>Detect a stall / tie.</b> The trouble case (Fig. 204) is when the best moves are <b>score-equivalent</b> — different orientations of the same structure. HC would break the tie arbitrarily and risk a long detour; HCMC instead may trigger its Monte-Carlo escape.",
    "<b>Trigger the random jump (probability p).</b> With probability p, switch from greedy mode into a <b>Repeated Covered Arc Reversal (RCAR)</b> walk instead of taking the greedy move.",
    "<b>Find covered arcs.</b> Scan the current DAG for <i>covered</i> arcs: an arc A → B such that the parents of B equal the parents of A together with A itself (Recall 88).",
    "<b>RCAR walk.</b> Pick a covered arc uniformly at random and reverse it. By Theorem 48 the result is I-equivalent — same independencies, same score, a different DAG representative. Repeat this random pick-and-reverse up to the small cap.",
    "<b>Resume greedy ascent — but forbid covered reversals.</b> From the new representative, run a standard HC improvement step using a neighbourhood that <b>excludes</b> covered-arc reversals (so the randomisation is not instantly undone): either <b>RCARNR</b> (adds and deletes only) or <b>RCARR</b> (adds, deletes, and non-covered reversals).",
    "<b>Loop.</b> Continue alternating greedy ascent with occasional RCAR jumps. Each jump re-positions the search within an equivalence class so the next climb can reach a better basin sooner.",
    "<b>Return.</b> When greedy ascent can no longer improve (and the budget for jumps is spent), return the resulting DAG — a local maximum, like HC's output, but typically found via a shorter, less detour-prone path."
  ],

  keyConcepts: [
    { term: "Score equivalence", def: "A property of scores like BIC and BDeu: all DAGs in one Markov equivalence class get the same score. It is useful, but it means HC sees ties between graphs that differ only in edge direction, which it must break arbitrarily." },
    { term: "Covered arc / covered edge (Recall 88)", def: "An arc A → B is covered when B's parents are exactly A's parents plus A. Geometrically, A and B share all other parents, so the arrow between them is the only thing that distinguishes them." },
    { term: "Covered-arc reversal (Theorem 48)", def: "Flipping a covered arc yields an I-equivalent DAG — same skeleton, same v-structures, same independencies, same score. It is the canonical 'sideways' move that walks within an equivalence class without changing the model." },
    { term: "I-equivalence (Markov equivalence)", def: "Two DAGs are I-equivalent when they encode exactly the same set of conditional independencies. HCMC's random jumps deliberately stay within one such class." },
    { term: "RCAR (Repeated Covered Arc Reversal)", def: "The Monte-Carlo step: repeatedly pick a covered arc at random and reverse it, up to a small cap, producing a different representative of the current equivalence class before greedy search resumes." },
    { term: "RCARNR / RCARR neighbourhoods", def: "The two improvement neighbourhoods used after an RCAR jump. RCARNR allows only additions and deletions; RCARR also allows non-covered reversals. Both omit covered-arc reversals so the just-made randomisation is not immediately reversed." }
  ],

  animation: {
    title: "HCMC on a faithful 4-node example {A,B,C,D}. Plain HC stalls on a score-equivalent tie; HCMC's RCAR random jump flips a covered arc to an equivalent DAG, then climbs to a better optimum. (Schematic following Fig. 204; numbers illustrative.)",
    nodes: [
      { id: "A", x: 0.18, y: 0.5 },
      { id: "B", x: 0.45, y: 0.18 },
      { id: "C", x: 0.45, y: 0.82 },
      { id: "D", x: 0.78, y: 0.5 }
    ],
    edges: [],
    steps: [
      { caption: "<b>Start (𝒢₀).</b> Begin from a near-empty DAG with a single arc A → B. HCMC, like HC, will climb uphill one edge at a time — but it also carries a Monte-Carlo escape for ties.", ops: [{ op: "addEdge", from: "A", to: "B", type: "directed" }, { op: "badge", text: "start: 𝒢₀", kind: "info" }] },
      { caption: "<b>Greedy step — add A → C.</b> Among the single-edge neighbours, adding A → C gives the best score gain, so HC applies it.", ops: [{ op: "score", text: "Add A→C : ΔBIC = +5.4 (best)" }, { op: "addEdge", from: "A", to: "C", type: "directed" }, { op: "highlightEdges", edges: [["A", "C"]], cls: "hl" }, { op: "badge", text: "greedy ascent", kind: "good" }] },
      { caption: "<b>Greedy step — add B → D.</b> The next best improving move is adding B → D. Apply it. The current DAG is { A→B, A→C, B→D }.", ops: [{ op: "score", text: "Add B→D : ΔBIC = +3.1 (best)" }, { op: "addEdge", from: "B", to: "D", type: "directed" }, { op: "highlightEdges", edges: [["B", "D"]], cls: "hl" }, { op: "badge", text: "𝒢 = {A→B, A→C, B→D}", kind: "good" }] },
      { caption: "<b>A score-equivalent tie appears.</b> The best candidates now are just <i>re-orientations</i> of the same structure — e.g. Reverse A→B vs. keep it — and the score is score-<i>equivalent</i>, so they tie. HC must break the tie arbitrarily (Fig. 204).", ops: [{ op: "set", name: "Best (tied)", items: ["Reverse A→B  Δ=0 (equiv.)", "keep A→B  Δ=0 (equiv.)"] }, { op: "highlightEdges", edges: [["A", "B"]], cls: "hl" }, { op: "score", text: "tie: same equivalence class" }] },
      { caption: "<b>Plain HC would get STUCK here.</b> No move strictly improves the score, so greedy HC stops at this local optimum — even though a better-scoring structure is reachable after re-orienting some edges.", ops: [{ op: "badge", text: "local optimum — plain HC stops", kind: "bad" }, { op: "highlightEdges", edges: [["A", "B"], ["A", "C"], ["B", "D"]], cls: "hl" }, { op: "clearSet", name: "Best (tied)" }] },
      { caption: "<b>HCMC triggers a Monte-Carlo jump (prob. p).</b> Instead of stalling, with probability p HCMC switches into a Repeated Covered Arc Reversal (RCAR) walk to hop within the equivalence class.", ops: [{ op: "badge", text: "Monte-Carlo jump fires (prob. p)", kind: "info" }] },
      { caption: "<b>Find a covered arc.</b> A → B is <i>covered</i>: B's only parent is A, and A has no other parents, so reversing it cannot change any v-structure (Recall 88, Theorem 48). Mark it as the random target.", ops: [{ op: "highlightEdges", edges: [["A", "B"]], cls: "hl" }, { op: "highlightNodes", ids: ["A", "B"], cls: "hl" }, { op: "badge", text: "A→B is a covered arc", kind: "info" }] },
      { caption: "<b>RCAR: reverse the covered arc.</b> Flip A → B to B → A. By Theorem 48 the new DAG is I-equivalent — identical independencies and identical score — just a different representative of the same class. (No worse: a legal sideways move.)", ops: [{ op: "removeEdge", from: "A", to: "B" }, { op: "addEdge", from: "B", to: "A", type: "directed" }, { op: "highlightEdges", edges: [["B", "A"]], cls: "hl" }, { op: "badge", text: "RCAR: equivalent DAG, same score", kind: "info" }] },
      { caption: "<b>Resume greedy ascent — covered reversals now forbidden.</b> From the new representative, HCMC runs an HC improvement step in the RCARNR / RCARR neighbourhood, which <i>excludes</i> covered-arc reversals so the jump is not undone. A genuinely improving move now exists.", ops: [{ op: "set", name: "Candidates (no covered rev.)", items: ["Add C→D  Δ=+4.7", "Add B→C  Δ=+0.4"] }, { op: "badge", text: "improvement step (RCARNR/RCARR)", kind: "good" }] },
      { caption: "<b>Climb again — add C → D.</b> This move was out of reach before the jump; now it raises the score. Apply it. The structure { B→A, A→C, B→D, C→D } scores higher than the old local optimum.", ops: [{ op: "score", text: "Add C→D : ΔBIC = +4.7 (best)" }, { op: "addEdge", from: "C", to: "D", type: "directed" }, { op: "highlightEdges", edges: [["C", "D"]], cls: "hl" }, { op: "badge", text: "better basin reached", kind: "good" }, { op: "clearSet", name: "Candidates (no covered rev.)" }] },
      { caption: "<b>Reach a better local optimum.</b> No further single-edge change improves the score. The random jump let HCMC cross the score-equivalent plateau that trapped plain HC and settle in a higher-scoring basin.", ops: [{ op: "highlightEdges", edges: [["B", "A"], ["A", "C"], ["B", "D"], ["C", "D"]], cls: "hl" }, { op: "badge", text: "new, better optimum", kind: "good" }] },
      { caption: "<b>Return the DAG.</b> With the jump budget spent and no improving move left, HCMC returns this DAG — the same type of output as HC, but found via a shorter, less detour-prone path thanks to the intra-class randomisation.", ops: [{ op: "badge", text: "return DAG", kind: "good" }, { op: "highlightEdges", edges: [["B", "A"], ["A", "C"], ["B", "D"], ["C", "D"]], cls: "hl" }] }
    ]
  },

  complexity: "Each greedy iteration costs the same as HC — O(n²) candidate moves, each re-scored cheaply via decomposability. The extra RCAR step adds only the cost of scanning for covered arcs and performing a few random reversals (bounded by the user's cap), so overhead per jump is small. Like HC it is a heuristic with no global-optimum guarantee; the randomisation aims to reduce wasted detours, not to certify optimality.",
  strengths: [
    "Keeps HC's simplicity and speed while addressing its main practical annoyance — long detours caused by arbitrary tie-breaks among score-equivalent DAGs.",
    "The random jumps are <i>safe</i>: covered-arc reversals never change the model's independencies or its score, only the DAG representative (Theorem 48).",
    "Excluding covered reversals during the post-jump improvement step prevents the randomisation from being immediately undone.",
    "Cheap to add on top of an existing HC implementation; the jump probability and reversal cap give simple knobs to tune exploration."
  ],
  limitations: [
    "Still a heuristic — it returns a local optimum and gives no guarantee of finding the globally best DAG.",
    "The benefit depends on the data actually producing score-equivalent ties; on graphs without such plateaus the RCAR step adds little.",
    "Performance is sensitive to the jump probability p and the reversal cap — too much randomisation wastes effort, too little fails to escape detours.",
    "Random covered-arc reversals only move <i>within</i> an equivalence class; they cannot by themselves cross to a structurally different (non-equivalent) basin — that still relies on the greedy improvement steps."
  ],
  notes: "HCMC sits in §5 (Refinement algorithms): it refines greedy HC rather than replacing it. The mechanism rests on two facts the paper states explicitly — Recall 88 defines a covered edge (A → B with Pa_B = Pa_A ∪ {A}), and Theorem 48 (characterisation of equivalence-preserving reversals) guarantees that reversing a covered arc yields an I-equivalent DAG. HCMC implements class-preserving randomisation via Repeated Covered Arc Reversal (RCAR), then improves in the RCARNR (adds/deletes only) or RCARR (adds/deletes/non-covered reversals) neighbourhood, omitting covered-arc reversals in the improvement phase. Figure 204 motivates the design by showing how a score-equivalent tie between two DAGs (G1, G2) can prolong plain greedy search.",
  figureRefs: "Paper §5.1 / §5.1.1 (pp.322–323), ref [87] (Castelo & Kocka). Fig. 204 (motivation: score-equivalent neighbours G1, G2 prolong greedy search). Recall 88 (covered edge: A → B with Pa_B = Pa_A ∪ {A}). Theorem 48 (equivalence-preserving covered-arc reversal). Neighbourhoods RCARNR and RCARR. Builds on §4.3 (Algorithm 5, HC)."
};
