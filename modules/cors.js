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
const pool = require('../utils/mysql')
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');
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
 * @param {string} disk_id 网盘id
 */
async function getUserShareFiles(disk_id, parent_path,) {
    const returnData = {
        list: [],
    };
    if(!disk_id) {
        throw new Error('请先添加网盘');
    }
    const disk = await diskDB.collection('disks').findOne({ _id: ObjectID(disk_id) });
    if (!disk) {
        throw new Error('网盘不存在');
    }
    try {
        let legal = false;
        // const sharedisk = await diskDB.collection('share_files').findOne({disk_id});
        // const paths = sharedisk?.paths ?? []
        // for(let path of paths) {
        //     if(parent_path.search(path) === 0) {
        //         legal = true
        //     } 
        // }
        // if (!legal) {
        //     throw new Error('网盘目录非法');
        // }
        const query = `SELECT * FROM disk_${disk_id} WHERE parent_path = ?  ORDER BY server_filename ASC`
        const data = await pool.query(query, [parent_path])
        returnData.list = (data[0]??[]).map(item => { return {
            id: parseInt(item.id),
            disk_id,
            category: parseInt(item.category),
            is_folder: item.isdir == '1'? true: false,
            server_filename: item.server_filename,
            name: item.server_filename,
            parent_path: item.parent_path,
            path: item.parent_path+  item.server_filename,
            size: parseInt(item.file_size),
            updateDate: parseInt(item.local_mtime),
            uploadDate: parseInt(item.server_mtime)
        }})
    } catch(error) {
        logger.error(error.message)
        if(error.code === 'ER_NO_SUCH_TABLE') {
            throw new Error('请先上传同步db文件再试')
        } else {
            throw new Error('获取目录出错')
        }
    }
  
    return returnData;
}

/**
 * 搜索文件
 * @param {string} code 必选
 * @param {string} disk_id 网盘id (可选)
 * @param {string} path 搜索目录，(可选) 默认根目录
 * @param {string} key 搜索关键字
 */
async function searchUserShareFiles(disk_id, path = '', key, code, ) {
    const returnData = {
        list: [],
    };
    if(!code) throw Error('参数错误')
    if(!key) return returnData
    const user =  await diskDB.collection('users').findOne({ code });
    if(!user) throw Error('参数错误')
    const query = { username: user.username }
    if(disk_id) query._id = ObjectID(disk_id)
    const disks = await diskDB.collection('disks').find(query).toArray();
    const disk_ids = disks.map(disk => {return disk._id.toString()})
    
    // const query = `SELECT * FROM disk_${disk_id} WHERE server_filename REGEXP ? ORDER BY server_filename ASC`
    // const count = `SELECT COUNT(*) FROM disk_${disk_id} WHERE server_filename REGEXP ? `
    const tasks = []
    for(disk_id of disk_ids) {
        const query = `SELECT * FROM disk_${disk_id} WHERE server_filename REGEXP ? ORDER BY server_filename ASC`
        tasks.push( pool.query(query, [key]))
    }
    // const [data, num] = await Promise.all([pool.query(query, [key]), pool.query(count,[key])]) 
    const results = await Promise.all(tasks) 
    let list = []
    for(let i=0; i<results.length; i++) {
        const l = results[i][0]
        l.forEach(e => {
            e.disk_id = disk_ids[i]
        })
        list = list.concat(l)
    }
    returnData.list = list.map(item => { return {
        id: parseInt(item.id),
        disk_id: item.disk_id,
        category: parseInt(item.category),
        isdir: item.isdir == '1'? true: false,
        server_filename: item.server_filename,
        name: item.server_filename,
        path: item.parent_path + item.server_filename,
        parent_path: item.parent_path,
        size: parseInt(item.file_size),
        updateDate: parseInt(item.local_mtime),
        uploadDate: parseInt(item.server_mtime)
    }})
    // returnData.total = num[0][0]['COUNT(*)']
    return returnData;
}


/**
 * get share file url
 * @param {string} diskid 网盘id
 * @param {string} path 文件目录的路径
 * @param {string} filename 文件名
 */
async function getShareFileUrl(diskid, path = '', filename,) {
    const returnData = {};
    try {
        const url = await redis.get(`${diskid}:${path}:${filename}`)
        if(url) {
            returnData.url = JSON.parse(url).url
            returnData.code = JSON.parse(url).code
        } else {
            const disk = await diskDB.collection('disks').findOne({_id: ObjectID(diskid)}) 
            if( !disk || !disk.cookies ) {
                throw new Error('cookie不存在')
            }
            // 先获取文件的fsid
            const data = await utils.bdapis.getFileListByToken(disk.access_token, path, 'time', 1, 0, 1)
            const list = data?.data?.list??[]
            const file = list.find(l => {return l.server_filename === filename})
            if (!file) {
                throw new Error('云端文件不存在')
            }
            const code = uuidv4().slice(-4); // ⇨ '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
            const expireday = 7
            const res = await utils.bdapis.fileShare(disk.cookies, expireday, code,[], 4, [file.fs_id])
            await redis.set(`${diskid}:${path}:${filename}`, {code, url: res.data.shorturl}, expireday * 24 * 60 * 60)
            returnData.code = code
            returnData.url = res.data.shorturl
        }
    } catch(err) {
        logger.error(err.message)
    }
    return returnData;
}

module.exports = {
    postUserShare,
    getUserShareFiles,
    searchUserShareFiles,
    getShareFileUrl
};
