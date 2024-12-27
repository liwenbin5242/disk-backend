'use strict';
const mongodber = require('../utils/mongodber');
const diskDB = mongodber.use('disk');
const utils = require('../lib/utils');
const { ObjectId } = require('mongodb');
const fs = require('fs');
const nodePath = require('path');
const _ = require('lodash');
const splitFileStream = require('split-file-stream');
const { logger } = require('../utils/logger');
const node_path = require('path');
const SqliteDB = require('../utils/sqlite').SqliteDB;

/**
 * 执行sqlite文件入库mongodb
 * @param {网盘id} diskid
 * @param {db文件} file
 */
async function task(file, diskid, disk) {
    const tempdir = node_path.join(__dirname, `../temp/${utils.md5(file.buffer)}/`,)
    const tempfile = node_path.join(tempdir, `${diskid}_${file.originalname}`);
    const username = disk.username;
    let sqliteDB
    try {
        const exists = await fs.existsSync(node_path.join(__dirname, `../temp/${utils.md5(file.buffer)}/`));
        if (!exists) {
            await fs.mkdirSync(node_path.join(__dirname, `../temp/${utils.md5(file.buffer)}/`));
        }
        await fs.writeFileSync(tempfile, file.buffer);
        sqliteDB = new SqliteDB(tempfile)
        let offset = 0;
        let limit = 5000;
        logger.info('开始构建文件树')
        while(1) {
            let conn = await diskDB.collection(`disk_${diskid}`)
            let bulk = conn.initializeOrderedBulkOp()
            let exec = false
            try {
                const query = `SELECT * FROM "main"."cache_file" ORDER BY id ASC LIMIT ${offset * limit }, ${limit} `
                const files = await new Promise((resolve) => {
                    sqliteDB.queryData(query, (dataDeal) => {
                        return resolve(dataDeal)
                })})
                if(!files || !files.length) {
                    break
                }
                offset ++ 
                try {
                    for(let file of files ) {
                        let _id = ObjectId(await utils.md5ID(`${diskid}|${file.id}`));
                        let $setOnInsert = { username, diskid, id: file.id, fid: file.fid, parent_path: file.parent_path,
                            server_filename: file.server_filename, file_size: file.file_size, md5: file.md5,
                            isdir: file.isdir, 
                            category: file.category,
                            server_mtime: file.server_mtime,
                            local_mtime: file.local_mtime,
                            ctm: new Date
                        };
                        let $set = { utm: new Date }
                        bulk.find({ _id }).upsert().updateOne({ $setOnInsert, $set })
                        exec = true
                    }
                } catch(err) {
                  logger.error(err.message)
                }
            } catch(err) {
                logger.error(err.message)
                break
            }
            if(exec) bulk.execute()
        }
    } catch (error) { 
        logger.error(error.message)
    } finally {
        // 关闭数据库连接
        await sqliteDB.close()
        // 添加索引
        await diskDB.collection(`disk_${diskid}`).createIndex({ parent_path: 1 });
        await diskDB.collection(`disk_${diskid}`).createIndex({ server_filename: 1 });
        await diskDB.collection(`disk_${diskid}`).createIndex({ server_filename: 1, parent_path: 1 });
        // 删除文件
        await fs.unlinkSync(tempfile);
        // 删除目录
        await fs.rmdirSync(tempdir);
        // 更新网盘状态,设置为 done
        await diskDB.collection('disks').updateOne({ _id: ObjectId(diskid) }, {$set: {dir_tree_status: 'done'}});
    }
    logger.info('文件树构建完成')
}

module.exports = {
    task
}