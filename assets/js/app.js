/* ============================================================================
   app.js — router, sidebar, search, tag filters, lazy data loading.
   Runs from file:// (data loaded via injected <script> tags, no fetch).
   ============================================================================ */
(function (global) {
  "use strict";

  const ALGOS = global.ALGOS || [];
  const BUILT = new Set(global.ALGO_BUILT || []);
  const metaById = {}; ALGOS.forEach(a => { a.built = BUILT.has(a.id); metaById[a.id] = a; });
  global.ALGO_DATA = global.ALGO_DATA || {};
  const loaded = new Set();
  const ctx = { metaById };
  let activeTags = new Set();
  let searchText = "";

  const $ = s => document.querySelector(s);
  const main = () => $("#main .content");

  /* ---------- lazy load a data file ---------- */
  function loadAlgo(id, cb) {
    if (loaded.has(id) || global.ALGO_DATA[id]) { cb(global.ALGO_DATA[id]); return; }
    if (!BUILT.has(id)) { cb(null); return; }
    const s = document.createElement("script");
    s.src = "data/algos/" + id + ".js";
    s.onload = () => { loaded.add(id); cb(global.ALGO_DATA[id]); };
    s.onerror = () => { cb(null); };
    document.head.appendChild(s);
  }

  /* ---------- sidebar ---------- */
  const FAM_GROUPS = [
    ["constraint", "Constraint-based"],
    ["score", "Score-based"],
    ["hybrid", "Hybrid"],
    ["exact", "Exact"],
    ["scm", "SCM / functional"],
    ["latent", "Latent-variable"],
    ["distributed", "Distributed / federated"],
  ];

  function matchFilter(a) {
    if (searchText) {
      const t = (a.abbr + " " + a.name + " " + (a.authors||"")).toLowerCase();
      if (!t.includes(searchText)) return false;
    }
    if (activeTags.size) {
      let ok = false;
      activeTags.forEach(tg => { if ((a.tags||[]).includes(tg)) ok = true; });
      if (!ok) return false;
    }
    return true;
  }

  function buildSidebar() {
    const nav = $("#navlist");
    const placed = new Set();
    let h = "";
    FAM_GROUPS.forEach(([fam, label]) => {
      const list = ALGOS.filter(a => a.id !== "other" && (a.tags||[]).includes(fam) && matchFilter(a) && !placed.has(a.id));
      if (!list.length) return;
      list.sort((x,y)=>(x.year||0)-(y.year||0));
      h += `<div class="navgroup"><div class="gh">${label} (${list.length})</div>`;
      list.forEach(a => { placed.add(a.id); h += navItem(a); });
      h += `</div>`;
    });
    // leftovers (e.g. privacy/bma-only) + Other
    const rest = ALGOS.filter(a => !placed.has(a.id) && matchFilter(a) && a.id!=="other");
    if (rest.length) {
      h += `<div class="navgroup"><div class="gh">Other categories (${rest.length})</div>`;
      rest.sort((x,y)=>(x.year||0)-(y.year||0));
      rest.forEach(a => h += navItem(a));
      h += `</div>`;
    }
    const other = metaById["other"];
    if (other && matchFilter(other)) h += `<div class="navgroup"><div class="gh">Appendix</div>${navItem(other)}</div>`;
    nav.innerHTML = h || `<div style="padding:20px;color:var(--dim)">No matches.</div>`;
    nav.querySelectorAll(".navitem").forEach(el =>
      el.onclick = () => go(el.dataset.id));
  }

  function navItem(a) {
    const color = global.UI.famColor(a.tags);
    const soon = a.built ? "" : `<span class="badge-soon">soon</span>`;
    return `<div class="navitem ${a.built?'':'todo'}" data-id="${a.id}">
      <span class="dot" style="background:${color}"></span>
      <span class="ab">${global.UI.esc(a.abbr)}</span>
      ${a.built ? `<span class="yr">${a.year||""}</span>` : soon}
    </div>`;
  }

  function buildFilters() {
    const box = $("#filters");
    const order = ["constraint","score","hybrid","exact","approximate","scm","latent","distributed","data-distributed","privacy","bma"];
    box.innerHTML = order.map(t => {
      const i = global.UI.tagInfo(t);
      return `<span class="tag" data-t="${t}" style="--tc:${i.color}">${i.label}</span>`;
    }).join("");
    box.querySelectorAll(".tag").forEach(el => el.onclick = () => {
      const t = el.dataset.t;
      if (activeTags.has(t)) { activeTags.delete(t); el.classList.remove("on"); el.style.background=""; }
      else { activeTags.add(t); el.classList.add("on"); el.style.background=el.style.getPropertyValue("--tc"); }
      buildSidebar();
    });
  }

  function updateProgress() {
    const built = ALGOS.filter(a => a.built && a.id!=="other").length;
    const total = ALGOS.filter(a => a.id!=="other").length;
    $("#progtext").textContent = `${built} / ${total} algorithms detailed`;
    $("#progbar").style.width = (100*built/total) + "%";
  }

  /* ---------- routing ---------- */
  function go(id) {
    if (ctx.engine && ctx.engine.destroy) { try{ctx.engine.destroy();}catch(e){} ctx.engine=null; }
    if (!id || id === "home") { location.hash = "#home"; renderHome(); markActive("home"); return; }
    location.hash = "#" + id;
    const meta = metaById[id];
    if (!meta) { renderHome(); return; }
    markActive(id);
    main().innerHTML = `<div class="placeholder">Loading ${global.UI.esc(meta.abbr)}…</div>`;
    if (id === "other") { loadAlgo(id, d => renderOther(meta, d)); return; }
    loadAlgo(id, d => { global.UI.renderAlgo(main(), meta, d, ctx); wireNav(); $("#main").scrollTop=0; });
  }

  function markActive(id) {
    document.querySelectorAll(".navitem").forEach(el =>
      el.classList.toggle("active", el.dataset.id === id));
  }

  function wireNav() {
    main().querySelectorAll("[data-nav]").forEach(el => el.onclick = () => go(el.dataset.nav));
  }

  /* ---------- home ---------- */
  function renderHome() {
    const total = ALGOS.filter(a=>a.id!=="other").length;
    const built = ALGOS.filter(a=>a.built&&a.id!=="other").length;
    const byFam = {};
    ALGOS.forEach(a => { if(a.id==="other")return; const f=global.UI.family(a.tags); byFam[f]=(byFam[f]||0)+1; });

    let h = `<div class="home-hero">
      <h2>Structure Learning in Bayesian Networks</h2>
      <p>An interactive, plain-language companion to the survey — every algorithm explained
      by its core idea and a <b>step-by-step animation of how it actually runs</b>, grounded
      to the paper. Pick a node on the map or use the sidebar.</p></div>`;

    h += `<div class="home-stats">
      <div class="stat"><div class="num">${total}</div><div class="lab">algorithms catalogued</div></div>
      <div class="stat"><div class="num">${built}</div><div class="lab">fully detailed</div></div>
      <div class="stat"><div class="num">1991–2025</div><div class="lab">years covered</div></div>
    </div>`;

    h += `<div class="section"><h3>Browse by family</h3><div class="cat-grid" id="catgrid"></div></div>`;

    h += `<div class="section"><h3>Algorithmic lineage map</h3>
      <p style="color:var(--muted);margin-top:-4px">Each box is an algorithm placed at its publication year;
      arrows point from a method to what it builds on. Dim boxes aren't detailed yet. Click any box.</p>
      <div class="legend" id="legend"></div>
      <div class="lineage-wrap" id="lineage"></div></div>`;

    main().innerHTML = h;

    // category cards
    const cg = $("#catgrid");
    FAM_GROUPS.forEach(([fam,label])=>{
      const cnt = ALGOS.filter(a=>a.id!=="other"&&(a.tags||[]).includes(fam)).length;
      if(!cnt) return;
      const color = global.UI.tagInfo(fam).color;
      const d = document.createElement("div");
      d.className="cat-card";
      d.innerHTML = `<h4><span class="dot" style="display:inline-block;width:11px;height:11px;border-radius:50%;background:${color}"></span> ${label}</h4><div class="cnt">${cnt} algorithms</div>`;
      d.onclick = ()=>{ activeTags=new Set([fam]); buildFilters2(); buildSidebar(); };
      cg.appendChild(d);
    });

    // legend
    $("#legend").innerHTML = FAM_GROUPS.map(([f,l])=>{
      const c = global.UI.tagInfo(f).color;
      return `<span class="l"><span class="sw" style="background:${c}"></span>${l}</span>`;
    }).join("");

    global.Lineage.build($("#lineage"), ALGOS, go);
  }

  // re-sync filter chip visuals after programmatic change
  function buildFilters2(){
    document.querySelectorAll("#filters .tag").forEach(el=>{
      const on = activeTags.has(el.dataset.t);
      el.classList.toggle("on", on);
      el.style.background = on ? el.style.getPropertyValue("--tc") : "";
    });
  }

  function renderOther(meta, data){
    let h = `<div class="crumbs"><a data-nav="home">Home</a> › Appendix</div>
      <h2>${global.UI.esc(meta.name)}</h2>
      <p style="color:var(--muted)">Paper §5.18 · pp. ${meta.pageStart}–${meta.pageEnd}</p>`;
    if (data && data.html) h += data.html;
    else h += `<div class="placeholder card"><div class="big">🚧</div>Summary of the remaining briefly-mentioned algorithms is coming in the final batch.</div>`;
    main().innerHTML = h; wireNav();
  }

  /* ---------- boot ---------- */
  function boot() {
    $("#search").addEventListener("input", e => { searchText = e.target.value.toLowerCase().trim(); buildSidebar(); });
    buildFilters(); buildSidebar(); updateProgress();
    const hash = location.hash.replace(/^#/, "");
    if (hash && metaById[hash]) go(hash); else renderHome();
    window.addEventListener("hashchange", () => {
      const h = location.hash.replace(/^#/, "");
      if (h && metaById[h]) { if(!document.querySelector(`.navitem.active[data-id="${h}"]`)) go(h); }
    });
  }
  document.addEventListener("DOMContentLoaded", boot);
})(window);
