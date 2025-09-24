---
title: pnpm 特性及基本使用
date: 2023-02-20
category:
  - 工程化
tag:
  - pnpm
---

## 什么是 pnpm?

performant npm ，意味“高性能的 npm”。
**快速**的，**节省磁盘空间**的包管理工具。

## 特性概览

1. **速度快**

非扁平的包结构，没有 npm3+/yarn 复杂的扁平算法，且只更新变化的文件

1. **高效利用磁盘空间**

pnpm 内部使用**基于内容寻址**的文件系统来存储磁盘上所有的文件：

- 不会重复安装同一个包
- 即使一个包的不同版本，pnpm 也会极大程度地复用之前版本的代码（保留未更新文件的hardlink）

1. **支持 monorepo**

用一个 git 仓库来管理多个子项目，所有的子项目都存放在根目录的 packages 目录下，那么一个子项目就代表一个package。

1. **安全性高**

规避非法访问未声明依赖的风险，未在 package.json 中声明的包无法访问。

### 与 npm 的区别

pnpm 与 npm 命令使用方法很相似，但有以下区别：

- pnpm install 命令会将包安装在项目根目录下的 `node_modules/.pnpm-store` 目录中。与其他包管理器不同，pnpm 不会将每个包都安装在独立的目录中，而是共享相同的包存储。这可以节省磁盘空间，并且可以加快安装速度，因为相同的包只需要下载一次。

- 安装依赖项时，pnpm 会自动执行依赖项之间的垃圾回收，自动检测哪些包不再被使用，并将其删除，从而进一步减少磁盘占用。

## 依赖管理

### npm/yarn install 原理

分为两部分：

1. 执行该命令后，包如何到达项目 node_modules 当中
2. node_modules 内部如何管理依赖

执行命令后，首先会**构建依赖树**。然后针对每个节点下的包会做如下处理:

1. 解析依赖包版本区间为具体版本号
2. 下载对应版本依赖的 tar 包到本地离线镜像，并解压到本地缓存
3. 将依赖从缓存拷贝到当前目录的 node_modules 目录

npm 1/2中，依赖在 node_modules 中的目录结构为嵌套结构。依赖层层嵌套存在的问题：

1. 依赖层级太深，会导致文件路径过长的问题（windows）
2. 大量包被重复安装（A、B包依赖同一个版本的C包，在A、B包下的node_modules会重复安装C包）
3. 模块实例不能共享（比如两个不同包引入React版本不一致，无法共享内部变量导致未知bug）

npm3/yarn，通过**扁平化依赖**解决上述问题。所有依赖都被提升到 node_modules 根目录下。

安装新包时会根据 `node require` 机制，会不停往上级的 node_modules 当中去找，如果找到相同版本的包就不会重新安装，解决了重复安装包问题，避免依赖层级过深。
但它也存在以下问题：

1. 依赖结构的**不确定性**
   1. 当A/B两个包同时依赖C包的不同版本，到底把哪个C包版本扁平化到node_modules下取决于A/B包在package.json 中的位置，靠前优先。*-lock.json 文件的诞生才解决此问题（npm 5.x/yarn）。
2. 扁平化算法本身的**复杂性**很高，耗时较长
3. 项目中仍然可以**非法访问**没有声明过依赖的包

### pnpm 依赖管理

以安装 express 为例：

```bash
pnpm init
pnpm install express
```

node_modules目录如下：

```bash
.pnpm
.modules.yaml
express
```

上面的 express 仅是一个软链接，其真实的位置在 `.pnpm/express@4.18.2/node_modules/express`。

将 `包本身` 和 `依赖` 放在同一个node_module下面，与原生 Node 解析完全兼容，又能将 package 与相关的依赖很好地组织到一起，设计精妙。

![image.png](../.vuepress/public/assets/images/node-modules-structure.jpg)

可以看到，node_modules 下面的依赖包跟 package.json 声明的依赖基本保持一致，整体上更清晰规范。

### node_modules 结构

pnpm 的 node_modules 布局使用**符号链接**来创建依赖项的嵌套结构。
node_modules 中每个包的每个文件都是来自内容可寻址存储的**硬链接**。这项技术被称作“虚拟文件系统”，用于在所有项目间共享依赖项。

在 pnpm 中，每个项目都有一个名为 `.node_modules/.pnpm` 的目录，其中包含所有依赖项的符号链接。这些符号链接指向全局存储仓库 `~/Library/pnpm/store` ，它用于存储所有项目共享的包。。

> 如果某个包不存在于本地的 `node_modules/.pnpm` 目录中，则 pnpm 会在 `~/Library/pnpm/store` 目录中下载该包，并将其安装到本地的 node_modules/.pnpm 目录中。然后，pnpm 会使用硬链接技术将其链接到项目的 node_modules 目录中。

