# 博客插件配置指南

## 已启用的插件功能

### 1. 搜索功能

- **插件**: `searchPro: true`
- **功能**: 全文搜索，支持中英文
- **状态**: ✅ 已启用

### 2. 代码复制功能

- **插件**: `copyCode`
- **功能**: 代码块一键复制
- **配置**: 移动端也显示复制按钮
- **状态**: ✅ 已启用

### 3. 图片预览功能

- **插件**: `photoSwipe: true`
- **功能**: 图片点击放大预览
- **状态**: ✅ 已启用

### 4. 阅读时间统计

- **插件**: `readingTime`
- **功能**: 自动计算文章阅读时间
- **配置**: 每分钟300字
- **状态**: ✅ 已启用

### 5. PWA 支持

- **插件**: `pwa`
- **功能**: 离线访问、桌面安装
- **状态**: ✅ 已启用
- **注意**: 需要在 `src/.vuepress/public/` 目录下添加相应的图标文件

## 待配置的插件功能

### 1. 评论系统 (Giscus)

- **状态**: 🔄 待配置
- **依赖**: 需要 GitHub 仓库启用 Discussions 功能
- **配置步骤**:
  1. 在 GitHub 仓库设置中启用 Discussions
  2. 安装 Giscus 应用到仓库
  3. 获取 `repoId` 和 `categoryId`
  4. 在 `theme.ts` 中取消注释并填入正确的配置

### 2. 其他可选插件

- **幻灯片**: RevealJS 插件
- **数学公式**: KaTeX 插件
- **流程图**: Mermaid 插件
- **代码演示**: CodePen/JSFiddle 嵌入

## 插件配置说明

所有插件配置都在 `src/.vuepress/theme.ts` 文件的 `plugins` 对象中。当前配置的插件都是 vuepress-theme-hope 主题内置支持的，无需额外安装依赖。

## 图标文件准备

PWA 功能需要以下图标文件（放在 `src/.vuepress/public/assets/icon/` 目录）:

- `apple-icon-152.png` (152x152)
- `ms-icon-144.png` (144x144)
- `chrome-mask-512.png` (512x512, maskable)
- `chrome-mask-192.png` (192x192, maskable)
- `chrome-512.png` (512x512)
- `chrome-192.png` (192x192)
- `favicon.ico` (放在 `public` 根目录)

## 性能优化建议

1. **图片优化**: 使用 WebP 格式，启用懒加载
2. **代码分割**: 大型组件按需加载
3. **缓存策略**: PWA 缓存静态资源
4. **搜索优化**: 搜索索引预构建

## 下一步计划

1. 准备 PWA 所需的图标文件
2. 配置 GitHub Discussions 评论系统
3. 添加数学公式和流程图支持
4. 优化移动端体验
