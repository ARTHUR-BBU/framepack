# Framepack 中文导演工作台浏览器验收

本目录保存 Task 14 的真实浏览器验收截图与测量数据。所有截图均来自本地导演项目，浏览器尺寸和测量结论记录在 `measurements.json`。

- `desktop-1440x900.png`：标准桌面驾驶舱。
- `desktop-1280x800.png`：紧凑桌面驾驶舱。
- `mobile-430x932.png`：移动端顺序为导演上下文 → 主预览 → 导演判断 → 分镜。
- `connection-loss.png`：模拟 `/api/project` 失败后的中文断线恢复提示。

正常网络状态控制台为 0 error / 0 warning。断线模拟期间会产生预期的 API 500 网络错误，恢复路由后重新加载正常。
