---
name: guushu-article-rewrite
description: >-
  Rewrite or author Guushu articles (zh `_posts/` + en `en/_posts/` pairs) to
  the "去 AI + SEO" standard set in PRs #9–#12: research-only fact check
  against a source whitelist (Wikipedia EN / Vogue direct URLs published before
  the article date), keyword-first titles within the CJK-width budget of
  test/build/seo.test.js, `updated:` front matter, keyword image alts,
  same-language internal links, dated sourced details instead of anecdotes,
  zero hits on check-ai-tells.mjs (copy/zh + copy/en), and seo.test passing in
  its default blocking mode. Use when asked to "重写旧文章", "去 AI + SEO 重写",
  "按 PR #9 的标准改", "批次 N 的文章", "补一篇中英双语文章", "de-AI these
  posts", "标题超宽了 / title width", "门禁报 triple adjective", "seo.test 红了",
  or when check-ai-tells.mjs or seo.test.js fails on a post. Built on the
  global skills de-ai-copy-zh / de-ai-copy-en; this file is the project overlay
  only. Covers the branch + gh account check, the research sub-agent prompt,
  the CJK half-width title/description budget script, the gate's non-obvious
  traps (zh files also scanned with the English tell list, `X, Y and Z`
  matching proper nouns, 「不是…而是」counted across the whole file, URL chars
  counting toward the 160-char paragraph limit, em dashes effectively capped at
  2), zsh array quoting, the relative-time-word sweep (今天/今年/这个夏天/this
  summer), homepage snapshot + editor's-pick sync, the truncated-file recovery
  rule, the PR body template, the `python` vs `python3` silent-no-build trap
  (run-build passes on a stale `_site/`), an internal-link resolution
  one-liner against `_site/`, and how to gate hand-written pages
  (fashion-news / index) that seo.test does not cover: compare tells against
  the `main` version instead of aiming for zero.
allowed-tools:
  - read
  - grep
  - glob
  - bash
  - edit
  - write
  - task
triggers:
  - user
  - model
---

# guushu-article-rewrite

叠在全局 skill `de-ai-copy-zh` / `de-ai-copy-en` 之上；本文只写本项目的叠加层。
写作规范本体在 `docs/article-authoring-prompt.md`（§1 禁止虚构、§3 风格与 SEO、§5 来源、§7 测试、§9 DoD），先读它。

结果：一批 N 组文章（zh + en 各一份）改完后，`check-ai-tells` 两语 0 违规、
`node test/run-build.js` 全绿（含 seo.test 默认阻塞模式，全站 0 失败）、feed/sitemap 可解析，
PR 描述含「标题改前→改后」表、删除的未核实断言、检查命令输出。

## 机制 / 背景

站点是团队署名（`author: "Guushu Team"`），**不能编个人经历**去「去 AI 味」，
只能用有出处、带日期的具体细节替代。来源被项目收窄到两类：英文 Wikipedia 词条 + Vogue / Vogue Runway 直链
（搜索引擎被 CAPTCHA 拦，必须给 URL）。Vogue 报道发布日必须早于文章 `date`（同日也不算）；
Wikipedia 历史事实不受此限（当前修订日总晚于文章，属正常）。
长度阈值以 `test/build/seo.test.js` 的 `LIMITS` 与 `width()` 为准，不是文档里写的字数。
英文版是给英文读者另写的一篇，不是翻译。

## 步骤

### 0. 场景确认（de-ai skill 要求）

任务下达时若已写明「对外文案 / 中英双语 / 趋势科普长文 / 叠加本项目来源规则」，
不必再问；否则按 `de-ai-copy-zh` §0 问一次。

### 1. 分支与账号

```sh
git checkout main && git pull origin main
git checkout -b fix/de-ai-seo-batch-<批次名>
git branch --show-current            # 不得是 main
gh api user -q .login                # 必须打印 HowardZlh，不对就按 .envrc 重做，不要 gh auth switch
```

### 2. 先跑一次门禁，记下改前数字（进 PR 描述）

zsh 下把文件列表放进数组，字符串会被当成一个路径：

```sh
ZH=(_posts/<a>.md _posts/<b>.md ...); EN=(); for f in $ZH; do EN+=("en/$f"); done
node ~/.config/opencode/skills/de-ai-copy-en/scripts/check-ai-tells.mjs --profile copy --lang zh $ZH
node ~/.config/opencode/skills/de-ai-copy-en/scripts/check-ai-tells.mjs --profile copy --lang en $EN
```

