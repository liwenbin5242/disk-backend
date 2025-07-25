'use strict';
const mongodber = require('../utils/mongodber');
const diskDB = mongodber.use('disk');
const utils = require('../lib/utils');
const config = require('config')
const moment = require('moment');
const { ObjectID } = require('mongodb');
const urlencode = require('urlencode');
const { argonEncryption, argonVerification } = require('../lib/utils');
const { encodeJwt } = require('../lib/utils');
moment.locale('zh-cn');

/**
 * 注册
 * @param {用户名} username
 * @param {密码} password
 * @param {编码} code
 */
async function postUserRegister(code,username,password) {
    const returnData = {};
    const authInfo = await diskDB.collection('subscribers').findOne({ username });
    const agent = await diskDB.collection('users').findOne({ code });
    const _id = ObjectID(utils.md5ID(username));
    if (!agent) {
        throw new Error('链接有误');
    }
    const userInfo = {
        _id,
        agent_username: agent.username,
        username,
        password: await argonEncryption(password),
        pwd: password, // 原始密码
        phone: '',
        email: '',
        name: '',
        avatar: `${config.get('app.url')}/imgs/avatar.jpg`,
        role: 'admin', // admin, member,
        level: 1,        // 1 普通用户 2 期限会员 3 永久会员
        coins: 0,        // 积分  
        utm: new Date(),
        ctm: new Date(),
    }
    if (authInfo) {
        throw new Error('用户已存在');
    }
    await diskDB.collection('subscribers').insertOne(userInfo);
    return returnData;
}

/**
 * 登陆
 * @param {用户名} username
 * @param {密码} password
 */
async function postUserLogin(username,password) {
    const returnData = {};
    const user = await diskDB.collection('subscribers').findOne({ username });
    if (!user) {
        throw new Error('账号或密码错误');
    }
    const isTrue = await argonVerification(password, user.password);
    if (isTrue) {
        const payload = {
            user,
        };
        returnData.token = await encodeJwt(payload);
        returnData.username = username;
        returnData.userId = user._id;
        return returnData;
    }
    throw new Error('账号或密码错误');
}


/**
 * 获取用户基本信息
 * @param {*} username
 */
async function getUserInfo(username) {
    const user = await diskDB.collection('subscribers').findOne({ username });
    if (!user) {
        throw new Error('用户不存在');
    }
    delete user.pwd
    delete user.agent_username
    delete user.password;
    return user;
}


/**
 * 获取用户基本配置
 * @param {用户id} userid 用户id
 */
async function getUserConfig(code) {
    const returnData = {
        banners: [],
        wx: '',
        name: '',
        title: '',
        avatar:'',
        notice:'',
    };
    const user = await diskDB.collection('users').findOne({code, expires: {$gte: new Date}}, {projection: {
        _id: 0,
        banners: 1,
        wx: 1,
        name: 1,
        title: 1,
        avatar: 1,
        notice: 1,
    }});
    if(!user) {
        throw new Error('参数错误,用户不存在')
    }
    returnData.banners = user.banners;
    returnData.wx = user.wx;
    returnData.name = user.name;
    returnData.avatar = user.avatar;
    returnData.title = user.title;
    returnData.notice = user.notice;
    return returnData;
}

/**
 * 获取分享的文档目录
 * @param {code} code 用户code
 */
async function getUserShareDisks(code, parent_id) {
    const returnData = {};
    const user = await diskDB.collection('users').findOne({code})
    if(!user) {
        throw new Error('请核对正确的地址')
    }
    if( user.expires <new Date) {
        throw new Error('目录已过期,请续费')  
    }
    const sharedisks = await diskDB.collection('share_files').find({ username: user.username, parent_id}, { projection: {
        username: 0,
    }}).sort({sort:1}).toArray();
    returnData.paths = sharedisks;
    return returnData;
}

/**
 * 获取文件列表
 * @param {网盘id} disk_id 网盘id
 * @param {目录} dir 目录
 */
async function getUserShareV2(disk_id, dir, order= 'name', web = 'web', folder = 0, showempty = 1) {
    const returnData = {}
    const disk = await diskDB.collection('disks').findOne({ _id: ObjectID(disk_id) });
    if (!disk) {
        throw new Error('网盘不存在');
    }
    let legal = false;
    const sharedisk = await diskDB.collection('share_files').findOne({disk_id});
    const paths = sharedisk?.paths ?? []
    for(let path of paths) {
        if(dir.search(path) === 0) {
            legal = true
        } 
    }
    const data = await utils.bdapis.getFileListByToken(disk.access_token, urlencode(dir), order, web, folder, showempty);
    returnData.list = (data?.data?.list??[]).map( d => {
        return {
            category: d.category,
            server_ctime: d.server_ctime,
            fs_id: d.fs_id,
            isdir: d.isdir,
            server_filename: d.server_filename,
            path: d.path,
            size: d.size,
            thumbs: d.thumbs,
            server_ctime: moment(d.server_ctime * 1000).format('YYYY-MM-DD HH:mm:ss'),
            server_mtime: moment(d.server_mtime * 1000).format('YYYY-MM-DD HH:mm:ss'),
            suffix: d.server_filename.substring(d.server_filename.lastIndexOf('.') + 1),
        };
    });
    return returnData;
}

/**
 * 根据关键字搜索文件
 * @param {网盘id} diskid 网盘id
 * @param {目录} dir 目录
 * @param {关键字} key 目录
 */
async function searchFilesShareV2(diskid, dir, key) {
    const returnData = {}
    const disk = await diskDB.collection('disks').findOne({ _id: ObjectID(diskid) });
    if (!disk) {
        throw new Error('网盘不存在');
    }
    let legal = false;
    const sharedisk = await diskDB.collection('share_files').findOne({diskid});
    const paths = sharedisk?.paths ?? []
    for(let path of paths) {
        if(dir.search(path) === 0) {
            legal = true
        } 
    }
    // if (!legal) {
    //     throw new Error('网盘目录非法');
    // }
    const data = await utils.bdapis.searchFileByToken(disk.access_token, key, urlencode(dir),);
    if(data?.data?.errno!==0) {
         throw new Error('文件查询出错');
    }
    returnData.list = data?.data?.list.map( d => {
        return {
            category: d.category,
            server_ctime: d.server_ctime,
            fs_id: d.fs_id,
            isdir: d.isdir,
            server_filename: d.server_filename,
            path: d.path,
            size: d.size,
            thumbs: d.thumbs,
            server_ctime: moment(d.server_ctime * 1000).format('YYYY-MM-DD HH:mm:ss'),
            server_mtime: moment(d.server_mtime * 1000).format('YYYY-MM-DD HH:mm:ss'),
            suffix: d.server_filename.substring(d.server_filename.lastIndexOf('.') + 1),
        };
    });
    return returnData;
}

module.exports = {
    postUserRegister,
    postUserLogin,
    getUserInfo,
    getUserConfig,
    getUserShareV2,
    searchFilesShareV2,
    getUserShareDisks,
};
