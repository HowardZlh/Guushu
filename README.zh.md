# Guushu 谷序 — 当代时尚品牌网站

[🇬🇧 English](README.md)

基于**自研 Python 静态构建器**构建、部署于 **GitHub Pages**（通过 GitHub Actions 零成本部署）的现代化响应式时尚品牌网站，支持中英双语、轻量模板引擎，并具备完善的测试覆盖。

---

## 🛠 技术栈

| 层级 | 技术 |
|------|------|
| 静态生成 | 自研 Python 构建器（`build.py`） |
| 模板引擎 | Jinja2（构建期）+ 自定义 JS Template Engine（运行时） |
| 内容 | Markdown + YAML front matter（`Markdown`、`PyYAML`） |
| 样式 | SCSS（Dart Sass，经 npm） |
| 交互 | Vanilla JavaScript（ES6+） |
| 部署 | GitHub Pages（GitHub Actions） |
| 测试 | 轻量测试框架（零外部依赖） |

---

## ✨ 功能特性

- **双语支持** — 自动语言检测，支持中英文手动切换。
- **响应式设计** — 移动优先策略，流畅动画，优化断点适配。
- **轻量模板引擎** — 自定义 `` html` ` `` 标签模板函数，自动 XSS 转义，`safeHtml` 包装器支持可组合 UI 组件。
- **组件系统** — 模块化 JavaScript 组件（时尚卡片、分页、弹窗、搜索结果），支持国际化。
- **SEO 优化** — 元标签、Open Graph、Twitter Cards、canonical URL 与 Atom 订阅源。
- **性能优化** — 图片懒加载、资源压缩、CSS 输出优化。
- **无障碍** — 符合 WCAG 2.1 标准，支持键盘导航和语义化 HTML。
- **测试覆盖** — 三层共 119 个测试（JS 单元 + 构建产物 + HTML 快照）。

---

## 📁 项目结构

```
Guushu/
├── build.py                    # Python 静态构建器
├── requirements.txt            # Python 依赖
├── package.json                # dart-sass 工具链
├── templates/                  # Jinja2 模板（base/post/page/partials）
├── _data/
│   └── translations.yml        # 双语翻译字典
├── _posts/                     # 中文博客文章（Markdown）
├── _sass/                      # SCSS 样式模块
├── index.html、about.html …    # 手写页面（中文）+ en/ 镜像
├── assets/
│   ├── css/style.scss          # SCSS 入口（使用 @use）
│   ├── js/
│   │   ├── template-engine.js  # 轻量模板引擎
│   │   ├── components.js       # UI 组件工厂
│   │   └── main.js             # 核心交互逻辑
│   └── post/                   # 文章配图
├── en/                         # 英文版镜像源
├── test/                       # 测试（三层策略）
│   ├── test-runner.js          # 轻量测试框架
│   ├── template-engine.test.js # L1：模板引擎测试
│   ├── components.test.js      # L1：组件测试
│   ├── main.test.js            # L1：DOM 交互测试
│   ├── search.test.js          # L1：搜索与 i18n 辅助函数测试
│   ├── run-all.js              # L1 入口（纯 JS，无需构建）
│   ├── run-build.js            # L2/L3 入口（需先构建站点）
│   └── build/                  # L2/L3：构建产物与快照测试
│       ├── build-output.test.js
│       ├── snapshot.test.js
│       └── __snapshots__/      # 迁移黄金基线
└── .github/workflows/          # CI/CD 部署
```

---

## 🚀 快速开始

### 前置要求

- Python 3.9+
- Node.js 18+（用于 dart-sass）

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/HowardZlh/Guushu.git
cd Guushu

# 安装依赖
pip install -r requirements.txt   # Jinja2、Markdown、PyYAML
npm install                       # dart-sass

# 构建站点到 ./_site
python build.py

# 本地预览
python -m http.server -d _site 4000
```

然后在浏览器中打开 `http://localhost:4000/`。

---

## 🧪 测试

测试分为三层。正是这套分层设计使得 Ruby/Jekyll → Python 的迁移能够被验证行为一致性。

```bash
# L1 —— 纯 JS 单元测试（无需构建）
node test/run-all.js

# L2/L3 —— 构建产物与快照测试（需先构建站点）
python build.py
node test/run-build.js

# 内容有意变更后，重新生成快照基线
UPDATE_SNAPSHOTS=1 node -e "require('./test/test-runner').runTests(['./test/build/snapshot.test.js'])"
```

**当前覆盖：**

- **L1 —— 运行时 JS（83 个测试）** —— 浏览器端行为，不受构建工具变更影响。
  - 模板引擎：20 个测试（转义、safeHtml、数组、空值处理）
  - 组件：34 个测试（渲染、XSS 防护、双语切换、DOM 操作）
  - Main / DOM：24 个测试（移动导航、平滑滚动、header 滚动、懒加载、动画、订阅、搜索、初始化）
  - 搜索与 i18n：5 个测试（performSearch、翻译回退）
- **L2 —— 构建产物（31 个测试）** —— 断言生成页面、双语对称、SEO meta、分页、RSS、CSS。与构建工具无关。
- **L3 —— HTML 快照（5 个测试）** —— 关键页面的归一化语义快照，作为**验证迁移一致性的黄金基线**。

> **迁移说明：** 本站已从 Ruby/Jekyll 迁移到自研 Python 构建器。L1 测试原样沿用
> （测的是浏览器 JS）；L2/L3 测试通过 `SITE_DIR` 环境变量可对任意生成器的 `_site`
> 产物运行，已提交的快照基线证实了 Python 构建产物与原 Jekyll 产物语义一致。

---

## 📦 部署

每次推送到 `main` 分支时，GitHub Actions 自动构建（Python + dart-sass）并部署到 GitHub Pages。公开仓库的 Actions 免费且无分钟限制。

工作流配置见 `.github/workflows/deploy.yml`。

---

## 🔒 安全

- **XSS 防护** — `` html` ` `` 模板引擎自动转义所有动态内容。`safeHtml()` 包装器允许有意的 HTML 组合而不被二次转义。
- **输入清理** — 组件函数使用对象解构和默认值，防止 undefined 注入。

---

## 📄 许可证

本项目采用 MIT 许可证。

---

**Guushu 谷序** — 当代时尚邂逅永恒优雅。
