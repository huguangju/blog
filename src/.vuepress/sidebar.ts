import { sidebar } from "vuepress-theme-hope";
import { arraySidebar } from "vuepress-theme-hope";

export default sidebar({
  // 前端技术
  "/frontend/": arraySidebar([
    "",
    "source-code/",
    "engineering/",
    "performance/",
    "fundamentals/",
  ]),
  "/frontend/source-code/": "structure",
  "/frontend/engineering/": "structure",
  "/frontend/performance/": "structure",
  "/frontend/fundamentals/": "structure",

  // 算法
  "/algorithm/": arraySidebar([
    "",
    "data-structures/",
    "algorithms/",
    "leetcode/",
  ]),
  "/algorithm/data-structures/": "structure",
  "/algorithm/algorithms/": "structure",
  "/algorithm/leetcode/": "structure",

  // 读书笔记
  "/reading/": arraySidebar([
    "",
    "technical/",
    "non-technical/",
  ]),
  "/reading/technical/": arraySidebar([
    "",
    "react-design-principles/",
    "vue-design-and-achieve/",
    "programming-typescript/",
    "javascript/",
    "architecture/",
    "performance/",
  ]),
  "/reading/technical/react-design-principles/": "structure",
  "/reading/technical/vue-design-and-achieve/": "structure",
  "/reading/technical/programming-typescript/": "structure",
  "/reading/non-technical/": "structure",

  // 资源分享
  "/resources/": arraySidebar([
    "",
    "tools/",
    "libraries/",
    "articles/",
    "courses/",
    "interview/",
  ]),
  "/resources/interview/": "structure",

  // 项目实战
  "/projects/": arraySidebar([
    "",
    "open-source/",
    "tutorials/",
    "case-studies/",
  ]),
  "/projects/open-source/": "structure",
  "/projects/tutorials/": "structure",
  "/projects/case-studies/": "structure",

  // 生活记录
  "/life/": arraySidebar([
    "",
    "travel/",
    "food/",
    "photography/",
    "thoughts/",
  ]),
  "/life/travel/": "structure",
  "/life/food/": "structure",
  "/life/photography/": "structure",
  "/life/thoughts/": "structure",
});
