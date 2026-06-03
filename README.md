# Structure Learning in Bayesian Networks — Interactive Survey Dashboard

An interactive, plain-language companion to the survey *“Structure Learning in Bayesian
Networks: A Systematic Pedagogical Survey.”* Every one of the **84 structure-learning
algorithms** is explained by its core idea and a **step-by-step animation of how it
actually runs** on a concrete example, grounded in the paper.

**Live site:** _enable GitHub Pages (see below)_ → `https://<username>.github.io/<repo>/`

## Features
- **Lineage map** home page (1991–2025): every algorithm placed at its publication year,
  colored by family, with “based-on” arrows. Click a node to open it.
- **Per-algorithm pages**: core idea, assumptions & I/O, the real procedure, a key-concept
  glossary, an interactive animation (play / step / scrub / speed), strengths & limitations.
- **Search** and **tag filters** (constraint · score · hybrid · exact · SCM · latent ·
  distributed · …), plus a §5.18 appendix of briefly-mentioned methods.

## Running it
It's a fully static site — no build step, no server required.
- **Locally:** just open `index.html` in a browser.
- **GitHub Pages:** push this repo, then in **Settings → Pages**, set *Source* to
  *Deploy from a branch*, branch **main**, folder **/ (root)**. The site appears at
  `https://<username>.github.io/<repo>/` within a minute or two.

## Project layout
```
index.html              # shell (loads everything)
assets/css/styles.css   # dark theme
assets/js/              # graph-engine, ui, lineage map, router
data/meta.js            # metadata for all algorithms (+ manifest.js)
data/algos/<id>.js      # one file per algorithm (content + animation)
```

## Notes
- Data is loaded via `<script>` tags (no `fetch`), so it works from `file://` and from any
  subpath on GitHub Pages.
- The source survey PDF is **not** included in this repo.
