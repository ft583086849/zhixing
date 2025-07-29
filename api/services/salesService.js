// 销售相关数据库服务
const { query, queryOne, insert, update, transaction } = require('../lib/database');

class SalesService {
  // 创建销售记录
  async createSales(salesData) {
    const { wechat_name, payment_method, payment_address, alipay_surname, chain_name, link_code } = salesData;
    
    const sql = `
      INSERT INTO sales (wechat_name, payment_method, payment_address, alipay_surname, chain_name, link_code)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const params = [wechat_name, payment_method, payment_address, alipay_surname, chain_name, link_code];
    
    try {
      const salesId = await insert(sql, params);
      return await this.getSalesById(salesId);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('链接代码已存在');
      }
      throw error;
    }
  }

  // 根据ID获取销售信息
  async getSalesById(id) {
    const sql = 'SELECT * FROM sales WHERE id = ?';
    return await queryOne(sql, [id]);
  }

  // 根据链接代码获取销售信息
  async getSalesByLinkCode(linkCode) {
    const sql = 'SELECT * FROM sales WHERE link_code = ?';
    return await queryOne(sql, [linkCode]);
  }

  // 获取所有销售信息
  async getAllSales(limit = 50, offset = 0) {
    const sql = `
      SELECT s.*, 
             COUNT(o.id) as order_count,
             COALESCE(SUM(o.amount), 0) as total_revenue,
             COALESCE(SUM(o.commission_amount), 0) as total_commission
      FROM sales s
      LEFT JOIN orders o ON s.link_code = o.link_code
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `;
    return await query(sql, [limit, offset]);
  }

  // 更新销售统计信息
  async updateSalesStats(linkCode) {
    const sql = `
      UPDATE sales s
      SET 
        total_orders = (SELECT COUNT(*) FROM orders WHERE link_code = s.link_code),
        total_revenue = (SELECT COALESCE(SUM(amount), 0) FROM orders WHERE link_code = s.link_code AND status = 'active')
      WHERE link_code = ?
    `;
    return await update(sql, [linkCode]);
  }

  // 获取销售统计信息
  async getSalesStats(linkCode) {
    const sql = `
      SELECT 
        COUNT(o.id) as total_orders,
        COALESCE(SUM(CASE WHEN o.status = 'active' THEN o.amount ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN o.status = 'active' THEN o.commission_amount ELSE 0 END), 0) as total_commission,
        COUNT(CASE WHEN o.status = 'pending_review' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN o.status = 'active' THEN 1 END) as active_orders
      FROM orders o
      WHERE o.link_code = ?
    `;
    return await queryOne(sql, [linkCode]);
  }

  // 删除销售记录（级联删除相关订单）
  async deleteSales(id) {
    const sql = 'DELETE FROM sales WHERE id = ?';
    return await update(sql, [id]);
  }

  // 检查链接代码是否唯一
  async isLinkCodeUnique(linkCode) {
    const sql = 'SELECT COUNT(*) as count FROM sales WHERE link_code = ?';
    const result = await queryOne(sql, [linkCode]);
    return result && result.count === 0;
  }
}

module.exports = new SalesService(); 