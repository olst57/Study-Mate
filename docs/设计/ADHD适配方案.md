# StudyMate 注意力适配与讲课人格改造方案

> **入库与引用约定**：本文档作为独立 `docs` 提交入库，与四个功能 PR 解耦。文中所有 `ADR-xxxx` 编号一律写成纯文本、不做相对路径链接——功能 PR 回滚时会连带删除对应 ADR 文件，做成链接会导致回滚后触发 `test_docs_references.mjs` 断链报错。

## 一、设计背景与三层归属原则

本方案将「注意力稀缺读者」的五个典型痛点转化为系统的默认交互底座。**痛点成因只写在本设计文档与 ADR 中供维护者参考，技能提示词（`preset/skills/**`）只写具体动作指令，且全量 12 份 `SKILL.md` 严禁出现「多巴胺 / 工作记忆 / 挫败敏感 / 学生画像 / 性格画像 / 认知特征 / ADHD / 注意缺陷」等标签短语**（不禁既有合法术语「画像三节」），防止模型在对话中产生临床说教感。

| 核心痛点 | 典型表现 | 动作对策（只写进提示词的规则） | 归属模块 | 落地 PR |
| :--- | :--- | :--- | :--- | :--- |
| 启动困难 | 面对长盘点与多选题直接卡死 | 开场 ≤3 行、单动作加分钟数、全配默认项 | `learning-system` | PR 2 |
| 工作记忆窄 | 岔念头丢主线、新概念多就塌 | 停车场、单节点 ≤3 术语、每节自足可跳读 | `learning-system` 等 | PR 2、3 |
| 时间盲区 | 不知要读多久而不敢开始 | 20 分钟单元、开头 14 分钟三步路线、每节可停 | `curriculum-designer` 等 | PR 3 |
| 多巴胺依赖 | 缺乏高频即时正反馈就掉线 | 故事钩子、单产出打勾、首题秒答、5 分钟单步 | `lesson-design` 等 | PR 1、3、4 |
| 挫败敏感 | 答错、卡住、断更后因羞耻感弃坑 | 错题脱敏句式、两步阶梯救援、无罪感重连 | `layered-practice` 等 | PR 2、3 |

### 三层归属拍板原则

1. **人格层（固定，不可覆盖）**：归属 `lesson-design` §五（口气、emoji 密度、故事钩子、跑题必回主线、八条底线），学生与共享记忆均不可覆盖。
2. **讲法层（可覆盖，倾向性指引）**：归属 `lesson-design` §一 与共享记忆「教学偏好」（先讲什么、深浅、例子来源、节奏），允许学生随时调整；`MEMORY.yaml` 只记录学生明确说过的讲法选择，绝不推断学生的认知特征与性格。
3. **数据层（中性，不受人格约束）**：归属各自 owner（大纲节点标题与描述、题目字段、学习档案），保持客观中性。

### 两条跨模块细则归位

* **提取失败 ≠ 没掌握**：并入 `lesson-design` §五 5.5 第 8 条底线——学生说「学过但想不起来」时给线索或半个例子唤醒，不整块重讲，也不按已掌握跳过。
* **错题脱敏句式单一出处**：固定句式「这里有个坑：〈坑〉。不是你记性差」只在 `layered-practice` §三 出题要求（`why` 字段）定义一次，`learning-system` 只写指向说明。

## 二、可观测验收标准

1. **极简开场与无罪感重连**：新会话或断更回归开场 ≤3 行，禁止罗列未完成欠账；最后一行仅给一个动作加预计分钟数，选择题均配默认项。
2. **课件路标与呼吸感**：常规课件开头含「约 14 分钟 · 三步」路线（实验课说明页不出题，写单元学时 20），每节首行亮结论，连续散文 ≤3 行，每节末尾有「这里可以停」，课末有「带走三句话」。
3. **学时与题量闭环**：整单元 20 分钟内完成——常规课整篇课件 14 分钟内读完（约 3 节时单节 ≈5 分钟），配合 ≤6 分钟练习，且第一题看一眼即答得出；单节点新术语 ≤3 个。
4. **项目半成品起步**：lab 任务目录自带可运行但功能不全的起点，学生每次只改一处、5 分钟内看到运行与断言结果。
5. **人格与讲法解耦**：学生对主教练说「写正式一点」时，讲法随之改变（少类比、先定义），但活泼口气、钩子与 emoji 保持不变。
6. **门禁与回滚闭环**：`node scripts/release/checks.mjs --static` 与提示词测试套件全绿；四个功能 PR 任意单独 revert 无冲突且检查全绿。

