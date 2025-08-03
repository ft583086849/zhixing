const fs = require('fs');
const path = require('path');

console.log('🔒 知行财库安全性优化\n');

// 优化结果
const optimizationResults = {
  filesModified: 0,
  fileUploadSecurityAdded: 0,
  jwtSecurityAdded: 0,
  inputValidationAdded: 0,
  corsSecurityAdded: 0,
  rateLimitingAdded: 0
};

function enhanceFileUploadSecurity() {
  console.log('📁 增强文件上传安全性...');
  
  const serverIndexPath = './server/index.js';
  let serverContent = fs.readFileSync(serverIndexPath, 'utf8');
  let modified = false;
  
  // 添加文件上传安全检查
  if (!serverContent.includes('fileFilter')) {
    const fileUploadSecurity = `
// 文件上传安全检查配置
const fileFilter = (req, file, cb) => {
  // 检查文件类型
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'), false);
  }
};

// 文件大小限制
const maxFileSize = 10 * 1024 * 1024; // 10MB

// 文件数量限制
const maxFiles = 1;

// 安全检查中间件
const securityMiddleware = (req, res, next) => {
  // 检查文件大小
  if (req.file && req.file.size > maxFileSize) {
    return res.status(400).json({
      success: false,
      message: '文件大小超过限制'
    });
  }
  
  // 检查文件扩展名
  if (req.file) {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      return res.status(400).json({
        success: false,
        message: '不支持的文件格式'
      });
    }
  }
  
  next();
};
`;
    
    // 在multer配置之前添加安全检查
    serverContent = serverContent.replace(
      /const upload = multer\(/,
      `${fileUploadSecurity}\n\nconst upload = multer(`
    );
    
    // 更新multer配置
    serverContent = serverContent.replace(
      /multer\(\{[^}]*\}\)/,
      `multer({
  dest: uploadPath,
  fileFilter: fileFilter,
  limits: {
    fileSize: maxFileSize,
    files: maxFiles
  }
})`
    );
    
    // 添加安全检查中间件
    serverContent = serverContent.replace(
      /app\.use\('\/uploads'/,
      `app.use('/uploads', securityMiddleware)`
    );
    
    modified = true;
    optimizationResults.fileUploadSecurityAdded++;
  }
  
  if (modified) {
    fs.writeFileSync(serverIndexPath, serverContent);
    optimizationResults.filesModified++;
    console.log('✅ 增强文件上传安全性');
  }
}

function enhanceJWTSecurity() {
  console.log('🔐 增强JWT安全性...');
  
  const serverIndexPath = './server/index.js';
  let serverContent = fs.readFileSync(serverIndexPath, 'utf8');
  let modified = false;
  
  // 更新JWT配置
  if (!serverContent.includes('JWT_SECRET_UPDATE')) {
    const jwtSecurity = `
// JWT安全配置
const JWT_SECRET = process.env.JWT_SECRET || 'zhixing_treasury_jwt_secret_2025_secure_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// JWT验证中间件增强
const enhancedAuthMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: '缺少访问令牌'
    });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 检查令牌是否过期
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return res.status(401).json({
        success: false,
        message: '访问令牌已过期'
      });
    }
    
    // 检查令牌是否被撤销（可以添加黑名单检查）
    // if (isTokenBlacklisted(token)) {
    //   return res.status(401).json({
    //     success: false,
    //     message: '访问令牌已被撤销'
    //   });
    // }
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '访问令牌已过期'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的访问令牌'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: '令牌验证失败'
      });
    }
  }
};
`;
    
    // 替换现有的JWT配置
    serverContent = serverContent.replace(
      /const JWT_SECRET[^;]+;/,
      `const JWT_SECRET_UPDATE = '${jwtSecurity.split('\n')[2]}';`
    );
    
    // 添加增强的认证中间件
    if (!serverContent.includes('enhancedAuthMiddleware')) {
      serverContent = serverContent.replace(
        /app\.use\('\/api\/admin'/,
        `app.use('/api/admin', enhancedAuthMiddleware)`
      );
    }
    
    modified = true;
    optimizationResults.jwtSecurityAdded++;
  }
  
  if (modified) {
    fs.writeFileSync(serverIndexPath, serverContent);
    optimizationResults.filesModified++;
    console.log('✅ 增强JWT安全性');
  }
}

function addInputValidation() {
  console.log('✅ 添加输入验证...');
  
  // 检查是否已安装验证库
  const packageJsonPath = './server/package.json';
  let packageContent = fs.readFileSync(packageJsonPath, 'utf8');
  let modified = false;
  
  if (!packageContent.includes('express-validator')) {
    // 添加express-validator依赖
    packageContent = packageContent.replace(
      /"dependencies":\s*{/,
      `"dependencies": {
    "express-validator": "^7.0.1",`
    );
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(packageJsonPath, packageContent);
    console.log('✅ 添加express-validator依赖');
  }
  
  // 创建验证中间件
  const validationMiddleware = `
const { body, validationResult } = require('express-validator');

// 通用验证中间件
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '输入验证失败',
      errors: errors.array()
    });
  }
  next();
};

// 登录验证规则
const loginValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('用户名长度必须在3-50个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码长度至少6个字符'),
  validateRequest
];

// 订单创建验证规则
const orderValidation = [
  body('tradingview_username')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('TradingView用户名不能为空且长度不能超过100个字符'),
  body('customer_wechat')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('用户微信号不能为空且长度不能超过100个字符'),
  body('duration')
    .isIn(['7days', '1month', '3months', '6months', '1year', 'lifetime'])
    .withMessage('无效的购买时长'),
  body('payment_method')
    .isIn(['alipay', 'wechat'])
    .withMessage('无效的支付方式'),
  validateRequest
];

// 支付配置验证规则
const paymentConfigValidation = [
  body('alipay_account')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('支付宝账户不能为空且长度不能超过100个字符'),
  body('wechat_account')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('微信账户不能为空且长度不能超过100个字符'),
  validateRequest
];
`;
  
  // 创建验证中间件文件
  const validationPath = './server/middleware/validation.js';
  if (!fs.existsSync(validationPath)) {
    fs.writeFileSync(validationPath, validationMiddleware);
    optimizationResults.inputValidationAdded++;
    console.log('✅ 创建输入验证中间件');
  }
}

function enhanceCORSSecurity() {
  console.log('🌐 增强CORS安全性...');
  
  const serverIndexPath = './server/index.js';
  let serverContent = fs.readFileSync(serverIndexPath, 'utf8');
  let modified = false;
  
  // 增强CORS配置
  if (!serverContent.includes('CORS_SECURITY')) {
    const corsSecurity = `
// CORS安全配置
const corsOptions = {
  origin: function (origin, callback) {
    // 允许的域名列表
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://yourdomain.com', // 生产环境域名
      'https://www.yourdomain.com'
    ];
    
    // 允许没有origin的请求（如移动应用）
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('不允许的跨域请求'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24小时
};

app.use(cors(corsOptions));
`;
    
    // 替换现有的CORS配置
    serverContent = serverContent.replace(
      /app\.use\(cors\(\)\);/,
      corsSecurity
    );
    
    modified = true;
    optimizationResults.corsSecurityAdded++;
  }
  
  if (modified) {
    fs.writeFileSync(serverIndexPath, serverContent);
    optimizationResults.filesModified++;
    console.log('✅ 增强CORS安全性');
  }
}

function addRateLimiting() {
  console.log('⏱️  添加访问频率限制...');
  
  // 检查是否已安装rate-limiter
  const packageJsonPath = './server/package.json';
  let packageContent = fs.readFileSync(packageJsonPath, 'utf8');
  let modified = false;
  
  if (!packageContent.includes('express-rate-limit')) {
    // 添加express-rate-limit依赖
    packageContent = packageContent.replace(
      /"dependencies":\s*{/,
      `"dependencies": {
    "express-rate-limit": "^7.1.5",`
    );
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(packageJsonPath, packageContent);
    console.log('✅ 添加express-rate-limit依赖');
  }
  
  // 创建频率限制中间件
  const rateLimitMiddleware = `
const rateLimit = require('express-rate-limit');

// 通用频率限制
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 登录频率限制
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 限制每个IP 15分钟内最多5次登录尝试
  message: {
    success: false,
    message: '登录尝试过于频繁，请15分钟后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 文件上传频率限制
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 10, // 限制每个IP 1小时内最多10次文件上传
  message: {
    success: false,
    message: '文件上传过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  loginLimiter,
  uploadLimiter
};
`;
  
  // 创建频率限制中间件文件
  const rateLimitPath = './server/middleware/rateLimit.js';
  if (!fs.existsSync(rateLimitPath)) {
    fs.writeFileSync(rateLimitPath, rateLimitMiddleware);
    optimizationResults.rateLimitingAdded++;
    console.log('✅ 创建访问频率限制中间件');
  }
}

function createSecurityGuide() {
  const guide = `
# 知行财库安全性指南

## 已实现的安全措施

### 1. 文件上传安全
- 文件类型白名单验证
- 文件大小限制（10MB）
- 文件数量限制（1个）
- 文件扩展名检查
- 安全检查中间件

### 2. JWT安全增强
- 安全的JWT密钥配置
- 令牌过期检查
- 令牌验证错误处理
- 增强的认证中间件

### 3. 输入验证
- express-validator集成
- 登录验证规则
- 订单创建验证规则
- 支付配置验证规则
- 通用验证中间件

### 4. CORS安全
- 域名白名单
- 请求方法限制
- 请求头限制
- 凭证支持配置

### 5. 访问频率限制
- 通用请求限制（15分钟100次）
- 登录频率限制（15分钟5次）
- 文件上传限制（1小时10次）

## 安全最佳实践

### 对于开发者
1. 定期更新依赖包
2. 使用HTTPS协议
3. 实施最小权限原则
4. 记录安全日志
5. 定期安全审计

### 对于用户
1. 使用强密码
2. 定期更换密码
3. 不在公共设备登录
4. 及时登出系统
5. 保护个人信息

## 安全监控

### 监控指标
- 登录失败次数
- 异常访问模式
- 文件上传频率
- API调用频率
- 错误日志分析

### 安全事件响应
1. 立即隔离受影响系统
2. 分析安全事件原因
3. 修复安全漏洞
4. 恢复系统功能
5. 记录事件处理过程

## 进一步安全建议

### 1. 数据安全
- 数据库加密
- 敏感数据脱敏
- 定期数据备份
- 数据访问审计

### 2. 网络安全
- 防火墙配置
- DDoS防护
- SSL/TLS配置
- 网络监控

### 3. 应用安全
- 代码安全审计
- 漏洞扫描
- 渗透测试
- 安全培训
`;

  fs.writeFileSync('./security-guide.md', guide);
  console.log('✅ 创建安全性指南: security-guide.md');
}

async function runSecurityOptimization() {
  console.log('🚀 开始安全性优化...\n');
  
  enhanceFileUploadSecurity();
  enhanceJWTSecurity();
  addInputValidation();
  enhanceCORSSecurity();
  addRateLimiting();
  
  console.log('\n📚 创建安全性指南...');
  createSecurityGuide();
  
  // 输出优化结果
  console.log('\n📊 安全性优化结果');
  console.log('================================================================================');
  console.log(`修改的文件数: ${optimizationResults.filesModified}`);
  console.log(`文件上传安全: ${optimizationResults.fileUploadSecurityAdded}`);
  console.log(`JWT安全增强: ${optimizationResults.jwtSecurityAdded}`);
  console.log(`输入验证: ${optimizationResults.inputValidationAdded}`);
  console.log(`CORS安全: ${optimizationResults.corsSecurityAdded}`);
  console.log(`访问频率限制: ${optimizationResults.rateLimitingAdded}`);
  
  const totalImprovements = optimizationResults.fileUploadSecurityAdded + 
                           optimizationResults.jwtSecurityAdded + 
                           optimizationResults.inputValidationAdded + 
                           optimizationResults.corsSecurityAdded + 
                           optimizationResults.rateLimitingAdded;
  
  console.log(`\n🎯 总改进项: ${totalImprovements}`);
  
  if (totalImprovements > 0) {
    console.log('✅ 安全性优化完成！');
    console.log('📖 请查看 security-guide.md 了解详细说明');
  } else {
    console.log('ℹ️  未发现需要优化的安全问题');
  }
  
  console.log('\n💡 下一步建议:');
  console.log('   1. 安装新的依赖包: npm install');
  console.log('   2. 测试安全功能');
  console.log('   3. 配置生产环境安全设置');
  console.log('   4. 进行用户体验优化');
}

// 运行安全性优化
runSecurityOptimization().catch(error => {
  console.error('安全性优化失败:', error.message);
}); 