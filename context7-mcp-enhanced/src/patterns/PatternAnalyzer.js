import { Project, SyntaxKind } from 'ts-morph';
import fs from 'fs/promises';
import path from 'path';
import fg from 'fast-glob';

export class PatternAnalyzer {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.project = new Project({
      compilerOptions: {
        allowJs: true,
        jsx: 'react',
      },
    });
    this.patterns = new Map();
    this.codeStyles = new Map();
    this.architecturePatterns = new Map();
  }
  
  async initialize() {
    // 加载项目文件
    await this.loadProjectFiles();
    
    // 初始分析
    await this.performInitialAnalysis();
  }
  
  async loadProjectFiles() {
    const files = await fg(['**/*.{js,jsx,ts,tsx}'], {
      cwd: this.projectRoot,
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    });
    
    for (const file of files) {
      const filePath = path.join(this.projectRoot, file);
      this.project.addSourceFileAtPath(filePath);
    }
  }
  
  async performInitialAnalysis() {
    const sourceFiles = this.project.getSourceFiles();
    
    for (const sourceFile of sourceFiles) {
      await this.analyzeSourceFile(sourceFile);
    }
  }
  
  async analyzeFile(filePath) {
    const sourceFile = this.project.getSourceFile(filePath);
    if (!sourceFile) {
      const content = await fs.readFile(filePath, 'utf-8');
      const newSourceFile = this.project.createSourceFile(filePath, content);
      return await this.analyzeSourceFile(newSourceFile);
    }
    
    return await this.analyzeSourceFile(sourceFile);
  }
  
  async analyzeSourceFile(sourceFile) {
    const analysis = {
      filePath: sourceFile.getFilePath(),
      imports: this.extractImports(sourceFile),
      exports: this.extractExports(sourceFile),
      components: this.extractComponents(sourceFile),
      functions: this.extractFunctions(sourceFile),
      patterns: this.identifyPatterns(sourceFile),
      codeStyle: this.analyzeCodeStyle(sourceFile),
      complexity: this.calculateComplexity(sourceFile),
    };
    
    // 存储分析结果
    this.patterns.set(sourceFile.getFilePath(), analysis);
    
    return analysis;
  }
  
  extractImports(sourceFile) {
    const imports = [];
    
    sourceFile.getImportDeclarations().forEach(importDecl => {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      const namedImports = importDecl.getNamedImports().map(ni => ni.getName());
      const defaultImport = importDecl.getDefaultImport();
      
      imports.push({
        module: moduleSpecifier,
        named: namedImports,
        default: defaultImport ? defaultImport.getText() : null,
      });
    });
    
    return imports;
  }
  
  extractExports(sourceFile) {
    const exports = [];
    
    sourceFile.getExportDeclarations().forEach(exportDecl => {
      const namedExports = exportDecl.getNamedExports().map(ne => ne.getName());
      
      exports.push({
        named: namedExports,
      });
    });
    
    // 处理默认导出
    const defaultExport = sourceFile.getDefaultExportSymbol();
    if (defaultExport) {
      exports.push({
        default: defaultExport.getName(),
      });
    }
    
    return exports;
  }
  
  extractComponents(sourceFile) {
    const components = [];
    
    // 查找React组件（函数组件和类组件）
    sourceFile.getFunctions().forEach(func => {
      const name = func.getName();
      if (name && /^[A-Z]/.test(name)) {
        // 可能是React组件
        components.push({
          name,
          type: 'functional',
          props: this.extractProps(func),
          hooks: this.extractHooks(func),
        });
      }
    });
    
    sourceFile.getClasses().forEach(cls => {
      const name = cls.getName();
      if (name && /^[A-Z]/.test(name)) {
        // 检查是否继承自React.Component
        const heritage = cls.getExtends();
        if (heritage && heritage.getText().includes('Component')) {
          components.push({
            name,
            type: 'class',
            methods: cls.getMethods().map(m => m.getName()),
            state: this.extractState(cls),
          });
        }
      }
    });
    
    return components;
  }
  
  extractFunctions(sourceFile) {
    const functions = [];
    
    sourceFile.getFunctions().forEach(func => {
      const name = func.getName();
      if (name && !/^[A-Z]/.test(name)) {
        // 不是React组件
        functions.push({
          name,
          parameters: func.getParameters().map(p => ({
            name: p.getName(),
            type: p.getType().getText(),
          })),
          returnType: func.getReturnType().getText(),
          async: func.isAsync(),
          complexity: this.calculateFunctionComplexity(func),
        });
      }
    });
    
    return functions;
  }
  
  extractProps(func) {
    const params = func.getParameters();
    if (params.length > 0) {
      const firstParam = params[0];
      const type = firstParam.getType();
      
      // 尝试提取props类型
      const props = [];
      type.getProperties().forEach(prop => {
        props.push({
          name: prop.getName(),
          type: prop.getTypeAtLocation(func).getText(),
          optional: prop.isOptional(),
        });
      });
      
      return props;
    }
    
    return [];
  }
  
  extractHooks(func) {
    const hooks = [];
    const body = func.getBody();
    
    if (body) {
      body.forEachDescendant(node => {
        if (node.getKind() === SyntaxKind.CallExpression) {
          const text = node.getText();
          if (/use[A-Z]/.test(text)) {
            const hookName = text.split('(')[0];
            if (!hooks.includes(hookName)) {
              hooks.push(hookName);
            }
          }
        }
      });
    }
    
    return hooks;
  }
  
  extractState(cls) {
    const state = [];
    
    // 查找state初始化
    const constructor = cls.getConstructors()[0];
    if (constructor) {
      const body = constructor.getBody();
      if (body) {
        body.forEachDescendant(node => {
          if (node.getText().includes('this.state')) {
            // 简单的state提取（可以改进）
            const stateInit = node.getParent();
            if (stateInit) {
              state.push(stateInit.getText());
            }
          }
        });
      }
    }
    
    return state;
  }
  
  identifyPatterns(sourceFile) {
    const patterns = [];
    
    // 识别常见设计模式
    const text = sourceFile.getText();
    
    // HOC模式
    if (/with[A-Z]\w+/.test(text)) {
      patterns.push('HOC');
    }
    
    // Hook模式
    if (/use[A-Z]\w+/.test(text)) {
      patterns.push('Custom Hooks');
    }
    
    // Redux模式
    if (/connect\(|useSelector|useDispatch/.test(text)) {
      patterns.push('Redux');
    }
    
    // Context模式
    if (/createContext|useContext/.test(text)) {
      patterns.push('Context API');
    }
    
    // Render Props模式
    if (/render\s*=\s*{/.test(text)) {
      patterns.push('Render Props');
    }
    
    return patterns;
  }
  
  analyzeCodeStyle(sourceFile) {
    const style = {
      indentation: this.detectIndentation(sourceFile),
      quotes: this.detectQuoteStyle(sourceFile),
      semicolons: this.detectSemicolonUsage(sourceFile),
      naming: this.detectNamingConvention(sourceFile),
    };
    
    return style;
  }
  
  detectIndentation(sourceFile) {
    const text = sourceFile.getText();
    const lines = text.split('\n');
    
    let spaces = 0;
    let tabs = 0;
    
    lines.forEach(line => {
      if (line.startsWith('  ')) spaces++;
      if (line.startsWith('\t')) tabs++;
    });
    
    return spaces > tabs ? 'spaces' : 'tabs';
  }
  
  detectQuoteStyle(sourceFile) {
    const text = sourceFile.getText();
    const singleQuotes = (text.match(/'/g) || []).length;
    const doubleQuotes = (text.match(/"/g) || []).length;
    
    return singleQuotes > doubleQuotes ? 'single' : 'double';
  }
  
  detectSemicolonUsage(sourceFile) {
    const text = sourceFile.getText();
    const lines = text.split('\n');
    
    let withSemicolon = 0;
    let withoutSemicolon = 0;
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('*')) {
        if (trimmed.endsWith(';')) {
          withSemicolon++;
        } else if (trimmed.endsWith('}') || trimmed.endsWith(')')) {
          withoutSemicolon++;
        }
      }
    });
    
    return withSemicolon > withoutSemicolon;
  }
  
  detectNamingConvention(sourceFile) {
    const conventions = {
      variables: 'camelCase',
      functions: 'camelCase',
      components: 'PascalCase',
      constants: 'UPPER_SNAKE_CASE',
    };
    
    return conventions;
  }
  
  calculateComplexity(sourceFile) {
    let complexity = 1;
    
    sourceFile.forEachDescendant(node => {
      switch (node.getKind()) {
        case SyntaxKind.IfStatement:
        case SyntaxKind.ForStatement:
        case SyntaxKind.WhileStatement:
        case SyntaxKind.DoStatement:
        case SyntaxKind.CaseClause:
        case SyntaxKind.CatchClause:
          complexity++;
          break;
        case SyntaxKind.ConditionalExpression:
        case SyntaxKind.BinaryExpression:
          const op = node.getText();
          if (op.includes('&&') || op.includes('||')) {
            complexity++;
          }
          break;
      }
    });
    
    return complexity;
  }
  
  calculateFunctionComplexity(func) {
    let complexity = 1;
    
    func.forEachDescendant(node => {
      switch (node.getKind()) {
        case SyntaxKind.IfStatement:
        case SyntaxKind.ForStatement:
        case SyntaxKind.WhileStatement:
        case SyntaxKind.DoStatement:
        case SyntaxKind.CaseClause:
        case SyntaxKind.CatchClause:
          complexity++;
          break;
      }
    });
    
    return complexity;
  }
  
  async analyzePatterns(targetPath, type) {
    const patterns = [];
    
    if (type === 'directory') {
      const files = await fg(['**/*.{js,jsx,ts,tsx}'], {
        cwd: targetPath,
        ignore: ['**/node_modules/**'],
      });
      
      for (const file of files) {
        const filePath = path.join(targetPath, file);
        const analysis = await this.analyzeFile(filePath);
        patterns.push({
          type: 'file',
          name: file,
          analysis,
        });
      }
    } else {
      const analysis = await this.analyzeFile(targetPath);
      patterns.push({
        type: 'file',
        name: path.basename(targetPath),
        analysis,
      });
    }
    
    return patterns;
  }
  
  async searchPatterns(query, type) {
    const results = [];
    
    for (const [filePath, analysis] of this.patterns) {
      let matches = false;
      
      if (type === 'component') {
        matches = analysis.components.some(c => 
          c.name.toLowerCase().includes(query.toLowerCase())
        );
      } else if (type === 'function') {
        matches = analysis.functions.some(f => 
          f.name.toLowerCase().includes(query.toLowerCase())
        );
      } else if (type === 'pattern') {
        matches = analysis.patterns.some(p => 
          p.toLowerCase().includes(query.toLowerCase())
        );
      } else {
        // 全文搜索
        const fullText = JSON.stringify(analysis);
        matches = fullText.toLowerCase().includes(query.toLowerCase());
      }
      
      if (matches) {
        results.push({
          file: filePath,
          analysis,
        });
      }
    }
    
    return results;
  }
  
  async generateSuggestion(patterns, intent) {
    // 基于模式生成代码建议
    const suggestions = [];
    
    for (const pattern of patterns) {
      if (pattern.analysis) {
        const { codeStyle, components, functions } = pattern.analysis;
        
        // 根据意图生成建议
        if (intent === 'component') {
          suggestions.push({
            type: 'component',
            template: this.generateComponentTemplate(codeStyle, components[0]),
          });
        } else if (intent === 'function') {
          suggestions.push({
            type: 'function',
            template: this.generateFunctionTemplate(codeStyle, functions[0]),
          });
        }
      }
    }
    
    return JSON.stringify(suggestions, null, 2);
  }
  
  generateComponentTemplate(style, componentExample) {
    const quotes = style.quotes === 'single' ? "'" : '"';
    const semi = style.semicolons ? ';' : '';
    
    return `import React from ${quotes}react${quotes}${semi}

const ComponentName = (props) => {
  // Component logic here
  
  return (
    <div>
      {/* Component JSX */}
    </div>
  )${semi}
}${semi}

export default ComponentName${semi}`;
  }
  
  generateFunctionTemplate(style, functionExample) {
    const semi = style.semicolons ? ';' : '';
    
    return `function functionName(param1, param2) {
  // Function logic here
  
  return result${semi}
}${semi}

export default functionName${semi}`;
  }
}