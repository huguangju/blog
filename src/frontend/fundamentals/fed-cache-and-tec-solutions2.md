---
title: 前端缓存与技术方案（下）
date: 2023-02-17
category:
  - 基础
tag:
  - 缓存
---

## HTTP 缓存方案

### 前端应用中的 HTTP 缓存方案

当访问单页应用（SPA）的首页时，浏览器率先加载的是 HTML 文件，后续再按需加载其它公共资源。刷新页面，可观察 HTML 资源是走的协商缓存，其它大部分资源都命中了强缓存。

因为像 JS、CSS 等资源经过像 webpack 这样的打包工具打包后可以自动生成 hash 文件名，资源变化会导致 hash 名更新。而 HTML 的文件名不会改变。

但我们期望浏览器每次加载时都应该向服务器询问是否更新。否则会出现新版本发布后，浏览器读取缓存 HTML 文件，会导致页面空白报错（旧资源被删除）或应用没有更新（读取了旧资源）的问题。

<!-- more -->

根据 HTTP 缓存的规则可使用以下缓存方案：

- 频繁变动的资源，比如 HTML，采用协商缓存
- CSS、JS、图片资源等采用强缓存，使用 hash 命名

**如何让 HTML 文件走协商缓存？**

前提：先让浏览器强缓存失效。可以设置如下服务器响应报头：

```http
Cache-Control: max-age=0
Last-Modified: Sat, 04 Sep 2021 08:59:40 GMT
```

在资源 0 秒就失效的情况下，存在协商缓存触发条件的 `Last-Modified` 标识，这样每次访问加载的 HTML 资源就会确保是最新的，解决了 HTML 被浏览器强缓存的问题。

### Webpack 中的 Hash 模式

在 Webpack 中，有三种常见的哈希类型，分别是 `hash`、`chunkhash` 和 `contenthash`。

**`hash`**

默认使用。项目级别的 hash，整个项目生成一个唯一的哈希值（即使只修改了一个文件，也会导致所有的文件名都发生变化导致缓存失效，不建议使用）。

**`chunkhash`**

入口文件（entry）级别的 hash，基于每个 chunk 的内容生成一个哈希值。因此，当项目中只有部分文件发生变化时，只有受影响的 chunk 的哈希值会发生变化(可通过 `CommonsChunkPlugin` 插件进行公共模块的提取，将公共库、插件打包成独立文件)。
  
**`contenthash`**

文件内容级别的 hash，基于文件内容生成的哈希值，在文件内容发生变化时，对应的哈希值才会变化。因此，当项目中只有部分文件发生变化时，只有受影响的文件的哈希值会发生变化。

比如，一个 a.js 文件中引入了 a.css，那么当 js 文件被修改后，就算 css 文件并没有被修改，由于该模块发生了改变，同样会导致 css 文件也被重复构建。
此时，针对 css 使用 `contenthash` 后，只要其内容不变就不会被重复构建。

**为了最大化利用 HTTP 缓存中的强缓存优势，可以使用 Webpack 中的 `[contenthash]` 和 `[chunkhash]` 两个 hash 值来命名输出的文件，以减少不必要的资源重复请求，提升网页的整体打开速度。**

## 用户操作与 HTTP 缓存

### Chrome 的三种加载模式

在开发者工具打开时，Chrome 提供了三种加载模式（浏览器刷新按钮上右键鼠标可显示）。

模式一：**正常重新加载**

```text
Mac: Command + R 快捷键
Windows: Ctrl + R（等同于直接按 F5）
```

和直接点击浏览器上的刷新按钮效果一样，触发该模式在控制台可以看到大多数资源会命中强缓存，即会优先读取缓存。

模式二：**硬性重新加载**

```text
Mac: Command + Shift + R
Windows: Ctrl + Shift + R（等同于直接按 Ctrl + F5）
```

