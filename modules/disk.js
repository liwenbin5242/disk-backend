'use strict';
const mongodber = require('../utils/mongodber');
const diskDB = mongodber.use('disk');
const moment = require('moment');
const busboy = require('busboy');
const node_path = require('path');
const utils = require('../lib/utils');
const { ObjectId } = require('mongodb');
const fs = require('fs');
const nodePath = require('path');
const _ = require('lodash');
const splitFileStream = require('split-file-stream');
const { logger } = require('../utils/logger');
const { task: genTreeMysql} = require('../scripts/gen_dir_tree_mysql') 
moment.locale('zh-cn');

/**
 * 获取网盘容量信息
 * @param {账号} username
 */
async function getDiskinfo(username) {
    let returnData = { list: [] };
    const disks = await diskDB.collection('disks').find({ username }).toArray();
    if (!disks.length) {
        return returnData;
    }
    const result = await utils.promiseTasks(disks, 'getQuotaByToken');
    returnData.list = result;
    return returnData;
}

/**
 * 获取网盘文件列表
 * @param {账号} username
 */
async function getDiskFileslist(id, dir, order = 'time', web, folder, showempty) {
    let returnData = {};
    const disk = await diskDB.collection('disks').findOne({ _id: ObjectId(id)});
    if (!disk) {
        throw new Error('网盘不存在');
    }
    const data = await utils.bdapis.getFileListByToken(disk.access_token, dir, order, web, folder, showempty);
    returnData.list = data.data.list.map(d => {
        return {
            category: d.category,
            agoTime: d.server_ctime,
            id: d.fs_id,
            isFavorite: false,
            isFolder: Boolean(d.isdir),
            name: d.server_filename,
            path: d.path,
            size: d.size,
            thumbs: d.thumbs,
            updateDate: moment(d.server_ctime * 1000).format('YYYY-MM-DD HH:mm:ss'),
            uploadDate: moment(d.server_mtime * 1000).format('YYYY-MM-DD HH:mm:ss'),
            suffix: d.server_filename.substring(d.server_filename.lastIndexOf('.') + 1),
        };
    });
    return returnData;
}

/**
 * 搜索文件
 * @param {网盘id} id
 * @param {搜索关键词} key
 * @param {目录} dir
 */
async function getDiskSearch(id, key, dir) {
    let returnData = {};
    if (!id) {
        throw new Error('请先添加网盘');
    }
    const disk = await diskDB.collection('disks').findOne({ _id: ObjectId(id) });
    if (!disk) {
        throw new Error('网盘不存在');
    }
    const data = await utils.bdapis.searchFileByToken(disk.access_token, key, dir);
    returnData.list = data.data.list.map(d => {
        return {
            category: d.category,
            agoTime: d.server_ctime,
            id: d.fs_id,
            isFavorite: false,
            isFolder: Boolean(d.isdir),
            name: d.server_filename,
            path: d.path,
            size: d.size,
            thumbs: d.thumbs,
            updateDate: moment(d.server_ctime * 1000).format('YYYY-MM-DD HH:mm:ss'),
            uploadDate: moment(d.server_mtime * 1000).format('YYYY-MM-DD HH:mm:ss'),
            suffix: d.server_filename.substring(d.server_filename.lastIndexOf('.') + 1),
        };
    });
    returnData.more = data.data.has_more;
    return returnData;
}

/**
 * 文件信息
 * @param {网盘id} id
 * @param {文件的fsids} fsids
 */
async function getFiles(id, fsids) {
    let returnData = {};
    const disk = await diskDB.collection('disks').findOne({ _id: ObjectId(id) });
    if (!disk) {
        throw new Error('网盘不存在');
    }
    const data = await utils.bdapis.getFilemetasByToken(disk.access_token, fsids);
    returnData = data.data;
    return returnData;
}

/**
 * 文件管理（修改，删除，重命名，移动）
 * @param {账号} username
 * @param {id} id
 */
async function fileManage(username, id, opera, filelist) {
    let returnData = {};
    const disk = await diskDB.collection('disks').findOne({ _id: ObjectId(id) });
    if (!disk) {
        throw new Error('网盘不存在');
    }
    const data = await utils.bdapis.fileManager(disk.access_token, opera, filelist);
    returnData = data.data;
    return returnData;
}

/**
 * 网盘绑定cookie
 * @param {账号} username
 * @param {id} id
 * @param {cookie} cookie
 */
async function addCookie(username, id, cookie) {
    let returnData = {};
    await diskDB.collection('disks').updateOne({ _id: ObjectId(id), username }, { $set: { cookie } });
    return returnData;
}

/**
 * 网盘绑定bdstoken
 * @param {账号} username
 * @param {id} id
 * @param {cookie} bdstoken
 */
async function addBdstoken(username, id, bdstoken) {
    let returnData = {};
    await diskDB.collection('disks').updateOne({ _id: ObjectId(id), username }, { $set: { bdstoken } });
    return returnData;
}

