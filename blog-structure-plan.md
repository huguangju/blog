# 博客结构重新规划方案

## 新的目录结构

```bash
src/
├── README.md                    # 首页
├── about/                       # 关于页面
│   └── README.md
├── frontend/                    # 前端技术
│   ├── README.md
│   ├── source-code/            # 源码学习
│   │   ├── README.md
│   │   ├── vue/                # Vue 源码分析
│   │   ├── react/              # React 源码分析
│   │   └── utils/              # 工具库源码
│   ├── engineering/            # 前端工程化
│   │   ├── README.md
│   │   ├── build-tools/        # 构建工具
│   │   ├── development/        # 开发工具
│   │   └── deployment/         # 部署相关
│   ├── performance/            # 性能优化
│   │   ├── README.md
│   │   ├── web-vitals/         # Web 性能指标
│   │   ├── optimization/       # 优化技巧
│   │   └── monitoring/         # 性能监控
│   └── fundamentals/           # 基础知识
│       ├── README.md
│       ├── javascript/         # JavaScript 深入
│       ├── css/                # CSS 进阶
│       ├── html/               # HTML 语义化
│       └── browser/            # 浏览器原理
├── algorithm/                   # 算法与数据结构
│   ├── README.md
│   ├── data-structures/        # 数据结构
│   ├── algorithms/             # 算法实现
│   └── leetcode/               # LeetCode 题解
├── reading/                     # 读书笔记
│   ├── README.md
│   ├── technical/              # 技术书籍
│   │   ├── README.md
│   │   ├── javascript/         # JavaScript 相关
│   │   ├── architecture/       # 架构设计
│   │   └── performance/        # 性能优化
│   └── non-technical/          # 非技术书籍
│       ├── README.md
│       ├── management/         # 管理类
│       └── thinking/           # 思维方法
├── resources/                   # 资源分享
│   ├── README.md
│   ├── tools/                  # 开发工具
│   ├── libraries/              # 优秀库推荐
│   ├── articles/               # 文章收藏
│   ├── courses/                # 课程推荐
│   └── interview/              # 面试相关
├── projects/                    # 项目实战
│   ├── README.md
│   ├── open-source/            # 开源项目
│   ├── tutorials/              # 项目教程
│   └── case-studies/           # 案例分析
├── life/                        # 生活记录
│   ├── README.md
│   ├── travel/                 # 旅行记录
│   ├── food/                   # 美食分享
│   ├── photography/            # 摄影作品
│   └── thoughts/               # 随想感悟
└── archive/                     # 归档文章
    ├── README.md
    └── 2024/                   # 按年份归档
```

## 导航栏结构

```
首页 | 前端技术 | 算法 | 读书笔记 | 资源分享 | 项目实战 | 生活记录 | 关于
```

### 前端技术子菜单

- 源码学习
- 前端工程化  
- 性能优化
- 基础知识

### 读书笔记子菜单

- 技术书籍
- 非技术书籍

### 资源分享子菜单

- 开发工具
- 优秀库推荐
- 文章收藏
- 面试相关

## 迁移计划

### 现有内容迁移映射

| 原路径 | 新路径 | 说明 |
|--------|--------|------|
| `/code/algorithm/` | `/algorithm/algorithms/` | 算法相关内容 |
| `/code/basic/` | `/frontend/fundamentals/` | 基础知识 |
| `/engineering/` | `/frontend/engineering/` | 工程化内容 |
| `/posts/` | `/projects/tutorials/` | 项目教程 |
| `/read-code/` | `/frontend/source-code/` | 源码学习 |
| `/reading/` | `/reading/technical/` | 技术读书笔记 |
| `/resource/` | `/resources/` | 资源分享 |
| `/vue/` | `/frontend/source-code/vue/` | Vue 相关内容 |

### 新增内容规划

1. **性能优化专区**：Web Vitals、优化技巧、性能监控
2. **项目实战**：开源项目、教程、案例分析
3. **生活记录**：旅行、美食、摄影、随想
4. **关于页面**：个人介绍、技术栈、联系方式

## 实施步骤

1. 创建新的目录结构
2. 迁移现有内容到新位置
3. 更新导航栏和侧边栏配置
4. 更新内部链接引用
5. 添加新的 README 文件
6. 测试所有链接和导航

## 优势

- **结构更清晰**：按技术领域和内容类型分类
- **扩展性更好**：为未来内容增长预留空间
- **用户体验更佳**：更容易找到相关内容
- **SEO 友好**：更好的 URL 结构和内容组织
- **维护性更强**：内容分类明确，便于管理