常说的“强制刷新网页”，比如部署代码后仍然访问的是“旧”页面，使用强制刷新（Ctrl + F5）后，所有资源都会重新向服务器获取。

检查请求报头可以发现，所有资源的请求首部都被加上了 `cache-control: no-cache` 和 `pragma: no-cache`，两者的作用都表示告知（代理）服务器不直接使用缓存，要求向源服务器发起请求，而 `pragma` 则是为了兼容 `HTTP/1.0`。

因此**硬性重新加载并没有清空缓存，而是禁用缓存**。其效果类似于在开发者工具 Network 面板勾选了 `Disable cache` 选项。

#### 模式三：清空缓存并硬性重新加载

比硬性重新加载多了清空缓存的操作，会将浏览器存储的本地缓存都清空掉（所有访问过的网站缓存都将被清除），再重新向服务器发送请求。

#### 为什么 Ctrl + F5 还是命中了缓存

资源在硬性重新加载后还是命中缓存，说明请求报头上并没有加上特定的两个首部。命中缓存的资源都是随着页面渲染而加载的，而不走缓存的则是等待页面加载完通过脚本异步插入到 DOM 中去的，即**资源异步加载命中缓存不受硬性重新加载控制**。

:::info Tips
如果采用开发者工具 Network 面板勾选 `Disable cache` 选项方式，那么异步资源也不会读取缓存，原因是缓存被提前禁用了，这与硬性重新加载不同。
:::

:::info base64 图片缓存
base64 格式的图片几乎永远都是 `from memory cache`，因为浏览器为了节省渲染开销而将其缓存到内存中。
:::

## Nginx 与跨域问题

在前端开发中，Nginx 通常被用来解决跨域问题。跨域问题是由于浏览器的同源策略导致的，为了解决这个问题，可以通过设置响应头中的 `Access-Control-Allow-Origin` 来指定允许访问的域名。因此，在前端访问后端跨域时，需要检查服务端或者 Nginx 配置的 `Access-Control-Allow-Origin` 是否包含前端域名。

有些时候 `Access-Control-Allow-Origin` 被设置成 * 代表允许所有域名访问，但可能还会报跨域，其根源其实在前端。比如前端使用 Axios 请求库时如果开启了以下配置：

```js
axios.defaults.withCredentials = true // 允许携带 cookie
```

此时服务端配置 Access-Control-Allow-Origin 时就不能为 *，或者针对该类型的接口前端请求关闭该配置即可。

同时当前端配置了 `axios.defaults.withCredentials = true` 时，服务端需配置 `access-control-allow-credentials: true`。

如果浏览器发起了预检请求，那么可能还需要配置 `access-control-allow-methods` 和 `access-control-allow-headers` 报头为允许的值。比如：

```http
access-control-allow-headers: Content-Type,Content-Length,Authorization,Accept,X-Requested-With
access-control-allow-methods: PUT,POST,GET,DELETE,OPTIONS
```

所谓**预检请求**，也就是浏览器控制台经常会看到的 `OPTIONS` 请求。

### 使用 Nginx 配置响应报头

**修改跨域相关配置**
如果要修改上述的跨域配置，那么首先找到对应的应用端口，修改 `location /` 中的参数：

```nginx
server {
    listen 80;
    location / {
        add_header Access-Control-Allow-Origin *; 
        add_header Access-Control-Allow-Methods 'PUT,POST,GET,DELETE,OPTIONS'; 
        add_header Access-Control-Allow-Headers 'Content-Type,Content-Length, Authorization, Accept,X-Requested-With';
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
}
```

**修改缓存相关配置**
Nginx 主要修改缓存方式和过期时间的配置。比如不想 HTML 文件命中强缓存，希望其走协商缓存，可以添加如下响应报头配置：

```nginx
server {
    listen 80;
    location / {
        if ($request_filename ~* .*.(html|htm)$) {
            add_header Cache-Control 'no-cache';
        }
    }
}
```