### 3. 事实核查：派 research-only 子 agent

每 2–4 篇一个 `task`（general），prompt 必含：

- 「You MUST NOT write, edit, create, or delete any file anywhere」+ 工作区边界原文。
- 来源白名单：`https://en.wikipedia.org/wiki/...`、
  `https://www.vogue.com/fashion-shows/<season>/<brand>`、`https://www.vogue.com/article/...`。
  搜索引擎被 CAPTCHA 拦，只给直接 URL，失败换 1–2 个 slug 再放弃并报「not fetched」。
- **硬规则：来源发布日必须早于文章日期**，每条事实报出来源日期。
- 列出待核查的现有断言，逐条要「exact wording / verdict（not found / contradicted by <url>）」。
- 姊妹文章已用过的细节列出来，要求找**不同的**。
- 回报三段：USABLE FACTS（含 URL + 日期）/ CLAIMS TO DELETE / 2–4 DATED DETAILS；附 404 列表。

已知 slug：Rabanne 秀评在 `/paco-rabanne`；Alaïa 在 `/azzedine-alaia`；The Row 秀评 404；
`Costume_Institute` 302 到 `Anna_Wintour_Costume_Center`；品牌页常不存在（`Castañer`）。
Vogue 趋势汇总文（`/article/spring-2026-fashion-trends`）可能晚于文章日期，先看日期再用。

### 4. 逐篇重写（zh 与 en 各写一遍）

- front matter 只动 `title` / `title_en` / `description` / `description_en`，
  加 `updated: <今天>`；slug / date / tags / image / author / lang 不动。
- `##` 引子含主关键词并进第一句；`###` 带实体或结论；删「值得记住的一点 /
  One thing to remember」类总结节。
- 图片 URL 不换，先下载看一眼再写 alt（zh 页面中文 alt，带关键词）。
- 1–2 条同语种内链（zh→`/YYYY/...`，en→`/en/YYYY/...`），可指向更晚文章但措辞用
  「另见 / see also」，不写「我们 1 月写过」。不链 `/elevated-sportswear/`（URL 含 elevate 触门禁）。
- 结尾 `> "…" —— Guushu 设计团队`（en 单个 `—`），内容对本文有具体所指。
- 数字多用表格：时间线、色值、城市/年份/组织，表格不计入门禁字数。
- 相对时间词按语境处理（见「坑」）。

### 5. 长度自检（每篇写完立刻跑）

把这段存到预授权临时目录（`/var/folders/.../T/opencode/w.py`）后按文件跑；
它复刻 `seo.test.js` 的 `width()`：zh 按 CJK 等宽，拉丁字符 / 数字 / 空格算 0.5。

```python
import re, sys
CJK = re.compile(r'[\u2e80-\u2eff\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]')
def width(t, lang):
    return len(t) if lang == 'en' else round(sum(1 if CJK.match(c) else 0.5 for c in t))
for f in sys.argv[1:]:
    lang = 'en' if f.startswith('en/') else 'zh'
    fm = open(f, encoding='utf-8').read().split('---')[1]
    g = lambda k: (re.search(r'^%s: "(.*)"$' % k, fm, re.M) or [None, ''])[1]
    lim = {'zh': (30, 60, 90), 'en': (60, 130, 165)}[lang]
    print(f, 'title', width(g('title'), lang), '/', lim[0], '| desc', width(g('description'), lang), lim[1:])
    if lang == 'zh':
        print('   title_en', len(g('title_en')), '/60 | desc_en', len(g('description_en')), '[130-165]')
```

阈值：zh 标题 ≤30、描述 60–90；en 标题 ≤60、描述 130–165。上限含等号，但留 3–5 的余量。
zh 的 `description_en` 与 en 文件的 `description` 必须一字不差。

### 6. 全量验证

```sh
node ~/.config/opencode/skills/de-ai-copy-en/scripts/check-ai-tells.mjs --profile copy --lang zh $ZH
node ~/.config/opencode/skills/de-ai-copy-en/scripts/check-ai-tells.mjs --profile copy --lang en $EN
python3 build.py && node test/run-all.js && node test/run-build.js      # run-build 已含 seo.test（默认阻塞）
SEO_STRICT=0 node -e "require('./test/test-runner').runTests(['./test/build/seo.test.js'])"   # 只想看报告不失败时
python3 -c "import xml.dom.minidom as m;m.parse('_site/feed.xml');m.parse('_site/sitemap.xml')"
```

