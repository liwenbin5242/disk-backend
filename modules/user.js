'use strict';
const { argonEncryption, argonVerification } = require('../lib/utils');
const { encodeJwt } = require('../lib/utils');
const mongodber = require('../utils/mongodber');
const diskDB = mongodber.use('disk');
const utils = require('../lib/utils');
const moment = require('moment');
const { ObjectID } = require('mongodb');
const redis = require('../utils/rediser');
const _ = require('lodash');
const mailer = require('../utils/mailer')
const config = require('config')
const { v4: uuidv4 } = require('uuid');

moment.locale('zh-cn');

/**
 * 用户发送邮箱验证码
 * @param {账号} mail 用户名
 */
async function getUserRegcode(mail) {
    const returnData = {};
    const code = utils.randomCode()
    await mailer.sendMail(code)
    await redis.set(mail, code, 60* 5)
    return returnData;
}

/**
 * 用户注册账号 后台
 * @param {账号} username 用户名(建议使用手机号)
 * @param {密码} password 密码
 */
async function postUserRegister(username, password, email, code) {
    const returnData = {};
    const cd = await redis.get(email)
    if(!cd || JSON.parse(cd) != code) {
        // throw new Error('注册失败，验证码有误');
    }
    const authInfo = await diskDB.collection('users').findOne({ username });
    const _id = ObjectID(utils.md5ID(username));
    const userInfo = {
        _id,
        code: uuidv4().slice(-6), // 取随机生成的6位uuid编码
        username,
        password: await argonEncryption(password),
        pwd: password, // 原始密码
        phone: '',
        email: '',
        name: '',
        avatar: `${config.get('app.url')}/imgs/avatar.jpg`,
        role: 'admin', // admin, member,
        level: 3,        // 1 普通用户 2 期限会员 3 永久会员
        coins: 0,        // 积分  
        banners:[],      // 轮播图
        vx: '',          // vx二维码地址
        utm: new Date(),
        ctm: new Date(),
        expires: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000) // 新账号默认3天后过期
    }
    if (authInfo) {
        throw new Error('用户已存在');
    }
    await diskDB.collection('users').insertOne(userInfo);
    return returnData;
}

/**
 * 用户登录获取token
 * @param {账号} username 
 * @param {密码} password
 */
