// // 导入模块
const mysql = require('mysql2');
const config = require('config')
// 创建连接池，设置连接池的参数
const pool = mysql.createPool({
  host: config.get('MYSQL.host'),
  port:config.get('MYSQL.port'),
  password: config.get('MYSQL.password'),
  user: config.get('MYSQL.user'),
  database: config.get('MYSQL.database'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});
const promisePool = pool.promise(); 
module.exports = promisePool