**示例：** 假设安装了依赖于 `bar@1.0.0` 的 `foo@1.0.0`，会经历以下步骤。

1. pnpm 会将两个包硬链接到 node_modules
2. 创建符号链接来构建嵌套的依赖关系图结构（两个包都硬链接到一个 node_modules 文件夹（foo@1.0.0/node_modules/foo）内的子文件夹中）
3. 符号链接依赖项（bar 将被符号链接到 foo@1.0.0/node_modules 文件夹）
   1. 允许包自行导入自已
   2. 避免循环符号链接（依赖以及需要依赖的包被放置在一个文件夹下）
4. 处理直接依赖关系（foo 将被符号链接至根目录的 node_modules 文件夹）

无论依赖项的数量和依赖关系图的深度如何，布局都会保持上述结构。
这**与 Node 的模块解析算法完全兼容**！ 解析模块时，Node 会忽略符号链接，被依赖项是被解析到其实际位置。

此布局的一大好处：**只有真正在依赖项中的包才能访问**。使用平铺的 node_modules 结构，所有被提升的包都可以访问。 这避免了 npm3+/yarn 中的非法访问依赖问题。

### 处理 peers

peer 依赖项（peer dependencies）会从依赖图中更高的已安装的依赖项中解析（resolve），因为它们与父级共享相同的版本。

通常，如果一个 package 没有 peer 依赖项（peer dependencies），它会被硬链接到其依赖项的软连接（symlinks）旁的 node_modules。

但是，如果该 package 有 peer 依赖（peer dependencies），那么它可能就会有多组依赖项，所以pnpm为不同的 peer 依赖项创建不同的解析。Node.js 模块解析器将找到正确的 peers。

如果一个package的依赖有peer依赖，这些依赖会在更高的依赖图中解析, 则这个传递package便可在项目中有几组不同的依赖项。

## 使用 pnpm

大多数npm/yarn的使用经验可无缝切换到pnpm上。

常用命令：pnpm `install`/`uninstall`/`update`/`link`

### filter

pnpm filter 命令可以过滤出符合条件的包，然后对这些包执行指定的操作：

```bash
pnpm filter <pattern> <command>
```

其中，`<pattern>` 是一个正则表达式，用于匹配包的名称，`<command>` 则是要执行的命令，可以是任何 pnpm 支持的命令。例如，要查找所有名称以 react 开头的包，并更新它们的版本，可以使用以下命令：

```bash
pnpm filter "^react" update
```

