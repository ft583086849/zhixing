/**
 * 销售链接代码生成器
 * 生成8位唯一的链接代码，格式：大小写字母+数字组合
 * 保证全局唯一性，用于返佣计算和链接追踪
 */

/**
 * 生成8位随机链接代码
 * @returns {string} 8位链接代码，如：A3kM9pXz
 */
function generateLinkCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
}

/**
 * 检查链接代码是否已存在
 * @param {Object} connection - 数据库连接
 * @param {string} code - 要检查的链接代码
 * @returns {Promise<boolean>} 如果代码已存在返回true
 */
async function isCodeExists(connection, code) {
    try {
        const [rows] = await connection.execute(`
            SELECT COUNT(*) as count FROM links 
            WHERE link_code = ? 
               OR primary_sales_code = ? 
               OR primary_user_code = ? 
               OR secondary_user_code = ?
        `, [code, code, code, code]);
        
        return rows[0].count > 0;
    } catch (error) {
        console.error('检查链接代码时出错:', error);
        throw error;
    }
}

/**
 * 生成唯一的链接代码
 * @param {Object} connection - 数据库连接
 * @param {number} maxAttempts - 最大尝试次数，默认10次
 * @returns {Promise<string>} 唯一的链接代码
 */
async function generateUniqueCode(connection, maxAttempts = 10) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const code = generateLinkCode();
        const exists = await isCodeExists(connection, code);
        
        if (!exists) {
            return code;
        }
    }
    
    throw new Error(`无法在${maxAttempts}次尝试中生成唯一链接代码`);
}

/**
 * 为销售生成所需的所有链接代码
 * @param {Object} connection - 数据库连接
 * @param {string} salesType - 销售类型：'primary' 或 'secondary'
 * @returns {Promise<Object>} 包含生成的链接代码的对象
 */
async function generateCodesForSales(connection, salesType) {
    const codes = {};
    
    if (salesType === 'primary') {
        // 一级销售需要两个链接代码
        codes.primary_sales_code = await generateUniqueCode(connection);
        codes.primary_user_code = await generateUniqueCode(connection);
    } else if (salesType === 'secondary') {
        // 二级销售需要一个链接代码
        codes.secondary_user_code = await generateUniqueCode(connection);
    } else {
        throw new Error(`不支持的销售类型: ${salesType}`);
    }
    
    return codes;
}

/**
 * 生成完整的链接URL
 * @param {string} code - 链接代码
 * @param {string} type - 链接类型：'sales_register' 或 'user_purchase'
 * @param {string} baseUrl - 基础URL，默认使用环境变量
 * @returns {string} 完整的链接URL
 */
function generateFullLink(code, type, baseUrl = process.env.FRONTEND_URL || 'https://zhixing-seven.vercel.app') {
    if (type === 'sales_register') {
        return `${baseUrl}/#/sales/register/${code}`;
    } else if (type === 'user_purchase') {
        return `${baseUrl}/#/purchase/${code}`;
    } else {
        throw new Error(`不支持的链接类型: ${type}`);
    }
}

/**
 * 批量验证链接代码的唯一性
 * @param {Object} connection - 数据库连接
 * @param {string[]} codes - 要验证的链接代码数组
 * @returns {Promise<Object>} 验证结果
 */
async function validateCodesUniqueness(connection, codes) {
    const results = {
        allUnique: true,
        duplicates: [],
        conflicts: []
    };
    
    for (const code of codes) {
        const exists = await isCodeExists(connection, code);
        if (exists) {
            results.allUnique = false;
            results.duplicates.push(code);
            
            // 查找具体的冲突
            const [conflicts] = await connection.execute(`
                SELECT 'link_code' as type, sales_id FROM links WHERE link_code = ?
                UNION ALL
                SELECT 'primary_sales_code' as type, sales_id FROM links WHERE primary_sales_code = ?
                UNION ALL
                SELECT 'primary_user_code' as type, sales_id FROM links WHERE primary_user_code = ?
                UNION ALL
                SELECT 'secondary_user_code' as type, sales_id FROM links WHERE secondary_user_code = ?
            `, [code, code, code, code]);
            
            results.conflicts.push({
                code,
                conflicts
            });
        }
    }
    
    return results;
}

module.exports = {
    generateLinkCode,
    generateUniqueCode,
    generateCodesForSales,
    generateFullLink,
    isCodeExists,
    validateCodesUniqueness
};