import chokidar from 'chokidar';
import path from 'path';
import ignore from 'ignore';
import fs from 'fs/promises';

export class FileWatcher {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.watcher = null;
    this.ig = ignore();
    this.callbacks = [];
    this.debounceTimers = new Map();
  }
  
  async initialize() {
    await this.loadGitignore();
  }
  
  async loadGitignore() {
    try {
      const gitignorePath = path.join(this.projectRoot, '.gitignore');
      const content = await fs.readFile(gitignorePath, 'utf-8');
      this.ig.add(content);
    } catch (error) {
      // 默认忽略规则
      this.ig.add([
        'node_modules',
        '.git',
        'dist',
        'build',
        '.next',
        '.cache',
        '*.log',
        '.DS_Store',
      ]);
    }
  }
  
  start(callback) {
    if (this.watcher) {
      this.stop();
    }
    
    this.callbacks.push(callback);
    
    this.watcher = chokidar.watch(this.projectRoot, {
      ignored: (path) => {
        const relativePath = path.replace(this.projectRoot + '/', '');
        return this.ig.ignores(relativePath);
      },
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100,
      },
    });
    
    this.watcher
      .on('add', (path) => this.handleFileEvent('add', path))
      .on('change', (path) => this.handleFileEvent('change', path))
      .on('unlink', (path) => this.handleFileEvent('delete', path))
      .on('addDir', (path) => this.handleFileEvent('addDir', path))
      .on('unlinkDir', (path) => this.handleFileEvent('deleteDir', path))
      .on('error', (error) => console.error('Watcher error:', error));
    
    console.error('File watcher started for:', this.projectRoot);
  }
  
  handleFileEvent(event, filePath) {
    const relativePath = path.relative(this.projectRoot, filePath);
    
    // 防抖处理
    const debounceKey = `${event}:${relativePath}`;
    
    if (this.debounceTimers.has(debounceKey)) {
      clearTimeout(this.debounceTimers.get(debounceKey));
    }
    
    const timer = setTimeout(() => {
      this.debounceTimers.delete(debounceKey);
      
      // 通知所有回调
      this.callbacks.forEach(callback => {
        try {
          callback(event, relativePath, filePath);
        } catch (error) {
          console.error('Callback error:', error);
        }
      });
    }, 100);
    
    this.debounceTimers.set(debounceKey, timer);
  }
  
  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    
    // 清理防抖定时器
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    
    this.callbacks = [];
    
    console.error('File watcher stopped');
  }
  
  addCallback(callback) {
    this.callbacks.push(callback);
  }
  
  removeCallback(callback) {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }
  
  async getFileStats(relativePath) {
    const absolutePath = path.join(this.projectRoot, relativePath);
    
    try {
      const stats = await fs.stat(absolutePath);
      return {
        size: stats.size,
        modified: stats.mtime,
        created: stats.birthtime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
      };
    } catch (error) {
      return null;
    }
  }
  
  isWatching() {
    return this.watcher !== null;
  }
  
  getWatchedPaths() {
    if (this.watcher) {
      return Object.keys(this.watcher.getWatched());
    }
    return [];
  }
}