// 🔐 生成管理员密码哈希
// 用于生成bcrypt密码哈希，然后在SQL中使用

const bcrypt = require('bcrypt');

// 配置
const SALT_ROUNDS = 10;

// 生成密码哈希的函数
function generatePasswordHash(plainPassword) {
    return bcrypt.hashSync(plainPassword, SALT_ROUNDS);
}

// 验证密码的函数（用于测试）
function verifyPassword(plainPassword, hash) {
    return bcrypt.compareSync(plainPassword, hash);
}

console.log('🔐 管理员密码哈希生成器');
console.log('======================================================================');

// 获取命令行参数
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('📋 使用方法:');
    console.log('   node 🔐生成管理员密码哈希.js <用户名> <密码>');
    console.log('');
    console.log('📝 示例:');
    console.log('   node 🔐生成管理员密码哈希.js admin mypassword123');
    console.log('   node 🔐生成管理员密码哈希.js zhixing zhixing2024');
    console.log('');
    
    // 提供一些示例
    console.log('💡 示例密码哈希：');
    const examples = [
        { username: 'admin', password: 'admin123' },
        { username: 'zhixing', password: 'zhixing2024' },
        { username: 'manager', password: 'manager123' }
    ];
    
    examples.forEach(example => {
        const hash = generatePasswordHash(example.password);
        console.log(`\n🔑 用户名: ${example.username}`);
        console.log(`   密码: ${example.password}`);
        console.log(`   哈希: ${hash}`);
        console.log(`   SQL: UPDATE admins SET username='${example.username}', password_hash='${hash}' WHERE id=1;`);
    });
    
    process.exit(0);
}

if (args.length !== 2) {
    console.log('❌ 错误：请提供用户名和密码');
    console.log('📋 使用方法: node 🔐生成管理员密码哈希.js <用户名> <密码>');
    process.exit(1);
}

const [username, password] = args;

console.log(`\n🔐 为用户 "${username}" 生成密码哈希...`);
console.log(`🔑 原始密码: ${password}`);

// 生成密码哈希
const passwordHash = generatePasswordHash(password);

console.log(`✅ 密码哈希生成成功！`);
console.log(`📝 哈希值: ${passwordHash}`);

// 验证哈希是否正确
const isValid = verifyPassword(password, passwordHash);
console.log(`🧪 密码验证: ${isValid ? '✅ 通过' : '❌ 失败'}`);

console.log('\n📋 SQL 更新语句:');
console.log(`UPDATE admins SET username='${username}', password_hash='${passwordHash}', updated_at=CURRENT_TIMESTAMP WHERE username='admin';`);

console.log('\n📋 或者删除重建:');
console.log(`DELETE FROM admins WHERE username='admin';`);
console.log(`INSERT INTO admins (username, password_hash, role, created_at, updated_at) VALUES ('${username}', '${passwordHash}', 'super_admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`);

console.log('\n🎯 下一步操作:');
console.log('1. 复制上面的SQL语句');
console.log('2. 在Supabase SQL Editor中执行');
console.log('3. 使用新的用户名和密码登录');

console.log('\n✨ 完成！');