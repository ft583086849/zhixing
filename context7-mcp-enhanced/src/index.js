#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { MemoryManager } from './memory/MemoryManager.js';
import { PatternAnalyzer } from './patterns/PatternAnalyzer.js';
import { CodebaseIndexer } from './core/CodebaseIndexer.js';
import { ContextBuilder } from './core/ContextBuilder.js';
import { FileWatcher } from './core/FileWatcher.js';
import path from 'path';
import fs from 'fs';

class Context7MCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'context7-mcp-enhanced',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );
    
    this.projectRoot = process.env.PROJECT_ROOT || process.cwd();
    this.memoryManager = new MemoryManager(this.projectRoot);
    this.patternAnalyzer = new PatternAnalyzer(this.projectRoot);
    this.codebaseIndexer = new CodebaseIndexer(this.projectRoot);
    this.contextBuilder = new ContextBuilder(this.projectRoot);
    this.fileWatcher = new FileWatcher(this.projectRoot);
    
    this.setupHandlers();
  }
  
  setupHandlers() {
    // Tool: 学习代码模式
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;
      
      switch (name) {
        case 'learn_patterns':
          return await this.learnPatterns(args);
        case 'get_context':
          return await this.getContext(args);
        case 'remember':
          return await this.remember(args);
        case 'recall':
          return await this.recall(args);
        case 'analyze_file':
          return await this.analyzeFile(args);
        case 'suggest_code':
          return await this.suggestCode(args);
        case 'index_codebase':
          return await this.indexCodebase(args);
        case 'search_patterns':
          return await this.searchPatterns(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
    
    // Resources: 提供代码库资源
    this.server.setRequestHandler('resources/list', async () => {
      const resources = await this.codebaseIndexer.getResources();
      return { resources };
    });
    
    this.server.setRequestHandler('resources/read', async (request) => {
      const { uri } = request.params;
      const content = await this.codebaseIndexer.readResource(uri);
      return {
        contents: [
          {
            uri,
            mimeType: 'text/plain',
            text: content,
          },
        ],
      };
    });
    
    // Prompts: 提供智能提示
    this.server.setRequestHandler('prompts/list', async () => {
      return {
        prompts: [
          {
            name: 'code_review',
            description: '基于学习的模式进行代码审查',
          },
          {
            name: 'refactor_suggestion',
            description: '基于代码库模式提供重构建议',
          },
          {
            name: 'test_generation',
            description: '基于现有测试模式生成测试代码',
          },
        ],
      };
    });
    
    this.server.setRequestHandler('prompts/get', async (request) => {
      const { name, arguments: args } = request.params;
      const prompt = await this.generatePrompt(name, args);
      return { prompt };
    });
  }
  
  async learnPatterns(args) {
    const { path: targetPath, type } = args;
    const patterns = await this.patternAnalyzer.analyzePatterns(targetPath, type);
    await this.memoryManager.storePatterns(patterns);
    
    return {
      content: [
        {
          type: 'text',
          text: `已学习 ${patterns.length} 个代码模式`,
        },
      ],
    };
  }
  
  async getContext(args) {
    const { file, line, type } = args;
    const context = await this.contextBuilder.buildContext(file, line, type);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(context, null, 2),
        },
      ],
    };
  }
  
  async remember(args) {
    const { key, value, type = 'general' } = args;
    await this.memoryManager.store(key, value, type);
    
    return {
      content: [
        {
          type: 'text',
          text: `已记忆: ${key}`,
        },
      ],
    };
  }
  
  async recall(args) {
    const { key, fuzzy = false } = args;
    const memories = await this.memoryManager.recall(key, fuzzy);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(memories, null, 2),
        },
      ],
    };
  }
  
  async analyzeFile(args) {
    const { file } = args;
    const analysis = await this.patternAnalyzer.analyzeFile(file);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(analysis, null, 2),
        },
      ],
    };
  }
  
  async suggestCode(args) {
    const { context, intent } = args;
    const patterns = await this.memoryManager.getRelevantPatterns(context);
    const suggestion = await this.patternAnalyzer.generateSuggestion(patterns, intent);
    
    return {
      content: [
        {
          type: 'text',
          text: suggestion,
        },
      ],
    };
  }
  
  async indexCodebase(args) {
    const { full = false } = args;
    const stats = await this.codebaseIndexer.index(full);
    
    return {
      content: [
        {
          type: 'text',
          text: `索引完成: ${stats.files} 个文件, ${stats.patterns} 个模式`,
        },
      ],
    };
  }
  
  async searchPatterns(args) {
    const { query, type } = args;
    const results = await this.patternAnalyzer.searchPatterns(query, type);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  }
  
  async generatePrompt(name, args) {
    switch (name) {
      case 'code_review':
        const patterns = await this.memoryManager.getPatterns('code_style');
        return {
          messages: [
            {
              role: 'user',
              content: `请基于以下代码模式进行审查:\n${JSON.stringify(patterns, null, 2)}\n\n代码:\n${args.code}`,
            },
          ],
        };
      
      case 'refactor_suggestion':
        const refactorPatterns = await this.memoryManager.getPatterns('refactoring');
        return {
          messages: [
            {
              role: 'user',
              content: `基于项目的重构模式，提供改进建议:\n${JSON.stringify(refactorPatterns, null, 2)}\n\n当前代码:\n${args.code}`,
            },
          ],
        };
      
      case 'test_generation':
        const testPatterns = await this.memoryManager.getPatterns('testing');
        return {
          messages: [
            {
              role: 'user',
              content: `基于现有测试模式生成测试:\n${JSON.stringify(testPatterns, null, 2)}\n\n待测试代码:\n${args.code}`,
            },
          ],
        };
      
      default:
        throw new Error(`Unknown prompt: ${name}`);
    }
  }
  
  async start() {
    // 初始化各个组件
    await this.memoryManager.initialize();
    await this.patternAnalyzer.initialize();
    await this.codebaseIndexer.initialize();
    await this.contextBuilder.initialize();
    
    // 启动文件监听
    this.fileWatcher.start((event, path) => {
      this.handleFileChange(event, path);
    });
    
    // 启动MCP服务器
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('Context7 MCP Enhanced Server started');
  }
  
  async handleFileChange(event, filePath) {
    if (event === 'change' || event === 'add') {
      // 重新分析改变的文件
      await this.patternAnalyzer.analyzeFile(filePath);
      // 更新索引
      await this.codebaseIndexer.updateFile(filePath);
    }
  }
}

// 启动服务器
const server = new Context7MCPServer();
server.start().catch(console.error);