const express = require('express');
const mysql = require('mysql2/promise');
const multer = require('multer');

const router = express.Router();

// 配置multer用于文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 限制5MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'), false);
    }
  }
}).single('screenshot');

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: {
    rejectUnauthorized: false
  }
};

// 创建订单
router.post('/create', upload, async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const {
      duration,
      payment_method,
      tradingview_username,
      wechat_id,
      purchase_type,
      effective_time,
      alipay_amount,
      crypto_amount
    } = req.body;

    // 验证必填字段
    if (!duration || !payment_method || !tradingview_username || !wechat_id) {
      await connection.end();
      return res.status(400).json({
        success: false,
        message: '缺少必填字段'
      });
    }

    // TradingView用户名重复绑定验证
    const [existingOrders] = await connection.execute(
      'SELECT * FROM orders WHERE tradingview_username = ? AND status != "cancelled"',
      [tradingview_username]
    );
    if (existingOrders.length > 0) {
      await connection.end();
      return res.status(400).json({
        success: false,
        message: '您的tradingview已通过销售绑定，不支持二次销售绑定',
        tradingview_username
      });
    }

    // 处理截图数据
    let screenshotData = null;
    let screenshotExpiresAt = null;
    
    if (req.file) {
      screenshotData = req.file.buffer.toString('base64');
      // 设置截图过期时间为24小时后
      screenshotExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    // 计算价格和佣金
    const priceMap = {
      '1month': 29.99,
      '3months': 79.99,
      '6months': 149.99,
      '12months': 279.99
    };

    const amount = priceMap[duration] || 29.99;
    const commissionRate = 0.1; // 10%佣金
    const commissionAmount = amount * commissionRate;

    // 格式化生效时间
    const formatDateForMySQL = (date) => {
      if (!date) return null;
      const d = new Date(date);
      return d.toISOString().slice(0, 19).replace('T', ' ');
    };

    // 插入订单
    const [result] = await connection.execute(
      `INSERT INTO orders (
        duration, payment_method, tradingview_username, wechat_id, 
        purchase_type, effective_time, amount, alipay_amount, 
        crypto_amount, commission_rate, commission_amount, 
        status, screenshot_data, screenshot_expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        duration,
        payment_method,
        tradingview_username,
        wechat_id,
        purchase_type || 'immediate',
        formatDateForMySQL(effective_time),
        amount,
        alipay_amount || null,
        crypto_amount || null,
        commissionRate,
        commissionAmount,
        'pending',
        screenshotData,
        screenshotExpiresAt
      ]
    );

    await connection.end();

    res.json({
      success: true,
      message: '订单创建成功',
      order_id: result.insertId,
      amount: amount,
      commission_amount: commissionAmount
    });

  } catch (error) {
    console.error('创建订单错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 获取订单列表
router.get('/', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [rows] = await connection.execute(
      'SELECT * FROM orders ORDER BY created_at DESC'
    );

    await connection.end();

    res.json({
      success: true,
      orders: rows
    });

  } catch (error) {
    console.error('获取订单列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 更新订单状态
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: '状态不能为空'
      });
    }

    const connection = await mysql.createConnection(dbConfig);
    
    await connection.execute(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, id]
    );

    await connection.end();

    res.json({
      success: true,
      message: '订单状态更新成功'
    });

  } catch (error) {
    console.error('更新订单状态错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

module.exports = router; 