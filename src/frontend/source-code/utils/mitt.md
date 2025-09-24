---
title: mitt 源码阅读笔记
date: 2023-04-07
category:
  - 读源码
tag:
  - utils
---

[mitt](https://github.com/developit/mitt) 是一个轻量级的 JavaScript 事件总线库，可以用于处理事件和消息传递。mitt 提供了一个简单而强大的 API，用于在程序中实现组件之间的松散耦合通信。

本文将探索 mitt 的源码，了解其实现原理。

## 了解 Event Emitter / Pub/Sub

在 JavaScript 中，事件发射器（Event Emitter）和发布-订阅（Pub/Sub）模式都属于行为型设计模式。

这两种模式都是用于在程序中实现组件之间的松散耦合，以便它们可以相互通信而不需要直接依赖彼此。这种松散耦合可以提高代码的可维护性和可扩展性。例如，Node.js 中的 EventEmitter 类是一个事件发射器的实现，而 RxJS 库提供了一个强大的发布-订阅模式的实现。

<!-- more -->

:::info 事件发射器模式
是一种基于事件的设计模式，它使用一个事件发射器对象来管理事件和事件监听器。事件发射器对象维护一个事件列表，其中每个事件都有一个名称和一个或多个事件监听器。当事件发射器对象触发一个事件时，所有监听该事件的事件监听器都会被调用，并传递给它们相关的数据。事件发射器模式通常用于**处理异步事件**，例如用户交互、网络请求和定时器等。
:::

:::info 发布-订阅模式
是一种基于消息的设计模式，它使用一个主题（或发布者）对象来管理消息和订阅者对象。主题对象维护一个消息列表，其中每个消息都有一个名称和一个或多个订阅者。当主题对象发送一条消息时，所有订阅该消息的订阅者都会收到该消息，并采取适当的行动。发布-订阅模式通常用于**处理解耦逻辑**，例如模块之间的通信、组件之间的通信和跨页面的通信等。
:::

## 源码解析

mitt 的核心源码只包含了一个函数，它返回一个事件管理对象（下面的代码移除 TypeScript 相关内容，以便于理解）。

```javascript
/**
 * 创建事件发射器，用于注册、移除和触发事件
 * @param {Map} all - 存储所有事件类型及其对应的处理函数的 Map 对象
 * @returns {Object} - 包含 all、on、off 和 emit 方法的对象
 */
function mitt(all) {
  all = all || new Map();

  return {
    // 事件名称与已注册的处理函数之间的映射表
    all,

    /**
     * 注册事件处理函数
     * @param {string} type - 要监听的事件类型（用 `'*'` 表示所有事件）
     * @param {function} handler - 响应指定事件时要调用的函数
     */
    on(type, handler) {
      // 获取事件类型对应的处理函数列表
      const handlers = all.get(type);
      // 已有处理函数，将新处理函数添加到处理函数列表；没有，则用新处理函数初始化处理函数列表
      if (handlers) {
        handlers.push(handler);
      } else {
        all.set(type, [handler]);
      }
    },

    /**
     * 注销事件处理函数
     * 如果省略 `handler`，则会注销所有指定类型的处理程序
     * @param {string} type - 要注销注册 `handler` 的事件类型（用 `'＊'` 删除通配符处理程序）
     * @param {function} handler - 要注销的处理函数
     */
    off(type, handler) {
      const handlers = all.get(type);
      if (handlers) {
        // 如果指定了要注销的事件处理函数，从处理函数列表中移除它；
        // 未指定，则将该事件类型的处理函数列表清空
        if (handler) {
          handlers.splice(handlers.indexOf(handler) >>> 0, 1);
        } else {
          all.set(type, []);
        }
      }
    },

    /**
     * 触发事件，调用指定类型的所有处理程序。
     * 如果存在，将在匹配类型的处理程序之后调用 `'*'` 处理程序。
     * 
     * 注意：不支持手动触发 '*' 处理程序
     * @param {string} type - 要触发的事件类型
     * @param {any} evt - 传递给每个事件处理函数的参数（推荐对象）
     */
    emit(type, evt) {
      let handlers = all.get(type);
      if (handlers) {
        // 如果有处理函数，依次调用处理函数并传入参数
        // 注：使用 slice 函数用于创建数组的副本，避免影响原始列表
        handlers
          .slice()
          .map((handler) => {
            handler(evt);
          });
      }

      // 获取通配符事件类型对应的处理函数列表，有则依次调用并传参
      handlers = all.get('*');
      if (handlers) {
        handlers
          .slice()
          .map((handler) => {
            handler(type, evt);
          });
      }
    },
  };
}
```

## 使用

```javascript
const emitter = mitt()

// 监听一个事件
emitter.on('foo', e => console.log('foo', e) )

// 监听所有事件
emitter.on('*', (type, e) => console.log(type, e) )

// 触发一个事件
emitter.emit('foo', { a: 'b' })

// 清除所有事件
emitter.all.clear()

// 使用处理函数引用
function onFoo() {}
emitter.on('foo', onFoo)   // 监听
emitter.off('foo', onFoo)  // 移除监听
```

## 技巧

### 巧用位运算符

```javascript
handlers.splice(handlers.indexOf(handler) >>> 0, 1);
```

`>>> 0` 是一种位运算技巧，用于将索引转换为非负整数（因为 JavaScript 中的位运算符只能用于 32 位整数）。

`handlers.indexOf(handler)` 返回指定处理函数在处理函数列表中的索引，如果处理函数不存在于列表中，则返回 -1。
此时，执行 `-1 >>> 0`，其结果为 4294967295，远大于 handlers 数组长度。
当 `splice()` 方法的第一个参数大于或等于数组的长度时，它不会删除任何元素。

这样做的目的是为了**避免出现负数索引值**，因为负数索引值会导致删除错误的处理函数。

:::info -1 >>> 0 的执行过程
在 JavaScript 中可使用 `>>>` 将有符号整数转为无符号整数。

将 `-1` 表示为二进制数，即 `11111111 11111111 11111111 11111111`。
执行无符号右移操作，将该二进制数向右移动 0 位，即不移动，得到的结果仍为 `11111111 11111111 11111111 11111111`。
将结果转换为十进制数，即 4294967295。因此，`-1 >>> 0` 的结果为 4294967295。
:::

### 创建数组副本

```javascript
handlers.slice().map((handler) => {
  handler(evt);
});
```

使用 `slice()` 方法可以在不修改原始数组的情况下创建一个新的数组副本，它包含原始数组中的所有元素，因此对新数组的操作不会影响原始数组。

除此之外，还有以下几种方式可复制数组：

- `arr.concat[]`
- 展开运算符 `[...arr]`
- Array.from(arr)

## 添加 TypeScript 类型

定义基础类型：

```typescript
export type EventType = string | symbol;

// 事件处理器，可选的事件参数，不返回值
export type Handler<T = unknown> = (event: T) => void;
// 定义一个通用的事件处理函数类型，可以处理多种不同类型的事件
export type WildcardHandler<T = Record<string, unknown>> = (
 type: keyof T, // 必须是 T 类型中的某个属性名称
 event: T[keyof T] // 必须是 T 类型中所有属性值的联合类型
) => void;

// 一个包含当前已注册的某种类型事件处理程序的数组
export type EventHandlerList<T = unknown> = Array<Handler<T>>;
export type WildCardEventHandlerList<T = Record<string, unknown>> = Array<WildcardHandler<T>>;

// 一个 Map 类型，用于存储事件类型及其处理函数列表
// 在 TypeScript 中，Map 是一个泛型类型，可以指定键和值的类型。例如，Map<string, number> 表示一个键为字符串类型，值为数字类型的 Map 对象。
export type EventHandlerMap<Events extends Record<EventType, unknown>> = Map<
  keyof Events | '*',
  // EventHandlerList<Events[keyof Events]> 表示一个处理 Events[keyof Events] 类型事件的处理函数列表，也就是说，事件类型为 Events 中所有属性值的联合类型。
  // WildCardEventHandlerList<Events> 表示一个处理所有事件类型的处理函数列表
  EventHandlerList<Events[keyof Events]> | WildCardEventHandlerList<Events>
>;
```

事件管理对象:

```typescript
export interface Emitter<Events extends Record<EventType, unknown>> {
  all: EventHandlerMap<Events>;

  on<Key extends keyof Events>(type: Key, handler: Handler<Events[Key]>): void;
  // 通配符事件类型 '*' 的重载
  on(type: '*', handler: WildcardHandler<Events>): void;

  off<Key extends keyof Events>(type: Key, handler?: Handler<Events[Key]>): void;
  off(type: '*', handler: WildcardHandler<Events>): void;

  emit<Key extends keyof Events>(type: Key, event: Events[Key]): void;
  emit<Key extends keyof Events>(type: undefined extends Events[Key] ? Key : never): void;
}
```

在 mitt 函数中使用上述定义的类型

```typescript
function mitt<Events extends Record<EventType, unknown>>(all?: EventHandlerMap<Events>): Emitter<Events> {
  // 两种事件处理器的联合类型
  type GenericEventHandler =| Handler<Events[keyof Events]> | WildcardHandler<Events>;

  return {
    on<Key extends keyof Events>(type: Key, handler: GenericEventHandler) {/*...*/},
    off<Key extends keyof Events>(type: Key, handler?: GenericEventHandler) {/*...*/},
    emit<Key extends keyof Events>(type: Key, evt?: Events[Key]) {/*...*/}
  };
}
```

## 构建

项目构建从 scripts 命令定义看起。

```json
{
  "scripts": {
    // 运行 "typecheck", "lint", "mocha" 和 "test-types" 命令
    "test": "npm-run-all --silent typecheck lint mocha test-types",
    // 运行 "test" 目录下的 mocha 测试
    "mocha": "mocha test",
    // 运行 TypeScript 编译器，检查 test/test-types-compilation.ts 文件的类型，但不生成任何输出
    "test-types": "tsc test/test-types-compilation.ts --noEmit --strict",
    // 运行 ESLint 检查 src 和 test 目录下的 .ts 和 .js 文件
    "lint": "eslint src test --ext ts --ext js",
    // 运行 TypeScript 编译器，检查 TypeScript 代码的类型，但不生成任何输出
    "typecheck": "tsc --noEmit",
    // 使用 microbundle 将模块打包成 ES、CommonJS 和 UMD 格式
    "bundle": "microbundle -f es,cjs,umd",
    // 运行 "clean", "bundle" 和 "docs" 命令
    "build": "npm-run-all --silent clean -p bundle -s docs",
    // 删除 dist 目录
    "clean": "rimraf dist",
    // 使用 documentation 工具生成 API 文档
    "docs": "documentation readme src/index.ts --section API -q --parse-extension ts",
    // 运行 "build", "test" 命令，提交代码，打标签，推送到 Git 仓库，发布到 npm
    "release": "npm run -s build -s && npm t && git commit -am $npm_package_version && git tag $npm_package_version && git push && git push --tags && npm publish"
  }
}
```

### 常用工具和命令

**`npm-run-all`**：提供简单的方式来运行多个 npm scripts 命令。如上面的 `npm-run-all --silent typecheck lint mocha test-types` 命令，将按照定义的顺序依次运行。

其它参数：

- `--silent`：禁止输出额外的信息，使输出更简洁
- `-p`：并行运行多个命令
- `-s`：指定一组任务按照顺序依次执行

**`rimraf`**：跨平台的 Node.js 模块，提供简单的方式来删除文件和目录。它的作用类似于 Unix/Linux 系统中的 `rm -rf` 命令，但也可以在 Windows 系统中使用。

**npm t**：`npm test` 的别名

### 测试

本库使用 `Mocha` 写测试，`mocha test` 命令会运行 mocha 测试，它会查找 `test` 目录下的测试文件，并执行这些测试。

其配置在 package.json 中，将会被 mocha 命令读取并应用到测试运行中:

```json
{
  "mocha": {
    // 指定测试文件的扩展名为 ".ts"
    "extension": [
      "ts"
    ],
    // 指定需要在测试运行前加载的模块。这里指定了 "ts-node/register" 和 "esm" 模块，它们分别用于支持 TypeScript 和 ES modules
    "require": [
      "ts-node/register",
      "esm"
    ],
    // 指定测试文件的位置，这里表示所有以 "_test.ts" 结尾的文件都会被作为测试文件运行
    "spec": [
      "test/*_test.ts"
    ]
  },
}
```

并使用 [`Chai`](https://github.com/chaijs/chai) 和 [`Sinon`](https://github.com/sinonjs/sinon) 库来进行单元测试。其中，Chai 提供了一组断言函数，用于判断测试结果是否符合预期，而 Sinon 则提供了一组用于创建测试所需的测试桩和测试桩验证函数等工具函数。

:::info Mocha
测试框架，可编写和运行代码测试。提供了简单灵活的语法来定义测试用例，并且可以与各种断言库一起使用，以对代码的行为进行断言。
Mocha 可以在浏览器和 Node.js 环境中运行测试，并通过使用回调、Promises 和 async/await 实现异步测试。

Mocha 还具有丰富的功能，例如测试分组、测试跳过和测试覆盖报告等。总的来说，Mocha 是一个确保 JavaScript 代码质量和正确性的好工具。
:::

### 类型检测

`tsc` 是 TypeScript 的编译器命令，用于将 TypeScript 代码编译为 JavaScript 代码。`--noEmit` 是 tsc 命令的一个选项，表示编译器不会将编译后的 JavaScript 代码写入到文件中，而只会对代码进行**类型检查和语法分析**等操作。

这个选项通常用于在开发过程中进行类型检查，而不生成任何实际的输出文件。这可在开发过程中尽早地发现类型错误，从而减少调试时间和代码错误。

:::warning
`--noEmit` 选项并不会完全禁止 tsc 编译器的输出，它仍然会向终端输出类型检查和语法分析的结果。可以使用 `--pretty false` 选项完全禁止 tsc 编译器的输出。
:::

### eslint

eslint 采用在 package.json 内配置的方式（也可使用独立的 `.eslintrc` 配置文件）。

```json
{
  "eslintConfig": {
    // 指定一个或多个已有的ESLint配置文件，以便继承其中的规则和选项
    "extends": [
      "developit",
      // plugin: 表示对 @typescript-eslint 插件下的某一类配置对象的引用
      "plugin:@typescript-eslint/eslint-recommended",
      "plugin:@typescript-eslint/recommended"
    ],
    // 专门用于解析 TypeScript 代码的解析器
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
      // 要解析的代码是 ES6 模块
      "sourceType": "module"
    },
    "env": {
      "browser": true,
      "mocha": true,
      "jest": false,
      "es6": true
    },
    // 指定了 expect 变量为全局变量，用于在测试中使用断言库
    "globals": {
      "expect": true
    },
    "rules": {
      // ...
    }
  },
  // 指定ESLint应该忽略的文件或目
  "eslintIgnore": [
    "dist",
    "index.d.ts"
  ]
}
```

- extends：指定要使用的ESLint配置。
- parser：指定解析器。
- parserOptions：指定解析器的选项。
- env：指定代码运行的环境。
- globals：指定全局变量。
- rules：指定要应用的规则。

### 其他 package.json 配置

以下属性都是为了让模块可以在不同的环境下被正确地导入和使用，以提高模块的可移植性和兼容性。同时，`microbundle` 打包时也可能用到其中的配置。

```json
{
  // 定义了 ES6 模块规范的入口文件。当使用现代打包工具（如 webpack、Rollup 等）构建项目时，会自动使用这个属性指定的文件作为入口，以支持 ES6 模块的导入和导出。
  "module": "dist/mitt.mjs",
  // 定义了 CommonJS 规范的入口文件。当使用 Node.js 运行时或者其他支持 CommonJS 规范的环境时，会自动使用这个属性指定的文件作为入口。
  "main": "dist/mitt.js",
  // 定义了 ES6 模块规范的入口文件。这个属性主要是为了向老版本的打包工具提供兼容性支持，因为老版本的打包工具不支持 module 属性。
  "jsnext:main": "dist/mitt.mjs",
  // 定义了 UMD 规范的入口文件。当使用不支持 ES6 模块或 CommonJS 规范的环境时，会自动使用这个属性指定的文件作为入口。
  "umd:main": "dist/mitt.umd.js",
  // 定义了源代码文件的入口。这个属性通常用于调试和开发环境，因为它可以让开发者在调试时直接跳转到源代码文件，而不是跳转到编译后的文件。
  "source": "src/index.ts",
  // 定义了 TypeScript 类型定义文件的路径。这个属性通常用于 TypeScript 项目，它告诉 TypeScript 编译器在编译时需要将这个文件作为类型定义文件使用。
  "typings": "index.d.ts",
  // 定义了模块的导出方式。是可以指定多个导出方式的对象，包括 import、require、types 和 default。以便在不同的环境下使用不同的导出方式，以适应不同的场景。
  "exports": {
    "types": "./index.d.ts",
    "import": "./dist/mitt.mjs",
    "require": "./dist/mitt.js",
    "default": "./dist/mitt.mjs"
  },
  // 用于指定哪些文件是该模块的一部分，这些文件将会被打包到该模块中，以便在其他项目中使用。
  // 默认情况下，所有文件都会被打包到该模块中，包括 node_modules 目录和测试文件等。
  "files": [
    "dist",
    "index.d.ts"
  ],
}
```

### 打包

本项目使用 [microbundle](https://github.com/developit/microbundle) 打包。`microbundle` 是一个零配置的 JavaScript 模块打包工具，可以将 JavaScript 模块打包成 CommonJS、ES modules 和 UMD 格式，从而可以在 Node.js 和浏览器环境中使用。

其特点是简单易用，无需配置，只需要在命令行中运行 `microbundle` 命令即可进行打包。另外，它还支持一些常用的特性，比如压缩、代码分离等等。

在 `microbundle -f es,cjs,umd` 命令中，`-f` 参数用于指定打包的格式，可以同时指定多个格式，用逗号隔开。
在这个命令中，`es` 表示打包成 ES modules 格式，`cjs` 表示打包成 CommonJS 格式，`umd` 表示打包成 UMD 格式。

如果不指定 `-f` 参数，默认情况下 microbundle 会打包成 CommonJS 和 ES modules 格式。

### 提交/发布

`release` 上提供了提交代码，打标签，推送到 Git 仓库，发布到 npm 等操作。

- `git commit -am $npm_package_version`：提交代码，并使用当前版本号作为提交信息。
- `git tag $npm_package_version`：打标签，并使用当前版本号作为标签名
- `git push`: 推送代码到 Git 仓库
- `git push --tags`: 推送标签到 Git 仓库
- `npm publish`：发布包到 npm

:::info $npm_package_version
是一个环境变量，它包含了当前项目的版本号。在 `npm scripts` 命令中，可以使用 `$npm_package_version` 来引用当前项目的版本号。这个环境变量是由 npm 在运行命令时自动设置的，无需手动设置。
:::

### Github 工作流

工作流用于在 GitHub 上进行持续集成（CI），配置文件放在 .github 目录下。

`.github/main.yml` 文件在项目的 `pull request` 和 `push` 事件中触发自动化构建和测试，配置如下：

```shell
# 定义名为 CI 的工作流
name: CI

on:
  # 当有新的 pull request 提交时，且提交的分支名符合 ** 通配符模式时；
  pull_request:
    branches:
      - "**"
  # 当在 main 分支上进行 push 操作时。
  push:
    branches:
      - main

jobs:
  # 定义名为 build 作业（job）
  build:
    # 指定运行环境为 ubuntu-latest
    runs-on: ubuntu-latest
    # 定义步骤
    steps:
      # 使用 actions/checkout@v2 动作来检出代码库
      - uses: actions/checkout@v2
      # 使用 actions/setup-node@v2 动作来安装 Node.js 运行环境，指定版本为 14
      - uses: actions/setup-node@v2
        with:
          node-version: 14
      # 定义一个名为 npm install, build, and test 的步骤
      - name: npm install, build, and test
        # 包含以下命令
        run: |
          npm install
          npm run build --if-present # 如果有定义 build 命令，则运行该命令，用于打包构建项目；
          npm test
        # 定义一个名为 CI 的环境变量，将其值设为 true
        env:
          CI: true

```

`compressed-size.yml` 工作流文件定义了一个名为 `Compressed Size` 的工作流，主要使用 `preactjs/compressed-size-action@v2` 动作来计算代码库中指定文件的压缩大小，pattern 参数用于指定要计算压缩大小的文件路径模式。

## 文档

本库的 API 文件使用 [documentation](https://github.com/documentationjs/documentation) 自动生成。

`documentation` 是一个 JavaScript 文档生成工具，它可以根据代码中的注释自动生成文档。它支持多种文档格式，包括 HTML、Markdown、JSON 和 DocPad 等。

如上文定义的 docs 命令，`"docs": "documentation readme src/index.ts --section API -q --parse-extension ts"`。该命令的作用在 `src/index.ts` 文件中查找 API 部分的注释（使用 `--section API` 参数），并将其转换为 Markdown 格式的文档输出到控制台（`readme` 参数）。其中，`-q` 参数表示以安静模式运行，不输出冗余信息，`--parse-extension ts` 参数表示解析 TypeScript 文件。

## 总结

mitt 是一个非常小巧、灵活的 JavaScript 事件管理库，它的源码非常简洁。通过分析 mitt 的源码，可以了解了它是如何实现事件管理的。

