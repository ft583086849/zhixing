const express = require('express');
const mysql = require('mysql2/promise');

const router = express.Router();

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

// 获取支付配置
router.get('/', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [rows] = await connection.execute(
      'SELECT * FROM payment_config ORDER BY id DESC LIMIT 1'
    );

    await connection.end();

    if (rows.length === 0) {
      return res.json({
        success: true,
        config: {
          alipay_rate: 1.5,
          crypto_rate: 1.0,
          commission_rate: 0.1
        }
      });
    }

    res.json({
      success: true,
      config: rows[0]
    });

  } catch (error) {
    console.error('获取支付配置错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 更新支付配置
router.put('/', async (req, res) => {
  try {
    const { alipay_rate, crypto_rate, commission_rate } = req.body;

    const connection = await mysql.createConnection(dbConfig);
    
    // 检查是否已有配置
    const [existing] = await connection.execute(
      'SELECT * FROM payment_config ORDER BY id DESC LIMIT 1'
    );

    if (existing.length > 0) {
      // 更新现有配置
      await connection.execute(
        'UPDATE payment_config SET alipay_rate = ?, crypto_rate = ?, commission_rate = ?, updated_at = NOW() WHERE id = ?',
        [alipay_rate, crypto_rate, commission_rate, existing[0].id]
      );
    } else {
      // 创建新配置
      await connection.execute(
        'INSERT INTO payment_config (alipay_rate, crypto_rate, commission_rate) VALUES (?, ?, ?)',
        [alipay_rate, crypto_rate, commission_rate]
      );
    }

    await connection.end();

    res.json({
      success: true,
      message: '支付配置更新成功'
    });

  } catch (error) {
    console.error('更新支付配置错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

module.exports = router; 