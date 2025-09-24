---
title: 前端脚手架 CLI 方案探索
date: 2023-02-01
category:
  - 工程化
tag:
  - cli
  - 脚手架
---

## 介绍

脚手架是工程化中的重要环节，用于新项目的启动和搭建，能帮助开发者提升效率和开发体验。

### 使用场景

脚手架自动生成项目的使用场景非常广泛，特别是在需要频繁创建新项目的情况下。以下是一些常见的使用场景：

1. 新项目启动：当需要启动一个新项目时，可以使用脚手架自动生成项目的基础结构，包括目录结构、配置文件、依赖项等，从而加快项目启动的速度。

2. 快速原型开发：快速创建一个原型，从而节省时间和精力。

3. 统一项目结构：统一多个项目的结构和规范时，从而确保项目结构和规范的一致性。

4. 项目模板定制：为不同的项目创建不同的模板，并根据不同的需求进行定制化，从而提高项目的可维护性和可扩展性。

<!-- more -->

总之，脚手架自动生成项目可以帮助开发人员快速创建项目，并且提高项目的可维护性和可扩展性，特别是在需要频繁创建新项目或者需要统一多个项目的结构和规范时，使用脚手架可以提高开发效率和代码质量。
在前端工程化中，脚手架是不可或缺的一环。

通常，开发新项目大都是直接复制之前的项目代码，然后删减，这显然不是优雅的方式。因此，需要脚手架**自动生成项目，在项目初始化时就具有统一的技术栈、权限、基础功能、代码规范，以及项目构建流程，甚至单元测试等**。

更进一步，上述统一化的功能可当做**独立的包发布和维护**，以方便后续在各个项目中**版本升级**。这样新项目开发只需专注于业务，无需过多关项目构建及公共逻辑维护，提高前端研发能效。

## 实现原理

现代脚手架离不开命令行工具（CLI），流畅的命令行工具能快速启动脚手架，实现高度自动化和智能化流程。

为了实现一个简单的命令行工具，用于创建基于模板的项目，我们需要使用以下依赖包：

