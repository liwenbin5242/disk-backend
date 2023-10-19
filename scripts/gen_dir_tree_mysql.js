'use strict';
const utils = require('../lib/utils');
const { ObjectId } = require('mongodb');
const { logger } = require('../utils/logger');
const node_path = require('path');
const SqliteDB = require('../utils/sqlite').SqliteDB;
const config = require('config');
const fs = require('fs');
const mongodber = require('../utils/mongodber');
const diskDB = mongodber.use('disk');
const pool = require('../utils/mysql')
/**
 * 执行sqlite文件入库mysql
 * @param {网盘id} diskid
 * @param {db文件路径} tempfile
 */
async function task(tempfile, diskid) { 
    let sqliteDB;
    try {
        sqliteDB = new SqliteDB(tempfile);
        let offset = 0;
        let limit = 5000; // 每次取5000条数据
        logger.info('开始构建文件树');
        // 构建前先删除表
        await pool.query(`DROP TABLE IF EXISTS disk_${diskid}`)
        // 创建表
        await pool.query(`CREATE TABLE IF not EXISTS disk_${diskid} (
            id bigint,
            fid bigint, 
            parent_path varchar(250) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
            server_filename varchar(250) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL, 
            file_size bigint,
            md5 varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
            isdir tinyint(3),
            category tinyint(3),
            server_mtime bigint,
            local_mtime bigint,
            PRIMARY KEY (id) USING BTREE,
            INDEX idx_parent_path (parent_path),
            INDEX idx_server_filename (server_filename)
        ) `);
        // 修改引擎为MyISAM 支持全文检索
        await pool.query(`ALTER TABLE disk_${diskid}
            ENGINE=MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = 'db文件表' ROW_FORMAT = Dynamic;
        `)
        let cond = true;
        while ( cond ) {
            try {
                const query = `SELECT * FROM "main"."cache_file" ORDER BY id ASC LIMIT ${offset * limit }, ${limit} `;
                const files = await new Promise((resolve) => {
                    sqliteDB.queryData(query, (dataDeal) => {
                        return resolve(dataDeal);
                    });});
                if (!files || !files.length) {
                    break;
                }
                logger.info(`已读取sqllite数据库数据:${offset * limit + files.length}条`);
                offset ++; 
                let insertQ =  `INSERT INTO disk_${diskid} (id, fid, parent_path, server_filename, file_size, md5, isdir, category, server_mtime, local_mtime) VALUES ?`;
                let columns = [];
                for (let file of files ) {
                    try {
                        columns.push([file.id, file.fid, `${file.parent_path}`, `${file.server_filename}`, file.file_size,`${file.md5}`,file.isdir,file.category,file.server_mtime, file.local_mtime])
                        // columns.push(`(${file.id}, ${file.fid}, '${file.parent_path}', '${file.server_filename}', ${file.file_size},'${file.md5}',${file.isdir},${file.category},${file.server_mtime}, ${file.local_mtime})`) 
                    }  catch (err) {
                        logger.error(err.message);
                    }
                }
                // insertQ+=columns.join(',')
                await pool.query(insertQ, [columns]);
                logger.info(`已插入mysql数据库数据:${ files.length}条`)
            } catch (err) {
                logger.error(err.message);
                break;
            }
        }
        // 更新网盘状态,设置为 done
        await diskDB.collection('disks').updateOne({ _id: ObjectId(diskid) }, {$set: {dir_tree_status: 'done'}});
    } catch (error) { 
        // 更新网盘状态,设置为 failed
        await diskDB.collection('disks').updateOne({ _id: ObjectId(diskid) }, {$set: {dir_tree_status: 'failed'}});
        logger.error(error.message);
    } finally {
        // 关闭数据库连接
        await sqliteDB.close();
        await new Promise((resolve)=> {
            setTimeout(()=>{
                return resolve();
            }, 3000);
        });
        // 删除文件
        await fs.unlinkSync(tempfile);
        // 删除目录
        // await fs.rmdirSync(tempdir);
    }
    logger.info('文件树构建完成');
}

module.exports = {
    task
};