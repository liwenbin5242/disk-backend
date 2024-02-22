'use strict';
const mongodber = require('../utils/mongodber');
const diskDB = mongodber.use('disk');
const utils = require('../lib/utils');
const moment = require('moment');
const { ObjectID } = require('mongodb');
const urlencode = require('urlencode');
moment.locale('zh-cn');

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
 * 获取用户分享的网盘列表以及目录
 * @param {code} code 用户code
 */
async function getUserShareDisks(code) {
    const returnData = {};
    const user = await diskDB.collection('users').findOne({code,})
    if(!user) {
        throw new Error('请核对正确的地址')
    }
    if( user.expires <new Date) {
        throw new Error('目录已过期,请续费')  
    }
    const sharedisks = await diskDB.collection('share_files').find({ username: user.username}, {projection: {
        _id: 0,
        username: 0
    }}).toArray();
    returnData.disks = sharedisks;
    return returnData;
}

/**
 * 获取文件列表
 * @param {网盘id} diskid 网盘id
 * @param {目录} dir 目录
 */
async function getUserShareV2(diskid, dir, order= 'name', web = 'web', folder = 0, showempty = 1) {
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
    getUserConfig,
    getUserShareV2,
    searchFilesShareV2,
    getUserShareDisks,
};