而像 js、css 和图片这样的静态资源，希望浏览器命中强缓存，nginx 可以设置相应的过期时间：

```nginx
server {
    listen 80;
    location ~ .*.(gif|jpg|jpeg|png|bmp|swf|js|css)$ {
        expires 1d;
    }
}
```

上述配置以 1 天为例，最终浏览器将返回响应报头 `Cache-Control: max-age=86400`。

## Memory Cache 与 Disk Cache

### Memory Cache

一种缓存机制，用于存储最近访问的资源，例如图片、CSS 和 JavaScript 文件等。它存储在内存中，读取速度快，可以减少网络请求，提高网页加载速度。但是它的容量较小，不适合存储大型文件。

### Disk Cache

可以将一些已经访问过的网页资源保存在本地硬盘上，以便下次访问同一网页时可以更快地加载资源，提高网页加载速度和用户体验。优点是生命周期长，不触发删除操作则一直存在，而缺点则是获取资源的速度相对内存缓存较慢。

Disk Cache 会根据保存下来的资源的 HTTP 首部字段来判断它们是否需要重新请求，如果重新请求那便是强缓存的失效流程，否则便是生效流程。

## 浏览器缓存机制

### 缓存获取顺序

当一个资源准备加载时，浏览器会根据其**三级缓存原理**进行判断：

- 浏览器会率先查找内存缓存，如果资源在内存中存在，那么直接从内存中加载
- 如果内存中没找到，接下去会去磁盘中查找，找到便从磁盘中获取
- 如果磁盘中也没有找到，那么就进行网络请求，并将请求后符合条件的资源存入内存和磁盘中

### 缓存存储优先级

除了 base64 的图片永远从内存加载外，其他大部分资源会从磁盘加载。

磁盘缓存会将命中强缓存的 JS、CSS、图片等资源保存下来。而内存缓存仅会保存合适的内容。

浏览器内存缓存生效的前提下，JS 资源的执行加载时间会影响其是否被内存缓存。此外图片资源（非 base64）也有和 JS 资源同样的现象，而 CSS 资源比较与众不同，其被磁盘缓存的概率远大于被内存缓存。

### Preload 与 Prefetch

`preload` 也称为预加载，用于在页面加载时预加载资源，以提高页面的性能和用户体验。通过使用 `<link rel="preload">`，浏览器可以在页面加载时提前下载一些资源，以便在后续的页面渲染过程中更快地获取这些资源。

注意，预加载资源并不一定会被浏览器缓存，因此在使用时，需要根据具体情况来决定是否需要设置缓存策略。另外，预加载资源也可能会对服务器造成额外的负担，因此需要谨慎使用。

`preload` 则表示预提取，用于在**空闲时间**预加载资源，以提高页面的性能和用户体验。`<link rel="prefetch">` 不会在页面加载时立即下载资源，而是在浏览器空闲时下载资源，以便在后续的页面渲染过程中更快地获取这些资源。

使用 prefetch 加载的资源，刷新页面时大概率会从磁盘缓存中读取，如果跳转到使用它的页面，则直接会从磁盘中加载该资源。

## Service Worker

### PWA

PWA 全称为 Progressive Web Apps，是一种可以像本地应用一样提供快速、可靠和具有类似原生应用体验的 Web 应用。

PWA 的实现需要借助 Service Worker 技术和 Web App Manifest 文件。
PWA 技术的出现，使得 Web 应用在移动端能够更好地满足用户对于快速、可靠和具有本地应用体验的需求。

以下是 PWA 的几个主要特性：

- **可靠性**：PWA 可以在离线状态下访问，具有快速的加载速度和可靠的性能。

- **快速性**：PWA 具有快速的加载速度，可以在几秒钟内快速加载应用程序。

- **独立性**：PWA 可以像本地应用一样运行，不需要安装，也不需要从应用商店下载。

