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


module.exports = {
    postMemberRecharge,
};
