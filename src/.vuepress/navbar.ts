import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  {
    text: "前端技术",
    icon: "code",
    prefix: "/frontend/",
    children: [
      {
        text: "前端技术",
        icon: "code",
        link: "",
        activeMatch: "^/frontend/$",
      },
      {
        text: "源码学习",
        icon: "search",
        link: "source-code/",
      },
      {
        text: "前端工程化",
        icon: "tool",
        link: "engineering/",
      },
      {
        text: "性能优化",
        icon: "speed",
        link: "performance/",
      },
      {
        text: "基础知识",
        icon: "book",
        link: "fundamentals/",
      },
    ],
  },
  {
    text: "算法",
    icon: "calculator",
    link: "/algorithm/",
  },
  {
    text: "读书笔记",
    icon: "read",
    prefix: "/reading/",
    children: [
      {
        text: "读书笔记",
        icon: "read",
        link: "",
        activeMatch: "^/reading/$",
      },
      {
        text: "技术书籍",
        icon: "code",
        link: "technical/",
      },
      {
        text: "非技术书籍",
        icon: "book",
        link: "non-technical/",
      },
    ],
  },
  {
    text: "资源分享",
    icon: "share",
    prefix: "/resources/",
    children: [
      {
        text: "资源分享",
        icon: "share",
        link: "",
        activeMatch: "^/resources/$",
      },
      {
        text: "开发工具",
        icon: "tool",
        link: "tools/",
      },
      {
        text: "优秀库推荐",
        icon: "star",
        link: "libraries/",
      },
      {
        text: "面试相关",
        icon: "user",
        link: "interview/",
      },
    ],
  },
  {
    text: "项目实战",
    icon: "rocket",
    link: "/projects/",
  },
  {
    text: "生活记录",
    icon: "heart",
    link: "/life/",
  },
  {
    text: "关于",
    icon: "user",
    link: "/about/",
  },
]);
