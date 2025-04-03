'use strict';
const mongodber = require('../utils/mongodber');
const diskDB = mongodber.use('disk');
const utils = require('../lib/utils');
const moment = require('moment');
const { ObjectID } = require('mongodb');
const _ = require('lodash');
const config = require('config');
moment.locale('zh-cn');
const fs = require('fs');
/**
 * 生成小程序码
 * @param {数量} num 
 * @param {天} day 
 */
async function getwxacodeunlimit(username) {
    let returnData = {};
    const appid = config.get('WeChatMP').appid;
    const secret = config.get('WeChatMP').secret;
    const user = await diskDB.collection('users').findOne({username})
    if(!user) {
        throw new Error('用户不存在');
    } else {
        // 从mongodb查询微信凭证
        const query = {
            // 获取凭证时间大于当前时间减1.5小时
            utm: {$gt: moment().subtract(1.8, 'hours').toDate()},
            appid
        }
        let wx = await diskDB.collection('access_token').findOne(query)
        if(!wx) {
            // 获取凭证
            wx = await utils.wechatapis.getAccessToken(appid, secret)
            // 插入数据库
            await diskDB.collection('access_token').updateOne({
                appid,
            }, {
                $set:{ utm: new Date(),
                ...res}
            }, { upsert: true })
        }
        const result = await utils.wechatapis.getwxacodeunlimit(wx.access_token, user.code) 
        fs.writeFileSync(`./static/imgs/${user.code}.jpg`, result)
        return returnData
    }
}

/**
 * 生成小程序码
 * @param {数量} num 
 * @param {天} day 
 */
async function code2session(code,) {
    let returnData = {};
    const appid = config.get('WeChatMP').appid;
    const secret = config.get('WeChatMP').secret;
    const user = await diskDB.collection('users').findOne({username})
    if(!user) {
        throw new Error('用户不存在');
    } else {
        // 从mongodb查询微信凭证
        const query = {
            // 获取凭证时间大于当前时间减1.5小时
            utm: {$gt: moment().subtract(1.8, 'hours').toDate()},
            appid
        }
        let wx = await diskDB.collection('access_token').findOne(query)
        if(!wx) {
            // 获取凭证
            wx = await utils.wechatapis.getAccessToken(appid, secret)
            // 插入数据库
            await diskDB.collection('access_token').updateOne({
                appid,
            }, {
                $set:{ utm: new Date(),
                ...res}
            }, { upsert: true })
        }
        const result = await utils.wechatapis.getwxacodeunlimit(wx.access_token, user.code) 
        fs.writeFileSync(`./static/imgs/${user.code}.jpg`, result)
        return returnData
    }
}

module.exports = {
    getwxacodeunlimit,
};