'use strict';
const utils = require('../lib/utils');
const { ObjectId } = require('mongodb');
const { logger } = require('../utils/logger');
const node_path = require('path');
const SqliteDB = require('../utils/sqlite').SqliteDB;
const config = require('config');
const fs = require('fs');
const PG = require('../utils/pg');
const pg = new PG(config.get('PG'));
const mongodber = require('../utils/mongodber');
const diskDB = mongodber.use('disk');

/**
 * 执行sqlite文件入库mongodb
 * @param {网盘id} diskid
 * @param {db文件} file
 */
async function task(file, diskid) {
    const tempdir = node_path.join(__dirname, `../temp/${utils.md5(file.buffer)}/`);
    const tempfile = node_path.join(tempdir, `${diskid}_${file.originalname}`);
    let sqliteDB;
    try {
        const exists = await fs.existsSync(node_path.join(__dirname, `../temp/${utils.md5(file.buffer)}/`));
        if (!exists) {
            await fs.mkdirSync(node_path.join(__dirname, `../temp/${utils.md5(file.buffer)}/`));
        }
        await fs.writeFileSync(tempfile, file.buffer);
        sqliteDB = new SqliteDB(tempfile);
        let offset = 0;
        let limit = 5000; // 每次取5000条数据
        logger.info('开始构建文件树');
        // 构建前先删除表
        await pg.query(`DROP TABLE IF EXISTS disk_${diskid}`)
        // 创建表
        await pg.query(`CREATE TABLE IF not EXISTS disk_${diskid} (id bigint,fid bigint, parent_path text,server_filename text, path text,file_size bigint,md5 text,isdir bigint,category bigint,server_mtime bigint,local_mtime bigint,PRIMARY KEY(id))`);
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
                let insertQ =  `INSERT INTO disk_${diskid} (id, fid, parent_path, server_filename, path, file_size, md5, isdir, category, server_mtime, local_mtime) VALUES`;
                let list = [];
                let n = 1;
                let m = 2;
                let z = 3;
                
                let l = 1;
                for (let file of files ) {
                    try {
                        insertQ += (`(${file.id}, ${file.fid}, $${n}::text, $${m}::text,  $${z}::text, ${file.file_size},'${file.md5}',${file.isdir},${file.category},${file.server_mtime}, ${file.local_mtime})`) + ( files.length === l ? '' : ',');
                    }  catch (err) {
                        logger.error(err.message);
                    }
                    n += 3;
                    m += 3;
                    z += 3;
                    l++;
                    list.push(file.parent_path,);
                    list.push(file.server_filename,);
                    list.push(file.parent_path + file.server_filename,);
                }
                insertQ += 'ON CONFLICT (id) DO UPDATE SET fid=EXCLUDED.fid,path=EXCLUDED.path, parent_path=EXCLUDED.parent_path, server_filename=EXCLUDED.server_filename, file_size=EXCLUDED.file_size, md5=EXCLUDED.md5, isdir=EXCLUDED.isdir, category=EXCLUDED.category, server_mtime=EXCLUDED.server_mtime, local_mtime=EXCLUDED.local_mtime';
                await pg.query(insertQ, list);
                logger.info(`已插入pg数据库数据:${offset * limit + files.length}条`)
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
        await fs.rmdirSync(tempdir);
    }
    logger.info('文件树构建完成');
}

module.exports = {
    task
};