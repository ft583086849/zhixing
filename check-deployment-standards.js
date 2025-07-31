#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 部署标准检查器
class DeploymentChecker {
  constructor() {
    this.apiDir = './api';
    this.results = {
      passed: [],
      failed: [],
      warnings: []
    };
  }

  // 获取所有API文件
  getApiFiles() {
    try {
      const files = fs.readdirSync(this.apiDir);
      return files.filter(file => file.endsWith('.js'));
    } catch (error) {
      console.error('❌ 无法读取api目录:', error.message);
      return [];
    }
  }

  // 检查文件语法
  checkSyntax(filePath) {
    try {
      execSync(`node -c ${filePath}`, { stdio: 'pipe' });
      return { passed: true, error: null };
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  // 检查文件内容
  checkFileContent(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const checks = {
      headerComment: false,
      mysqlImport: false,
      dbConfig: false,
      corsHeaders: false,
      optionsHandler: false,
      errorHandling: false,
      dbConnection: false,
      pathHandling: false,
      responseFormat: false
    };

    // 检查头部注释
    checks.headerComment = /\/\/ Vercel Serverless Function/.test(content);

    // 检查mysql导入
    checks.mysqlImport = /const mysql = require\('mysql2\/promise'\)/.test(content);

    // 检查数据库配置
    checks.dbConfig = /const dbConfig = \{[\s\S]*?host: process\.env\.DB_HOST[\s\S]*?\}/.test(content);

    // 检查CORS设置
    checks.corsHeaders = /res\.setHeader\('Access-Control-Allow-Credentials', true\)/.test(content) &&
                        /res\.setHeader\('Access-Control-Allow-Origin', '\*'\)/.test(content);

    // 检查OPTIONS处理
    checks.optionsHandler = /if \(req\.method === 'OPTIONS'\)/.test(content);

    // 检查错误处理
    checks.errorHandling = /try\s*\{[\s\S]*?\}\s*catch\s*\(error\)/.test(content);

    // 检查数据库连接
    checks.dbConnection = /await mysql\.createConnection\(dbConfig\)/.test(content) &&
                         /await connection\.end\(\)/.test(content);

    // 检查路径处理
    checks.pathHandling = /const \{ path \} = req\.query/.test(content) ||
                         /req\.query\.path/.test(content);

    // 检查响应格式
    checks.responseFormat = /res\.json\(\{[\s\S]*?success:/.test(content);

    return checks;
  }

  // 检查文件权限
  checkFilePermissions(filePath) {
    try {
      const stats = fs.statSync(filePath);
      const mode = stats.mode & parseInt('777', 8);
      return mode === parseInt('644', 8);
    } catch (error) {
      return false;
    }
  }

  // 检查单个文件
  checkFile(fileName) {
    const filePath = path.join(this.apiDir, fileName);
    const fileResult = {
      file: fileName,
      syntax: { passed: false, error: null },
      content: {},
      permissions: false,
      overall: false
    };

    console.log(`\n🔍 检查文件: ${fileName}`);

    // 检查语法
    fileResult.syntax = this.checkSyntax(filePath);
    if (fileResult.syntax.passed) {
      console.log('  ✅ 语法检查通过');
    } else {
      console.log(`  ❌ 语法错误: ${fileResult.syntax.error}`);
    }

    // 检查文件内容
    fileResult.content = this.checkFileContent(filePath);
    const contentChecks = [
      { name: '头部注释', key: 'headerComment' },
      { name: 'MySQL导入', key: 'mysqlImport' },
      { name: '数据库配置', key: 'dbConfig' },
      { name: 'CORS设置', key: 'corsHeaders' },
      { name: 'OPTIONS处理', key: 'optionsHandler' },
      { name: '错误处理', key: 'errorHandling' },
      { name: '数据库连接', key: 'dbConnection' },
      { name: '路径处理', key: 'pathHandling' },
      { name: '响应格式', key: 'responseFormat' }
    ];

    contentChecks.forEach(check => {
      if (fileResult.content[check.key]) {
        console.log(`  ✅ ${check.name}`);
      } else {
        console.log(`  ❌ ${check.name}`);
      }
    });

    // 检查文件权限
    fileResult.permissions = this.checkFilePermissions(filePath);
    if (fileResult.permissions) {
      console.log('  ✅ 文件权限正确');
    } else {
      console.log('  ❌ 文件权限不正确');
    }

    // 总体评估
    const allChecks = [
      fileResult.syntax.passed,
      fileResult.content.headerComment,
      fileResult.content.mysqlImport,
      fileResult.content.dbConfig,
      fileResult.content.corsHeaders,
      fileResult.content.optionsHandler,
      fileResult.content.errorHandling,
      fileResult.content.dbConnection,
      fileResult.content.responseFormat,
      fileResult.permissions
    ];

    fileResult.overall = allChecks.every(check => check === true);

    if (fileResult.overall) {
      this.results.passed.push(fileName);
      console.log(`  🎉 ${fileName} 符合所有部署标准`);
    } else {
      this.results.failed.push(fileName);
      console.log(`  ❌ ${fileName} 不符合部署标准`);
    }

    return fileResult;
  }

  // 运行完整检查
  run() {
    console.log('🚀 开始部署标准检查...\n');
    console.log('📋 检查标准:');
    console.log('  - 文件语法正确');
    console.log('  - 结构完整 (头部注释、导入、配置、CORS、错误处理等)');
    console.log('  - 文件权限正确 (644)');
    console.log('  - 数据库连接管理正确');
    console.log('  - 响应格式统一\n');

    const files = this.getApiFiles();
    if (files.length === 0) {
      console.log('❌ 未找到API文件');
      return false;
    }

    console.log(`📁 找到 ${files.length} 个API文件:`);
    files.forEach(file => console.log(`  - ${file}`));

    const results = files.map(file => this.checkFile(file));

    // 输出总结
    console.log('\n' + '='.repeat(50));
    console.log('📊 检查结果总结:');
    console.log(`✅ 通过: ${this.results.passed.length} 个文件`);
    console.log(`❌ 失败: ${this.results.failed.length} 个文件`);

    if (this.results.passed.length > 0) {
      console.log('\n✅ 通过的文件:');
      this.results.passed.forEach(file => console.log(`  - ${file}`));
    }

    if (this.results.failed.length > 0) {
      console.log('\n❌ 失败的文件:');
      this.results.failed.forEach(file => console.log(`  - ${file}`));
    }

    const allPassed = this.results.failed.length === 0;
    console.log(`\n${allPassed ? '🎉 所有文件都符合部署标准！可以安全推送。' : '⚠️  有文件不符合标准，请修复后再推送。'}`);

    return allPassed;
  }
}

// 运行检查
if (require.main === module) {
  const checker = new DeploymentChecker();
  const result = checker.run();
  process.exit(result ? 0 : 1);
}

module.exports = DeploymentChecker; 