## 三、PR 拆分与数字旋钮边界

| 批次 | 分支名称 | 核心交付 | 绑定 ADR |
| :--- | :--- | :--- | :--- |
| Docs | docs/adhd-blueprint（分支名，不写成行内代码——它不是仓库路径） | 独立提交本方案文档（纯文本引用 ADR 编号） | 无 |
| PR 1 | `feat/teaching-persona` | 人格落地无矛盾、12 技能禁标签短语扫描、三层归属、底线第 8 条 | ADR-0015 |
| PR 2 | `feat/adhd-rhythm` | 对话节奏：3 行开场、断更重连、默认项、阶梯救援、停车场 | ADR-0016 |
| PR 3 | `feat/adhd-lessons` | 材料节奏：20 分钟单元、§三课件骨架子节（14 分钟路线）、6 分钟题、首题秒答 | ADR-0017 |
| PR 4 | `feat/adhd-lab` | 项目节奏：lab 可运行起点、单步 5 分钟、与干净态断言失败的界限 | ADR-0018 |

### 数字旋钮与派生值门禁

* **两个主旋钮**：单元学时 `20` 只在 `curriculum-designer` 定义，题量上限 `6` 只在 `layered-practice` §三 定义，lab 单步 `5` 只在 `layered-practice` §六 定义。
* **一个受检派生值（常规课 14 / 实验课 20）**：因讲解角色只加载 `lesson-design`，故在 `lesson-design` §三 新增子节显式写入常规课派生值 `约 14 分钟 · 三步`（注明 `14 = 单元学时 20 减去题量上限 6；实验课的说明页不出题，页头直接写单元学时 `20`），并在 `test_skill_rules.mjs` 文件末尾（约 L1061）用独立测试自动解析三处数字断言 `20 - 6 === 14`。

## 四、5 处契约与断路点处理

1. **`templates/MEMORY.yaml` 第 4 行注释收口**：将「优先级高于任何通用指引」收口到「讲法偏好」，并明确「只记学生明确说过的讲法选择，不推断认知特征与性格」；旧工作区不回填，记入 ADR-0015。
2. **`scripts/tests/README.md` 第 92 行计数**：PR 1 将 `lesson-design` 加入 `reaches.learning-system` 后，「三份协议」同步改为「四份」。
3. **`learning-system` 切片锚点与步数保护**：`## 新科目盘问（你亲自执行）` 与 `## 对话节奏` 是 `test_skill_rules.mjs:939` 切片锚点，且盘问固定为 `1.`～`7.` 七步，PR 2 严禁改标题或加第 8 步。
4. **选项约定分阶段隔离**：`learning-discovery` 探索阶段保持「不标推荐、不排序暗示」一字不改；PR 2 的默认项仅限 `learning-system` 的盘问（第 2、4 步）与学习路径选择。
5. **`GLOSSARY.md` 补齐词条**：PR 1 新增「讲课人格」与「讲法」两条定义及 `_Avoid_` 说明。

## 五、文件与 Hunk 归属表

