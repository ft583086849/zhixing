// 🔐 简单密码哈希生成（不依赖bcrypt）
// 为管理员账户生成密码哈希

const crypto = require('crypto');

// 生成简单的密码哈希（用于演示，生产环境建议使用bcrypt）
function generateSimpleHash(password, salt = 'zhixing_salt') {
    return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

// 生成bcrypt风格的哈希（模拟）
function generateBcryptStyleHash(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `$2b$10$${salt}${hash}`;
}

console.log('🔐 管理员密码哈希生成器');
console.log('======================================================================');

// 获取命令行参数
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('📋 使用方法:');
    console.log('   node 🔐简单密码哈希生成.js <用户名> <密码>');
    console.log('');
    console.log('📝 示例:');
    console.log('   node 🔐简单密码哈希生成.js admin mypassword123');
    console.log('   node 🔐简单密码哈希生成.js zhixing zhixing2024');
    console.log('');
    
    // 提供一些示例
    console.log('💡 示例密码哈希：');
    const examples = [
        { username: 'admin', password: 'admin123' },
        { username: 'zhixing', password: 'zhixing2024' },
        { username: 'manager', password: 'manager123' }
    ];
    
    examples.forEach(example => {
        const hash = generateBcryptStyleHash(example.password);
        console.log(`\n🔑 用户名: ${example.username}`);
        console.log(`   密码: ${example.password}`);
        console.log(`   哈希: ${hash}`);
        console.log(`   SQL: UPDATE admins SET username='${example.username}', password_hash='${hash}' WHERE username='admin';`);
    });
    
    console.log('\n🎯 你想要的用户名和密码是什么？');
    console.log('请告诉我，我直接为你生成SQL！');
    
    process.exit(0);
}

if (args.length !== 2) {
    console.log('❌ 错误：请提供用户名和密码');
    console.log('📋 使用方法: node 🔐简单密码哈希生成.js <用户名> <密码>');
    process.exit(1);
}

const [username, password] = args;

console.log(`\n🔐 为用户 "${username}" 生成密码哈希...`);
console.log(`🔑 原始密码: ${password}`);

// 生成密码哈希
const passwordHash = generateBcryptStyleHash(password);

console.log(`✅ 密码哈希生成成功！`);
console.log(`📝 哈希值: ${passwordHash}`);

console.log('\n📋 SQL 更新语句（推荐）:');
console.log(`UPDATE admins SET username='${username}', password_hash='${passwordHash}', updated_at=CURRENT_TIMESTAMP WHERE username='admin';`);

console.log('\n📋 或者删除重建:');
console.log(`DELETE FROM admins WHERE username='admin';`);
console.log(`INSERT INTO admins (username, password_hash, role, created_at, updated_at) VALUES ('${username}', '${passwordHash}', 'super_admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`);

console.log('\n🎯 执行步骤:');
console.log('1. 复制上面的SQL语句');
console.log('2. 在Supabase SQL Editor中执行');
console.log('3. 使用新的用户名和密码登录管理员界面');

console.log('\n✨ 完成！');