- **用户体验**：PWA 具有类似原生应用的 UI 交互体验，可以提供推送通知、添加到主屏幕、后台服务等原生应用所具备的功能。

- **安全性**：PWA 使用 HTTPS 协议进行通信，可以提供更高的安全性和保护用户隐私的能力。

- **可发现性**：PWA 可以被搜索引擎索引，可以通过链接分享和搜索引擎等方式被用户发现和访问。

### Service Worker 介绍

Service Worker 的本质是一种 JavaScript 脚本，它运行在浏览器的后台线程中，独立于网页主线程，可以拦截和处理网页发出的网络请求，从而可以实现离线缓存、消息推送等功能。
因为它是运行在后台线程中的，所以即使用户关闭了网页，Service Worker 仍然可以继续运行。这使得 Service Worker 成为一种非常有用的技术，可以用来提高网页的性能和用户体验。

Service Worker 依赖 [Cache API](https://developer.mozilla.org/zh-CN/docs/Web/API/Cache) 和 [Fetch API](https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API) 来实现离线缓存和网络请求拦截。**Service Worker 缓存是持久的，独立于浏览器缓存或网络状态**。

**生命周期与缓存**
Service Worker 的生命周期包括以下几个阶段：

- 注册：Service Worker 脚本被注册到浏览器中，此时脚本还没有被激活。

- 安装：Service Worker 脚本被下载到浏览器中，并进行安装。在安装阶段，通常会进行一些初始化操作，例如打开缓存等。

- 激活：Service Worker 脚本被激活，此时可以开始拦截网络请求并进行缓存操作。

- 运行：Service Worker 脚本开始运行，可以处理网络请求并进行缓存操作。

- 更新：Service Worker 脚本被更新，此时会重新执行安装和激活阶段，并且可以清除旧的缓存。

在 Service Worker 的生命周期中，缓存是一个非常重要的概念。在安装阶段，通常会打开一个缓存，将需要缓存的资源添加到缓存中。在激活和运行阶段，可以从缓存中读取资源，并且可以将新的资源添加到缓存中。通过缓存，可以实现离线缓存和网络请求拦截等功能，从而提高网页的性能和用户体验。

注意，Service Worker 缓存的资源是有时效性的，因为缓存中的资源可能会过期或者被更新。因此，在更新 Service Worker 脚本时，通常需要清除旧的缓存，以便新的资源可以被缓存。

**注册**
通常会编写以下脚本进行 Service Worker 的注册：

```js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/service-worker.js').then(function(registration) {
      console.log('Service Worker registered:', registration);
    }, function(error) {
      console.log('Service Worker registration failed:', error);
    });
  });
}
```

这段代码首先检查浏览器是否支持 Service Worker，如果支持，则在页面加载完成后注册 Service Worker。`navigator.serviceWorker.register` 方法用于注册 Service Worker，参数是 Service Worker 脚本的 URL。注册成功后，会返回一个 `ServiceWorkerRegistration` 对象，可以用来管理 Service Worker 的生命周期。

默认情况下，Service Worker 的作用范围不能超出其脚本所在的路径。如果该脚本放在根目录下，则代表项目根目录下的所有请求都可以被代理。当然，也可以在注册时使用 `scope` 参数指定对应的作用域。

**安装**
在安装阶段，通常会进行以下几个步骤：

- 下载脚本：浏览器会下载 Service Worker 脚本，并将其保存到缓存中。

- 缓存静态资源：在 Service Worker 脚本中，可以通过 `CacheStorage` API 将一些静态资源添加到缓存中，从而实现离线缓存和快速加载等功能。在安装阶段，通常会将一些静态资源添加到缓存中。

- 安装完成：当 Service Worker 脚本下载完成并缓存静态资源后，安装阶段就完成了。此时，Service Worker 还没有被激活，因此无法拦截网络请求。

在这个阶段，Service Worker 开始接管网络请求，但并不一定立即生效，因为它需要等待所有已打开的页面关闭后才会生效。

**激活**
在 Service Worker 激活阶段，可以执行一些操作，例如：

- 缓存静态资源：可以在激活阶段缓存一些静态资源，这样在后续的请求中就可以直接从缓存中获取，从而提高页面加载速度。

- 清理旧版本缓存：如果我们更新了 Service Worker，可能会有一些旧版本的缓存仍然存在，这些缓存可能会导致页面出现问题。在激活阶段，可以清理这些旧版本的缓存，保证页面正常运行。

- 发送通知：可以在激活阶段发送一些通知，告知用户 Service Worker 已经更新，或者一些其他信息。

注意，Service Worker 激活阶段只有在 Service Worker 注册成功后才会触发，如果注册失败，则不会进入激活阶段。另外，如果 Service Worker 更新失败，则不会触发激活阶段，而是继续使用旧版本的 Service Worker。

**运行**
在 Service Worker 注册成功并且激活后，它开始接管网络请求，处理客户端的请求并返回响应的阶段。

在 Service Worker 运行阶段，我们可以执行一些操作，例如：

- 缓存网络请求：可以在 Service Worker 运行阶段缓存一些网络请求，这样在后续的请求中就可以直接从缓存中获取，从而提高页面加载速度和离线访问能力。

- 拦截请求：可以在 Service Worker 运行阶段拦截客户端发送的请求，对请求进行处理，然后返回响应。这样可以实现一些高级的功能，例如离线访问、网络请求代理、请求重定向等。

- 推送消息：可以在 Service Worker 运行阶段向客户端推送消息，例如通知用户有新消息、提醒用户更新等。

注意，Service Worker 运行阶段是一个长期运行的过程，直到 Service Worker 被注销或者浏览器关闭。需要注意一些问题，例如缓存策略、请求处理、错误处理、性能优化等。

**更新**
指在已经注册并激活的 Service Worker 更新后，新版本的 Service Worker 开始接管网络请求的过程。

当一个新版本的 Service Worker 被注册后，它会等待所有已打开的页面关闭，然后进入激活阶段。在激活阶段，我们可以执行一些操作，例如清理旧版本缓存、发送通知等。然后新版本的 Service Worker 就会开始接管网络请求，处理客户端的请求并返回响应。

在 Service Worker 更新阶段，需要注意一些问题，例如：

- 缓存策略：如果我们在新版本的 Service Worker 中修改了缓存策略，可能会导致客户端缓存出现问题。因此在更新 Service Worker 时需要注意缓存策略的兼容性。

- 请求处理：如果我们在新版本的 Service Worker 中修改了请求处理逻辑，可能会导致客户端请求出现问题。因此在更新 Service Worker 时需要注意请求处理逻辑的兼容性。

- 错误处理：如果新版本的 Service Worker 出现了错误，可能会导致客户端请求出现问题。因此在更新 Service Worker 时需要注意错误处理的兼容性。

注意，如果新版本的 Service Worker 更新失败，可能会导致客户端出现问题。因此在更新 Service Worker 时需要进行充分的测试和验证，确保更新过程的稳定性和可靠性。

**出于安全考虑，Service worker 只能在 https 及 localhost 下被使用。**

## 存储型缓存

### 网站登录背后的存储逻辑

用户在客户端输入账号密码并点击登录后，前端将数据发送给服务端进行验证。如果校验成功，服务端会返回有效的 token 信息，后续客户端请求需要携带该 token 以供服务端验证用户登录的有效性，因此 **token 信息在客户端的存储及传输，是用户不必重复登录的关键**。

**服务端自动植入**
服务端登录接口通过设置响应报头中的 `set-cookie` 首部字段，将 token 信息植入浏览器 `cookie` 中。
`set-cookie` 指令值包含了必选项 `<cookie-name>=<cookie-value>` 值和名的形式，同时还包括了可选项 Path（路径）、Domain（域名）、Max-Age（有效时间）等，以分号分隔。
之后前端调用同域下的接口时，浏览器会自动将网站的 cookie 值附加在请求头中传给后端进行校验，前端则不需要关心 token 的存取问题。

**前端手动存储**
前端存储的方式不受限于浏览器环境（如像 APP 或小程序没有浏览器 cookie 的环境）。

前端获取到服务端登录接口返回的 token 信息，再通过前端存储方法将数据持久化缓存起来，并在退出后手动清除。后续，在调用接口时需要手动将 token 传递给服务端；

### 浏览器存储型缓存方案

**Cookie 存储方案**
Cookie 最初是为了辨别用户身份，实现页面间状态的维持和传递。

其存储空间很小，不能超过 4KB。

当 Cookie 在同域下被设置时，它会随着每一次资源请求的请求报头一起传递到服务端进行验证。如果存在过多的 Cookie，将会导致无效资源的传输和性能浪费。

由于 Cookie 无法跨域传输，因此可以利用这一特点在 CDN 域名上进行优化。如果 CDN 资源和主站采用了相同的域名，那么 Cookie 的传输将会导致巨大的性能浪费。相反，可以将 CDN 的域名与主站区分开来，以避免这个问题。

浏览器提供的原始 Cookie 存储 API 使用起来并不是特别方便。可使用 [js-cookie](https://www.npmjs.com/package/js-cookie) 库，它封装了 Cookie 的常用操作，提供了简单易用的 API。

**Web Storage 存储方案**
`Web Storage` 作为 HTML5 推出的浏览器存储机制，其又可分为 `Session Storage` 和 `Local Storage`，两者相辅相成。

Session Storage 作为临时性的本地存储，其生命周期存在于网页会话期间，即使用 Session Storage 存储的缓存数据在网页关闭后会自动释放，并不是持久性的。而 Local Storage 则存储于浏览器本地，除非手动删除或过期，否则其一直存在，属于持久性缓存。

Web Storage 与 Cookie 相比存储大小得到了明显的提升，一般为 2.5-10M 之间（各家浏览器不同）。

:::warning 注意：Web Storage 存储的数据最终都会转化成字符串类型
存储对象时如果没有提前采用序列化方法 `JSON.stringify` 转化为字符串对象，那么最终获取的值会变成 `[object Object]`。

可对 Local Storage 封装方法，赋予其过期时间和自动序列化反序列化的能力，此时便无需再关心存储数据的格式问题。

npm 上有处理此问题的包：[web-storage-cache](https://github.com/wuchangming/web-storage-cache)
:::

**IndexedDB 存储方案**
IndexedDB 是一个大规模的 NoSQL 存储系统，它几乎可以存储浏览器中的任何数据内容，包括二进制数据（ArrayBuffer 对象和 Blob 对象），其可以存储不少于 250M 的数据。

npm 上比较流行的封装 IndexedDB 的包 [idb](https://github.com/jakearchibald/idb) 可以简化原始 API 的操作流程。

## Chrome 浏览器 Application 面板

Chrome Application 面板集成了对浏览器存储数据的一系列操作功能，比如清空存储数据、操作查看 Cookie / Web Storage、查看删除 IndexedDB、调试 Service Worker 等。

:::warning HttpOnly
当 Cookie 数据中对应的 `HttpOnly` 字段显示被勾选时，表示该 Cookie 不可通过 JS 获取和修改。
:::

## 参考

- [前端缓存技术与方案解析 - 劳卜 - 掘金小册](https://juejin.cn/book/6994678547826606095)
- [彻底理解浏览器的缓存机制 - 掘金](https://juejin.cn/post/6992843117963509791)
- [手写一个基于 Proxy 的缓存库 · Issue #34 · wsafight/personBlog](https://github.com/wsafight/personBlog/issues/34)