| 文件路径 | 改动位置与摘要 | 归属 PR |
| :--- | :--- | :--- |
| `preset/skills/lesson-design/SKILL.md` | §四.1/4.4/4.5、§五 L82 去归因改动作句（保 `让他愿意读下一段`）、5.2、5.5 第 8 条、新增 5.6 | PR 1 |
| `preset/skills/lesson-design/SKILL.md` | §三 保持原表不动，下增子节 `### 课件骨架：路线、可停点、收口`（含 14/20 派生路线、结论先行、散文 ≤3 行、术语大白话、每节可停、带走三句、对 §四.4 的功能路标豁免句） | PR 3 |
| `preset/skills/learning-system/SKILL.md` | 开场 ≤3 行 + 无罪感重连、`## 对话节奏` 后补单动作与时长、盘问 2/4 步默认项、两步阶梯、停车场（用「学生中途岔开话题」）、收尾 ≤3 项 | PR 2 |
| `preset/skills/curriculum-designer/SKILL.md` | L21（20 分钟单元、单节点单产出、≤3 新术语、名词短语可检索命名） | PR 3 |
| `preset/skills/layered-practice/SKILL.md` | L48（≤6 分钟）+ §三（首题秒答、错题脱敏句式唯一出处） | PR 3 |
| `preset/skills/layered-practice/SKILL.md` | §六（起点能跑、一次只改一处、5 分钟见结果、与干净态断言失败的界限） | PR 4 |
| `preset/skills/practice-evaluator/SKILL.md` | L23/L26（从骨架起 → 起点必须能跑、一次只改一处） | PR 4 |
| `preset/skills/learning-coach/SKILL.md` | 第 3 步例外（换讲课口径属明确新交付大改） | PR 1 |
| `preset/skills/learning-coach/SKILL.md` | 课件要求段（开头路线口径见 `lesson-design` §三、每节独立可读允许跳读） | PR 3 |
| `preset/skills/local-qa/SKILL.md` | 第 1 条（字数上限以本条「短」为准，人设只管口气） | PR 1 |
| `preset/qa/agent.cordis.yml` | 人设行改为自包含三条，删外部指向 | PR 1 |
| `bin/antigravity-skill-compat.mjs` | L155（20 分钟）、L163（名词短语可检索）+ 讲解提示（开头路线、每节可停、带走三句话） | PR 3 |
| `templates/MEMORY.yaml` | L4 注释（收口到讲法 + 只记明确选择、不推断认知特征与性格） | PR 1 |
| `GLOSSARY.md` | 新增「讲课人格」「讲法」两条 | PR 1 |
| `scripts/tests/rule-owners.json` | `reaches.learning-system` 补 `lesson-design` | PR 1 |
| `scripts/tests/README.md` | L92「三份」改「四份」 | PR 1 |
| `scripts/tests/test_skill_rules.mjs` | L757 负例换 `layered-practice`；补 PR 1 新规则 pin；在 `FORBIDDEN` 循环 test 之后（约 L890）新增全量 12 技能禁标签短语 test（不碰 `FORBIDDEN` 常量） | PR 1 |
| `scripts/tests/test_skill_rules.mjs` | L65-78 附近补 PR 2 的 9 条 pin | PR 2 |
| `scripts/tests/test_skill_rules.mjs` | L354、L534、L586、L735 题量与骨架 pin 更新；`FORBIDDEN` 末尾（约 L882）追加 `40分钟...` 与 `≤10 分钟`；文件最末尾（约 L1061）新增 `20 - 6 === 14` 算术守恒测试 | PR 3 |
| `scripts/tests/test_skill_rules.mjs` | `RULES['layered-practice']` 数组末尾（约 L398）追加 3 条 lab pin | PR 4 |
| `docs/使用/使用说明.md` | L23（讲法可调、人格固定） | PR 1 |
| `docs/使用/使用说明.md` | L14-L15（3 行开场与单动作下一步） | PR 2 |
| `docs/使用/使用说明.md`、`README.md` | L97 新小节「一次读多久」（20 分钟含 ≤6 分钟题、停靠点说明）；`README.md` 加「为注意力稀缺的读者设计」 | PR 3 |
| `docs/使用/使用说明.md` | §三 L93 `lab（引导式实操）` 末尾补一句 lab 起点能跑与 5 分钟步幅 | PR 4 |
| `docs/设计/设计方案.md`、`工程约束.md` | 设计方案 §3.3/§3.5、工程约束 L85 | PR 1 |
| ADR-0015 ～ ADR-0018 | 4 个 PR 各自新增对应的单一 ADR 文件 | PR 1–4 |

