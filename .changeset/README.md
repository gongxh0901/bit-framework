# Changesets

每个面向用户的包变更都应新增一个 changeset：

```bash
pnpm changeset
```

版本生成：

```bash
pnpm version:packages
pnpm install --lockfile-only
```

发布前由 CI 执行 `pnpm publish:npm` 或 `pnpm publish:gitlab`，只发布 Changesets 计算出的包。FairyGUI 仍由其独立仓库负责 npmjs 发布。
