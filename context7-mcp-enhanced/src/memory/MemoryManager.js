import fs from 'fs/promises';
import path from 'path';
import { hash } from 'ohash';
import NodeCache from 'node-cache';

export class MemoryManager {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.memoryDir = path.join(projectRoot, '.context7-memory');
    this.cache = new NodeCache({ stdTTL: 600 }); // 10分钟缓存
    this.patterns = new Map();
    this.contexts = new Map();
    this.learnings = new Map();
  }
  
  async initialize() {
    // 创建记忆目录
    await fs.mkdir(this.memoryDir, { recursive: true });
    
    // 加载现有记忆
    await this.loadMemories();
  }
  
  async loadMemories() {
    try {
      const files = await fs.readdir(this.memoryDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.memoryDir, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const data = JSON.parse(content);
          
          switch (data.type) {
            case 'pattern':
              this.patterns.set(data.key, data);
              break;
            case 'context':
              this.contexts.set(data.key, data);
              break;
            case 'learning':
              this.learnings.set(data.key, data);
              break;
          }
        }
      }
    } catch (error) {
      console.error('Error loading memories:', error);
    }
  }
  
  async store(key, value, type = 'general') {
    const memoryKey = hash({ key, type });
    const memory = {
      key,
      value,
      type,
      timestamp: Date.now(),
      projectRoot: this.projectRoot,
    };
    
    // 存储到内存
    switch (type) {
      case 'pattern':
        this.patterns.set(memoryKey, memory);
        break;
      case 'context':
        this.contexts.set(memoryKey, memory);
        break;
      case 'learning':
        this.learnings.set(memoryKey, memory);
        break;
    }
    
    // 持久化到文件
    const filePath = path.join(this.memoryDir, `${memoryKey}.json`);
    await fs.writeFile(filePath, JSON.stringify(memory, null, 2));
    
    // 更新缓存
    this.cache.set(memoryKey, memory);
  }
  
  async recall(key, fuzzy = false) {
    if (!fuzzy) {
      // 精确匹配 - 先尝试各种类型
      const types = ['pattern', 'context', 'learning', 'general'];
      
      for (const type of types) {
        const memoryKey = hash({ key, type });
      
      // 先检查缓存
      let memory = this.cache.get(memoryKey);
      if (memory) return memory;
      
      // 检查内存映射
      memory = this.patterns.get(memoryKey) || 
               this.contexts.get(memoryKey) || 
               this.learnings.get(memoryKey);
      
      if (memory) {
        this.cache.set(memoryKey, memory);
        return memory;
      }
      
        // 从文件加载
        try {
          const filePath = path.join(this.memoryDir, `${memoryKey}.json`);
          const content = await fs.readFile(filePath, 'utf-8');
          memory = JSON.parse(content);
          this.cache.set(memoryKey, memory);
          return memory;
        } catch (error) {
          // 继续尝试下一个类型
        }
      }
      
      return null;
    } else {
      // 模糊匹配
      const results = [];
      
      // 搜索所有记忆
      const allMemories = [
        ...this.patterns.values(),
        ...this.contexts.values(),
        ...this.learnings.values(),
      ];
      
      for (const memory of allMemories) {
        if (memory.key.includes(key) || 
            JSON.stringify(memory.value).includes(key)) {
          results.push(memory);
        }
      }
      
      // 按时间戳排序
      results.sort((a, b) => b.timestamp - a.timestamp);
      
      return results.slice(0, 10); // 返回最近的10条
    }
  }
  
  async storePatterns(patterns) {
    for (const pattern of patterns) {
      const key = `pattern:${pattern.type}:${pattern.name}`;
      await this.store(key, pattern, 'pattern');
    }
  }
  
  async getPatterns(type) {
    const patterns = [];
    
    for (const [, memory] of this.patterns) {
      if (memory.value.type === type) {
        patterns.push(memory.value);
      }
    }
    
    return patterns;
  }
  
  async getRelevantPatterns(context) {
    const relevantPatterns = [];
    const contextHash = hash(context);
    
    // 基于上下文相似度查找相关模式
    for (const [, memory] of this.patterns) {
      const pattern = memory.value;
      
      // 简单的相似度计算（可以改进）
      if (this.calculateSimilarity(context, pattern.context) > 0.7) {
        relevantPatterns.push(pattern);
      }
    }
    
    // 按相关性排序
    relevantPatterns.sort((a, b) => {
      const simA = this.calculateSimilarity(context, a.context);
      const simB = this.calculateSimilarity(context, b.context);
      return simB - simA;
    });
    
    return relevantPatterns.slice(0, 5);
  }
  
  calculateSimilarity(context1, context2) {
    // 简单的Jaccard相似度计算
    const str1 = JSON.stringify(context1).toLowerCase();
    const str2 = JSON.stringify(context2).toLowerCase();
    
    const tokens1 = new Set(str1.match(/\w+/g) || []);
    const tokens2 = new Set(str2.match(/\w+/g) || []);
    
    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);
    
    return intersection.size / union.size;
  }
  
  async cleanup() {
    // 清理过期记忆
    const now = Date.now();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30天
    
    const files = await fs.readdir(this.memoryDir);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(this.memoryDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
        }
      }
    }
  }
  
  async export() {
    // 导出所有记忆
    const memories = {
      patterns: Array.from(this.patterns.values()),
      contexts: Array.from(this.contexts.values()),
      learnings: Array.from(this.learnings.values()),
      exportedAt: new Date().toISOString(),
      projectRoot: this.projectRoot,
    };
    
    const exportPath = path.join(this.memoryDir, `export-${Date.now()}.json`);
    await fs.writeFile(exportPath, JSON.stringify(memories, null, 2));
    
    return exportPath;
  }
  
  async import(exportPath) {
    // 导入记忆
    const content = await fs.readFile(exportPath, 'utf-8');
    const memories = JSON.parse(content);
    
    // 导入模式
    for (const memory of memories.patterns || []) {
      const key = hash({ key: memory.key, type: memory.type });
      this.patterns.set(key, memory);
    }
    
    // 导入上下文
    for (const memory of memories.contexts || []) {
      const key = hash({ key: memory.key, type: memory.type });
      this.contexts.set(key, memory);
    }
    
    // 导入学习内容
    for (const memory of memories.learnings || []) {
      const key = hash({ key: memory.key, type: memory.type });
      this.learnings.set(key, memory);
    }
    
    // 持久化
    await this.saveAll();
  }
  
  async saveAll() {
    // 保存所有记忆到文件
    const allMemories = [
      ...this.patterns.values(),
      ...this.contexts.values(),
      ...this.learnings.values(),
    ];
    
    for (const memory of allMemories) {
      const memoryKey = hash({ key: memory.key, type: memory.type });
      const filePath = path.join(this.memoryDir, `${memoryKey}.json`);
      await fs.writeFile(filePath, JSON.stringify(memory, null, 2));
    }
  }
}