import fs from 'fs/promises';
import path from 'path';
import fg from 'fast-glob';
import ignore from 'ignore';
import { hash } from 'ohash';

export class CodebaseIndexer {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.index = new Map();
    this.fileMetadata = new Map();
    this.dependencies = new Map();
    this.ig = ignore();
  }
  
  async initialize() {
    // 加载.gitignore
    await this.loadGitignore();
    
    // 初始索引 - 可选，避免初始化时间过长
    // await this.performIndex();
  }
  
  async loadGitignore() {
    try {
      const gitignorePath = path.join(this.projectRoot, '.gitignore');
      const content = await fs.readFile(gitignorePath, 'utf-8');
      this.ig.add(content);
    } catch (error) {
      // 默认忽略规则
      this.ig.add(['node_modules', '.git', 'dist', 'build', '.next', '.cache']);
    }
  }
  
  async performIndex(full = true) {
    return await this.index(full);
  }
  
  async index(full = true) {
    const startTime = Date.now();
    let fileCount = 0;
    let patternCount = 0;
    
    // 获取所有文件
    const files = await fg(['**/*'], {
      cwd: this.projectRoot,
      ignore: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
        '**/.next/**',
      ],
      dot: true,
    });
    
    for (const file of files) {
      if (!this.ig.ignores(file)) {
        const filePath = path.join(this.projectRoot, file);
        
        try {
          const stats = await fs.stat(filePath);
          
          if (stats.isFile()) {
            await this.indexFile(filePath, stats);
            fileCount++;
            
            // 识别模式
            const patterns = await this.identifyFilePatterns(filePath);
            patternCount += patterns.length;
          }
        } catch (error) {
          console.error(`Error indexing ${filePath}:`, error.message);
        }
      }
    }
    
    // 分析依赖关系
    await this.analyzeDependencies();
    
    const duration = Date.now() - startTime;
    
    return {
      files: fileCount,
      patterns: patternCount,
      duration,
      indexSize: this.index.size,
    };
  }
  
  async indexFile(filePath, stats) {
    const relativePath = path.relative(this.projectRoot, filePath);
    const ext = path.extname(filePath);
    const content = await this.readFileContent(filePath);
    
    const metadata = {
      path: relativePath,
      absolutePath: filePath,
      size: stats.size,
      modified: stats.mtime,
      extension: ext,
      language: this.detectLanguage(ext),
      contentHash: hash(content),
      lines: content.split('\n').length,
    };
    
    this.fileMetadata.set(relativePath, metadata);
    
    // 索引文件内容
    if (this.isTextFile(ext)) {
      await this.indexFileContent(relativePath, content);
    }
  }
  
  async readFileContent(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      // 二进制文件
      return '';
    }
  }
  
  isTextFile(ext) {
    const textExtensions = [
      '.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.txt',
      '.css', '.scss', '.less', '.html', '.xml', '.yaml', '.yml',
      '.env', '.gitignore', '.sql', '.sh', '.py', '.rb', '.go',
    ];
    
    return textExtensions.includes(ext.toLowerCase());
  }
  
  detectLanguage(ext) {
    const languageMap = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.json': 'json',
      '.md': 'markdown',
      '.css': 'css',
      '.scss': 'scss',
      '.less': 'less',
      '.html': 'html',
      '.xml': 'xml',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.sql': 'sql',
      '.sh': 'shell',
      '.py': 'python',
      '.rb': 'ruby',
      '.go': 'go',
    };
    
    return languageMap[ext.toLowerCase()] || 'text';
  }
  
  async indexFileContent(relativePath, content) {
    // 提取关键信息
    const tokens = this.tokenize(content);
    const imports = this.extractImports(content);
    const exports = this.extractExports(content);
    const functions = this.extractFunctions(content);
    const classes = this.extractClasses(content);
    
    this.index.set(relativePath, {
      tokens,
      imports,
      exports,
      functions,
      classes,
      content: content.substring(0, 1000), // 存储前1000个字符作为预览
    });
  }
  
  tokenize(content) {
    // 简单的分词
    const tokens = content
      .toLowerCase()
      .match(/\b\w+\b/g) || [];
    
    // 统计词频
    const frequency = {};
    tokens.forEach(token => {
      frequency[token] = (frequency[token] || 0) + 1;
    });
    
    // 返回高频词
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([token]) => token);
  }
  
  extractImports(content) {
    const imports = [];
    const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)?\s*(?:,\s*{[^}]*})?\s*from\s+['"]([^'"]+)['"]/g;
    
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    // CommonJS requires
    const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  }
  
  extractExports(content) {
    const exports = [];
    
    // ES6 exports
    const exportRegex = /export\s+(?:default\s+)?(?:const|let|var|function|class)\s+(\w+)/g;
    
    let match;
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    
    // Named exports
    const namedExportRegex = /export\s+{([^}]+)}/g;
    while ((match = namedExportRegex.exec(content)) !== null) {
      const names = match[1].split(',').map(n => n.trim());
      exports.push(...names);
    }
    
    return exports;
  }
  
  extractFunctions(content) {
    const functions = [];
    
    // 函数声明
    const funcRegex = /(?:async\s+)?function\s+(\w+)/g;
    
    let match;
    while ((match = funcRegex.exec(content)) !== null) {
      functions.push(match[1]);
    }
    
    // 箭头函数
    const arrowRegex = /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g;
    while ((match = arrowRegex.exec(content)) !== null) {
      functions.push(match[1]);
    }
    
    return functions;
  }
  
  extractClasses(content) {
    const classes = [];
    const classRegex = /class\s+(\w+)/g;
    
    let match;
    while ((match = classRegex.exec(content)) !== null) {
      classes.push(match[1]);
    }
    
    return classes;
  }
  
  async identifyFilePatterns(filePath) {
    const patterns = [];
    const ext = path.extname(filePath);
    const basename = path.basename(filePath);
    const content = await this.readFileContent(filePath);
    
    // 文件命名模式
    if (basename.includes('.test.') || basename.includes('.spec.')) {
      patterns.push('test');
    }
    if (basename.includes('.config.')) {
      patterns.push('config');
    }
    if (basename.includes('.utils.') || basename.includes('.helpers.')) {
      patterns.push('utility');
    }
    
    // 内容模式
    if (content.includes('React')) {
      patterns.push('react');
    }
    if (content.includes('useState') || content.includes('useEffect')) {
      patterns.push('hooks');
    }
    if (content.includes('createSlice') || content.includes('redux')) {
      patterns.push('redux');
    }
    if (content.includes('describe(') || content.includes('it(')) {
      patterns.push('test');
    }
    
    return patterns;
  }
  
  async analyzeDependencies() {
    // 分析文件之间的依赖关系
    for (const [file, data] of this.index) {
      const deps = [];
      
      if (data.imports) {
        for (const imp of data.imports) {
          // 解析导入路径
          let resolvedPath = imp;
          
          if (imp.startsWith('.')) {
            // 相对路径
            const dir = path.dirname(file);
            resolvedPath = path.join(dir, imp);
            
            // 尝试不同的扩展名
            const extensions = ['.js', '.jsx', '.ts', '.tsx', '.json', ''];
            for (const ext of extensions) {
              const testPath = resolvedPath + ext;
              if (this.index.has(testPath)) {
                deps.push(testPath);
                break;
              }
            }
          } else {
            // 模块导入
            deps.push(imp);
          }
        }
      }
      
      this.dependencies.set(file, deps);
    }
  }
  
  async updateFile(filePath) {
    const stats = await fs.stat(filePath);
    await this.indexFile(filePath, stats);
    
    // 重新分析依赖
    await this.analyzeDependencies();
  }
  
  async getResources() {
    const resources = [];
    
    for (const [path, metadata] of this.fileMetadata) {
      resources.push({
        uri: `file://${metadata.absolutePath}`,
        name: path,
        description: `${metadata.language} file (${metadata.lines} lines)`,
        mimeType: this.getMimeType(metadata.extension),
      });
    }
    
    return resources;
  }
  
  getMimeType(ext) {
    const mimeTypes = {
      '.js': 'application/javascript',
      '.jsx': 'application/javascript',
      '.ts': 'application/typescript',
      '.tsx': 'application/typescript',
      '.json': 'application/json',
      '.md': 'text/markdown',
      '.css': 'text/css',
      '.html': 'text/html',
      '.xml': 'application/xml',
      '.yaml': 'text/yaml',
      '.yml': 'text/yaml',
    };
    
    return mimeTypes[ext.toLowerCase()] || 'text/plain';
  }
  
  async readResource(uri) {
    const filePath = uri.replace('file://', '');
    return await fs.readFile(filePath, 'utf-8');
  }
  
  search(query) {
    const results = [];
    
    for (const [file, data] of this.index) {
      let score = 0;
      
      // 搜索文件名
      if (file.toLowerCase().includes(query.toLowerCase())) {
        score += 10;
      }
      
      // 搜索内容
      if (data.content && data.content.toLowerCase().includes(query.toLowerCase())) {
        score += 5;
      }
      
      // 搜索函数和类
      if (data.functions && data.functions.some(f => f.toLowerCase().includes(query.toLowerCase()))) {
        score += 8;
      }
      if (data.classes && data.classes.some(c => c.toLowerCase().includes(query.toLowerCase()))) {
        score += 8;
      }
      
      if (score > 0) {
        results.push({
          file,
          score,
          metadata: this.fileMetadata.get(file),
          preview: data.content,
        });
      }
    }
    
    // 按分数排序
    results.sort((a, b) => b.score - a.score);
    
    return results.slice(0, 20);
  }
  
  getFileGraph() {
    // 生成文件依赖图
    const graph = {
      nodes: [],
      edges: [],
    };
    
    for (const [file] of this.index) {
      graph.nodes.push({
        id: file,
        label: path.basename(file),
        type: this.fileMetadata.get(file)?.language || 'unknown',
      });
    }
    
    for (const [file, deps] of this.dependencies) {
      for (const dep of deps) {
        if (this.index.has(dep)) {
          graph.edges.push({
            source: file,
            target: dep,
          });
        }
      }
    }
    
    return graph;
  }
}