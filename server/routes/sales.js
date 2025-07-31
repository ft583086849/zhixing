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

// 获取销售统计
router.get('/stats', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // 获取总订单数
    const [totalOrders] = await connection.execute(
      'SELECT COUNT(*) as total FROM orders'
    );

    // 获取总销售额
    const [totalSales] = await connection.execute(
      'SELECT SUM(amount) as total FROM orders WHERE status = "completed"'
    );

    // 获取总佣金
    const [totalCommission] = await connection.execute(
      'SELECT SUM(commission_amount) as total FROM orders WHERE status = "completed"'
    );

    // 获取本月订单数
    const [monthlyOrders] = await connection.execute(
      'SELECT COUNT(*) as total FROM orders WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())'
    );

    // 获取本月销售额
    const [monthlySales] = await connection.execute(
      'SELECT SUM(amount) as total FROM orders WHERE status = "completed" AND MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())'
    );

    await connection.end();

    res.json({
      success: true,
      stats: {
        totalOrders: totalOrders[0].total || 0,
        totalSales: totalSales[0].total || 0,
        totalCommission: totalCommission[0].total || 0,
        monthlyOrders: monthlyOrders[0].total || 0,
        monthlySales: monthlySales[0].total || 0
      }
    });

  } catch (error) {
    console.error('获取销售统计错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 获取销售列表
router.get('/', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [rows] = await connection.execute(
      'SELECT * FROM orders WHERE status = "completed" ORDER BY created_at DESC'
    );

    await connection.end();

    res.json({
      success: true,
      sales: rows
    });

  } catch (error) {
    console.error('获取销售列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

module.exports = router; 