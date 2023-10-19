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
 * 用户注册账号
 * @param {账号} username 用户名
 * @param {密码} password 密码
 * @param {密码} belongs 从前台注册需要从url获取归属,所属用户的username
 */
async function postUserRegister(username, password, belongs, mail, code) {
    const returnData = {};
    let member
    const cd = await redis.get(mail)
    if(!cd || JSON.parse(cd) != code) {
        // throw new Error('注册失败，验证码有误');
    }
    if(belongs) { 
        member = await diskDB.collection('users').findOne({ username: belongs });
        if(!member) {
            throw new Error('注册失败，此应用对应的用户不存在');
        }
    }
    const authInfo = await diskDB.collection('users').findOne({ username });
    const _id = ObjectID(utils.md5ID(username));
    const userInfo = {
        _id,
        username,
        password: await argonEncryption(password),
        phone: '',
        name: '',
        avatar: `${config.get('app.url')}/imgs/avatar.jpg`,
        inviter: member?.username?? '', // 邀请人用户名
        role: belongs ? 'member': 'admin', // admin, member,
        level: 1,        // 1 普通用户 2 期限会员 3 永久会员
        coins: 0,        // 积分  
        banners:[],      // 轮播图
        vx: '',          // vx二维码地址
        utm: new Date(),
        ctm: new Date(),
        belongs,
        expires: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000) // 3天后过期
    }
    if (authInfo) {
        throw new Error('账号已存在');
    }
    await diskDB.collection('users').insertOne(userInfo);
    return returnData;
}

/**
 * 用户登录获取token
 * @param {账号} username 可选
 * @param {密码} password 可选
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
 * 用户分享网盘及网盘下文件夹
 * @param {*} username
 */
async function postShare(username, diskid, paths, used, remark, userid) {
    const returnData = {};
    const user = await diskDB.collection('users').findOne({ username, expires: {$gte: new Date}});
    if (!user) {
        throw new Error('授权已过期,请联系管理员');
    }
    const disk = await diskDB.collection('disks').findOne({ _id: ObjectID(diskid), username });
    if(!disk) {
        throw new Error('网盘不存在');
    }
    const _id = `${username}-${diskid}`;
    await diskDB.collection('share_disks').updateOne({ _id }, {
        $set: {
            paths,
            used,
            remark,
            utm: new Date(),
        },
        $setOnInsert: {
            userid,
            username,
            diskid,
            ctm: new Date(),
        }
    }, { upsert: true });
    return returnData;
}

/**
 * 用户删除分享网盘
 * @param {*} username
 */
async function deleteShare(id) {
    const returnData = {};
    const _id = id;
    await diskDB.collection('share_disks').deleteOne({ _id });
    return returnData;
}

/**
 * 获取用户已分享网盘以及网盘下文件列表
 * @param {*} username
 */
async function getShare(username) {
    const returnData = {};
    const shareDisks = await diskDB.collection('share_disks').find({ username}, {sort:{ ctm: -1}}).toArray();
    shareDisks.forEach(disk => {
        disk.paths = disk.paths.map(path => {return path.path})
    })
    returnData.list = shareDisks
    return returnData;
}

/**
 * 更新用户已分享网盘以及网盘下文件列表
 * @param {*} username
 */
async function putShare(remark, id) {
    const returnData = {};
    await diskDB.collection('share_disks').updateOne({ _id: id}, {$set:{ remark}});
    return returnData;
}

/**
 * 用户保存appid及密钥
 * @param {*} username
 */
async function postMiniappSecret(username, appid, secret) {
    const returnData = {};
    // 获取接口调用凭证
    const exists = await await diskDB.collection('wechat_access').findOne({ appid, secret});
    const $set = {
        appid, secret,
    }
    if(!exists) {
        const result = await utils.wechatapis.getAccessToken(appid, secret);
        if(!result.access_token) throw new Error('请检查appid和secret')
        $set.access_token = result.access_token
        $set.expires_in = result.expires_in
        $set.utm = new Date
    } 
    await diskDB.collection('wechat_access_users').updateOne({ username }, {$set: {appid, utm: new Date}, $setOnInsert: {ctm: new Date,}}, {upsert: true})
    await diskDB.collection('wechat_access').updateOne({ appid }, {$set, $setOnInsert: {ctm: new Date,}}, {upsert: true});
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
    getShare,
    postMiniappSecret
};
