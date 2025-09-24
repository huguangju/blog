#!/bin/bash

# 博客快速启动脚本
# 使用方法: ./scripts/quick-start.sh [command]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 检查依赖
check_dependencies() {
    print_message $BLUE "🔍 检查依赖..."
    
    if ! command -v node &> /dev/null; then
        print_message $RED "❌ Node.js 未安装，请先安装 Node.js"
        exit 1
    fi
    
    if ! command -v pnpm &> /dev/null; then
        print_message $YELLOW "⚠️  pnpm 未安装，正在安装..."
        npm install -g pnpm
    fi
    
    print_message $GREEN "✅ 依赖检查完成"
}

# 安装项目依赖
install_deps() {
    print_message $BLUE "📦 安装项目依赖..."
    pnpm install
    print_message $GREEN "✅ 依赖安装完成"
}

# 启动开发服务器
start_dev() {
    print_message $BLUE "🚀 启动开发服务器..."
    print_message $YELLOW "访问地址: http://localhost:8080"
    pnpm dev
}

# 构建生产版本
build_prod() {
    print_message $BLUE "🏗️  构建生产版本..."
    pnpm build
    print_message $GREEN "✅ 构建完成，输出目录: dist/"
}

# 创建新文章
create_article() {
    local title=$1
    local category=$2
    
    if [ -z "$title" ]; then
        read -p "请输入文章标题: " title
    fi
    
    if [ -z "$category" ]; then
        echo "请选择文章分类:"
        echo "1. 前端技术 (frontend)"
        echo "2. 算法 (algorithm)"
        echo "3. 读书笔记 (reading)"
        echo "4. 项目实战 (projects)"
        echo "5. 生活记录 (life)"
        read -p "请输入选择 (1-5): " choice
        
        case $choice in
            1) category="frontend" ;;
            2) category="algorithm" ;;
            3) category="reading" ;;
            4) category="projects" ;;
            5) category="life" ;;
            *) category="frontend" ;;
        esac
    fi
    
    local date=$(date +"%Y-%m-%d")
    local filename=$(echo "$title" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')
    local filepath="src/${category}/${filename}.md"
    
    # 创建目录（如果不存在）
    mkdir -p "src/${category}"
    
    # 创建文章文件
    cat > "$filepath" << EOF
---
title: "$title"
date: $date
category:
  - $(echo $category | sed 's/^./\U&/')
tag:
  - 标签1
  - 标签2
---

# $title

> 文章摘要或引言

## 目录

- [核心概念](#核心概念)
- [实践应用](#实践应用)
- [总结](#总结)

## 核心概念

### 子标题

内容...

## 实践应用

### 代码示例

\`\`\`javascript
// 示例代码
const example = () => {
  console.log('Hello World!');
};
\`\`\`

## 总结

- 要点1
- 要点2
- 要点3

## 参考资料

- [链接1](https://example.com)
- [链接2](https://example.com)
EOF

    print_message $GREEN "✅ 文章创建成功: $filepath"
    
    # 如果是 macOS，尝试用默认编辑器打开
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "$filepath"
    fi
}

# 清理缓存
clean_cache() {
    print_message $BLUE "🧹 清理缓存..."
    rm -rf node_modules/.cache
    rm -rf .temp
    rm -rf dist
    print_message $GREEN "✅ 缓存清理完成"
}

# 检查链接
check_links() {
    print_message $BLUE "🔗 检查文档链接..."
    
    # 查找所有 markdown 文件中的链接
    find src -name "*.md" -exec grep -l "\[.*\](.*\.md)" {} \; | while read file; do
        print_message $YELLOW "检查文件: $file"
        grep -o "\[.*\](.*\.md)" "$file" | while read link; do
            local target=$(echo "$link" | sed 's/.*](\(.*\))/\1/')
            local dir=$(dirname "$file")
            local full_path="$dir/$target"
            
            if [ ! -f "$full_path" ]; then
                print_message $RED "❌ 死链接: $file -> $target"
            fi
        done
    done
    
    print_message $GREEN "✅ 链接检查完成"
}

# 优化图片
optimize_images() {
    print_message $BLUE "🖼️  优化图片..."
    
    # 检查是否安装了 imagemin
    if ! command -v imagemin &> /dev/null; then
        print_message $YELLOW "⚠️  imagemin 未安装，跳过图片优化"
        print_message $YELLOW "可以运行: npm install -g imagemin-cli"
        return
    fi
    
    # 优化 PNG 和 JPG 图片
    find src -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" | while read img; do
        print_message $YELLOW "优化: $img"
        imagemin "$img" --out-dir="$(dirname "$img")"
    done
    
    print_message $GREEN "✅ 图片优化完成"
}

# 显示帮助信息
show_help() {
    echo "博客管理脚本"
    echo ""
    echo "使用方法:"
    echo "  ./scripts/quick-start.sh [command] [options]"
    echo ""
    echo "命令:"
    echo "  setup           初始化项目（检查依赖 + 安装依赖）"
    echo "  dev             启动开发服务器"
    echo "  build           构建生产版本"
    echo "  new [title]     创建新文章"
    echo "  clean           清理缓存"
    echo "  check-links     检查文档链接"
    echo "  optimize-imgs   优化图片"
    echo "  help            显示帮助信息"
    echo ""
    echo "示例:"
    echo "  ./scripts/quick-start.sh setup"
    echo "  ./scripts/quick-start.sh new \"Vue 3 响应式原理\""
    echo "  ./scripts/quick-start.sh dev"
}

# 主函数
main() {
    local command=$1
    
    case $command in
        "setup")
            check_dependencies
            install_deps
            print_message $GREEN "🎉 项目初始化完成！运行 './scripts/quick-start.sh dev' 启动开发服务器"
            ;;
        "dev")
            start_dev
            ;;
        "build")
            build_prod
            ;;
        "new")
            create_article "$2" "$3"
            ;;
        "clean")
            clean_cache
            ;;
        "check-links")
            check_links
            ;;
        "optimize-imgs")
            optimize_images
            ;;
        "help"|"--help"|"-h"|"")
            show_help
            ;;
        *)
            print_message $RED "❌ 未知命令: $command"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"