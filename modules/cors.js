'use strict';
const mongodber = require('../utils/mongodber');
const diskDB = mongodber.use('disk');
const utils = require('../lib/utils');
const moment = require('moment');
const { ObjectID } = require('mongodb');
const redis = require('../utils/rediser');
const _ = require('lodash');
const config = require('config');
moment.locale('zh-cn');

const PG = require('../utils/pg');
const pg =  new PG(config.get('PG'));

/**
 * 采集端触发器更新缓存文件
 * @param {string} username 用户名
 * @param {string} files 文件列表
 * @param {string} diskid 网盘id
 */
async function postUserShare(username, files, diskid) {
    const returnData = {};
    const disk = await diskDB.collection('disks').findOne({ _id: ObjectID(diskid), username });
    if (!disk) {
        throw new Error('网盘不存在');
    }
    for(let file of files ) {
        if(file.act === 'delete') {
            // 执行删除
            const query = `DELETE FROM "public"."disk_${diskid}" WHERE id = ${file.id}`
            await pg.query(query)
        } else {
            // 插入更新
            let query = `INSERT INTO disk_${diskid} (id, fid, parent_path, server_filename, path, file_size, md5, isdir, category, server_mtime, local_mtime) VALUES`
            query += `(${file.id}, ${file.fid}, $1::text, $2::text, $3::text, ${file.file_size},'${file.md5}',${file.isdir},${file.category},${file.server_mtime}, ${file.local_mtime})`
            query += `ON CONFLICT (path) DO UPDATE SET id=EXCLUDED.id, fid=EXCLUDED.fid, parent_path=EXCLUDED.parent_path, server_filename=EXCLUDED.server_filename, file_size=EXCLUDED.file_size, md5=EXCLUDED.md5, isdir=EXCLUDED.isdir, category=EXCLUDED.category, server_mtime=EXCLUDED.server_mtime, local_mtime=EXCLUDED.local_mtime`
            await pg.query(query, [file.parent_path, file.server_filename, file.parent_path + file.server_filename,]) 
        }
    }
    return returnData;
}

/**
 * 获取缓存文件目录树文件列表
 * @param {string} diskid 网盘id
 */
async function getUserShareFiles(diskid, dir,) {
    const returnData = {
        list: [],
    };
    const disk = await diskDB.collection('disks').findOne({ _id: ObjectID(diskid) });
    if (!disk) {
        throw new Error('网盘不存在');
    }
    let legal = false;
    const sharedisk = await diskDB.collection('share_disks').findOne({diskid});
    const paths = sharedisk?.paths ?? []
    for(let path of paths) {
        if(dir.search(path) === 0) {
            legal = true
        } 
    }
    // if (!legal) {
    //     throw new Error('网盘目录非法');
    // }
    const query = `SELECT * FROM "public"."disk_${diskid}" WHERE parent_path = $1::text  ORDER BY server_filename ASC`
    returnData.list = (await pg.query(query, [dir])).rows
    return returnData;
}

/**
 * 搜索文件
 * @param {string} diskid 网盘id
 * @param {string} dir 搜索目录，默认根目录
 * @param {string} key 搜索关键字
 */
async function searchUserShareFiles(diskid, dir = '/', key, offset = 0, limit = 20) {
    const returnData = {
        list: [],
        total: 0
    };
    // const query = `SELECT * FROM "public"."disk_${diskid}" WHERE parent_path LIKE $1::text AND `  + ` (path LIKE $2::text) ORDER BY server_filename ASC LIMIT ${limit} OFFSET ${offset}`
    // const count = `SELECT COUNT(*) FROM "public"."disk_${diskid}" WHERE parent_path LIKE $1::text AND `  + ` (path LIKE $2::text)`
    // const [data, num] = await Promise.all([pg.query(query, [dir+'%', '%'+key+'%']), pg.query(count, [dir+'%', '%'+key+'%'])]) 

    const query = `SELECT * FROM "public"."disk_${diskid}" WHERE (path LIKE $1::text) ORDER BY path ASC LIMIT ${limit} OFFSET ${offset}`
    const count = `SELECT COUNT(path) FROM "public"."disk_${diskid}" WHERE (path LIKE $1::text)`
    const [data, num] = await Promise.all([pg.query(query, ['%'+key+'%']), pg.query(count, ['%'+key+'%'])]) 

    returnData.list = data.rows
    returnData.total = num.rows[0].count
    return returnData;
}

module.exports = {
    postUserShare,
    getUserShareFiles,
    searchUserShareFiles,
};
