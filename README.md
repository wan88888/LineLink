# LineLink

一笔画（One-Stroke / Eulerian Path）益智小游戏。玩家需要从任意节点出发，一笔连续地经过图中每一条边恰好一次，即可过关。

- 纯前端：Vite + TypeScript + Phaser 3
- 48 关：16 个经过一笔画可解性验证的形状 × 3 个镜像变体
- 触控优先：拖拽作画，手机端布局自适应
- 无外部资源音效：WebAudio 合成步进 / 通关提示音
- 三星评级：按尝试次数给出 1–3 星，支持 v1 → v2 的本地进度迁移

## 快速开始

```bash
npm install
npm run dev          # 启动开发服务器 http://localhost:5725
npm run build        # 生产构建到 dist/
npm run preview      # 预览生产包
npm run typecheck    # tsc --noEmit
npm test             # vitest
npm run lint         # eslint
```

Node ≥ 20 推荐。

## 玩法

1. 在主页点击「开始」，系统自动定位到你的下一个未通关关卡。
2. 进入关卡后，从任意节点按住手指拖拽到相邻节点，即可连线。
3. 继续沿着已经画出的路径末端拖拽，直到所有边都被覆盖。
4. 重复经过的节点允许，重复经过的**边不允许**。
5. 所有边覆盖完成即通关。尝试次数越少，星级越高：
   - 1 次通关 → 3 星
   - ≤ 3 次通关 → 2 星
   - 其他 → 1 星

控制栏：
- `↶` 撤销最近一条边
- `↺` 重置当前关
- 左上箭头：返回关卡列表
- 右下箭头：下一关（优先跳到下一个未通关）

## 目录结构

```
index.html
vite.config.ts          # 将 phaser 拆成独立 chunk，首屏只加载 ~18kB
tsconfig.json
.eslintrc.json
.github/workflows/ci.yml
src/
  main.ts               # 入口：DOM 外壳 + 动态加载 Phaser
  style.css
  game/
    input/actions.ts    # 输入动作定义
    simulation/
      types.ts          # LevelDefinition / SessionSnapshot / ProgressState 等
      shapes.ts         # 16 个 Euler 可解形状模板
      levels.ts         # 形状 × 镜像 → 48 关，含 hasEulerPath 校验
      session.ts        # OneStrokeSession：边级游戏状态机
      progress.ts       # localStorage 持久化 + v1→v2 迁移 + 星级
      expression.ts     # 预留接口
  phaser/
    adapters/sceneBridge.ts
    scenes/
      BootScene.ts
      PuzzleScene.ts    # 渲染节点、边、路径，处理拖拽交互
  ui/
    mobileShell.ts      # 主页 / 关卡页 / 控制栏 DOM 外壳
    sfx.ts              # WebAudio 合成音效（无外部资源）
tests/
  levels.test.ts        # 关卡目录与 Euler 判定
  session.test.ts       # 一笔画边遍历、撤销、尝试次数、edgeKey
```

## 核心概念

### Eulerian Path（欧拉路径）

对于无向连通图 $G$，存在经过每条边恰好一次的路径当且仅当：

- 图是连通的（仅考虑非孤立节点），且
- 奇度数节点个数为 0（欧拉回路）或 2（欧拉路径，必须从一个奇点出发）

`hasEulerPath()` 使用度数奇偶统计 + BFS 连通性检查在关卡生成时断言所有 shape 都是可解的。若某个 shape 失败，`createLevelCatalog()` 会抛错，从根源上阻止出现"无解关卡"。

### 会话状态

`OneStrokeSession` 维护：

- `path: GridPoint[]` — 节点顺序列表
- `usedEdges: string[]` / `usedEdgeSet: Set<string>` — 已覆盖边（无向，规范化 key）
- `attempts` — 每次从空路径开始算作一次尝试
- `solved` — 当 `usedEdges.size === totalEdges` 时置 true

`edgeKey(a, b)` 强制升序排序两个端点的 `row/col`，确保无向唯一。

### 进度持久化

localStorage key：`linelink-progress-v2`。加载时：

1. 读取 v2，若存在直接反序列化。
2. 否则尝试读取 v1 并迁移：所有已解关卡按 1 星导入。
3. 最差情况返回全新的 ProgressState，仅解锁第 1 关。

`recordSolved(progress, id, attempts, levelCount)` 以 attempts 计算本次星级，与历史 `bestAttempts` 比较后取最佳，并解锁下一关。

## 测试

```
tests/levels.test.ts
  ✓ 关卡目录生成 48 关，ID 递增
  ✓ 覆盖全部 4 个 tier
  ✓ hasEulerPath 接受三角形
  ✓ hasEulerPath 拒绝 4 奇点的 W4 轮图

tests/session.test.ts
  ✓ 三角形 3 条边后通关
  ✓ 拒绝重复走同一条边
  ✓ undo 移除最近一条边
  ✓ 每次空路径上的第一步增加 attempts
  ✓ edgeKey 无向对称
```

运行：`npm test` 或 `npx vitest run`。

## 构建产物

`vite build` 生成的典型 chunk：

| 文件 | 说明 | 大小 (gzip) |
| --- | --- | --- |
| `index-*.js` | 主入口 + DOM 外壳 | ~6 kB |
| `phaser-*.js` | 懒加载的 Phaser 运行时 | ~340 kB |
| `PuzzleScene-*.js` | 懒加载的关卡场景 | ~3 kB |
| `index-*.css` | 全部样式 | ~3 kB |

进入关卡时才会动态 `import('phaser')` + `import('./phaser/scenes/PuzzleScene')`，主页几乎无 Phaser 负担。

## CI

`.github/workflows/ci.yml` 在 push / PR 时执行：

1. `npm ci`
2. `npm run typecheck`
3. `npm test -- --run`
4. `npm run build`

## 可拓展方向

- PWA（需图标与 manifest）
- 真实音频资源（目前全部合成）
- i18n（中英切换）
- DOM 模板库 / `GameController` 抽象
- 更多形状与等级

## License

本项目目前未添加许可证，默认保留所有权利。如需开源请在 `package.json` / `LICENSE` 中声明。
