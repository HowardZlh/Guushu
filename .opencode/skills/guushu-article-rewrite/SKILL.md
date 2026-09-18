---
name: guushu-article-rewrite
description: >-
  Rewrite or author Guushu articles (zh `_posts/` + en `en/_posts/` mirror) to
  the de-AI + SEO standard set in PRs #9/#10/#11/#12: research-only fact check
  restricted to Wikipedia (EN) and Vogue direct URLs published before the
  article date, keyword-first titles within the CJK-width budget of
  test/build/seo.test.js, sourced dated details instead of anecdotes,
  same-language internal links, then the check-ai-tells gate, build, tests and
  seo.test in blocking mode. Use when asked to "重写旧文章", "去 AI + SEO 重写",
  "把这篇按 PR #9 的标准改", "补一篇中英双语文章", "标题超宽了 / title width",
  "门禁报 triple adjective", "seo.test 红了", or when check-ai-tells.mjs or
  seo.test.js fails on a post. Covers the branch + gh account check, the
  research-agent prompt, width helper, the gate's non-obvious traps (zh files
  also scanned with the English tell list, `X, Y and Z` matching proper
  nouns, 「不是…而是」counted across the whole file), zsh array quoting for
  multi-file commands, relative-time-word sweep (今天/今年/这个夏天/this
  summer), homepage snapshot regeneration and the PR description template.
allowed-tools:
  - read
  - grep
  - glob
  - bash
  - edit
  - write
  - task
---

# guushu-article-rewrite

叠在全局 skill `de-ai-copy-zh` / `de-ai-copy-en` 之上；本文只写 Guushu 仓库的叠加层。
写作规范本体在 `docs/article-authoring-prompt.md`（§1 禁止虚构、§3 风格与 SEO、§5 来源、§7 测试、§9 DoD），先读它。

结果：一组或多组 `_posts/YYYY-MM-DD-slug.md` + `en/_posts/` 镜像改完后，两条门禁 0 违规、
`node test/run-build.js` 全绿（含 seo.test 阻塞模式 56/56）、PR 描述带「标题改前→改后」表和「删除的未核实断言」清单。

## 机制

站点是团队署名（Guushu Team），不能编个人轶事去 AI 味；唯一合法的「只有作者知道的细节」是**有出处、带日期的具体事实**。
来源被项目收窄到两类：英文 Wikipedia 词条 + Vogue / Vogue Runway 直链（搜索引擎被 CAPTCHA 拦，必须给 URL）。
Vogue 报道发布日必须早于文章 `date`；Wikipedia 历史事实不受此限（当前修订日总晚于文章，属正常）。
英文版是给英文读者另写的一篇，不是翻译。

## 步骤

### 1. 分支与账号

```sh
git checkout main && git pull origin main && git checkout -b fix/<batch-name>
git branch --show-current          # 不能是 main
gh api user -q .login              # 必须是 HowardZlh，不对就按 .envrc 重做，不要 gh auth switch
```

### 2. 事实核查（先于动笔，派 research-only 子 agent）

子 agent prompt 里必须写死：**不得写任何文件**；只用 webfetch + read；来源限定；日期规则；输出三节
「可用事实（含 URL）/ 现文中无法核实的断言 / 2–4 个带日期的具体细节」；列出 404 的 URL。
一个 agent 管两篇正好。常用直链形态：

- `https://en.wikipedia.org/wiki/<Term>`（`Costume_Institute` 会 302 到 `Anna_Wintour_Costume_Center`；品牌页常不存在，如 `Castañer`）
- `https://www.vogue.com/fashion-shows/<season>/<house>`（`spring-2026-couture/chanel`；Alaïa 用 `azzedine-alaia`）
- `https://www.vogue.com/article/<slug>`（猜不中就让 agent 多试几个 slug）

查不到的数字、品牌案例、轶事一律删，不补写。同日发布的报道也不算「早于」。

### 3. 逐篇重写

- front matter 只动 `title` / `title_en` / `description` / `description_en`，加 `updated: <今天>`；slug、date、tags、image、author、lang 不动。
- 宽度以 `test/build/seo.test.js` 的 `LIMITS` 为准：zh 标题 ≤30、描述 60–90（CJK 等宽，拉丁字符算 0.5）；en 标题 ≤60、描述 130–165。
  先写个临时 `w.js` 算宽度（复制 seo.test.js 里的 `width()`），写一版算一版，别靠目测。
- `##` 引子含主关键词并进第一句；`###` 带实体或结论；删「值得记住的一点」类总结节。
- 图 URL 不换，alt 改成带关键词的具体描述，zh 页 alt 必须含汉字。
- 1–2 条同语种站内链接（zh→`/YYYY/MM/DD/slug/`，en→`/en/...`），指向更晚的文章用「另见 / see also」。**别链 `/elevated-sportswear/`**（URL 含 elevate 触发 en 门禁）。
- 结尾 `> "…" —— Guushu 设计团队`（en 用单个 `—`），内容要对本文有具体所指。
- 相对时间词按语境处理（见「坑」）。

