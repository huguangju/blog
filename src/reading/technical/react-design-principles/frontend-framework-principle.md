---
title: 前端框架原理概览
category:
  - React
tag:
  - 读书笔记
---

## 始识前端框架

确定两个问题：

1. React 是库（library）还是框架（framework）?
2. Vue 号称是“构建用户界面的渐进式框架”，怎么样理解“渐进式”？

----

React 和 Vue 的核心：**构建UI的库**。由两部分组成：

1. 基于状态的声明式渲染
2. 组件化的层次结构

除此之外，还有其它功能：

- 状态管理方案：应对复杂应用的状态管理（如 Redux、Pinia）
- 客户端路由方案：SPA（如 React-Router、Vue-Router）
- SSR：首屏渲染提速、SEO 优化

除此之外，还有许多功能是 React/Vue 不包含的，如构建工具、数据流方案、文档工具等。**React/Vue 仅仅是库，而不是框架**。

可以称 **“包含库本身以及附加功能”的解决方案为框架**，例如：

- UmiJS：基于 React，内置路由、构建、部署等功能的前端框架
- AngularJS: 内置多种功能的前端框架

----

所有现代前端框架的实现原理，可以概括为以下公式：

$$UI = f(state)$$

> 其中：
>
> - state 代表：当前**视图状态**
> - $f$ 代表：框架**内部运行机制**
> - UI 代表：宿主环境的**视图**

即：**框架内部运行机制根据当前状态渲染视图**。

据此公式定义一个前端框架的**分类标准**，分析它们的技术特点与实现原理。

### 描述 UI

两种主流方案：JSX、模板语言。

JSX 是 Meta 提出的一种 “类 XML 语法” 的 ECMAScript 语法糖。如下语句：

```react
const element = <h1>Hello world</h1>
```

由编译工具（babel）编译后为：

```js
// React v17 之后
import { jsx as _jsx } from "react/jsx-runtime";
const element = /*#__PURE__*/_jsx("h1", {
  children: "Hello world"
});

// React v17 之前
const element = /*#__PURE__*/React.createElement("h1", null, "Hello world");
// 
```

