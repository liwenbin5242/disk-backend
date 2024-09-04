'use strict';
const mongodber = require('../utils/mongodber');
const diskDB = mongodber.use('disk');
const utils = require('../lib/utils');
const moment = require('moment');
const { ObjectID } = require('mongodb');
const redis = require('../utils/rediser');
const _ = require('lodash');
const { v4: uuidv4 } = require('uuid');

moment.locale('zh-cn');

/**
 * 用户充值/扣除学币
 * @param {string} agent_username 管理者
 * @param {string} username 用户名
 * @param {number} coins 学币
 */
async function postMemberRecharge(agent_username, username, coins) {
    const returnData = {};
    const member = await diskDB.collection('subscribers').findOne({ username, agent_username });
    if (!member) {
        throw new Error('用户不存在');
    }
    if(coins+ member.coins < 0) {
        throw new Error('充值/扣除用户学币数量非法');
    }
    await diskDB.collection('subscribers').updateOne({ username, agent_username }, {$inc: {coins}});
    return returnData;
}


/**
 * 等级变更
 * @param {string} agent_username 所属
 * @param {string} username 用户名
 * @param {number} level 用户等级
 * @param {number} days 期限会员天数
 */
async function postMemberLevel(agent_username, username, level, days) {
    const returnData = {};
    const member = await diskDB.collection('subscribers').findOne({ username, agent_username });
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
    await diskDB.collection('subscribers').updateOne({ username, agent_username }, {$set});
    return returnData;
}

/**
 * 获取我的会员列表
 * @param {string} username agent name
 * @param {number} offset
 * @param {number} limit
 */
async function getMemberList(username, subscriber, offset = 0, limit = 20) {
    const returnData = {
        members: [],
        total: 0
    };
    const query = { agent_username: username }
    if(subscriber) {
        query.username = {$regex: subscriber}
    }
    const members = await diskDB.collection('subscribers').find( query, {projection: {
        username: 1,
        phone:1,
        name:1,
        avatar:1,
        expires:1,
        coins: 1,
        level:1,
        ctm:1,
    }, sort:{ ctm: -1}}).skip(parseInt(offset)).limit(parseInt(limit)).toArray();
    returnData.members = members
    returnData.total = await diskDB.collection('subscribers').countDocuments( query);
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


/**
 * 生成CDkey
 * @param {数量} num 
 * @param {天} day 
 */
async function postCDkey(keyType, num, day, coins,agent_username) {
    let returnData = {};
    const array = []
    for (let i=0; i<num; i++) {
        const code = uuidv4().slice(-10);
        array.push({
            username:'',
            agent_username,
            keyType,
            actived: false,
            activedtm: '',
            key: code,
            expiration: day? day: 0,
            coins: coins? coins:0,
            ctm: new Date
        })
    }
    await diskDB.collection('member_cdkeys').insert(array)
    return returnData
}

/**
 * 删除CDkey
 * @param {id} id 
 */
async function deleteCDkey(id) {
    let returnData = {};
    await diskDB.collection('member_cdkeys').deleteOne({_id: ObjectID(id)})
    return returnData
}

/**
 * CDkey列表
 * @param {是否已激活}  actived
 * @param {}  limit
 * @param {}  offset
 */
async function getCDkeyList(actived,keyType, agent_username, limit = 20, offset = 0,) {
    let returnData = {};
    const query = {agent_username}
    if(typeof actived !== "undefined") {
        query.actived = actived == 'true'? true: false
    }
    if(keyType) {
        query.keyType = parseInt(keyType)
    }
    returnData.list = await diskDB.collection('member_cdkeys').find(query).skip(parseInt(offset)).limit(parseInt(limit)).toArray()
    returnData.total = await diskDB.collection('member_cdkeys').countDocuments(query)
    return returnData
}



module.exports = {
    postMemberRecharge,
    postMemberLevel,
    getMemberList,
    memberVerify,
    getM3u8,
    getCDkeyList,
    deleteCDkey,
 
    postCDkey
};
