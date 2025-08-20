import fs from 'fs/promises';
import path from 'path';

export class ContextBuilder {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.contextCache = new Map();
  }
  
  async initialize() {
    // 初始化上下文构建器
  }
  
  async buildContext(file, line, type = 'full') {
    const cacheKey = `${file}:${line}:${type}`;
    
    // 检查缓存
    if (this.contextCache.has(cacheKey)) {
      return this.contextCache.get(cacheKey);
    }
    
    const absolutePath = path.isAbsolute(file) 
      ? file 
      : path.join(this.projectRoot, file);
    
    const context = {
      file,
      line,
      type,
      surrounding: await this.getSurroundingCode(absolutePath, line),
      imports: await this.getFileImports(absolutePath),
      exports: await this.getFileExports(absolutePath),
      relatedFiles: await this.findRelatedFiles(absolutePath),
      projectStructure: await this.getProjectStructure(absolutePath),
    };
    
    // 根据类型添加额外上下文
    if (type === 'full') {
      context.dependencies = await this.getFileDependencies(absolutePath);
      context.usages = await this.findUsages(absolutePath);
    }
    
    // 缓存结果
    this.contextCache.set(cacheKey, context);
    
    // 清理旧缓存
    if (this.contextCache.size > 100) {
      const firstKey = this.contextCache.keys().next().value;
      this.contextCache.delete(firstKey);
    }
    
    return context;
  }
  
  async getSurroundingCode(filePath, line, contextLines = 10) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      
      const startLine = Math.max(0, line - contextLines);
      const endLine = Math.min(lines.length, line + contextLines);
      
      const surrounding = {
        before: lines.slice(startLine, line).join('\n'),
        current: lines[line] || '',
        after: lines.slice(line + 1, endLine).join('\n'),
        fullRange: {
          start: startLine,
          end: endLine,
        },
      };
      
      return surrounding;
    } catch (error) {
      return null;
    }
  }
  
  async getFileImports(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const imports = [];
      
      // ES6 imports
      const importRegex = /import\s+(?:(?:\*\s+as\s+\w+)|(?:{[^}]*})|(?:\w+))?\s*(?:,\s*{[^}]*})?\s*from\s+['"]([^'"]+)['"]/g;
      let match;
      
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        const resolvedPath = await this.resolveImportPath(filePath, importPath);
        
        imports.push({
          path: importPath,
          resolved: resolvedPath,
          line: content.substring(0, match.index).split('\n').length,
        });
      }
      
      // CommonJS requires
      const requireRegex = /(?:const|let|var)\s+(?:{[^}]*}|\w+)\s*=\s*require\(['"]([^'"]+)['"]\)/g;
      
      while ((match = requireRegex.exec(content)) !== null) {
        const requirePath = match[1];
        const resolvedPath = await this.resolveImportPath(filePath, requirePath);
        
        imports.push({
          path: requirePath,
          resolved: resolvedPath,
          line: content.substring(0, match.index).split('\n').length,
          type: 'commonjs',
        });
      }
      
      return imports;
    } catch (error) {
      return [];
    }
  }
  
  async getFileExports(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const exports = [];
      
      // Default export
      const defaultExportRegex = /export\s+default\s+(?:(?:async\s+)?(?:function|class)\s+)?(\w+)?/g;
      let match;
      
      while ((match = defaultExportRegex.exec(content)) !== null) {
        exports.push({
          name: match[1] || 'default',
          type: 'default',
          line: content.substring(0, match.index).split('\n').length,
        });
      }
      
      // Named exports
      const namedExportRegex = /export\s+(?:const|let|var|function|class)\s+(\w+)/g;
      
      while ((match = namedExportRegex.exec(content)) !== null) {
        exports.push({
          name: match[1],
          type: 'named',
          line: content.substring(0, match.index).split('\n').length,
        });
      }
      
      // Export list
      const exportListRegex = /export\s+{([^}]+)}/g;
      
      while ((match = exportListRegex.exec(content)) !== null) {
        const names = match[1].split(',').map(n => n.trim());
        const line = content.substring(0, match.index).split('\n').length;
        
        names.forEach(name => {
          exports.push({
            name: name.split(' as ')[0].trim(),
            alias: name.includes(' as ') ? name.split(' as ')[1].trim() : null,
            type: 'named',
            line,
          });
        });
      }
      
      return exports;
    } catch (error) {
      return [];
    }
  }
  
  async resolveImportPath(fromFile, importPath) {
    if (importPath.startsWith('.')) {
      // 相对路径
      const dir = path.dirname(fromFile);
      const resolved = path.resolve(dir, importPath);
      
      // 尝试不同的扩展名
      const extensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '/index.js', '/index.ts'];
      
      for (const ext of extensions) {
        const testPath = resolved + ext;
        try {
          await fs.access(testPath);
          return path.relative(this.projectRoot, testPath);
        } catch {
          // 继续尝试
        }
      }
      
      return path.relative(this.projectRoot, resolved);
    } else {
      // 模块路径
      return importPath;
    }
  }
  
  async findRelatedFiles(filePath) {
    const related = [];
    const basename = path.basename(filePath, path.extname(filePath));
    const dir = path.dirname(filePath);
    
    // 查找测试文件
    const testPatterns = [
      `${basename}.test`,
      `${basename}.spec`,
      `__tests__/${basename}`,
      `${basename}.test.js`,
      `${basename}.spec.js`,
    ];
    
    for (const pattern of testPatterns) {
      const testPath = path.join(dir, pattern);
      try {
        await fs.access(testPath);
        related.push({
          path: path.relative(this.projectRoot, testPath),
          type: 'test',
        });
      } catch {
        // 文件不存在
      }
    }
    
    // 查找样式文件
    const stylePatterns = [
      `${basename}.css`,
      `${basename}.scss`,
      `${basename}.less`,
      `${basename}.module.css`,
    ];
    
    for (const pattern of stylePatterns) {
      const stylePath = path.join(dir, pattern);
      try {
        await fs.access(stylePath);
        related.push({
          path: path.relative(this.projectRoot, stylePath),
          type: 'style',
        });
      } catch {
        // 文件不存在
      }
    }
    
    // 查找类型定义文件
    if (!filePath.endsWith('.d.ts')) {
      const typePath = path.join(dir, `${basename}.d.ts`);
      try {
        await fs.access(typePath);
        related.push({
          path: path.relative(this.projectRoot, typePath),
          type: 'types',
        });
      } catch {
        // 文件不存在
      }
    }
    
    return related;
  }
  
  async getProjectStructure(filePath) {
    const relativePath = path.relative(this.projectRoot, filePath);
    const parts = relativePath.split(path.sep);
    
    const structure = {
      depth: parts.length,
      path: parts,
      parent: parts.length > 1 ? parts.slice(0, -1).join(path.sep) : null,
      siblings: await this.getSiblingFiles(filePath),
    };
    
    return structure;
  }
  
  async getSiblingFiles(filePath) {
    const dir = path.dirname(filePath);
    const basename = path.basename(filePath);
    
    try {
      const files = await fs.readdir(dir);
      return files
        .filter(f => f !== basename)
        .map(f => ({
          name: f,
          path: path.relative(this.projectRoot, path.join(dir, f)),
        }));
    } catch {
      return [];
    }
  }
  
  async getFileDependencies(filePath) {
    const dependencies = {
      imports: [],
      importedBy: [],
    };
    
    // 获取当前文件的导入
    dependencies.imports = await this.getFileImports(filePath);
    
    // 查找哪些文件导入了当前文件
    // 这需要扫描整个项目，在实际实现中应该使用索引
    // 这里简化处理
    
    return dependencies;
  }
  
  async findUsages(filePath) {
    // 查找文件的使用情况
    // 这需要完整的项目索引
    // 简化实现
    return [];
  }
  
  async getContextForPosition(file, line, column) {
    const context = await this.buildContext(file, line);
    
    // 添加列级别的上下文
    if (context.surrounding && context.surrounding.current) {
      const currentLine = context.surrounding.current;
      
      // 识别光标位置的标识符
      const identifier = this.getIdentifierAtPosition(currentLine, column);
      
      if (identifier) {
        context.identifier = {
          name: identifier,
          type: this.identifyType(identifier, currentLine),
        };
      }
    }
    
    return context;
  }
  
  getIdentifierAtPosition(line, column) {
    // 简单的标识符提取
    const before = line.substring(0, column);
    const after = line.substring(column);
    
    const beforeMatch = before.match(/(\w+)$/);
    const afterMatch = after.match(/^(\w+)/);
    
    const beforePart = beforeMatch ? beforeMatch[1] : '';
    const afterPart = afterMatch ? afterMatch[1] : '';
    
    return beforePart + afterPart;
  }
  
  identifyType(identifier, line) {
    // 简单的类型识别
    if (/^[A-Z]/.test(identifier)) {
      if (line.includes('class ' + identifier)) {
        return 'class';
      }
      return 'component';
    }
    
    if (line.includes('function ' + identifier)) {
      return 'function';
    }
    
    if (line.includes('const ' + identifier) || 
        line.includes('let ' + identifier) || 
        line.includes('var ' + identifier)) {
      return 'variable';
    }
    
    return 'unknown';
  }
}