async function postUserLogin(username, password) {
    const returnData = {};
    const user = await diskDB.collection('users').findOne({ username });
    if (!user) {
        throw new Error('账号或密码错误');
    }
    const isTrue = await argonVerification(password, user.password);
    if (user.expires <= new Date() && isTrue) {
        throw new Error('账号已过期,请联系管理员续期');
    }
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
 * 用户通过code换取access_token和refresh_token
 * @param {百度code} code
 * @param {*} username
 * @returns
 */
async function bindDisk(username, code) {
    const returnData = {};
    const { data } = await utils.bdapis.code2token(code);
    const bduserinfo = await utils.bdapis.getbdUserByToken(data.access_token);
    redis.set(bduserinfo.data.uk, data.access_token, data.expires_in);
    const _id = ObjectID(await utils.md5ID(`${username}|${bduserinfo.data.uk}`));
    await diskDB.collection('disks').findOneAndUpdate(
        { _id },
        {
            $set: {
                username,
                avatar_url: bduserinfo?.data?.avatar_url,
                baidu_name: bduserinfo?.data?.baidu_name,
                netdisk_name: bduserinfo?.data?.netdisk_name,
                uk: bduserinfo?.data?.uk,
                vip_type: bduserinfo?.data?.vip_type,
                expires_in: data.expires_in,
                access_token: data.access_token,
                refresh_token: data.refresh_token,
                scope: data.scope,
                cookies: '',
                ctm: new Date(),
                utm: new Date(),
                uptime: new Date(),
            },
        },
        { upsert: true }
    );
    return returnData;
}

/**
 * 获取用户基本信息
 * @param {*} username
 */
async function getUserInfo(username) {
    const user = await diskDB.collection('users').findOne({ username });
    if (!user) {
        throw new Error('用户不存在');
    }
    delete user.password;
    return user;
}

/**
 * 更新用户基本信息
 * @param {*} username
 */
async function updateUserInfo(username, avatar, name, phone, banners, wx) {
    await diskDB.collection('users').updateOne({ username }, { $set: { avatar, name, phone, banners, wx, utm: new Date } });
    return {};
}

/**
 * 获取用户关联的百度网盘账号
 * @param {*} username
 */
async function getUserDisks(username) {
    const user = await diskDB.collection('users').findOne({ username });
    if (!user) {
        throw new Error('用户不存在');
    }
    const disks = await diskDB.collection('disks').find({ username: user.username }).sort({ctm: -1}).toArray();
    let disksInfo = await utils.promiseTasks(disks, 'getbdUserByToken');
    const diskQuota = await utils.promiseTasks(disks, 'getQuotaByToken');
    disksInfo = _.zipWith(disksInfo, diskQuota, disks, (a, b, c) => {
        return {
            info: a,
            quota: b,
            disabled: {disabled: a?.data?.errno === 0 ? false: true},
            id: { id: c._id.toString() },
            cookie: { cookie: c.cookie },
            bdstoken: { bdstoken: c.bdstoken },
            dir_tree_status: { dir_tree_status: c.dir_tree_status ||  '' },
        };
    });
    return {
        total: disks.length,
        list: disksInfo.map(d => {
            return Object.assign(d.info.data || {}, d.quota.data || {}, d.id, d.cookie, d.bdstoken, d.dir_tree_status, d.disabled || {disabled: true});
        }),
    };
}

/**
 * 获取群组下用户关联的百度网盘账号
 * @param {*} group
 * @param {*} username
 */
 async function getGroupDisks(username) {
    const user = await diskDB.collection('users').findOne({ username});
    if (!user) {
        throw new Error('用户不存在');
    }
    const disks = await diskDB.collection('disks').find({ username }).toArray();
    let disksInfo = await utils.promiseTasks(disks, 'getbdUserByToken');
    const diskQuota = await utils.promiseTasks(disks, 'getQuotaByToken');
    disksInfo = _.zipWith(disksInfo, diskQuota, disks, (a, b, c) => {
        return {
            info: a,
            quota: b,
            id: { id: c._id.toString() },
            cookie: { cookie: c.cookie },
            bdstoken: { bdstoken: c.bdstoken },
        };
    });
    return {
        total: disks.length,
        list: disksInfo.map(d => {
            return Object.assign(d.info.data || {}, d.quota.data || {}, d.id, d.cookie, d.bdstoken);
        }),
    };
}
/**
 * 解绑用户关联的百度网盘账号
 * @param {*} username
 */
async function deleteDisk(username, id) {
    const user = await diskDB.collection('users').findOne({ username });
    if (!user) {
        throw new Error('用户不存在');
    }
    await diskDB.collection('disks').remove({ _id: ObjectID(id), username });
    return {};
}

/**
 * 用户新增目录
 * @param {String} username
 * @param {String} disk_id 网盘id
 * @param {String} title 目录名称
 * @param {String} sort 排序
 * @param {String} type 文件类型 1网盘文件 2好友文件 3群组文件 
 * @param {String} path 网盘目录路径
 * @param {String} name 文件名称
 * @param {String} category 文件类型
 * @param {String} parent_id 父级id
 */
async function postShare(username, disk_id = '', title, sort, type=1, path ='', parent_id ='', name='', category=6, is_folder) {
    const returnData = {};
    const user = await diskDB.collection('users').findOne({ username, expires: {$gte: new Date}});
    if (!user) {
        throw new Error('授权已过期,请联系管理员');
    }
    if(disk_id) {
        const disk = await diskDB.collection('disks').findOne({ _id: ObjectID(disk_id), username });
        if(!disk) {
            throw new Error('网盘不存在');
        }
    } 
    await diskDB.collection('share_files').insertOne({username, disk_id, title, sort: parseInt(sort), type, path, parent_id, name, category, is_folder});
    return returnData;
}

/**
 * 更新用户已分享网盘以及网盘下文件列表
 * @param {*} username
 */
async function putShare(_id, disk_id = '', title, sort, type=1, path ='', parent_id ='', name='', category=6) {
    const returnData = {};
    await diskDB.collection('share_files').updateOne({ _id: ObjectID(_id)}, {$set:{disk_id , title, sort: parseInt(sort), type, path, parent_id , name, category }});
    return returnData;
}

/**
 * 用户删除分享网盘
 * @param {*} username
 */
async function deleteShare(_id) {
    const returnData = {};
    await deleteRecursive(_id)
    return returnData;
}

async function deleteRecursive( parent_id) {
    // 查找所有子文档
    const children = await diskDB.collection('share_files').find({ parent_id: parent_id }).toArray();
  
    // 递归删除每个子文档
    for (const child of children) {
      await deleteRecursive(child._id);
    }
    // 删除当前文档
    await diskDB.collection('share_files').deleteOne({ _id: ObjectID(parent_id),});
}

/**
 * 获取用户文档目录
 * @param {*} username
 */
async function getShare(username) {
    const returnData = {};
    const pipeline = [{
        $match: { username }
    },{
        $sort: {sort:1}
    }]
    const share_disks = await diskDB.collection('share_files').aggregate(pipeline).toArray();
    const disk_ids = share_disks.filter(share_disk=> {return share_disk.disk_id}).map(share_disk => { return ObjectID(share_disk.disk_id) })
    const disks = await diskDB.collection('disks').find({_id: {$in:disk_ids}}).toArray()
    share_disks.forEach(share_disk=> {
        const disk =disks.find(disk => {return disk._id.toString() === share_disk.disk_id})
        if(disk) share_disk.baidu_name= disk.baidu_name
    })

    returnData.list = utils.array2Tree(share_disks, '_id', 'parent_id', 'children')
    return returnData;
}

module.exports = {
    getUserRegcode,
    postUserRegister,
    postUserLogin,
    bindDisk,
    getUserInfo,
    updateUserInfo,
    getUserDisks,
    getGroupDisks,
    deleteDisk,
    postShare,
    deleteShare,
    putShare,
    getShare
};
