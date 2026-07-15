# 首个真实产品发布闭环证据

这不是预先画好的概念图，而是 Framepack 从中文 brief、真实 PNG 和品牌文档生成后，由 HyperFrames 0.7.56 实际加载并截取的结果。

## 结论

- 16:9 与 9:16 均完成初始化、素材检查、场景确认、导演方案、样片构建、六帧抓取、反馈修订和再次抓帧。
- 反馈“降低科技感、产品再突出”改变了方向、分镜语义、HTML、构建指纹和证据帧。
- 两个画幅的 `hyperframes lint` 与 `hyperframes check` 最终均为 0 error / 0 warning。
- 自动流程在没有具名审片时保持 `needs_review`，没有伪造人工批准。
- Codex 随后对最终联系表做具名复核：这版作为“导演预览”可以通过并交给 HyperFrames 继续制作；测试产品图偏暗、素材种类较少仍作为后续制作注意项，而不是伪装成最终成片质量。
- 修改前的旧审片单被系统拒绝；绑定当前构建的审片单被接受，之后才写入批准状态与 handoff manifest。

## 最终构建

| 画幅 | Build ID | HTML SHA-256 | 联系表 SHA-256 |
|---|---|---|---|
| 16:9 | `66c6a861655ceb157585689877219386b4a695e727512d9a101a6f989397174e` | `06fad8ceba08f9c4eff8ca5d208744ce27121f28ff265a7839b72db29179fc40` | `95daafce592e4a1f103afbb14442bdf7cbed503611e42fcde8454209a1e8ab0c` |
| 9:16 | `67736b0cc0b0c08e53825c83079079bea442d8567f31b78d77f73dabbaf615a9` | `27b6653b4fc961b1e113420c6079539768fa7c3cad98c26aff95673bcfc7dc3f` | `4e70b6de27a0940c546c87d6857d53a64f6d5b5ebfe21a77013cb0e89990c75c` |

详细七维理由见 `review-scorecards.json`。E2E 会直接读取这两份归档审片单作为批准的唯一依据；其中 `evidenceFrames` 是相对于当次导演项目的路径。每个画幅目录还保存了 `hyperframes-lint.json`、`hyperframes-check.json`、`e2e-evidence.json` 与 `handoff-manifest.json`；其中 `e2e-evidence.json` 逐一列出修改前后六个采样点的 SHA-256，可证明每个对应帧都发生了变化。

这里的“反馈改变分镜”指 Codex 把用户反馈翻译为新的导演 proposal，再由 Framepack 生成带 `revisionOf` 与 `revisionReason` 的分镜版本；不是把一句反馈文字机械附加到旧分镜上。
