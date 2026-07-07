# Guushu 文章编写 Prompt / 作业规范

本文件沉淀「为 Guushu 站点补充时尚资讯文章」这类任务的完整要求、工作流、
脚本命令与验证清单，供人或 AI Agent 复用。请在开始此类任务前完整阅读。

---

## 0. 一句话任务描述

> 为 Guushu（谷序）站点补充**符合项目风格、基于真实资讯、中英双语、配图内容相符**
> 的时尚趋势文章，日期分布覆盖目标年度并契合当时的季节流行趋势。

---

## 1. 硬性原则（不可违背）

1. **禁止虚构。** 所有趋势、工艺、历史、品牌、数据必须来自可核实的真实来源
   （权威时尚媒体 / Wikipedia / 品牌与博物馆资料）。不得编造产品参数、预售
   时间、面料配比、增长百分比等具体商业细节。
2. **配图必须与内容相符。** 不得凭图片 ID 猜测内容。每张配图都要**实际下载查看**
   确认主题匹配后才能使用（见 §6）。
3. **不得有重复内容。** 不同文章的选题角度、结构、例子必须区分开；同一主题写多篇时
   要明确各篇的差异定位（如「历史科普」vs「穿搭指南」）。
4. **配图不得跨文章重复。** 每篇文章一张唯一主图（中英镜像共用同一张属正常）。
5. **中英双语双文件。** 每篇中文文章都要有对应的英文镜像（见 §4）。
6. **遵守 Git 工作流。** 见 AGENTS.md：绝不直接提交/推送 `main`，一律走
   feature 分支 + PR。

---

## 2. 项目背景（技术栈与目录）

- 静态站点由自研 Python 构建器 `build.py` 生成，输出到 `_site/`。
- 文章为 Markdown + YAML front matter。
  - 中文文章：`_posts/YYYY-MM-DD-slug.md`
  - 英文镜像：`en/_posts/YYYY-MM-DD-slug.md`（front matter 需加 `lang: en`）
- 文件名日期决定 URL：`/YYYY/MM/DD/slug/`（英文加 `/en/` 前缀）。
- 首页只展示最新若干篇，`build.py` 中 `SITE["paginate"] = 6`。
- 测试为三层结构（L1 纯 JS / L2 构建产物 / L3 HTML 快照）。

---

## 3. 文章风格（对齐现有 3 篇基准）

参考 `_posts/2025-01-15-boho-chic-revival.md` 等现有文章：

- **定位**：时尚**趋势资讯 / 科普 / 穿搭指南**，不是自营产品的营销预售文。
- **结构**：`## 主标题` 开篇 → 若干 `###` 小节（趋势概述 / 关键单品 / 色彩 /
  穿搭建议 / 购买指南 / 护理等）→ 一句 `> 引言` 署名 `—— Guushu 设计团队 / 色彩团队` 等。
- **正文中部**插入一张 `![alt](image-url)`，与 front matter 的 `image` 同一张。
- **语气**：专业、克制、有观点；避免浮夸营销词。

### Front matter 字段（务必与现有一致）

中文：
```yaml
---
layout: post
title: "中文标题"
title_en: "English Title"
description: "中文描述"
description_en: "English description"
image: "https://..."          # 主图，与正文插图同一张
tags: [tag1, tag2, ...]
date: YYYY-MM-DD
author: "Guushu Team"
---
```

英文镜像（`en/_posts/`）：同名文件，`title`/`description` 用英文，
去掉 `_en` 字段，正文全英文，并**追加** `lang: en`。

> ⚠️ 不要使用旧 Jekyll 字段（如 `lookbook`）。`build.py` 不解析它们，
> post 模板也不渲染，会导致图片不显示。

---

## 4. 全年日期分布与季节匹配

文章日期要**分散覆盖目标年度**，且选题契合该月份的流行语境：

- **冬末 / 早春（1–2 月）**：岁末投资型衣橱、低饱和/静奢、色彩哲学等常青话题。
- **春夏（3–6 月）**：褶皱、廓形西装/通勤、钩针、轻盈流动的廓形。
- **盛夏（7–8 月）**：钩针/透气单品、度假、衣橱构建。
- **秋冬 / 派对季（9–12 月）**：亮片、金属光泽、节庆穿搭。

避免与已有文章选题/日期撞车。多篇同主题时按「历史 → 工艺 → 穿搭」等维度错开日期。

---

## 5. 资料核实（禁止虚构的落地做法）

- 优先用 **Wikipedia 英文词条**做事实底座（有引用、可追溯），例如：
  `Pleat` / `Quiet_luxury` / `Power_dressing` / `Sequin` / `Crochet`。
