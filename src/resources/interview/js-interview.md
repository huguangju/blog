---
title: JavaScript 面试题
article: false
---

## 关键点

- 语法：
  - 数据类型、作用域、原型链、继承、事件循环、闭包、this 指向
  - ES6: 箭头函数、Promise、async/await、Proxy、Set/Map、Symbol、生成器
- 应用：节流与防抖、深拷贝、跨域、并发控制、尾递归优化
- 打包构建：模块化、Webpack、babel、rollup、vite
- 性能优化：首屏速度、大数据渲染、懒加载、代码优化、构建优化

## 面试题

### 变量和类型

- 如何理解值类型和引用类型？
- 有哪些判断类型的方式？以及它们的优缺点
- 可能发生隐式类型转换的场景以及转换原则

### 原型和原型链

- `New` 的实现原理？
- 有哪些方式可以实现继承？分别有哪些优缺点？
- call/apply/bind 实现原理是什么？
- `instanceof` 的底层实现原理，如何实现一个 instanceof？
- 理解 ES6 class 构造以及继承的底层实现原理

### 作用域和闭包

- 理解词法作用域和动态作用域
- 对 JS 执行上下文栈和作用域链的理解？
- 什么是闭包？闭包的使用场景？
- `this` 的原理？如何正确判断 `this` 指向？
- 如何处理循环的异步操作？
- 理解模块化解决的实际问题，可列举几个模块化方案并理解其中原理

### 执行机制

- 为何 `try` 里面放 `return`，`finally` 还会执行，理解其内部机制
- 什么是异步编程？JS 是如何实现的？
- 详述事件循环（Even Loop）机制
- 什么是宏任务（MacroTask）和微任务（MicroTask）？以及它们的区别及应用？
- DOM 事件和事件循环的关系？

### 语法和API

- async/await 和 Promise 有什么关系？
- 熟练应用 map、reduce、filter 等高阶函数解决问题
- 常用正则表达式（邮箱校验、URL解析、去重等）
- 介绍下 Map、Set、WeakMap 和 WeakSet 的区别？
- 异常处理的方式，统一的异常处理方案

### Web API

- DOM 节点操作有哪些方式？
- 如何优化 DOM 操作的性能？
- 事件传播的三个阶段是什么？描述事件绑定和冒泡的过程？
- 什么是事件代理？
- 如何理解 cookie？
- localStorage、SessionStorage 和 cookie 的区别？
- 如何实现网页多标签 tab 通讯
- 如何实现网页和 iframe 之间的通讯

### 应用

- 防抖函数的作用是什么？如何实现？
- 节流函数的作用是什么？有哪些应用场景？
- 如何把嵌套的数组扁平化？
- 如何生成一个递增数列的数组？
- 如何解析 url 参数?
- JS 闭包会导致内存泄漏吗 ？JS 内存泄漏的场景有哪些？
- 小数精度丢失问题如何解决？
- 深拷贝和浅拷贝的区别？如何实现深拷贝？
- 柯里化函数实现
- 手写 Promise（then的链式调用、all、race、finally）
- 手写 call、apply、bind
- 手写 EventEmitter 事件发布/订阅
- 手写模版引擎，并解释其中原理

## 参考

- [lydiahallie/javascript-questions - JavaScript 进阶问题列表](https://github.com/lydiahallie/javascript-questions/blob/master/zh-CN/README-zh_CN.md) 👍
- [每个 JavaScript 工程师都应懂的33个概念](https://github.com/stephentian/33-js-concepts) 👍
- [(建议精读)原生JS灵魂之问(中)，检验自己是否真的熟悉JavaScript？](https://juejin.im/post/5dbebbfa51882524c507fddb)