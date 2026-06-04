# Guushu 谷序 — 当代时尚品牌网站

[🇬🇧 English](README.md)

基于 **Jekyll 4** 和 **GitHub Pages** 构建的现代化响应式时尚品牌网站，支持中英双语、轻量模板引擎，并具备完善的测试覆盖。

---

## 🛠 技术栈

| 层级 | 技术 |
|------|------|
| 静态生成 | Jekyll 4.4.1 |
| 部署 | GitHub Pages（GitHub Actions） |
| 模板引擎 | Liquid（Jekyll）+ 自定义 JS Template Engine |
| 样式 | SCSS（Dart Sass） |
| 交互 | Vanilla JavaScript（ES6+） |
| 测试 | 轻量测试框架（零外部依赖） |

---

## ✨ 功能特性

- **双语支持** — 自动语言检测，支持中英文手动切换。
- **响应式设计** — 移动优先策略，流畅动画，优化断点适配。
- **轻量模板引擎** — 自定义 `` html` ` `` 标签模板函数，自动 XSS 转义，`safeHtml` 包装器支持可组合 UI 组件。
- **组件系统** — 模块化 JavaScript 组件（时尚卡片、分页、弹窗、搜索结果），支持国际化。
- **SEO 优化** — 通过 `jekyll-seo-tag` 自动生成元标签、Open Graph、Twitter Cards、站点地图和结构化数据。
- **性能优化** — 图片懒加载、资源压缩、CSS 输出优化。
- **无障碍** — 符合 WCAG 2.1 标准，支持键盘导航和语义化 HTML。
- **测试覆盖** — 54 个单元测试覆盖模板引擎安全、组件渲染和 XSS 防护。

---

## 📁 项目结构

```
Guushu/
├── _config.yml                 # Jekyll 配置
├── _data/
│   └── translations.yml        # 双语翻译字典
├── _includes/                  # 可复用 Liquid 片段
├── _layouts/                   # 页面布局模板
├── _posts/                     # 中文博客文章（Markdown）
├── _sass/                      # SCSS 样式模块
├── assets/
│   ├── css/style.scss          # SCSS 入口（使用 @use）
│   ├── js/
│   │   ├── template-engine.js  # 轻量模板引擎
│   │   ├── components.js       # UI 组件工厂
│   │   └── main.js             # 核心交互逻辑
│   └── post/                   # 文章配图
├── en/                         # 英文版镜像站点
├── test/                       # 单元测试
│   ├── test-runner.js          # 轻量测试框架
│   ├── template-engine.test.js # 模板引擎测试
│   ├── components.test.js      # 组件测试
│   └── run-all.js              # 测试入口
└── .github/workflows/          # CI/CD 部署
```

---

## 🚀 快速开始

### 前置要求

- Ruby 3.3+（通过 rbenv 管理）
- Bundler 2.5+

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/HowardZlh/Guushu.git
cd Guushu

# 确保 Ruby 3.3+ 已激活
export PATH="/opt/homebrew/bin:$PATH"
eval "$(rbenv init - zsh)"
ruby --version   # 应输出 3.3.x

# 安装依赖
bundle install

# 构建站点
bundle exec jekyll build

# 启动本地服务器
bundle exec jekyll serve --host 0.0.0.0
```

然后在浏览器中打开 `http://localhost:4000/`。

---

## 🧪 测试

所有测试零外部依赖运行。

```bash
# 运行全部测试
node test/run-all.js

# 运行单个测试套件
node -e "require('./test/test-runner').runTests(['./test/template-engine.test.js'])"
node -e "require('./test/test-runner').runTests(['./test/components.test.js'])"
```

**当前覆盖：**
- 模板引擎：20 个测试（转义、safeHtml、数组、空值处理）
- 组件：34 个测试（渲染、XSS 防护、双语切换、DOM 操作）

---

## 📦 部署

每次推送到 `main` 分支时，GitHub Actions 自动构建并部署到 GitHub Pages。

工作流配置见 `.github/workflows/jekyll-gh-pages.yml`。

---

## 🔒 安全

- **XSS 防护** — `` html` ` `` 模板引擎自动转义所有动态内容。`safeHtml()` 包装器允许有意的 HTML 组合而不被二次转义。
- **输入清理** — 组件函数使用对象解构和默认值，防止 undefined 注入。

---

## 📄 许可证

本项目采用 MIT 许可证。

---

**Guushu 谷序** — 当代时尚邂逅永恒优雅。
