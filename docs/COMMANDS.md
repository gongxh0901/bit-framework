# Bit Framework 命令速查

## 安装

```bash
git clone --recurse-submodules <url>
pnpm install
```

## 构建

```bash
pnpm build            # 全部模块
pnpm clean            # 清理 bit-* 的 dist（fgui dist 入库，不清理）

pnpm build:fgui
pnpm build:core | build:ui | build:ecs | build:ec | build:event
pnpm build:net | build:assets | build:quadtree | build:behaviortree
pnpm build:condition | build:minigame | build:hotupdate
```

## 版本与发布

```bash
pnpm version:patch | version:minor | version:major
pnpm publish:all
```

AI 发版：`/release [patch|minor|major]`

手动发版：

```bash
# 1. 升版本（含 fgui 和根 package.json，不自动 commit/tag）
pnpm version:patch            # 或 version:minor / version:major

# 2. 按 git log 更新根目录 CHANGELOG.md
#    主仓库：git log {上一tag}..HEAD --oneline --no-merges
#    fgui：  git -C vendor/fairygui-cc log {上一tag}..HEAD --oneline --no-merges
#    submodule 条目写成 `- 说明 (fairygui-cc hash)`

# 3. 构建
pnpm build

# 4. 先提交 submodule 并打同一版本 tag
cd vendor/fairygui-cc
git add .
git commit -m "chore: release vx.x.x"
git tag vx.x.x
git push origin ccc3.0
git push origin vx.x.x
cd ../..

# 5. 再提交主仓库（含 CHANGELOG 和 submodule 指针）
git add .
git commit -m "chore: release vx.x.x"
git push
git tag vx.x.x
git push --tags

# 6. 发布（需 npm login，OTP）
pnpm publish:all
```

## Workspace

```bash
pnpm list -r --depth 0
pnpm update -r
pnpm outdated
```
