'use strict';
const { logger } = require('../utils/logger');
const SqliteDB = require('../utils/sqlite').SqliteDB;
const mongodber = require('../utils/mongodber');
const diskDB = mongodber.use('disk');
/**
 * 执行sqlite文件
 * @param {db文件路径} tempfile
 */
async function task(dbfile, uk) { 
    let sqliteDB;
    try {
        sqliteDB = new SqliteDB(dbfile);
        logger.info('开始构建文件树');
        sqliteDB.init_fts_table()
        // 更新网盘状态,设置为 done
        await diskDB.collection('disks').updateMany({uk}, {$set: {dir_tree_status: 'done'}});
    } catch (error) { 
        // 更新网盘状态,设置为 failed
        await diskDB.collection('disks').updateMany({uk}, {$set: {dir_tree_status: 'failed'}});
        logger.error(error.message);
    } finally {
        // 关闭数据库连接
        await sqliteDB.close();
    }
    logger.info('文件树构建完成');
}

module.exports = {
    task
};