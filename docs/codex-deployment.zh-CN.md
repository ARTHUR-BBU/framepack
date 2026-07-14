# 在其他 Codex 环境使用 Framepack

Framepack 当前只支持 Codex。它以插件形式安装，不需要 Hermes，也不需要把旧项目复制进当前工作树。

## 本机测试

在 Codex 的插件市场添加本仓库或本地目录，安装 `framepack-director`。安装完成后，新建一个 Codex task，直接说：

> 帮我做一支产品发布视频

插件会调用自身打包的脚本；项目只产生 `.framepack/`、`.hyperframes/`、`frame.md`、`index.html` 和本地 `public/` 素材。

## 团队或其他项目

```text
codex plugin marketplace add <仓库或本地目录>
codex plugin add framepack-director@framepack
```

然后在目标项目新建 Codex task。不要手动复制 `framepack-plugin/`、`.hermes/` 或旧 Hermes 配置；这些内容只保存在 Git 历史中。

## 开发者验证

```powershell
npm install
npm run plugin:build
npm run typecheck
npm test
npm run plugin:validate
```

安装包位于 `plugins/framepack-director/`。其中包含中文样片、六件 proven 武器、GSAP 官方能力快照、本地字体和可执行导演入口。