> 更多用法参考[官网](https://www.pnpm.cn/filtering)

### 管理 monorepo 项目

使用 `pnpm init`创建项目，配置 `pnpm-workspace.yaml` 设置 workspace，下面配置表示将 packages 下的所有文件夹都当做一个 package，添加到 monorepo 中进行管理：

```bash
packages:
  - 'packages/**'
```

> 设置工程目录下 package.json 的 private 为 true，防止根目录被发布。

然后创建 packages 文件夹，并在其中创建两个子项目：web端、工具类。

```bash
├── packages
│   ├── shared
│   └── web
```

**全局依赖**
像 lodash 这样的全局依赖，可将其安装到根目录，即：

```bash
pnpm install lodash-es -Dw
```

> -w 代表在根目录安装依赖

**局部依赖**
为指定 package 单独安装依赖，可使用 [--filter](https://pnpm.io/zh/filtering) 标志将命令限定于子集。

```bash
pnpm install vue --filter @hugon/web
```

**package 间的相互依赖**
例如 @hugon/web 依赖 @hugon/shared，基于 pnpm 提供的 `workspace:`协议，可以方便的在 packages 内部进行互相引用：

```bash
pnpm install @hugon/shared --filter @hugon/web
```

此时 web 项目下的 node_modules 中新增了 @hugon/shared 软链以指向该包。
当执行 `pnpm publish`发布时，会把基于的 workspace 的依赖变成外部依赖，以解决开发和生产环境的依赖问题。

**只允许使用pnpm包管理器**
安装 `only-allow`

```json
{
  "scripts": {
    "preinstall": "npx only-allow pnpm"
  }
}
```

## Release工作流

使用官方推荐之一的 [changesets](https://link.juejin.cn/?target=https%3A%2F%2Fgithub.com%2Fchangesets%2Fchangesets) 来作包的版本管理，它的主要工作是**管理包的version**和**生成changelog**。

### 配置 changesets

```bash
pnpm add -Dw @changesets/cli # 安装到工作空间的根目录中
pnpm changesets init # 初始化
```

执行完初始化命令后，会在工程的根目录下生成 `.changeset` 目录，其中的 `config.json` 作为默认的 changeset 的配置文件。
修改配置：

```json
{
  "$schema": "https://unpkg.com/@changesets/config@2.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "linked": [["@hugon/*"]],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": [],
  "___experimentalUnsafeOptions_WILL_CHANGE_IN_PATCH": {
      "onlyUpdatePeerDependentsWhenOutOfRange": true
  }
}
```

说明：

- changelog: changelog 生成方式
- commit: 不要让 changeset 在 publish 的时候帮我们做 git add
- linked: 配置哪些包要共享版本
- access: 公私有安全设定，内网建议 restricted ，开源使用 public
- baseBranch: 项目主分支
- updateInternalDependencies: 确保某包依赖的包发生 upgrade，该包也要发生 version upgrade 的衡量单位（量级）
- ignore: 不需要变动 version 的包
- ___experimentalUnsafeOptions_WILL_CHANGE_IN_PATCH: 在每次 version 变动时一定无理由 patch 抬升依赖他的那些包的版本，防止陷入 major 优先的未更新问题

### 使用changesets

在工程根目录下 pacakge.json 的 scripts 中增加如下脚本，以便于统一管理所有包的发布过程：

```javascript
{
  // 编译阶段，生成构建产物
  "build": "pnpm --filter=@qftjs/* run build",
  // 清理构建产物和 node_modules
  "clear": "rimraf 'packages/*/{lib,node_modules}' && rimraf node_modules",
  // 执行 changeset，开始交互式填写变更集
  "changeset": "changeset",
  // 修改发布包的版本，注意需严格遵循 semver 版本规范
  "version-packages": "changeset version",
  // 构建后产物发布
  "release": "pnpm build && pnpm release:only",
  "release:only": "changeset publish --registry=https://registry.npmjs.com/"
}
```

### 使用Prerelease模式

发布带 tag 的 prerelease版本 (如beta或者rc版本)，通过 `pre enter <tag>` 命令进入先进入 pre 模式。
`<tag>` 包含：alpha、beta、rc。

```shell
pnpm changeset pre enter beta
```

之后在此模式下的 changeset publish 均将默认走 beta 环境。完成版本发布之后，退出 Prereleases 模式：

```shell
pnpm changeset pre exit
```

## 总结

- pnpm 基于 symlink 和 hard link 机制，解决 npm/yarn 上存在的问题，能高效地管理包的版本及依赖
- pnpm 天然支持使用 monorepo 模式管理项目
- pnpm 能更安全地处理依赖访问和解析问题

## 参考

- [关于现代包管理器的深度思考——为什么现在我更推荐 pnpm 而不是 npm/yarn? - 掘金](https://juejin.cn/post/6932046455733485575)
  - 介绍特性：快、省、安全（及原因）、支持monorepo
  - 介绍 npm/yarn install 原理和存在的问题，及 pnpm 的依赖管理是如何解决的
- [Pnpm: 最先进的包管理工具](https://zhuanlan.zhihu.com/p/404784010)
  - symlink 和 hard link 机制介绍。store 目录用于存储依赖的 hard links
  - symlink 在 windows 存在兼容问题，使用 [junctions](https://learn.microsoft.com/en-us/windows/win32/fileio/hard-links-and-junctions) 特性代替
  - 解决痛点：Phantom dependencies 和 NPM doppelgangers
  - pnpm 不适用场景：Electron、部署在 lambda 上的应用
- [新一代包管理工具 pnpm 使用心得](https://zhuanlan.zhihu.com/p/546400909)
  - dependencies 和 devDependencies 的区别，及 peerDependencies 的使用
  - 与传统包管理器文件结构对比
  - 优势：硬链接节省磁盘，软链接优化依赖管理
  - 老项目迁移，解决幽灵依赖问题，在.npmrc 文件中配置 public-hoist-pattern 或 shamefully-hoist 字段（不推荐）
- [Flat node_modules is not the only way | pnpm](https://pnpm.io/blog/2020/05/27/flat-node-modules-is-not-the-only-way)
- [Linux软连接和硬链接 - iTech - 博客园](https://www.cnblogs.com/itech/archive/2009/04/10/1433052.html)
- [Quick Start：用 pnpm 管理 Monorepo 项目](https://zhuanlan.zhihu.com/p/422740629)
  - pnpm 的全局、局部依赖安装方式
  - 同时运行多个子包命令脚本
- [pnpm + workspace + changesets 构建你的 monorepo 工程 - 掘金](https://juejin.cn/post/7098609682519949325)
  - 工程初始化及依赖包安装
  - 使用changesets管理release工作流
  - 代码及commit规范配置（eslint、commitizen）
- [2023 年了！ pnpm monorepo用起来！ - 掘金](https://juejin.cn/post/7184392660939964474)
  - 使用rollup打包输入配置（多包相同编译、子包自定义编译输出格式、命令行打包并指定格式、ts打包）
  - changesets的使用
  - 预发布版本
  - 代码格式校验（lint、prettier、lint-stage、simple-git-hooks）
  - 代码提交规范（commitzen、commitlint）
