---
title: electron + vite 脚手架介绍
date: 2023-04-19
category:
  - electron
tag:
  - electron
  - vite
---

> [GitHub - umbrella22/electron-vite-template](https://github.com/umbrella22/electron-vite-template) - vue3 + Vite + electron项目模板

## 启动

配置 npm 及 electron 镜像，避免下载依赖因网络问题失败。

```shell
registry=https://registry.npmmirror.com/
# electron
ELECTRON_MIRROR=https://cdn.npmmirror.com/binaries/electron/
ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
```

> 首次执行 `yarn`安装依赖时，执行到 electron 的 node install.js 报 RequestError: socket hang up 并退出。再次执行 `yarn`就好了。

执行 `yarn dev`启动项目，带 HMR。

## 开发构建
`yarn dev` 执行的入口文件为 `.electron-vite/dev-runner.ts`，用于开发环境代码构建。<br />此文件在 `init` 函数中主依次启动渲染进程、主进程、Electron。
> 最开始，使用 [cfonts](https://www.npmjs.com/package/cfonts) 在终端中显示彩色的 ASCII 艺术字体 `electron-vite`。

### 渲染进程

> Electron 的渲染进程是指在 Electron 应用程序中运行的 JavaScript 代码，它们负责渲染和处理用户界面。每个 Electron 窗口都有一个对应的渲染进程，这个渲染进程负责显示窗口中的内容和处理用户输入。渲染进程可以与主进程进行通信，以便实现更复杂的功能。

此项目中渲染进程的交由 Vite 处理，用于快速搭建 Web 应用程序的开发环境，并提供快速的热更新和构建功能，以提高开发效率和构建速度。

#### 本地开发服务器

先使用 [portfinder](https://www.npmjs.com/package/portfinder) 获取一个可用的端口号，并将该端口号设置为 `process.env.PORT` 的值。<br />然后，它调用 Vite 的`createServer` 函数创建一个 Vite 服务器，并将 `vite.config.ts` 文件作为配置文件传递给该函数。<br />最后，使用 `server.listen` 方法启动服务器（使用上面获取的端口号）。

#### Vite 配置

本地开发服务器由 Vite 创建，其配置文件位于`.electron-vite/vite.config.ts`。

```typescript
defineConfig({
  mode: process.env.NODE_ENV, // 运行模式
  root, // 指定项目的根目录路径，此处设置为针对渲染进程的 src/renderer
  define: {
    // 存储一些全局配置信息
    // 渲染进程中约定以 `__CONFIG__` （全局变量）来获取 `env` 文件夹内的内容
    __CONFIG__: config,
  },
  resolve: {
    // 设置别名，使用 @renderer 来代替 src/renderer
    alias: {
      "@renderer": root,
    },
  },
  base: "./", // 项目的基础 URL，用于处理静态资源的路径问题
  // 构建相关的配置选项，例如输出目录、目标环境、代码压缩等
  build: {
    outDir:
      config && config.target
        ? resolve("dist/web")
        : resolve("dist/electron/renderer"),
    emptyOutDir: true,
    target: "esnext",
    minify: "esbuild",
    cssCodeSplit: false,
  },
  server: {},
  // 分别支持 Vue.js 的 JSX 语法和编译 Vue 单文件组件
  plugins: [vueJsx(), vuePlugin()],
  optimizeDeps: {},
})
```

配置文件中的一些配置选项的含义：

- `mode`：指定当前的运行模式，可以是 "development" 或 "production"。
- `root`：指定项目的根目录路径。
- `define`：定义一些全局变量，这些变量可以在代码中直接使用。
- `resolve`：指定模块解析的配置选项。
- `base`：指定项目的基础 URL，用于处理静态资源的路径问题。
- `build`：指定构建相关的配置选项，例如输出目录、目标环境、代码压缩等。
- `server`：指定开发服务器的配置选项，例如端口号、代理等。
- `plugins`：指定使用的插件，例如 vueJsx 和 vuePlugin。
- `optimizeDeps`：指定 Vite 在开发环境下优化依赖的行为。

### 主进程

> Electron 的主进程是应用程序的核心，负责管理和协调应用程序的所有窗口和渲染进程，同时提供了访问本地文件系统和操作系统资源的能力。

#### 监听文件变化

主进程启动入口为 `startMain` 函数，返回 Promise 函数。该函数会启动 Electron 主进程并监听主进程文件的变化。当主进程文件发生变化时，会输出日志信息；当主进程文件被修改后重启 Electron 进程时，杀掉当前运行的 Electron 进程，再启动一个新的 Electron 进程。

```typescript
new Promise((resolve, reject) => {
  // 监视对主进程代码所做的更改，并在检测到更改时自动重新构建该代码
  const MainWatcher = watch(mainOpt);
  // 监听文件变更
  MainWatcher.on("change", (filename) => {
    // 主进程 src/main 下代码变更时，输出变更的文件名日志信息
  });
  // 处理文件监视器发出的所有其他事件
  MainWatcher.on("event", (event) => {
    // 检测到更改后完成重建代码时
    if (event.code === "END") {
      // 确保 electron 进程对象已存在
      if (electronProcess) {
				// 用于防止快速连续多次重启 Electron 进程，这可能会导致应用出现问题。
        // 默认情况下，该标志设置为false，因此在检测到文件更改事件时将自动重新启动 Electron 进程。
        manualRestart = true;
        // 确保在重新启动之前正确终止 Electron 进程，避免同时运行多个实例的 Electron 进程
        if (electronProcess.pid) process.kill(electronProcess.pid);
        electronProcess = null;
        startElectron();

        // 当 manualRestart 标志被设置为 true 时，它会阻止 Electron 进程在检测到文件更改事件时自动重启。
        // 通过设置超时并在超时后将 manualRestart 标志重置为false，以确保不会无限期地将该标志设为 true。
        setTimeout(() => {
          manualRestart = false;
        }, 5000);
      }

      resolve();
    // 重新构建过程中发生错误时
    } else if (event.code === "ERROR") {
      reject(event.error);
    }
  });
});
```

#### Rollup

主进程代码基于 rollup 构建，其配置文件为`.electron-vite/rollup.config.ts`，其主要内容如下：

```typescript
const config = getConfig(); // 读取 env 目录下的 *.env 文件

defineConfig({
  // ... 省略部分配置
  plugins: [
    replace({
      preventAssignment: true, // 不要将替换的结果包裹在一个赋值语句中，而是直接替换掉变量名
      "process.env.userConfig": config ? JSON.stringify(config) : "{}",
    }),
    // 提供路径和读取别名
    nodeResolve({
      preferBuiltins: true, // 优先使用Node.js内置模块
      browser: false, // 将模块的导入路径视为在Node.js环境下运行
      extensions: [".mjs", ".ts", ".js", ".json", ".node"], // 可以解析的模块文件扩展名
    }),
    commonjs({
      sourceMap: false, // 不生成源映射文件
    }),
    json(), // 用于将 JSON 文件转换为 ES6 模块
    // 使用 esbuild 进行代码转换和压缩（所有配置项可选）
    esbuild({
      include: /\.[jt]s?$/, // default。转换 .js 或 .ts 结尾的文件
      exclude: /node_modules/,
      // watch: process.argv.includes('--watch'), // rollup 中有配置
      sourceMap: env != "production", // default。非生产环境下生成 sourceMap
      minify: env === "production", // 生产环境下压缩代码
      target: "es2017", // default。转换后的代码目标版本
      // 类似 @rollup/plugin-replace，可在代码中进行常量替换
      define: {
        __VERSION__: '"x.y.z"',
      },
      // 添加额外的加载器
      loaders: {
        // 添加对 .json 文件的支持，需要使用 @rollup/plugin-commonjs 插件来将其转换为 ES6 模块
        ".json": "json",
        // 在 .js 文件中启用 JSX 语法支持
        ".js": "jsx",
      },
    }),
    // 创建别名
    alias({
      entries: [
        {
          find: "@main", // 要替换的模块名
          replacement: path.join(__dirname, "../src/main") // 要替换成的路径
        },
        {
          find: "@config",
          replacement: path.join(__dirname, "..", "config"),
        },
      ],
    }),
    // 生产环境下用 obfuscator 混淆代码，从而增加代码的安全性
    process.env.NODE_ENV == "production"
    ? obfuscator({
      global: true, // 混淆整个代码库，包括所有导出的变量和函数
    })
    : null,
  ],
  // 指定哪些模块应该被视为外部依赖，而不是被打包进最终的输出文件中
  // builtinModules 自 module 模块引入，是一个数组，包含Node.js中内置的所有内置模块的名称
  external: [...builtinModules, ...Object.keys(dependencies), "electron"],
})
```

使用到的 rollup 插件：

- [@rollup/plugin-node-resolve](https://github.com/rollup/plugins/tree/master/packages/node-resolve): 用于解析 node_modules 中的第三方模块
- [@rollup/plugin-commonjs](https://github.com/rollup/plugins/tree/master/packages/commonjs): 用于将 CommonJS 模块转换为 ES6 模块
- [@rollup/plugin-replace](https://github.com/rollup/plugins/tree/master/packages/replace): 用于在打包过程中替换代码中的字符串或者其他值
- [@rollup/plugin-alias](https://github.com/rollup/plugins/tree/master/packages/alias): 用于创建模块的别名
- [@rollup/plugin-json](https://github.com/rollup/plugins/tree/master/packages/json): 用于将 JSON 文件转换为 ES6 模块
- [rollup-plugin-esbuild](https://github.com/egoist/rollup-plugin-esbuild): 用于使用 esbuild 进行代码转换和压缩，以提高打包速度和减小文件大小
- [rollup-plugin-obfuscator](https://github.com/javascript-obfuscator/rollup-plugin-obfuscator): 用于对打包后的代码进行混淆和压缩，以保护代码的安全性

### Electron 进程

```typescript
function startElectron() {
  // --inspect=5858 参数表示启用调试模式，并监听 5858 端口
  var args = [
    "--inspect=5858",
    join(__dirname, "../dist/electron/main/main.js"),
  ];
	// ...
  // spawn 方法返回一个 ChildProcess 对象，并在下方监听 Electron 进程的标准输出和标准错误输出
  electronProcess = spawn(electron as any, args);
  electronProcess?.stdout?.on("data", (data: string) => {
    electronLog(removeJunk(data), "blue");
  });
  electronProcess?.stderr?.on("data", (data: string) => {
    // removeJunk 过滤 Electron 进程输出中的无用信息，过滤指定格式的警告、错误、日志信息
    electronLog(removeJunk(data), "red");
  });
  // 处理 Electron 进程关闭事件
  electronProcess.on("close", () => {
    // 当 Electron 进程关闭时，检查 manualRestart 标志为 false 时调用 process.exit() 终止 Node.js 进程。
    // 确保在 Electron 进程关闭时终止 Node.js 进程，除非手动启动了重启操作。
    // 可以确保应用程序在 Electron 进程关闭时完全关闭，并防止任何残留进程或资源对应用程序造成问题。
    if (!manualRestart) process.exit();
  });
}
```

> process.env.npm_execpath: 确定应用程序是使用 npm 还是 yarn 运行。npm_execpath 属性由 npm 设置，并包含当前正在运行的 npm 可执行文件路径。

### 其它依赖

- [dotenv](https://www.npmjs.com/package/dotenv) 可用于加载环境变量
- [chalk](https://github.com/chalk/chalk) 在终端中输出彩色文字

## 主进程

主进程入口文件在 `src/main/index.ts`。

```typescript
// ...
function onAppReady() {
  // 初始化窗口
  new InitWindow().initWindow()
  // 禁用 F12 按钮
  DisableButton.Disablef12()
  // 开发环境加载 Vue.js 开发工具扩展
  if (process.env.NODE_ENV === 'development') {
    const { VUEJS3_DEVTOOLS } = require("electron-devtools-vendor");
    session.defaultSession.loadExtension(VUEJS3_DEVTOOLS, {
      allowFileAccess: true,
    });
    console.log('已安装: vue-devtools')
  }
}
// 应用准备就绪时
app.whenReady().then(onAppReady)
// 由于9.x版本问题，需要加入该配置关闭跨域问题
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors')
// 当所有窗口关闭时退出应用
app.on('window-all-closed', () => {
  app.quit()
})
// 新窗口创建
app.on('browser-window-created', () => {
  console.log('window-created')
})
// 如果是当前进程是默认应用，则删除“electron-vue-template”协议的默认客户端
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.removeAsDefaultProtocolClient('electron-vue-template')
    console.log('由于框架特殊性开发环境下无法使用')
  }
} else {
  app.setAsDefaultProtocolClient('electron-vue-template')
}
```

### 初始化窗口

上面代码中的 `new InitWindow().initWindow()`用于初始化窗口设置，源码位于 `src/main/services/windowManager.ts`，用于初始化 Electron 应用程序的主进程。它创建了一个 `MainInit` 类，该类负责创建应用程序的主窗口和加载窗口（主窗口加载完成前显示），并在必要时处理窗口的崩溃和无响应情况。同时，还设置了窗口菜单和 IPC 通信。

```typescript
class MainInit {
  public winURL: string = "";
  public shartURL: string = "";
  public loadWindow: BrowserWindow = null;
  public mainWindow: BrowserWindow = null;

  constructor() {
    this.winURL = winURL;
    this.shartURL = loadingURL;
    // 开发环境添加“开发者设置”菜单
    // ...
    // 进程间通讯
    setIpc.Mainfunc();
  }

  // 初始化窗口函数（若配置显示loading窗口，在主窗口加载前先显示）
  initWindow() {
    if (UseStartupChart) return this.loadingWindow(this.shartURL);
    return this.createMainWindow();
  }
  
  // 主窗口函数
  createMainWindow() {
    this.mainWindow = new BrowserWindow({
      // 窗口标题栏样式（hidden 为隐藏标题栏）
      titleBarStyle: IsUseSysTitle ? "default" : "hidden",
      ...mainWindowConfig,
    });
    // 设置菜单
    const menu = Menu.buildFromTemplate(menuconfig as any);
    Menu.setApplicationMenu(menu);
    // 加载主窗口
    this.mainWindow.loadURL(this.winURL);
    this.mainWindow.once("ready-to-show", () => {
      // 在此事件后显示窗口将没有视觉闪烁！！
      this.mainWindow.show();
      // 开发模式下自动开启devtools
      if (process.env.NODE_ENV === "development") {
        this.mainWindow.webContents.openDevTools({ mode: "undocked", activate: true });
      }
      // 销毁loading窗口
      if (UseStartupChart) this.loadWindow.destroy();
    });
    // 主窗口未响应时提示，让用户选择重载或退出
    this.mainWindow.on("unresponsive", () => { /*...*/ });
    // 在窗口关闭时移除相应窗口的引用对象，避免再次使用它
    this.mainWindow.on("closed", () => {
      this.mainWindow = null;
    });
		// 当确定渲染进程卡死时，分类型进行告警操作，并让用户选择重载或退出
    app.on("render-process-gone", (event, webContents, details) => { /*...*/ });
    // 进程崩溃或被杀死时警告，让用户选择重载或退出
    app.on("child-process-gone", (event, details) => { /*...*/ });
  }
  // 加载窗口函数
  loadingWindow(loadingURL: string) {
    this.loadWindow = new BrowserWindow({
      width: 400,
      height: 600,
      frame: false, // 创建一个无边框窗口 
      skipTaskbar: true, // 在任务栏中显示窗口
      transparent: true, // 使窗口 透明
      resizable: false,
      webPreferences: { experimentalFeatures: true }, // 启用 Chromium 的实验功能
    });

    this.loadWindow.loadURL(loadingURL);
    this.loadWindow.show();
    this.loadWindow.setAlwaysOnTop(true);
    // 延迟两秒可以根据情况后续调快，= =，就相当于个，sleep吧，就那种。 = =。。。
    setTimeout(() => {
      this.createMainWindow();
    }, 1500);
  }
}
```

### 进程通信（IPC）

上方代码中的 `setIpc.Mainfunc()`从同目录下的 `ipcMain.ts`引入。设置了几个 IPC处理函数，用于在 Electron 应用程序的主进程和渲染器进程之间进行通信。包括：

- `IsUseSysTitle`：返回一个布尔值，指示应用程序是否应该使用系统标题栏
- `windows-mini`：最小化发送消息的窗口
- `window-max`：最大化或还原发送消息的窗口
- `window-close`：关闭发送消息的窗口
- `check-update`：检查更新并显示对话框（如果有可用更新）
- `confirm-update`：退出并安装更新
- `app-close`：退出Electron应用程序
- `get-static-path`: 返回带有各种静态文件路径的对象，这些文件由应用程序使用
- `open-messagebox`: 显示具有自定义选项的消息框
- `open-errorbox`: 显示具有标题和消息的错误框
- `start-server`: 启动本地服务器并返回其状态
- `stop-server`: 停止本地服务器并返回其状态
> `ipcMain.handle(channel, listener)` 用于为一个 invokeable 的 IPC 添加一个 handler。每当一个渲染进程调用 `ipcRenderer.invoke(channel, ...args)` 时这个处理器就会被调用。

#### 检查更新

在上方的 `check-update`中处理检查更新，代码位于 `src/main/services/checkupdate.ts`，该类为 `electron-updater` 包提供的 `autoUpdater` 模块设置事件监听器，包括：

- `error`：在更新过程中发生错误时触发
- `checking-for-update`：当更新过程开始时触发
- `update-available`：当有新版本可用时触发
- `update-not-available`：当没有新版本可用时触发
- `download-progress`：在下载更新时触发
- `update-downloaded`：在下载完成后触发

还有三个方法：

- `Message`: 向主窗口的渲染进程发送消息
- `checkUpdate`: 检查是否有更新，并根据更新状态向渲染进程发送消息
- `quitAndInstall`: 退出应用程序并安装更新

> [electron-updater](https://github.com/electron-userland/electron-builder/blob/master/packages/electron-updater/README.md) 是一个 Electron 应用程序自动更新的库，可以方便地实现应用程序的自动更新功能，提高用户体验和开发效率。它支持多种更新方式，并提供了许多可配置的选项，可以自定义更新的行为和外观。

#### 热更新

`ipcMain.handle` 函数监听来自渲染进程的 `hot-update` 事件，并使用与事件发送方相关联的 `BrowserWindow` 对象调用 `updater` 函数。<br />`updater` 函数首先通过向远程服务器发出请求来检查是否有新版本可用。如果有，它会下载更新包，使用 `SHA256` 哈希验证其完整性，将其提取到临时目录中，删除旧应用程序文件，并将新文件复制到应用程序目录中。

## 渲染进程

渲染进程负责呈现用户界面。此项目采用 Vue3 + Vite 开发，`src/renderer` 下即为整个 用户界面代码，结构跟传统 Web 应用一致。`index.html`作用入口，会被 `BrowserWindow`实例通过 `loadURL` 加载。

## 问题

### 使用 icon-park 自定义项目图标

使用 `<icon-pack>` 组件引入图标，控制台报 `[Vue warn]: Failed to resolve component: iconpark-icon If this is a native custom element, make sure to exclude it from component resolution via compilerOptions.isCustomElement. `<br />解决方法：

```javascript
// fix: Failed to resolve component: iconpark-icon
const isCustomElement = (tag) => tag === "iconpark-icon"

export default defineConfig({
  plugins: [
    vueJsx({
      isCustomElement,
    }),
    vuePlugin({
      template: {
        compilerOptions: {
          isCustomElement,
        },
      },
    }),
  ],
});
```