/* ============================================================================
   graph-engine.js  —  Reusable SVG graph renderer + step animator.
   Drives every algorithm's worked-example animation.

   A graph spec:
     nodes: [{id, label, x, y}]            x,y normalized in [0,1]
     edges: [{from, to, type}]             type shorthand OR explicit marks
            type: 'undirected' | 'directed' | 'bidirected' | 'circ-circ'(o-o)
                  | 'circ-arrow'(o->)
            (you may instead give {from,to,mFrom,mTo} with marks
             'tail'|'arrow'|'circle')
     steps: [{caption, ops:[...]}]

   Op vocabulary (see README in dashboard):
     {op:'addEdge', from, to, type}
     {op:'removeEdge', from, to}
     {op:'orient', from, to, type}            (re-mark an existing/!existing edge)
     {op:'highlightNodes', ids:[...], cls}    transient (current step only)
     {op:'highlightEdges', edges:[[a,b],...], cls}
     {op:'testCI', x, y, z:[...], result:'indep'|'dep'}
     {op:'score', text}                       badge
     {op:'badge', text, kind}                 generic status badge
     {op:'set', name, items:[...], color}     cumulative labelled chip set
     {op:'clearSet', name}
   ============================================================================ */

(function (global) {
  "use strict";

  const MARK = { TAIL: "tail", ARROW: "arrow", CIRCLE: "circle" };

  function typeToMarks(type) {
    switch (type) {
      case "undirected": return [MARK.TAIL, MARK.TAIL];
      case "directed":   return [MARK.TAIL, MARK.ARROW];
      case "bidirected": return [MARK.ARROW, MARK.ARROW];
      case "circ-circ":  return [MARK.CIRCLE, MARK.CIRCLE];
      case "circ-arrow": return [MARK.CIRCLE, MARK.ARROW];
      default:           return [MARK.TAIL, MARK.TAIL];
    }
  }

  function normEdge(e) {
    let mFrom = e.mFrom, mTo = e.mTo;
    if (!mFrom || !mTo) { const m = typeToMarks(e.type || "undirected"); mFrom = m[0]; mTo = m[1]; }
    return { from: e.from, to: e.to, mFrom, mTo };
  }

  const key = (a, b) => a < b ? a + "|" + b : b + "|" + a;

  class GraphEngine {
    constructor(container, spec) {
      this.container = container;
      this.spec = spec;
      this.nodes = spec.nodes;
      this.baseEdges = (spec.edges || []).map(normEdge);
      this.steps = spec.steps || [];
      this.cur = 0;
      this.playing = false;
      this.speed = 1;
      this.timer = null;
      this._build();
      this.renderStep(0);
    }

    _build() {
      const c = this.container;
      c.innerHTML = "";
      c.classList.add("ge-root");

      // caption
      this.captionEl = document.createElement("div");
      this.captionEl.className = "ge-caption";
      c.appendChild(this.captionEl);

      // svg stage
      const W = 760, H = 430;
      this.W = W; this.H = H;
      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      svg.setAttribute("class", "ge-svg");
      this.svg = svg;
      this.edgeLayer = document.createElementNS(svgNS, "g");
      this.nodeLayer = document.createElementNS(svgNS, "g");
      this.overlayLayer = document.createElementNS(svgNS, "g");
      svg.appendChild(this.edgeLayer);
      svg.appendChild(this.overlayLayer);
      svg.appendChild(this.nodeLayer);
      c.appendChild(svg);

      // state panel (sets / score / badges)
      this.panel = document.createElement("div");
      this.panel.className = "ge-panel";
      c.appendChild(this.panel);

      // controls
      const ctr = document.createElement("div");
      ctr.className = "ge-controls";
      ctr.innerHTML = `
        <button data-a="reset" title="Restart">⏮</button>
        <button data-a="back" title="Step back">◀</button>
        <button data-a="play" title="Play/Pause" class="ge-play">▶</button>
        <button data-a="fwd" title="Step forward">▶▶</button>
        <input type="range" class="ge-scrub" min="0" max="${Math.max(0,this.steps.length-1)}" value="0">
        <span class="ge-count">0/${Math.max(0,this.steps.length-1)}</span>
        <select class="ge-speed" title="Speed">
          <option value="1600">0.5×</option>
          <option value="1000" selected>1×</option>
          <option value="600">1.5×</option>
          <option value="350">2.5×</option>
        </select>`;
      c.appendChild(ctr);
      this.ctr = ctr;
      ctr.querySelector('[data-a="reset"]').onclick = () => { this.pause(); this.renderStep(0); };
      ctr.querySelector('[data-a="back"]').onclick = () => { this.pause(); this.renderStep(this.cur - 1); };
      ctr.querySelector('[data-a="fwd"]').onclick = () => { this.pause(); this.renderStep(this.cur + 1); };
      this.playBtn = ctr.querySelector('[data-a="play"]');
      this.playBtn.onclick = () => this.toggle();
      this.scrub = ctr.querySelector(".ge-scrub");
      this.scrub.oninput = () => { this.pause(); this.renderStep(parseInt(this.scrub.value, 10)); };
      this.countEl = ctr.querySelector(".ge-count");
      this.speedEl = ctr.querySelector(".ge-speed");
      this.speedEl.onchange = () => { this.delay = parseInt(this.speedEl.value, 10); if (this.playing) { this.pause(); this.play(); } };
      this.delay = 1000;

      this._nodePos = {};
      const pad = 56;
      this.nodes.forEach(n => {
        this._nodePos[n.id] = { x: pad + n.x * (W - 2 * pad), y: pad + n.y * (H - 2 * pad) };
      });
    }

    /* ---- derive cumulative state at step k ---- */
    stateAt(k) {
      const edges = {};
      this.baseEdges.forEach(e => { edges[key(e.from, e.to)] = Object.assign({}, e); });
      const sets = {};
      let caption = this.spec.title || "";
      const hlNodes = {}, hlEdges = {};
      let ci = null, badges = [];

      const applyStructural = (op) => {
        if (op.op === "addEdge") {
          const m = normEdge(op);
          edges[key(op.from, op.to)] = m;
        } else if (op.op === "removeEdge") {
          delete edges[key(op.from, op.to)];
        } else if (op.op === "orient") {
          const m = normEdge(op);
          // preserve direction from->to as specified
          edges[key(op.from, op.to)] = m;
        } else if (op.op === "set") {
          sets[op.name] = { items: op.items.slice(), color: op.color || "" };
        } else if (op.op === "clearSet") {
          delete sets[op.name];
        }
      };

      for (let s = 0; s <= k && s < this.steps.length; s++) {
        (this.steps[s].ops || []).forEach(applyStructural);
      }
      // transient overlays only from step k
      if (this.steps[k]) {
        caption = this.steps[k].caption || caption;
        (this.steps[k].ops || []).forEach(op => {
          if (op.op === "highlightNodes") (op.ids || []).forEach(id => hlNodes[id] = op.cls || "hl");
          else if (op.op === "highlightEdges") (op.edges || []).forEach(p => hlEdges[key(p[0], p[1])] = op.cls || "hl");
          else if (op.op === "testCI") {
            ci = { x: op.x, y: op.y, z: op.z || [], result: op.result };
            hlNodes[op.x] = "ci-end"; hlNodes[op.y] = "ci-end";
            (op.z || []).forEach(id => hlNodes[id] = "ci-cond");
            hlEdges[key(op.x, op.y)] = op.result === "indep" ? "ci-cut" : "ci-keep";
          } else if (op.op === "score") badges.push({ text: op.text, kind: "score" });
          else if (op.op === "badge") badges.push({ text: op.text, kind: op.kind || "info" });
        });
      }
      return { edges, sets, caption, hlNodes, hlEdges, ci, badges };
    }

    renderStep(k) {
      k = Math.max(0, Math.min(k, Math.max(0, this.steps.length - 1)));
      this.cur = k;
      const st = this.stateAt(k);
      this._drawEdges(st);
      this._drawNodes(st);
      this._drawOverlay(st);
      this.captionEl.innerHTML = st.caption;
      this._drawPanel(st);
      this.scrub.value = k;
      this.countEl.textContent = k + "/" + Math.max(0, this.steps.length - 1);
    }

    _drawEdges(st) {
      const ns = "http://www.w3.org/2000/svg";
      this.edgeLayer.innerHTML = "";
      Object.values(st.edges).forEach(e => {
        const a = this._nodePos[e.from], b = this._nodePos[e.to];
        if (!a || !b) return;
        const r = 22;
        const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
        const ux = dx / L, uy = dy / L;
        const ax = a.x + ux * r, ay = a.y + uy * r;
        const bx = b.x - ux * r, by = b.y - uy * r;
        const g = document.createElementNS(ns, "g");
        const cls = st.hlEdges[key(e.from, e.to)];
        g.setAttribute("class", "ge-edge" + (cls ? " " + cls : ""));
        const line = document.createElementNS(ns, "line");
        line.setAttribute("x1", ax); line.setAttribute("y1", ay);
        line.setAttribute("x2", bx); line.setAttribute("y2", by);
        g.appendChild(line);
        this._endMark(g, e.mFrom, ax, ay, -ux, -uy);
        this._endMark(g, e.mTo, bx, by, ux, uy);
        this.edgeLayer.appendChild(g);
      });
    }

    _endMark(g, mark, x, y, ux, uy) {
      const ns = "http://www.w3.org/2000/svg";
      if (mark === MARK.ARROW) {
        const s = 11, w = 6;
        const tipx = x, tipy = y;
        const bx = x - ux * s, by = y - uy * s;
        const px = -uy, py = ux;
        const p = document.createElementNS(ns, "polygon");
        p.setAttribute("points",
          `${tipx},${tipy} ${bx + px * w},${by + py * w} ${bx - px * w},${by - py * w}`);
        p.setAttribute("class", "ge-arrow");
        g.appendChild(p);
      } else if (mark === MARK.CIRCLE) {
        const c = document.createElementNS(ns, "circle");
        c.setAttribute("cx", x - ux * 5); c.setAttribute("cy", y - uy * 5);
        c.setAttribute("r", 4.5); c.setAttribute("class", "ge-mcircle");
        g.appendChild(c);
      }
    }

    _drawNodes(st) {
      const ns = "http://www.w3.org/2000/svg";
      this.nodeLayer.innerHTML = "";
      this.nodes.forEach(n => {
        const p = this._nodePos[n.id];
        const g = document.createElementNS(ns, "g");
        const cls = st.hlNodes[n.id];
        g.setAttribute("class", "ge-node" + (cls ? " " + cls : ""));
        g.setAttribute("transform", `translate(${p.x},${p.y})`);
        const c = document.createElementNS(ns, "circle");
        c.setAttribute("r", 22);
        g.appendChild(c);
        const t = document.createElementNS(ns, "text");
        t.setAttribute("text-anchor", "middle");
        t.setAttribute("dy", "0.34em");
        t.textContent = n.label != null ? n.label : n.id;
        g.appendChild(t);
        this.nodeLayer.appendChild(g);
      });
    }

    _drawOverlay(st) {
      this.overlayLayer.innerHTML = "";
      // CI test: draw a soft band linking conditioning set (handled by node classes); nothing extra needed
    }

    _drawPanel(st) {
      const parts = [];
      st.badges.forEach(b => {
        parts.push(`<span class="ge-badge ${b.kind}">${b.text}</span>`);
      });
      if (st.ci) {
        const ztxt = st.ci.z.length ? "{" + st.ci.z.join(",") + "}" : "∅";
        const verdict = st.ci.result === "indep"
          ? `<b class="ok">independent</b> → remove edge`
          : `<b class="bad">dependent</b> → keep edge`;
        parts.push(`<span class="ge-ci">CI test: ${st.ci.x} ⫫ ${st.ci.y} | ${ztxt} → ${verdict}</span>`);
      }
      Object.keys(st.sets).forEach(name => {
        const s = st.sets[name];
        const chips = s.items.map(it => `<span class="ge-chip">${it}</span>`).join("");
        parts.push(`<span class="ge-setlabel">${name}:</span> ${chips || "<span class='ge-chip empty'>∅</span>"}`);
      });
      this.panel.innerHTML = parts.join("<span class='ge-sep'></span>");
      this.panel.style.display = parts.length ? "flex" : "none";
    }

    toggle() { this.playing ? this.pause() : this.play(); }
    play() {
      if (this.steps.length <= 1) return;
      if (this.cur >= this.steps.length - 1) this.renderStep(0);
      this.playing = true; this.playBtn.textContent = "⏸"; this.playBtn.classList.add("on");
      const tick = () => {
        if (!this.playing) return;
        if (this.cur >= this.steps.length - 1) { this.pause(); return; }
        this.renderStep(this.cur + 1);
        this.timer = setTimeout(tick, this.delay);
      };
      this.timer = setTimeout(tick, this.delay);
    }
    pause() {
      this.playing = false; if (this.timer) clearTimeout(this.timer);
      this.playBtn.textContent = "▶"; this.playBtn.classList.remove("on");
    }
    destroy() { this.pause(); this.container.innerHTML = ""; }
  }

  global.GraphEngine = GraphEngine;
})(window);
