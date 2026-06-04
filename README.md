# Guushu 谷序 — Contemporary Fashion Website

[🇨🇳 中文文档](README.zh.md)

A modern, responsive fashion website built with **Jekyll 4** and **GitHub Pages**, featuring bilingual support (Chinese/English), a lightweight template engine, and comprehensive test coverage.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Static Generator | Jekyll 4.4.1 |
| Deployment | GitHub Pages (via GitHub Actions) |
| Templating | Liquid (Jekyll) + Custom JS Template Engine |
| Styling | SCSS (Dart Sass) |
| Interactivity | Vanilla JavaScript (ES6+) |
| Testing | Custom lightweight test runner (zero dependencies) |

---

## ✨ Features

- **Bilingual Support** — Automatic language detection with manual switching between Chinese and English.
- **Responsive Design** — Mobile-first approach with smooth animations and optimized breakpoints.
- **Lightweight Template Engine** — Custom `` html` ` `` tagged template literal with automatic XSS escaping and `safeHtml` wrappers for composable UI components.
- **Component System** — Modular JavaScript components (fashion cards, pagination, modals, search results) with i18n support.
- **SEO Optimized** — Meta tags, Open Graph, Twitter Cards, sitemaps, and structured data via `jekyll-seo-tag`.
- **Performance** — Lazy loading images, compressed assets, and optimized CSS output.
- **Accessibility** — WCAG 2.1 compliant with keyboard navigation and semantic HTML.
- **Test Coverage** — 54 unit tests covering template engine security, component rendering, and XSS prevention.

---

## 📁 Project Structure

```
Guushu/
├── _config.yml                 # Jekyll configuration
├── _data/
│   └── translations.yml        # Bilingual translation dictionary
├── _includes/                  # Reusable Liquid partials
├── _layouts/                   # Page layout templates
├── _posts/                     # Chinese blog posts (Markdown)
├── _sass/                      # SCSS style modules
├── assets/
│   ├── css/style.scss          # SCSS entry (uses @use)
│   ├── js/
│   │   ├── template-engine.js  # Lightweight template engine
│   │   ├── components.js       # UI component factory
│   │   └── main.js             # Core interactions
│   └── post/                   # Article images
├── en/                         # English mirror site
├── test/                       # Unit tests
│   ├── test-runner.js          # Lightweight test framework
│   ├── template-engine.test.js # Template engine tests
│   ├── components.test.js      # Component tests
│   └── run-all.js              # Test entry
└── .github/workflows/          # CI/CD deployment
```

---

## 🚀 Quick Start

### Prerequisites

- Ruby 3.3+ (managed via rbenv)
- Bundler 2.5+

### Local Development

```bash
# Clone the repository
git clone https://github.com/HowardZlh/Guushu.git
cd Guushu

# Ensure Ruby 3.3+ is active
export PATH="/opt/homebrew/bin:$PATH"
eval "$(rbenv init - zsh)"
ruby --version   # Should print 3.3.x

# Install dependencies
bundle install

# Build the site
bundle exec jekyll build

# Start local server
bundle exec jekyll serve --host 0.0.0.0
```

Then open `http://localhost:4000/` in your browser.

---

## 🧪 Testing

All tests run with zero external dependencies.

```bash
# Run all tests
node test/run-all.js

# Run individual test suites
node -e "require('./test/test-runner').runTests(['./test/template-engine.test.js'])"
node -e "require('./test/test-runner').runTests(['./test/components.test.js'])"
```

**Current coverage:**
- Template Engine: 20 tests (escaping, safeHtml, arrays, null handling)
- Components: 34 tests (rendering, XSS prevention, bilingual switching, DOM operations)

---

## 📦 Deployment

The site is automatically built and deployed to GitHub Pages via GitHub Actions on every push to `main`.

See `.github/workflows/jekyll-gh-pages.yml` for the workflow configuration.

---

## 🔒 Security

- **XSS Prevention** — All dynamic content is auto-escaped by the `` html` ` `` template engine. `safeHtml()` wrappers allow intentional HTML composition without re-escaping.
- **Input Sanitization** — Component functions use object destructuring with default values to prevent undefined injection.

---

## 📄 License

This project is licensed under the MIT License.

---

**Guushu 谷序** — Where Contemporary Fashion Meets Timeless Elegance.
