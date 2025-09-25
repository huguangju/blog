import { defineUserConfig } from "vuepress";

import theme from "./theme.js";

export default defineUserConfig({
  base: "/",

  lang: "zh-CN",
  title: "Hugo's FED Blog",
  description: "前端技术博客",

  theme,

  head: [
    ["link", { rel: "preconnect", href: "https://chinese-fonts-cdn.deno.dev" }],
    [
      "link",
      {
        href: "https://chinese-fonts-cdn.deno.dev/packages/lxgwwenkai/dist/LXGWWenKai-Regular/result.css",
        rel: "stylesheet",
      },
    ],
  ],

  // 和 PWA 一起启用
  // shouldPrefetch: false,
});