- [prompts](https://github.com/terkelg/prompts)： 处理复杂的用户输入，完成命令行交互
- [kolorist](https://github.com/marvinhagemeister/kolorist): 在终端输出彩色信息文案
- [commander](https://github.com/tj/commander.js): 命令行参数解析

最终，我们的目标是支持以下方式启动项目：

```shell
npm create hugon
```

> hugon 是这个项目的名称，需要创建一个 create-hugon 包并发布到 npm 上。

### npm create  命令

`npm create` 是一个用于创建新项目的 npm 命令。它可以自动化地创建一个新的项目，包括一些常见的配置和文件，以及安装一些常用的依赖项。使用 `npm create`命令可以极大地简化项目的初始化过程。

要使用 npm create 命令创建一个新项目，只需要在终端中输入 `npm create <package-name>`，其中 `<package-name>` 是你想要创建的项目的名称。
npm 会首先检查本地是否已经安装了 `create-<package-name>` 包。如果没有安装，则会自动从 npm registry 下载该包，并将其安装到本地的 node_modules 目录中。

> npm 6.1 及以上版本可以使用 npm init 或 npm create 命令启动项目。
> npm v6 给 [init](https://docs.npmjs.com/cli/v9/commands/npm-init/)新增了 create 别名（命令行 npm help create 查看详细文档）。

然后，npm 会执行 `create-<package-name>` 包中的一个名为 `bin/create-<package-name>` 的脚本（定义在 package.json 中），该脚本负责生成新项目的文件和配置(通常会定义一些模板和配置文件，将它们复制到新项目的目录中，并根据用户的选择和输入进行初始化配置)。

> `npm create` 命令会用以下形式交由 [npm exec](https://docs.npmjs.com/cli/v9/commands/npm-exec) 安装，然后执行其 bin 脚本
>
> ```shell
> npm create foo -> npm exec create-foo
> npm create @usr/foo -> npm exec @usr/create-foo
> ```

### 启动命令行项目

先如下创建项目

```shell
mkdir create-hugon && cd create-hugon
npm init --yes
```

接着创建 src 目录及 index.ts 文件，内容如下：

```ts
import minimist from 'minimist'

const argv = minimist<{
  template?: string
}>(process.argv.slice(2), { string: ['_'] })
const cwd = process.cwd()

async function init() {
  console.log(argv);
}

init().catch((e) => {
  console.error(e)
})
```

安装依赖包：

```shell
pnpm add unbuild kolorist minimist prompts -D
pnpm add typescript @types/node -D
```

在 package.json 添加编译命令，使用 [unbuild](https://github.com/unjs/unbuild) 构建打包，会生成开发时 `stub`，用于开发调试，而不用 watch 一直监听文件构建：

```json
{
  "scripts": {
    "dev": "unbuild --stub"
  },
```

> `--stub` 选项用于创建一个轻量级的启动脚本，这个启动脚本被称为 `stub`。它的作用是在运行时加载打包后的代码，并将控制权转交给打包后的代码。通常情况下，`stub` 会非常小，只包含一些必要的代码，例如加载打包后的代码的逻辑等。

> unbuild 打包后的文件实际使用 [jiti](https://github.com/unjs/jiti) 库作为 require 的替代品，以提高性能。
> 使用 require 加载模块时，Node.js 会在每次加载模块时重新解析和编译代码。而 jiti 则可以将模块编译成可重用的 JavaScript 函数（并将其缓存起来），从而提高应用程序的性能。

为了使 CLI 可以在终端执行，需在 package.json 中指定 bin 文件入口，注册一个名为 create-hugon 的命令。

```json
{
  "type": "module", // 指定文件作为ES模块语法加载
  "bin": {
    "create-hugon": "index.js"
  },
  "main": "index.js"
}
```

> `bin` 字段用于声明一些可执行文件的路径，通常是一些命令行工具或者脚本。
> 在终端中输入这些命令时，实际上是在执行对应的可执行文件。操作系统会在环境变量 `PATH` 中定义的路径中寻找对应的可执行文件并执行。<br><br>
> 在安装包时，npm 会将 bin 字段中声明的可执行文件链接到全局 node_modules/.bin 目录下。这个目录也会被添加到环境变量 PATH 中，所以可以直接在终端中执行这些命令。<br><br>
> 在终端中执行 `create-hugon` 命令，实际上就是在执行 ./bin/create-hugon.js 文件。

先执行 `npm run dev` ，会在 dist 下生成 index.mjs 文件。然后在 index.js 内引入，作为包的入口文件。

```shell
#!/usr/bin/env node
import './dist/index.mjs'
```

为了调试方便，将当前项目链接到全局环境中（执行`npm ls -g` 可查看已安装到全局的命令）：

```shell
npm link
```

> `npm link` 命令会在全局 node_modules 目录中创建一个指向本地包的符号链接，然后在当前项目的 node_modules 目录中创建一个指向全局包的符号链接，这样就可以在当前项目中使用本地包了。

现在就可以执行 `create-hugon` 命令了

```shell
create-hugon my-hugon-app --template admin-ts
#> { _: [ 'my-hugon-app' ], template: 'admin-ts' }
```

### 解析处理命令行输入

上文中，我们创建了一个命令行项目，可以全局执行该命令，并且可以接收用户输入参数。接下来，我们需要解析命令行输入，以编写项目创建逻辑。

使用 prompts 模块支持用户交互，同时使用 minimist 模块解析命令行参数。在 init 函数中编写参数解析逻辑。需要设计命令行支持的几个选项目：

- `_[0]`: 创建的项目目录名称
- `template`: 支持默认的几种模板类型，用户可通过 select 命令进行选择

利用 `prompts` 使命令行支持用户交互，使用 `minimist` 解析命令行参数。在 init 函数中编写参数解析逻辑。

首先，要定义一个模板选择列表的数据结构：

```ts
import { blue, green, yellow } from 'kolorist'

type ColorFunc = (str: string | number) => string
type Platform = {
  name: string
  display: string
  color: ColorFunc
  variants: PlatformVariant[]
}
type PlatformVariant = {
  name: string
  display: string
  color: ColorFunc
}

const PLATFORMS: Platform[] = [
  {
    name: 'admin',
    display: 'Admin',
    color: green,
    // 提供 ts 和非 ts 的两种变体选项
    variants: [
      {
        name: 'admin',
        display: 'JavaScript',
        color: yellow,
      },
      {
        name: 'admin-ts',
        display: 'TypeScript',
        color: blue,
      },
    ],
  },
]
```

上面定义了 admin 模板，用于管理后台。

```ts
import prompts from 'prompts'
import { blue, green, red, yellow, reset } from 'kolorist'
import { fileURLToPath } from 'node:url'

// 获取模板名列表
const TEMPLATES = PLATFORMS.map(
  (f) => (f.variants && f.variants.map((v) => v.name)) || [f.name],
).reduce((a, b) => a.concat(b), [])

const renameFiles: Record<string, string | undefined> = {
  _gitignore: '.gitignore',
}
const defaultTargetDir = 'hugon-project'

async function init() {
  // 获取输出的目标文件夹参数，例 npm create hugon my-hugon，argTargetDir 为 my-hugon
  const argTargetDir = formatTargetDir(argv._[0])
  // 获取指定模板参数
  const argTemplate = argv.template

  let targetDir = argTargetDir || defaultTargetDir
  // 获取项目名
  const getProjectName = () => targetDir === '.' ? path.basename(path.resolve()) : targetDir

  let result: prompts.Answers<'projectName' | 'overwrite' | 'packageName' | 'template'>

  try {
    // 按顺序执行询问
    // type 为 falsy 值时询问器会跳过当前问题
    result = await prompts([
      {
        // 文本输入框
        type: argTargetDir ? null : 'text',
        // 用户响应将会保存到返回响应对象中的这个属性上
        name: 'projectName',
        // 重置命令行文案
        message: reset('Project name:'),
        // 默认值
        initial: defaultTargetDir,
        // 获取用户响应值
        onState: (state) => {
          targetDir = formatTargetDir(state.value) || defaultTargetDir
        },
      },
    ],
    {
      // 用户取消操作（按ctrl+C，或 ESC）
      onCancel: () => {
        throw new Error(red('✖') + ' 操作已取消')
      },
    })
  } catch (cancelled: any) {
    console.log(cancelled.message)
    return
  }

  console.log(result)
}

function formatTargetDir(targetDir: string | undefined) {
  return targetDir?.trim().replace(/\/+$/g, '')
}
```

此时，在命令行输入 `create-hugon`，命令行交互会提示用户输入项目名，未输入则使用默认名称：

```shell
create-hugon create-hugon
? Project name: › hugon-project
```

> 完整的 prompts 用法查看此[文档](https://github.com/terkelg/prompts)

接下来完善其它问询：

```js
try {
  // 按顺序执行询问
  // type 为 falsy 值时询问器会跳过当前问题
  result = await prompts([
    // ... ...
    {
      // 若存项目目录存在并不为空，询问用户是否覆盖
      type: () => !fs.existsSync(targetDir) || isEmpty(targetDir) ? null : 'confirm',
      name: 'overwrite',
      message: () => targetDir === '.' ? '当前目录' : `目标目录 "${targetDir}" 不为空。是否移除存在的文件并继续？`,
    },
    {
      // type 为函数时，入参签名 (prev, values, prompt)。values 为之前所收集的用户回答
      // 若用户选择不覆盖，中止操作
      type: (_, { overwrite }: { overwrite?: boolean }) => {
        if (overwrite === false) {
          throw new Error(red('✖') + ' 操作已取消')
        }
        return null
      },
      name: 'overwriteChecker',
    },
    {
      // 检查项目名是否合法，不合法需重新输入（会尝试处理为合法值作为默认值）
      type: () => (isValidPackageName(getProjectName()) ? null : 'text'),
      name: 'packageName',
      message: reset('项目名称:'),
      // 将获取的项目名处理为合法值，并作为默认值
      initial: () => toValidPackageName(getProjectName()),
      // 再次校验用户输入的项目名。返回 true 表示校验通过，返回字符串为用户自定义错误信息
      validate: (dir) => isValidPackageName(dir) || '无效的 package.json name 字段',
    },
    {
      // 指定的模板不在列表中，则让用户重新从列表选择
      type: argTemplate && TEMPLATES.includes(argTemplate) ? null : 'select',
      name: 'framework',
      message: typeof argTemplate === 'string' && !TEMPLATES.includes(argTemplate)
        ? reset(`"${argTemplate}" 不是有效模板. 请从下方选择: `)
        : reset('选择平台:'),
      initial: 0,
      choices: PLATFORMS.map((platform) => {
        return {
          title: platform.color(platform.display || platform.name),
          value: platform,
        }
      }),
    },
    {
      // 选择平台下的变体
      type: (platform: Platform) => platform && platform.variants ? 'select' : null,
      name: 'variant',
      message: reset('选择变体:'),
      choices: (platform: Platform) => platform.variants.map((variant) => {
        return {
          title: variant.color(variant.display || variant.name),
          value: variant.name,
        }
      }),
    }
  ],
  {
    // 用户取消操作
    onCancel: () => {
      throw new Error(red('✖') + ' 操作已取消')
    },
  })
} catch (cancelled: any) {
  console.log(cancelled.message)
  return
}
```

其它工具函数：

```ts
import fs from 'node:fs'
import path from 'node:path'

function isEmpty(path: string) {
  const files = fs.readdirSync(path)
  return files.length === 0 || (files.length === 1 && files[0] === '.git')
}

function emptyDir(dir: string) {
  if (!fs.existsSync(dir)) {
    return
  }
  for (const file of fs.readdirSync(dir)) {
    if (file === '.git') {
      continue
    }
    fs.rmSync(path.resolve(dir, file), { recursive: true, force: true })
  }
}

function isValidPackageName(projectName: string) {
  return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(
    projectName,
  )
}

// 将包名转为合法值
function toValidPackageName(projectName: string) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z\d\-~]+/g, '-')
}

// 复制文件或文件夹
function copy(src: string, dest: string) {
  const stat = fs.statSync(src)
  if (stat.isDirectory()) {
    copyDir(src, dest)
  } else {
    fs.copyFileSync(src, dest)
  }
}

// 复制目录
function copyDir(srcDir: string, destDir: string) {
  fs.mkdirSync(destDir, { recursive: true })
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file)
    const destFile = path.resolve(destDir, file)
    copy(srcFile, destFile)
  }
}

function isEmpty(path: string) {
  const files = fs.readdirSync(path)
  return files.length === 0 || (files.length === 1 && files[0] === '.git')
}

// 删除目录（保留 .git 目录）
function emptyDir(dir: string) {
  if (!fs.existsSync(dir)) {
    return
  }
  for (const file of fs.readdirSync(dir)) {
    if (file === '.git') {
      continue
    }
    fs.rmSync(path.resolve(dir, file), { recursive: true, force: true })
  }
}

// 获取包信息
function pkgFromUserAgent(userAgent: string | undefined) {
  if (!userAgent) return undefined
  const pkgSpec = userAgent.split(' ')[0]
  const pkgSpecArr = pkgSpec.split('/')
  return {
    name: pkgSpecArr[0],
    version: pkgSpecArr[1],
  }
}
```

### 创建项目

各个模板源码放置于 `create-hugon` 下，以 `template-` 开头的目录。如选择 `admin/admin-ts`，则会以 `create-hugon/template-admin-ts` 模板生成项目。

创建项目的主要代码：

```js
// 用户选择的选项
const { platform, overwrite, packageName, variant } = result
const root = path.join(cwd, targetDir)

// 创建项目文件夹，已存在则先删除其下非 .git 文件夹的文件或文件夹
if (overwrite) {
  emptyDir(root)
} else if (!fs.existsSync(root)) {
  fs.mkdirSync(root, { recursive: true })
}

const template: string = variant || platform?.name || argTemplate

// process.env.npm_config_user_agent 拿到包含版本信息的用户代理字符串，例如：
// 'pnpm/6.23.2 npm/? node/v16.13.0 darwin arm64'
const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent)
const pkgManager = pkgInfo ? pkgInfo.name : 'npm'

console.log(`\n在 ${root} 中创建项目...`)

// 模板文件目录
const templateDir = path.resolve(
  fileURLToPath(import.meta.url),
  '../..',
  `template-${template}`,
)

const files = fs.readdirSync(templateDir)
// 复制模板目录的文件到目标目录
for (const file of files.filter((f) => f !== 'package.json')) {
  write(file)
}

const pkg = JSON.parse(
  fs.readFileSync(path.join(templateDir, `package.json`), 'utf-8'),
)
pkg.name = packageName || getProjectName()
// 修改 package.json 中的 name 字段为项目名称
write('package.json', JSON.stringify(pkg, null, 2))

// 输出项目启动引导
// ... ...
```

至此，就完成了一个脚手架的雏形。脚手架生成项目的整体流程：

1. 首先询问用户项目名称，如果存在项目名称对应的目录，并且不是空目录，询问用户是否覆盖。如果选择不覆盖，则中止操作；如果选择覆盖，则检查项目名是否合法，不合法需要重新输入。

2. 指定模板，如果命令行指定的模板不在模板列表中，让用户重新从列表选择。如果不选择，则使用默认模板。

3. 如果上面选择了平台类型，需要再选择其下的具体项目类型。

4. 创建项目文件夹，如果目录已存在，则先删除其下非 .git 文件夹的文件或文件夹。

5. 修改 package.json 中的 name 字段为项目名称。

6. 控制台输出项目启动引导指示。

## 对比分析

主流的脚手架生成方案：

- 提供集成式的项目模板（选择少，功能集成度高，更适合业务类的复杂脚手架， 如 [create-vite](https://github.com/vitejs/vite/blob/main/packages/create-vite)）
- 提供更细致的特性选项（更侧重特性的组合性，通常用于基于框架的简单脚手架， 如 [create-vue](https://github.com/vuejs/create-vue) / vue-cli）
- 独立的的模板仓库（区别于上面的两种，在一个仓库中维护一个模板）

> 上面的 「实现原理」章节所写的 CLI 采用的是 create-vite 的集成式方案。

### 集成式：create-vite

> 基于 vite， 生成主流框架基础模板的工具。

![](https://alidocs.oss-cn-zhangjiakou.aliyuncs.com/res/b3BMqYgmEm4blwZL/img/955ee67c-908f-44f5-9886-a822ab98f0d9.png#id=EXg2o&originHeight=406&originWidth=832&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

create-vite 属于 vite 项目的一个子包，使用 monorepo 方式管理。

其下提供了很多模板，如：vanilla，vanilla-ts, vue, vue-ts，react，react-ts等

可见，它主要是基于选定框架，以及基于语言或特性的变体（如选择生成 vue 项目，可选TS版本或非TS版本的），相对选项式的粒度更粗。

这是社区目前流行的一种模板管理方式，在此之前使用的是独立的模板仓库。

通常会以 pnpm **monorepo** 或 lerna 方式（单仓库管理多个项目，对应的是 mutliRepo）管理此类项目，收益是：

- 模板集中统一管理，更直观
- 工作流程一致性，版本依赖提升。如果依赖发生变化，可以及时同步到其他使用到的 `package` 中
- 降低项目基建成本。所有项目复用一套标准的工具和规范，无需切换开发环境
- 团队协作更容易。方便共享和复用代码，方便检索项目源码，简化 commit 记录，统一版本管理

### 选项式：create-vue

> 用于生成基于 vite 的 vue 框架基础模板的工具（可看作 vue-cli 的升级版本）。

![](https://alidocs.oss-cn-zhangjiakou.aliyuncs.com/res/b3BMqYgmEm4blwZL/img/8b4ca793-e86c-44e7-9bcc-0ed762980894.png#id=JF3Tt&originHeight=1090&originWidth=1364&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

如上图，此类脚手架会提供一些基础特性以供选择，询问是否使用某些特性，根据选择创建模板。

此类脚手架比较适合生成框架类的，或功能简单的脚手架。优点是选项更灵活。

因为这些特性大体会以条件分支的形式存在于模板中，然后根据条件判断选择对应的特性。当特性较多较复杂时，会大大增加模板的维护成本。

### 独立仓库：vitesse

> [https://github.com/antfu/vitesse](https://github.com/antfu/vitesse)
> vite + vue 的社区模板（集成诸如I18n/PWA/UnoCSS/SSG等企业级应用特性）

此类模板，可以用如 [degit](https://github.com/Rich-Harris/degit) 之类的工具搭建项目。

```shell
npx degit antfu/vitesse my-project
cd my-project
pnpm i
pnpm dev
```

> `degit` 的优点是可以避免不必要的 Git 仓库克隆，从而提高了克隆速度和效率。

独立仓库式的模板，优点是使用简单，项目结构一目了然。跟集成式的区别，主要在于模板代码的管理方式。

### 总结

选项式的脚手架适合简单的项目模板生成，但对于复杂的项目模板生成，建议采用集成式或独立仓库式的模板。这两种模板的区别在于模板的代码管理方式：

- 集成式的模板采用 `monorepo` 管理，适合管理多个、相互有关联的模板。

- 独立仓库式的模板更适合做一个大一统、独立的、无依赖的模板。

因此，建议采用类似 `create-vite` 的方案创建脚手架，同时可以综合参考其他模式，选择最适合自己的模板管理方式。

## 创建项目模板

在根目录下执行 `pnpm create vite template-admin-ts --template vue-ts` 快速创建一个 vue 项目，后续可基于此做模板定制开发。

## 发布到 npm

```shell
npm login --registry https://registry.npmjs.org/
```

在 package.json 中的 scripts 添加 `prepublishOnly` 钩子：

```json
{
  "scripts": {
    "build": "unbuild",
    "prepublishOnly": "npm run build"
  },
  "publishConfig": {
    "registry": "https://registry.npmjs.org/"
  },
  "files": [
    "index.js",
    "template-*",
    "dist",
    "README.md"
  ],
}
```

若本地设置过其它 npm 源，需配置 `publishConfig` 以在发布时指向原始源。

设置 `files` 字段来控制哪些文件会被打包进模块中发布。

```shell
npm publish
```

## 使用

无参数运行，会提示让选择项目名称和模板

```shell
npm create hugon
```

也可直接指定项目名称和模板。如果想生成 admin-ts 项目，则运行：

```shell
npm create hugon my-admin-app --template admin-ts
```

## 参考

- [vuejs/create-vue](https://github.com/vuejs/create-vue)
- [vitejs/vite/packages/create-vite](https://github.com/vitejs/vite/tree/main/packages/create-vite)
- [vue-cli](https://github.com/vuejs/vue-cli/tree/dev/packages/@vue/cli)