## 六、分 PR 交付清单

### PR 1：`feat/teaching-persona`（人格落地无矛盾）

1. **`lesson-design` 修订**：
   * §四.1 补出口句：「『你以为……其实正好相反』只在误解真实存在时用——那正是本条的『保留』情形」。
   * §四.4 扩注：「支线故事与一句自嘲不属于本条要删的铺垫，但它们必须帮理解或帮回主线」。
   * §四.5 补：「非重点节点一个轻钩子带过，不必每个概念都配故事」。
   * §五 L82「你的学生」段：删掉「坐不住、读三行就想划走」等归因描述，改写为纯动作指令，保留 pin 片段「让他愿意读下一段」。
   * §五 5.2 补：「点名人的轶事先用半句交代他是谁（对齐 §四.7），或换不需要背景的类比与程序员的梗」。
   * §五 5.5 新增第 8 条：「提取失败不等于没掌握：学生说『学过但想不起来』时给线索或半个例子，不整块重讲，也不按已掌握跳过」。
   * §五 新增 5.6「可覆盖与不可覆盖」：落地人格固定、讲法可覆盖、数据中性三层原则。
2. **周边技能与预设**：`learning-coach` 第 3 步例外补「换讲课口径属于这类大改」；`local-qa` 第 1 条明确「字数上限以本条『短』为准；人设只管口气」；`preset/qa/agent.cordis.yml` 人设行改为自包含三条。
3. **测试、模板与文档**：更新 `rule-owners.json`、`test_skill_rules.mjs`（负例换 `layered-practice`、加新规则 pin、在约 L890 新增 12 份 `SKILL.md` 禁标签短语 `多巴胺 / 工作记忆 / 挫败敏感 / 学生画像 / 性格画像 / 认知特征 / ADHD / 注意缺陷` 扫描 test）、`scripts/tests/README.md` L92、`templates/MEMORY.yaml` L4、`GLOSSARY.md`、`使用说明.md` L23、`设计方案.md` §3.3/§3.5、`工程约束.md` L85，新增 ADR-0015。

### PR 2：`feat/adhd-rhythm`（对话节奏）

1. **`learning-system` 修订**：
   * §会话开场 5：压至 ≤3 行（恢复句 + 键值状态 + 单一动作下一步）；断更回归时禁止罗列未完成欠账，只给「一句话前情 + 一个 2 分钟能做完的微动作」，欠账仅在学生主动问时给。
   * `## 对话节奏` 后追加：一次只给一个动作（不给并列选项）、动作带预计时长。
   * 盘问第 2、4 步与科目清单：配默认项「不想选就选这个」；科目超过 5 个只报最近 3 个 +「其他报名字」（`learning-discovery` 不改）。
   * §学习循环 7（卡住）：改为两次阶梯——第一次换媒介（图、类比、动手试、指速查页），第二次再降练习档位。
   * 新增「停车场」：学生中途岔开话题时先简答，再用一行「停车：〈话题〉」记在会话里并于本次会话收尾前回访一次，不落盘。
   * §会话结束：收尾给不超过 3 项的「下次从这继续」。
2. **测试与文档**：更新 `使用说明.md` L14-L15，新增 ADR-0016，`test_skill_rules.mjs` 新增 9 条 pin。

### PR 3：`feat/adhd-lessons`（材料节奏）