> [在线查看](https://babeljs.io/repl#?browsers=defaults%2C%20not%20ie%2011%2C%20not%20ie_mob%2011&build=&builtIns=false&corejs=3.21&spec=false&loose=false&code_lz=MYewdgzgLgBApgGzgWzmWBeGAeAFgRgD4AJRBEGAdxACcEATbAegMKA&debug=false&forceAllTransforms=false&modules=false&shippedProposals=false&circleciRepo=&evaluate=false&fileSize=false&timeTravel=false&sourceType=module&lineWrap=true&presets=env%2Creact%2Cstage-2&prettier=false&targets=&version=7.21.3&externalPlugins=&assumptions=%7B%7D) JSX 编译后结果。

框架运行时执行后会得到如下数据，该数据会作用渲染 UI 的依据：

```js
{
  type: 'h1',
  key: null,
  ref: null,
  props: {
    children: 'Hello, world!'
  },
  _owner: null,
  _store: {}
}
```

----

React 团队认为 “UI 本质上与逻辑存在耦合的部分”。如：

- 在 UI 上绑定事件
- 在状态变化后改变 UI 的样式或结构

用 ES 同时编辑逻辑和描述 UI，可例 UI 与逻辑配合更密切。由于 JSX 是 ES 代码的语法糖，因此它可以更灵活地与其他 ES 语法组合使用。

JSX的 **灵活性** 可轻松描述 “复杂的 UI”，如与逻辑配合，即可描述 “复杂的 UI 变化”。

:::note
注：高灵活性意味着 JSX 需要牺牲 “潜在的编译优化空间”
:::

模板语言能够简练、直观地表达 U，但 **缺失逻辑的表达能力**（如 Mustache）。

随着前端与 Node.js 的发展，应用复杂度不断提高，以及前后端分离开始普及，“状态驱动 UI” 的前端框架应运而生。

JSX 与 模板语法都可以描述逻辑与 UI，但出发点不同。

- 模板语法：从 UI 出发，扩展 UI，描述逻辑
- JSX: 从逻辑出发，扩展逻辑，描述 UI

### 组织 UI 与逻辑

为了实现 **UI 与逻辑的关注点分离**，需要一种存放 UI 与逻辑的 **松散耦合单元**，即 **组件**。

需解释两个问题：

- 组件如何组织逻辑与 UI？
- 如何在组件间传输数据？

可借助数学中 “自变量与因变量” 的知识回答上述问题。考虑如下等式

$2x + 1 = y$

$x$ 的变化会导致 $y$ 的变化，其中 $x$ 被称为自变量，$y$ 被称为因变量。

在 React Hooks 中定义自变量：

```js
const [x, setX] = useState(0) // 初始值为 0 的自变量 x
console.log(x) // 取值
setX(1) // 赋值
```

自变量普遍由 getter（取值）与 setter（赋值）两部分组成。自变量变化会导致 “依赖它的因变量” 变化。

因变量有两种：有副作用 和 无副作用的因变量。

:::note
副作用: 函数式编程概念，指 “在函数执行过程中产生对外部环境的影响”。

除修改函数外部变量外，调用 DOM API、I/O 操作、控制台打印信息等 “函数调用过程中产生的，外部可观察的变化” 都属于副作用。
:::

因变量不需要赋值。“无副作用因变量” 应设计为纯函数，以减少业务开发过程中的潜在bug。

“自变量变化导致的副作用” 可以交由 “有副作用因变量” 处理，React Hooks 如下定义：

```js
// 当依赖的 x 变化，修改页面标题（副作用）
useEffect(() => document.title = x, [x])
```

回看第一个问题，即组件如何织织逻辑与 UI？

组件通过三种方式组织逻辑与 UI:

- 逻辑中的自变量变化，导致 UI 变化;
- 自变量变化，导致 “无副作用因变量” 变化，导致 UI 变化
- 自变量变化，导致 “有副作用因变量” 变化，导致副作用

### 组件间传输数据

组件的自变量或因变量通过 UI 传递给另一个组件，作为其自变量。

::: info 自变量分类
为区分不同方式产生的自变量，“组件内部定义的自变量”通常被称为 state(状态)，“其他组件传递而来的自变量” 被称为 props（属性）。
:::

当自变量需要 **跨层级传递**时，可通过 store 将自变量直接从 A 传到 C（假设有三个层级的组件，A > B > C）。store 本质上也是自变量，相比 state 它能实现跨层级传递。当项目需要大量使用 store 时，就需要管理 store 的方案（Redux、Pinia）。

:::info ClassComponent 与 Hooks 谁的开发体验更好？

- 使用 ClassComponent，需要了解各种生命周期的执行时机，甚至不同版本的 React 生命周期执行时机都有所区别；
- 使用 Hooks，仅需掌握 “自变量与因变量” 即可。
:::

### 前端框架分类依据

state 的本质是自变量，自变量通过直接或间接的方式改变 UI。“被改变的 UI” 仅仅是 “对实际宿主环境 UI 的 **描述**”，并不是实际宿主环境的 UI。

> 例如，JSX 语句仅是对 UI 的描述，需经前端框架处理才能在浏览器中显示真实 UI。

$UI = f(state)$ 中的 $f$ 的工作原理：

- 根据 state 变化计算出 UI 变化；
- 根据 UI 变化执行具体宿主环境 API。

前端框架需要关注 “自变量与 x 的对应关系”。随着 x 抽象层级不断下降，“自变量到 UI 变化” 的路径增多。路径越多，意味着前端框架在运行时消耗在寻找 “自变量与 UI 的对应关系” 上的时间越少。

所以，前端框架中 “与自变量建立对应关系的抽象层级” 可用为其分类依据，可分为三类：

- 应用级框架（React）
- 组件级框架（Vue）
- 元素级框架（Svelte）

### React 中的自变量与因变理

根据 “自变量与因变量” 理论为常见的 React Hooks 分类：

- `useState`: 定义组件内部的自变量（本质是“内置 reducer 的 useReducer”）
- `useReducer`: 同上，可以看作 “借鉴 Redux 理念的 useState”
- `useContext`: store 的实现，跨层级传递自变量
- `useMemo`: 采用 “缓存的方式” 定义组件内部 “无副作用因变量”
- `useCallback`: 同上，但缓存的值为函数式形
- `useEffect`: 定义组件内部 “有副作用因变量”

除此之外，`useRef` 可在定义 UI 与逻辑时能够跳出组件的限制，执行一些 “有副作用的操作”（如：自行操作 DOM）。

:::info useRef 的用处
是 reference（引用）的缩写，用于在组件多次 render 之间缓存一个 “引用类型的值”（在多次 render 间共享），可提供操作的灵活性。
:::

## 前端框架使用的技术

### 细粒度更新

在 React 中定义因变量时需要显示指明 “因变量依赖的自变量”，而在 Vue 中并不需要显示指明参数。 Vue 中使用的 “能自动追踪依赖的技术” 被称为 “细粒度更新”（Fine Grained Reactivity），它是 Vue 建立 “自变量变化到 UI 变化” 的底层原理。

实现简单的 “细粒度更新”：

```js
// 保存 effect 调用栈
const effectStack = []

function subscribe(effect, subs) {
  // 订阅关系建立
  subs.add(effect)
  // 依赖关系建立
  effect.deps.add(subs)
}

function cleanup(effect) {
  // 从该 effect 订阅的所有 state 对应的 subs 中移除该 effect
  for(const subs of effect.deps) {
    subs.delete(effect)
  }

  // 将该 effect 依赖的所有 state 对的应 subs 移除
  effect.deps.clear()
}

function useState(value) {
  // 保存订阅该 state 变化的 effect
  const subs = new Set()

  // 获取当前上下文的 effect
  const getter = () => {
    const effect = effectStack[effectStack.length - 1]
    if (effect) {
      // 建立订阅发布关系
      subscribe(effect, subs)
    }
    return value
  }

  const setter = (nextValue) => {
    value = nextValue
    // 通知所有订阅该 state 变化的 effect 执行
    for (const effect of [...subs]) {
      effect.execute()
    }
  }

  return [getter, setter]
}

function useEffect(callback) {
  const execute = () => {
    // 重置依赖
    cleanup(effect)
    // 将当前 effect 推入栈顶
    effectStack.push(effect)

    try {
      // 执行回调
      callback()
    } finally {
      // effect 出栈
      effectStack.pop()
    }
  }

  const effect = {
    execute,
    deps: new Set()
  }

  // 立刻执行一次
  execute()
}

function useMemo(callback) {
  const [s, setter] = useState
  // 首次执行 callback，次始化 value
  useEffect(() => set(callback()))
  return s
}
```

上面的 “细粒度更新” 版本的 Hooks 相比 React Hooks 有两个优点：

- 无需显示指明依赖
- 由于可自动跟踪依赖，因此不受 React Hooks “不能在条件语句中声明 Hooks” 的限制

:::info React Hooks 为何未使用细粒度更新呢？
因为 React 属于应用级框架，从关注 “自变量与应用的对应关系” 角度看，其更新粒度不需要很细。
:::

> 上述实现与 React 有一个区别，即 `getValue` 是函数，而不是自变量的值。Sold.js 使用了这种方式，Vue2/3 中分别使用对象的存取描述符和 Proxy 封装了 getValue，隐藏了其实际是函数的细节。

### AOT

现在前端框架需要 “编译” 这一步，用于：

- 将 jsx 转为浏览器可识别代码
- 代码转换、实现 polyfill等
- 编译时优化
- 代码打包、压缩、混淆

“编译” 可选择两个执行时机：

- 代码构建时，称为 AOT（Ahead Of Time，预编译）
- 在宿主环境执行时，称为 JIT（Just In Time， 即时编译）

:::info AOT 和 JIT 的区别
Angular 同时提供这两种编译方案，此处以其举例以说明两者区别。

在模板中使用未定义的方法，如果使用 AOT，代码在编译后就会立刻报错。如果使用 JIT，则代码在编译后不会报错，而是在浏览器中执行时报错。

原因是：使用 JIT时，构建阶段仅使用 tsc 将 TS 编译为 JS 并将代码打包，在浏览器执行到 Decorator 时，Angular 的模板编译器才开始编译 template 字段包含的模板语法，并报错。

当使用 AOT 时，tsc、Angular 的模板编译器会在构建阶段进行编译，立刻能发现错误。

除此之外，使用 JIT 还有以下区别：

- 首次加载时慢于 AOT 应用，因为需先编译代码；
- 代码体积可能大于使用 AOT 应用，因为在运行时会增加编译器代码。

综上，Angular 一般在开发环境中使用 JIT，生产环境中使用 AOT。
:::

借助 AOT 对模板语法编译时的优化，可以减少 “根据自变量变化计算出 UI 变化” 的开销， “采用模板语法描述 UI” 的前端框架都会进行此优化（如 Vue3、Angular、Svelte）。

基本质原因：模板语法是固定的，意味着 “可分析”，在编译时可标记模板语法中的静态部分与动态部分，在寻找 “变化的 UI” 时可跳过静态部分。

> Svelte、Solid.js 甚至利用 AOT 在编译时直接建立 “自变量与 UI 中动态部分的关系 ”，在运行时，自变量发生变化后，可以直接根据 UI 变化执行具体的宿主环境 API。

“采用 JSX 描述 UI” 的前端框架则难以从 AOT 中受益。原因：ES 语句的灵活性使用其很难进行静态分析。

有两个思路实现上述框架在 AOT 中受益：

- 使用新的 AOT 实现
- 约束 JSX 的灵活性

第一种思路 React 尝试过，于 2019 年暂停的 prepack 项目，用于实现 AOT 优化。其思路：在保持运行结果一致下，改变源代码运行逻辑，输出性能更高的代码。即 “代码在编译时将计算结果保留在编译后的代码中”。

Solid.js 同样使用 JSX，它基于第二种思路，实现了几个内置[控制流](https://www.solidjs.com/docs/latest/api#%E6%8E%A7%E5%88%B6%E6%B5%81)工具，用于 “在 UI 中描述逻辑”，从而减少 JSX 的灵活性。如 `<For />`、`<Show />`、`<Switch>/<Match>`

综上可知，对框架工作原理影响较大的是：减少 “根据自变量变化计算出 UI 变化” 这一步骤的工作量。

### Virtual DOM

虚拟 DOM（简称 VDOM）是实现 “根据自变量变化计算出 UI 变化” 的主流技术，其工作原理可概括为两个步骤：

1. 将 “元素描述的 UI” 转化为 “VDOM 描述的 UI”；
2. 对比变化前后 “VDOM 描述的 UI”，计算出 UI 中发生变化

使用 VDOM 的框架大体遵循以上步骤，仅细节上有区别。比如：

- Vue 使用模板语法描述 UI，模板语法编译为 render 函数
- React 使用 JSX 描述 UI, JSX 编译为 `createElement` 方法

VDOM 的本质是 **对 UI 的描述**。

其优点如下：

- 相较于 DOM 的体积优势（DOM 包含大量冗余的属性）；
- 相较于 AOT 更强的描述能力；
- 跨平台渲染的抽象能力。

相比于 AOT，“采用 VDOM 的前端框架” 在运行时也能拥有极好的性能。可用 [krausest/krausejs-framework-benchmark](https://github.com/krausest/js-framework-benchmark) 测试不同前端框架在不同场景下的性能基准。

可见，对于粒度越细的更新，AOT 的优势越大。

## 前端框架的实现原理

### Svelte

Svelte 的 API 设计继承自 Ractive（与 Vue 类似），但与 Vue 在框架实现上有极大不同。原因在于：Svelte 是重度依赖 AOT 的元素及框架。

借由模板语法的约束，经过 AOT 的编译优化，Svelte 可以直接建立 “自变量与元素的对应关系”。在运行时省略了 “根据自变量计算出 UI 变化” 这一步骤，使用其在执行 “细粒度的更新”（比如更新大列表中的某一行）时比 “使用 VDOM 的框架” 的整体更新路径更短。

### Vue3

组件级前端框架，会建立 “自变量与组件的以应关系”，并在此基础上通过 VDOM 寻找 “自变量变化到 UI 变化的关系”。使用模板主语法描述 UI 使用其可从 AOT 中受益。

示例如下：

```js
<script setup>
import { ref } from 'vue'
let count = ref(0)
</script>
<template>
  <h1 @click=count++>{{ count }}</h1>
</template>
```

Vue3 会为每个组件都建立 `watchEffect`，`watchEffect` 的回调函数会在 “watchEffect 首次执行时” 以及 “watchEffect 依赖的自变量变化后” 执行如下步骤：

(1). 调用组件的 render 函数，生成组件对应的 VNode;

上面的示例编译生成的 render 函数如下：

```js
let count = ref(0)
return render(_ctx, _cache) => {
  return (_openBlock(), _createElementBlock("h1", {
    onClick: _cache[0] || (_cache[0] = $event => (_isRef(count) ? count.value++ : count++))
  }, _toDisplayString(_unref(count)), 1 /* TEXT */))
}
```

> 可在 [Vue SFC playground](https://sfc.vuejs.org/) 查看完整的编译结果。

当自变量发生变化后，effect 会重新执行，`render` 函数执行后，内部的自变量变化（count 的变化）会被该 effect 订阅。

(2). 步骤（1）完成后， render 函数的返回值为本次更新的 VNode，它会与上次更新的 VNode 同时传入 `patch` 方法，执行 VDOM 相关操作，找到 “本次自变量变化导致的元素变化”，并最终执行对应的 DOM 操作。

点击事件导致 count 发生变化时，Vue3 将执行 “订阅 count 变化的 effect 回调函数”，重复以上两个步骤，完成 UI 渲染。完整的对应关系：

- “自变量变化” 对应 “effect 回调函数执行”；
- “effect 回调函数执行” 对应 “组件 UI 更新”；

所以 Vue3 被称为组件级框架。

**Vue3 如何从 AOT 中受益？**

模板代码如下：

```html
<div>
  <h3>hello</h3>
  <p>{{ name }}</p>
</div>
```

模板代码对应的 VNode 会在 patch 方法中一一进行比较。

上述模板中只的 P 元素是可变的，其余的比较无意义。其编译后的代码如下所示：

```js
let name = ref('world')
return (_ctx, _cache) => {
  return (_openBlock(), _createElementBlock("div", null, [
    _hoisted_1,
    _createElementVNode("p", null, _toDisplayString(_unref(name)), 1 /* TEXT */)
  ]))
}
```

P 元素所对应的 `_createElementVNode` 函数第 4 个传参（`PatchFlags`）为 1，代码该 VNode 是可变的（不同值代表不同类型）。

通过减少运行时 VDOM 需要对比的节点，**运行时性能将得到提高**。

### React

实现步骤：

1. 触发事件，改变自变量，开启更新流程；
2. 执行 VDOM 相关操作，在 React 中被称为 reconcile；
3. 根据步骤 2 计算出的 “需要变化的 UI” 执行对应的 UI 操作，在 React 中被称为 commit。

React 被称为应用级框架的原因：其每次更新流程都是从应用的根节点开始，遍历整个应用。对比其他框架：

- Vue3 的更新流程开始于组件
- Svelte 的更新流程开始于元素

React 中任何自变量的变化都会开启一次遍历应用的更新流程。

:::info 每次更新都遍历应用，性能会差吗？
不会。原因有两点：

- React 内部有优化机制
- 为开发者提供了相关 API 用于 “减少无意义的遍历过程”，如 `shouldComponentUpdate`、`React.memo` 等
:::

:::info Vue 中为何没有这些性能优化 API？
组件级框架的定位和 AOT 优化已减少了大部分无意义的遍历过程。
:::

**由于 React 没有完成这部分性能优化的任务，因此这部分工作交到了开发者手中。**

React 还拓展了许多新功能：

- 优先级调度
- Time Slice (时间切片)
- Hooks
- Suspense
