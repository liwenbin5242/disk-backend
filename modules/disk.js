'use strict';
const mongodber = require('../utils/mongodber');
const diskDB = mongodber.use('disk');
const moment = require('moment');
const node_path = require('path');
const utils = require('../lib/utils');
const { ObjectId } = require('mongodb');
const fs = require('fs');
const nodePath = require('path');
const _ = require('lodash');
const splitFileStream = require('split-file-stream');
const { logger } = require('../utils/logger');
const { task: genTreeMysql} = require('../scripts/gen_dir_tree_mysql'); 
const { task: genTreeSqlite} = require('../scripts/gen_dir_tree_sqlite');
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
 * @param {网盘id} disk_id
 * @param {文件的fsids} fsids
 */
async function getFiles(disk_id, fs_ids) {
    let returnData = {};
    const disk = await diskDB.collection('disks').findOne({ _id: ObjectId(disk_id) });
    if (!disk) {
        throw new Error('网盘不存在');
    }
    const data = await utils.bdapis.getFilemetasByToken(disk.access_token, fs_ids);
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
 * @param {id} disk_id
 * @param {cookie} cookie
 */
async function addCookie(username, disk_id, cookie) {
    let returnData = {};
    const res = await utils.bdapis.getBDstoken(cookie)
    if(res.data.errno!== 0) {
        throw new Error('cookie验证有误,请核对后再试')
    }
    const disk = await diskDB.collection('disks').findOne({username, _id: ObjectId(disk_id)}) 
    if(res.data.login_info.uk!== disk.uk) {
        throw new Error('cookie对应网盘用户不匹配,请核对后再试')
    }
    await diskDB.collection('disks').updateOne({ _id: ObjectId(disk_id), username }, { $set: { cookie, bdstoken:res.data.login_info.bdstoken }});
    return returnData;
}


/**
 * 刷新群组
 * @param {账号} username
 * @param {id} id
 */
async function flushGroups(username, disk_id) {
    let returnData = {};
    const disk = await diskDB.collection('disks').findOne({username, _id: ObjectId(disk_id) });
    if (!disk || !disk.cookie) {
        throw new Error('网盘或cookie不存在');
    }
    let insertData = []
    let start = 0
    let limit = 1000
    while(1) {
        const data = await utils.bdapis.getGroups(disk.cookie, start, limit);
        start+=limit
        if(data.data.errno === 0 && data.data.records) {
            insertData = insertData.concat(data.data.records)
            if(insertData.length >= data.data.count) {
                break
            }
        } else {
            break
        }
    }
    insertData.forEach(d => {
        d._id= ObjectId(utils.md5ID(d.gid+ disk_id + username))
        d.disk_id = disk_id
        d.username = username
        d.ctm = new Date()
    })
    await diskDB.collection('disk_group').deleteMany({disk_id, username})
    await diskDB.collection('disk_group').insertMany(insertData)
    return returnData;
}

/**
 * 获取群组
 * @param {账号} username
 * @param {id} id
 */
async function getGroups(username, disk_id, limit =100, offset=0) {
    let returnData = {};
    const data = await diskDB.collection('disk_group').find({username, disk_id}).sort({ctime:-1}).skip(offset).limit(limit).toArray()
    const total =  await diskDB.collection('disk_group').countDocuments({username, disk_id})
    returnData = {list:data, total};
    return returnData;
}

/**
 * 获取群拉人任务
 * @param {账号} username
 * @param {id} id
 */
async function getGroupTasks(username, disk_id, taskname, limit =100, offset=0) {
    let returnData = {};
    const query = {username, disk_id}
    if(taskname) {
        query.taskname = {$regex: taskname}
    }
    const data = await diskDB.collection('disk_group_task').find(query).sort({ctm:-1}).skip(offset).limit(limit).toArray()
    const total =  await diskDB.collection('disk_group_task').countDocuments(query)
    returnData = {list:data, total};
    return returnData;
}


/**
 * 创建群拉人任务
 * @param {账号} username
 * @param {id} id
 */
async function postGroupTasks(username, task_name, group_name, disk_id, managers ) {
    const returnData = {}
    const task = {
        username, task_name, group_name, disk_id, managers, ctm: new Date()
    }
    const result = await diskDB.collection('disk_group_task').insertOne(task)
    const task_id = result.insertedId
    startGrouptask(task_id, disk_id, username)
    return returnData;
}
/**
 * 获取好友列表
 * @param {账号} username
 * @param {id} id
 */
async function getFollowers(username, priority_name, disk_id, limit =100, offset=0) {
    let returnData = {};
    await flushFollowers(username, disk_id)
    const query = {username, disk_id}
    if(priority_name) {
        query.priority_name = {$regex: priority_name}
    }
    const data = await diskDB.collection('disk_follower').find(query).sort({ctime:-1}).skip(offset).limit(limit).toArray()
    const total =  await diskDB.collection('disk_follower').countDocuments(query)
    returnData = {list:data, total};
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
 * 分片上传db文件
 * @param {网盘id} disk_id
 * @param {当前片段的索引} chunk
 * @param {共有多少分片} chunks
 * @param {文件名} filename
 * @param {文件md5} md5
 */
async function postDbfile(req, disk_id, chunks, chunk, md5, filename, timestamp) {
    let returnData = {};
    const disk = await diskDB.collection('disks').findOne({ _id: ObjectId(disk_id) });
    if (!disk) {
        throw new Error('网盘不存在');
    }
    // 更新网盘状态,设置为pending
    await diskDB.collection('disks').updateMany({ uk: disk.uk }, {$set: {dir_tree_status: 'pending'}});
    const tempdir = node_path.join(__dirname, `../temp/${disk.uk}/`);
    await fs.mkdirSync(tempdir, {recursive: true})
    let tempfile = ''
    await new Promise(async (resolve, reject) => { // 异步执行
        const fileStream = req.pipe(req.busboy)
        fileStream.on('file', (name, file, info) => {
            tempfile = node_path.join(tempdir, `${chunk}`);
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
    const files = await fs.readdirSync(tempdir)
    if(files.length == chunks) {
        // 定义要合并的分片文件路径数组
        const filePaths = files.sort((a,b)=> {return parseInt(a)- parseInt(b)}).map(file => {return `${tempdir}${file}`});
        // 合并文件
        const dbdir = node_path.join(__dirname, `../db/${disk.uk}/`);
        await fs.mkdirSync(dbdir, {recursive: true})
        const result = await utils.mergeFile(filePaths,`${dbdir}${filename}`)
        if(result.done && md5=== utils.md5(fs.readFileSync(`${dbdir}${filename}`))) { //
            logger.info('文件md5摘要校验成功')
            await genTreeSqlite(`${dbdir}${filename}`, disk.uk)
        }
    }
    return returnData;
}

async function flushFollowers (username, disk_id) {
    const lastest_followers = await diskDB.collection('disk_follower').find({username, disk_id}).sort({sequence:-1}).limit(1).toArray()
    const disk = await diskDB.collection('disks').findOne({ _id: ObjectId(disk_id) });
    if (!disk || !disk.cookie) {
        throw new Error('网盘或cookie不存在');
    }
    let start = 0
    let limit = 100
    if(lastest_followers.length) {
        start = lastest_followers[0].sequence
    }
    while(1) {
        const data = await utils.bdapis.getFollowList(disk.cookie, start, limit)
        if(data.data.errno === 0 && data.data.records.length) {
           let sequence = 1
           for(let record of data.data.records) {
            await diskDB.collection('disk_follower').updateOne({ _id: ObjectId(utils.md5ID( record.uk+ disk_id + username))}, {$set: {
                disk_id,
                username,
                sequence: start +  sequence,
                ...record
            }} , {upsert: true})
            sequence ++
           }
           start += sequence
         } else {
            break
        }
    }
}

async function startGrouptask( task_id, username, disk_id) {
    
}
module.exports = {
    addCookie,
    fileCreate,
    fileSuperfile2,
    fileManage,
    filePrecreate,
    fileTransfer,
    flushGroups,
    getGroups,
    getGroupTasks,
    postGroupTasks,
    getFollowers,
    getGrouplistshare,
    getGroupshareinfo,
    getDiskinfo,
    getDiskFileslist,
    getDiskSearch,
    getFiles,
    postFileIpload,
    postDbfile,
};