1. **大纲、课件与题目修订**：
   * `curriculum-designer` L21：40 → 20 分钟单元、单节点单产出（`objective`）、单节点 ≤3 新术语、标题改为「名词短语、可检索」。
   * `lesson-design` §三：原三列表格保持不动，表下新增子节 `### 课件骨架：路线、可停点、收口`，用列表写入：① 开头固定「怎么读这一课」（常规课写 `约 14 分钟 · 三步：①… ②… ③…`，14 = 单元学时 20 减去题量上限 6；实验课的说明页不出题，页头直接写单元学时 20）；② 每节首行亮结论；③ 连续散文 ≤3 行（推导/代码/列表/表格不算）；④ 新术语首次给一句大白话；⑤ 每节末尾给「这里可以停」；⑥ 课末用普通 `##` 小节写「带走三句话」；⑦ 豁免说明：「这里可以停」「带走三句话」是功能性路标，不属于 §四.4 要删的收尾废话。
   * `layered-practice` L48 与 §三：题量 ≤10 → ≤6 分钟；第一题必是看一眼就答得出的客观题（考理解不考回忆）；错题固定句式「这里有个坑：〈坑〉。不是你记性差」（唯一出处）。
   * `learning-coach` 与 `bin/antigravity-skill-compat.mjs`：`learning-coach` 写明「开头路线口径见 `lesson-design` §三、每节独立可读允许跳读」；`antigravity` 同步 20 分钟、直白命名与讲解提示。
2. **测试与文档**：`使用说明.md` L97 新增「一次读多久」小节（写明「每单元约 20 分钟（读完加做完题，其中做题不超过 6 分钟）；每小节末尾都有停靠点，读完一节就能停，不必等整篇读完」）；`README.md` 补一句定位；新增 ADR-0017；`test_skill_rules.mjs` 更新 pin、在 `FORBIDDEN` 末尾（约 L882）追加两键，并在文件末尾（约 L1061）新增 `20 - 6 === 14` 算术守恒测试。

### PR 4：`feat/adhd-lab`（lab 起点与步幅）

1. **实验课规则与评审器修订**：
   * `layered-practice` §六 补三条：① 起点必须能跑（给能启动、功能不全的起点，非空文件或编译报错骨架）；② 一次只改一处，单步 5 分钟内看到结果；③ 划清与「干净态跑不过」的界限（干净态跑不过是断言失败以证明留白有效，不是程序跑不起来）。
   * `practice-evaluator` L23/L26：同步要求骨架内的起点必须可运行、单步只改一处。
2. **测试与文档**：`使用说明.md` §三 末尾补一句；新增 ADR-0018；`test_skill_rules.mjs` 在 `RULES['layered-practice']` 末尾（约 L398）追加 3 条 pin。

## 七、验证、风险与本机生效

### 验证门禁（PowerShell）

```powershell
node scripts/release/typecheck.mjs
node scripts/release/checks.mjs --static
node --test `
  scripts/tests/test_skill_rules.mjs `
  scripts/tests/test_skill_frontmatter.mjs `
  scripts/tests/test_openai_skills.mjs `
  scripts/tests/test_antigravity_skills.mjs `
  scripts/tests/test_openai_skill_ui.mjs `
  scripts/tests/test_skill_contracts.mjs `
  scripts/tests/test_preset_install.mjs `
  scripts/tests/test_skill_visibility.mjs `
  scripts/tests/test_docs_references.mjs `
  scripts/tests/test_core_memory.mjs
```

每个功能 PR 合入后执行独立回滚检查：`git revert --no-commit <squash_sha>` 后跑 `node scripts/release/checks.mjs --static`，确认无冲突且全绿。

### 风险应对与不做边界

* **风险应对**：20 分钟切分若嫌碎只改主旋钮并重对齐派生值；6 分钟题量仅做检索唤醒，能力由 `objective` 兜底；「起点能跑 vs 断言失败」通过并列对照规则与 pin 锁死；历史欠账保留在进度文件中，学生主动询问即展示。
* **本机生效**：将改动的 `preset/`、`templates/`、`GLOSSARY.md` 按字节同步至 `~/.dsh/profiles/desktop/node_modules/@yunmiao/studymate/`，重启 DSH 并新开会话；旧课件按课触发重写。
* **明确不做**：不动 `schemas/**`、`lib/**`、`lib/client.js`、`templates/lab/`；不增删角色与技能调用面；不改 `CHANGELOG.md` 与版本号。