/**
 * 获取群组
 * @param {账号} username
 * @param {id} id
 */
async function getGroups(username, id, start, limit) {
    let returnData = {};
    const disk = await diskDB.collection('disks').findOne({ _id: ObjectId(id) });
    if (!disk || !disk.cookie) {
        throw new Error('网盘或cookie不存在');
    }
    const data = await utils.bdapis.getGroups(disk.cookie, start, limit);
    returnData = data.data;
    return returnData;
}

/**
 * 获取群组共享列表
 * @param {账号} username
 * @param {id} id
 */
async function getGrouplistshare(username, id, gid, limit) {
    let returnData = {};
    const disk = await diskDB.collection('disks').findOne({ _id: ObjectId(id) });
    if (!disk || !disk.cookie) {
        throw new Error('网盘或cookie不存在');
    }
    const data = await utils.bdapis.getGrouplistshare(disk.cookie, gid, limit);
    returnData = data.data;
    return returnData;
}

/**
 * 获取群组共享文件
 * @param {账号} username
 * @param {id} id
 */
async function getGroupshareinfo(username, id, msg_id, page, num, from_uk, gid, fs_id) {
    let returnData = {};
    const disk = await diskDB.collection('disks').findOne({ _id: ObjectId(id) });
    if (!disk || !disk.cookie) {
        throw new Error('网盘或cookie不存在');
    }
    const data = await utils.bdapis.getGroupshareinfo(disk.cookie, msg_id, page, num, from_uk, gid, fs_id);
    const transfers = await diskDB.collection('transfers').find({username, spath: {$in: data.data.records.map(record => {return record.path;})}}).toArray();
    const watermark_tasks = await diskDB.collection('watermark_tasks').find({username, spath: {$in: data.data.records.map(record => {return record.path;})}}).toArray();
    data.data.records.forEach(record => {
        record.transfer = '';
        if (watermark_tasks.find(transfer => {return record.path === transfer.spath;})) {
            record.transfer = watermark_tasks.find(transfer => {return record.path === transfer.spath;}).status;
        }
        if (transfers.find(transfer => {return record.path === transfer.spath;})) {
            record.transfer = transfers.find(transfer => {return record.path === transfer.spath;}).status;
        }
    });
    returnData = data.data;
    return returnData;
}

/**
 * 转存群组共享文件
 * @param {账号} username
 * @param {id} id
 */
async function fileTransfer(username, id, msg_id, path, from_uk, gid, fs_id, spath, isdir, filename) {
    let returnData = {};
    const disk = await diskDB.collection('disks').findOne({ _id: ObjectId(id) });
    const user = await diskDB.collection('disks').findOne({ username });
    if (!disk || !disk.cookie || !disk.bdstoken || !user) {
        throw new Error('网盘或cookie bdstoken不存在');
    }
    const data = await utils.bdapis.fileTransfer(disk.cookie, msg_id, path, from_uk, gid, fs_id, disk.bdstoken);
    /** 添加任务 */
    await diskDB.collection('watermark_tasks').findOneAndUpdate({from_uk, fs_id}, {$set: {username, disk_id: id, spath, path, from_uk, fs_id, isdir, filename, status: 'ready'}}, {upsert: true});
    returnData = data.data;
    return returnData;
}

/**
 * 上传文件到指定位置
 * @param {账号} username
 * @param {id} id
 * @param {路径} path
 * @param {水印内容} watermark
 * @param {文件} file
 */
async function postFileIpload(username, id, path, file) {
    let returnData = {};
    const disk = await diskDB.collection('disks').findOne({ _id: ObjectId(id) });
    if (!disk) {
        throw new Error('网盘不存在');
    }
    // 生成临时文件
    // 临时文件目录名称
    let tempdirName = await utils.md5(file.buffer);
    // 临时文件目录路径
    let tempdir = `${nodePath.join(__dirname, `../temp/${tempdirName}/`)}`;
    // 生成临时目录
    if (!fs.existsSync(tempdir)) {
        fs.mkdirSync(tempdir);
    }
    // 临时文件路径
    let tempfile = `${nodePath.join(tempdir, `${file.originalname}`)}`;
    /**
     * 1. 判断是否需要添加水印，生成临时文件
     */
    await fs.writeFileSync(tempfile, file.buffer);
    /**
     * 2. 计算文件大小，md5值如果大于4mb则切片处理
     */
    let maxFileSize = 4194304;
    if (file.size > maxFileSize) { // 大于4m 切片处理 小于等于4m不处理
        await new Promise((resolve, reject)=> {
            splitFileStream.split(fs.createReadStream(tempfile), maxFileSize, tempdir, (error, filePaths) => {
                /* If an error occured, filePaths will still contain all files that were written */
                if (error) return reject (error); // Alternatively you could just log the error instead of throwing: if (error) console.error(error)
                return resolve(filePaths);
            });
        });
        fs.unlinkSync(tempfile);
    } 
    /**
     * 3. 文件预上传
     */
    let size = file.size;
    let block_list = [];
    const files = _.sortBy(fs.readdirSync(tempdir), fname => {
        return -parseInt(fname.substring(6, fname.length));
    });
    for (let f of files) {
        block_list.push(await utils.md5(await fs.readFileSync(`${nodePath.join(tempdir, f)}`)));
    }
    // 预上传
    let data = await filePrecreate(username, id, path, size, 0, block_list);
    if (!data || data.errno) { // 预上传创建失败 直接返回
        throw new Error(data);
    }
    /**
     * 4. 分片上传文件
     */
    for (let i = 0; i < files.length; i++) {
        const result = await fileSuperfile2(username, id, path, data.uploadid, i, '', `${nodePath.join(tempdir, files[i])}`);
        logger.info(result);
    }
    /**
     * 5. 创建文件
     */
    data =  await fileCreate(username, id, path, size, 0, block_list, data.uploadid);
    returnData = data;
    return returnData;
}

