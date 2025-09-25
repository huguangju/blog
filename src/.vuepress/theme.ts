import { hopeTheme } from "vuepress-theme-hope";
import navbar from "./navbar.js";
import sidebar from "./sidebar.js";

export default hopeTheme({
  hostname: "https://huguangju.cn",

  author: {
    name: "Hugo",
    url: "https://huguangju.cn",
  },

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

  blog: {
    description: "一个前端开发者的随手笔记",
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

  markdown: {
    highlighter: {
      type: "shiki",
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      langs: [
        "bash",
        "javascript",
        "typescript",
        "json",
        "vue",
        "markdown",
        "jsx",
      ],
    },
    codeTabs: true,
  },

  plugins: {
    blog: true,
    icon: {
      assets: "iconify",
    },
    search: true,
    comment: {
      provider: "Giscus",
      repo: "huguangju/blog",
      repoId: "MDEwOlJlcG9zaXRvcnkyNTY0NzIyNA==",
      category: "Announcements",
      categoryId: "DIC_kwDOAYdYeM4CVHFl",
    },
  },
});