### 4. 门禁与测试（zsh 里多文件要用数组）

```sh
Z=(_posts/a.md _posts/b.md); E=(en/_posts/a.md en/_posts/b.md)
node ~/.config/opencode/skills/de-ai-copy-en/scripts/check-ai-tells.mjs --profile copy --lang zh $Z
node ~/.config/opencode/skills/de-ai-copy-en/scripts/check-ai-tells.mjs --profile copy --lang en $E
python3 build.py && node test/run-all.js && node test/run-build.js      # run-build 已含 seo.test（默认阻塞）
SEO_STRICT=0 node -e "require('./test/test-runner').runTests(['./test/build/seo.test.js'])"   # 只想看报告时
python3 -c "import xml.dom.minidom as m;m.parse('_site/feed.xml');m.parse('_site/sitemap.xml')"
```

改到首页最新 6 篇的标题时，`index.snap` / `en__index.snap` 必失配，属预期：

```sh
UPDATE_SNAPSHOTS=1 node -e "require('./test/test-runner').runTests(['./test/build/snapshot.test.js'])" && node test/run-build.js
```

顺手 `grep -n "<旧标题>" index.html en/index.html`：首页「编辑精选」卡片是手写的，旧标题会留在那里。

### 5. 提交与 PR

PR 描述固定四节：标题改前→改后表（含宽度）、删除的未核实断言（按篇，写「not found / contradicted by <url>」）、
站内链接清单、检查命令输出（门禁两条 + build + run-all + run-build + seo 阻塞模式 + XML）。
参考 `gh pr view 10 --json body -q .body` 与 #12。

## 验证

```sh
node test/run-build.js | grep "Test Results"          # 期望 N passed, 0 failed
node -e "require('./test/test-runner').runTests(['./test/build/seo.test.js'])" | grep -E "❌|Test Results"   # 0 failed
grep -c "" _site/sitemap.xml >/dev/null && echo built
```

## 坑

- **zh 文件也跑英文词表**：`check()` 对每个块同时跑 `tellsEn` 和 `tellsZh`，中文里夹的 `ultimate` / `ready to` / `elevate` 同样报。`ready-to-wear` 带连字符不命中，`ready to` 带空格命中。
- **`X, Y and Z` 三连不分大小写、不看词性**：`Catalonia, Aragon and the`、`Body, Naked and Nude`、`Linen, Flax and Tarkhan` 都算「triple adjective」。改成 `X, Y, Z`、加介词（`in Spain, in France and in Italy`）或分号。
- **「不是…而是」按整个 md 计数**，含 front matter 和引用块（正则 `不是[^。！？\n]{1,40}而是`）。「不再是…换成了」不命中。
- **em dash 上限实际是 2 个/篇**：规则是「>2 且 >3/千词」，文章 400–600 词，第 3 个就爆。
- **zsh 不对变量分词**：`F="a.md b.md"; node x.mjs $F` 会把整串当一个文件名报 `cannot read`。用数组 `F=(a.md b.md)`。
- **描述宽度别贴上限**：seo.test 的 `width()` 用 `Math.round`，en 165 / zh 90 是含等号的上限，但改一个词就越界；留 3–5 的余量。
- **相对时间词会漂移**（2026-09-18 复核）：文章有固定 `date`，读者可能一年后才到。「今天 / today」作「现如今」义 → 如今 / 现在 / now；「今年 / 这个夏天 / 明年春天 / this summer / this year」能锚定的改绝对年份或季节（`2026 年夏天`、`2027 春夏`、`for summer 2026`）；季节专题文里指本季主题的「这一季 / this season」保留；「最近一次…是 2024 年 9 月 10 日」这种后面紧跟日期的保留。别一刀切，先看语境。
  扫法：`grep -nE "今天|今年|去年|明年|这个夏天|本季|今夏" _posts/*.md`；`grep -niE "\b(today|this year|this summer|this season|now holds)\b" en/_posts/*.md`。「贴近日常」「离它最近」是误命中。
- **Anna Wintour 的头衔**：2025-06 起不再是美国版 Vogue 主编，写「康泰纳仕全球首席内容官」。
- **Wikipedia 自相矛盾时选保守值**：Linen 词条同页写 30,000 和 36,000 年 → 用「3 万多年」；Bangladesh「世界最大黄麻产地」被 Jute 词条 FAO 表推翻（印度第一）→ 只写它是「优质黄麻产地 / 麻底加工中心」。
- **同日发布的 Vogue 不算「早于」**：`best-espadrilles` 发布日与文章同为 2026-07-17，弃用。
- **首页快照只存标题列表**：diff 时看到整页 HTML 是因为对比对象不对；直接跑 `UPDATE_SNAPSHOTS=1` 后 `git diff test/build/__snapshots__` 看真实变化（应只有那一两行标题）。
