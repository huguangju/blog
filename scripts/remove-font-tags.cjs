#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 移除 Markdown 文件中的 <font> 标签
 * @param {string} content - 文件内容
 * @returns {string} - 清理后的内容
 */
function removeFontTags(content) {
  // 移除 <font> 开始标签（包含所有属性）
  content = content.replace(/<font[^>]*>/gi, '');
  
  // 移除 </font> 结束标签
  content = content.replace(/<\/font>/gi, '');
  
  return content;
}

/**
 * 处理单个文件
 * @param {string} filePath - 文件路径
 */
function processFile(filePath) {
  try {
    console.log(`正在处理文件: ${filePath}`);
    
    // 读取文件内容
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 移除 font 标签
    const cleanedContent = removeFontTags(content);
    
    // 检查是否有变化
    if (content !== cleanedContent) {
      // 写回文件
      fs.writeFileSync(filePath, cleanedContent, 'utf8');
      console.log(`✅ 已清理 ${filePath}`);
    } else {
      console.log(`ℹ️  ${filePath} 无需清理`);
    }
  } catch (error) {
    console.error(`❌ 处理文件 ${filePath} 时出错:`, error.message);
  }
}

/**
 * 递归处理目录中的所有 .md 文件
 * @param {string} dirPath - 目录路径
 */
function processDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // 递归处理子目录
        processDirectory(fullPath);
      } else if (stat.isFile() && path.extname(item) === '.md') {
        // 处理 .md 文件
        processFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`❌ 处理目录 ${dirPath} 时出错:`, error.message);
  }
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('用法:');
    console.log('  node remove-font-tags.js <文件路径>     # 处理单个文件');
    console.log('  node remove-font-tags.js <目录路径>     # 处理目录中所有 .md 文件');
    console.log('');
    console.log('示例:');
    console.log('  node remove-font-tags.js ../src/read-code/utils/anchorme.js.md');
    console.log('  node remove-font-tags.js ../src/read-code/');
    process.exit(1);
  }
  
  const targetPath = path.resolve(args[0]);
  
  if (!fs.existsSync(targetPath)) {
    console.error(`❌ 路径不存在: ${targetPath}`);
    process.exit(1);
  }
  
  const stat = fs.statSync(targetPath);
  
  if (stat.isFile()) {
    if (path.extname(targetPath) !== '.md') {
      console.error('❌ 只支持 .md 文件');
      process.exit(1);
    }
    processFile(targetPath);
  } else if (stat.isDirectory()) {
    processDirectory(targetPath);
  } else {
    console.error('❌ 无效的路径类型');
    process.exit(1);
  }
  
  console.log('\n🎉 处理完成！');
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = { removeFontTags, processFile, processDirectory };
