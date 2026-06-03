/* ============================================================================
   lineage.js — interactive chronological lineage map (recreation of Fig.1).
   Year on the vertical axis (old → new). Nodes coloured by family. "Based-on"
   arrows connect a method to the methods it builds on.
   ============================================================================ */
(function (global) {
  "use strict";

  function build(container, algos, onPick) {
    const items = algos.filter(a => a.id !== "other" && a.year);
    const byId = {}; items.forEach(a => byId[a.id] = a);

    // group by year
    const years = [...new Set(items.map(a => a.year))].sort((x, y) => x - y);
    const rowOf = {}; years.forEach((y, i) => rowOf[y] = i);
    const perYear = {}; years.forEach(y => perYear[y] = []);
    items.forEach(a => perYear[a.year].push(a));
    // order within a year for some stability: by section
    years.forEach(y => perYear[y].sort((a,b)=> (a.section<b.section?-1:1)));

    const maxRow = Math.max(...years.map(y => perYear[y].length));
    const NW = 78, NH = 24, GAPX = 14, GAPY = 26, padL = 70, padT = 24;
    const colW = NW + GAPX;
    const W = padL + maxRow * colW + 30;
    const rowH = NH + GAPY;
    const H = padT + years.length * rowH + 20;

    const pos = {}; // id -> {x,y,cx,cy}
    years.forEach(y => {
      const row = rowOf[y];
      perYear[y].forEach((a, i) => {
        const x = padL + i * colW;
        const yy = padT + row * rowH;
        pos[a.id] = { x, y: yy, cx: x + NW / 2, cy: yy + NH / 2 };
      });
    });

    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("class", "lineage-svg");
    svg.setAttribute("height", H);

    // year labels + faint gridlines
    years.forEach(y => {
      const yy = padT + rowOf[y] * rowH + NH / 2;
      const t = document.createElementNS(NS, "text");
      t.setAttribute("x", 10); t.setAttribute("y", yy + 4);
      t.setAttribute("class", "ln-year"); t.textContent = y;
      svg.appendChild(t);
    });

    // edges (basedOn child -> parent)
    const edgeLayer = document.createElementNS(NS, "g");
    svg.appendChild(edgeLayer);
    const edgeEls = {};
    items.forEach(a => {
      (a.basedOn || []).forEach(pid => {
        if (!pos[pid] || !pos[a.id]) return;
        const p = pos[pid], c = pos[a.id];
        const path = document.createElementNS(NS, "path");
        const x1 = p.cx, y1 = p.y + NH, x2 = c.cx, y2 = c.y;
        const my = (y1 + y2) / 2;
        path.setAttribute("d", `M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`);
        path.setAttribute("class", "ln-edge");
        path.setAttribute("data-a", a.id); path.setAttribute("data-p", pid);
        edgeLayer.appendChild(path);
        (edgeEls[a.id] = edgeEls[a.id] || []).push(path);
        (edgeEls[pid] = edgeEls[pid] || []).push(path);
      });
    });

    // nodes
    items.forEach(a => {
      const p = pos[a.id];
      const g = document.createElementNS(NS, "g");
      g.setAttribute("class", "ln-node");
      g.setAttribute("transform", `translate(${p.x},${p.y})`);
      const r = document.createElementNS(NS, "rect");
      r.setAttribute("width", NW); r.setAttribute("height", NH);
      r.setAttribute("rx", 7);
      r.setAttribute("fill", global.UI.famColor(a.tags));
      r.setAttribute("opacity", a.built ? 1 : 0.42);
      g.appendChild(r);
      const t = document.createElementNS(NS, "text");
      t.setAttribute("x", NW / 2); t.setAttribute("y", NH / 2 + 4);
      t.setAttribute("text-anchor", "middle");
      t.textContent = a.abbr.length > 11 ? a.abbr.slice(0, 10) + "…" : a.abbr;
      g.appendChild(t);
      const title = document.createElementNS(NS, "title");
      title.textContent = `${a.abbr} — ${a.name} (${a.year})`;
      g.appendChild(title);
      g.addEventListener("click", () => onPick(a.id));
      g.addEventListener("mouseenter", () => (edgeEls[a.id]||[]).forEach(e=>e.classList.add("strong")));
      g.addEventListener("mouseleave", () => (edgeEls[a.id]||[]).forEach(e=>e.classList.remove("strong")));
      svg.appendChild(g);
    });

    container.innerHTML = "";
    container.appendChild(svg);
  }

  global.Lineage = { build };
})(window);
