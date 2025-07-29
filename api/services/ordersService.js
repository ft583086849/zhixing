// 订单相关数据库服务
const { query, queryOne, insert, update, transaction } = require('../lib/database');

class OrdersService {
  // 创建订单
  async createOrder(orderData) {
    const {
      link_code,
      tradingview_username,
      customer_wechat,
      duration,
      amount,
      payment_method,
      payment_time,
      purchase_type,
      effective_time,
      expiry_time,
      screenshot_path,
      alipay_amount,
      commission_rate
    } = orderData;

    // 计算佣金金额
    const commission_amount = amount * commission_rate;

    const sql = `
      INSERT INTO orders (
        link_code, tradingview_username, customer_wechat, duration, amount,
        payment_method, payment_time, purchase_type, effective_time, expiry_time,
        screenshot_path, alipay_amount, commission_rate, commission_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      link_code, tradingview_username, customer_wechat, duration, amount,
      payment_method, payment_time, purchase_type, effective_time, expiry_time,
      screenshot_path, alipay_amount, commission_rate, commission_amount
    ];

    try {
      return await transaction(async (connection) => {
        // 插入订单
        const [result] = await connection.execute(sql, params);
        const orderId = result.insertId;

        // 更新销售员统计信息
        const updateSalesSQL = `
          UPDATE sales 
          SET 
            total_orders = total_orders + 1,
            total_revenue = total_revenue + ?
          WHERE link_code = ?
        `;
        await connection.execute(updateSalesSQL, [amount, link_code]);

        // 如果是永久授权，更新限量
        if (duration === 'lifetime') {
          const updateLimitSQL = 'UPDATE lifetime_limit SET used_count = used_count + 1 WHERE is_active = TRUE';
          await connection.execute(updateLimitSQL);
        }

        return await this.getOrderById(orderId);
      });
    } catch (error) {
      console.error('创建订单错误:', error);
      throw error;
    }
  }

  // 根据ID获取订单
  async getOrderById(id) {
    const sql = `
      SELECT o.*, s.wechat_name as sales_wechat_name
      FROM orders o
      LEFT JOIN sales s ON o.link_code = s.link_code
      WHERE o.id = ?
    `;
    return await queryOne(sql, [id]);
  }

  // 获取订单列表
  async getOrders(filters = {}, limit = 20, offset = 0) {
    let sql = `
      SELECT o.*, s.wechat_name as sales_wechat_name
      FROM orders o
      LEFT JOIN sales s ON o.link_code = s.link_code
      WHERE 1=1
    `;
    const params = [];

    // 添加过滤条件
    if (filters.link_code) {
      sql += ' AND o.link_code = ?';
      params.push(filters.link_code);
    }

    if (filters.status) {
      sql += ' AND o.status = ?';
      params.push(filters.status);
    }

    if (filters.payment_method) {
      sql += ' AND o.payment_method = ?';
      params.push(filters.payment_method);
    }

    if (filters.duration) {
      sql += ' AND o.duration = ?';
      params.push(filters.duration);
    }

    if (filters.date_from) {
      sql += ' AND o.created_at >= ?';
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      sql += ' AND o.created_at <= ?';
      params.push(filters.date_to);
    }

    sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return await query(sql, params);
  }

  // 更新订单状态
  async updateOrderStatus(id, status) {
    const sql = 'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    const affectedRows = await update(sql, [status, id]);
    
    if (affectedRows > 0) {
      return await this.getOrderById(id);
    }
    return null;
  }

  // 获取订单统计信息
  async getOrderStats(filters = {}) {
    let sql = `
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'pending_review' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_orders,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
        COALESCE(SUM(amount), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status = 'active' THEN commission_amount ELSE 0 END), 0) as total_commission,
        COALESCE(AVG(amount), 0) as average_order_value
      FROM orders
      WHERE 1=1
    `;
    const params = [];

    // 添加过滤条件
    if (filters.date_from) {
      sql += ' AND created_at >= ?';
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      sql += ' AND created_at <= ?';
      params.push(filters.date_to);
    }

    return await queryOne(sql, params);
  }

  // 获取即将过期的订单
  async getExpiringOrders(days = 7) {
    const sql = `
      SELECT o.*, s.wechat_name as sales_wechat_name
      FROM orders o
      LEFT JOIN sales s ON o.link_code = s.link_code
      WHERE o.status = 'active' 
        AND o.expiry_time IS NOT NULL
        AND o.expiry_time <= DATE_ADD(NOW(), INTERVAL ? DAY)
      ORDER BY o.expiry_time ASC
    `;
    return await query(sql, [days]);
  }

  // 批量更新过期订单
  async updateExpiredOrders() {
    const sql = `
      UPDATE orders 
      SET status = 'expired', updated_at = CURRENT_TIMESTAMP
      WHERE status = 'active' 
        AND expiry_time IS NOT NULL 
        AND expiry_time <= NOW()
    `;
    return await update(sql);
  }

  // 删除订单
  async deleteOrder(id) {
    const sql = 'DELETE FROM orders WHERE id = ?';
    return await update(sql, [id]);
  }

  // 根据销售员获取订单列表
  async getOrdersBySales(linkCode, limit = 50, offset = 0) {
    const sql = `
      SELECT * FROM orders 
      WHERE link_code = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    return await query(sql, [linkCode, limit, offset]);
  }
}

module.exports = new OrdersService(); 