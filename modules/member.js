'use strict';
const mongodber = require('../utils/mongodber');
const diskDB = mongodber.use('disk');
const utils = require('../lib/utils');
const moment = require('moment');
const { ObjectID } = require('mongodb');
const redis = require('../utils/rediser');
const _ = require('lodash');

moment.locale('zh-cn');

/**
 * 用户充值/扣除学币
 * @param {string} inviter 管理者
 * @param {string} username 用户名
 * @param {number} coins 学币
 */
async function postMemberRecharge(inviter, username, coins) {
    const returnData = {};
    const member = await diskDB.collection('users').findOne({ username, inviter });
    if (!member) {
        throw new Error('用户不存在');
    }
    if(coins+ member.coins < 0) {
        throw new Error('充值/扣除用户学币数量非法');
    }
    await diskDB.collection('users').updateOne({ username, inviter }, {$inc: {coins}});
    return returnData;
}


/**
 * 等级变更
 * @param {string} inviter 所属
 * @param {string} username 用户名
 * @param {number} level 用户等级
 * @param {number} days 期限会员天数
 */
async function postMemberLevel(inviter, username, level, days) {
    const returnData = {};
    const member = await diskDB.collection('users').findOne({ username, inviter });
    level = parseInt(level)
    const $set = {level}
    if (!member) {
        throw new Error('用户不存在');
    }
    if(level === 2 && days) {
        if(member.expires >= new Date) { // 如果会员未过期则继续累加
            $set.expires = new Date((member.expires).getTime() + days * 24 * 60 * 60 * 1000)
        } else {
            $set.expires = new Date(new Date().getTime() + days * 24 * 60 * 60 * 1000)
        }
    }
    await diskDB.collection('users').updateOne({ username, inviter }, {$set});
    return returnData;
}

/**
 * 获取我的会员列表
 * @param {string} username agent name
 * @param {number} offset
 * @param {number} limit
 */
async function getMemberList(username, offset = 0, limit = 20) {
    const returnData = {
        members: [],
        total: 0
    };
    const members = await diskDB.collection('users').find({ inviter: username }, {projection: {
        username: 1,
        phone:1,
        name:1,
        avatar:1,
        expires:1,
        coins: 1,
        level:1,
        ctm:1,
    }, sort:{ ctm: 1}}).skip(parseInt(offset)).limit(parseInt(limit)).toArray();
    returnData.members = members
    returnData.total = await diskDB.collection('users').countDocuments({ inviter: username });
    return returnData;
}

/**
 * 下载/播放验证
 * @param {string} username 代理商客户用户名
 * @param {string} diskid 代理商网盘id
 * @param {string} belongs 代理商id
 * @param {string} act download play
 */
async function memberVerify(username, belongs, diskid, act) {
    const returnData = {
        t: null
    };
    // 查询代理商用户是否可以观看/下载
    const member = await diskDB.collection('users').findOne({ username, belongs });
    const user = await diskDB.collection('users').findOne({ _id: ObjectID(belongs) });
    const disk = await diskDB.collection('disks').findOne({ _id: ObjectID(diskid), username: user.username });
    if(!member) {
        throw new Error('非该代理下的用户或用户不存在')
    }
    if( member?.level > 2 ) {
        returnData.t = true
    }  else if( member?.level === 2 && member.expires>= new Date ) {
        returnData.t = true
    } else if ( member.coins> 0 && ((member.coins - user.coin_cost || 1) >= 0)) {
        returnData.t = true
        await diskDB.collection('users').updateOne({ username, belongs }, {$inc: {coins: -user.coin_cost || -1}});
    }
    return returnData;
}

/**
 * 获取文件m3u8地址
 * @param {string} username 代理商客户用户名
 * @param {string} diskid 代理商网盘id
 * @param {string} belongs 代理商id
 * @param {string} filetype 文件类型
 * @param {string} path 文件路径
 */
async function getM3u8(username, belongs, diskid, filetype, path) {
    const user = await diskDB.collection('users').findOne({ _id: ObjectID(belongs) });
    const disk = await diskDB.collection('disks').findOne({ _id: ObjectID(diskid), username: user.username });
    return (await utils.bdapis.getFileSteam(disk.access_token, path, filetype))
}

module.exports = {
    postMemberRecharge,
    postMemberLevel,
    getMemberList,
    memberVerify,
    getM3u8
};
