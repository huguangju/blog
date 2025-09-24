---
title: TypeScript 概述
category:
  - TypeScript
tag:
  - 读书笔记
---

TypeScript 能让代码更好地弹性伸缩，它开发的程序更安全（类型安全）。

> 类型安全：借助类型避免程序做无效的事情。

TypeScript 除了消除与类型有关的一整类问题之外，还彻底改变了编写代码的方式，先在类型层面规划整个程序，再深入到值层面。
在设计过程中考虑边缘情况，使程序更简单、运行更快，且更易于理解和维护。

## 编译器

程序由一些文件构成，并由编译器解析，转换成抽象句法树（abstract syntax tree，AST）。编译器把 AST 转换成一种称为字节码（bytecode）的低层表示。

> AST 是去掉了空白、注释和缩进用的制表符或空格之后的数据结构。

运行程序：就是让运行时计算由编译器从源码解析得来的 AST 生成的字节码。步骤如下：

1. 把程序解析为 AST
2. 把 AST 编译成字节码
3. 运行时计算字节码

TypeScript 特殊之处：不直接编译成字节码，而是编译成 JavaScript 代码。

:::info TypeScript 是如何让代码更安全呢？
TypeScript 编译器生成 AST 之后，真正运行代码前，会对代码做**类型检查**。

> **类型检查器**：检查代码是否符合**类型安全要求**的特殊程序。
:::

使用 TypeScript，会在原来的编译流程上前置以下流程：

1. TypeScript 源码 -> TypeScript AST
2. 类型检查器检查 AST
3. TypeScript AST -> JavaScript 源码

:::warning 注意
程序中的类型对程序生成的输出没有任何影响，类型只在类型检查（第 2 步）这一步使用。意味着，可以随时更新类型，而不会破坏应用功能。
:::

## 类型系统

> 类型系统：类型检查器为程序**分配类型**时使用的一系列**规则**。

类型系统有两种：

1. 显式注解（形式：`value: type`，仅在必要时使用）
2. 自动推导（推荐）

### TypeScript VS. JavaScript

| 类型系统特性 | JavaScript | TypeScript |
| --- | --- | --- |
| 类型是如何绑定的？ | 动态 | 静态 |
| 是否自动转换类型 | 是 | 否（多数时候） |
| 何时检查类型？ | 运行时 | 编译时 |
| 何时报告错误 | 运行时 | 编译时（多数时候）|

JavaScript 是**动态绑定**的，在程序运行时才知道类型。

TypeScript 是**渐进式类型语言**，在编译时可以知道类型（即使没有类型，也能部分推导）。

JavaScript 是**弱类型语言**，执行无效操作也会进行**隐式转换**。

TypeScript 会在**编译时**对代码做类型检查，会对代码做**静态分析**。如时输入代码有错，会在编辑器内输入代码时显示，极大缩短了反馈时间。

## 代码编辑器设置

初始化 TypeScript 项目：

```shell
mkdir hello-ts
cd hello-ts

npm init
npm install --save-dev typescript tslint @types/node
```

### tsconfg.json

放在 TypeScript 项目根目录，用于定义要编译的源文件、目标目录、运行时版本等。

在根目录新建 tsconfig.json 文件（也可通过 `tsc --init` 生成），写入：

```json
{
  "compilerOptions": {
    "lib": ["es2015"],
    "module": "commonjs",
    "outDir": "./dist",
    "sourceMap": true,
    "strict": true,
    "target": "es2015",
  },
  "include": [
    "src"
  ]
}
```

简要介绍一下部分选项的作用：

| 选项 | 说明 |
| --- | --- |
| include | 指定要编译的文件或目录的路径，支持通配符。默认为 ["**/*"]。|
| lib | 指定要包含的库文件的列表。默认为 ["dom", "es5", "es2015.promise"]。|
| module | 指定要使用的模块系统。可选值为 "CommonJS"、"SystemJs"、"umd"、"ES2015" 等。默认为 "commonjs"。|
| outDir | 指定编译输出目录的路径。默认为 "./dist"。|
| strict | 开启所有严格类型检查选项。可选值为 true 或 false。默认为 false。|
| target | 指定编译后的 JavaScript 代码目标版本。可选值为 "ES3"、"ES5"、"ES2015"、"ES2016" 等。|

这些选项很少改动，偶尔需切换打包工具时修改 module 和 target 设置，需在浏览器中运行时在 lib 中添加 "dom"。

使用 tsconfig.json 可把配置纳入源码控制。可通过 `tsc --help` 命令查看更多选项。

### eslint.json

> 原文使用的是 TSLint，其官方维护已于 2019 年停止，会与 ESLint 合并，因此推荐使用 ESLint 代替 TSLint。

生成默认配置的 .eslintrc.js 文件：

```shell
# 根据提示操作
npx eslint --init
```

内容如下：

```js
module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  overrides: [],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
  },
  plugins: ['@typescript-eslint'],
  rules: {},
}

```

完整的规则列表参见 [ESLint 文档](https://eslint.org/)。

### index.ts

创建第一个 TypeScript 文件：

```shell
mkdir src
hello-ts touch src/index.ts
```

在 index.ts 中输入代码：

```ts
console.log('Hello TypeScript!')
```

编译并运行 TypeScript 代码：

```shell
tsc

node ./dist/index.js
```

控制台将看到一条日志：Hello TypeScript!