- 权威时尚媒体（Vogue、NYT、Smithsonian、Telegraph 等）可作补充。
- 只写能被来源支撑的内容；涉及具体数字/年份/品牌时，务必与来源一致。
- 莫兰迪色等「常识型」概念，确认其真实出处（源自画家 Giorgio Morandi 的静物调色板）。

---

## 6. 配图工作流（关键：必须看图验证）

Unsplash 随机图片 ID **无法从 ID 推断内容**，且 `source.unsplash.com` 关键词接口
已停用（返回 503）。因此必须**下载后实际查看**。

### 6.1 可用图源

1. **Unsplash 直链**（内容需下载验证）：
   `https://images.unsplash.com/photo-<ID>?w=800`
2. **Wikimedia Commons**（内容明确、URL 稳定，适合工艺/实物/历史图）：
   `https://commons.wikimedia.org/wiki/Special:FilePath/<File_Name>.jpg?width=800`
   - 注意：Commons 的 `upload.wikimedia.org/.../thumb/<hash>/...` 直链需要 MD5 哈希前缀，
     无法凭空构造；请改用上面的 `Special:FilePath` 接口（无需哈希）。

### 6.2 验证步骤（每张图都要做）

```bash
# 临时工作目录（已预授权）
cd /var/folders/ys/_2dk9x8504l1hmv_17g03bww0000gp/T/opencode
mkdir -p imgcheck && cd imgcheck

# 下载候选图（示例）
curl -s -o cand.jpg -w "%{http_code}\n" \
  "https://images.unsplash.com/photo-1551163943-3f6a855d1153?w=400"

# Commons 示例（需 UA 头）
curl -s -L -A "Mozilla/5.0" -o cand2.jpg -w "%{http_code}\n" \
  "https://commons.wikimedia.org/wiki/Special:FilePath/Conde_nast_fortuny.jpg?width=400"
```

然后用 **Read 工具查看图片**，确认主体内容与文章主题一致（人物着装 / 工艺细节 /
色调 / 单品类型都要对得上）。不匹配就换一张，直到命中。

### 6.3 去重检查

```bash
cd /Users/steve/WebstormProjects/Guushu
python3 - <<'PY'
import re, glob, collections
urls=collections.defaultdict(list)
for f in glob.glob("_posts/*.md")+glob.glob("en/_posts/*.md"):
    for m in re.finditer(r'image: "([^"]+)"', open(f,encoding="utf-8").read()):
        urls[m.group(1).split("?")[0]].append(f)
for u,fs in sorted(urls.items()):
    slugs={re.sub(r'^(en/)?_posts/','',x).replace('.md','') for x in fs}
    print(f"{u.split('/')[-1]:55} x{len(fs)}", "<-- 跨文章重复!" if len(slugs)>1 else "")
PY
```
每张主图应只出现 `x2`（中文 + 英文镜像）；出现跨文章重复必须替换。

---

## 7. 构建与测试（提交前必做）

命令均来自 AGENTS.md。本机 Python 命令为 `python3`。

```bash
# 构建站点
python3 build.py

# L1：纯 JS 单元测试（无需构建）
node test/run-all.js

# L2/L3：构建产物 + 快照测试（需先构建）
python3 build.py && node test/run-build.js
```

### 内容变更后更新快照基线

新增/修改文章会改变首页「最新文章」列表，导致 L3 首页快照失配——这是**预期**的
内容变更，需重新生成基线：

```bash
UPDATE_SNAPSHOTS=1 node -e "require('./test/test-runner').runTests(['./test/build/snapshot.test.js'])"
```

更新后再跑一遍 `node test/run-build.js` 确认全绿。

---

## 8. 相关 Skill

- **git**：本仓库强制走 feature 分支 + PR 的工作流；执行提交/推送/开 PR 前，
  按 AGENTS.md 的「Git workflow（MANDATORY）」与 git skill 操作。
  - 硬规则：不在 `main` 上 commit；不 `push origin main`；不 force-push。

---

## 9. 收尾检查清单（Definition of Done）

- [ ] 每篇文章中英双版齐全，front matter 字段与现有文章一致（英文版含 `lang: en`）。
- [ ] 内容全部有真实来源支撑，无虚构数据；多篇同主题无内容重复。
- [ ] 日期覆盖目标年度且契合季节流行趋势。
- [ ] 每张配图已**下载查看**确认与内容相符；无跨文章重复图。
- [ ] `python3 build.py` 成功；`run-all.js` 与 `run-build.js` 全绿。
- [ ] 若首页/列表变化，已用 `UPDATE_SNAPSHOTS=1` 更新快照并复测通过。
- [ ] 清理无用资产（如废弃的占位图、生成脚本、backup 草稿）。
- [ ] 走 feature 分支提交并开 PR 到 `main`，返回 PR 链接。
