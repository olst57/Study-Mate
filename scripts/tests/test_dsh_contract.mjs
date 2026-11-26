/* ─────────────────────────────────────────────────────────────────────────
   StudyMate · 宿主契约守门（按需套件，`npm run test:dsh-contract`）

   为什么单独有这一份：仓库里那条**默认门禁**里的 schema 检查
   （`scripts/tests/test_tools_schema_subset.mjs`）把宿主的规则**手抄**成了一张关键字清单。
   手抄就会漂——2026-10-07 真出过一次：`studymate_lesson_read` 的输出契约写成
   `found: { const: true }`（有 `const` 没 `type`），宿主 `assertSupportedJsonSchema`
   当场拒收，那条预设行整行挂不上，答疑会话**建都建不起来**；而当时那道手抄的检查
   **绿着通过**——它抄漏了「放置规则」（`const` 必须配 `type` 或 `oneOf`）。

   这里的做法换一层：**不抄规则，直接拿宿主自己的校验器**扫我们注册点上每一个工具。
   它要一份真宿主安装（`STUDYMATE_DSH_PACKAGE`，与 `test:dsh` 同一个环境变量），所以
   不进默认门禁、也不进 CI（CI 没有宿主包）。没设这个变量时整份跳过。

   五件事，缺一不可：

     1. **扫**：`registerStudyMate` 的十五个原生工具 + 答疑预设那条插件行注册的只读工具，
        逐个把 `parameters` 与 `output.schema` 交给宿主的 `assertSupportedJsonSchema`；
     2. **反证**：同一个校验器对一份已知不合规的 schema 必须**报错**——否则这条套件自己
        就是个空转（第 1 条绿了也说明不了任何事）；
     3. **对照参考实现**：程序化建会话的字段清单（`agents.create` 的 `sessionId / meta /
        agentOptions / setup`）住在宿主的 `createWebhookSession` 里。这里读那份源码，断言
        它**仍然**这么写——宿主改了契约，这里先红，然后再去改我们的调用。同一份字段清单在
        `test_host_ask_session.mjs`（默认门禁）里按「我们递出去的键」钉了一遍。
     4. **预设行的模块解析**：宿主删掉一个子路径导出（0.2.2 的
        `dsh-tool-subagent-control/list-agents`，见 #244），硬挂着的行会让**整条预设**
        被判 broken。这里用宿主安装根上的 `createRequire().resolve` 逐行解析；解析不到的
        必须带停用条件、并且按宿主的方式求值为 true。
     5. **阅读端的槽位形状**：`lib/client.js` 往 `main` / `sidebar.panellist` / `sidebar.right.pane.tab` / `plugins.detail.section` / `plugins.row.config` 注册的那几项，
        必填注册项（`main` 的 `key`、`sidebar.panellist` 的 `id`）由宿主的槽位契约目录定
        （`dsh-cordis-client-runner/lib/client.js`）。这里读那份目录，按 `kind` 与
        `registerOptions` 里的 `required` 逐项对；同时解析 `dsh.client.inject` 的七个包。
   ───────────────────────────────────────────────────────────────────────── */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

import { parseYaml } from '../../lib/yaml.ts';
import { loadClient } from './fixtures/client_harness.mjs';
import { fakeContext, loadTools } from './fixtures/tools.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));

/** 与 `test:dsh`（`test_dsh_runtime.mjs`）同一个环境变量：已安装的 DSH 包目录（只读）。 */
const runtime = process.env.STUDYMATE_DSH_PACKAGE;

/** 参考实现里那次 `agents.create` 的字段（`createWebhookSession`）。我们的调用必须逐项带上。 */
export const REFERENCE_CREATE_KEYS = ['sessionId', 'meta', 'agentOptions', 'setup'];

