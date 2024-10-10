'use strict';
const mongodber = require('../utils/mongodber');
const diskDB = mongodber.use('disk');
const utils = require('../lib/utils');
const moment = require('moment');
const { ObjectID } = require('mongodb');
const _ = require('lodash');
const { v4: uuidv4 } = require('uuid');
const urldecode = require('urldecode');

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
 * 修改配置状态
 * @param {id}  id
 * @param {id}  status
 * @param {用户名} username 
 */
async function putConfigStatus(id, status, username) {
    let returnData = {};
    const updateData = {
       status, utm: new Date
    }
    await diskDB.collection('robot_config').updateOne({_id: ObjectID(id), username}, {$set: updateData})
    return returnData
}
/**
 * 新增分类
 * @param {分类名称} name 
 * @param {用户} username 
 */

async function postCDkeyClassify( name, username ) {
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
    const pipeline = [{
        $match: query
    }, {
        $lookup: {
            from: 'robot_cdkey',
            let: {
              fkey: '$_id',
            },
            pipeline: [
              { $match: { $expr: { $and: [{ $eq: ['$classify_id', '$$fkey'] }] } } },
              {
                $project: {
                  _id: 0,
                  used: 1,
                }
              }
            ],
            as: 'cdkeys'
          }
    },
    {
        $project: {
            _id:1,
            name:1,
            ctm:1,
            nums: {$size: '$cdkeys'},
            used:  { $size: { $filter: { input: "$cdkeys", as: "cdkey", cond: { $eq: ["$$cdkey.used", true] } } } }
        }
    },
    {
        $skip: parseInt(offset)
    }, {
        $limit: parseInt(limit)
    }]
    returnData.list = await diskDB.collection('robot_cdkey_classify').aggregate(pipeline).toArray()
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


/**
 * 生成cdkey
 * @param {分类id} classify_id 
 * @param {数量} nums 
 */

async function postCDkey( classify_id, nums, amount,  key_type, username ) {
    let returnData = {};
    const insertArray = []
    for(let i=0; i<nums; i++) {
        insertArray.push({
            agent_id: username,
            key: uuidv4().replace(/-/g, ''),
            classify_id:  ObjectID(classify_id),
            amount,  
            key_type,
            used: false,
            actived: false,
            ctm: new Date,
    })}
    await diskDB.collection('robot_cdkey').insertMany(insertArray)
    return returnData
}

/**
 * cdkey列表
 * @param {}  limit
 * @param {}  offset
 */
async function getCDkeyList( limit = 20, offset = 0,classify_id, key, used, sessionname, config_id) {
    let returnData = {};
    const query = {
       
    }
    if(classify_id)  query.classify_id = ObjectID(classify_id)
    if(config_id)  query.config_id = config_id
    if(key) query.key = key
    if(sessionname) query.sessionname = {$regex: (urldecode(sessionname).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))}
    if(used === 'true') query.used = true
    if(used === 'false') query.used = false
    const pipeline = [{
        $match: query
    },
    {
        $skip: parseInt(offset)
    }, {
        $limit: parseInt(limit)
    }]
    returnData.list = await diskDB.collection('robot_cdkey').aggregate(pipeline).toArray()
    returnData.total = await diskDB.collection('robot_cdkey').countDocuments(query)
    return returnData
}

/**
 * 删除cdkey
 * @param {id} id 
 */
async function deleteCDkey(id) {
    let returnData = {};
    await diskDB.collection('robot_cdkey').deleteOne({_id: ObjectID(id)})
    return returnData
}

/**
 * 获取机器人规则列表
 * @param {配置id} config_id 
 * @param {} limit 
 * @param {} offset 
 */
async function getRuleList( config_id, limit, offset,) {
    let returnData = {};
    const query = {
        config_id
    }
    const pipeline = [{
        $match: query
    },
    {
        $lookup:{
            from: 'robot_cdkey_classify',
            let: {
              fkey: '$classify_id',
            },
            pipeline: [
              { $match: { $expr: { $and: [{ $eq: ['$_id',  { $toObjectId: "$$fkey" }] }] } } },
              {
                $project: {
                   _id:0,
                  classify_name: '$name',
                }
              }
            ],
            as: 'classify'
        }
    },
    {
        $replaceRoot: { newRoot: { $mergeObjects: ['$$ROOT', { $arrayElemAt: ['$classify', 0] }] } }
    },
    {
        $skip: parseInt(offset)
    }, {
        $limit: parseInt(limit)
    }]
    returnData.list = await diskDB.collection('robot_rule').aggregate(pipeline).toArray()
    returnData.total = await diskDB.collection('robot_rule').countDocuments(query)
    return returnData
}

/**
 * 新增机器人规则
 * @param {规则名称} name 
 * @param {配置id} config_id 
 * @param {分类id} classify_id 
 * @param {回复的文字内容} reply_content 
 * @param {回复的文件} reply_file 
 * @param {加入的群组} groups 
 */
async function postRule(name, config_id, classify_id, reply_content, reply_file, group_ids) {
    let returnData = {};
    const groups = await diskDB.collection('disk_group').find({_id: {$in:group_ids.map(id => {return ObjectID(id)})}}).toArray()
    const insertData = {
        name, config_id, classify_id, reply_content, reply_file, group_ids, groups, ctm: new Date, utm: new Date
    }
    await diskDB.collection('robot_rule').insertOne(insertData)
    return returnData
}

/**
 * 修改机器人规则
 * @param {规则id} id 
 * @param {规则名称} name 
 * @param {配置id} config_id 
 * @param {分类id} classify_id 
 * @param {回复的文字内容} reply_content 
 * @param {回复的文件} reply_file 
 * @param {加入的群组} groups 
 */
async function putRule(id, name, config_id, classify_id, reply_content, reply_file, group_ids) {
    let returnData = {};
    const groups = await diskDB.collection('disk_group').find({_id: {$in:group_ids.map(id => {return ObjectID(id)})}}).toArray()
    const updateData = {
        name, config_id, classify_id, reply_content, reply_file, group_ids, groups, utm: new Date
    };
    await diskDB.collection('robot_rule').updateOne({_id: ObjectID(id)}, {$set: updateData})
    return returnData
}

/**
 * 删除机器人规则
 * @param {规则id} id 
 */
async function deleteRule(id, ) {
    let returnData = {};
    await diskDB.collection('robot_rule').deleteOne({_id: ObjectID(id)})
    return returnData
}


module.exports = {
    postConfig,
    deleteConfig,
    getConfigList,
    putConfig,
    putConfigStatus,
    postCDkeyClassify,
    putCDkeyClassify,
    getCDkeyClassifyList,
    deleteCDkeyClassify,
    postCDkey,
    getCDkeyList,
    deleteCDkey,
    getRuleList,
    postRule,
    putRule,
    deleteRule
};