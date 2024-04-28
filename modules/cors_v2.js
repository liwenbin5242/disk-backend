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
        level: 1,        // 1 普通用户 2 期限会员 
        expires: new Date(),        // 到期时间
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
async function postUserLogin(code, username,password) {
    const returnData = {};
    const agent =await diskDB.collection('users').findOne({ code });
    if (!agent) {
        throw new Error('url地址有误');
    }
    const user = await diskDB.collection('subscribers').findOne({agent_username: agent.username, username });
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
        returnData.level = user.level;
        returnData.coins = user.coins;
        returnData.expires = user.expires;
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
async function getUserShareDisks(code) {
    const returnData = {};
    const user = await diskDB.collection('users').findOne({code})
    if(!user) {
        throw new Error('请核对正确的地址')
    }
    if( user.expires <new Date) {
        throw new Error('目录已过期,请续费')  
    }
    const share_disks = await diskDB.collection('share_files').find({ username: user.username}, { projection: {
        username: 0,
    }}).sort({sort:1}).toArray();
    const disk_ids = share_disks.filter(share_disk=> {return share_disk.disk_id}).map(share_disk => { return ObjectID(share_disk.disk_id) })
    const disks = await diskDB.collection('disks').find({_id: {$in:disk_ids}}).toArray()
    share_disks.forEach(share_disk=> {
        const disk =disks.find(disk => {return disk._id.toString() === share_disk.disk_id})
        if(disk) share_disk.baidu_name= disk.baidu_name
    })

    returnData.paths = utils.array2Tree(share_disks, '_id', 'parent_id', 'children')
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

/**
 * 获取文件许可
 * @param {网盘id} disk_id 网盘id
 * @param {文件路径} path 文件路径
 * @param {} token 
 */
async function getFilesPermission(disk_id, path, token) {
    const returnData = {
        permission: false
    };
    const { user } = await utils.decodeJwt(token)
    const file = await diskDB.collection('subscriber_files').findOne({username: user.username, disk_id, path });
    if( file ) {
        returnData.permission = true
        returnData.username = user.username

    } else {
        const subscriber = await diskDB.collection('subscribers').findOne({username: user.username, $or:[{level:2, expires:{$gte: new Date}}, {level:1,coins:{$gt:0}}] });
        if(subscriber) {
            returnData.username = user.username
            returnData.permission = true
        }
    }
    return returnData
}

/**
 * 激活cdkey
 * @param {用户名}  username
 * @param {CDkey}  key
 */
async function activateCDkey(username, key) {
    const user = await diskDB.collection('subscribers').findOne({username})
    const cdkey = await diskDB.collection('member_cdkeys').findOne({key, actived: false})
    if(!user) {
        throw new Error('用户不存在');
    }
    if(!cdkey) {
        throw new Error('CDKEY不存在');
    }
    if(cdkey.keyType==1) {
        await diskDB.collection('subscribers').updateOne({username, agent_username: user.agent_username}, {$set:{level:1,}, $inc: {coins: cdkey.coins}})
        await diskDB.collection('member_cdkeys').updateOne({key, agent_username: user.agent_username}, {$set: {username, actived: true, activedtm: new Date}})
    }
    if(cdkey.keyType==2) {
        await diskDB.collection('subscribers').updateOne({username, agent_username: user.agent_username}, {$set:{level:2, expires: new Date(user.expires.getTime() + cdkey.expiration * 24* 60 *60 *1000)}})
        await diskDB.collection('member_cdkeys').updateOne({key, agent_username: user.agent_username}, {$set: {username, actived: true, activedtm: new Date}})
    }
   
    return {}
}
module.exports = {
    postUserRegister,
    postUserLogin,
    getUserInfo,
    getUserConfig,
    getUserShareV2,
    searchFilesShareV2,
    getUserShareDisks,
    getFilesPermission,
    activateCDkey,
};
