# Guushu 谷序 — Contemporary Fashion Website

[🇨🇳 中文文档](README.zh.md)

A modern, responsive fashion website built with a **custom Python static builder** and deployed to **GitHub Pages** (zero-cost via GitHub Actions), featuring bilingual support (Chinese/English), a lightweight template engine, and comprehensive test coverage.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Static Generator | Custom Python builder (`build.py`) |
| Templating | Jinja2 (build-time) + Custom JS Template Engine (runtime) |
| Content | Markdown + YAML front matter (via `Markdown`, `PyYAML`) |
| Styling | SCSS (Dart Sass via npm) |
| Interactivity | Vanilla JavaScript (ES6+) |
| Deployment | GitHub Pages (via GitHub Actions) |
| Testing | Custom lightweight test runner (zero dependencies) |

---

## ✨ Features

- **Bilingual Support** — Automatic language detection with manual switching between Chinese and English.
- **Responsive Design** — Mobile-first approach with smooth animations and optimized breakpoints.
- **Lightweight Template Engine** — Custom `` html` ` `` tagged template literal with automatic XSS escaping and `safeHtml` wrappers for composable UI components.
- **Component System** — Modular JavaScript components (fashion cards, pagination, modals, search results) with i18n support.
- **SEO Optimized** — Meta tags, Open Graph, Twitter Cards, canonical URLs, and an Atom feed.
- **Performance** — Lazy loading images, compressed assets, and optimized CSS output.
- **Accessibility** — WCAG 2.1 compliant with keyboard navigation and semantic HTML.
- **Test Coverage** — 119 tests across three layers (JS unit + build-output + HTML snapshots).

---

## 📁 Project Structure

```
Guushu/
├── build.py                    # Python static site builder
├── requirements.txt            # Python dependencies
├── package.json                # dart-sass toolchain
├── templates/                  # Jinja2 templates (base, post, page, partials)
├── _data/
│   └── translations.yml        # Bilingual translation dictionary
├── _posts/                     # Chinese blog posts (Markdown)
├── _sass/                      # SCSS style modules
├── index.html, about.html …    # Hand-written pages (zh) + en/ mirror
├── assets/
│   ├── css/style.scss          # SCSS entry (uses @use)
│   ├── js/
│   │   ├── template-engine.js  # Lightweight template engine
│   │   ├── components.js       # UI component factory
│   │   └── main.js             # Core interactions
│   └── post/                   # Article images
├── en/                         # English mirror site
├── test/                       # Tests (3-layer strategy)
│   ├── test-runner.js          # Lightweight test framework
│   ├── template-engine.test.js # L1: template engine tests
│   ├── components.test.js      # L1: component tests
│   ├── main.test.js            # L1: DOM interaction tests
│   ├── search.test.js          # L1: search & i18n helper tests
│   ├── run-all.js              # L1 entry (pure JS, no build)
│   ├── run-build.js            # L2/L3 entry (requires built site)
│   └── build/                  # L2/L3: build-output & snapshot tests
│       ├── build-output.test.js
│       ├── snapshot.test.js
│       └── __snapshots__/      # Migration golden baseline
└── .github/workflows/          # CI/CD deployment
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+ (for dart-sass)

### Local Development

```bash
# Clone the repository
git clone https://github.com/HowardZlh/Guushu.git
cd Guushu

# Install dependencies
pip install -r requirements.txt   # Jinja2, Markdown, PyYAML
npm install                       # dart-sass

# Build the site into ./_site
python build.py

# Preview locally
python -m http.server -d _site 4000
```

Then open `http://localhost:4000/` in your browser.

---

## 🧪 Testing

Tests are organized in three layers. This layered design is what enabled the
Ruby/Jekyll → Python migration to be verified for behavioural parity.

```bash
# L1 — pure JS unit tests (no build required)
node test/run-all.js

# L2/L3 — build-output & snapshot tests (build the site first)
python build.py
node test/run-build.js

# Regenerate snapshot baseline after intentional content changes
UPDATE_SNAPSHOTS=1 node -e "require('./test/test-runner').runTests(['./test/build/snapshot.test.js'])"
```

**Current coverage:**

- **L1 — Runtime JS (83 tests)** — browser-side behaviour; unaffected by build-tool changes.
  - Template Engine: 20 tests (escaping, safeHtml, arrays, null handling)
  - Components: 34 tests (rendering, XSS prevention, bilingual switching, DOM operations)
  - Main / DOM: 24 tests (mobile nav, smooth scroll, header scroll, lazy loading, animations, newsletter, search, init)
  - Search & i18n: 5 tests (performSearch, translation fallback)
- **L2 — Build output (31 tests)** — asserts generated pages, bilingual symmetry, SEO meta, pagination, RSS, CSS. Build-tool agnostic.
- **L3 — HTML snapshots (5 tests)** — normalized semantic snapshots of key pages, serving as the **golden baseline for verifying migration parity**.

> **Migration note:** The site was migrated from Ruby/Jekyll to a custom Python
> builder. L1 tests ported unchanged (they test browser JS). L2/L3 tests run
> against any generator's `_site` output via the `SITE_DIR` env var, and the
> committed snapshot baseline confirmed the Python build produces equivalent
> output to the original Jekyll build.

---

## 📦 Deployment

The site is automatically built (Python + dart-sass) and deployed to GitHub Pages via GitHub Actions on every push to `main`. Public repository builds are free with unlimited Actions minutes.

See `.github/workflows/deploy.yml` for the workflow configuration.

---

## 🔒 Security

- **XSS Prevention** — All dynamic content is auto-escaped by the `` html` ` `` template engine. `safeHtml()` wrappers allow intentional HTML composition without re-escaping.
- **Input Sanitization** — Component functions use object destructuring with default values to prevent undefined injection.

---

## 📄 License

This project is licensed under the MIT License.

---

**Guushu 谷序** — Where Contemporary Fashion Meets Timeless Elegance.
