'use strict';
const mongodber = require('../utils/mongodber');
const diskDB = mongodber.use('disk');
const utils = require('../lib/utils');
const moment = require('moment');
const { ObjectID } = require('mongodb');
const redis = require('../utils/rediser');
const _ = require('lodash');
const axios = require('axios');
const config = require('config');
const fs = require('fs');
moment.locale('zh-cn');

/**
 * 获取专属小程序码
 * @param {账号} id 用户id
 */
async function getQrcode(userid) {
    const returnData = {
        url:''
    };
    const user = await diskDB.collection('users').findOne({ _id: ObjectID(userid) });
    if (!user) {
        throw new Error('用户不存在');
    }
    const wechatAccess = await diskDB.collection('wechat_access').findOne({ appid: config.get('WechatApp.AppID') });
    const options = {
            method: 'POST',
            url: config.get('WechatAppAPIs.QRcode')+`?access_token=${wechatAccess.access_token}`,
            data: JSON.stringify({
                scene: userid,
                width: 280
            }),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
            },
            responseType: 'arraybuffer'
        }
    let result = await axios(options) //获得文件上传许可以及各种参数
    const { data } = result;
    fs.writeFileSync(`./static/qrcode/${userid}.png`, data);
    if (!data) {
        throw new Error('小程序码生成失败');
    }
    await diskDB.collection('users').updateOne({ _id: ObjectID(userid) }, {$set:{qrcdoe: `/qrcode/${userid}.png`}}); 
    returnData.url = `/qrcode/${userid}.png`
    return returnData;
}

/**
 * 获取用户下网盘列表
 * @param {账号} id 用户id
 */
async function getDisks(userid) {
    const returnData = {
        disks: []
    };
    const user = await diskDB.collection('users').findOne({ _id: ObjectID(userid) });
    if (!user) {
        throw new Error('用户不存在');
    }
    const disks = await diskDB.collection('disks').find({username: user.username, shared: true}, {projection: {
        remark: 1,
        _id: 1
    }}).toArray();
    returnData.disks = disks
    return returnData;
}

module.exports = {
    getQrcode,
    getDisks,
};
