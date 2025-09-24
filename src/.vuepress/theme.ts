import { hopeTheme } from "vuepress-theme-hope";

import navbar from "./navbar.js";
import sidebar from "./sidebar.js";

export default hopeTheme({
  hostname: "https://huguangju.cn",

  author: {
    name: "Hugo",
    url: "https://huguangju.cn",
  },

  // iconAssets: "iconify",

  logo: "/logo.svg",

  repo: "huguangju/huguangju.github.io",

  docsDir: "src",

  // 导航栏
  navbar,

  // 侧边栏
  sidebar,

  // 页脚
  footer: "Copyright © 2022-2025 Hugo",
  displayFooter: true,

  // 博客相关
  blog: {
    description: "前端开发者",
    intro: "/about/",
    medias: {
      GitHub: "https://github.com/huguangju",
    },
  },

  // 加密配置
  encrypt: {
    config: {
      "/demo/encrypt.html": ["1234"],
    },
  },

  // 多语言配置
  // metaLocales: {
  //   editLink: "在 GitHub 上编辑此页",
  // },

  // 如果想要实时查看任何改变，启用它。注: 这对更新性能有很大负面影响
  // hotReload: true,

  // 在这里配置主题提供的插件
  plugins: {
    // 启用之前需安装 @waline/client
    // 警告: 这是一个仅供演示的测试服务，在生产环境中请自行部署并使用自己的服务！
    // comment: {
    //   provider: "Waline",
    //   serverURL: "https://waline-comment.vuejs.press",
    // },

    components: {
      components: ["Badge", "VPCard"],
    },

    // 此处开启了很多功能用于演示，你应仅保留用到的功能。
    // markdownImage: {
    //   figure: true,
    //   lazyload: true,
    //   size: true,
    // },

    // markdownMath: {
    //   // 启用前安装 katex
    //   type: "katex",
    //   // 或者安装 mathjax-full
    //   type: "mathjax",
    // },

    // 此功能被开启用于演示，你应仅当使用时保留。
    // markdownTab: true,

    // 此处开启了很多功能用于演示，你应仅保留用到的功能。
    // mdEnhance: {
    //   align: true,
    //   attrs: true,
    //   component: true,
    //   demo: true,
    //   include: true,
    //   mark: true,
    //   plantuml: true,
    //   spoiler: true,
    //   stylize: [
    //     {
    //       matcher: "Recommended",
    //       replacer: ({ tag }) => {
    //         if (tag === "em")
    //           return {
    //             tag: "Badge",
    //             attrs: { type: "tip" },
    //             content: "Recommended",
    //           };
    //       },
    //     },
    //   ],
    //   sub: true,
    //   sup: true,
    //   tasklist: true,
    //   vPre: true,
    // },



    // 如果你需要幻灯片，安装 @vuepress/plugin-revealjs 并取消下方注释
    // revealjs: {
    //   plugins: ["highlight", "math", "search", "notes", "zoom"],
    // },
  },
});
