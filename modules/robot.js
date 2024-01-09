'use strict';
const mongodber = require('../utils/mongodber');
const diskDB = mongodber.use('disk');
const utils = require('../lib/utils');
const moment = require('moment');
const { ObjectID } = require('mongodb');
const _ = require('lodash');

moment.locale('zh-cn');

/**
 * 新增配置
 * @param {配置名称} name 
 * @param {网盘id} disk_id 
 * @param {网盘名称} disk_name 
 * @param {首次回复} first_reply 
 * @param {无匹配回复} nomatch_reply 
 * @param {重复回复} repeat_reply 
 * @param {通知} notice 
 * @param {用户} username 
 */

async function postConfig( name , disk_id, disk_name, first_reply, nomatch_reply, repeat_reply, notice, username ) {
    let returnData = {};
    const insertData = {
        name , disk_id, disk_name, first_reply, nomatch_reply, repeat_reply, notice, username, ctm: new Date, utm: new Date
    }
    await diskDB.collection('robot_config').insertOne(insertData)
    return returnData
}

/**
 * 删除配置
 * @param {id} id 
 */
async function deleteConfig(id) {
    let returnData = {};
    await diskDB.collection('robot_config').deleteOne({_id: ObjectID(id)})
    return returnData
}

/**
 * 配置列表
 * @param {}  limit
 * @param {}  offset
 */
async function getConfigList( limit = 20, offset = 0, username) {
    let returnData = {};
    const query = {
        username
    }
    returnData.list = await diskDB.collection('robot_config').find(query).skip(parseInt(offset)).limit(parseInt(limit)).toArray()
    returnData.total = await diskDB.collection('robot_config').countDocuments(query)
    return returnData
}

/**
 * 修改配置
 * @param {id}  id
 * @param {配置名称} name 
 * @param {网盘id} disk_id 
 * @param {网盘名称} disk_name 
 * @param {首次回复} first_reply 
 * @param {无匹配回复} nomatch_reply 
 * @param {重复回复} repeat_reply 
 * @param {通知} notice 
 * @param {用户名} username 
 */
async function putConfig(_id, name , disk_id, disk_name, first_reply, nomatch_reply, repeat_reply, notice, username ) {
    let returnData = {};
    const updateData = {
        name , disk_id, disk_name, first_reply, nomatch_reply, repeat_reply, notice, utm: new Date
    }
    await diskDB.collection('robot_config').updateOne({_id: ObjectID(_id), username}, {$set: updateData})
    return returnData
}

/**
 * 新增分类
 * @param {分类名称} name 
 * @param {用户} username 
 */

async function postConfig( name, username ) {
    let returnData = {};
    const insertData = {
        name, username, ctm: new Date, utm: new Date
    }
    await diskDB.collection('robot_cdkey_classify').insertOne(insertData)
    return returnData
}

/**
 * 删除分类
 * @param {id} id 
 */
async function deleteCDkeyClassify(id) {
    let returnData = {};
    await diskDB.collection('robot_cdkey_classify').deleteOne({_id: ObjectID(id)})
    return returnData
}

/**
 * 分类列表
 * @param {}  limit
 * @param {}  offset
 */
async function getCDkeyClassifyList( limit = 20, offset = 0, username) {
    let returnData = {};
    const query = {
        username
    }
    returnData.list = await diskDB.collection('robot_cdkey_classify').find(query).skip(parseInt(offset)).limit(parseInt(limit)).toArray()
    returnData.total = await diskDB.collection('robot_cdkey_classify').countDocuments(query)
    return returnData
}

/**
 * 修改分类
 * @param {id}  _id
 * @param {分类名称} name 
 * @param {用户名} username 
 */
async function putCDkeyClassify(_id, name, username ) {
    let returnData = {};
    const updateData = {
        name, utm: new Date
    }
    await diskDB.collection('robot_cdkey_classify').updateOne({_id: ObjectID(_id), username}, {$set: updateData})
    return returnData
}
module.exports = {
    postConfig,
    deleteConfig,
    getConfigList,
    putConfig,
    putCDkeyClassify,
    getCDkeyClassifyList,
    deleteCDkeyClassify
};