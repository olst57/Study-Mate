# ADHD 友好化系列 PR — 执行计划

> 依据：本会话评审结论（以 lead 的实测评审为准）。执行方式：**本地改动 + 跑门禁，验证通过后由用户放行再 push**。全程遵守 [CONTRIBUTING.md](../CONTRIBUTING.md)（一 PR 一事、Conventional Commits 中文、改行为先开 issue、分支与 main 同步）。

## 0. 阻断项：PR #3 只有一半在 main 上

- 事实：origin/main=c0bbc55 只含 b14b611；origin/feat/teaching-persona=74420cc 上的 **93ac963 + 74420cc 从未合并**。ADR-0015、5.5 第 8 条、5.6 三层归属、§四.1/4.4/4.5 出口句、"你的学生"画像清理、12 技能禁词全量扫描、GLOSSARY、MEMORY.yaml L4、使用说明 L23、rule-owners、README、local-qa、agent.cordis.yml 全在这两个提交里。
- 动作：先验 `git merge-tree c0bbc55 74420cc` 是否干净；再开 PR → main，**必须先于 #5/#6/#7**（否则后续 PR 的上下文缺失，且 ADR-0016/17/18 的"见 ADR-0015"悬空）。

## 1. 四个补丁 + 蓝图修正（以 lead 评审为准）

- ① 12 技能禁标签词**全量扫描**：已写在 74420cc，随阻断项落地；核验其 `SKILL_TEXT.size===12`、不碰 FORBIDDEN 常量、带合成数据反证。
- ② 「这里可以停 / 带走三句话」的 §四.4 豁免句**留在 PR3(#6) 的 §三 子节**、PR3 不碰 §四.4 → 已实现，核验 Hunk 隔离（合并模拟里 lesson-design 应干净自动合并）。
- ③ #5 补「**科目清单配默认项**」：learning-system:25 现只有"超过 5 个只报最近 3 个"，缺默认项；补句 + test pin + 蓝图 §二.1/§四.4 措辞同步。
- ④ #7 补 pin 缺口：practice-evaluator L23/L26 两句新规则无 pin；"5 分钟"未进 pin 片段；ADR-0018 的"加载面"理由与 rule-owners 不符，需改准。
- 蓝图 3 处硬伤：§五 PR2 pin 数 8→**9**、行号 → **L62-75**；§五/§六 使用说明 **L54→L99-103**；§七 `git revert --no-commit <squash_sha>` → **`git revert -m 1 <merge_sha>`**（#1/#2/#3 全是 merge commit）。
- 蓝图 nit：§四.3 `:939`→约 L924；§七 fence 前多余空行删除；Docs 行恢复"分支名不是仓库路径"注记。

## 2. 工单（共享任务板）

T0 阻断·PR#3 尾巴落地 → T1 #4 蓝图 → T2 #5 → T3 #6 → T4 #7 → T5 全量门禁+合并模拟+revert 复验 → T6 push/开 PR（需授权）。

## 3. 团队分工（写作用域互斥）

- **tail + #4 蓝图**（分支 feat/teaching-persona→新、docs/adhd-blueprint）：只碰 docs/设计/ADHD适配方案.md 与尾巴自带文件。
- **#5 + #6**（feat/adhd-rhythm、feat/adhd-lessons）：learning-system、test_skill_rules。
- **#7**（feat/adhd-lab）：layered-practice、practice-evaluator、test_skill_rules、ADR-0018。
- 因四个分支共用同一工作目录、且 test_skill_rules.mjs 被多分支触碰，**分支级改动串行执行（一次一个分支，干完切回）**；并行只用于只读核验（探针/检查点）。

## 4. 门禁（每个分支尖必跑）

```powershell
node scripts/release/typecheck.mjs
node scripts/release/checks.mjs --static
node --test scripts/tests/test_skill_rules.mjs scripts/tests/test_skill_frontmatter.mjs scripts/tests/test_openai_skills.mjs scripts/tests/test_antigravity_skills.mjs scripts/tests/test_openai_skill_ui.mjs scripts/tests/test_skill_contracts.mjs scripts/tests/test_preset_install.mjs scripts/tests/test_skill_visibility.mjs scripts/tests/test_docs_references.mjs scripts/tests/test_core_memory.mjs
```
口径：static 只看 fail=0（总数 73–77 波动是历史）；test_preset_install 恒 26 过 1 跳；**不跑 test_reach_verify**（本机挂死）。

## 5. 边界

- 不 push、不开/改 PR，直到用户明确放行（T6）。
- 不碰 schemas/**、lib/**、lib/client.js、templates/lab/**、CHANGELOG.md、版本号。
- 不动用户的 main 工作区分支状态；改动都在 feature 分支上。
