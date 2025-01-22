const SqliteDB = require('../utils/sqlite').SqliteDB;
const fs = require('fs');
const path = require('path');
class SQLitePoolManager {
  constructor() {
    this.pools = new Map();
  }

  async init() {
    // 获取db目录下的所有文件
    const dbdirs = await fs.readdirSync('./db');
    for(let dir of dbdirs) {
        this.getPool(dir)
    }
  }
  // 创建一个连接池
  async getPool(dir) {
    try {
      const dbPath = path.resolve('./db', dir, 'BaiduYunCacheFileV0.db')
      if (!this.pools.has(dbPath)) {
        const pool = new SqliteDB(dbPath);
        this.pools.set(dir, pool);
      }
      return this.pools.get(dir);
    } catch (error) {
      throw new Error(error.message)
    }
   
  }

  // 关闭所有连接池
  async closeAllPools() {
    for (const pool of this.pools.values()) {
      await new Promise((resolve, reject) => {
        pool.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
    this.pools.clear();
  }
}

module.exports = SQLitePoolManager