/**
 * 在已安装的宿主包里找一个模块。
 *
 * npm 与 pnpm 两种铺法都试：`<pkg>/node_modules/@deepseek-ai/<x>` 与
 * `<pkg>/../<x>`（后者是 `STUDYMATE_DSH_PACKAGE` 直接指到 `@deepseek-ai` 那一层时）。
 * 找不到返回 null——调用方据此**跳过并说明**，不把它当成失败（旧宿主可能没有这个模块）。
 */
function hostModule(pkg, relative) {
  for (const candidate of [
    path.join(pkg, 'node_modules', '@deepseek-ai', relative),
    path.join(pkg, '..', relative),
  ]) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

/** 没给真宿主就**明确跳过**——不许空跑成 pass。

    `t.skip` 之前这里写的是裸 `return;`：`node:test` 把「回调正常跑完」记成通过，于是没设
    `STUDYMATE_DSH_PACKAGE` 时四条里有一条显示跳过、另外三条显示通过，而那三条一条断言都没做。
    「这一条到底验过没有」因此不可知——`test_dsh_plugin_cli.mjs` 就是同一类问题在载入阶段
    静默死了几周的。判据与措辞一处定义，别处只给指针。 */
function requireRuntime(t) {
  if (runtime === undefined || runtime === '') {
    t.skip('未设置 STUDYMATE_DSH_PACKAGE：跳过真宿主契约检查（见 scripts/tests/README.md）');
    return false;
  }
  return true;
}

test('宿主契约：没给 STUDYMATE_DSH_PACKAGE 就跳过（与 test:dsh 同一口径）', t => {
  if (!requireRuntime(t)) return;
  assert.ok(fs.existsSync(runtime), `STUDYMATE_DSH_PACKAGE 指向的目录不存在：${runtime}`);
});

/** 注册点上全部工具的定义：十五个原生工具 + 答疑预设那条行注册的只读工具。 */
async function allDefinitions() {
  const { registerStudyMate } = await loadTools();
  const learning = fakeContext();
  registerStudyMate(learning.ctx);

  const preset = await import('../../lib/tools/qa-preset.ts');
  const qa = fakeContext();
  // 预设作用域里那条 restriction 在这份套件里没有受众：`deny` 的名单校验会走真宿主逻辑，
  // 这里只要它别挡住工具注册。
  qa.ctx.tools.restrict = () => () => {};
  preset.apply(qa.ctx);

  return [
    ...[...learning.definitions.values()].map(definition => ({ where: '学习面', definition })),
    ...[...qa.definitions.values()].map(definition => ({ where: '答疑面', definition })),
  ];
}

test('宿主契约：注册点上每个工具的 schema 都过宿主自己的校验器', async t => {
  if (!requireRuntime(t)) return;

  const modulePath = hostModule(runtime, path.join('dsh-tools', 'lib', 'types', 'json-schema.js'));
  if (modulePath === null) {
    t.skip(`这份宿主安装里找不到 dsh-tools 的 json-schema 模块（${runtime}）：跳过`);
    return;
  }
  const { assertSupportedJsonSchema } = await import(pathToFileURL(modulePath).href);
  assert.equal(typeof assertSupportedJsonSchema, 'function', '宿主校验器没导出 assertSupportedJsonSchema，套件要跟着改');

  const definitions = await allDefinitions();
  assert.ok(definitions.length >= 15, `注册点上应该至少有 15 个工具，实际 ${definitions.length} 个`);

  const problems = [];
  for (const { where, definition } of definitions) {
    for (const [what, schema] of [
      ['parameters', definition.parameters],
      ['output.schema', definition.output?.schema],
    ]) {
      if (schema === undefined) continue;
      try {
        assertSupportedJsonSchema(schema);
      } catch (error) {
        problems.push(`${where} · ${definition.name} · ${what}\n    ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
  assert.deepEqual(problems, [], `宿主不认这些 schema：\n${problems.join('\n')}`);
});

test('宿主契约：反证——宿主校验器对已知不合规的 schema 必须报错', async t => {
  if (!requireRuntime(t)) return;

  const modulePath = hostModule(runtime, path.join('dsh-tools', 'lib', 'types', 'json-schema.js'));
  if (modulePath === null) {
    t.skip('这份宿主安装里找不到 dsh-tools 的 json-schema 模块：跳过');
    return;
  }
  const { assertSupportedJsonSchema } = await import(pathToFileURL(modulePath).href);

  // 就是 2026-10-07 那次事故的原形状：有 `const` 没 `type`。
  const knownBad = {
    type: 'object',
    additionalProperties: false,
    required: ['found'],
    properties: { found: { const: true } },
  };
  assert.throws(() => assertSupportedJsonSchema(knownBad),
    /requires type or oneOf/, '这条校验器认了这个 schema：那第 2 条扫出来的绿不算数');

  // 同一个校验器对合规形状必须放行（否则它只会拒绝一切，反证也说明不了什么）
  assertSupportedJsonSchema({
    type: 'object',
    additionalProperties: false,
    required: ['found'],
    properties: { found: { type: 'boolean', const: true } },
  });
});

test('宿主契约：参考实现的 createWebhookSession 仍然带着那四个字段', async t => {
  if (!requireRuntime(t)) return;

  const modulePath = hostModule(runtime, path.join('dsh-webhook', 'lib', 'types', 'session.js'));
  if (modulePath === null) {
    t.skip(`这份宿主安装里找不到 dsh-webhook 的 session.js（${runtime}）：跳过`);
    return;
  }
  const source = fs.readFileSync(modulePath, 'utf8');

  // 只认「那次调用块里出现过这几个键」。宿主改了契约（改名、删字段），这里先红，
  // 然后再去改 lib/ask/session.ts 的调用并重跑 test_host_ask_session.mjs。
  const missing = REFERENCE_CREATE_KEYS.filter(key => !source.includes(key));
  assert.deepEqual(missing, [],
    `宿主参考调用里不再出现这些字段：${missing.join('、')}——`
    + '先读那份源码确认新契约，再改 lib/ask/session.ts 与 test_host_ask_session.mjs');
  assert.ok(source.includes('meta') && source.includes('agentPreset'),
    '参考调用里 meta.agentPreset 不见了：按预设建会话的契约可能已经换了写法');
});

/* ── 四条：预设里每一行的模块都得解析得到 ────────────────────────────────────

   2026-11-06（#244）：DSH 0.2.2-rc.1 把 `list_agents` 并进主包，删掉了
   `@deepseek-ai/dsh-tool-subagent-control/list-agents` 这个子路径导出；预设里那一行
   还硬挂着，加载器解析不到，宿主就把「有一行起不来」判成**整条预设 broken**——
   「学习模式」在预设列表里显示加载失败，老会话也跟着恢复不了。

   判据就是加载器那一套：宿主安装根上 `createRequire(...).resolve(名字)`。
   解析不到的行走两步：必须带 `disabled` 表达式（没有＝整条预设会被判 broken），
   并且用宿主自己的求值方式（`with (ctx) { return eval(expr) }`，`baseUrl` 指宿主安装根）
   求一遍必须是 true。这样既抓「宿主删了东西」，也抓「条件写反了、永远不停用」。

   自己的两条子路径（`@yunmiao/studymate/*`）跳过：它们由安装器写进 profile，宿主安装根上
   本来就没有，不是宿主契约的一部分。 */
const PRESET_SOURCES = [
  ['学习模式', path.join('preset', 'learning', 'agent.cordis.yml')],
  ['答疑模式', path.join('preset', 'qa', 'agent.cordis.yml')],
];

/** 预设是「行 + 分组」的两层结构；分组行（`cordis:group`）只展开孩子，自己不挂模块。 */
function presetRows(rows, found = []) {
  for (const row of Array.isArray(rows) ? rows : []) {
    if (row === null || typeof row !== 'object') continue;
    if (row.group === true) presetRows(row.config, found);
    else if (typeof row.name === 'string') found.push(row);
  }
  return found;
}

test('宿主契约：预设里每一行的模块都解析得到，解析不到的必须自带停用条件', async t => {
  if (!requireRuntime(t)) return;

  const anchor = path.join(runtime, 'package.json');
  const hostRequire = createRequire(anchor);
  const resolvable = (name) => {
    try { hostRequire.resolve(name); return true; } catch { return false; }
  };
  // 与 cordis 的 `!!js` 求值同一条路：`with (ctx) { return eval(expr) }`。
  const evaluate = (expression) => {
    const run = new Function('ctx', `with (ctx) { return eval(${JSON.stringify(expression)}); }`);
    return run({ baseUrl: anchor });
  };

  const problems = [];
  for (const [label, relative] of PRESET_SOURCES) {
    const file = path.join(ROOT, relative);
    const rows = presetRows(parseYaml(fs.readFileSync(file, 'utf8'), {
      file, tags: 'expression', blockScalars: true, plainScalarContinuation: true,
      quotedScalarContinuation: true,
    }));
    assert.ok(rows.length > 0, `${label}的预设一行都没读出来：${relative}`);
    for (const row of rows) {
      if (row.name.startsWith('cordis:') || row.name.startsWith('@yunmiao/studymate')) continue;
      if (resolvable(row.name)) continue;
      const expression = row.disabled !== null && typeof row.disabled === 'object' && '__jsExpr' in row.disabled
        ? row.disabled.__jsExpr
        : undefined;
      if (expression === undefined) {
        problems.push(`${label} ${row.id}: ${row.name} 在这个宿主上解析不到，又没带停用条件——`
          + '整条预设会被判 broken（见 #244）');
        continue;
      }
      let disabled;
      try { disabled = evaluate(expression); } catch (error) {
        problems.push(`${label} ${row.id}: 停用条件求值失败——${error.message}`);
        continue;
      }
      if (disabled !== true) {
        problems.push(`${label} ${row.id}: ${row.name} 解析不到，停用条件却给了 ${String(disabled)}——`
          + '条件写反了或者判据不对');
      }
    }
  }
  assert.deepEqual(problems, []);
});
/* ── 五条：阅读端的槽位形状由宿主自己的契约目录定 ──────────────────────────────

   阅读端（lib/client.js）往宿主注册两处：main（keyed/root，key 是侧栏那一行的 id）与
   sidebar.panellist（list/root，侧栏图标那一格）。这两处的必填项不是我们说了算：宿主把
   **每个槽位的契约**打包成一份目录，住在 dsh-cordis-client-runner/lib/client.js 里
   （全宿主唯一出现 registerOptions 的文件）。条目形状：

     {key:`main`, kind:`keyed`, scope:`root`,
      registerOptions:[{name:`key`, requirement:`required`, type:`string`, …}]}

   宿主升级后若改了槽位名、改了 kind（比如 main 从 keyed 变成 single），或者给某个槽位加了
   必填项，这里先红——红的意思是「先读宿主那份目录，再改我们在 client.js 里的注册」，
   不是「去改这份检查」。 */
function hostSlotContract(catalog, slot) {
  const at = catalog.indexOf(`key:\`${slot}\``);
  if (at < 0) return null;
  // 一条条目里的注册项到 ownerProps 为止（后头是宿主给组件的 props 说明，不是一个东西）。
  const body = catalog.slice(at, at + 3000);
  const cut = body.indexOf('ownerProps:');
  const head = cut < 0 ? body : body.slice(0, cut);
  const kind = /kind:\s*`([^`]+)`/.exec(head)?.[1] ?? null;
  const required = [...head.matchAll(/name:\s*`([^`]+)`,\s*requirement:\s*`([^`]+)`/g)]
    .filter(([, , requirement]) => requirement === 'required')
    .map(([, name]) => name);
  return { kind, required };
}

test('宿主契约：阅读端注册的槽位仍由宿主声明，必填注册项一个不少', async t => {
  if (!requireRuntime(t)) return;

  const modulePath = hostModule(runtime, path.join('dsh-cordis-client-runner', 'lib', 'client.js'));
  if (modulePath === null) {
    t.skip(`这份宿主安装里找不到 dsh-cordis-client-runner（${runtime}）：跳过阅读端槽位检查`);
    return;
  }
  const catalog = fs.readFileSync(modulePath, 'utf8');

  // dsh.client.inject 那七个包：宿主升级时删/并掉一个，客户端就只剩半套服务。
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const injected = manifest.dsh?.client?.inject ?? [];
  assert.ok(injected.length >= 7, `package.json 的 dsh.client.inject 应该至少七项，实际 ${injected.length} 项`);
  const hostRequire = createRequire(path.join(runtime, 'package.json'));
  const unresolved = injected.filter(name => {
    try { hostRequire.resolve(name); return false; } catch { return true; }
  });
  assert.deepEqual(unresolved, [],
    `dsh.client.inject 里这些包在这个宿主上解析不到：${unresolved.join('、')}——`
    + '宿主可能合并/改名了客户端模块，先读新版宿主再改 package.json');

  // 走一遍 apply，接住 slots.register 的每一次调用。宿主服务（locale / sidebarRightTabs / slots）
  // 用最小桩给齐：右栏 body、插件页的状态卡与配置卡都只在服务就绪时才注册，桩缺一件它们就静默跳过。
  const registrations = [];
  const { plugin } = loadClient();
  const fakeLocale = { register: () => () => {}, bind: () => (k) => k };
  const fakeTabs = { register: () => () => {} };
  const slots = {
    inject: (name, factory) => { factory(); return () => {}; },
    register: (config, component) => { registrations.push({ config, component }); return () => {}; },
  };
  const services = { locale: fakeLocale, sidebarRightTabs: fakeTabs, slots };
  const ctx = {
    get: (name) => (name in services ? services[name] : null),
    inject: (deps, callback) => { callback(ctx); },
    effect: (register) => { const dispose = register(); return typeof dispose === 'function' ? dispose : () => {}; },
    slots,
  };
  plugin.apply(ctx);

  // 槽位名以 lib/client.js 实际注册的为准：main、sidebar.panellist、右栏 body
  // （RIGHTBAR_BODY_SLOT = 'sidebar.right.pane.tab'）、插件页两处。
  // 按 name 去重：侧栏入口在 locale 就绪时会先 dispose 再按本地化文案重注册（桩里同步触发），
  // 同一次 apply 能看到两条 sidebar.panellist；真实宿主里任一时刻只挂一条。
  const names = [...new Set(registrations.map(({ config }) => config.name))].sort();
  assert.deepEqual(names, [
    'main', 'plugins.detail.section', 'plugins.row.config', 'sidebar.panellist', 'sidebar.right.pane.tab',
  ], `阅读端的槽位注册不全（宿主忽略了别的槽位），实际：${names.join('、')}`);

  // 反证：随便编一个槽位名，目录里必须找不到——否则下面的对照就是空转。
  assert.equal(hostSlotContract(catalog, 'studymate.no-such-slot'), null,
    '宿主目录里居然有 studymate.no-such-slot：说明这条查的不是契约目录，先修这条检查');

  const problems = [];
  for (const { config } of registrations) {
    const contract = hostSlotContract(catalog, config.name);
    if (contract === null) {
      problems.push(`${config.name}: 宿主槽位契约目录里没有这一项（宿主可能改名了）`);
      continue;
    }
    const missing = contract.required.filter(option => !(option in config));
    if (missing.length > 0) {
      problems.push(`${config.name}（宿主声明 kind=${contract.kind}）缺必填注册项：${missing.join('、')}`);
    }
  }
  assert.deepEqual(problems, [], `阅读端的槽位注册与宿主契约对不上：\n${problems.join('\n')}`);
});
