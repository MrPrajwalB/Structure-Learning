/* ============================================================================
   ui.js — category helpers, badges, and the algorithm detail-page renderer.
   ============================================================================ */
(function (global) {
  "use strict";

  const TAGS = {
    constraint:   { label: "Constraint-based", color: "var(--c-constraint)" },
    score:        { label: "Score-based",      color: "var(--c-score)" },
    hybrid:       { label: "Hybrid",           color: "var(--c-hybrid)" },
    exact:        { label: "Exact",            color: "var(--c-exact)" },
    approximate:  { label: "Approximate",      color: "var(--c-approx)" },
    latent:       { label: "Latent variables", color: "var(--c-latent)" },
    scm:          { label: "SCM-based",        color: "var(--c-scm)" },
    distributed:  { label: "Distributed",      color: "var(--c-distributed)" },
    "data-distributed": { label: "Data-distributed", color: "var(--c-distributed)" },
    privacy:      { label: "Privacy",          color: "var(--c-privacy)" },
    bma:          { label: "Bayesian model avg", color: "var(--c-bma)" },
  };
  // family priority for the single colour dot / lineage node
  const FAM_ORDER = ["hybrid","constraint","score","scm","latent","exact","approximate","distributed","data-distributed","privacy","bma"];

  function family(tags) {
    for (const f of FAM_ORDER) if (tags && tags.includes(f)) return f;
    return "other";
  }
  function famColor(tags) {
    const f = family(tags);
    return (TAGS[f] && TAGS[f].color) || "var(--c-other)";
  }
  function tagInfo(t) { return TAGS[t] || { label: t, color: "var(--c-other)" }; }

  function esc(s){ return (s==null?"":String(s)).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c])); }

  function pill(t) {
    const i = tagInfo(t);
    return `<span class="pill" style="background:${i.color}">${i.label}</span>`;
  }

  /* ---- render an algorithm detail page into `el` ---- */
  function renderAlgo(el, meta, data, ctx) {
    if (!data) { renderPlaceholder(el, meta); return; }
    const sec = (title, inner, cls) => `<div class="section ${cls||''}"><h3>${title}</h3>${inner}</div>`;
    const card = (inner, cls) => `<div class="card ${cls||''}">${inner}</div>`;

    let h = "";
    h += `<div class="crumbs"><a data-nav="home">Home</a> › Section ${esc(meta.section)} › ${esc(meta.abbr)}</div>`;

    // header
    h += `<div class="algo-head">
      <div class="algo-title"><h2>${esc(meta.abbr)}</h2>
        <div class="full">${esc(data.name||meta.name)}</div></div>
      <div class="algo-meta">
        ${esc(meta.authors||"")}${meta.year?(" · "+meta.year):""}<br>
        Paper §${esc(meta.section)} · pp. ${meta.pageStart}–${meta.pageEnd}
      </div></div>`;

    // tags
    h += `<div class="tags">${(meta.tags||[]).map(pill).join("")}</div>`;

    // one-liner
    if (data.oneLiner) h += `<div class="oneliner">${data.oneLiner}</div>`;

    // based-on / relationships
    if (data.basedOnText || (meta.basedOn && meta.basedOn.length)) {
      const chips = (meta.basedOn||[]).map(id=>{
        const m = ctx.metaById[id];
        const nm = m ? m.abbr : id;
        return `<span class="relchip" data-nav="${id}"><span class="arrow">based on ▸</span> <b>${esc(nm)}</b></span>`;
      }).join("");
      const extra = data.basedOnText ? `<p style="margin:0 0 10px;color:var(--muted)">${data.basedOnText}</p>` : "";
      h += sec("Lineage", card(extra + `<div class="relbox">${chips || "<span class='ge-chip empty'>standalone / root method</span>"}</div>`));
    }

    // big idea
    if (data.idea) {
      const paras = Array.isArray(data.idea) ? data.idea : [data.idea];
      h += sec("The core idea", card(`<div class="idea">${paras.map(p=>`<p>${p}</p>`).join("")}</div>`));
    }

    // assumptions & I/O
    let aio = "";
    if (data.assumptions && data.assumptions.length) {
      aio += `<div class="assume">${data.assumptions.map(a=>`<span class="a">${a}</span>`).join("")}</div>`;
    }
    if (data.input || data.output) {
      aio += `<div class="io" style="margin-top:12px">
        <div class="box"><div class="lab">Input</div>${esc(data.input||"—")}</div>
        <div class="box"><div class="lab">Output</div>${data.output||"—"}</div></div>`;
    }
    if (aio) h += sec("Assumptions & I/O", card(aio));

    // ANIMATION
    if (data.animation) {
      h += sec("Watch it run — step by step", `<div class="card" id="ge-host"></div>`);
    }

    // steps
    if (data.steps && data.steps.length) {
      const items = data.steps.map(s=>`<div class="step"><div class="n"></div><div class="body">${s}</div></div>`).join("");
      h += sec("The procedure", card(`<div class="steps">${items}</div>`));
    }

    // key concepts
    if (data.keyConcepts && data.keyConcepts.length) {
      const items = data.keyConcepts.map(k=>`<div class="item"><span class="term">${esc(k.term)}</span> — ${k.def}</div>`).join("");
      h += sec("Key concepts (plain language)", card(`<div class="kc">${items}</div>`));
    }

    // strengths / limitations
    if ((data.strengths&&data.strengths.length)||(data.limitations&&data.limitations.length)) {
      const g = `<div class="sl sl-good"><h4>✓ Strengths</h4><ul class="bullets">${(data.strengths||[]).map(x=>`<li>${x}</li>`).join("")}</ul></div>`;
      const b = `<div class="sl sl-bad"><h4>△ Limitations</h4><ul class="bullets">${(data.limitations||[]).map(x=>`<li>${x}</li>`).join("")}</ul></div>`;
      h += sec("Strengths & limitations", `<div class="two-col">${card(g)}${card(b)}</div>`);
    }

    // complexity / notes
    if (data.complexity || data.notes) {
      let n = "";
      if (data.complexity) n += `<p class="complexity">⏱ ${data.complexity}</p>`;
      if (data.notes) n += `<p style="margin:8px 0 0">${data.notes}</p>`;
      h += sec("Cost & notes", card(n));
    }

    if (data.figureRefs) h += `<div class="figref">Grounded in: ${esc(data.figureRefs)}</div>`;

    el.innerHTML = h;

    // mount animation
    if (data.animation) {
      const host = el.querySelector("#ge-host");
      ctx.engine = new global.GraphEngine(host, data.animation);
    }
  }

  function renderPlaceholder(el, meta) {
    el.innerHTML = `
      <div class="crumbs"><a data-nav="home">Home</a> › Section ${esc(meta.section)} › ${esc(meta.abbr)}</div>
      <div class="algo-head"><div class="algo-title"><h2>${esc(meta.abbr)}</h2>
        <div class="full">${esc(meta.name)}</div></div>
        <div class="algo-meta">${esc(meta.authors||"")}${meta.year?(" · "+meta.year):""}<br>
        Paper §${esc(meta.section)} · pp. ${meta.pageStart}–${meta.pageEnd}</div></div>
      <div class="tags">${(meta.tags||[]).map(pill).join("")}</div>
      <div class="placeholder card">
        <div class="big">🚧</div>
        <div>Detailed walkthrough &amp; animation for <b>${esc(meta.abbr)}</b> are being built.</div>
        <div style="margin-top:6px;font-size:13px">This algorithm is catalogued (§${esc(meta.section)}); its interactive page is coming in a later batch.</div>
      </div>`;
  }

  global.UI = { TAGS, family, famColor, tagInfo, pill, renderAlgo, esc };
})(window);