/**
 * 预上传文件
 * @param {账号} username
 * @param {id} id
 * @param {路径} path
 * @param {文件大小(字节)} size
 * @param {是否是目录} isdir
 * @param {切片列表} block_list
 */
async function filePrecreate(username, id, path, size, isdir, block_list) {
    let returnData = {};
    const disk = await diskDB.collection('disks').findOne({ _id: ObjectId(id) });
    if (!disk) {
        throw new Error('网盘不存在');
    }
    const data = await utils.bdapis.filePrecreate(disk.access_token, path, isdir, size, block_list);
    returnData = data.data;
    return returnData;
}

/**
 * 分片上传文件
 * @param {账号} username
 * @param {id} id
 * @param {路径} path
 * @param {上传id} uploadid
 * @param {序列编码} partseq
 * @param {文件} file
 */
async function fileSuperfile2(username, id, path, uploadid, partseq, file, tempfile) {
    let returnData = {};
    const disk = await diskDB.collection('disks').findOne({ _id: ObjectId(id) });
    if (!disk) {
        throw new Error('网盘不存在');
    }
    const data = await utils.bdapis.fileSuperfile2(disk.access_token, path, uploadid, partseq, file, tempfile);
    returnData = data;
    return returnData;
}

/**
 * 创建文件
 * @param {账号} username
 * @param {id} id
 * @param {路径} path
 * @param {文件大小(字节)} size
 * @param {是否是目录} isdir
 * @param {切片列表} block_list
 * @param {上传id} uploadid
 */
async function fileCreate(username, id, path, size, isdir, block_list, uploadid) {
    let returnData = {};
    const disk = await diskDB.collection('disks').findOne({ _id: ObjectId(id) });
    if (!disk) {
        throw new Error('网盘不存在');
    }
    const data = await utils.bdapis.fileCreate(disk.access_token, path, size, isdir, block_list, uploadid);
    returnData = data.data;
    return returnData;
}

/**
 * 上传db文件到对应网盘生成目录树(文件可能较大,采用异步处理任务的方式)
 * @param {网盘id} diskid
 * @param {db文件} file
 */
async function postDbfile(diskid, req) {
    let returnData = {};
    const disk = await diskDB.collection('disks').findOne({ _id: ObjectId(diskid) });
    if (!disk) {
        throw new Error('网盘不存在');
    }
    // 更新网盘状态,设置为pending
    await diskDB.collection('disks').updateOne({ _id: ObjectId(diskid) }, {$set: {dir_tree_status: 'pending'}});
    const tempdir = node_path.join(__dirname, `../temp/${diskid}/`);
    let tempfile = ''
    const result = await new Promise(async (resolve, reject) => { // 异步执行
        const exists = await fs.existsSync(tempdir);
        if (!exists) {
            await fs.mkdirSync(tempdir);
        }
        const fileStream = req.pipe(req.busboy)
        fileStream.on('file', (name, file, info) => {
            tempfile = node_path.join(tempdir, `${info.filename}`);
            const writeStream = fs.createWriteStream(`${tempfile}`);
            file.pipe(writeStream);
          });
        fileStream.on('close', () => {
            logger.info('db文件上传成功');
            return resolve(true);
        });
        fileStream.on('field', (name, value, info) => {
            logger.info('files', name, value, info);
          });
        fileStream.on('error', (error) => {
            logger.error('db文件上传失败', error);
            return resolve(false);
        });
    })
    // 开始异步执行文件入pgsql库
    if(result) {
        // genTreepg(tempfile, diskid)
        genTreeMysql(tempfile, diskid)
    }
    return returnData;
}
module.exports = {
    addBdstoken,
    addCookie,
    fileCreate,
    fileSuperfile2,
    fileManage,
    filePrecreate,
    fileTransfer,
    getGroups,
    getGrouplistshare,
    getGroupshareinfo,
    getDiskinfo,
    getDiskFileslist,
    getDiskSearch,
    getFiles,
    postFileIpload,
    postDbfile,
};