PR #12 起 seo.test 默认阻塞，通过标准是**全站 0 失败**（backlog 已清零）；`SEO_STRICT=0` 只用于本地起草。
L3 快照只覆盖首页与最早一篇；改到首页最新 6 篇的标题时 `index.snap` / `en__index.snap` 必失配，属预期：

```sh
UPDATE_SNAPSHOTS=1 node -e "require('./test/test-runner').runTests(['./test/build/snapshot.test.js'])" && node test/run-build.js
```

顺手 `grep -n "<旧标题>" index.html en/index.html`：首页「编辑精选」卡片是手写的，旧标题会留在那里。

### 7. 提交与 PR

只 `git add` 本批文件。PR 描述四件套：

1. 「标题改前→改后」表（每组 zh + en 两行，超限的标宽度）。
2. 「Unverified claims removed」逐篇：删了什么、为什么（来源怎么说）、补了什么带日期细节；
   末尾列「Not used」的来源与原因（晚于文章日期 / 404 / 无相关内容）。
3. 站内链接清单（同语种、目标存在）。
4. 检查命令输出块，含改前门禁违规数。

参考 `gh pr view 10 --json body -q .body` 与 #12。`gh pr create --base main --head <branch>`，返回 URL。

## 验证

```sh
python3 build.py | tail -1                            # 必须看到 "Built site -> ... (N posts)"，否则下面全是旧产物
node test/run-build.js | grep "Test Results"          # 期望 N passed, 0 failed
node -e "require('./test/test-runner').runTests(['./test/build/seo.test.js'])" | grep -E "❌|Test Results"   # 0 failed
gh pr view <n> --json title,url                       # 有值
```

改了手写页面（`fashion-news.html` / `index.html` / `about.html` 及 `en/` 镜像）或加了内链时，
逐条核对站内链接在 `_site` 里都有落点（seo.test 不管这些页面）：

```sh
for f in _site/fashion-news/index.html _site/en/fashion-news/index.html; do
  echo "== $f"; grep -o 'id="[a-z0-9-]*"' $f | sort -u | tr '\n' ' '; echo
  grep -o 'href="/[^"#]*"' $f | sed 's/href="//;s/"$//' | sort -u | while read u; do
    [ -f "_site${u%/}/index.html" ] || [ -f "_site$u" ] || echo "MISSING $u"; done
done
```

无 `MISSING` 输出即通过。PR 描述里的命令块能原样复跑且结果一致。

## 坑

### 门禁脚本

- **zh 文件也跑英文词表**（2026-09-18）：`check()` 对每个块同时跑 `tellsEn` 和 `tellsZh`，中文里夹的 `ultimate` /
  `ready to` / `elevate` 同样报。`ready-to-wear` 带连字符不命中，`ready to` 带空格命中。
- **`a, b and c` 三连不分大小写、不看词性**（2026-09-18）：en 门禁抓 `x, y(,) and z`，包括名词和专名
  （"cut, cloth and stitching"、`Catalonia, Aragon and the`、`Body, Naked and Nude`、`Linen, Flax and Tarkhan`）。
  改法：去 and 写成 `x, y, z`，加介词（`in Spain, in France and in Italy`），或用分号 / 拆句。中文版不受影响。
- **em dash 上限实际是 2 个/篇**：规则是「>2 且 >3/千词」，文章 400–600 词，第 3 个就爆。老文平均 3–7 个，
  重写时一律用句号或逗号；结尾引用块 `> "…" — Guushu` 的单个 `—` 不算（引用块不进门禁）。
- **URL 字符计入 160 字段落**（2026-09-18）：zh 段落数的是去空白后的全部字符，含 Markdown 链接的 URL。
  一段里放两条内链几乎必超 → 每条内链单独成段。
- **「不是…而是」按整个 md 计数**，含 front matter 和引用块（正则 `不是[^。！？\n]{1,40}而是`）。「不再是…换成了」不命中。
- **zsh 不对变量分词**：`F="a.md b.md"; node x.mjs $F` 会把整串当一个文件名报 `cannot read`。用数组 `F=(a.md b.md)`。

