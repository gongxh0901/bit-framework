# Changesets

每个面向用户的包变更都应新增一个 changeset：

```bash
pnpm changeset
```

版本生成由 Release PR/MR 自动完成。GitHub Actions 通过 `changesets/action` 调用，GitLab 若启用 `scripts/create-gitlab-release-mr.mjs` 也会调用：

```bash
pnpm version:packages
```

本地只在需要模拟 Release PR/MR 时执行上述命令，不要在普通开发分支手动提交版本结果。版本生成会更新受影响包的版本、依赖范围和 CHANGELOG，并消费 changeset。

发布前由 CI 执行 `pnpm publish:npm` 或 `pnpm publish:gitlab`，只发布 Changesets 计算出的包。两个脚本的 `--dry-run` 只检查清单，不上传。

FairyGUI 位于独立子模块：npmjs 发布由其独立仓库负责；主仓库的 `bit-ui` / `bit-condition` 等受影响包按主仓库 Changesets 流程发布。
