'use strict';
const mongodber = require('../utils/mongodber');
const diskDB = mongodber.use('disk');
const utils = require('../lib/utils');
const moment = require('moment');
const { ObjectID } = require('mongodb');
const _ = require('lodash');

moment.locale('zh-cn');
/**
 * 生成CDkey
 * @param {数量} num 
 * @param {天} day 
 */
async function postCDkey(num, day,) {
    let returnData = {};
    const array = []
    for (let i=0; i<num; i++) {
        array.push({
            username:'',
            actived: false,
            activedtm: '',
            expiration: day,
            ctm: new Date
        })
    }
    await diskDB.collection('cdkey').insert(array)
    return returnData
}

/**
 * 删除CDkey
 * @param {id} id 
 */
async function deleteCDkey(id) {
    let returnData = {};
    await diskDB.collection('cdkey').deleteOne({_id: ObjectID(id)})
    return returnData
}

/**
 * CDkey列表
 * @param {是否已激活}  actived
 * @param {}  limit
 * @param {}  offset
 */
async function getCDkeyList(actived, limit = 20, offset = 0,) {
    let returnData = {};
    const query = {}
    if(typeof actived !== "undefined") {
        query.actived = actived == 'true'? true: false
    }
    returnData.list = await diskDB.collection('cdkey').find(query).skip(parseInt(offset)).limit(parseInt(limit)).toArray()
    returnData.total = await diskDB.collection('cdkey').countDocuments(query)
    return returnData
}

/**
 * 激活cdkey
 * @param {用户名}  username
 * @param {CDkey}  id
 */
async function activateCDkey(username, id) {
    const user = await diskDB.collection('users').findOne({username})
    const cdkey = await diskDB.collection('cdkey').findOne({_id: ObjectID(id), actived: false})
    if(!user) {
        throw new Error('用户不存在');
    }
    if(!cdkey) {
        throw new Error('CDKEY不存在');
    }
    const expires = new Date((+user.expires) + cdkey.expiration * 1000 * 60  * 60 * 24)
    await diskDB.collection('users').updateOne({username}, {$set: {expires}})
    await diskDB.collection('cdkey').updateOne({_id: ObjectID(id)}, {$set: {username, actived: true, activedtm: new Date}})
    return {}
}
module.exports = {
    postCDkey,
    deleteCDkey,
    getCDkeyList,
    activateCDkey
};