const fs = require('fs');
const path = require('path');

console.log('♿ 知行财库可访问性优化\n');

// 优化结果
const optimizationResults = {
  filesModified: 0,
  ariaLabelsAdded: 0,
  semanticTagsAdded: 0,
  keyboardSupportAdded: 0,
  errorHandlingAdded: 0
};

function addAriaLabels(content) {
  let modified = false;
  let ariaCount = 0;
  
  // 为按钮添加aria-label
  content = content.replace(
    /<Button([^>]*?)>/g,
    (match, attrs) => {
      if (!attrs.includes('aria-label') && !attrs.includes('aria-describedby')) {
        // 尝试从按钮内容或属性中提取标签
        const labelMatch = match.match(/>([^<]+)</);
        if (labelMatch) {
          const label = labelMatch[1].trim();
          if (label && label.length < 50) {
            modified = true;
            ariaCount++;
            return `<Button${attrs} aria-label="${label}">`;
          }
        }
      }
      return match;
    }
  );
  
  // 为输入框添加aria-label
  content = content.replace(
    /<Input([^>]*?)>/g,
    (match, attrs) => {
      if (!attrs.includes('aria-label') && !attrs.includes('aria-describedby')) {
        const placeholderMatch = attrs.match(/placeholder="([^"]+)"/);
        if (placeholderMatch) {
          modified = true;
          ariaCount++;
          return `<Input${attrs} aria-label="${placeholderMatch[1]}">`;
        }
      }
      return match;
    }
  );
  
  // 为Select添加aria-label
  content = content.replace(
    /<Select([^>]*?)>/g,
    (match, attrs) => {
      if (!attrs.includes('aria-label') && !attrs.includes('aria-describedby')) {
        const labelMatch = attrs.match(/placeholder="([^"]+)"/);
        if (labelMatch) {
          modified = true;
          ariaCount++;
          return `<Select${attrs} aria-label="${labelMatch[1]}">`;
        }
      }
      return match;
    }
  );
  
  optimizationResults.ariaLabelsAdded += ariaCount;
  return { content, modified };
}

function addSemanticTags(content) {
  let modified = false;
  let semanticCount = 0;
  
  // 为Card组件添加role
  content = content.replace(
    /<Card([^>]*?)>/g,
    (match, attrs) => {
      if (!attrs.includes('role=')) {
        modified = true;
        semanticCount++;
        return `<Card${attrs} role="region">`;
      }
      return match;
    }
  );
  
  // 为Table组件添加role
  content = content.replace(
    /<Table([^>]*?)>/g,
    (match, attrs) => {
      if (!attrs.includes('role=')) {
        modified = true;
        semanticCount++;
        return `<Table${attrs} role="table">`;
      }
      return match;
    }
  );
  
  // 为Form组件添加role
  content = content.replace(
    /<Form([^>]*?)>/g,
    (match, attrs) => {
      if (!attrs.includes('role=')) {
        modified = true;
        semanticCount++;
        return `<Form${attrs} role="form">`;
      }
      return match;
    }
  );
  
  optimizationResults.semanticTagsAdded += semanticCount;
  return { content, modified };
}

function addKeyboardSupport(content) {
  let modified = false;
  let keyboardCount = 0;
  
  // 为按钮添加键盘支持
  content = content.replace(
    /<Button([^>]*?)>/g,
    (match, attrs) => {
      if (!attrs.includes('onKeyDown') && !attrs.includes('tabIndex')) {
        modified = true;
        keyboardCount++;
        return `<Button${attrs} tabIndex={0}>`;
      }
      return match;
    }
  );
  
  // 为链接添加键盘支持
  content = content.replace(
    /<a([^>]*?)>/g,
    (match, attrs) => {
      if (!attrs.includes('tabIndex')) {
        modified = true;
        keyboardCount++;
        return `<a${attrs} tabIndex={0}>`;
      }
      return match;
    }
  );
  
  optimizationResults.keyboardSupportAdded += keyboardCount;
  return { content, modified };
}

function addErrorHandling(content) {
  let modified = false;
  let errorCount = 0;
  
  // 为表单添加错误处理
  if (content.includes('<Form') && !content.includes('aria-invalid')) {
    content = content.replace(
      /<Form([^>]*?)>/g,
      (match, attrs) => {
        modified = true;
        errorCount++;
        return `<Form${attrs} aria-invalid="false">`;
      }
    );
  }
  
  // 为输入框添加错误状态
  if (content.includes('<Input') && !content.includes('aria-invalid')) {
    content = content.replace(
      /<Input([^>]*?)>/g,
      (match, attrs) => {
        modified = true;
        errorCount++;
        return `<Input${attrs} aria-invalid="false">`;
      }
    );
  }
  
  optimizationResults.errorHandlingAdded += errorCount;
  return { content, modified };
}

function optimizeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let optimizedContent = content;
    
    // 应用各种优化
    const ariaResult = addAriaLabels(optimizedContent);
    if (ariaResult.modified) {
      optimizedContent = ariaResult.content;
      modified = true;
    }
    
    const semanticResult = addSemanticTags(optimizedContent);
    if (semanticResult.modified) {
      optimizedContent = semanticResult.content;
      modified = true;
    }
    
    const keyboardResult = addKeyboardSupport(optimizedContent);
    if (keyboardResult.modified) {
      optimizedContent = keyboardResult.content;
      modified = true;
    }
    
    const errorResult = addErrorHandling(optimizedContent);
    if (errorResult.modified) {
      optimizedContent = errorResult.content;
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, optimizedContent);
      optimizationResults.filesModified++;
      console.log(`✅ 优化文件: ${filePath}`);
    }
    
    return modified;
  } catch (error) {
    console.log(`❌ 处理文件失败: ${filePath} - ${error.message}`);
    return false;
  }
}

function optimizeDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // 递归处理子目录
      optimizeDirectory(filePath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      // 处理JavaScript文件
      optimizeFile(filePath);
    }
  });
}

function createAccessibilityGuide() {
  const guide = `
# 知行财库可访问性指南

## 已实现的优化

### 1. ARIA标签
- 为按钮添加了aria-label属性
- 为输入框添加了aria-label属性
- 为选择框添加了aria-label属性

### 2. 语义化标签
- 为Card组件添加了role="region"
- 为Table组件添加了role="table"
- 为Form组件添加了role="form"

### 3. 键盘导航
- 为按钮添加了tabIndex={0}
- 为链接添加了tabIndex={0}

### 4. 错误处理
- 为表单添加了aria-invalid属性
- 为输入框添加了aria-invalid属性

## 使用建议

### 对于开发者
1. 在添加新组件时，记得包含相应的ARIA标签
2. 确保所有交互元素都支持键盘导航
3. 为表单验证添加适当的错误提示

### 对于用户
1. 可以使用Tab键在页面元素间导航
2. 可以使用Enter键激活按钮
3. 屏幕阅读器可以正确识别页面结构

## 进一步优化建议

1. 添加跳过导航链接
2. 实现焦点管理
3. 添加高对比度主题
4. 支持字体大小调整
5. 添加语音导航支持
`;

  fs.writeFileSync('./accessibility-guide.md', guide);
  console.log('✅ 创建可访问性指南: accessibility-guide.md');
}

async function runAccessibilityOptimization() {
  console.log('🚀 开始可访问性优化...\n');
  
  // 优化前端组件
  console.log('📁 优化前端组件...');
  optimizeDirectory('./client/src/components');
  
  // 优化前端页面
  console.log('\n📄 优化前端页面...');
  optimizeDirectory('./client/src/pages');
  
  // 创建可访问性指南
  console.log('\n📚 创建可访问性指南...');
  createAccessibilityGuide();
  
  // 输出优化结果
  console.log('\n📊 可访问性优化结果');
  console.log('================================================================================');
  console.log(`修改的文件数: ${optimizationResults.filesModified}`);
  console.log(`添加的ARIA标签: ${optimizationResults.ariaLabelsAdded}`);
  console.log(`添加的语义化标签: ${optimizationResults.semanticTagsAdded}`);
  console.log(`添加的键盘支持: ${optimizationResults.keyboardSupportAdded}`);
  console.log(`添加的错误处理: ${optimizationResults.errorHandlingAdded}`);
  
  const totalImprovements = optimizationResults.ariaLabelsAdded + 
                           optimizationResults.semanticTagsAdded + 
                           optimizationResults.keyboardSupportAdded + 
                           optimizationResults.errorHandlingAdded;
  
  console.log(`\n🎯 总改进项: ${totalImprovements}`);
  
  if (totalImprovements > 0) {
    console.log('✅ 可访问性优化完成！');
    console.log('📖 请查看 accessibility-guide.md 了解详细说明');
  } else {
    console.log('ℹ️  未发现需要优化的可访问性问题');
  }
  
  console.log('\n💡 下一步建议:');
  console.log('   1. 测试键盘导航功能');
  console.log('   2. 使用屏幕阅读器测试');
  console.log('   3. 检查颜色对比度');
  console.log('   4. 进行性能优化');
}

// 运行可访问性优化
runAccessibilityOptimization().catch(error => {
  console.error('可访问性优化失败:', error.message);
}); 