### 长度与替换

- **description 长度反复超**（2026-09-18）：先量好再替换，不要凭感觉改一版跑一版。zh 描述里每个拉丁词只算 0.5，
  可以多放品牌名，少放汉字；en 165 / zh 90 含等号但改一个词就越界，留余量。
- **批量替换把文件截成 0 字节**（2026-09-18）：若异常在 `open(f,'w')` 之后才抛，文件已清空。规矩：先 `assert old in s`
  且替换值非空，全部替换算完再一次性写回；替换后立刻 `wc -c` 或重跑长度脚本。

### 内容与来源

- **相对时间词会漂移**（2026-09-18 复核）：文章有固定 `date`，读者可能一年后才到。「今天 / today」作「现如今」义 →
  如今 / 现在 / now；「今年 / 这个夏天 / 明年春天 / this summer / this year」能锚定的改绝对年份或季节
  （`2026 年夏天`、`2027 春夏`、`for summer 2026`）；季节专题文里指本季主题的「这一季 / this season」保留；
  「最近一次…是 2024 年 9 月 10 日」这种后面紧跟日期的保留。先看语境，别一刀切。
  扫法：`grep -nE "今天|今年|去年|明年|这个夏天|本季|今夏" _posts/*.md`；
  `grep -niE "\b(today|this year|this summer|this season|now holds)\b" en/_posts/*.md`。「贴近日常」「离它最近」是误命中。
- **姊妹文章已用过的细节不要复用**：crochet-craft 已用 Christopher Kane 2011 / Moschino 2024 / Vogue 2025-03 手工极简；
  quiet-luxury-explained 已用 The Row 2006 / Paltrow 2023 / WSJ 2024 / Eckhardt 2015；couture-craft 已用 Lesage 600 小时 /
  Dior「没有缝纫机」/ Armani Privé 60 套；met-gala 已用 $42M / Kidman 800 小时 / Jenner 11,000 小时。派研究 agent 时列出来，要求找别的。
- **Wikipedia 内部矛盾选保守值**：`Fashion_week` 总览页说 apex 只有三城，四个城市页都写 Big Four 含伦敦 → 引城市页。
  Pantone 年度色「第 N 个」按年数 27、按颜色 29，Vogue 又说 since 1999 → 序数直接删。Linen 同页写 30,000 和 36,000 年 →
  「3 万多年」。Bangladesh「世界最大黄麻产地」被 Jute 词条 FAO 表推翻（印度第一）→ 只写「优质黄麻产地 / 麻底加工中心」。
- **同日发布的 Vogue 不算「早于」**：`best-espadrilles` 发布日与文章同为 2026-07-17，弃用。
- **人物头衔查最新**：Anna Wintour 2025-06 起不再是美国版 Vogue 主编，写「康泰纳仕全球首席内容官」。
- **不得预写 / 不得翻译**：见 `docs/article-authoring-prompt.md` §5 与 `de-ai-copy-en` §0。

### 测试产物

- **`python` 不在 PATH，`build.py` 静默未跑**（2026-09-18）：`python build.py && node test/run-build.js` 里第一段报
  `command not found` 后 `&&` 短路，但若用 `;` 或分开跑，`run-build.js` 会拿**上一次的 `_site/`** 全绿假通过。
  本机只有 `python3`（AGENTS.md 写的 `python` 不可信）。规矩：一律 `python3 build.py`，并确认末行
  `Built site -> ... (N posts)` 再跑测试。
- **手写页面跑 check-ai-tells 会全红，别追零**（2026-09-18）：`fashion-news.html` 等页面的 `<section>` 整块被当作
  一个段落，160 字 / 75 词上限必超；`Ultimate Gray` 专名命中 `ultimate`。这些页面不在 seo.test 覆盖范围。
  改这类页面时的通过标准是「不比 `main` 差」：`git show main:<file> > /tmp/gate-base/<file>` 后两边各跑一次，
  `grep -v paragraph` 对比非段落类违规，新增为 0、em dash 不增即可；把对比结论写进 PR。
- **首页快照只存标题列表**：`diff index.snap _site/index.html` 会显示整页 HTML，那是对比对象不对；
  直接跑 `UPDATE_SNAPSHOTS=1` 后 `git diff test/build/__snapshots__` 看真实变化（应只有那一两行标题）。
